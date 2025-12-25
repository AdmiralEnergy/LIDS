# LIDS Troubleshooting Guide

**Version:** 1.0 | **Updated:** December 24, 2025

---

## Quick Diagnostics

### Check All Services Status

```bash
# SSH to admiral-server
ssh edwardsdavid913@192.168.1.23

# Check PM2 services
pm2 status

# Check Docker containers
docker ps

# Check ports
ss -tlnp | grep -E '3001|3100|4115|4130'
```

### Health Check URLs

| Service | URL | Expected Response |
|---------|-----|-------------------|
| HELM Dashboard | http://localhost:3100/api/twenty/status | `{ connected: true }` |
| Twilio Service | http://localhost:4115/health | `{ status: 'ok' }` |
| Voice Service | http://localhost:4130/health | `{ status: 'healthy' }` |
| Twenty CRM | http://localhost:3001/rest/health | HTTP 200 |

---

## Common Issues

### 1. "Twenty CRM Not Connected"

**Symptoms:**
- Dashboard shows "Twenty Not Connected"
- Leads don't load
- `/api/twenty/status` returns `{ connected: false }`

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Twenty container down | `docker ps` shows no twenty-server | `cd ~/twenty && docker compose up -d` |
| Wrong API key | Check browser console for 401 errors | Update `TWENTY_API_KEY` in settings |
| Network issue | `curl localhost:3001` fails | Check Docker network: `docker network ls` |
| Database connection | `docker logs twenty-server` shows PG errors | Restart: `docker compose restart twenty-db` |

**Debug Commands:**
```bash
# Check Twenty logs
docker logs twenty-server --tail 50

# Test GraphQL endpoint
curl -X POST http://localhost:3001/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{"query":"{ __typename }"}'

# Check database connection
docker exec -it twenty-db psql -U twenty -c "\l"
```

---

### 2. "Dialer Not Configured"

**Symptoms:**
- Dialer shows "Twilio not configured"
- Cannot make calls
- Error: "Failed to get Twilio token"

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Twilio service down | `pm2 status` shows twilio-service stopped | `pm2 restart twilio-service` |
| Missing credentials | `curl localhost:4115/health` shows `twilioConfigured: false` | Check `.env` in twilio-service directory |
| Proxy not working | Browser console shows 502/504 errors | Check proxy config in server/index.ts |
| Token generation failed | `/token` endpoint returns error | Check Twilio console for API key validity |

**Debug Commands:**
```bash
# Check Twilio service logs
pm2 logs twilio-service --lines 50

# Test token generation directly
curl -X POST http://localhost:4115/token \
  -H "Content-Type: application/json" \
  -d '{"identity":"test-user"}'

# Verify Twilio credentials
cat ~/LifeOS-Core/agents/twilio-service/.env
```

**Common Token Errors:**
```
"Invalid API Key" → API Key doesn't match Account SID
"Invalid TwiML App" → TwiML App SID is wrong or deleted
"Authentication failed" → API Secret is incorrect
```

---

### 3. "Call Not Connecting"

**Symptoms:**
- Call shows "connecting" indefinitely
- Call drops immediately
- No audio

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| TwiML App misconfigured | Call fails with no error | Check Twilio console → TwiML Apps → Voice URL |
| Wrong phone format | Logs show "Invalid phone number" | Use E.164 format: +1XXXXXXXXXX |
| Twilio quota exceeded | Twilio dashboard shows usage limit | Upgrade Twilio plan or wait for reset |
| WebRTC blocked | Browser console shows ICE errors | Check firewall, try different network |
| Browser permissions | No microphone access | Allow microphone in browser settings |

**TwiML App Configuration:**
```
Voice Request URL: http://admiral-server-ip:4115/voice/outbound
Method: POST
```

**Debug:**
```bash
# Check call logs in Twilio console
# https://console.twilio.com/us1/monitor/logs/calls

# Test outbound TwiML
curl -X POST http://localhost:4115/voice/outbound \
  -d "To=+19195551234"
```

