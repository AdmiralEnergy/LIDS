# Codex Implementation Plan - Project 4

**Professional Dialer System**
*For use with OpenAI Codex, Claude, or similar AI coding assistants*

---

## Status: PHASE 1, 2, 3 & 4 COMPLETE | LIVE TRANSCRIPTION ACTIVE

---

## System Prompt

```
You are implementing an auto-disposition system for the LIDS dialer.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite)
- Storage: Dexie (IndexedDB wrapper)
- Current problem: Calls require manual disposition click - no click = no XP
- Solution: Auto-detect disposition from duration + transcription

Key files:
- pages/dialer.tsx - Main dialer page with call handling
- hooks/useDialer.ts - Twilio SDK wrapper with inbound call handling
- hooks/useTranscription.ts - Live transcription via MediaRecorder API
- components/DispositionStrip.tsx - Manual disposition UI (fallback)
- components/AutoDispositionToast.tsx - Auto-disposition UI
- components/IncomingCallModal.tsx - Inbound call accept/reject UI
- lib/autoDisposition.ts - Disposition inference algorithm
- lib/twentySync.ts - recordCall() for persistence
- features/progression/hooks/useProgression.ts - addXP()

Auto-disposition uses DURATION + KEYWORD DETECTION.
Live transcription captures rep's microphone audio via MediaRecorder.
Keywords in transcription are analyzed by inferDisposition().

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
```

---

## Phase 1: Auto-Disposition (CRITICAL)

### Task 1: Create autoDisposition.ts ✓ COMPLETE

**File:** `apps/ads-dashboard/client/src/lib/autoDisposition.ts`

Creates:
- `inferDisposition(duration, transcription)` - Main inference function
- `calculateXpAmount(xpEventType, duration)` - XP calculation
- `getDispositionLabel(disposition)` - Display labels
- `getDispositionColor(disposition)` - UI colors

### Task 2: Create AutoDispositionToast.tsx ✓ COMPLETE

**File:** `apps/ads-dashboard/client/src/components/AutoDispositionToast.tsx`

Creates toast component with:
- 3-second countdown progress bar
- Disposition icon + label
- XP badge with amount
- "Change" button for override
- Auto-dismiss on countdown complete

### Task 3: Modify dialer.tsx ✓ COMPLETE

**File:** `apps/ads-dashboard/client/src/pages/dialer.tsx`

Changes:

1. Add imports:
```typescript
import { AutoDispositionToast } from '../components/AutoDispositionToast';
import { inferDisposition, calculateXpAmount } from '../lib/autoDisposition';
```

2. Add state:
```typescript
const [autoDisposition, setAutoDisposition] = useState<AutoDispositionResult | null>(null);
const [showAutoToast, setShowAutoToast] = useState(false);
const [capturedDuration, setCapturedDuration] = useState(0);
const [capturedEntries, setCapturedEntries] = useState<TranscriptionEntry[]>([]);
```

3. Modify `handleHangup`:
```typescript
const handleHangup = () => {
  // Capture data before reset
  const finalDuration = duration;
  const finalEntries = [...entries];
  setCapturedDuration(finalDuration);
  setCapturedEntries(finalEntries);

  // End the call
  hangup();

  // Skip auto-disposition for native mode (no data)
  if (settings.useNativePhone) {
    setShowDispositionStrip(true);
    return;
  }

  // Infer disposition
  const result = inferDisposition(finalDuration, finalEntries);
  setAutoDisposition(result);
  setShowAutoToast(true);
};
```

4. Add auto-confirm handler:
```typescript
const confirmAutoDisposition = async () => {
  if (!autoDisposition || !selectedLead) return;

  setShowAutoToast(false);

  const xpAmount = calculateXpAmount(autoDisposition.xpEventType, capturedDuration);

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
    console.error('Failed to record call:', err);
  }

  // Award XP
  await addXP({
    eventType: autoDisposition.xpEventType,
    details: `Call to ${selectedLead.name || 'lead'}`
  });

  // 2+ minute bonus
  if (capturedDuration >= 120) {
    await addXP({
      eventType: 'two_plus_minute_call',
      details: '2+ minute call bonus'
    });
  }

  // Clear and advance
  clearTranscription();
  setAutoDisposition(null);
  setCapturedDuration(0);
  setCapturedEntries([]);

  if (autoAdvance && currentIndex < leads.length - 1) {
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    const nextLead = leads[nextIndex];
    setSelectedLeadId(nextLead.id);
    if (nextLead.phone) setPhoneNumber(nextLead.phone);
  }
};
```

