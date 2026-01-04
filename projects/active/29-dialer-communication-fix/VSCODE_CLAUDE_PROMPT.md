# VS Code Claude Prompt: Project 29 - Dialer Communication Fix

**Status:** IN PROGRESS
**Started:** January 4, 2026
**Priority:** HIGH

---

## Objective

Fix SMS and Email in the standalone dialer. Add mode toggle (ADS vs Personal) and display outbound number.

---

## System Context

```
You are fixing communication features in the ADS Dashboard Phone.

App: apps/ads-dashboard (React + TypeScript + Vite)
Location: C:\LifeOS\LIDS\apps\ads-dashboard\client\src\

Two modes needed:
1. ADS Mode - Twilio calls, toll-free SMS, Resend email
2. Personal Mode - Native phone app, native SMS, native mail

Current issues:
- SMS not working (backend needs verification)
- Email not working (RESEND_API_KEY not set)
- No mode toggle in UI
- No "calling from" display
```

---

## Task 1: Update PhoneApp with Mode Toggle

**File:** `components/phone/PhoneApp.tsx`

Add the following features:

1. Import `getSettings, saveSettings` from `../../lib/settings`
2. Import `useEffect` from react
3. Add state for:
   - `useNativePhone` (boolean)
   - `showSettings` (boolean)
   - `outboundNumber` (string)
   - `smsNumber` (string)

4. Load settings on mount:
```tsx
useEffect(() => {
  const settings = getSettings();
  setUseNativePhone(settings.useNativePhone);
  setOutboundNumber(settings.voicePhoneNumber || '+17047414684');
  setSmsNumber(settings.smsPhoneNumber || '+18333856399');
}, []);
```

5. Replace the fake status bar with:
```tsx
<div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-white/5">
  <div className="flex items-center gap-2">
    <div className={cn("w-2 h-2 rounded-full", useNativePhone ? "bg-orange-500" : "bg-green-500")} />
    <span className="text-xs text-zinc-400">{useNativePhone ? 'Personal' : 'ADS'}</span>
  </div>
  <div className="flex items-center gap-2">
    <span className="text-xs text-zinc-500">Calling from</span>
    <span className="text-sm font-mono text-[#00ffff]">
      {useNativePhone ? 'Your Phone' : formatPhoneDisplay(outboundNumber)}
    </span>
  </div>
  <button onClick={() => setShowSettings(true)} className="p-2 text-zinc-500 hover:text-white">
    <Settings size={18} />
  </button>
</div>
```

6. Add settings panel overlay with two mode buttons:
   - ADS Mode: Shows calls/SMS/email from business numbers
   - Personal Mode: Uses native apps

7. Wrap dial in mode check:
```tsx
const handleDial = () => {
  if (useNativePhone) {
    window.open(`tel:${phoneNumber}`, '_self');
  } else {
    dial();
  }
};
```

---

## Task 2: Update MessagePanel for Native Mode

**File:** `components/phone/MessagePanel.tsx`

When `useNativePhone` is true:
- SMS: Open `sms:${phone}?body=${encodeURIComponent(body)}`
- Email: Open `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

---

## Task 3: Configure Resend API on Droplet

**SSH to droplet:**
```bash
ssh root@100.94.207.1
```

**Add to `/var/www/lids/apps/ads-dashboard/.env`:**
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
```

**Restart service:**
```bash
pm2 restart lids
```

---

## Task 4: Verify SMS Endpoint

Check that `/twilio-api/sms/send` route exists on Twilio service:

```bash
ssh edwardsdavid913@100.66.42.81
pm2 logs twilio-service --lines 100
```

The route should accept:
```json
{
  "to": "+17045551234",
  "from": "+18333856399",
  "body": "Test message"
}
```

---

## Phone Numbers

| Purpose | Number | Notes |
|---------|--------|-------|
| Outbound Calls | +1 (704) 741-4684 | Local Charlotte number |
| SMS (Toll-free) | +1 (833) 385-6399 | No A2P registration needed |

---

## Settings Structure

```typescript
interface AppSettings {
  smsEnabled: boolean;          // true
  smsPhoneNumber: string;       // '+18333856399'
  voicePhoneNumber: string;     // '+17047414684'
  useNativePhone: boolean;      // false = ADS, true = Personal
  emailEnabled: boolean;        // true
  emailFrom: string;            // 'Admiral Energy <sales@admiralenergy.com>'
}
```

---

## Testing

1. **ADS Mode SMS:**
   - Open Messages tab
   - Enter any phone number
   - Send message
   - Check Twilio logs for delivery

2. **ADS Mode Email:**
   - Open Messages tab
   - Switch to Email tab
   - Enter any email
   - Send message
   - Check Resend dashboard

3. **Personal Mode:**
   - Click settings gear
   - Switch to Personal Mode
   - Dial a number - should open native phone
   - Send SMS - should open native Messages app
   - Send email - should open native Mail app

---

## Files to Modify

| File | Changes |
|------|---------|
| `components/phone/PhoneApp.tsx` | Add mode toggle, settings panel, outbound display |
| `components/phone/MessagePanel.tsx` | Add native mode handling |
| Droplet `.env` | Add RESEND_API_KEY |

---

## Deploy

```bash
cd C:\LifeOS\LIDS
git add -A
git commit -m "feat(dialer): add ADS/Personal mode toggle, display calling number"
git push
ssh root@100.94.207.1 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids"
```
