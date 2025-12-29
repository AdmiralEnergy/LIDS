# Twilio Configuration

**Account:** LifeOS LiveWire Agent
**Last Updated:** December 28, 2025

---

## Quick Reference - All Webhook URLs

Copy-paste these exact URLs into Twilio Console:

### TwiML App (ADS-Dialer)
| Field | URL |
|-------|-----|
| Voice Request URL | `https://twilio.ripemerchant.host/voice/outbound` |
| Voice Fallback URL | `https://twilio.ripemerchant.host/sms/fallback` |
| Voice Status Callback | `https://twilio.ripemerchant.host/voice/status` |
| SMS Request URL | `https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| SMS Fallback URL | `https://twilio.ripemerchant.host/sms/fallback` |
| SMS Status Callback | `https://helm.ripemerchant.host/api/ads/dialer/sms/status` |

### Phone Numbers (833 & 704)
| Field | URL |
|-------|-----|
| A call comes in | `https://twilio.ripemerchant.host/voice/inbound` |
| Primary handler fails | `https://twilio.ripemerchant.host/voice/fallback` |
| A message comes in | `https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| SMS Primary handler fails | `https://twilio.ripemerchant.host/sms/fallback` |

### Number Capabilities
| Number | Voice | SMS |
|--------|-------|-----|
| (833) 385-6399 | ✅ Active | ✅ Active (toll-free exempt) |
| (704) 741-4684 | ✅ Active | ⏳ Pending A2P approval |

---

## LIDS SMS Integration

**Status:** ✅ Ready for use

LIDS is configured to use the **toll-free number (+1 833 385 6399)** for SMS.

### Configuration

| Setting | Value |
|---------|-------|
| Default SMS Number | `+18333856399` |
| Configured in | `client/src/lib/settings.ts` |
| Send Endpoint | `/twilio-api/sms/send` (proxied to twilio-service:4115) |
| Inbound Webhook | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| Status Webhook | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/status` |

### Send Flow

```
Client (useSms.ts)
    ↓ POST /twilio-api/sms/send
LIDS Server (proxy)
    ↓
twilio-service:4115 (admiral-server)
    ↓
Twilio API
    ↓
Recipient Phone
```

### Receive Flow

```
Customer replies to +18333856399
    ↓
Twilio Webhook
    ↓ POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound
LIDS Server (routes.ts)
    ↓ Store in memory
Client polls /api/ads/dialer/sms/inbound
    ↓ Sync to Dexie
Messages appear in ActionPanel
```

### Twilio Console Configuration Required

To receive inbound SMS on the toll-free number, update the messaging webhook:

1. Go to Twilio Console → Phone Numbers → +1 833 385 6399
2. Under "Messaging" section:
   - **A message comes in:** `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound`
   - **Primary handler fails:** `POST https://twilio.ripemerchant.host/sms/fallback`

---

## Messaging Services

### My New Notifications Service - Netlify

| Property | Value |
|----------|-------|
| Name | My New Notifications Service - Netlify |
| Use Case | Notify my users |
| Messaging Service SID | `MG49e15209620493a2121faa57a12d2f28` |

Used by the toll-free number (833) 385-6399 for SMS handling.

---

## TwiML Apps

### ADS-Dialer

The primary TwiML app used by the LIDS dialer for outbound calls.

| Property | Value |
|----------|-------|
| Friendly Name | ADS-Dialer |
| TwiML App SID | `AP005eac0c6ce687a31ac73afc26986d5b` |

#### Voice Configuration

| Setting | Value |
|---------|-------|
| Request URL | `POST https://twilio.ripemerchant.host/voice/outbound` |
| Fallback URL | `POST https://twilio.ripemerchant.host/sms/fallback` |
| Status Callback URL | `POST https://twilio.ripemerchant.host/voice/status` |
| Caller Name Lookup | Disabled |
| Allow Application Dialing | Disabled |

#### Messaging Configuration

| Setting | Value |
|---------|-------|
| Request URL | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| Fallback URL | `POST https://twilio.ripemerchant.host/sms/fallback` |
| Status Callback URL | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/status` |

---

## Active Phone Numbers

| Number | Friendly Name | Type | Location | Capabilities |
|--------|---------------|------|----------|--------------|
| +1 833 385 6399 | (833) 385-6399 | Toll-free | N/A | Voice, SMS, MMS, Fax |
| +1 704 741 4684 | (704) 741-4684 | Local | Charlotte, NC, US | Voice, SMS, MMS, Fax |

---

## Number 1: Toll-Free (+1 833 385 6399)

**SMS Status:** ✅ **Active** - Toll-free numbers are exempt from A2P 10DLC

### Voice Configuration

| Setting | Value |
|---------|-------|
| Routing | Regional - United States (US1) |
| Configure with | Webhook |
| A call comes in | `POST https://twilio.ripemerchant.host/voice/inbound` |
| Primary handler fails | `POST https://twilio.ripemerchant.host/voice/fallback` |
| Call status changes | HTTP POST |
| Caller Name Lookup | Disabled |