---

### 4. "Transcription Not Working"

**Symptoms:**
- No transcription appears after call
- Voice service returns errors
- Real-time transcription missing

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Voice service down | `pm2 status` shows voice-service stopped | `pm2 restart voice-service` |
| Whisper model not loaded | First call takes >30 seconds | Pre-load model: restart service |
| Python dependencies | Import errors in logs | `cd voice-service && pip install -r requirements.txt` |
| Audio format unsupported | Logs show "Invalid audio" | Ensure WebM/WAV format |
| CUDA/GPU issues | Logs show CUDA errors | Set `WHISPER_DEVICE=cpu` |

**Debug Commands:**
```bash
# Check voice service logs
pm2 logs voice-service --lines 50

# Test transcription endpoint
curl -X POST http://localhost:4130/transcribe \
  -F "audio=@test.wav"

# Check model status
curl http://localhost:4130/health
```

---

### 5. "XP/Progression Not Syncing"

**Symptoms:**
- XP changes locally but not in Twenty
- Different XP on different devices
- "Sync failed" messages in console

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| No workspace member set | `localStorage` shows no `twentyWorkspaceMemberId` | Log in to Twenty, copy workspace member ID |
| Twenty API errors | Browser console shows GraphQL errors | Check Twenty API key and permissions |
| IndexedDB corrupted | Dexie errors in console | Clear browser data for site |
| Custom objects missing | Twenty shows 404 on repProgressions | Create custom objects in Twenty admin |

**Debug:**
```javascript
// In browser console
localStorage.getItem('twentyWorkspaceMemberId')

// Check local progression
const db = await indexedDB.open('ADS_Progression');
// Inspect progression table
```

**Manual Sync:**
```javascript
// In browser console
import { fullSync } from '/src/lib/twentySync.ts';
await fullSync();
```

---

### 6. "Dashboard Not Loading"

**Symptoms:**
- White screen
- 502/504 errors
- "Connection refused"

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| helm-dashboard crashed | `pm2 status` shows errored/stopped | `pm2 restart helm-dashboard` |
| Port conflict | `ss -tlnp | grep 3100` shows different process | Kill conflicting process |
| Build corruption | Errors mention missing modules | Rebuild: `npm run build` and redeploy |
| Node.js version | Errors about unsupported features | Ensure Node.js 20.x |

**Debug Commands:**
```bash
# Check dashboard logs
pm2 logs helm-dashboard --lines 100

# Check if port is in use
ss -tlnp | grep 3100

# Restart dashboard
pm2 restart helm-dashboard

# Check build files exist
ls -la ~/apps/helm-dashboard/dist/
```

---

### 7. "Cloudflare Tunnel Not Working"

**Symptoms:**
- External URLs return 502/504
- "Tunnel connection failed"
- Works locally but not externally

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Tunnel process crashed | `pm2 status` shows lifeos-tunnel stopped | `pm2 restart lifeos-tunnel` |
| Config file error | Tunnel logs show YAML errors | Check `~/.cloudflared/config.yml` syntax |
| Credentials expired | Logs show auth errors | Re-run `cloudflared tunnel login` |
| DNS misconfigured | DNS lookup shows wrong CNAME | Update Cloudflare DNS records |
| Service not running | Tunnel works but service 502s | Check target service is running |

**Debug Commands:**
```bash
# Check tunnel logs
pm2 logs lifeos-tunnel --lines 50

# Validate config
cloudflared tunnel validate ~/.cloudflared/config.yml

# Test tunnel directly
cloudflared tunnel --config ~/.cloudflared/config.yml run

# Check DNS
dig helm.ripemerchant.host
```

---

### 8. "Lead Import Failing"

**Symptoms:**
- CSV import shows errors
- "Failed to create person"
- Partial import (some leads fail)

**Causes & Solutions:**

