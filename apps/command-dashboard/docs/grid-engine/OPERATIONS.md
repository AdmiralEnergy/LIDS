# Grid Engine Operations Runbook

**Day-to-day operations, troubleshooting, and maintenance procedures.**

---

## Quick Reference

| Item | Value |
|------|-------|
| **Host** | Oracle ARM (193.122.153.249) |
| **Port** | 4120 |
| **PM2 Name** | grid-engine |
| **Directory** | ~/grid-engine |
| **SSH Access** | `ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249` |
| **Health Check** | `curl http://193.122.153.249:4120/health` |

---

## Daily Operations

### Check System Status

```bash
# From admiral-server (has SSH key)
ssh edwardsdavid913@192.168.1.23

# Then to Oracle ARM
ssh -i ~/.ssh/oci_arm ubuntu@193.122.153.249

# Check PM2 status
pm2 list

# Expected output:
# │ grid-engine       │ 0  │ fork   │ 12345 │ online │
# │ command-dashboard │ 1  │ fork   │ 12346 │ online │
```

### View Logs

```bash
# Real-time logs
pm2 logs grid-engine

# Last 100 lines
pm2 logs grid-engine --lines 100

# Specific time range (if using pm2-logrotate)
cat ~/.pm2/logs/grid-engine-out.log | tail -100
```

### Check Feed Health

```bash
curl -s http://localhost:4120/status | jq '.feeds'

# Expected output:
# [
#   { "source": "NWS", "isStale": false, "lastSuccessAt": "..." },
#   { "source": "DUKE_DEC", "isStale": false, "lastSuccessAt": "..." },
#   { "source": "DUKE_DEP", "isStale": false, "lastSuccessAt": "..." }
# ]
```

### Check Current Outages

```bash
curl -s http://localhost:4120/api/outages/current | jq

# Check specific county
curl -s http://localhost:4120/api/counties/Cleveland | jq
```

---

## Starting and Stopping

### Start Grid Engine

```bash
cd ~/grid-engine
PORT=4120 pm2 start 'npx tsx server/src/index.ts' --name grid-engine
pm2 save
```

### Stop Grid Engine

```bash
pm2 stop grid-engine
```

### Restart Grid Engine

```bash
pm2 restart grid-engine
```

### Full Reload (Zero Downtime)

```bash
pm2 reload grid-engine
```

---

## Deployment

### Deploy Update from Git

```bash
# On Oracle ARM
cd ~/grid-engine
git pull origin main
npm install  # if dependencies changed
pm2 restart grid-engine
```

### Deploy from Local Machine

```bash
# From Windows/Mac development machine
# First, access via admiral-server
ssh edwardsdavid913@192.168.1.23

# Copy files
scp -r -i ~/.ssh/oci_arm ./grid-engine ubuntu@193.122.153.249:~/

# On Oracle ARM
cd ~/grid-engine
npm install
pm2 restart grid-engine
```

### Verify Deployment

```bash
# Check version
curl -s http://localhost:4120/health | jq '.version'

# Check all feeds working
curl -s http://localhost:4120/status | jq '.feeds[] | {source, isStale}'

# Test specific county
curl -s http://localhost:4120/api/counties/Cleveland | jq
```

---

## Troubleshooting

### Problem: Grid Engine Not Starting

**Symptoms:** PM2 shows "errored" or constant restarts

**Check logs:**
```bash
pm2 logs grid-engine --lines 50 --err
```

**Common causes:**

1. **Port already in use**
   ```bash
   lsof -i :4120
   kill -9 <PID>
   pm2 restart grid-engine
   ```

2. **Missing dependencies**
   ```bash
   cd ~/grid-engine
   npm install
   pm2 restart grid-engine
   ```

3. **SQLite corruption**
   ```bash
   # Backup and recreate database
   mv ~/grid-engine/data/grid.db ~/grid-engine/data/grid.db.bak
   pm2 restart grid-engine  # Will recreate DB
   ```

---

### Problem: All Counties Showing GREEN Despite Outages

**Symptoms:** Dashboard shows all GREEN but Duke website shows outages

**Check Duke feed:**
```bash
curl -s http://localhost:4120/status | jq '.feeds[] | select(.source | startswith("DUKE"))'
```

**If isStale is true:**
```bash
# Force refresh
curl -X POST http://localhost:4120/api/refresh
```

**If still failing, check Duke API directly:**
```bash
curl -s "https://prod.apigee.duke-energy.app/outage-maps/v1/outages?jurisdiction=DEC" | head -100
```

**Common causes:**
- Duke API credentials expired (check duke-client.ts)
- Duke API rate limiting (wait 15 minutes)
- Network issue to Duke servers

---

### Problem: Safe Mode Stuck On

**Symptoms:** Status shows `safeMode: "FULL_SAFE"` or similar

**Check why:**
```bash
curl -s http://localhost:4120/status | jq '{safeMode, feeds: [.feeds[] | {source, isStale, lastError}]}'
```

