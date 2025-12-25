import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Row, Col, Card, List, Button, Input, Tag, Typography, Empty, Space, Drawer, Radio, message, Divider, Spin, Switch } from "antd";
import { motion, AnimatePresence } from "framer-motion";
import { useTable } from "@refinedev/antd";
import { useCreate } from "@refinedev/core";
import { Phone, PhoneOff, Mic, MicOff, Delete, Calendar, CheckCircle, Mail } from "lucide-react";
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

interface TimeSlot {
  id: string;
  datetime: string;
  display: string;
}

const KEYPAD_VISIBILITY_KEY = "ads_dialer_keypad_visible";

export default function DialerPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
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
  const { addXP, recentXpGain } = useProgression();

  const leads = (tableProps.dataSource || []) as Lead[];
  
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

  return (
    <div style={{ padding: 24, height: "100%", overflow: "auto" }}>
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
      <PageHeader
        title="Power Dialer"
        subtitle={isInbound ? "Inbound call in progress" : "Outbound calling operations center"}
      />

      <DialerHUD />

      <Row gutter={24}>
        <Col span={8}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card
              title={
                <span style={{ 
                  fontFamily: "var(--font-mono)", 
                  fontSize: 12, 
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)"
                }}>
                  Lead Queue
                </span>
              }
              style={{ 
                height: "calc(100vh - 180px)",
                background: "#050505",
                border: "0.5px solid rgba(0, 255, 255, 0.15)",
              }}
              styles={{ body: { padding: 0, overflow: "auto", maxHeight: "calc(100vh - 240px)" } }}
            >
            <List
              loading={tableProps.loading}
              dataSource={leads}
              renderItem={(lead) => {
                const fullName = lead.name || "Unknown";
                const isSelected = lead.id === selectedLeadId;

                return (
                  <List.Item
                    onClick={() => handleSelectLead(lead)}
                    style={{
                      cursor: "pointer",
                      padding: "12px 16px",
                      backgroundColor: isSelected ? "rgba(0, 255, 255, 0.08)" : undefined,
                      borderLeft: isSelected ? "3px solid #00ffff" : "3px solid transparent",
                      transition: "all 0.2s ease",
                    }}
                    data-testid={`list-item-lead-${lead.id}`}
                  >
                    <List.Item.Meta
                      title={<Text strong>{fullName}</Text>}
                      description={
                        <Space direction="vertical" size={0}>
                          {lead.phone && <Text type="secondary">{lead.phone}</Text>}
                          {lead.email && <Text type="secondary">{lead.email}</Text>}
                          {lead.company && <Text type="secondary">{lead.company}</Text>}
                        </Space>
                      }
                    />
                  </List.Item>
                );
              }}
              locale={{ emptyText: <Empty description="No leads available. Check Twenty CRM connection in Settings." /> }}
            />
            </Card>
          </motion.div>
        </Col>

        <Col span={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card
              title={
                <span style={{ 
                  fontFamily: "var(--font-mono)", 
                  fontSize: 12, 
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.7)"
                }}>
                  Dialer
                </span>
              }
              extra={
                <Button
                  type="text"
                  icon={<Calendar size={18} />}
                  onClick={() => setScheduleModalOpen(true)}
                  style={{ color: "#00ffff" }}
                  title="Quick Schedule"
                />
              }
              className={status === "connecting" ? "breathing-glow-red" : status === "connected" ? "breathing-glow-green" : ""}
              style={{ 
                minHeight: "calc(100vh - 180px)",
                maxHeight: "calc(100vh - 180px)",
                background: "#050505",
                border: status === "connecting" 
                  ? "0.5px solid rgba(255, 100, 100, 0.5)" 
                  : status === "connected"
                    ? "0.5px solid rgba(16, 185, 129, 0.5)"
                    : "0.5px solid rgba(0, 255, 255, 0.2)",
              }}
              styles={{ body: { display: "flex", flexDirection: "column", alignItems: "center", gap: 24, paddingTop: 32, overflowY: "auto" } }}
            >
            <div style={{ width: "100%", position: "relative" }}>
              <Input
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter phone ..."
                size="large"
                style={{ 
                  fontSize: 22, 
                  textAlign: "center", 
                  letterSpacing: 3,
                  fontFamily: "var(--font-mono)",
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(0, 255, 255, 0.2)",
                  borderRadius: 12,
                  padding: "12px 16px",
                }}
                disabled={status !== "idle"}
                data-testid="input-phone-number"
              />
              {phoneNumber && status === "idle" && (
                <Button
                  type="text"
                  size="small"
                  onClick={backspaceDigit}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }}
                  data-testid="button-backspace"
                >
                  <Delete size={18} />
                </Button>
              )}
            </div>

            {status === "connected" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 20px",
                  background: "rgba(0, 255, 136, 0.1)",
                  border: "1px solid rgba(0, 255, 136, 0.3)",
                  borderRadius: 20,
                }}
                data-testid="tag-call-duration"
              >
                <motion.div
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#00ff88",
                    boxShadow: "0 0 10px #00ff88",
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 18, color: "#00ff88", fontWeight: 600 }}>
                  {formattedDuration}
                </span>
              </motion.div>
            )}

            {status === "connecting" && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 16px",
                  background: "rgba(0, 150, 255, 0.1)",
                  border: "1px solid rgba(0, 150, 255, 0.3)",
                  borderRadius: 16,
                }}
                data-testid="tag-connecting"
              >
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#0096ff",
                    boxShadow: "0 0 8px #0096ff",
                  }}
                />
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#0096ff", letterSpacing: "0.1em" }}>
                  CONNECTING
                </span>
              </motion.div>
            )}

            {/* Dialer configuration error */}
            {dialerError && !settings.useNativePhone && (
              <div style={{
                padding: "12px 16px",
                background: "rgba(255, 77, 79, 0.1)",
                border: "1px solid rgba(255, 77, 79, 0.3)",
                borderRadius: 8,
                marginBottom: 12,
                width: "100%",
              }}>
                <Text type="danger" style={{ fontSize: 12 }}>{dialerError}</Text>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <MobileOutlined />
              <Switch
                size="small"
                checked={settings.useNativePhone}
                onChange={(checked) => updateSettings({ useNativePhone: checked })}
                data-testid="switch-native-dial"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                {settings.useNativePhone ? "Using my phone (calls + SMS + email)" : dialerConfigured ? "Using Twilio" : "Twilio (not configured)"}
              </Text>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
              <Switch
                size="small"
                checked={autoAdvance}
                onChange={setAutoAdvance}
                data-testid="switch-auto-advance"
              />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Auto-advance to next lead
              </Text>
            </div>

            <CallerIdBadge
              smsPhoneNumber={settings.smsPhoneNumber}
              useNativePhone={settings.useNativePhone}
            />

            <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
              <Button
                type="text"
                icon={keypadVisible ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setKeypadVisible((prev) => !prev)}
                data-testid="button-toggle-keypad"
              >
                {keypadVisible ? "Hide Keypad" : "Show Keypad"}
              </Button>
            </div>

            {keypadVisible && (
              <ApexKeypad onPress={appendDigit} disabled={status !== "idle" || nativeCallActive} />
            )}

            {/* Native Call Active UI */}
            {nativeCallActive && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  width: '100%',
                  padding: 16,
                  marginTop: 16,
                  background: 'rgba(0, 255, 136, 0.1)',
                  border: '1px solid rgba(0, 255, 136, 0.3)',
                  borderRadius: 12,
                  textAlign: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#00ff88',
                      boxShadow: '0 0 10px #00ff88',
                    }}
                  />
                  <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#00ff88', letterSpacing: '0.05em' }}>
                    NATIVE CALL ACTIVE
                  </Text>
                </div>
                <Text style={{ fontFamily: 'var(--font-mono)', fontSize: 24, color: '#00ff88', display: 'block', marginBottom: 12 }}>
                  {`${Math.floor(nativeElapsed / 60).toString().padStart(2, '0')}:${(nativeElapsed % 60).toString().padStart(2, '0')}`}
                </Text>
                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 12 }}>
                  Tap "End Call" when done to log this call
                </Text>
                <Button
                  type="primary"
                  danger
                  onClick={handleNativeCallEnd}
                  style={{ minWidth: 120 }}
                >
                  <PhoneOff size={16} style={{ marginRight: 8 }} />
                  End Call
                </Button>
              </motion.div>
            )}

            <Space size="large" style={{ marginTop: 16 }}>
              {status === "idle" && !nativeCallActive ? (
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    type="primary"
                    shape="circle"
                    size="large"
                    onClick={handleDial}
                    disabled={!phoneNumber}
                    style={{
                      width: 72,
                      height: 72,
                      backgroundColor: phoneNumber ? "#00ff88" : undefined,
                      borderColor: phoneNumber ? "#00ff88" : undefined,
                      boxShadow: phoneNumber ? "0 0 30px rgba(0, 255, 136, 0.5), 0 0 60px rgba(0, 255, 136, 0.2)" : undefined,
                      color: phoneNumber ? "#050505" : undefined,
                    }}
                    data-testid="button-dial"
                  >
                    <Phone size={28} />
                  </Button>
                </motion.div>
              ) : (
                <>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      type="default"
                      shape="circle"
                      size="large"
                      onClick={toggleMute}
                      style={{ 
                        width: 64, 
                        height: 64,
                        background: muted ? "rgba(255, 100, 100, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: muted ? "1px solid rgba(255, 100, 100, 0.4)" : "1px solid rgba(255, 255, 255, 0.1)",
                      }}
                      data-testid="button-mute"
                    >
                      {muted ? <MicOff size={24} /> : <Mic size={24} />}
                    </Button>
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      boxShadow: [
                        "0 0 20px rgba(255, 77, 79, 0.3)",
                        "0 0 40px rgba(255, 77, 79, 0.5)",
                        "0 0 20px rgba(255, 77, 79, 0.3)",
                      ],
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ borderRadius: "50%" }}
                  >
                    <Button
                      type="primary"
                      danger
                      shape="circle"
                      size="large"
                      onClick={handleHangup}
                      style={{ 
                        width: 72, 
                        height: 72,
                        boxShadow: "0 0 30px rgba(255, 77, 79, 0.4)",
                      }}
                      data-testid="button-hangup"
                    >
                      <PhoneOff size={28} />
                    </Button>
                  </motion.div>
                </>
              )}
            </Space>

            {muted && status !== "idle" && <Text type="warning">Muted</Text>}

            {status === "connected" && (
              <VoicemailDropButton
                callSid={null}
                onDropped={() => {
                  hangup();
                  setShowDispositionStrip(true);
                }}
              />
            )}

            <Divider style={{ margin: "16px 0 8px" }} />

            <Button
              type="default"
              icon={<Calendar size={16} />}
              onClick={handleOpenBooking}
              disabled={!selectedLead}
              style={{ width: "80%" }}
              data-testid="button-book-appointment"
            >
              Book Appointment
            </Button>

            <Button
              type="default"
              icon={<Calendar size={16} />}
              onClick={() => setScheduleModalOpen(true)}
              style={{ width: "80%", marginTop: 8 }}
              data-testid="button-schedule-appointment"
            >
              {selectedLead ? "Schedule Appointment" : "Quick Schedule"}
            </Button>

            {/* Inline Disposition Strip - appears after call ends */}
            <DispositionStrip
              visible={showDispositionStrip && status === "idle"}
              callDuration={formattedDuration}
              onDisposition={handleDisposition}
              onSkip={handleSkipDisposition}
            />
            </Card>
          </motion.div>
        </Col>

        <Col span={8}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card
              style={{ 
                height: "calc(100vh - 180px)",
                background: "#050505",
                border: "0.5px solid rgba(0, 255, 255, 0.15)",
              }}
              tabList={[
              { key: "transcription", tab: <><AudioOutlined /> Transcription</> },
              { key: "sms", tab: <><MessageOutlined /> SMS</> },
              { key: "email", tab: <><MailOutlined /> Email</> },
              { key: "recents", tab: <><ClockCircleOutlined /> Recents</> },
              { key: "activity", tab: <><HistoryOutlined /> Activity</> },
            ]}
            activeTabKey={activeTab}
            onTabChange={(key) => setActiveTab(key as "transcription" | "sms" | "email" | "recents" | "activity")}
            styles={{ body: { padding: 0, height: "calc(100% - 55px)", display: "flex", flexDirection: "column" } }}
          >
            {activeTab === "transcription" && (
              <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                {entries.length === 0 ? (
                  <Empty description="Transcription will appear during call..." image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <List
                    dataSource={entries}
                    renderItem={(entry) => {
                      const isSystem = entry.speaker === "system" || entry.text.startsWith("[SYSTEM]") || entry.text.startsWith("[Call");
                      const tagColor = isSystem ? "gold" : entry.speaker === "rep" ? "blue" : "green";
                      const tagLabel = isSystem ? "System" : entry.speaker === "rep" ? "Rep" : "Customer";
                      return (
                        <List.Item style={{ padding: "8px 0", border: "none" }}>
                          <div style={{ width: "100%" }}>
                            <Tag color={tagColor} style={{ marginBottom: 4 }}>
                              {tagLabel}
                            </Tag>
                            <div><Text>{entry.text.replace("[SYSTEM] ", "")}</Text></div>
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                )}
              </div>
            )}

            {activeTab === "sms" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  {!phoneNumber ? (
                    <Empty description="Select a lead to send SMS" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : smsMessages.length === 0 ? (
                    <Empty description="No messages yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={smsMessages}
                      renderItem={(msg) => (
                        <div
                          key={msg.id}
                          style={{
                            display: "flex",
                            justifyContent: msg.direction === "sent" ? "flex-end" : "flex-start",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              maxWidth: "80%",
                              padding: "8px 12px",
                              borderRadius: 12,
                              backgroundColor: msg.direction === "sent" ? "#1890ff" : "rgba(255,255,255,0.1)",
                              color: "#fff",
                            }}
                          >
                            <div>{msg.text}</div>
                            <div style={{ fontSize: 10, opacity: 0.7, marginTop: 4 }}>
                              {new Date(msg.timestamp).toLocaleTimeString()}
                              {msg.direction === "sent" && msg.status && (
                                <span style={{ marginLeft: 8 }}>
                                  {msg.status === "sending" && "..."}
                                  {msg.status === "sent" && "Sent"}
                                  {msg.status === "delivered" && "Delivered"}
                                  {msg.status === "failed" && "Failed"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
                <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Input
                      value={smsInput}
                      onChange={(e) => setSmsInput(e.target.value)}
                      placeholder="Type a message..."
                      onPressEnter={handleSendSms}
                      disabled={!phoneNumber || smsSending}
                      data-testid="input-sms-message"
                    />
                    <Button
                      type="primary"
                      onClick={handleSendSms}
                      loading={smsSending}
                      disabled={!phoneNumber || !smsInput.trim()}
                      data-testid="button-send-sms"
                    >
                      Send
                    </Button>
                  </Space.Compact>
                  {settings.useNativePhone && (
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      Native mode: Opens your SMS app
                    </Text>
                  )}
                </div>
              </div>
            )}

            {activeTab === "email" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
                  {!selectedLead?.email ? (
                    <Empty description="Selected lead has no email address" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : emailMessages.length === 0 ? (
                    <Empty description="No emails sent yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <List
                      dataSource={emailMessages}
                      renderItem={(email) => (
                        <div
                          key={email.id}
                          style={{
                            marginBottom: 12,
                            padding: "8px 12px",
                            borderRadius: 8,
                            backgroundColor: "rgba(255,255,255,0.05)",
                            borderLeft: email.direction === "sent" ? "3px solid #1890ff" : "3px solid #52c41a",
                          }}
                        >
                          <div style={{ fontWeight: "bold", marginBottom: 4 }}>{email.subject}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{email.body.substring(0, 100)}...</div>
                          <div style={{ fontSize: 10, opacity: 0.5, marginTop: 4 }}>
                            {new Date(email.timestamp).toLocaleString()}
                            {email.status && <span style={{ marginLeft: 8 }}>{email.status}</span>}
                          </div>
                        </div>
                      )}
                    />
                  )}
                </div>
                <div style={{ padding: 12, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject"
                    style={{ marginBottom: 8 }}
                    disabled={!selectedLead?.email || emailSending}
                    data-testid="input-email-subject"
                  />
                  <Input.TextArea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Email body..."
                    rows={3}
                    style={{ marginBottom: 8 }}
                    disabled={!selectedLead?.email || emailSending}
                    data-testid="input-email-body"
                  />
                  <Button
                    type="primary"
                    icon={<Mail size={14} />}
                    onClick={handleSendEmail}
                    loading={emailSending}
                    disabled={!selectedLead?.email || !emailSubject.trim() || !emailBody.trim()}
                    block
                    data-testid="button-send-email"
                  >
                    Send Email
                  </Button>
                  {settings.useNativePhone && (
                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      Native mode: Opens your email app
                    </Text>
                  )}
                </div>
              </div>
            )}

            {activeTab === "recents" && (
              <div style={{ padding: 16, height: "100%", overflow: "auto" }}>
                {recentCallsLoading ? (
                  <Spin />
                ) : recentCalls.length === 0 ? (
                  <Empty description="No recent calls yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                  <List
                    dataSource={recentCalls}
                    renderItem={(activity) => {
                      const lead = leadMap.get(activity.leadId);
                      const name = lead?.name || "Unknown";
                      const disposition = activity.metadata.disposition || "Unknown";
                      const duration = activity.metadata.duration ? formatSeconds(activity.metadata.duration) : "0:00";
                      const timestamp = activity.createdAt instanceof Date
                        ? activity.createdAt
                        : new Date(activity.createdAt);

                      return (
                        <List.Item
                          onClick={() => handleRecentRedial(activity)}
                          style={{ cursor: lead?.phone ? "pointer" : "default" }}
                          data-testid={`recent-call-${activity.id}`}
                        >
                          <div style={{ width: "100%" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <Tag color="blue">Call</Tag>
                              <Text strong>{name}</Text>
                              <Tag>{disposition}</Tag>
                              <Text type="secondary" style={{ marginLeft: "auto", fontSize: 12 }}>
                                {timestamp.toLocaleTimeString()}
                              </Text>
                            </div>
                            <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                              Duration: {duration}
                            </Text>
                            {lead?.phone && (
                              <Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                                {lead.phone}
                              </Text>
                            )}
                          </div>
                        </List.Item>
                      );
                    }}
                  />
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div style={{ padding: 16, height: '100%', overflow: 'auto' }}>
                <ActivityTimeline leadId={selectedLeadId} refreshKey={activityRefreshKey} />
              </div>
            )}
            </Card>
          </motion.div>
        </Col>
      </Row>

      <Drawer
        title="Book Appointment"
        placement="right"
        onClose={() => setBookingOpen(false)}
        open={bookingOpen}
        width={400}
      >
        {bookingConfirmed ? (
          <div style={{ textAlign: "center", paddingTop: 48 }}>
            <CheckCircle size={64} color="#52c41a" style={{ marginBottom: 16 }} />
            <Title level={4}>Appointment Booked!</Title>
            <Text type="secondary">Confirmation has been added to the call notes.</Text>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 24 }}>
              <Text type="secondary">Booking for:</Text>
              <div style={{ marginTop: 4 }}>
                <Text strong style={{ fontSize: 16 }}>
                  {selectedLead ? selectedLead.name || "Unknown" : "No lead selected"}
                </Text>
              </div>
              {selectedLead?.phone && <Text type="secondary">{selectedLead.phone}</Text>}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <Button
                type="primary"
                onClick={() => {
                  setBookingOpen(false);
                  setScheduleModalOpen(true);
                }}
                style={{ background: '#00ffff', borderColor: '#00ffff', color: '#000' }}
              >
                Quick Schedule
              </Button>
              <Button
                type="default"
                onClick={() => fetchCalendlySlots()}
              >
                Calendly Slots
              </Button>
            </div>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Text strong style={{ display: "block", marginBottom: 12 }}>Calendly Time Slots</Text>

              {loadingSlots ? (
                <div style={{ textAlign: "center", padding: 24 }}>
                  <Spin />
                  <div style={{ marginTop: 8 }}>Loading available times...</div>
                </div>
              ) : slotsError ? (
                <div style={{ textAlign: "center", padding: 24, color: "#ff4d4f" }}>
                  {slotsError}
                </div>
              ) : availableSlots.length === 0 ? (
                <Empty description="Click 'Calendly Slots' to load available times" />
              ) : (
                <Radio.Group
                  value={selectedSlot}
                  onChange={(e) => setSelectedSlot(e.target.value)}
                  style={{ width: "100%" }}
                >
                  <Space direction="vertical" style={{ width: "100%" }}>
                    {availableSlots.map((slot) => (
                      <Radio
                        key={slot.id}
                        value={slot.id}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          border: "1px solid rgba(255,255,255,0.12)",
                          borderRadius: 6,
                          backgroundColor: selectedSlot === slot.id ? "rgba(201, 166, 72, 0.1)" : undefined,
                        }}
                        data-testid={`radio-slot-${slot.id}`}
                      >
                        {slot.display}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
              )}
            </div>

            <Button
              type="primary"
              block
              size="large"
              onClick={handleBook}
              loading={booking}
              disabled={!selectedSlot || !!slotsError}
              data-testid="button-confirm-booking"
            >
              Confirm Booking
            </Button>
          </>
        )}
      </Drawer>

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
    </div>
  );
}