**Emergency Calling:**
- Status: Emergency Address is registered
- Address: 801 Manor Drive, Kings Mountain, North Carolina, United States, 28086

### Messaging Configuration

| Setting | Value |
|---------|-------|
| Routing | Regional - United States (US1) |
| Messaging Service | My New Notifications Service - Netlify |
| A message comes in | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| Primary handler fails | `POST https://twilio.ripemerchant.host/sms/fallback` |

---

## Number 2: Local (+1 704 741 4684)

**SMS Status:** ⏳ **Pending A2P 10DLC Approval** - Cannot send SMS until campaign approved

### Voice Configuration

| Setting | Value |
|---------|-------|
| Routing | Regional - United States (US1) |
| Configure with | Webhook |
| A call comes in | `POST https://twilio.ripemerchant.host/voice/inbound` |
| Primary handler fails | `POST https://twilio.ripemerchant.host/voice/fallback` |
| Call status changes | HTTP POST |
| Caller Name Lookup | Disabled |

**Emergency Calling:**
- Status: Emergency Address is registered
- Address: 801 Manor Drive, Kings Mountain, North Carolina, United States, 28086

### Messaging Configuration

| Setting | Value |
|---------|-------|
| Status | ⏳ **A2P 10DLC Campaign Under Review** |
| A message comes in | `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` |
| Primary handler fails | `POST https://twilio.ripemerchant.host/sms/fallback` |

**Note:** SMS blocked until A2P Campaign is approved. Submitted December 25, 2025 - expect 2-4 weeks for review.

---

## Webhook Endpoints Summary

### Voice Webhooks

| Endpoint | Purpose | Source |
|----------|---------|--------|
| `https://twilio.ripemerchant.host/voice/outbound` | TwiML for outbound calls | TwiML App (ADS-Dialer) |
| `https://twilio.ripemerchant.host/voice/inbound` | Inbound call handler | Both phone numbers |
| `https://twilio.ripemerchant.host/voice/fallback` | Fallback handler | Both phone numbers |
| `https://twilio.ripemerchant.host/voice/status` | Call status updates | TwiML App (ADS-Dialer) |

### SMS Webhooks

| Endpoint | Purpose | Source |
|----------|---------|--------|
| `https://helm.ripemerchant.host/api/ads/dialer/sms/inbound` | Inbound SMS handler | TwiML App (ADS-Dialer) |
| `https://helm.ripemerchant.host/api/ads/dialer/sms/status` | SMS status callback | TwiML App (ADS-Dialer) |
| `https://twilio.ripemerchant.host/sms/fallback` | SMS fallback | TwiML App (ADS-Dialer) |
| `https://twilio.ripemerchant.host/sms` | Inbound SMS handler | Toll-free Number |

---

## Architecture Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TWIML APP (ADS-Dialer)                      │
│                   SID: AP005eac0c6ce687a31ac73afc26986d5b           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  LIDS Browser Dialer (Voice SDK)                                   │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │ Outbound Call → twilio.ripemerchant.host/voice/outbound │       │
│  │ Status Updates → twilio.ripemerchant.host/voice/status  │       │
│  │ SMS Inbound → helm.ripemerchant.host/api/ads/dialer/sms │       │
│  └─────────────────────────────────────────────────────────┘       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        TWILIO PHONE NUMBERS                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Toll-Free (833) 385-6399          Local (704) 741-4684            │
│  ┌─────────────────────┐           ┌─────────────────────┐         │
│  │ Voice → twilio.     │           │ Voice → twilio.     │         │
│  │   ripemerchant.host │           │   ripemerchant.host │         │
│  │   /voice/inbound    │           │   /voice/inbound    │         │
│  │                     │           │                     │         │
│  │ SMS → helm.         │           │ SMS → helm.         │         │
│  │   ripemerchant.host │           │   ripemerchant.host │         │
│  │   /api/ads/dialer/  │           │   /api/ads/dialer/  │         │
│  │   sms/inbound       │           │   sms/inbound       │         │
│  │                     │           │   (pending A2P)     │         │
│  └─────────────────────┘           └─────────────────────┘         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BACKEND SERVICES                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  twilio.ripemerchant.host (port 4115)                              │
│  ├── /voice/outbound    (TwiML for outbound calls)                 │
│  ├── /voice/inbound     (Handle incoming calls)                    │
│  ├── /voice/fallback    (Error handling)                           │
│  ├── /voice/status      (Call status callbacks)                    │
│  └── /sms/fallback      (SMS error handling)                       │
│                                                                     │
│  helm.ripemerchant.host                                            │
│  └── /api/ads/dialer/sms/inbound (SMS webhook handler)             │
│  └── /api/ads/dialer/sms/status  (SMS status callback)             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## LIDS App Integration

