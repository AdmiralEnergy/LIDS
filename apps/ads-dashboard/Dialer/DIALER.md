# LIDS Dialer Architecture

## Overview

The LIDS dialer is a browser-based phone system built on Twilio Voice SDK. It enables solar sales reps to make and receive calls directly from the dashboard without needing a separate phone app.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              BROWSER (Rep's Device)                              │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                        LIDS Dashboard (React)                                ││
│  │  ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐                 ││
│  │  │ MobileDialer│───▶│ useDialer   │───▶│ Twilio Voice SDK │                 ││
│  │  │ (UI)        │    │ (Hook)      │    │ (WebRTC)         │                 ││
│  │  └─────────────┘    └──────┬──────┘    └────────┬─────────┘                 ││
│  └──────────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────┬──────────────────────────┘
                                                       │
                                                       │ 1. Fetch Twilio Token
                                                       │    POST /token
                                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ADMIRAL-SERVER (192.168.1.23 / 100.66.42.81)             │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │                      Twilio Service (:4115)                                  ││
│  │  ┌───────────────┐  ┌─────────────────┐  ┌────────────────────────────────┐ ││
│  │  │ POST /token   │  │ POST /voice/*   │  │ Environment Variables:         │ ││
│  │  │ → JWT token   │  │ → TwiML         │  │ TWILIO_ACCOUNT_SID             │ ││
│  │  │   generation  │  │   responses     │  │ TWILIO_AUTH_TOKEN              │ ││
│  │  └───────────────┘  └────────┬────────┘  │ TWILIO_API_KEY                 │ ││
│  │                              │           │ TWILIO_API_SECRET              │ ││
│  └──────────────────────────────────────────│ TWILIO_TWIML_APP_SID           │ ││
│                                             │ TWILIO_PHONE_NUMBER            │ ││
│                                             └────────────────────────────────┘ ││
└──────────────────────────────────────────────────────┬──────────────────────────┘
                                                       │
                   ┌───────────────────────────────────┼───────────────────────────┐
                   │                                   │                           │
                   ▼                                   ▼                           ▼
┌──────────────────────────┐  ┌─────────────────────────────────┐  ┌──────────────────────┐
│   Cloudflare Tunnel      │  │        Twilio Cloud             │  │   PSTN Network       │
│   (Public Webhooks)      │  │                                 │  │   (Phone Calls)      │
│                          │  │  2. WebRTC signaling            │  │                      │
│  twilio.ripemerchant.host│──│  3. Request TwiML from webhook  │──│  4. Connect to       │
│  → localhost:4115        │  │  4. Execute call instructions   │  │     recipient phone  │
└──────────────────────────┘  └─────────────────────────────────┘  └──────────────────────┘
```

## Call Flow

### Outbound Call
1. Rep clicks dial button in LIDS
2. `useDialer` hook's `dial()` function executes
3. Twilio Device (SDK) connects to Twilio Cloud via WebRTC
4. Twilio Cloud requests TwiML from `https://twilio.ripemerchant.host/voice/outbound`
5. TwiML instructs Twilio to dial the recipient's phone number
6. Call connects through PSTN to recipient's phone

### Inbound Call
1. Someone calls the Twilio phone number
2. Twilio requests TwiML from `https://twilio.ripemerchant.host/voice/inbound`
3. TwiML instructs Twilio to connect to the registered browser client
4. `useDialer` hook receives `incoming` event from Twilio Device
5. `IncomingCallModal` displays with Accept/Reject options
6. Rep accepts → call connects in browser

## Key Files

### Frontend (React)
| File | Purpose |
|------|---------|
| `client/src/hooks/useDialer.ts` | Core dialer hook - Twilio SDK initialization, call management |
| `client/src/components/dialer/MobileDialer.tsx` | Main dialer UI container |
| `client/src/components/dialer/CallControls.tsx` | Dial/hangup/mute buttons |
| `client/src/components/dialer/ContactList.tsx` | Lead list view |
| `client/src/components/dialer/LeadCardStack.tsx` | Card stack view |
| `client/src/components/IncomingCallModal.tsx` | Incoming call popup |
| `client/src/pages/dialer.tsx` | Dialer page orchestration |

### Backend (Twilio Service on admiral-server)
| File | Purpose |
|------|---------|
| `services/twilio-service/server.ts` | Express server with routes |
| `services/twilio-service/routes/token.ts` | JWT token generation for SDK |
| `services/twilio-service/routes/voice.ts` | TwiML response handlers |

## useDialer Hook API

```typescript
const {
  // State
  phoneNumber,        // Current number being dialed
  setPhoneNumber,     // Update phone number
  status,             // 'idle' | 'connecting' | 'connected' | 'error'
  duration,           // Call duration in seconds
  formattedDuration,  // "00:00" formatted
  muted,              // Mute state
  error,              // Error message if any
  configured,         // Whether Twilio is properly configured

  // Actions
  dial,               // Start outbound call
  hangup,             // End current call
  toggleMute,         // Toggle microphone

  // Inbound call
  incomingCall,       // TwilioCall object if ringing
  incomingCallerId,   // Caller's phone number
  isInbound,          // Whether current call is inbound
  acceptIncoming,     // Accept incoming call
  rejectIncoming,     // Reject incoming call
  sendToVoicemail,    // Send to voicemail
} = useDialer();
```

## Configuration

### Client Settings (lib/settings.ts)
```typescript
twilioPort: 4115,       // Twilio service port
backendHost: string,    // admiral-server Tailscale IP (100.66.42.81)
```

### Environment Variables (admiral-server)
```bash
# /home/edwardsdavid913/lids-services/twilio-service/.env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

## Network Architecture

### Tailscale Mesh (Private)
- Browser → `100.66.42.81:4115` (Tailscale IP)
- Used for: Token fetch, internal communication

### Cloudflare Tunnel (Public)
- `twilio.ripemerchant.host` → `localhost:4115`
- Used for: Twilio webhook callbacks (TwiML requests)
- Required because Twilio Cloud needs a public URL

### Why Both?
1. **Browser needs token**: Fetches via Tailscale (private, secure)
2. **Twilio needs TwiML**: Calls webhook via Cloudflare (public URL required)

## Current Production Configuration (January 2026)

### Droplet .env (`/var/www/lids/apps/ads-dashboard/.env`)
```bash
NODE_ENV=production
PORT=5000

# Twenty CRM is LOCAL on droplet
TWENTY_CRM_URL=http://localhost:3001

# Voice/Twilio on admiral-server via Tailscale
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115

BACKEND_HOST=100.66.42.81
```

### How It Works for All Users
- **No localStorage settings required** - The dialer works for anyone authenticated in Twenty CRM
- **Server-side proxy** - LIDS server proxies `/twilio-api` → `http://100.66.42.81:4115`
- **No client-side config needed** - Users don't need to configure anything in Settings

## Known Issue: "Twilio not configured" (Fixed January 4, 2026)

### Symptom
- Console showed: `[Twilio] configured: false deviceRef: false`
- Dialer wouldn't initialize, calls couldn't be made
- Worked for some users (who had localStorage settings) but not others

### Root Cause
The `useDialer.ts` hook incorrectly checked raw settings instead of the actual Twilio URL:

```javascript
// BROKEN - checked localStorage settings
if (!settings.twilioPort || !settings.backendHost) {
  setConfigured(false);  // Failed for users without localStorage
}
```

On HELM production, the proxy `/twilio-api` handles everything - `backendHost` isn't needed. But the check failed for users who didn't have it saved in localStorage.

### Fix
Changed to check the actual URL availability:

```javascript
// FIXED - checks if URL is available (proxy or direct)
const twilioUrl = getTwilioUrl();  // Returns '/twilio-api' on HELM
if (!twilioUrl) {
  setConfigured(false);
}
```

### Files Changed
- `client/src/hooks/useDialer.ts` - Use `getTwilioUrl()` instead of raw settings
- `client/src/components/dialer/CallControls.tsx` - Show hangup on error state
- `client/src/components/dialer/MobileDialer.tsx` - Pass error status through

## Troubleshooting

### "Twilio not configured" Error
1. This should NOT happen anymore after the January 4, 2026 fix
2. If it does, check the server proxy: `curl http://localhost:5000/twilio-api/health` on droplet
3. Check Twilio service: `pm2 status` on admiral-server
4. Check direct connection: `curl http://100.66.42.81:4115/health`

### Calls Don't Connect
1. Check browser console for `[Twilio]` prefixed logs
2. Verify Cloudflare tunnel is running: `curl https://twilio.ripemerchant.host/health`
3. Check cloudflared logs: `journalctl -u cloudflared -f` on admiral-server
4. Verify TwiML App SID matches in Twilio console

### No Dial/Hangup Buttons
- Ensure you're using the latest version (CallControls shows in all views)
- Check browser console for React errors
- Clear browser cache (Ctrl+F5)

### Audio Issues
- Allow microphone permission in browser
- Check speaker/headphone connection
- Try different browser (Chrome recommended)

## Native Phone Mode

LIDS also supports "native phone mode" as fallback:
- Toggle via mode switch in dialer HUD
- Uses `tel:` links to open device's phone app
- No Twilio backend required
- Limited to outbound calls (no inbound, no transcription)

## Related Services

| Service | Port | Purpose |
|---------|------|---------|
| Twilio Service | 4115 | Token generation, TwiML webhooks |
| Voice Service | 4130 | Live transcription (optional) |
| SMS Service | 4115 | SMS send/receive (same service) |

## PM2 Commands (admiral-server)

```bash
# View logs
pm2 logs twilio-service

# Restart service
pm2 restart twilio-service

# Check status
pm2 status
```

## Cloudflare Tunnel Config

Location: `/home/edwardsdavid913/.cloudflared/config.yml`

```yaml
tunnel: 89aa9da9-da00-4968-bdb8-eb40cdbd18a2
credentials-file: /home/edwardsdavid913/.cloudflared/89aa9da9-da00-4968-bdb8-eb40cdbd18a2.json

ingress:
  - hostname: twilio.ripemerchant.host
    service: http://localhost:4115
  # ... other routes ...
  - service: http_status:404
```
