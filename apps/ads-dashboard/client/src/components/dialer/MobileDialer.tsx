import { useState, useCallback, useMemo } from 'react';
import { PhoneScreen } from './PhoneScreen';
import { LeadCardStack } from './LeadCardStack';
import { CallControls } from './CallControls';
import { MobileDispositionPanel } from './MobileDispositionPanel';
import { ActionPanel } from './ActionPanel';
import { CompactHUD } from './CompactHUD';
import { MessageSquare, Grid3X3 } from 'lucide-react';
import type { Lead as LeadType } from './LeadCard';

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

  // Handlers
  onDial: () => void;
  onHangup: () => void;
  onMute: () => void;
  onSendSms: (message: string) => Promise<void>;
  onDisposition: (disposition: string, notes: string) => Promise<void>;
  onSkipDisposition: () => void;
  onLeadSelect: (leadId: string) => void;

  // Disposition state
  showDisposition: boolean;
  dispositionXp?: number;
  smsSending?: boolean;
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
  onDial,
  onHangup,
  onMute,
  onSendSms,
  onDisposition,
  onSkipDisposition,
  onLeadSelect,
  showDisposition,
  dispositionXp,
  smsSending,
}: MobileDialerProps) {
  const [isCardExpanded, setIsCardExpanded] = useState(false);
  const [showActionPanel, setShowActionPanel] = useState(false);
  const [showKeypad, setShowKeypad] = useState(false);

  const currentLead = leads[currentIndex];
  const isOnCall = status === 'connecting' || status === 'connected';
  const canDial = !!currentLead?.phone && status === 'idle';

  // Convert DB leads to card format
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
    }));
  }, [leads]);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    // Both directions skip to next lead
    if (currentIndex < leads.length - 1) {
      const nextIndex = currentIndex + 1;
      onIndexChange(nextIndex);
      const nextLead = leads[nextIndex];
      if (nextLead) {
        onLeadSelect(nextLead.id);
      }
    }
    setIsCardExpanded(false);
  }, [currentIndex, leads, onIndexChange, onLeadSelect]);

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

  return (
    <PhoneScreen isCallActive={isOnCall}>
      {/* Compact HUD */}
      <CompactHUD
        rankTitle={rankTitle}
        level={level}
        currentXP={currentXP}
        xpToNextLevel={xpToNextLevel}
        streak={streak}
        callsToday={callsToday}
      />

      {/* Lead Card Stack */}
      <LeadCardStack
        leads={cardLeads}
        currentIndex={currentIndex}
        onSwipe={handleSwipe}
        onCardTap={handleCardTap}
        isExpanded={isCardExpanded}
        callStatus={status === 'error' ? 'idle' : status}
        callDuration={formattedDuration}
        disabled={isOnCall}
      />

      {/* Call Controls */}
      <CallControls
        status={status === 'error' ? 'idle' : status}
        muted={muted}
        onDial={onDial}
        onHangup={onHangup}
        onMute={onMute}
        canDial={canDial}
        isNativeMode={isNativeMode}
      />

      {/* Bottom Action Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          padding: '12px 20px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <button
          onClick={() => setShowKeypad(!showKeypad)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: showKeypad ? 'rgba(0, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
            border: showKeypad ? '1px solid rgba(0, 255, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 24,
            cursor: 'pointer',
            color: showKeypad ? '#00ffff' : 'rgba(255, 255, 255, 0.7)',
            fontSize: 14,
          }}
        >
          <Grid3X3 size={18} />
          Keypad
        </button>
        <button
          onClick={() => setShowActionPanel(true)}
          disabled={!currentLead?.phone}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 20px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 24,
            cursor: currentLead?.phone ? 'pointer' : 'not-allowed',
            opacity: currentLead?.phone ? 1 : 0.4,
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: 14,
          }}
        >
          <MessageSquare size={18} />
          SMS
        </button>
      </div>

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
    </PhoneScreen>
  );
}
