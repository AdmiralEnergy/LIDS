# Project 4: Dialer System Audit

**Professional Sales Communication Platform**
*Created: December 25, 2025*

---

## Status: PHASE 1, 2 & 4 COMPLETE | PHASE 7 (A2P) UNDER REVIEW

---

## Executive Summary

The LIDS dialer requires manual disposition selection after each call. If the rep doesn't click a disposition button, no XP is awarded and the call isn't tracked. This creates data loss and breaks the gamification system.

**Root Cause:** `handleHangup()` shows `DispositionStrip` but waits for user click. No click = no tracking.

**Fix:** Auto-detect disposition from duration + transcription, show confirmation toast, auto-submit after 3 seconds.

---

## Current State Analysis

### Call Flow (Broken)

```
Call Ends
    ↓
handleHangup() [dialer.tsx:212]
    ↓
showDispositionStrip = true
    ↓
*** WAITS FOR USER CLICK ***
    ↓
User clicks disposition chip OR clicks Skip
    ↓
handleDisposition() [dialer.tsx:232] → XP awarded
    ↓
OR handleSkipDisposition() → NO XP, NO LOG
```

### Data Loss Scenarios

| Scenario | Result |
|----------|--------|
| User clicks Skip | Call not logged, no XP |
| User closes tab | Call not logged, no XP |
| User gets distracted | Call not logged, no XP |
| User doesn't understand UI | Call not logged, no XP |

---

## Critical Issues

### C1: Manual Disposition Required

**Severity:** CRITICAL
**Location:** `dialer.tsx:232-300`
**Impact:** Every call risks being untracked

**Evidence:**
```typescript
// dialer.tsx:40
const handleDisposition = async (disposition: string, notes: string) => {
  // Only runs if user clicks a disposition
  await logActivity({...});
  await recordCall({...});
  await addXP({...});
};
```

### C2: Native Phone Mode Has No Tracking

**Severity:** CRITICAL
**Location:** `dialer.tsx:110-113`
**Impact:** Native calls never tracked

**Evidence:**
```typescript
const dialNative = useCallback(() => {
  if (!phoneNumber) return;
  window.open(`tel:${phoneNumber}`, "_self");
  // That's it - no tracking, no callback
}, [phoneNumber]);
```

### C3: No Inbound Call Handling

**Severity:** HIGH
**Location:** `useDialer.ts`
**Impact:** Missed inbound leads

**Evidence:** No `device.on('incoming')` handler exists.

### C4: No Caller ID Display

**Severity:** MEDIUM
**Location:** `dialer.tsx` UI
**Impact:** Rep confusion about outbound number

### C5: SMS Messages Not Persisted

**Severity:** MEDIUM
**Location:** `dialer.tsx:53`
**Impact:** Lost conversation history

**Evidence:**
```typescript
const [smsHistory, setSmsHistory] = useState<Record<string, Array<...>>>({});
// Local state only - lost on refresh
```

### C6: SMTP Credentials Exposed

**Severity:** MEDIUM
**Location:** `useEmail.ts:44-52`
**Impact:** Security vulnerability

**Evidence:**
```typescript
body: JSON.stringify({
  smtpHost: settings.smtpHost,
  smtpPassword: settings.smtpPassword, // In request body!
})
```

---

## Available Data for Auto-Detection

When a call ends, we have:

| Data | Source | Reliability |
|------|--------|-------------|
| Duration (seconds) | `useDialer.duration` | High |
| Transcription entries | `useTranscription.entries` | Medium (requires Voice Service) |
| Call status | `useDialer.status` | High |
| Selected lead | `selectedLead` | High |

---

## Auto-Disposition Algorithm

### Duration-Based Rules

| Duration | Customer Spoke | Keywords | Disposition |
|----------|---------------|----------|-------------|
| < 10s | - | - | NO_ANSWER |
| 10-30s | No | VM keywords | VOICEMAIL |
| 10-30s | Yes | Negative | NOT_INTERESTED |
| 10-30s | Yes | Neutral | CONTACT (low confidence) |
| 30-120s | - | Callback | CALLBACK |
| 30-120s | - | Negative | NOT_INTERESTED |
| 30-120s | - | Neutral | CONTACT |
| > 120s | - | Appointment | CALLBACK (high) |
| > 120s | - | Other | CONTACT (high) |

### Keyword Patterns

**Negative:**
- "not interested", "no thank you", "don't call", "remove me", "wrong number"

**Callback:**
- "call me back", "busy right now", "next week", "tomorrow", "schedule"

