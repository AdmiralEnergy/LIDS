# LIDS Monorepo - Service Architecture

**Version:** 2.0 | **Updated:** December 25, 2025

---

## Overview

LIDS runs on the DO Droplet. Core functionality works standalone; admiral-server provides optional AI/voice enhancements.



---

## Key Architecture Decisions

### Twenty CRM Location

**Twenty CRM runs ONLY on the DO Droplet.** No admiral-server instance.

| Property | Value |
|----------|-------|
| Host | localhost:3001 (on droplet) |
| External URL | https://twenty.ripemerchant.host |
| Docker containers | twenty-server, twenty-db, twenty-redis |

### Standalone Operation

LIDS Dashboard works with ONLY the droplet:

| Feature | Standalone? | Notes |
|---------|------------|-------|
| Lead management | Yes | Twenty CRM on droplet |
| Native phone calls | Yes | Uses tel: links |
| Call disposition | Yes | Logs to Twenty CRM |
| XP/Progression | Yes | IndexedDB local |
| Browser calling | No | Requires Twilio Service |
| Live transcription | No | Requires Voice Service |

---

## Service Inventory

### DO Droplet (165.227.111.24)

| Service | Port | Type |
|---------|------|------|
| lids | 5000 | Node.js |
| compass | 3101 | Node.js |
| redhawk | 3102 | Node.js |
| twenty-server | 3001 | Docker (CANONICAL) |
| twenty-db | - | Docker PostgreSQL |
| twenty-redis | - | Docker Redis |

### admiral-server (192.168.1.23) - OPTIONAL

| Service | Port | Purpose |
|---------|------|---------|
| twilio-service | 4115 | Browser Twilio calling |
| voice-service | 4130 | STT + TTS |
| transcription-service | 4097 | Live transcription |
| agent-claude | 4110 | Primary MCP server |

---

## Environment Configuration

### LIDS (.env) - Minimal Required

```bash
NODE_ENV=production
PORT=5000
TWENTY_CRM_URL=http://localhost:3001
TWENTY_API_KEY=your_api_key_here
```

### With Optional Backend Services

```bash
VOICE_SERVICE_URL=http://100.66.42.81:4130
TWILIO_SERVICE_URL=http://100.66.42.81:4115
```



---

## Failure Modes

### admiral-server Down (Graceful Degradation)

When admiral-server is unreachable:
1. Dialer switches to tel: links (native phone)
2. No live transcription (manual notes)
3. CRM and XP system continue working

---

## Related Documentation

- DEPLOYMENT_CHECKLIST.md - Deployment guide
- TROUBLESHOOTING.md - Common issues
- ../../CLAUDE.md - Development guidelines

---

*Last Updated: December 25, 2025*
