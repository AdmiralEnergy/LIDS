# Session Context - January 4, 2026

## What Was Done This Session

### Project 28: Standalone Dialer - COMPLETE
- All phone components were already created by Gemini
- **Issue Found:** Code was NOT committed/deployed
- **Fixed:** Committed and deployed to droplet
- Dialer is now live at https://helm.ripemerchant.host/dialer

### Project 29: Dialer Communication Fix - CREATED
- Created project folder with README and VS Code prompt
- Documents remaining issues with SMS/Email

---

## Current State

### Working
- iPhone-style phone UI with tabs (Keypad | Recents | Favorites | Messages)
- Twilio calling via useDialer hook
- Auto-disposition after calls
- XP progression tracking
- Call history in Recents tab
- Favorites stored in localStorage

### Not Working
- **SMS:** Backend route may not be wired correctly
- **Email:** RESEND_API_KEY not set on droplet
- **Mode Toggle:** Not implemented (ADS vs Personal)
- **Outbound Number Display:** Not implemented ("Calling from")

---

## Files Structure

```
components/phone/
├── PhoneApp.tsx      # Main container with tabs
├── KeypadTab.tsx     # Number pad
├── RecentsTab.tsx    # Call history from Dexie
├── FavoritesTab.tsx  # Quick dial (localStorage)
├── InCallOverlay.tsx # Active call UI
└── MessagePanel.tsx  # SMS + Email + Both
```

---

## User Requirements for Next Session

1. **Two Modes:**
   - **ADS Mode:** Twilio dialer, toll-free SMS (+18333856399), Resend email
   - **Personal Mode:** Native phone app, native SMS, native mail

2. **Display "Calling from"** number in header (not caller ID - that's incoming)

3. **Configure Backend:**
   - Add RESEND_API_KEY to droplet .env
   - Verify SMS endpoint works

---

## Phone Numbers

| Purpose | Number |
|---------|--------|
| Outbound Voice | +1 (704) 741-4684 |
| SMS (Toll-free) | +1 (833) 385-6399 |

---

## Key Files to Modify

| File | Changes Needed |
|------|----------------|
| `components/phone/PhoneApp.tsx` | Add mode toggle, settings panel, outbound number display |
| `components/phone/MessagePanel.tsx` | Handle native mode (tel:/sms:/mailto: links) |
| `lib/settings.ts` | Already has useNativePhone flag |
| Droplet `.env` | Add RESEND_API_KEY |

---

## Prompt Location

Detailed implementation prompt for VS Code Claude:
`C:\LifeOS\LIDS\projects\active\29-dialer-communication-fix\VSCODE_CLAUDE_PROMPT.md`

---

## Deploy Command

```bash
ssh root@100.94.207.1 "cd /var/www/lids && git pull && cd apps/ads-dashboard && npm run build && pm2 restart lids"
```

---

## Clarifications from User

- "Caller ID" = detecting INCOMING calls (not what we need)
- "Calling from" = displaying OUTBOUND number (what we need)
- Two modes: ADS (business) vs Personal (native phone apps)
- User has Resend API key ready to configure

---

*Saved: January 4, 2026*