**Appointment:**
- "appointment", "come by", "send someone", "quote", "estimate"

**Voicemail:**
- "leave a message", "at the tone", "voicemail", "not available"

---

## Target State

### Call Flow (Fixed)

```
Call Ends
    ↓
handleHangup() [dialer.tsx]
    ↓
Capture: duration, transcription entries
    ↓
inferDisposition() → AutoDispositionResult
    ↓
Show AutoDispositionToast (3 second countdown)
    ↓
User can click "Change" → Opens DispositionStrip
    ↓
Auto-confirm after 3 seconds
    ↓
confirmAutoDisposition():
  - logActivity()
  - recordCall()
  - addXP()
    ↓
Advance to next lead
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `lib/autoDisposition.ts` | Core inference algorithm |
| `components/AutoDispositionToast.tsx` | 3-second confirmation UI |
| `components/IncomingCallModal.tsx` | Inbound call UI (Phase 3) |
| `components/CallerIdBadge.tsx` | Caller ID display (Phase 4) |

## Files to Modify

| File | Changes |
|------|---------|
| `pages/dialer.tsx` | Replace manual flow with auto-disposition |
| `hooks/useDialer.ts` | Add incoming call handler (Phase 3) |
| `lib/progressionDb.ts` | Add autoDispositionLog table |
| `hooks/useSms.ts` | Persist messages (Phase 5) |
| `hooks/useEmail.ts` | Remove SMTP credentials (Phase 6) |

---

## Success Criteria

Phase 1 (Auto-Disposition):
- [x] Calls auto-log without user click
- [x] XP awarded automatically
- [x] Override option available
- [ ] Accuracy > 80% (tracked via autoDispositionLog) - **TESTING IN PROGRESS**

Phase 2 (Native Timer):
- [x] Native calls show timer UI
- [x] "End Call" button triggers auto-disposition
- [x] Duration tracked for native calls

Phase 3 (Inbound):
- [ ] Incoming call modal appears
- [ ] Accept/reject buttons work
- [ ] Inbound calls logged to activity

Phase 4 (Caller ID):
- [x] Badge shows outbound number
- [x] "Using Device" shown for native mode

Phase 5 (SMS Threading):
- [ ] Messages persist across refresh
- [ ] Conversation history visible

Phase 6 (Email Security):
- [ ] No SMTP credentials in network requests
- [ ] n8n handles credentials server-side

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Wrong auto-disposition | "Change" button + accuracy tracking |
| Transcription unavailable | Fall back to duration-only rules |
| User wants manual control | Settings toggle to disable auto |
| Network offline | Queue disposition for sync |

---

## Backend Services (admiral-server)

### Transcription Services Status

| Service | Port | Status | Purpose |
|---------|------|--------|---------|
| `twilio-service` | 4115 | ✅ RUNNING | Voice SDK tokens for browser |
| `transcription-service` | 4097 | ✅ RUNNING | Post-call recording transcription |
| `voice-service` | 4130 | ✅ RUNNING | COMPASS real-time STT/TTS |

### Two Transcription Paths

1. **Real-Time (Browser)** - `useTranscription.ts`
   - ⚠️ **NOT FUNCTIONAL** - Only shows placeholder message
   - Currently displays: "[Call in progress - transcription available after call ends]"
   - Has `transcribeAudio()` and `transcribeFromUrl()` methods for post-call transcription
   - **Impact:** Auto-disposition keyword detection does NOT work - only duration-based inference
   - **TODO:** Implement real-time STT via Twilio Media Streams or WebSocket bridge

2. **Post-Call (Webhook)** - `transcription-service:4097`
   - Receives Twilio recording webhook after call ends
   - Downloads recording, transcribes via faster-whisper
   - **TODO:** Update `twilio_handler.py` to POST to Twenty CRM (currently posts to Oracle)
   - **TODO:** Connect transcription result to useTranscription hook for keyword analysis

### Twilio Recording Integration (TODO)

**Current State:** transcription-service is running but not receiving webhooks.

**Required Changes:**

1. **Configure Twilio TwiML App:**
   - Add recording status callback URL
   - URL: `https://agents.ripemerchant.host/transcribe/webhook`

2. **Update transcription-service `twilio_handler.py`:**
   ```python
   # CHANGE FROM:
   oracle_url = os.getenv("ORACLE_URL", "http://localhost:4050")
   # TO:
   twenty_url = os.getenv("TWENTY_CRM_URL", "http://localhost:3001")

   # POST transcript as Note on Person record in Twenty CRM
   ```

