import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhoneScreen } from './PhoneScreen';
import { LeadCardStack } from './LeadCardStack';
import { CallControls } from './CallControls';
import { MobileDispositionPanel } from './MobileDispositionPanel';
import { ActionPanel } from './ActionPanel';
import { CompactHUD } from './CompactHUD';
import { PhoneHomeScreen } from './PhoneHomeScreen';
import { LeadProfile } from './LeadProfile';
import { ContactList } from './ContactList';
import { DialpadSheet } from './DialpadSheet';
import { DPCMetricsPanel } from '../DPCMetricsPanel';
import type { DPCMetrics } from '../../lib/dpcMetrics';
import { MessageSquare, RotateCcw, Trash2, X, User, Phone, Home, UserCircle, List, Layers, Grid3X3 } from 'lucide-react';
import type { Lead as LeadType } from './LeadCard';

type ViewMode = 'list' | 'cards' | 'dialpad';

interface MobileDialerProps {
  // Lead data
  leads: LeadType[];
  currentIndex: number;
  onIndexChange: (index: number) => void;

  // Call state
  status: 'idle' | 'connecting' | 'connected' | 'error';
  formattedDuration: string;
  muted: boolean;

  // Progression data
  rankTitle: string;
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  streak: number;
  callsToday: number;

  // Native mode
  isNativeMode: boolean;
  onToggleNativeMode?: () => void;

  // Handlers
  onDial: () => void;
  onHangup: () => void;
  onMute: () => void;
  onSendSms: (message: string) => Promise<void>;
  onDisposition: (disposition: string, notes: string) => Promise<void>;
  onSkipDisposition: () => void;
  onLeadSelect: (leadId: string) => void;
  onDialPhone?: (phoneNumber: string) => void;
  onSmsPhone?: (phoneNumber: string) => void;
  onEmailLead?: (email: string) => void;

  // Disposition state
  showDisposition: boolean;
  dispositionXp?: number;
  smsSending?: boolean;

  // Caller ID
  callerIdNumber?: string;

  // Skipped leads
  skippedLeads?: LeadType[];
  showSkippedPanel?: boolean;
  onShowSkippedPanel?: (show: boolean) => void;
  onSkipLead?: (leadId: string) => void;
  onRestoreLead?: (leadId: string) => void;
  onClearSkipped?: () => void;

  // Home screen
  showHomeScreen?: boolean;
  onToggleHomeScreen?: (show: boolean) => void;
  scheduledCalls?: Array<{ id: string; leadName: string; phone: string; datetime: Date; notes?: string }>;
  recentLeads?: Array<{ id: string; name: string; phone?: string; lastContact?: Date; icpScore?: number }>;

  // Manual dial
  isManualDialMode?: boolean;
  manualPhoneNumber?: string;
  onManualPhoneNumberChange?: (number: string) => void;
  onManualDial?: () => void;

  // DPC Efficiency Metrics (optional)
  dpcMetrics?: DPCMetrics;
  showDpcMetrics?: boolean;
}

