# Project 29: Dialer Communication Fix

**Status:** COMPLETE
**Started:** January 4, 2026
**Completed:** January 4, 2026
**Priority:** HIGH - Required for launch

## Summary

Fixed SMS and Email functionality in the standalone dialer.

## Issues Fixed

| Issue | Cause | Fix |
|-------|-------|-----|
| Email not working | Server fallback used wrong domain (`admiralenergygroup.com` → `admiralenergy.ai`) | Forced verified domain on server |
| SMS not working | Was actually working, needed testing | Confirmed working via toll-free |

## Current Configuration (Working)

### Email (Resend)
| Setting | Value |
|---------|-------|
| API Key Location | Droplet `.env` (`RESEND_API_KEY`) |
| Verified Domain | `admiralenergy.ai` |
| From Address | `Admiral Energy <sales@admiralenergy.ai>` |
| Endpoint | `/api/email/send` |
| Server File | `server/routes.ts:262-320` |

### SMS (Twilio)
| Setting | Value |
|---------|-------|
| Toll-Free Number | `+1 (833) 385-6399` |
| Status | Active (no A2P required for toll-free) |
| Endpoint | `/twilio-api/sms/send` (proxied to admiral-server:4115) |
| Client Setting | `smsPhoneNumber: "+18333856399"` |

### Voice (Twilio)
| Setting | Value |
|---------|-------|
| Outbound Number | `+1 (704) 741-4684` |
| TwiML App | ADS-Dialer (`AP005eac0c6ce687a31ac73afc26986d5b`) |
| Client Setting | `voicePhoneNumber: "+17047414684"` |

## Files Modified

| File | Change |
|------|--------|
| `server/routes.ts` | Force `admiralenergy.ai` domain for Resend API |

## Verification

- [x] SMS: Send from MessagePanel → Recipient gets text
- [x] Email: Send from MessagePanel → Email delivered (check spam for Gmail)
- [ ] Caller ID display in header (deferred - UI change)
- [ ] Mode toggle ADS/Personal (deferred - UI change)

## Environment Variables (Droplet)

```bash
# /var/www/lids/apps/ads-dashboard/.env
RESEND_API_KEY=re_xxxxx  # Set and working
```

## Related Documentation

- `apps/ads-dashboard/Dialer/DIALER.md` - Full dialer architecture
- `apps/ads-dashboard/Dialer/twilio.md` - Twilio configuration