**Force refresh:**
```bash
curl -X POST http://localhost:4120/api/refresh
```

**Manual override (temporary):**
```bash
curl -X POST http://localhost:4120/admin/safe-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "NORMAL"}'
```

**Warning:** Only use manual override if you've verified data sources are actually working.

---

### Problem: County Stuck in Wrong State

**Symptoms:** County shows YELLOW/RED/BLACK but conditions don't warrant it

**Check state history:**
```bash
curl -s "http://localhost:4120/api/alerts/recent?county=Cleveland&limit=10" | jq
```

**Reset county:**
```bash
curl -X POST http://localhost:4120/admin/reset-county/Cleveland
```

---

### Problem: High Memory Usage

**Symptoms:** PM2 shows memory > 200MB

**Check memory:**
```bash
pm2 monit
```

**Common causes:**
- State history table too large
- Memory leak in scheduler

**Fix:**
```bash
# Restart to clear memory
pm2 restart grid-engine

# If persistent, check database size
ls -lh ~/grid-engine/data/grid.db
```

---

### Problem: NWS API Not Responding

**Symptoms:** NWS feed shows stale, alerts not updating

**Test NWS directly:**
```bash
curl -s "https://api.weather.gov/alerts/active?area=NC" | jq '.features | length'
```

**Common causes:**
- NWS API temporary outage (wait and retry)
- Network issue
- Rate limiting (rare)

**Note:** NWS API occasionally has brief outages. The system will self-recover when the API returns.

---

## Monitoring

### PM2 Metrics

```bash
pm2 monit  # Real-time CPU/memory/logs
```

### Health Check Script

Create a simple health check:

```bash
#!/bin/bash
# ~/check-grid.sh

HEALTH=$(curl -s http://localhost:4120/health | jq -r '.status')
if [ "$HEALTH" != "ok" ]; then
  echo "Grid Engine unhealthy!"
  pm2 restart grid-engine
fi
```

Add to cron:
```bash
crontab -e
# Add: */5 * * * * /home/ubuntu/check-grid.sh
```

### Alert on Safe Mode

```bash
#!/bin/bash
# ~/check-safe-mode.sh

MODE=$(curl -s http://localhost:4120/status | jq -r '.safeMode')
if [ "$MODE" != "NORMAL" ]; then
  # Send alert via n8n webhook
  curl -X POST "http://192.168.1.23:5678/webhook/grid-safe-mode" \
    -H "Content-Type: application/json" \
    -d "{\"mode\": \"$MODE\"}"
fi
```

---

## Maintenance

### Database Cleanup

Old state history can be archived:

```bash
# Connect to SQLite
cd ~/grid-engine
sqlite3 data/grid.db

# Check size
SELECT COUNT(*) FROM state_history;

# Archive old records (keep last 30 days)
DELETE FROM state_history
WHERE timestamp < datetime('now', '-30 days');

# Vacuum to reclaim space
VACUUM;
```

### Log Rotation

PM2 logs grow over time. Install pm2-logrotate:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 5
```

### Backup

```bash
# Backup database
cp ~/grid-engine/data/grid.db ~/grid-engine/data/grid.db.$(date +%Y%m%d)

# Or to remote
scp -i ~/.ssh/oci_arm ubuntu@193.122.153.249:~/grid-engine/data/grid.db ~/backups/
```

---

## Emergency Procedures

### Complete System Failure

1. **Check if process exists:**
   ```bash
   pm2 list
   ```

2. **If crashed, check logs:**
   ```bash
   pm2 logs grid-engine --lines 100 --err
   ```

3. **Restart:**
   ```bash
   pm2 restart grid-engine
   ```

4. **If still failing, recreate:**
   ```bash
   pm2 delete grid-engine
   cd ~/grid-engine
   PORT=4120 pm2 start 'npx tsx server/src/index.ts' --name grid-engine
   pm2 save
   ```

### Data Corruption

1. **Backup current database:**
   ```bash
   cp ~/grid-engine/data/grid.db ~/grid-engine/data/grid.db.corrupt
   ```

2. **Delete and restart (will recreate):**
   ```bash
   rm ~/grid-engine/data/grid.db
   pm2 restart grid-engine
   ```

3. **Note:** This loses historical data but recovers operation immediately.

### Emergency Safe Mode

If system is sending false alerts:

```bash
# Immediately disable all alerting
curl -X POST http://localhost:4120/admin/safe-mode \
  -H "Content-Type: application/json" \
  -d '{"mode": "FULL_SAFE"}'
```

Then investigate the issue before returning to normal.

---

## Contacts

| Role | Contact | When |
|------|---------|------|
| System Owner | David Edwards | Any critical issue |
| Oracle Cloud | Oracle Support | Infrastructure issues |
| Duke Energy API | Duke IT | API credential issues |

---

*Last Updated: January 3, 2026*
