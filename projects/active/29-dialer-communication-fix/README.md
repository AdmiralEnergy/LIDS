# Project 29: Dialer Communication Fix

**Status:** IN PROGRESS
**Started:** January 4, 2026
**Priority:** HIGH - Required for launch

## Summary

Fix SMS and Email functionality in the standalone dialer. Add caller ID display and native phone mode toggle.

## Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| SMS not working | Twilio SMS proxy not configured or backend not handling | Wire /twilio-api/sms/send route |
| Email not working | RESEND_API_KEY not set, emailFrom empty | Set env var, configure from address |
| No caller ID display | UI doesn't show outbound number | Add voicePhoneNumber display |
| No mode toggle | Can't switch to native phone | Add toggle in UI |

## Required Configuration

### On Droplet (.env)
```env
RESEND_API_KEY=re_xxxx  # User has this key
```

### In Settings (Default)
```javascript
smsPhoneNumber: "+18333856399"    // Already configured
voicePhoneNumber: "+17047414684"  // Already configured
emailFromAddress: "sales@admiralenergy.com"  // Needs setting
```

## Tasks

### Phase 1: Email Fix (Backend)

- [ ] Add RESEND_API_KEY to droplet .env
- [ ] Verify /api/email/send endpoint works
- [ ] Set default emailFromAddress in settings.ts

### Phase 2: SMS Fix (Backend)

- [ ] Verify Twilio service has /sms/send route
- [ ] Verify proxy forwards correctly
- [ ] Test SMS from MessagePanel

### Phase 3: Caller ID Display (Frontend)

- [ ] Add caller ID badge to KeypadTab header
- [ ] Show voicePhoneNumber from settings
- [ ] Style like iPhone caller ID display

### Phase 4: Mode Toggle (Frontend)

- [ ] Add settings toggle in PhoneApp
- [ ] Toggle between Twilio and native phone
- [ ] Use tel: links for native mode
- [ ] Use sms: links for native SMS

## Files to Modify

| File | Changes |
|------|---------|
| `components/phone/KeypadTab.tsx` | Add caller ID display |
| `components/phone/PhoneApp.tsx` | Add settings/mode toggle |
| `lib/settings.ts` | Set default emailFromAddress |
| Droplet .env | Add RESEND_API_KEY |

## Verification

1. SMS: Send from MessagePanel → Recipient gets text
2. Email: Send from MessagePanel → Recipient gets email
3. Caller ID: Shows "+1 (704) 741-4684" in header
4. Mode: Toggle shows/hides Twilio vs Native options
