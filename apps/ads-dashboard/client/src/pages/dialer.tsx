import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Row, Col, Card, List, Button, Input, Tag, Typography, Empty, Space, Drawer, Radio, message, Divider, Spin, Switch } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useTable } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";
import { Phone, PhoneOff, Mic, MicOff, Delete, Calendar, CheckCircle, Mail } from "lucide-react";
import { MobileDialer } from "../components/dialer";
import { EmailComposer } from "../components/dialer/EmailComposer";
import { AudioOutlined, MessageOutlined, MobileOutlined, MailOutlined, HistoryOutlined, ClockCircleOutlined, EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { useDialer } from "../hooks/useDialer";
import { useTranscription } from "../hooks/useTranscription";
import { useSms } from "../hooks/useSms";
import { useEmail } from "../hooks/useEmail";
import { useActivityLog } from "../hooks/useActivityLog";
import { db, type Activity } from "../lib/db";
import { ApexKeypad } from "../components/ApexKeypad";
import { DispositionStrip } from "../components/DispositionStrip";
import { ScheduleModal } from "../components/ScheduleModal";
import { getSettings } from "../lib/settings";
import { VoicemailDropButton } from "../components/VoicemailDropButton";
import { ActivityTimeline } from "../components/ActivityTimeline";
import { CallerIdBadge } from "../components/CallerIdBadge";
import { IncomingCallModal } from "../components/IncomingCallModal";
import { getCalendlyApiUrl } from "../lib/settings";
import { createAppointment } from "../lib/twentyCalendar";
import { useSettings } from "../hooks/useSettings";
import { useProgression, XPFloater, DialerHUD } from "../features/progression";
import { PageHeader } from "../components/ui/PageHeader";
import { recordCall } from "../lib/twentySync";
import { XP_SOURCES } from "../features/progression/config/xp";
import { AutoDispositionToast } from "../components/AutoDispositionToast";
import { inferDisposition, calculateXpAmount, type AutoDispositionResult, type TranscriptionEntry } from "../lib/autoDisposition";
import { logAutoDisposition } from "../lib/progressionDb";
import type { Lead } from "@shared/schema";

const { Title, Text } = Typography;

// Extended Lead interface with PropStream phone fields from Twenty CRM
interface ExtendedLead extends Lead {
  cell1?: string | null;
  cell2?: string | null;
  cell3?: string | null;
  cell4?: string | null;
  landline1?: string | null;
  landline2?: string | null;
  landline3?: string | null;
  landline4?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  tcpaStatus?: string | null;
  cell1_dnc?: boolean | null;
  cell2_dnc?: boolean | null;
  cell3_dnc?: boolean | null;
  cell4_dnc?: boolean | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  email1?: string | null;
  email2?: string | null;
  email3?: string | null;
}

interface TimeSlot {
  id: string;
  datetime: string;
  display: string;
}

const KEYPAD_VISIBILITY_KEY = "ads_dialer_keypad_visible";
const SKIPPED_LEADS_KEY = "ads_dialer_skipped_leads";

export default function DialerPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Skipped leads tracking - persisted to localStorage
  const [skippedLeadIds, setSkippedLeadIds] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    const stored = localStorage.getItem(SKIPPED_LEADS_KEY);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const [showSkippedPanel, setShowSkippedPanel] = useState(false);
  const [showHomeScreen, setShowHomeScreen] = useState(false);
  const [emailComposerOpen, setEmailComposerOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const { settings, updateSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<"transcription" | "sms" | "email" | "recents" | "activity">("transcription");
  const [smsInput, setSmsInput] = useState("");
  const [showDispositionStrip, setShowDispositionStrip] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [keypadVisible, setKeypadVisible] = useState(() => {
    if (typeof window === "undefined") return true;
    const stored = localStorage.getItem(KEYPAD_VISIBILITY_KEY);
    return stored ? stored === "true" : true;
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);
  const [recentCalls, setRecentCalls] = useState<Activity[]>([]);
  const [recentCallsLoading, setRecentCallsLoading] = useState(false);
  const [smsHistory, setSmsHistory] = useState<Record<string, Array<{ id: string; direction: "sent" | "received"; text: string; timestamp: string; status?: string }>>>({});

  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailHistory, setEmailHistory] = useState<Record<string, Array<{ id: string; direction: "sent" | "received"; subject: string; body: string; timestamp: string; status?: string }>>>({});

  // Auto-disposition state
  const [autoDisposition, setAutoDisposition] = useState<AutoDispositionResult | null>(null);
  const [showAutoToast, setShowAutoToast] = useState(false);
  const [capturedDuration, setCapturedDuration] = useState(0);
  const [capturedEntries, setCapturedEntries] = useState<TranscriptionEntry[]>([]);

  // Native call tracking
  const [nativeCallActive, setNativeCallActive] = useState(false);
  const [nativeCallStart, setNativeCallStart] = useState<Date | null>(null);
  const [nativeElapsed, setNativeElapsed] = useState(0);
  const nativeTimerRef = useRef<number | null>(null);

  // Track overridden auto-disposition for accuracy logging
  const overriddenAutoDispositionRef = useRef<AutoDispositionResult | null>(null);

  // Update native call timer every second
  useEffect(() => {
    if (nativeCallActive && nativeCallStart) {
      nativeTimerRef.current = window.setInterval(() => {
        setNativeElapsed(Math.floor((Date.now() - nativeCallStart.getTime()) / 1000));
      }, 1000);
      return () => {
        if (nativeTimerRef.current) {
          clearInterval(nativeTimerRef.current);
          nativeTimerRef.current = null;
        }
      };
    }
  }, [nativeCallActive, nativeCallStart]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(KEYPAD_VISIBILITY_KEY, String(keypadVisible));
    }
  }, [keypadVisible]);

  const { tableProps } = useTable<Lead>({
    resource: "people",
    syncWithLocation: false,
    pagination: {
      pageSize: 500,  // Fetch all leads for dialer queue
    },
  });

  const { mutate: createNote } = useCreate();

  const {
    phoneNumber,
    setPhoneNumber,
    status,
    duration,
    formattedDuration,
    muted,
    error: dialerError,
    configured: dialerConfigured,
    dial,
    hangup,
    toggleMute,
    appendDigit,
    backspaceDigit,
    clearNumber,
    // Inbound call handling
    incomingCall,
    incomingCallerId,
    isInbound,
    acceptIncoming,
    rejectIncoming,
    sendToVoicemail,
  } = useDialer();

  const { entries, clearTranscription, addEntry } = useTranscription(status === "connected");
  const { sending: smsSending, sendSms: sendSmsHook, error: smsError } = useSms(phoneNumber);
  const { logActivity } = useActivityLog();
  const { addXP, recentXpGain, level, xpProgress, xpToNextLevel, currentRank, progression } = useProgression();

  const rawLeads = (tableProps.dataSource || []) as ExtendedLead[];

  // Filter to only show leads with at least one phone number
  // Sort by ICP score (highest first) for best lead prioritization
  // Exclude skipped leads from the main queue
  const hasPhone = useCallback((lead: ExtendedLead) => {
    return !!(
      lead.phone ||
      lead.cell1 ||
      lead.cell2 ||
      lead.cell3 ||
      lead.cell4 ||
      lead.landline1 ||
      lead.landline2 ||
      lead.landline3 ||
      lead.landline4 ||
      lead.phone1 ||
      lead.phone2
    );
  }, []);

  const allCallableLeads = useMemo(() => {
    return rawLeads
      .filter(hasPhone)
      .sort((a, b) => (b.icpScore || 0) - (a.icpScore || 0));
  }, [rawLeads, hasPhone]);

  // Active leads (excluding skipped)
  const leads = useMemo(() => {
    return allCallableLeads.filter(lead => !skippedLeadIds.has(lead.id));
  }, [allCallableLeads, skippedLeadIds]);

  // Skipped leads for the retrieval panel
  const skippedLeads = useMemo(() => {
    return allCallableLeads.filter(lead => skippedLeadIds.has(lead.id));
  }, [allCallableLeads, skippedLeadIds]);

  // Persist skipped leads to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SKIPPED_LEADS_KEY, JSON.stringify(Array.from(skippedLeadIds)));
    }
  }, [skippedLeadIds]);

  // Skip a lead
  const handleSkipLead = useCallback((leadId: string) => {
    setSkippedLeadIds(prev => new Set([...Array.from(prev), leadId]));
  }, []);

  // Restore a lead from skipped pile
  const handleRestoreLead = useCallback((leadId: string) => {
    setSkippedLeadIds(prev => {
      const next = new Set(prev);
      next.delete(leadId);
      return next;
    });
    setShowSkippedPanel(false);
  }, []);

  // Clear all skipped leads
  const handleClearSkipped = useCallback(() => {
    setSkippedLeadIds(new Set());
    setShowSkippedPanel(false);
  }, []);

  const selectedLead = useMemo(() => {
    return leads.find((l) => l.id === selectedLeadId) || null;
  }, [leads, selectedLeadId]);

  const leadMap = useMemo(() => {
    return new Map(leads.map((lead) => [lead.id, lead]));
  }, [leads]);

  // Match incoming caller ID to a lead
  const incomingLeadMatch = useMemo(() => {
    if (!incomingCallerId || !leads.length) return null;
    // Normalize phone numbers for comparison
    const normalizedIncoming = incomingCallerId.replace(/\D/g, "").slice(-10);
    return leads.find((lead) => {
      if (!lead.phone) return false;
      const normalizedLead = lead.phone.replace(/\D/g, "").slice(-10);
      return normalizedLead === normalizedIncoming;
    }) || null;
  }, [incomingCallerId, leads]);

  const selectedEmail = selectedLead?.email || "";
  const { sending: emailSending, sendEmail: sendEmailHook, error: emailError } = useEmail(selectedEmail);

  const smsMessages = useMemo(() => {
    if (!phoneNumber) return [];
    return smsHistory[phoneNumber] || [];
  }, [phoneNumber, smsHistory]);

  const emailMessages = useMemo(() => {
    if (!selectedLead?.email) return [];
    return emailHistory[selectedLead.email] || [];
  }, [selectedLead?.email, emailHistory]);

  useEffect(() => {
    let active = true;
    setRecentCallsLoading(true);
    db.activities
      .where("type")
      .equals("call")
      .toArray()
      .then((calls) => {
        if (!active) return;
        const sorted = [...calls].sort((a, b) => {
          const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(a.createdAt).getTime();
          const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(b.createdAt).getTime();
          return bTime - aTime;
        });
        setRecentCalls(sorted.slice(0, 25));
      })
      .finally(() => {
        if (active) {
          setRecentCallsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [activityRefreshKey]);

  const dialNative = useCallback((number?: string) => {
    const targetNumber = number || phoneNumber;
    if (!targetNumber) return;

    // Start native call timer
    setNativeCallActive(true);
    setNativeCallStart(new Date());

    // Open phone app
    window.open(`tel:${targetNumber}`, "_self");
  }, [phoneNumber]);

  const handleDial = () => {
    if (settings.useNativePhone) {
      dialNative();
    } else {
      dial();
    }
  };

  const handleSendSms = async () => {
    if (!smsInput.trim() || !phoneNumber) return;

    const newMsg = {
      id: crypto.randomUUID(),
      direction: "sent" as const,
      text: smsInput,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setSmsHistory(prev => ({
      ...prev,
      [phoneNumber]: [...(prev[phoneNumber] || []), newMsg],
    }));

    const msgText = smsInput;
    setSmsInput("");

    try {
      await sendSmsHook(msgText);
      setSmsHistory(prev => ({
        ...prev,
        [phoneNumber]: prev[phoneNumber].map(m => m.id === newMsg.id ? { ...m, status: "sent" } : m),
      }));
      message.success("SMS sent");
      await addXP({ eventType: 'sms_sent', details: `SMS to ${phoneNumber}` });
    } catch {
      setSmsHistory(prev => ({
        ...prev,
        [phoneNumber]: prev[phoneNumber].map(m => m.id === newMsg.id ? { ...m, status: "failed" } : m),
      }));
      message.error(smsError || "Failed to send SMS");
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim() || !selectedLead?.email) {
      message.error("Subject, body, and recipient email required");
      return;
    }

    const newEmail = {
      id: crypto.randomUUID(),
      direction: "sent" as const,
      subject: emailSubject,
      body: emailBody,
      timestamp: new Date().toISOString(),
      status: "sending",
    };

    setEmailHistory(prev => ({
      ...prev,
      [selectedLead.email!]: [...(prev[selectedLead.email!] || []), newEmail],
    }));

    const subj = emailSubject;
    const body = emailBody;
    setEmailSubject("");
    setEmailBody("");

    try {
      await sendEmailHook(subj, body);
      setEmailHistory(prev => ({
        ...prev,
        [selectedLead.email!]: prev[selectedLead.email!].map(e => e.id === newEmail.id ? { ...e, status: "sent" } : e),
      }));
      message.success("Email sent");
      await addXP({ eventType: 'email_sent', details: `Email to ${selectedLead.email}` });
    } catch {
      setEmailHistory(prev => ({
        ...prev,
        [selectedLead.email!]: prev[selectedLead.email!].map(e => e.id === newEmail.id ? { ...e, status: "failed" } : e),
      }));
      message.error(emailError || "Failed to send email");
    }
  };

  const handleSelectLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    const idx = leads.findIndex(l => l.id === lead.id);
    if (idx >= 0) {
      setCurrentIndex(idx);
    }
    if (lead.phone) {
      setPhoneNumber(lead.phone);
    }
  };

  const formatSeconds = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRecentRedial = useCallback((activity: Activity) => {
    if (status !== "idle") return;
    const lead = leadMap.get(activity.leadId);
    if (!lead?.phone) return;

    handleSelectLead(lead);
    setPhoneNumber(lead.phone);

    if (settings.useNativePhone) {
      dialNative(lead.phone);
      return;
    }

    window.setTimeout(() => {
      handleDial();
    }, 0);
  }, [dialNative, handleDial, handleSelectLead, leadMap, setPhoneNumber, settings.useNativePhone, status]);

  const handleHangup = () => {
    // Capture data before hangup resets it
    const finalDuration = duration;
    // Filter out system messages (like "[Call in progress...]") from real transcription
    const finalEntries: TranscriptionEntry[] = entries
      .filter(e => e.speaker !== 'system')
      .map(e => ({
        id: e.id,
        speaker: e.speaker as 'rep' | 'customer' | 'system',
        text: e.text,
      }));
    setCapturedDuration(finalDuration);
    setCapturedEntries(finalEntries);

    console.log('[Auto-Disposition] handleHangup called', {
      finalDuration,
      rawEntriesCount: entries.length,
      filteredEntriesCount: finalEntries.length,
      useNativePhone: settings.useNativePhone,
      status,
    });

    // End the call
    hangup();

    // Skip auto-disposition for native mode (handled separately via handleNativeCallEnd)
    if (settings.useNativePhone) {
      console.log('[Auto-Disposition] Native mode - showing manual disposition strip');
      setShowDispositionStrip(true);
      return;
    }

    // Infer disposition from duration + transcription
    const result = inferDisposition(finalDuration, finalEntries);
    console.log('[Auto-Disposition] Inferred result:', result);
    setAutoDisposition(result);
    setShowAutoToast(true);
    console.log('[Auto-Disposition] Toast should appear now');
  };

  const handleSkipDisposition = () => {
    clearTranscription();
    setShowDispositionStrip(false);
    // Advance to next lead without logging
    if (autoAdvance && currentIndex < leads.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextLead = leads[nextIndex];
      setSelectedLeadId(nextLead.id);
      if (nextLead.phone) {
        setPhoneNumber(nextLead.phone);
      }
    }
  };

  const handleDisposition = async (disposition: string, notes: string) => {
    if (selectedLead) {
      // Log overridden auto-disposition for accuracy tracking
      if (overriddenAutoDispositionRef.current) {
        await logAutoDisposition({
          leadId: selectedLead.id,
          autoDisposition: overriddenAutoDispositionRef.current.disposition,
          finalDisposition: disposition,
          wasOverridden: true,
          confidence: overriddenAutoDispositionRef.current.confidence,
          duration: capturedDuration,
          reason: overriddenAutoDispositionRef.current.reason,
          timestamp: new Date(),
        });
        overriddenAutoDispositionRef.current = null;
      }

      await logActivity({
        leadId: selectedLead.id,
        type: 'call',
        direction: 'outbound',
        content: notes,
        metadata: {
          duration,
          disposition,
          transcription: entries.map(e => `[${e.speaker}]: ${e.text}`).join('\n'),
        },
      });
      setActivityRefreshKey(prev => prev + 1);

      // Map disposition to XP event type
      const xpMap: Record<string, string> = {
        contact: 'call_connected',
        callback: 'callback_scheduled',
        voicemail: 'voicemail_left',
        no_answer: 'dial_made',
        not_interested: 'dial_made',
        wrong_number: 'dial_made',
        dnc: 'dial_made',
      };
      const xpEventType = xpMap[disposition] || 'dial_made';

      // Calculate XP amount (with 2+ minute bonus)
      let xpAmount = XP_SOURCES[xpEventType]?.base || 2;
      if (duration >= 120) {
        xpAmount += XP_SOURCES.two_plus_minute_call?.base || 15;
      }

      // 1. Record to Twenty (persistence layer - source of truth)
      try {
        await recordCall({
          name: `Call to ${selectedLead.name || 'lead'}`,
          duration,
          disposition,
          xpAwarded: xpAmount,
          leadId: selectedLead.id,
        });
      } catch (err) {
        console.error('Failed to record call to Twenty:', err);
        // Continue anyway - local progression still works
      }

      // 2. Update local progression (instant UI feedback)
      await addXP({ eventType: xpEventType, details: `Call to ${selectedLead.name || 'lead'}` });

      // Add 2+ minute bonus XP separately for UI visibility
      if (duration >= 120) {
        await addXP({ eventType: 'two_plus_minute_call', details: '2+ minute call bonus' });
      }
    }

    clearTranscription();
    setShowDispositionStrip(false);

    if (autoAdvance && currentIndex < leads.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextLead = leads[nextIndex];
      setSelectedLeadId(nextLead.id);
      if (nextLead.phone) {
        setPhoneNumber(nextLead.phone);
      }
    }
  };

  // Auto-disposition confirm handler - called after 3 second countdown
  const confirmAutoDisposition = useCallback(async () => {
    console.log('[Auto-Disposition] confirmAutoDisposition called', {
      hasAutoDisposition: !!autoDisposition,
      hasSelectedLead: !!selectedLead,
      capturedDuration,
    });

    if (!autoDisposition || !selectedLead) {
      console.log('[Auto-Disposition] Missing data, hiding toast');
      setShowAutoToast(false);
      return;
    }

    setShowAutoToast(false);

    const xpAmount = calculateXpAmount(autoDisposition.xpEventType, capturedDuration);
    console.log('[Auto-Disposition] XP amount calculated:', xpAmount);

    // Log auto-disposition for accuracy tracking
    await logAutoDisposition({
      leadId: selectedLead.id,
      autoDisposition: autoDisposition.disposition,
      finalDisposition: autoDisposition.disposition,
      wasOverridden: false,
      confidence: autoDisposition.confidence,
      duration: capturedDuration,
      reason: autoDisposition.reason,
      timestamp: new Date(),
    });

    // Log activity
    await logActivity({
      leadId: selectedLead.id,
      type: 'call',
      direction: 'outbound',
      content: `Auto: ${autoDisposition.disposition} (${autoDisposition.confidence})`,
      metadata: {
        duration: capturedDuration,
        disposition: autoDisposition.disposition,
        autoDetected: true,
        confidence: autoDisposition.confidence,
        reason: autoDisposition.reason,
        transcription: capturedEntries.map(e => `[${e.speaker}]: ${e.text}`).join('\n'),
      },
    });
    setActivityRefreshKey(prev => prev + 1);

    // Record to Twenty
    try {
      await recordCall({
        name: `Call to ${selectedLead.name || 'lead'}`,
        duration: capturedDuration,
        disposition: autoDisposition.disposition,
        xpAwarded: xpAmount,
        leadId: selectedLead.id,
      });
    } catch (err) {
      console.error('Failed to record call to Twenty:', err);
    }

    // Award XP
    await addXP({
      eventType: autoDisposition.xpEventType,
      details: `Call to ${selectedLead.name || 'lead'}`
    });
    console.log('[Auto-Disposition] XP awarded:', autoDisposition.xpEventType);

    // 2+ minute bonus
    if (capturedDuration >= 120) {
      await addXP({
        eventType: 'two_plus_minute_call',
        details: '2+ minute call bonus'
      });
      console.log('[Auto-Disposition] 2+ minute bonus XP awarded');
    }

    console.log('[Auto-Disposition] Call processing complete, advancing to next lead');

    // Clear state
    clearTranscription();
    setAutoDisposition(null);
    setCapturedDuration(0);
    setCapturedEntries([]);

    // Advance to next lead
    if (autoAdvance && currentIndex < leads.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextLead = leads[nextIndex];
      setSelectedLeadId(nextLead.id);
      if (nextLead.phone) setPhoneNumber(nextLead.phone);
    }
  }, [autoDisposition, selectedLead, capturedDuration, capturedEntries, autoAdvance, currentIndex, leads, logActivity, addXP, clearTranscription, setPhoneNumber]);

  // Override handler - cancel auto-disposition and show manual strip
  const handleOverrideAutoDisposition = useCallback(() => {
    // Store the auto-disposition for accuracy tracking when user selects manual disposition
    overriddenAutoDispositionRef.current = autoDisposition;
    setShowAutoToast(false);
    setShowDispositionStrip(true);
  }, [autoDisposition]);

  // Native call end handler
  const handleNativeCallEnd = useCallback(() => {
    if (!nativeCallStart) return;

    const nativeDuration = Math.floor((Date.now() - nativeCallStart.getTime()) / 1000);
    setCapturedDuration(nativeDuration);
    setCapturedEntries([]); // No transcription for native

    setNativeCallActive(false);
    setNativeCallStart(null);
    setNativeElapsed(0);
    if (nativeTimerRef.current) {
      clearInterval(nativeTimerRef.current);
      nativeTimerRef.current = null;
    }

    // Infer from duration only (no transcription)
    const result = inferDisposition(nativeDuration, []);
    setAutoDisposition(result);
    setShowAutoToast(true);
  }, [nativeCallStart]);

  // Handle accepting an incoming call
  const handleAcceptIncoming = useCallback(() => {
    // Auto-select matched lead if found
    if (incomingLeadMatch) {
      handleSelectLead(incomingLeadMatch);
    } else if (incomingCallerId) {
      // Set phone number even if no lead matched
      setPhoneNumber(incomingCallerId);
    }

    // Accept the call via Twilio
    acceptIncoming();

    console.log("[Dialer] Accepted incoming call", {
      callerId: incomingCallerId,
      matchedLead: incomingLeadMatch?.name || "none",
    });
  }, [incomingLeadMatch, incomingCallerId, acceptIncoming, setPhoneNumber]);

  // Handle rejecting an incoming call
  const handleRejectIncoming = useCallback(async () => {
    // Log the rejected call
    if (incomingLeadMatch) {
      await logActivity({
        leadId: incomingLeadMatch.id,
        type: "call",
        direction: "inbound",
        content: "Rejected incoming call",
        metadata: {
          duration: 0,
          disposition: "rejected",
        },
      });
      setActivityRefreshKey((prev) => prev + 1);
    }

    rejectIncoming();
    console.log("[Dialer] Rejected incoming call");
  }, [incomingLeadMatch, rejectIncoming, logActivity]);

  // Handle sending to voicemail
  const handleSendToVoicemail = useCallback(async () => {
    // Log the voicemail
    if (incomingLeadMatch) {
      await logActivity({
        leadId: incomingLeadMatch.id,
        type: "call",
        direction: "inbound",
        content: "Sent to voicemail",
        metadata: {
          duration: 0,
          disposition: "voicemail",
        },
      });
      setActivityRefreshKey((prev) => prev + 1);
    }

    sendToVoicemail();
    console.log("[Dialer] Sent incoming call to voicemail");
  }, [incomingLeadMatch, sendToVoicemail, logActivity]);

  const handleScheduleAppointment = async (appointment: any) => {
    try {
      const currentSettings = getSettings();
      
      if (currentSettings.twentyApiKey) {
        await createAppointment({
          leadId: appointment.leadId,
          leadName: appointment.leadName,
          date: appointment.date,
          time: appointment.time,
          durationMinutes: 60,
          type: appointment.type,
          notes: appointment.notes,
        });
      }

      await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: appointment.leadId,
          type: 'appointment_scheduled',
          direction: 'outbound',
          content: `Scheduled ${appointment.type.replace('_', ' ')} for ${appointment.date} at ${appointment.time}`,
          metadata: appointment,
        }),
      });

      await addXP({ eventType: 'appointment', details: `Scheduled with ${appointment.leadName}` });
      message.success('Appointment scheduled!');
      setActivityRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Failed to schedule appointment:', error);
      message.error('Failed to schedule appointment');
    }
  };

  const handleScheduledCallback = () => {
    setScheduleModalOpen(false);
    setActivityRefreshKey(prev => prev + 1);
    addXP({ eventType: 'appointment', details: `Scheduled appointment` });
  };

  const fetchCalendlySlots = async () => {
    if (!settings.calendlyApiKey || !settings.calendlyEventTypeUri) {
      setSlotsError("Calendly not configured. Go to Settings to add API key and Event Type URI.");
      setAvailableSlots([]);
      return;
    }

    setLoadingSlots(true);
    setSlotsError(null);

    try {
      const now = new Date();
      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await fetch(
        `${getCalendlyApiUrl()}/event_type_available_times?event_type=${encodeURIComponent(settings.calendlyEventTypeUri)}&start_time=${now.toISOString()}&end_time=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${settings.calendlyApiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Calendly API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.collection || data.collection.length === 0) {
        setSlotsError("No available time slots found for the next 7 days.");
        setAvailableSlots([]);
        return;
      }

      const slots: TimeSlot[] = data.collection.slice(0, 8).map((slot: any, index: number) => ({
        id: String(index + 1),
        datetime: slot.start_time,
        display: new Date(slot.start_time).toLocaleString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        }),
      }));

      setAvailableSlots(slots);
    } catch (e) {
      console.error("Calendly fetch failed:", e);
      setSlotsError(e instanceof Error ? e.message : "Failed to fetch Calendly slots");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBooking = () => {
    setSelectedSlot(null);
    setBookingConfirmed(false);
    setSlotsError(null);
    setBookingOpen(true);
  };

  const handleBook = async () => {
    if (!selectedSlot || !selectedLead) return;

    setBooking(true);

    const slot = availableSlots.find((s) => s.id === selectedSlot);
    const leadName = selectedLead.name || "Unknown";

    try {
      createNote({
        resource: "notes",
        values: {
          title: `Appointment booked: ${slot?.display}`,
          body: `Scheduled consultation for ${leadName} on ${slot?.display}`,
        },
      });

      message.success(`Booked ${slot?.display} for ${selectedLead.name || 'lead'}`);

      if (addEntry) {
        addEntry({
          id: crypto.randomUUID(),
          speaker: "rep",
          text: `[SYSTEM] Appointment booked: ${slot?.display}`,
        });
      }

      setBookingConfirmed(true);
      setTimeout(() => setBookingOpen(false), 1500);
    } catch (err) {
      console.error("Failed to create booking note:", err);
      message.error("Booking noted but failed to save to CRM");
    } finally {
      setBooking(false);
    }
  };

  // Mobile handler wrappers
  const handleMobileSms = useCallback(async (message: string) => {
    if (!phoneNumber) return;
    try {
      await sendSmsHook(message);
      await addXP({ eventType: 'sms_sent', details: `SMS to ${phoneNumber}` });
    } catch (err) {
      console.error('Failed to send SMS:', err);
    }
  }, [phoneNumber, sendSmsHook, addXP]);

  const handleMobileDisposition = useCallback(async (disposition: string, notes: string) => {
    await handleDisposition(disposition, notes);
  }, [handleDisposition]);

  const handleMobileLeadSelect = useCallback((leadId: string) => {
    const lead = leadMap.get(leadId);
    if (lead) {
      handleSelectLead(lead);
    }
  }, [leadMap, handleSelectLead]);

  // Phone-style dialer UI
  return (
    <>
      <XPFloater recentXpGain={recentXpGain} />
      <AutoDispositionToast
        visible={showAutoToast}
        result={autoDisposition}
        xpAmount={autoDisposition ? calculateXpAmount(autoDisposition.xpEventType, capturedDuration) : 0}
        duration={`${Math.floor(capturedDuration / 60)}:${(capturedDuration % 60).toString().padStart(2, '0')}`}
        onOverride={handleOverrideAutoDisposition}
        onConfirm={confirmAutoDisposition}
      />
      <IncomingCallModal
        visible={!!incomingCall}
        callerNumber={incomingCallerId}
        callerName={incomingLeadMatch?.name}
        leadId={incomingLeadMatch?.id}
        onAccept={handleAcceptIncoming}
        onReject={handleRejectIncoming}
        onSendToVoicemail={handleSendToVoicemail}
      />
      <MobileDialer
        leads={leads.map(l => ({
          id: l.id,
          name: l.name || undefined,
          phone: l.phone || undefined,
          email: l.email || undefined,
          company: l.company || undefined,
          address: l.street || l.address || undefined,
          city: l.city || undefined,
          state: l.state || undefined,
          // PropStream phone fields
          cell1: l.cell1 || undefined,
          cell2: l.cell2 || undefined,
          cell3: l.cell3 || undefined,
          cell4: l.cell4 || undefined,
          landline1: l.landline1 || undefined,
          landline2: l.landline2 || undefined,
          landline3: l.landline3 || undefined,
          landline4: l.landline4 || undefined,
          phone1: l.phone1 || undefined,
          phone2: l.phone2 || undefined,
          // Additional fields
          icpScore: l.icpScore,
          tcpaStatus: l.tcpaStatus || undefined,
          email1: l.email1 || undefined,
          email2: l.email2 || undefined,
          email3: l.email3 || undefined,
        }))}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
        status={status}
        formattedDuration={formattedDuration}
        muted={muted}
        rankTitle={currentRank?.name || 'SDR I'}
        level={level}
        currentXP={xpProgress}
        xpToNextLevel={xpToNextLevel}
        streak={progression?.streakDays || 0}
        callsToday={recentCalls.filter(c => {
          const today = new Date();
          const callDate = c.createdAt instanceof Date ? c.createdAt : new Date(c.createdAt);
          return callDate.toDateString() === today.toDateString();
        }).length}
        isNativeMode={settings.useNativePhone || false}
        onToggleNativeMode={() => {
          const newValue = !settings.useNativePhone;
          updateSettings({ useNativePhone: newValue });
          message.info(newValue ? 'Switched to Device Phone' : 'Switched to Twilio Browser');
        }}
        onDial={handleDial}
        onHangup={handleHangup}
        onMute={toggleMute}
        onSendSms={handleMobileSms}
        onDisposition={handleMobileDisposition}
        onSkipDisposition={handleSkipDisposition}
        onLeadSelect={handleMobileLeadSelect}
        onDialPhone={(phoneNumber) => {
          setPhoneNumber(phoneNumber);
          if (settings.useNativePhone) {
            dialNative(phoneNumber);
          } else {
            dial();
          }
        }}
        onSmsPhone={(phoneNumber) => {
          setPhoneNumber(phoneNumber);
          // SMS panel will open via MobileDialer's internal handling
        }}
        onEmailLead={(email) => {
          setEmailRecipient(email);
          setEmailComposerOpen(true);
        }}
        showDisposition={showDispositionStrip}
        dispositionXp={autoDisposition ? calculateXpAmount(autoDisposition.xpEventType, capturedDuration) : undefined}
        smsSending={smsSending}
        callerIdNumber={settings.smsPhoneNumber}
        skippedLeads={skippedLeads.map(l => ({
          id: l.id,
          name: l.name || undefined,
          phone: l.phone || undefined,
          cell1: l.cell1 || undefined,
        }))}
        showSkippedPanel={showSkippedPanel}
        onShowSkippedPanel={setShowSkippedPanel}
        onSkipLead={handleSkipLead}
        onRestoreLead={handleRestoreLead}
        onClearSkipped={handleClearSkipped}
        showHomeScreen={showHomeScreen}
        onToggleHomeScreen={setShowHomeScreen}
        recentLeads={leads.slice(0, 5).map(l => ({
          id: l.id,
          name: l.name || 'Unknown',
          phone: l.phone || l.cell1 || undefined,
          icpScore: l.icpScore,
        }))}
        // Manual dial props
        manualPhoneNumber={phoneNumber}
        onManualPhoneNumberChange={setPhoneNumber}
        onManualDial={() => {
          if (settings.useNativePhone) {
            dialNative(phoneNumber);
          } else {
            dial();
          }
        }}
      />
      <ScheduleModal
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        lead={selectedLead ? {
          id: selectedLead.id,
          name: selectedLead.name || 'Unknown',
          email: selectedLead.email || undefined,
          phone: selectedLead.phone || undefined,
        } : null}
        onScheduled={handleScheduledCallback}
      />
      {/* Email Composer Modal */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: emailComposerOpen ? 'auto' : 'none', zIndex: 1000 }}>
        <EmailComposer
          visible={emailComposerOpen}
          onClose={() => setEmailComposerOpen(false)}
          recipientEmail={emailRecipient}
          recipientName={selectedLead?.name || undefined}
        />
      </div>
    </>
  );
}
