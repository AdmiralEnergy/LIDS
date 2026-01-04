# Architecture: COMPASS Native Phone Mode

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              USER'S DEVICES                                      │
│                                                                                  │
│   DESKTOP (Browser)                         PHONE (COMPASS PWA)                  │
│   ┌─────────────────────────┐              ┌─────────────────────────┐          │
│   │ ADS Dashboard           │              │ COMPASS                 │          │
│   │ helm.ripemerchant.host  │    QR/Link   │ compass.ripemerchant.   │          │
│   │                         │   ────────►  │ host                    │          │
│   │ ┌─────────────────────┐ │              │                         │          │
│   │ │ Mode Selection      │ │              │ ┌─────────────────────┐ │          │
│   │ │                     │ │              │ │ /phone              │ │          │
│   │ │ ○ ADS Business Mode │ │              │ │                     │ │          │
│   │ │   (Twilio/Resend)   │ │              │ │ ┌─────────────────┐ │ │          │
│   │ │                     │ │              │ │ │  Native Dialer  │ │ │          │
│   │ │ ● Personal Native   │ │              │ │ │                 │ │ │          │
│   │ │   ├─ This Computer  │ │              │ │ │ tel:+1234567890 │ │ │          │
│   │ │   │  (tel: links)   │ │              │ │ │       ↓         │ │ │          │
│   │ │   │                 │ │              │ │ │  Native Phone   │ │ │          │
│   │ │   └─ Your Phone     │─┼──────────────┼─│ │  App Opens      │ │ │          │
│   │ │      (QR→COMPASS)   │ │              │ │ └─────────────────┘ │ │          │
│   │ └─────────────────────┘ │              │ └─────────────────────┘ │          │
│   └─────────────────────────┘              └─────────────────────────┘          │
│                                                       │                          │
└───────────────────────────────────────────────────────│──────────────────────────┘
                                                        │
                                                        ▼
                                              ┌─────────────────────┐
                                              │ PSTN Network        │
                                              │ (Actual phone call) │
                                              └─────────────────────┘
```

---

## Component Architecture

### ADS Dashboard - PhoneApp.tsx

```
PhoneApp
├── Header
│   ├── Mode Indicator (Green=ADS, Orange=Personal)
│   ├── "Calling from" display
│   └── Settings gear icon
│
├── Settings Modal (showSettings=true)
│   ├── ADS Business Mode card
│   │   └── onClick → setUseNativePhone(false)
│   │
│   └── Personal Native Mode card
│       └── onClick → setUseNativePhone(true)
│           └── Shows sub-options:
│               ├── "Use This Computer" → default tel: behavior
│               └── "Use Your Phone" → shows QR code modal
│
├── Keypad Tab
│   └── Dial button behavior:
│       ├── ADS Mode → dial() via Twilio
│       └── Personal Mode:
│           ├── Computer → window.open(`tel:${number}`)
│           └── Phone → QR to COMPASS with number
│
└── Messages Tab
    └── MessagePanel behavior:
        ├── ADS Mode → Twilio SMS / Resend Email
        └── Personal Mode → sms: / mailto: links
