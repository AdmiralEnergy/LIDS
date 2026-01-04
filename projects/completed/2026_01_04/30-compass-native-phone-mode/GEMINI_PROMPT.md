# Gemini Implementation Prompt: COMPASS Native Phone Mode

**Project:** 30 - COMPASS Native Phone Mode
**Priority:** HIGH - Launch by January 5, 2026
**Estimated Time:** 4 hours

---

## System Context

```
You are implementing Personal Native Phone Mode for the LIDS ecosystem.

There are TWO apps involved:
1. ADS Dashboard (apps/ads-dashboard) - Desktop dialer, already has mode toggle
2. COMPASS (apps/compass) - Mobile PWA, needs new /phone route

The goal: When users select "Personal Native Mode" in ADS Dashboard, they can either:
- Use their computer's phone handler (tel: links → Zoom, Skype, Phone Link, etc.)
- Use their actual phone via COMPASS PWA (tel: links → native phone app)

COMPASS is already a PWA that agents install on their phones. We're adding a Phone tab
that uses tel:/sms:/mailto: links to open native apps.

Key constraint: This is a launch feature needed by tomorrow. Keep it simple and functional.
```

---

## Phase 1: COMPASS - Add /phone Route (Priority: CRITICAL)

### Task 1.1: Create Phone Page

**File:** `apps/compass/client/src/pages/phone.tsx`

Create a new page with a native phone dialer:

```tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Phone, MessageSquare, Mail, Delete, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Helper to format phone display
function formatPhoneDisplay(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `+${digits.slice(0, 1)} (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 11)}`;
}

// Format for tel: link
function formatForTel(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+${digits}`;
}

