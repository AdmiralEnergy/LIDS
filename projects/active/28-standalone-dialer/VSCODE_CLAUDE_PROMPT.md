# VS Code Claude Prompt: Project 28 - Standalone Dialer

**Status:** COMPLETE (Deployed January 4, 2026)
**Use this prompt for:** Future enhancements, bug fixes, or polish work

---

## System Context

```
You are working on the ADS Dashboard Dialer - an iPhone-style standalone phone interface.

App: apps/ads-dashboard (React + TypeScript + Vite)
Location: C:\LifeOS\LIDS\apps\ads-dashboard\client\src\

Problem Solved: Dialer previously required leads to function. Now it works as a standalone phone.
Architecture: iPhone-style tabs (Keypad | Recents | Favorites | Messages)

Key constraints:
- DO NOT modify hooks/useDialer.ts (core Twilio integration)
- DO NOT modify hooks/useSms.ts (already has sendSmsToNumber)
- DO NOT modify hooks/useEmail.ts (works correctly)
- Brand colors: Navy #0c2f4a, Gold #c9a648, Cyan #00ffff, Green #00ff88, Red #ff4444
```

---

## Current Architecture

```
pages/dialer.tsx (Entry Point)
│
├── useDialer() hook - Twilio calling
├── useTranscription() hook - Live transcription
├── useProgression() hook - XP tracking
├── useActivityLog() hook - Activity logging
│
└── PhoneApp (Main Container)
    ├── Tab Navigation (bottom bar)
    │   ├── Favorites (Star icon)
    │   ├── Recents (Clock icon)
    │   ├── Keypad (Phone icon)
    │   └── Messages (MessageSquare icon)
    │
    ├── KeypadTab
    │   ├── Phone number display (formatted)
    │   ├── Numeric keypad (0-9, *, #)
    │   ├── Green call button
    │   └── Backspace button
    │
    ├── RecentsTab
    │   ├── Query Dexie activities by type='call'
    │   ├── Display: phone, duration, timestamp, direction
    │   └── Tap to redial
    │
    ├── FavoritesTab
    │   ├── localStorage persistence
    │   ├── Add/Edit/Delete contacts
    │   └── Tap to dial
    │
    ├── InCallOverlay (shows during calls)
    │   ├── Timer display
    │   ├── Mute button
    │   ├── Keypad button (placeholder)
    │   └── Hangup button
    │
    └── MessagePanel (modal)
        ├── SMS tab (phone + message)
        ├── Email tab (email + subject + body)
        └── Both tab (send to SMS + Email)
```

---

## File Locations

| Component | Path |
|-----------|------|
| Entry Point | `pages/dialer.tsx` |
| PhoneApp | `components/phone/PhoneApp.tsx` |
| KeypadTab | `components/phone/KeypadTab.tsx` |
| RecentsTab | `components/phone/RecentsTab.tsx` |
| FavoritesTab | `components/phone/FavoritesTab.tsx` |
| InCallOverlay | `components/phone/InCallOverlay.tsx` |
| MessagePanel | `components/phone/MessagePanel.tsx` |

### Hooks (DO NOT MODIFY unless necessary)

| Hook | Purpose |
|------|---------|
| `hooks/useDialer.ts` | Twilio Voice SDK integration |
| `hooks/useSms.ts` | SMS sending via Twilio + sendSmsToNumber() |
| `hooks/useEmail.ts` | Email sending |
| `hooks/useTranscription.ts` | Live call transcription |
| `hooks/useActivityLog.ts` | Activity logging to Dexie |

### Data Layer

| Store | Purpose |
|-------|---------|
| Dexie (IndexedDB) | Local activities, SMS messages, sync queue |
| localStorage | Favorites, settings |
| Twenty CRM | Call records sync |

---

## Known Placeholders / Future Work

These buttons exist but have placeholder handlers:

1. **DTMF Keypad during call** (`InCallOverlay.tsx:83`)
   - `onKeypad` is passed but does nothing
   - Should show dialpad for DTMF tones during call