```

### COMPASS - New Phone Module

```
COMPASS App
├── AgentSidebar
│   ├── Commands (/)
│   ├── Chat (/chat)
│   ├── LiveWire (/livewire)
│   └── Phone (/phone)  ← NEW
│
└── /phone route
    └── PhonePage
        ├── NativeDialer
        │   ├── Phone number input
        │   ├── Keypad (0-9, *, #)
        │   ├── Call button → window.open(`tel:${number}`)
        │   ├── SMS button → window.open(`sms:${number}`)
        │   └── Email button → opens NativeMessages
        │
        ├── QuickDial (optional)
        │   └── Recent numbers from localStorage
        │
        └── NativeMessages (modal/sheet)
            ├── SMS tab
            │   ├── Phone input
            │   ├── Message textarea
            │   └── Send → window.open(`sms:${phone}?body=${msg}`)
            │
            └── Email tab
                ├── Email input
                ├── Subject input
                ├── Body textarea
                └── Send → window.open(`mailto:${email}?subject=...&body=...`)
```

---

## Data Flow

### Scenario 1: Desktop User Calls via Computer

```
1. User in ADS Dashboard
2. Enters phone number
3. Clicks Dial (Personal Mode - Computer selected)
4. window.open(`tel:+17045551234`, '_self')
5. OS opens registered handler (Zoom, Skype, Phone Link, etc.)
6. Call happens via that app
```

### Scenario 2: Desktop User Wants to Use Phone

```
1. User in ADS Dashboard
2. Enters phone number
3. Clicks "Use Your Phone"
4. QR code appears: compass.ripemerchant.host/phone?number=+17045551234
5. User scans with phone camera
6. COMPASS opens on phone with number pre-filled
7. User taps Call
8. window.open(`tel:+17045551234`, '_self')
9. Native phone app opens
10. Call happens on personal phone
```

### Scenario 3: Mobile User Already in COMPASS

```
1. User opens COMPASS PWA on phone
2. Taps Phone in sidebar
3. Enters number or selects from quick dial
4. Taps Call
5. window.open(`tel:+17045551234`, '_self')
6. Native phone app opens
7. Call happens
8. User returns to COMPASS
9. (Future: Can log call, add notes, enrich)
```

---

## State Management

### ADS Dashboard Settings (localStorage)

```typescript
interface AppSettings {
  // Existing
  useNativePhone: boolean;      // true = Personal Mode
  voicePhoneNumber: string;     // For ADS mode display
  smsPhoneNumber: string;       // For ADS mode SMS

  // New
  nativePhoneMethod: 'computer' | 'phone';  // Sub-selection for Personal Mode
}
```

### COMPASS Local Storage

```typescript
interface CompassPhoneState {
  recentNumbers: string[];      // Last 10 dialed numbers
  quickDial: QuickDialEntry[];  // User-saved favorites
}

interface QuickDialEntry {
  name: string;
  phone: string;
}
```

---

## URL Schemes

### Deep Links

| URL | Purpose |
|-----|---------|
| `compass.ripemerchant.host/phone` | Open COMPASS phone tab |
| `compass.ripemerchant.host/phone?number=+17045551234` | Pre-fill number |
| `compass.ripemerchant.host/phone?number=+17045551234&action=call` | (Future) Auto-initiate |

### Native Links (opened from COMPASS on mobile)

| Action | Format | iOS | Android |
|--------|--------|-----|---------|
| Call | `tel:+17045551234` | Phone app | Phone app |
| SMS | `sms:+17045551234` | Messages | Messages |
| SMS + Body | `sms:+17045551234?body=Hello` | Messages | Messages |
| Email | `mailto:test@test.com` | Mail | Gmail/Mail |
| Email + Subject | `mailto:test@test.com?subject=Hi&body=Hello` | Mail | Gmail/Mail |

---

## Component Specifications

### QRCodeModal.tsx (ADS Dashboard)

```typescript
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;  // Optional - pre-fill in COMPASS
}

// Generates QR code for:
// https://compass.ripemerchant.host/phone?number={phoneNumber}
```

### NativeDialer.tsx (COMPASS)

```typescript
interface NativeDialerProps {
  initialNumber?: string;  // From URL param
}

// Features:
// - Keypad entry
// - Call button (tel: link)
// - SMS button (opens message panel)
// - Recent numbers (localStorage)
```

### NativeMessages.tsx (COMPASS)

```typescript
interface NativeMessagesProps {
  phoneNumber?: string;
  email?: string;
}

// Features:
// - SMS tab with sms: link
// - Email tab with mailto: link
// - Body/subject inputs
```

---

## Security Considerations

1. **No sensitive data in URLs** - Phone numbers in QR codes are visible
2. **PWA only on HTTPS** - Already handled (compass.ripemerchant.host)
3. **No auth tokens in deep links** - COMPASS has its own auth

---

## Testing Matrix

| Device | Browser | tel: Expected Behavior |
|--------|---------|------------------------|
| iPhone | Safari (PWA) | Opens Phone app |
| iPhone | Chrome | Opens Phone app |
| Android | Chrome (PWA) | Opens Phone app |
| Android | Samsung Internet | Opens Phone app |
| Windows | Chrome | Opens registered handler |
| Windows | Edge | Opens registered handler |
| Mac | Safari | Opens FaceTime or Contacts |
| Mac | Chrome | Opens registered handler |

---

## Future Enhancements

1. **Call Logging** - After returning to COMPASS, prompt to log call outcome
2. **Lead Context** - Pass lead ID to COMPASS, show lead info while calling
3. **Transcription** - (Not possible with native calls)
4. **Screen Pop** - Show COMPASS notification when call ends