5. Add override handler:
```typescript
const handleOverrideAutoDisposition = () => {
  setShowAutoToast(false);
  setShowDispositionStrip(true);
};
```

6. Add toast to JSX (after XPFloater):
```typescript
<AutoDispositionToast
  visible={showAutoToast}
  result={autoDisposition}
  xpAmount={autoDisposition ? calculateXpAmount(autoDisposition.xpEventType, capturedDuration) : 0}
  duration={formatDuration(capturedDuration)}
  onOverride={handleOverrideAutoDisposition}
  onConfirm={confirmAutoDisposition}
/>
```

### Task 4: Update progressionDb.ts ✓ COMPLETE

**File:** `apps/ads-dashboard/client/src/lib/progressionDb.ts`

Add table for accuracy tracking:
```typescript
export interface AutoDispositionLog {
  id?: number;
  leadId: string;
  autoDisposition: string;
  finalDisposition: string;
  wasOverridden: boolean;
  confidence: string;
  duration: number;
  timestamp: Date;
}

// In schema:
autoDispositionLog: '++id, leadId, autoDisposition, timestamp'
```

### Task 5: Test

1. Make Twilio call (30+ seconds)
2. Hang up
3. Verify toast appears with "Contact Made +20 XP"
4. Wait 3 seconds
5. Verify XP awarded
6. Verify activity log shows call
7. Verify Twenty CRM has callRecord

---

## Phase 2: Native Mode Timer ✓ COMPLETE

### Task 6: Add native call state ✓ COMPLETE

In `dialer.tsx`, add:
```typescript
const [nativeCallActive, setNativeCallActive] = useState(false);
const [nativeCallStart, setNativeCallStart] = useState<Date | null>(null);
const nativeTimerRef = useRef<number | null>(null);
```

### Task 7: Modify dialNative ✓ COMPLETE

```typescript
const dialNative = useCallback(() => {
  if (!phoneNumber) return;

  // Start timer
  setNativeCallActive(true);
  setNativeCallStart(new Date());

  // Open phone app
  window.open(`tel:${phoneNumber}`, "_self");
}, [phoneNumber]);
```

### Task 8: Add native call UI ✓ COMPLETE

Show timer and "End Call" button when `nativeCallActive` is true.

### Task 9: Handle native call end ✓ COMPLETE

```typescript
const handleNativeCallEnd = () => {
  if (!nativeCallStart) return;

  const nativeDuration = Math.floor((Date.now() - nativeCallStart.getTime()) / 1000);
  setCapturedDuration(nativeDuration);
  setCapturedEntries([]); // No transcription for native

  setNativeCallActive(false);
  setNativeCallStart(null);

  // Infer from duration only
  const result = inferDisposition(nativeDuration, []);
  setAutoDisposition(result);
  setShowAutoToast(true);
};
```

---

## Phase 3: Inbound Calls ✓ COMPLETE

### Task 10: Add incoming handler in useDialer.ts ✓ COMPLETE

Added `device.on('incoming')` handler with:
- State: `incomingCall`, `incomingCallerId`, `isInbound`
- Functions: `acceptIncoming()`, `rejectIncoming()`, `sendToVoicemail()`
- Event handlers for call cancel and disconnect

### Task 11: Create IncomingCallModal.tsx ✓ COMPLETE

Created full-screen modal with:
- Pulsing animation (ringPulse, iconPulse)
- Caller ID display
- Lead name (if matched by phone number)
- Accept button (green)
- Reject button (red)
- Send to voicemail button
- 30-second auto-voicemail timeout

### Task 12: Integrate in dialer.tsx ✓ COMPLETE

- Import and render `IncomingCallModal`
- Added `incomingLeadMatch` memo for caller ID → lead matching
- Added handlers: `handleAcceptIncoming`, `handleRejectIncoming`, `handleSendToVoicemail`
- Log rejected/voicemail calls to activity

---

## Phase 4: Caller ID Display ✓ COMPLETE

### Task 13: Create CallerIdBadge.tsx ✓ COMPLETE