export default function PhonePage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showMessages, setShowMessages] = useState(false);
  const [messageType, setMessageType] = useState<'sms' | 'email'>('sms');
  const [messageBody, setMessageBody] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');

  // Check for phone number in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const number = params.get('number');
    if (number) {
      setPhoneNumber(number.replace(/\D/g, ''));
    }
  }, []);

  const handleDigit = (digit: string) => {
    if (phoneNumber.length < 15) {
      setPhoneNumber(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber.length >= 10) {
      const telUrl = `tel:${formatForTel(phoneNumber)}`;
      window.open(telUrl, '_self');
      // Save to recent (optional)
      saveToRecent(phoneNumber);
    }
  };

  const handleSms = () => {
    if (phoneNumber.length >= 10) {
      const body = encodeURIComponent(messageBody);
      const smsUrl = messageBody
        ? `sms:${formatForTel(phoneNumber)}?body=${body}`
        : `sms:${formatForTel(phoneNumber)}`;
      window.open(smsUrl, '_self');
    }
  };

  const handleEmail = () => {
    if (email) {
      const params = new URLSearchParams();
      if (subject) params.set('subject', subject);
      if (messageBody) params.set('body', messageBody);
      const mailtoUrl = `mailto:${email}?${params.toString()}`;
      window.open(mailtoUrl, '_self');
    }
  };

  const saveToRecent = (number: string) => {
    try {
      const recent = JSON.parse(localStorage.getItem('compass_recent_calls') || '[]');
      const updated = [number, ...recent.filter((n: string) => n !== number)].slice(0, 10);
      localStorage.setItem('compass_recent_calls', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save recent call:', e);
    }
  };

  const digits = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#'],
  ];

  return (
    <div className="flex flex-col h-full bg-black text-white">
      {/* Header */}
      <div className="p-4 text-center border-b border-zinc-800">
        <h1 className="text-lg font-semibold text-orange-500">Personal Phone</h1>
        <p className="text-xs text-zinc-500">Uses your device's native phone app</p>
      </div>

      {/* Phone number display */}
      <div className="flex-shrink-0 p-6 text-center">
        <div className="text-3xl font-light tracking-wider min-h-[44px]">
          {formatPhoneDisplay(phoneNumber) || (
            <span className="text-zinc-600">Enter number</span>
          )}
        </div>
      </div>

      {/* Keypad */}
      <div className="flex-1 flex flex-col justify-center px-8 pb-4">
        <div className="grid grid-cols-3 gap-4">
          {digits.map((row, rowIndex) => (
            row.map((digit) => (
              <button
                key={digit}
                onClick={() => handleDigit(digit)}
                className="aspect-square rounded-full bg-zinc-800 hover:bg-zinc-700
                           text-2xl font-light flex items-center justify-center
                           active:bg-zinc-600 transition-colors"
              >
                {digit}
              </button>
            ))
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex-shrink-0 px-8 pb-8">
        {/* Call button */}
        <div className="flex justify-center mb-4">
          <button
            onClick={handleCall}
            disabled={phoneNumber.length < 10}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400
                       disabled:bg-zinc-700 disabled:cursor-not-allowed
                       flex items-center justify-center transition-colors"
          >
            <Phone className="w-7 h-7 text-white" />
          </button>
        </div>

        {/* Secondary buttons */}
        <div className="flex justify-center gap-8">
          <button
            onClick={() => { setMessageType('sms'); setShowMessages(true); }}
            disabled={phoneNumber.length < 10}
            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MessageSquare className="w-5 h-5 text-blue-400" />
          </button>

          <button
            onClick={handleBackspace}
            disabled={phoneNumber.length === 0}
            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Delete className="w-5 h-5 text-zinc-400" />
          </button>

          <button
            onClick={() => { setMessageType('email'); setShowMessages(true); }}
            className="p-3 rounded-full bg-zinc-800 hover:bg-zinc-700"
          >
            <Mail className="w-5 h-5 text-orange-400" />
          </button>
        </div>
      </div>

      {/* Messages overlay */}
      {showMessages && (
        <div className="absolute inset-0 bg-black/95 flex flex-col">
          <div className="p-4 flex items-center border-b border-zinc-800">
            <button onClick={() => setShowMessages(false)} className="p-2">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="flex-1 text-center font-semibold">
              {messageType === 'sms' ? 'Send SMS' : 'Send Email'}
            </span>
            <div className="w-10" />
          </div>

          <div className="flex-1 p-4 space-y-4">
            {messageType === 'sms' ? (
              <>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">To (Phone)</label>
                  <input
                    value={formatPhoneDisplay(phoneNumber)}
                    readOnly
                    className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Message</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 resize-none"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">To (Email)</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Subject</label>
                  <input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1 block">Message</label>
                  <textarea
                    value={messageBody}
                    onChange={(e) => setMessageBody(e.target.value)}
                    placeholder="Type your message..."
                    rows={4}
                    className="w-full p-3 bg-zinc-900 rounded-lg border border-zinc-800 resize-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="p-4">
            <button
              onClick={messageType === 'sms' ? handleSms : handleEmail}
              disabled={messageType === 'sms' ? phoneNumber.length < 10 : !email}
              className="w-full p-4 bg-orange-500 hover:bg-orange-400 rounded-lg font-semibold
                         disabled:bg-zinc-700 disabled:cursor-not-allowed transition-colors"
            >
              {messageType === 'sms' ? 'Open Messages App' : 'Open Mail App'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Task 1.2: Add Route to App.tsx

**File:** `apps/compass/client/src/App.tsx`

Add the phone route:

```tsx
// Add import at top
import PhonePage from "@/pages/phone";

// In Router component, add route:
<Route path="/phone">
  <PhonePage />
</Route>
```

### Task 1.3: Add Phone to Sidebar

**File:** `apps/compass/client/src/components/compass/AgentSidebar.tsx`

Add Phone navigation item. Look for the existing nav items (Commands, Chat, LiveWire) and add:

```tsx
import { Phone } from 'lucide-react';

// In the nav items array/section, add:
{
  title: "Phone",
  icon: Phone,
  href: "/phone",
}
```

The sidebar already has a pattern for nav items - follow the existing structure for Commands, Chat, etc.

---

## Phase 2: ADS Dashboard - Update Personal Mode UI (Priority: HIGH)

### Task 2.1: Add "Use Your Phone" Option

**File:** `apps/ads-dashboard/client/src/components/phone/PhoneApp.tsx`

In the Personal Native Mode section of the settings panel, add a sub-option to open COMPASS:

1. Find the Personal Native Mode card in the settings overlay
2. When Personal Mode is selected, show two sub-options:
   - "Use This Computer" (default behavior, tel: links)
   - "Use Your Phone" (shows QR code or link to COMPASS)

Add this inside the Personal Native Mode card:

```tsx
{useNativePhone && (
  <div className="mt-3 space-y-2 border-t border-zinc-700 pt-3">
    <p className="text-xs text-zinc-400">Dial using:</p>
    <div className="flex gap-2">
      <button
        className="flex-1 p-2 text-xs bg-zinc-700 hover:bg-zinc-600 rounded"
        onClick={() => {/* keep default behavior */}}
      >
        This Computer
      </button>
      <button
        className="flex-1 p-2 text-xs bg-orange-500/20 border border-orange-500
                   text-orange-400 hover:bg-orange-500/30 rounded"
        onClick={() => {
          // Open COMPASS phone URL
          const url = phoneNumber
            ? `https://compass.ripemerchant.host/phone?number=${encodeURIComponent(phoneNumber)}`
            : 'https://compass.ripemerchant.host/phone';
          window.open(url, '_blank');
        }}
      >
        Your Phone →
      </button>
    </div>
    <p className="text-[10px] text-zinc-500 text-center">
      Open COMPASS on your phone to dial with your personal number
    </p>
  </div>
)}
```

### Task 2.2 (Optional): Add QR Code Modal

If you have time, add a QR code generator using a library like `qrcode.react`:

```bash
cd apps/ads-dashboard
npm install qrcode.react
```

Then create a simple modal that shows the QR code:

```tsx
import { QRCodeSVG } from 'qrcode.react';

function QRCodeModal({ isOpen, onClose, phoneNumber }) {
  const url = phoneNumber
    ? `https://compass.ripemerchant.host/phone?number=${encodeURIComponent(phoneNumber)}`
    : 'https://compass.ripemerchant.host/phone';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-zinc-900 p-6 rounded-xl max-w-sm">
        <h3 className="text-lg font-semibold text-center mb-4">Scan with your phone</h3>
        <div className="bg-white p-4 rounded-lg">
          <QRCodeSVG value={url} size={200} />
        </div>
        <p className="text-xs text-zinc-400 text-center mt-4">
          Opens COMPASS phone dialer
        </p>
        <button
          onClick={onClose}
          className="w-full mt-4 p-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  );
}
```

---

## Phase 3: Testing

### Test Checklist

1. **COMPASS /phone route**
   - [ ] Opens without errors
   - [ ] Keypad enters numbers correctly
   - [ ] Phone number formats as you type
   - [ ] Call button disabled until 10 digits entered
   - [ ] Tapping call opens native phone app (test on actual phone)
   - [ ] SMS button opens messages overlay
   - [ ] SMS send opens native Messages app
   - [ ] Email send opens native Mail app

2. **URL Parameters**
   - [ ] `compass.ripemerchant.host/phone?number=7045551234` pre-fills number

3. **ADS Dashboard**
   - [ ] Personal Mode shows "Use Your Phone" option
   - [ ] Clicking "Use Your Phone" opens COMPASS URL (or shows QR)
   - [ ] Phone number is passed in URL if one is entered

4. **Cross-device**
   - [ ] Works on iPhone (Safari, Chrome)
   - [ ] Works on Android (Chrome)
   - [ ] Works on desktop (links work even if handler varies)

---

## Deployment

After implementation:

```bash
# Build both apps
cd C:\LifeOS\LIDS
npm run build:all

# Or individually:
cd apps/compass && npm run build
cd apps/ads-dashboard && npm run build

# Commit
git add -A
git commit -m "feat: add COMPASS native phone mode for Personal dialing"
git push

# Deploy
ssh root@100.94.207.1 "cd /var/www/lids && git pull && npm run build:all && pm2 restart all"
```

---

## Reference Files

| File | Purpose |
|------|---------|
| `apps/compass/client/src/App.tsx` | Add route |
| `apps/compass/client/src/pages/phone.tsx` | NEW - Main phone page |
| `apps/compass/client/src/components/compass/AgentSidebar.tsx` | Add nav item |
| `apps/ads-dashboard/client/src/components/phone/PhoneApp.tsx` | Add COMPASS link |

---

## Notes

- Keep styling consistent with existing COMPASS design (dark theme, shadcn components)
- The orange color (#f97316 or orange-500) represents Personal/Native mode
- Test on actual mobile device - simulators don't handle tel: links properly
- QR code is nice-to-have; direct link works fine for MVP