| Cause | Diagnosis | Solution |
|-------|-----------|----------|
| Field mapping wrong | Logs show "Missing first or last name" | Check column mappings in import wizard |
| Twenty rate limited | Many failures after initial success | Slow down import or batch smaller |
| Duplicate records | "Already exists" errors | Skip duplicates or update existing |
| Invalid phone format | Phone validation fails | Clean phone numbers to digits only |

**CSV Format Requirements:**
```
First Name,Last Name,Email,Phone
John,Doe,john@example.com,+19195551234
```

---

## Service Restart Procedures

### Restart Individual Service

```bash
pm2 restart <service-name>
```

### Restart All PM2 Services

```bash
pm2 restart all
```

### Restart Docker Containers

```bash
cd ~/twenty && docker compose restart
```

### Full System Restart

```bash
# Stop all services
pm2 stop all
docker compose -f ~/twenty/docker-compose.yml stop

# Start in order
docker compose -f ~/twenty/docker-compose.yml up -d
sleep 10  # Wait for Twenty to start
pm2 start all
```

---

## Log Locations

| Service | Log Command | Log Files |
|---------|-------------|-----------|
| helm-dashboard | `pm2 logs helm-dashboard` | `~/.pm2/logs/helm-dashboard-*.log` |
| twilio-service | `pm2 logs twilio-service` | `~/.pm2/logs/twilio-service-*.log` |
| voice-service | `pm2 logs voice-service` | `~/.pm2/logs/voice-service-*.log` |
| lifeos-tunnel | `pm2 logs lifeos-tunnel` | `~/.pm2/logs/lifeos-tunnel-*.log` |
| Twenty CRM | `docker logs twenty-server` | Docker internal |

### View Live Logs

```bash
# All services
pm2 logs

# Specific service with timestamp
pm2 logs helm-dashboard --timestamp

# Last 100 error lines
pm2 logs --err --lines 100
```

---

## Browser Console Debugging

### Check Local Storage

```javascript
// Settings
JSON.parse(localStorage.getItem('ads_settings'))

// Workspace member
localStorage.getItem('twentyWorkspaceMemberId')
```

### Check IndexedDB

```javascript
// Open Dexie databases
indexedDB.databases().then(dbs => console.log(dbs))

// Check progression data
const request = indexedDB.open('ADS_Progression');
request.onsuccess = e => {
  const db = e.target.result;
  const tx = db.transaction('progression', 'readonly');
  tx.objectStore('progression').get('current').onsuccess = e => {
    console.log('Progression:', e.target.result);
  };
};
```

### Clear All Local Data

```javascript
// Clear localStorage
localStorage.clear();

// Clear IndexedDB
indexedDB.deleteDatabase('AdsDatabase');
indexedDB.deleteDatabase('ADS_Progression');

// Reload
location.reload();
```

---

## Network Debugging

### Test Internal Connectivity

```bash
# From admiral-server
curl http://localhost:3001/rest/health  # Twenty
curl http://localhost:4115/health       # Twilio
curl http://localhost:4130/health       # Voice
curl http://localhost:3100/api/twenty/status  # Dashboard
```

### Test External Connectivity

```bash
# From any machine
curl https://helm.ripemerchant.host/api/twenty/status
curl https://twenty.ripemerchant.host/rest/health
```

### Check Firewall

```bash
# List open ports
sudo ss -tlnp

# Check UFW status
sudo ufw status

# Allow port if needed
sudo ufw allow 3100/tcp
```

---

## Emergency Contacts

### Service Owners
- **Admiral-server:** david.edwards@reachsolar.com
- **Twilio Account:** Admiral Energy Twilio Console
- **Cloudflare:** Managed via cloudflare.com

### External Service Status Pages
- Twilio: https://status.twilio.com
- Cloudflare: https://cloudflarestatus.com
- Supabase: https://status.supabase.com

---

*Last Updated: December 24, 2025*