The LIDS dialer uses Twilio Voice SDK for outbound calls via the **ADS-Dialer** TwiML app.

### Outbound Calls (from LIDS)
- Uses Twilio Voice SDK in browser
- TwiML App: `ADS-Dialer` (AP005eac0c6ce687a31ac73afc26986d5b)
- TwiML Request: `POST https://twilio.ripemerchant.host/voice/outbound`
- Status Callback: `POST https://twilio.ripemerchant.host/voice/status`
- Backend Token Provider: `admiral-server` at `http://100.66.42.81:4115` (Twilio Service)

### Inbound Calls
- Both numbers route to: `https://twilio.ripemerchant.host/voice/inbound`
- Fallback: `https://twilio.ripemerchant.host/voice/fallback`

### SMS (via TwiML App)
- Inbound: `POST https://helm.ripemerchant.host/api/ads/dialer/sms/inbound`
- Status: `POST https://helm.ripemerchant.host/api/ads/dialer/sms/status`
- Fallback: `POST https://twilio.ripemerchant.host/sms/fallback`

### SMS (Phone Number Direct)
- Toll-free: Handled by Netlify Notifications Service
- Local: Routed to LIDS dialer endpoint for processing

---

## A2P 10DLC Registration

**Status:** ⏳ Campaign Under Review (submitted December 25, 2025)
**Expected Approval:** 2-3 weeks

### Registration Progress

| Step | Status | Cost |
|------|--------|------|
| 1. Customer Profile | ✅ Approved | Free |
| 2. Standard Brand | ✅ Registered | $46 (paid) |
| 3. Standard Campaign | ⏳ In Progress | $15 + $1.50-10/mo |

### A2P Brand Details

| Property | Value |
|----------|-------|
| Brand Name | David Edwards |
| Brand Registration SID | `BNb37ce8a619b83aaa788e660dc8754c9c` |
| Status | ✅ Registered |

### Campaign Details

| Property | Value |
|----------|-------|
| Campaign SID | `CM57a549dbb24a9951a2...` |
| Campaign Use Case | Low Volume Mixed |
| Linked Messaging Service | `MG49e15209620493a2121faa57a12d2f28` |
| Status | ⏳ In Progress (Under Review) |

### Campaign Description

> This campaign sends appointment confirmations, follow-up messages, and scheduling reminders to homeowners who have inquired about solar energy services through Admiral Energy. Messages include appointment times, representative information, and service updates.

### Sample Messages

**Sample #1:**
> Hi {FirstName}, this is {RepName} from Admiral Energy. Just confirming your solar consultation appointment for {Date} at {Time}. Reply YES to confirm or call us to reschedule.

**Sample #2:**
> Thanks for speaking with us about solar! I wanted to follow up on your questions. Feel free to call or text me back at your convenience. - {RepName}, Admiral Energy

### Consent & Opt-In

| Setting | Value |
|---------|-------|
| Opt-in Keywords | `YES, START, INFO, SOLAR` |
| Opt-in Message | Admiral Energy: You are now opted-in to receive solar service updates. Reply HELP for assistance or STOP to opt-out. Msg & data rates may apply. |
| Messages include phone numbers | Yes |
| Messages include links | No |
| Direct lending content | No |
| Age-gated content | No |

### Consent Collection Method

End users opt-in by:
1. Submitting an inquiry form on admiralenergy.ai (checkbox consent)
2. Verbally requesting information during phone calls (verbal confirmation)

### After Approval

Once the campaign is approved:
- 704 local number will be able to send/receive SMS
- Both numbers will route to LIDS for unified SMS handling
- Messaging throughput limits will be provided by TCR (The Campaign Registry)

---

## Number Capabilities Reference

From Twilio documentation:
- `*` Can send/receive calls to domestic numbers only
- `†` Can send/receive SMS to domestic numbers only
- `‡` This number does NOT support SIP Trunking
- `▲` Can make emergency calls
- `(national)` A non-geographic number
- `(beta)` This number is new to the Twilio Platform
- `(hosted)` This number is hosted on the Twilio Platform

---

---

## Call Recording & Transcription (STT)

### Transcription Service

| Property | Value |
|----------|-------|
| Service | `transcription-service` |
| Port | 4097 |
| Host | admiral-server (192.168.1.23 / 100.66.42.81 via Tailscale) |
| Engine | faster-whisper (local Whisper, no cloud costs) |
| PM2 Status | ✅ RUNNING |