export function MobileDialer({
  leads,
  currentIndex,
  onIndexChange,
  status,
  formattedDuration,
  muted,
  rankTitle,
  level,
  currentXP,
  xpToNextLevel,
  streak,
  callsToday,
  isNativeMode,
  onToggleNativeMode,
  onDial,
  onHangup,
  onMute,
  onSendSms,
  onDisposition,
  onSkipDisposition,
  onLeadSelect,
  onDialPhone,
  onSmsPhone,
  onEmailLead,
  showDisposition,
  dispositionXp,
  smsSending,
  callerIdNumber,
  skippedLeads = [],
  showSkippedPanel = false,
  onShowSkippedPanel,
  onSkipLead,
  onRestoreLead,
  onClearSkipped,
  showHomeScreen = false,
  onToggleHomeScreen,
  scheduledCalls = [],
  recentLeads = [],
  isManualDialMode = false,
  manualPhoneNumber = '',
  onManualPhoneNumberChange,
  onManualDial,
  dpcMetrics,
  showDpcMetrics = true,
}: MobileDialerProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDialpad, setShowDialpad] = useState(false);

  // View mode with localStorage persistence - default to 'list'
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dialer-view-mode');
      if (saved === 'list' || saved === 'cards') return saved;
    }
    return 'list'; // Default to list view (Google Voice style)
  });

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('dialer-view-mode', viewMode);
  }, [viewMode]);

  const currentLead = leads[currentIndex];
  const isOnCall = status === 'connecting' || status === 'connected';
  const canDial = !!currentLead?.phone && status === 'idle';

  // Convert DB leads to card format - include all phone fields
  const cardLeads = useMemo(() => {
    return leads.map(lead => ({
      id: lead.id,
      name: lead.name || undefined,
      phone: lead.phone || undefined,
      email: lead.email || undefined,
      company: lead.company || undefined,
      address: lead.address || undefined,
      city: lead.city || undefined,
      state: lead.state || undefined,
      // PropStream phone fields
      cell1: lead.cell1 || undefined,
      cell2: lead.cell2 || undefined,
      cell3: lead.cell3 || undefined,
      cell4: lead.cell4 || undefined,
      landline1: lead.landline1 || undefined,
      landline2: lead.landline2 || undefined,
      landline3: lead.landline3 || undefined,
      landline4: lead.landline4 || undefined,
      phone1: lead.phone1 || undefined,
      phone2: lead.phone2 || undefined,
      // Additional fields
      icpScore: lead.icpScore,
      tcpaStatus: lead.tcpaStatus || undefined,
      email1: lead.email1 || undefined,
      email2: lead.email2 || undefined,
      email3: lead.email3 || undefined,
    }));
  }, [leads]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    // Track the skipped lead
    if (currentLead && onSkipLead) {
      onSkipLead(currentLead.id);
    }
    // Move to next lead (index stays same since skipped lead removed from list)
    // But if we're at the end, we need to adjust
    const nextLead = leads[currentIndex + 1];
    if (nextLead) {
      onLeadSelect(nextLead.id);
    }
    setIsCardExpanded(false);
  }, [currentIndex, leads, currentLead, onSkipLead, onLeadSelect]);

  const handleCardTap = useCallback(() => {
    if (!isOnCall) {
      setIsCardExpanded(!isCardExpanded);
    }
  }, [isOnCall, isCardExpanded]);

  const handleDisposition = useCallback(async (disposition: string, notes: string) => {
    await onDisposition(disposition, notes);
    setIsCardExpanded(false);
  }, [onDisposition]);

  const handleSendSmsWrapper = useCallback(async (message: string) => {
    await onSendSms(message);
    setShowActionPanel(false);
  }, [onSendSms]);

  // Handle dialing a specific phone number from the card or profile
  const handleDialPhone = useCallback((phoneNumber: string) => {
    if (onDialPhone) {
      onDialPhone(phoneNumber);
    }
    setIsCardExpanded(false);
    setShowProfile(false);
  }, [onDialPhone]);

  // Handle SMS to a specific phone number
  const handleSmsPhone = useCallback((phoneNumber: string) => {
    if (onSmsPhone) {
      onSmsPhone(phoneNumber);
    } else {
      // Fallback: open action panel with this number
      setShowActionPanel(true);
    }
    setShowProfile(false);
  }, [onSmsPhone]);

  // Handle email from profile
  const handleEmailLead = useCallback((email: string) => {
    if (onEmailLead) {
      onEmailLead(email);
    }
    setShowProfile(false);
  }, [onEmailLead]);

  // Handle calling a lead from home screen
  const handleHomeCallLead = useCallback((leadId: string, phone: string) => {
    onToggleHomeScreen?.(false);
    if (onDialPhone) {
      onDialPhone(phone);
    }
  }, [onToggleHomeScreen, onDialPhone]);

  // Handle selecting a lead from ContactList
  const handleSelectLeadFromList = useCallback((lead: LeadType) => {
    onLeadSelect(lead.id);
    // Don't auto-switch to cards, let user stay in list view
  }, [onLeadSelect]);

  // Handle opening profile from ContactList
  const handleOpenProfileFromList = useCallback((lead: LeadType) => {
    onLeadSelect(lead.id);
    setShowProfile(true);
  }, [onLeadSelect]);

  // Handle manual dial from dialpad
  const handleManualDial = useCallback(() => {
    if (onManualDial) {
      onManualDial();
      setShowDialpad(false);
    }
  }, [onManualDial]);

  return (
    <PhoneScreen isCallActive={isOnCall}>
      {/* Show Home Screen or Dialer */}
      {showHomeScreen && !isOnCall ? (
        <PhoneHomeScreen
          scheduledCalls={scheduledCalls}
          recentLeads={recentLeads}
          onCallLead={handleHomeCallLead}
          onNavigateToDialer={() => onToggleHomeScreen?.(false)}
          onClose={() => onToggleHomeScreen?.(false)}
        />
      ) : (
        <>
          {/* Compact HUD */}
          <CompactHUD
            rankTitle={rankTitle}
            level={level}
            currentXP={currentXP}
            xpToNextLevel={xpToNextLevel}
            streak={streak}
            callsToday={callsToday}
            callerIdNumber={callerIdNumber}
            isNativeMode={isNativeMode}
            onToggleNativeMode={onToggleNativeMode}
          />

          {/* DPC Efficiency Metrics - Compact Bar */}
          {showDpcMetrics && dpcMetrics && (
            <DPCMetricsPanel metrics={dpcMetrics} compact={true} />
          )}

          {/* View Mode Toggle */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 4,
              padding: '8px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={() => setViewMode('list')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: viewMode === 'list' ? 'rgba(0, 255, 255, 0.15)' : 'transparent',
                border: viewMode === 'list' ? '1px solid rgba(0, 255, 255, 0.4)' : '1px solid transparent',
                borderRadius: 20,
                cursor: 'pointer',
                color: viewMode === 'list' ? '#00ffff' : 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <List size={16} />
              List
            </button>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: viewMode === 'cards' ? 'rgba(201, 166, 72, 0.15)' : 'transparent',
                border: viewMode === 'cards' ? '1px solid rgba(201, 166, 72, 0.4)' : '1px solid transparent',
                borderRadius: 20,
                cursor: 'pointer',
                color: viewMode === 'cards' ? '#c9a648' : 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Layers size={16} />
              Cards
            </button>
            <button
              onClick={() => setShowDialpad(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 20,
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              <Grid3X3 size={16} />
              Dial
            </button>
          </div>

          {/* Main Content Area - List or Cards */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {viewMode === 'list' ? (
              <ContactList
                leads={cardLeads}
                selectedLeadId={currentLead?.id}
                onSelectLead={handleSelectLeadFromList}
                onDialPhone={handleDialPhone}
                onSmsPhone={handleSmsPhone}
                onOpenProfile={handleOpenProfileFromList}
                isOnCall={isOnCall}
              />
            ) : (
              <>
                {/* Show Manual Dial card when dialing a number not in leads */}
                {isManualDialMode && isOnCall ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 340,
                        padding: 24,
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: 20,
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
                          border: '2px solid rgba(0, 150, 255, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 16px',
                        }}
                      >
                        <Phone size={32} color="#0096ff" />
                      </div>
                      <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: '#f7f5f2' }}>
                        Manual Dial
                      </h3>
                      <p style={{ margin: 0, fontSize: 24, fontFamily: 'var(--font-mono)', color: '#00ffff', letterSpacing: '0.5px' }}>
                        {manualPhoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
                      </p>
                      {status === 'connected' && (
                        <p style={{ margin: '12px 0 0', fontSize: 18, color: '#00ff88', fontWeight: 500 }}>
                          {formattedDuration}
                        </p>
                      )}
                      {status === 'connecting' && (
                        <p style={{ margin: '12px 0 0', fontSize: 14, color: '#0096ff' }}>
                          Connecting...
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <LeadCardStack
                    leads={cardLeads}
                    currentIndex={currentIndex}
                    onSwipe={handleSwipe}
                    onCardTap={handleCardTap}
                    isExpanded={isCardExpanded}
                    callStatus={status === 'error' ? 'idle' : status}
                    callDuration={formattedDuration}
                    disabled={isOnCall}
                    onDialPhone={handleDialPhone}
                    onSmsPhone={handleSmsPhone}
                  />
                )}

                {/* Call Controls - only show in card view */}
                <CallControls
                  status={status === 'error' ? 'idle' : status}
                  muted={muted}
                  onDial={onDial}
                  onHangup={onHangup}
                  onMute={onMute}
                  canDial={canDial || (isManualDialMode && status === 'idle')}
                  isNativeMode={isNativeMode}
                />
              </>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 16px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'rgba(0, 0, 0, 0.2)',
            }}
          >
            {/* Home Button */}
            <button
              onClick={() => onToggleHomeScreen?.(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 44,
                height: 44,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                cursor: 'pointer',
                color: 'rgba(255, 255, 255, 0.7)',
              }}
              title="Home"
            >
              <Home size={20} />
            </button>

            {/* Profile Button */}
            {currentLead && (
              <button
                onClick={() => setShowProfile(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  background: 'rgba(201, 166, 72, 0.15)',
                  border: '1px solid rgba(201, 166, 72, 0.4)',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  color: '#c9a648',
                }}
                title="Lead Profile"
              >
                <UserCircle size={20} />
              </button>
            )}

            <button
              onClick={() => setShowActionPanel(true)}
              disabled={!currentLead?.phone}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                background: 'rgba(0, 150, 255, 0.15)',
                border: '1px solid rgba(0, 150, 255, 0.4)',
                borderRadius: 24,
                cursor: currentLead?.phone ? 'pointer' : 'not-allowed',
                opacity: currentLead?.phone ? 1 : 0.4,
                color: '#0096ff',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <MessageSquare size={18} />
              SMS
            </button>

            {/* Skipped Leads Button */}
            {skippedLeads.length > 0 && (
              <button
                onClick={() => onShowSkippedPanel?.(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 14px',
                  background: 'rgba(255, 136, 0, 0.15)',
                  border: '1px solid rgba(255, 136, 0, 0.4)',
                  borderRadius: 24,
                  cursor: 'pointer',
                  color: '#ff8800',
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <RotateCcw size={14} />
                {skippedLeads.length}
              </button>
            )}
          </div>
        </>
      )}

      {/* Disposition Panel (overlays everything) */}
      <MobileDispositionPanel
        visible={showDisposition}
        callDuration={formattedDuration}
        xpAmount={dispositionXp}
        onDisposition={handleDisposition}
        onSkip={onSkipDisposition}
      />

      {/* SMS Action Panel */}
      <ActionPanel
        visible={showActionPanel}
        onClose={() => setShowActionPanel(false)}
        leadName={currentLead?.name}
        leadPhone={currentLead?.phone}
        onSendSms={handleSendSmsWrapper}
        isSending={smsSending}
      />

      {/* Skipped Leads Panel */}
      <AnimatePresence>
        {showSkippedPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <RotateCcw size={20} color="#ff8800" />
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#f7f5f2' }}>
                  Skipped Leads ({skippedLeads.length})
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {skippedLeads.length > 0 && (
                  <button
                    onClick={onClearSkipped}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      background: 'rgba(255, 68, 68, 0.15)',
                      border: '1px solid rgba(255, 68, 68, 0.4)',
                      borderRadius: 16,
                      cursor: 'pointer',
                      color: '#ff4444',
                      fontSize: 12,
                      fontWeight: 500,
                    }}
                  >
                    <Trash2 size={14} />
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => onShowSkippedPanel?.(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Skipped Leads List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 20px',
              }}
            >
              {skippedLeads.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: 'rgba(255, 255, 255, 0.4)',
                  }}
                >
                  <RotateCcw size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                  <p>No skipped leads</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {skippedLeads.map((lead) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0c2f4a 0%, #1a4a6e 100%)',
                            border: '2px solid rgba(201, 166, 72, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <User size={18} color="#c9a648" />
                        </div>
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#f7f5f2',
                            }}
                          >
                            {lead.name || 'Unknown Lead'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Phone size={12} color="rgba(255, 255, 255, 0.4)" />
                            <span
                              style={{
                                fontSize: 12,
                                color: 'rgba(255, 255, 255, 0.5)',
                                fontFamily: 'var(--font-mono)',
                              }}
                            >
                              {lead.phone || lead.cell1 || 'No phone'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onRestoreLead?.(lead.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '8px 14px',
                          background: 'rgba(0, 255, 136, 0.15)',
                          border: '1px solid rgba(0, 255, 136, 0.4)',
                          borderRadius: 20,
                          cursor: 'pointer',
                          color: '#00ff88',
                          fontSize: 13,
                          fontWeight: 500,
                        }}
                      >
                        <RotateCcw size={14} />
                        Restore
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Profile Panel */}
      {currentLead && (
        <LeadProfile
          lead={cardLeads[currentIndex]}
          visible={showProfile}
          onClose={() => setShowProfile(false)}
          onDialPhone={handleDialPhone}
          onSmsPhone={handleSmsPhone}
          onEmailLead={handleEmailLead}
        />
      )}

      {/* Dialpad Sheet */}
      <DialpadSheet
        visible={showDialpad}
        onClose={() => setShowDialpad(false)}
        phoneNumber={manualPhoneNumber}
        onPhoneNumberChange={onManualPhoneNumberChange || (() => {})}
        onDial={handleManualDial}
        isDialing={status === 'connecting'}
        isOnCall={isOnCall}
      />
    </PhoneScreen>
  );
}
