import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { message } from "antd";
import { useUser } from "../lib/user-context";
import { useDialer } from "../hooks/useDialer";
import { useTranscription } from "../hooks/useTranscription";
import { useSettings } from "../hooks/useSettings";
import { useProgression, XPFloater } from "../features/progression";
import { AutoDispositionToast } from "../components/AutoDispositionToast";
import { IncomingCallModal } from "../components/IncomingCallModal";
import { PhoneApp } from "../components/phone/PhoneApp";
import { inferDisposition, calculateXpAmount, type TranscriptionEntry } from "../lib/autoDisposition";
import { logAutoDisposition } from "../lib/progressionDb";
import { recordCall } from "../lib/twentySync";
import { useActivityLog } from "../hooks/useActivityLog";

export default function DialerPage() {
  const { currentUser } = useUser();
  const { settings } = useSettings();
  const { logActivity } = useActivityLog();
  const { addXP, recentXpGain } = useProgression();

  const {
    phoneNumber,
    setPhoneNumber,
    status,
    duration,
    formattedDuration,
    muted,
    dial,
    hangup,
    toggleMute,
    appendDigit,
    backspaceDigit,
    clearNumber,
    // Inbound call handling
    incomingCall,
    incomingCallerId,
    acceptIncoming,
    rejectIncoming,
    sendToVoicemail,
  } = useDialer();

  const { entries, clearTranscription } = useTranscription(status === "connected");

  // Auto-disposition state
  const [autoDisposition, setAutoDisposition] = useState<any>(null);
  const [showAutoToast, setShowAutoToast] = useState(false);
  const [capturedDuration, setCapturedDuration] = useState(0);
  const [capturedEntries, setCapturedEntries] = useState<TranscriptionEntry[]>([]);

  const handleHangup = () => {
    const finalDuration = duration;
    const wasConnected = status === 'connected';

    const finalEntries: TranscriptionEntry[] = entries
      .filter(e => e.speaker !== 'system')
      .map(e => ({
        id: e.id,
        speaker: e.speaker as 'rep' | 'customer' | 'system',
        text: e.text,
      }));
    
    setCapturedDuration(finalDuration);
    setCapturedEntries(finalEntries);

    hangup();

    if (finalDuration === 0 && !wasConnected) return;

    const result = inferDisposition(finalDuration, finalEntries);
    setAutoDisposition(result);
    setShowAutoToast(true);
  };

  const confirmAutoDisposition = useCallback(async () => {
    if (!autoDisposition) {
      setShowAutoToast(false);
      return;
    }

    setShowAutoToast(false);
    const xpAmount = calculateXpAmount(autoDisposition.xpEventType, capturedDuration);

    try {
      await recordCall({
        name: `Call to ${phoneNumber}`,
        duration: capturedDuration,
        disposition: autoDisposition.disposition,
        xpAwarded: xpAmount,
      });
      
      await logActivity({
        type: 'call',
        direction: 'outbound',
        content: `Auto: ${autoDisposition.disposition}`,
        metadata: {
          duration: capturedDuration,
          disposition: autoDisposition.disposition,
          phoneNumber
        },
      });

      await addXP({
        eventType: autoDisposition.xpEventType,
        details: `Call to ${phoneNumber}`
      });
    } catch (err) {
      console.error('Failed to record call:', err);
    }

    clearTranscription();
    setAutoDisposition(null);
  }, [autoDisposition, capturedDuration, phoneNumber, logActivity, addXP, clearTranscription]);

  return (
    <div className="min-h-screen bg-[#0a1929] flex items-center justify-center p-0 sm:p-4">
      <XPFloater recentXpGain={recentXpGain} />
      
      <AutoDispositionToast
        visible={showAutoToast}
        result={autoDisposition}
        xpAmount={autoDisposition ? calculateXpAmount(autoDisposition.xpEventType, capturedDuration) : 0}
        duration={formattedDuration}
        onOverride={() => setShowAutoToast(false)}
        onConfirm={confirmAutoDisposition}
      />

      <IncomingCallModal
        visible={!!incomingCall}
        callerNumber={incomingCallerId}
        onAccept={acceptIncoming}
        onReject={rejectIncoming}
        onSendToVoicemail={sendToVoicemail}
      />

      <PhoneApp
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        status={status}
        duration={duration}
        formattedDuration={formattedDuration}
        muted={muted}
        dial={dial}
        hangup={handleHangup}
        toggleMute={toggleMute}
        appendDigit={appendDigit}
        backspaceDigit={backspaceDigit}
        clearNumber={clearNumber}
        currentUserId={currentUser?.id}
      />
    </div>
  );
}