3. **Expose endpoint via Caddy/nginx:**
   - Route: `agents.ripemerchant.host/transcribe/webhook` → `100.66.42.81:4097/webhook/twilio/recording`

### Transcription Storage Target

| Storage | Use Case |
|---------|----------|
| ❌ Oracle | LifeOS memory (not for Admiral Energy data) |
| ✅ Twenty CRM | Create Note on Person/Lead with call transcript |

---

## Known Issues (Discovered During Testing)

### Issue 1: No Real-Time Transcription
- **Discovery:** `useTranscription.ts` does NOT provide live transcription
- **Current Behavior:** Shows placeholder "[Call in progress - transcription available after call ends]"
- **Impact:** Keyword detection is non-functional - auto-disposition works on duration only
- **Resolution:** Twilio Media Streams
- **Backend Status:** ✅ WebSocket endpoint ready at `transcription-service:4097/stream`
- **Remaining:**
  1. Configure Cloudflare Tunnel route for `agents.ripemerchant.host/stream`
  2. Update TwiML to include `<Stream>` directive
  3. Connect `useTranscription.ts` to WebSocket (VS Code task)

### Issue 2: SMS Requires A2P 10DLC for Local Number
- **Discovery:** 704 local number blocked for SMS until A2P Campaign approved
- **A2P Status:** Campaign submitted Dec 25, 2025 - under review (2-3 weeks)
- **Workaround:** Use 833 toll-free for SMS (works now)
- **Resolution:** Wait for A2P approval, then register 704 to campaign
- **Configuration:** `smsPhoneNumber` in Settings must be set for Twilio SMS mode

### Issue 3: Transcription Display Bug (FIXED)
- **Discovery:** System messages were showing "Customer" tag instead of "System"
- **Resolution:** Fixed speaker detection logic in dialer.tsx to check `entry.speaker === 'system'` OR text starting with "[Call"

### Issue 4: Debug Logging Added
- **Discovery:** Added `[Auto-Disposition]` console logs for tracing flow
- **Location:** `handleHangup`, `confirmAutoDisposition`, `handleOverrideAutoDisposition`
- **Usage:** Check browser DevTools console when testing

---

## UX Improvement Requests

User feedback requesting dialer to be "like a real phone":
- [x] Hide/show keypad toggle (persisted to localStorage)
- [ ] Contact search by name
- [x] Recent calls history (click-to-redial)
- [x] Caller ID badge showing outbound number
- [x] More intuitive phone-like interface

**Implemented by Codex (Dec 25, 2025):**
- `CallerIdBadge.tsx` component
- Keypad visibility toggle with localStorage persistence
- Recents tab with call history and redial

---

## A2P 10DLC Registration (Phase 7)

**Status:** ⏳ Campaign Under Review (submitted December 25, 2025)

### Why A2P Matters for Dialer

SMS from local numbers (like 704) to US recipients requires A2P 10DLC registration. Without it, carriers block messages.

### Registration Progress

| Step | Status | Cost |
|------|--------|------|
| 1. Customer Profile | ✅ Approved | Free |
| 2. Standard Brand (David Edwards) | ✅ Registered | $46 (paid) |
| 3. Standard Campaign | ⏳ Under Review | $15 + $1.50-10/mo |

### Campaign Configuration

| Property | Value |
|----------|-------|
| Campaign SID | `CM57a549dbb24a9951a2...` |
| Brand Registration SID | `BNb37ce8a619b83aaa788e660dc8754c9c` |
| Messaging Service SID | `MG49e15209620493a2121faa57a12d2f28` |
| Use Case | Low Volume Mixed |
| Expected Approval | 2-3 weeks |

### Opt-In Configuration

| Setting | Value |
|---------|-------|
| Keywords | `YES, START, INFO, SOLAR` |
| Opt-In Message | Admiral Energy: You are now opted-in to receive solar service updates. Reply HELP for assistance or STOP to opt-out. |

### Sample Messages Registered

1. Appointment confirmations with rep name and time
2. Follow-up messages after calls
3. Solar savings estimates with callback request

### After Approval Checklist

- [ ] Register 704 number to approved campaign
- [ ] Update LIDS Settings with `smsPhoneNumber: +17047414684`
- [ ] Test SMS send/receive from dialer
- [ ] Implement SMS Threading (Phase 5)

### Full Documentation

See: `docs/architecture/Twilio/twilio.md` for complete A2P details.

---

*Audit completed: December 25, 2025*
*Updated: December 25, 2025 - Phase 1, 2 & 4 complete, A2P submitted, known issues documented*