### Transcription Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/status` | GET | Model status (base model loaded) |
| `/transcribe/file` | POST | Upload audio file for transcription |
| `/transcribe/url` | POST | Transcribe from URL (e.g., Twilio recording URL) |
| `/webhook/twilio/recording` | POST | Twilio recording callback webhook |

### Recording Webhook Flow (Planned)

```
Call Ends (Twilio)
       ↓
Recording complete callback
       ↓
POST https://agents.ripemerchant.host/transcribe/webhook
       ↓
transcription-service:4097 receives RecordingSid, RecordingUrl
       ↓
Download + transcribe via faster-whisper
       ↓
POST transcript to Twenty CRM (Note on Person record)
```

### Twilio Recording Configuration (TODO)

To enable call recording with transcription:

1. **TwiML App Configuration**
   - Set recording callback URL: `https://agents.ripemerchant.host/transcribe/webhook`
   - Recording events: `completed`

2. **Recording Settings**
   - Format: MP3 or WAV
   - Channels: Dual (separate customer/agent tracks preferred)
   - Trim silence: Enabled

### Voice Service vs Transcription Service

| Feature | voice-service (4130) | transcription-service (4097) |
|---------|---------------------|------------------------------|
| Purpose | COMPASS voice chat | Call recording transcription |
| STT | faster-whisper | faster-whisper |
| TTS | Piper (agent voices) | ❌ None |
| Input | Live mic audio | Files, URLs, webhooks |
| Live streaming | ✅ Yes | ❌ Batch only |
| Twilio webhooks | ❌ No | ✅ Yes |

---

## Twilio Service (SDK Token Provider)

| Property | Value |
|----------|-------|
| Service | `twilio-service` |
| Port | 4115 |
| Host | admiral-server |
| PM2 Status | ✅ RUNNING |

### Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Health check |
| `/token` | POST | Generate Voice SDK token for browser |

### Token Request

```bash
curl -X POST http://100.66.42.81:4115/token \
  -H "Content-Type: application/json" \
  -d '{"identity": "rep-user-id"}'
```

Returns JWT token for Twilio Voice SDK browser client.

---

## Twilio Media Streams (Live Transcription)

**Status:** ✅ Backend Ready | ⏳ Cloudflare Route Pending

### Architecture

```
Twilio Call
    │
    ▼
TwiML <Stream> directive
    │
    ▼ WebSocket
wss://agents.ripemerchant.host/stream
    │
    ▼ Cloudflare Tunnel
transcription-service:4097/stream
    │
    ▼
faster-whisper (local)
    │
    ▼ WebSocket response
LIDS Browser → useTranscription hook
```

### Backend Endpoint (Ready)

| Property | Value |
|----------|-------|
| Service | `transcription-service` |
| Port | 4097 |
| WebSocket Path | `/stream` |
| Protocol | Twilio Media Streams JSON |
| Local Test | `ws://192.168.1.23:4097/stream` |

### Cloudflare Tunnel Configuration (TODO)

**Dashboard:** Cloudflare Zero Trust → Tunnels → Select Tunnel → Public Hostnames

Add route:
| Subdomain | Domain | Path | Service |
|-----------|--------|------|---------|
| agents | ripemerchant.host | /stream | ws://localhost:4097 |

**Important:** Enable WebSocket support in the route settings.

### TwiML Configuration (TODO)

Update TwiML app response to include `<Stream>`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Start>
    <Stream url="wss://agents.ripemerchant.host/stream" track="inbound_track"/>
  </Start>
  <Dial callerId="+17047414684">
    <Number>{{To}}</Number>
  </Dial>
</Response>
```

**Location:** Update the TwiML endpoint at `agents.ripemerchant.host/twiml/outbound`

### WebSocket Protocol

**Twilio → Server (incoming):**
```json
{"event": "connected", "protocol": "Call", "version": "1.0.0"}
{"event": "start", "streamSid": "MZ...", "start": {"callSid": "CA..."}}
{"event": "media", "media": {"payload": "<base64 mulaw audio>"}}
{"event": "stop"}
```

**Server → Client (outgoing):**
```json
{"event": "ready", "streamSid": "MZ..."}
{"event": "transcript", "text": "Hello...", "is_final": false, "speaker": "customer"}
{"event": "transcript", "text": "Full text...", "is_final": true, "speaker": "customer"}
```

### Monitoring

```bash
# Check active streams
curl http://192.168.1.23:4097/stream/active

# View logs
ssh edwardsdavid913@192.168.1.23 "pm2 logs transcription-service"
```

---

## Related Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - System architecture overview
- [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) - Debugging voice/SMS issues
- [DEPLOYMENT_CHECKLIST.md](../DEPLOYMENT_CHECKLIST.md) - Service deployment procedures
