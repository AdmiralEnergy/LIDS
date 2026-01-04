# Codex Implementation Plan - Project 28: Standalone Dialer

## System Prompt for AI

```
You are implementing an iPhone-style phone interface for the ADS Dashboard.

Context:
- App: apps/ads-dashboard (React + TypeScript + Vite)
- Current problem: Dialer requires leads to function
- Solution: Create standalone phone that works without leads

Key existing files to reuse:
- hooks/useDialer.ts - Twilio integration (DO NOT MODIFY)
- hooks/useSms.ts - Has sendSmsToNumber() function
- hooks/useEmail.ts - Email sending

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2
- Cyan: #00ffff (accent)
- Green: #00ff88 (call button)
- Red: #ff4444 (hangup)
```

---

## Phase 1: Create Phone Container

### Task 1.1: Create components/phone/PhoneApp.tsx

```tsx
// Main container with 3 tabs: Keypad | Recents | Favorites
// iPhone-style tab bar at bottom
// Props: useDialer integration

import { useState } from 'react';
import { Phone, Clock, Star, MessageSquare } from 'lucide-react';
import { KeypadTab } from './KeypadTab';
import { RecentsTab } from './RecentsTab';
import { FavoritesTab } from './FavoritesTab';
import { InCallOverlay } from './InCallOverlay';
import { MessagePanel } from './MessagePanel';

type Tab = 'keypad' | 'recents' | 'favorites';

interface PhoneAppProps {
  // From useDialer
  phoneNumber: string;
  setPhoneNumber: (n: string) => void;
  status: 'idle' | 'connecting' | 'connected' | 'error';
  duration: number;
  muted: boolean;
  dial: () => void;
  hangup: () => void;
  toggleMute: () => void;
  appendDigit: (d: string) => void;
  backspaceDigit: () => void;
  clearNumber: () => void;
}
```

---

## Phase 2: Create Keypad Tab

### Task 2.1: Create components/phone/KeypadTab.tsx

```tsx
// Large numeric keypad (0-9, *, #)
// Phone number display at top
// Green call button / Red hangup button
// Backspace button

// Visual reference: iPhone Phone app keypad
// Large circular buttons with letters underneath
// Format number as user types: (704) 555-1234
```

---

## Phase 3: Create Recents Tab

### Task 3.1: Create components/phone/RecentsTab.tsx

```tsx
// List of recent calls from Dexie/local storage
// Each item shows:
//   - Phone number (formatted)
//   - Duration (0:00 format)
//   - Timestamp (Today 3:45 PM / Yesterday / Jan 4)
//   - Direction icon (outbound/inbound/missed)
// Tap to redial
// Swipe to delete (optional)
```

---

## Phase 4: Create Favorites Tab

### Task 4.1: Create components/phone/FavoritesTab.tsx

```tsx
// Quick dial buttons
// Stored in localStorage
// Each favorite:
//   - Name (editable)
//   - Phone number
//   - Tap to dial
// Add button at bottom
// Long-press to edit/delete
```

---

## Phase 5: Create InCall Overlay

### Task 5.1: Create components/phone/InCallOverlay.tsx

```tsx
// Shows during active call (connecting or connected)
// Overlays entire phone UI
// Contains:
//   - Phone number being called
//   - Status text (Calling... / Connected)
//   - Timer (0:00 counting up)
//   - Mute button (toggle)
//   - Keypad button (shows dialpad for DTMF)
//   - Red hangup button (large, bottom)
```

---

## Phase 6: Create Message Panel

### Task 6.1: Create components/phone/MessagePanel.tsx

```tsx
// Floating action button opens this panel
// Tabs: SMS | Email | Both
// SMS Tab:
//   - Phone input
//   - Message textarea
//   - Send button
// Email Tab:
//   - Email input
//   - Subject input
//   - Body textarea
//   - Send button
// Combined Tab:
//   - Phone + Email inputs
//   - Message textarea
//   - "Send to both" button
```

---

## Phase 7: Update Dialer Page

### Task 7.1: Rebuild pages/dialer.tsx

```tsx
// REMOVE:
// - useTable<Lead>
// - All lead filtering/sorting
// - LeadCardStack, ContactList, LeadProfile imports
// - Lead-specific state

// KEEP:
// - useDialer hook
// - useProgression (for later)
// - Basic page layout

// ADD:
// - PhoneApp component as main content
// - Pass useDialer props to PhoneApp
```

---

## Verification

After implementation:
1. Can dial any number without selecting lead
2. Can SMS any number from MessagePanel
3. Can email any address from MessagePanel
4. Recents shows call history
5. Favorites stores quick dials
6. InCall overlay shows during calls
7. All branded with Admiral colors
