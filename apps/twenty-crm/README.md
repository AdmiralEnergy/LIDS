# Twenty CRM

Self-hosted CRM for Admiral Energy, running on **DO Droplet** (165.227.111.24).

## Quick Reference

| Property | Value |
|----------|-------|
| **URL** | http://localhost:3001 (on droplet) |
| **External URL** | https://twenty.ripemerchant.host |
| **Admin Login** | admin / LifeOS2025! |
| **Database** | PostgreSQL 16 (twenty-db container) |
| **MCP Server** | Port 4095 (twenty-mcp on admiral-server) |
| **Google Calendar** | Enabled (OAuth configured) |

## Resource Usage

| Container | RAM Usage | CPU |
|-----------|-----------|-----|
| twenty-server | ~527 MB | <1% |
| twenty-worker | ~547 MB | <1% |
| twenty-db | ~33 MB | <1% |
| twenty-redis | ~10 MB | <1% |
| **TOTAL** | **~1.1 GB** | **<2%** |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Twenty CRM Stack (Docker Compose)                          │
│  Host: DO Droplet (165.227.111.24)                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  twenty-server  │    │  twenty-worker  │                 │
│  │  (twentycrm)    │    │  (background)   │                 │
│  │  Port 3001→3000 │    │  yarn worker    │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                           │
│           └──────────┬───────────┘                           │
│                      │                                       │
│           ┌──────────┴──────────┐                           │
│           │                      │                           │
│  ┌────────▼────────┐  ┌─────────▼────────┐                  │
│  │   twenty-db     │  │   twenty-redis   │                  │
│  │  PostgreSQL 16  │  │    Redis 7       │                  │
│  │  Port 5432      │  │    Port 6379     │                  │
│  └─────────────────┘  └──────────────────┘                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Google Calendar Integration

Twenty CRM supports native Google Calendar sync for scheduling appointments with leads.

### Configuration (Already Done)

**Google Cloud Project:** `HELM` (helm-481601)
**Organization:** admiralenergy.ai
**Console URL:** https://console.cloud.google.com/apis/credentials?project=helm-481601

**OAuth Credentials:**
```
Client ID: 700941965486-o56epgvf66lunlmqcipbl6779p27eo2t.apps.googleusercontent.com
```

**Redirect URIs (BOTH required):**
| Purpose | URI |
|---------|-----|
| SSO Login | `https://twenty.ripemerchant.host/auth/google/redirect` |
| Calendar/Gmail APIs | `https://twenty.ripemerchant.host/auth/google-apis/get-access-token` |

**Enabled APIs:**
- Google Calendar API
- Gmail API
- People API

**OAuth Scopes:**
- `userinfo.email` - See primary Google Account email
- `calendar.events` - View and edit calendar events
- `gmail.readonly` - View email messages and settings

**Publishing Status:** Testing (not published)
**Test Users:** Add team members via Google Cloud Console → Audience → Test users

**Environment Variables** (in `.env`):
```bash
AUTH_GOOGLE_ENABLED=true
AUTH_GOOGLE_CLIENT_ID=700941965486-...apps.googleusercontent.com
AUTH_GOOGLE_CLIENT_SECRET=GOCSPX-...
AUTH_GOOGLE_CALLBACK_URL=https://twenty.ripemerchant.host/auth/google/redirect
AUTH_GOOGLE_APIS_CALLBACK_URL=https://twenty.ripemerchant.host/auth/google-apis/get-access-token
CALENDAR_PROVIDER_GOOGLE_ENABLED=true
MESSAGE_QUEUE_TYPE=pg-boss
```

### Connecting Your Calendar

1. Go to **Settings → Accounts → Calendars**
2. Click **"New account"**
3. Sign in with your Google account
4. Grant calendar permissions
5. Events sync bidirectionally

### Troubleshooting Google Sync

If sync gets stuck on "Importing...":
1. Verify worker has same env vars as server
2. Check worker logs: `docker logs twenty-worker`
3. Ensure Google Cloud project has Calendar API enabled