2. **Speaker toggle** (`InCallOverlay.tsx:84`)
   - Just a visual button
   - Would need Twilio audio routing

3. **Add call** (`InCallOverlay.tsx:85`)
   - Conference calling feature
   - Complex - would need Twilio conference support

4. **FaceTime/Video** (`InCallOverlay.tsx:86`)
   - Not applicable for sales dialer
   - Can be removed

5. **Contacts button** (`InCallOverlay.tsx:87`)
   - Could open FavoritesTab
   - Or show lead lookup modal

6. **Add Number button** (`KeypadTab.tsx:68`)
   - Shows when number entered
   - Should add to favorites

---

## Enhancement Tasks

### Task A: Wire "Add Number" to Favorites

**File:** `components/phone/KeypadTab.tsx:63-70`

Currently a placeholder button. Should:
1. Open a modal to name the contact
2. Save to localStorage via FavoritesTab logic
3. Show success toast

### Task B: Implement DTMF Keypad

**File:** `components/phone/InCallOverlay.tsx`

During active call, show keypad overlay for DTMF tones:
1. Create state for showing DTMF keypad
2. On digit press, send DTMF via Twilio connection
3. Reference: `callRef.current.sendDigits(digit)` in useDialer

### Task C: Remove Unused Buttons

Remove buttons that don't apply to sales dialer:
- FaceTime button
- Add call (unless conference needed)

### Task D: Lead Integration (Future)

Add optional lead context:
1. Accept `?phone=XXX` query param in dialer.tsx
2. Pre-fill phone number
3. Look up lead by phone in Twenty CRM
4. Show lead name in InCallOverlay if found

---

## Testing Checklist

Before marking complete:

- [ ] Can dial any 10-digit number
- [ ] Call connects via Twilio
- [ ] Timer counts during call
- [ ] Mute toggles audio
- [ ] Hangup ends call
- [ ] Auto-disposition toast appears after call
- [ ] Recents shows call history
- [ ] Favorites can be added/edited/deleted
- [ ] MessagePanel opens
- [ ] SMS sends to any number
- [ ] Email sends to any address
- [ ] "Both" sends SMS + Email together

---

## Deployment

```bash
# From Windows Terminal
cd C:\LifeOS\LIDS
git add -A
git commit -m "feat(dialer): [description]"
git push

# Deploy to droplet
ssh root@100.94.207.1 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids"
```

---

## Brand Colors Reference

```css
/* Primary */
--admiral-navy: #0c2f4a;     /* Backgrounds, headers */
--admiral-gold: #c9a648;     /* Accents, XP, wins */
--admiral-white: #f7f5f2;    /* Cards, text backgrounds */

/* Phone UI */
--phone-cyan: #00ffff;       /* Active tabs, highlights */
--phone-green: #00ff88;      /* Call button */
--phone-red: #ff4444;        /* Hangup button */
--phone-black: #000000;      /* Phone body background */

/* Zinc scale for UI elements */
--zinc-500 to --zinc-900     /* Various UI surfaces */
```

---

## Common Patterns

### Framer Motion Animations

All tabs use AnimatePresence for smooth transitions:

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={uniqueKey}
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -10 }}
    transition={{ duration: 0.2 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

### cn() Utility (from PhoneApp)

```tsx
import { cn } from './PhoneApp';

// Usage
<button className={cn(
  "base-classes",
  condition && "conditional-classes"
)}>
```

### Message Toast (Antd)

```tsx
import { message } from 'antd';

message.success('SMS sent!');
message.error('Failed to send');
```

---

## Reference Documentation

- `C:\LifeOS\LIDS\CLAUDE.md` - Main project documentation
- `C:\LifeOS\LIDS\VSCODEClaude.md` - VS Code Claude protocol
- `C:\LifeOS\LIDS\docs\ADMIRAL_UNIFIED_SALES_FRAMEWORK.md` - Progression system
- `C:\LifeOS\LIDS\projects\active\28-standalone-dialer\README.md` - Project status

---

*Last Updated: January 4, 2026*
*Status: Core implementation complete, polish items identified above*
