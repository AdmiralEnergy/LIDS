# Project 30: COMPASS Native Phone Mode

**Status:** PLANNED
**Created:** January 4, 2026
**Priority:** HIGH - Launch feature for team
**Target:** January 5, 2026

---

## Summary

Enable Personal Native Mode for the ADS Dashboard dialer by:
1. Using system `tel:`/`sms:`/`mailto:` links (opens Zoom, Skype, Phone Link, etc.)
2. Providing a "Use your phone" option that opens COMPASS PWA on the user's mobile device
3. Adding a `/phone` route to COMPASS that acts as a native mobile dialer

---

## Problem Statement

When users select "Personal Native Mode" in ADS Dashboard:
- On Windows, `tel:` links open whatever app is registered (Zoom, Skype, Teams)
- Users actually want to use their **personal cell phone**
- No consistent way to bridge desktop → phone across all devices

**Solution:** COMPASS PWA on the phone handles native dialing. On mobile, `tel:` links open the actual phone app.

---

## Architecture

### Current Flow (ADS Business Mode)
```
ADS Dashboard (Desktop)
    │
    ▼ Twilio Voice SDK
Twilio Cloud → PSTN → Recipient
```

### New Flow (Personal Native Mode)

**Option A: System Default**
```
ADS Dashboard (Desktop)
    │
    ▼ tel: link
System Handler (Zoom/Skype/Phone Link/etc.)
```

**Option B: Use Your Phone (COMPASS)**
```
ADS Dashboard (Desktop)
    │
    ▼ QR Code / Link
COMPASS PWA (Phone)
    │
    ▼ tel: link
Native Phone App → PSTN → Recipient
```

---

## Components to Build

### 1. ADS Dashboard Changes

| File | Change |
|------|--------|
| `components/phone/PhoneApp.tsx` | Add "Use Your Phone" button in Personal Mode |
| `components/phone/QRCodeModal.tsx` | NEW - Show QR code to COMPASS /phone |

### 2. COMPASS Changes

| File | Change |
|------|--------|
| `App.tsx` | Add `/phone` route |
| `pages/phone.tsx` | NEW - Native phone dialer page |
| `components/phone/NativeDialer.tsx` | NEW - Keypad with tel: links |
| `components/phone/NativeMessagePanel.tsx` | NEW - SMS/Email with native links |
| `components/compass/AgentSidebar.tsx` | Add Phone link to sidebar |

---

## User Experience

### Desktop User (ADS Dashboard)

1. User clicks "Personal Native Mode" in dialer settings
2. Two sub-options appear:
   - **"Use This Computer"** - Opens tel: links via system (Zoom, etc.)
   - **"Use Your Phone"** - Shows QR code to COMPASS

### Mobile User (COMPASS PWA)

1. User opens COMPASS on phone (or scans QR)
2. Navigates to Phone tab
3. Enters number or uses quick dial
4. Taps call → Native phone app opens
5. Call happens on their personal phone
6. Returns to COMPASS to log/enrich call

---

## Technical Details

### Native Link Formats

| Action | Link Format | Opens |
|--------|-------------|-------|
| Call | `tel:+17045551234` | Phone app |
| SMS | `sms:+17045551234?body=Hello` | Messages app |
| Email | `mailto:test@example.com?subject=Hi&body=Hello` | Mail app |

### Deep Link to COMPASS

```
https://compass.ripemerchant.host/phone?number=+17045551234
```

If number param provided, pre-fill the dialer.

### QR Code Content

```
https://compass.ripemerchant.host/phone
```

Or with number:
```
https://compass.ripemerchant.host/phone?number=+17045551234
```

---

## Files Reference

### ADS Dashboard (ads-dashboard)
```
client/src/
├── components/phone/
│   ├── PhoneApp.tsx          # Modify: Add "Use Your Phone" option
│   └── QRCodeModal.tsx       # NEW: QR code display
├── lib/settings.ts           # Already has useNativePhone flag
```

### COMPASS
```
client/src/
├── App.tsx                   # Modify: Add /phone route
├── pages/
│   └── phone.tsx             # NEW: Phone page
├── components/
│   ├── compass/
│   │   └── AgentSidebar.tsx  # Modify: Add Phone nav item
│   └── phone/                # NEW folder
│       ├── NativeDialer.tsx  # Keypad + tel: links
│       └── NativeMessages.tsx # SMS/Email native links
```

---

## Success Criteria

- [ ] ADS Personal Mode shows "Use This Computer" and "Use Your Phone" options
- [ ] "Use This Computer" opens tel: links normally
- [ ] "Use Your Phone" shows QR code to COMPASS
- [ ] COMPASS /phone route exists and works
- [ ] COMPASS dialer uses tel: links (opens native phone on mobile)
- [ ] COMPASS SMS uses sms: links (opens native messages)
- [ ] COMPASS Email uses mailto: links (opens native mail)
- [ ] Deep link with phone number pre-fills dialer

---

## Deployment

```bash
# COMPASS
cd apps/compass
npm run build

# ADS Dashboard
cd apps/ads-dashboard
npm run build

# Deploy both
ssh root@100.94.207.1 "cd /var/www/lids && git pull && npm run build:all && pm2 restart all"
```

---

## Related Documentation

- `apps/ads-dashboard/Dialer/DIALER.md` - ADS Dialer architecture
- `apps/compass/README.md` - COMPASS overview
- `projects/active/29-dialer-communication-fix/` - Recent dialer fixes