---

## How We Use Twenty CRM

### 1. Lead Management
- Primary CRM for solar leads
- Synced with Supabase via LIBRARIAN agent
- PropStream imports go through TCPA classification first

### 2. Dialer Integration
- LIDS dialer pulls leads from Twenty
- Call notes and dispositions logged back
- Activity timeline for each contact

### 3. Custom Fields (c_ prefix)
| Field | Purpose |
|-------|---------|
| `c_supabaseId` | Links to Supabase lead record |
| `c_icpScore` | Ideal Customer Profile score (0-100) |
| `c_tcpaStatus` | TCPA compliance: SAFE/MODERATE/DANGEROUS/DNC |
| `c_cadenceStatus` | Email/SMS sequence status |

### 4. MCP Integration (Port 4095)

Twenty MCP exposes these tools for AI agents:

```typescript
// Available MCP Tools
record_crud     // Create/Read/Update/Delete records
search_records  // Search across entities
execute_query   // Run custom GraphQL queries
discover_schema // Explore available entities and fields
```

**Example - Search Leads:**
```bash
curl -X POST http://192.168.1.23:4095/tools/search_records \
  -H "Content-Type: application/json" \
  -d '{"entity": "person", "query": "Matthews NC"}'
```

## Data Flow

```
PropStream CSV
     │
     ▼
LIDS Import Wizard (TCPA Classification)
     │
     ├──► Twenty CRM (operational layer)
     │    └── People, Companies, Notes, Activities
     │
     └──► Supabase (master data layer)
          └── master_leads, compliance_logs
```

## Deployment

### Location on DO Droplet
```bash
ssh root@165.227.111.24
cd /var/www/lids/apps/twenty-crm
```

### Docker Compose Commands
```bash
# Start
docker compose up -d

# Stop
docker compose down

# View logs
docker compose logs -f twenty-server

# Restart
docker compose restart

# Update to latest
docker compose pull && docker compose up -d
```

### Cloudflare Tunnel
Twenty is exposed via Cloudflare tunnel at `https://twenty.ripemerchant.host`

## Database Access

```bash
# Connect to Twenty PostgreSQL
docker exec -it twenty-db psql -U twenty -d twenty

# Common queries
\dt                           # List tables
SELECT * FROM "person" LIMIT 5;
SELECT * FROM "company" LIMIT 5;
```

## Backup

```bash
# Backup database
docker exec twenty-db pg_dump -U twenty twenty > twenty_backup_$(date +%Y%m%d).sql

# Restore
cat twenty_backup.sql | docker exec -i twenty-db psql -U twenty twenty
```

## Troubleshooting

### High Memory Usage
Twenty runs a Node.js server + worker. If RAM exceeds 2GB total:
1. Check for runaway background jobs: `docker logs twenty-worker`
2. Restart worker: `docker compose restart twenty-worker`
3. Check Redis memory: `docker exec twenty-redis redis-cli INFO memory`

### Can't Connect
1. Verify containers running: `docker ps | grep twenty`
2. Check port binding: `netstat -tlnp | grep 3001`
3. Test from LIDS: `curl http://192.168.1.23:3001/health`

### Sync Issues with Supabase
- LIBRARIAN is the sole writer to Supabase
- Check LIBRARIAN logs: `pm2 logs librarian`
- Verify webhook triggers in Twenty settings

## Related Files

| File | Location |
|------|----------|
| Docker Compose | `droplet:/var/www/lids/apps/twenty-crm/docker-compose.yml` |
| Environment | `droplet:/var/www/lids/apps/twenty-crm/.env` |
| MCP Server | `admiral-server:agents/infrastructure/twenty-mcp/` (Port 4095) |
| Google OAuth JSON | Local backup: `client_secret_700941965486-*.json` |

---

*Last Updated: December 29, 2025 - Added Google Calendar integration*