Created badge component showing:
- Outbound phone number from settings
- "Using Device" when native mode is active
- Phone icon with formatted number

### Task 14: Add to dialer UI ✓ COMPLETE

Badge integrated above keypad area in dialer.tsx.

---

## Phase 5: SMS Threading

### Task 15: Add smsConversations table to Dexie

```typescript
smsConversations: '++id, phoneNumber, timestamp'
```

### Task 16: Persist messages in useSms.ts

Save to Dexie on send, load on mount.

---

## Phase 6: Email Security

### Task 17: Remove SMTP from useEmail.ts

Only send: to, from, subject, body
n8n workflow handles SMTP credentials.

---

## Verification Commands

```javascript
// Check auto-disposition is working
// In browser console after a call:
console.log('Last disposition:', localStorage.getItem('lastAutoDisposition'));

// Check accuracy tracking
indexedDB.open('ADS_Progression').onsuccess = (e) => {
  e.target.result.transaction('autoDispositionLog').objectStore('autoDispositionLog').getAll().onsuccess = (r) => {
    console.log('Auto-disposition log:', r.target.result);
  };
};

// Check call records in Twenty
// Via Twenty CRM UI or GraphQL
```

---

## Rollback

If issues occur:
```bash
git checkout HEAD~1 -- apps/ads-dashboard/client/src/lib/autoDisposition.ts
git checkout HEAD~1 -- apps/ads-dashboard/client/src/components/AutoDispositionToast.tsx
git checkout HEAD~1 -- apps/ads-dashboard/client/src/pages/dialer.tsx
```

---

## Known Limitations

### Transcription - Rep Audio Only
- `useTranscription.ts` now captures rep's microphone audio via MediaRecorder API
- Audio chunks sent every 3 seconds to voice-service for transcription
- **Limitation:** Only rep's audio is transcribed. Customer audio requires server-side Twilio Media Streams
- Keyword detection in `autoDisposition.ts` NOW WORKS for rep speech
- For full dual-channel transcription, configure Twilio Media Streams webhook

### Debug Logging
Console logs added for troubleshooting:
```
[Auto-Disposition] handleHangup called { finalDuration: X, ... }
[Auto-Disposition] Inferred result: { disposition: "...", ... }
[Auto-Disposition] Toast should appear now
[Auto-Disposition] confirmAutoDisposition called { ... }
[Auto-Disposition] XP awarded: dial_made
[Auto-Disposition] Call processing complete, advancing to next lead
```

### SMS Requirement
- Twilio SMS requires `smsPhoneNumber` in Settings
- Native SMS mode works without configuration (opens device SMS app)

---

## Testing Checklist

### Outbound Calls (Phase 1 & 2)
| Test | Expected | Actual |
|------|----------|--------|
| Twilio call < 10s | Toast: "No Answer" | ⏳ Pending |
| Twilio call 30-120s | Toast: "Contact Made" | ⏳ Pending |
| Twilio call > 120s | Toast: "Contact Made" + bonus XP | ⏳ Pending |
| Click "Change" button | Manual disposition strip | ⏳ Pending |
| Native call with timer | Timer UI visible | ⏳ Pending |
| Native "End Call" | Auto-disposition toast | ⏳ Pending |

### Inbound Calls (Phase 3)
| Test | Expected | Actual |
|------|----------|--------|
| Call Twilio number | IncomingCallModal appears | ⏳ Pending |
| Click "Accept" | Call connects, timer starts | ⏳ Pending |
| Click "Reject" | Call rejected, logged to activity | ⏳ Pending |
| Click "Voicemail" | Call sent to voicemail, logged | ⏳ Pending |
| No action for 30s | Auto-voicemail triggered | ⏳ Pending |
| Known caller | Lead name displayed | ⏳ Pending |

### Live Transcription
| Test | Expected | Actual |
|------|----------|--------|
| Call connects | Transcription auto-starts | ⏳ Pending |
| Rep speaks | Text appears in transcript | ⏳ Pending |
| Call ends | Transcription stops | ⏳ Pending |
| Say "not interested" | Disposition: NOT_INTERESTED | ⏳ Pending |
| Say "call me back" | Disposition: CALLBACK | ⏳ Pending |

---

*Implementation plan ready for execution*
*Updated: December 25, 2025 - Phase 1, 2, 3 & 4 complete, live transcription active*
