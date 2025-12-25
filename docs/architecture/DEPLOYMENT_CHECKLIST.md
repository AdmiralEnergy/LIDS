# LIDS Deployment Checklist

**Version:** 1.0 | **Updated:** December 24, 2025

---

## Prerequisites

### Admiral-Server Requirements

- [ ] Ubuntu Server 24.04 LTS
- [ ] Node.js 20.x installed (`node -v`)
- [ ] Python 3.11+ with venv (`python3 --version`)
- [ ] Docker + Docker Compose installed
- [ ] PM2 installed globally (`npm i -g pm2`)
- [ ] At least 8GB RAM, 20GB free disk space
- [ ] SSH access configured

### External Services

- [ ] Twilio account with:
  - [ ] Account SID
  - [ ] API Key + Secret
  - [ ] TwiML App SID
  - [ ] Phone number provisioned
- [ ] Supabase project with:
  - [ ] Project URL
  - [ ] Service Role Key (not anon key)
  - [ ] Tables created (dial_attempts, call_recordings)
- [ ] Cloudflare account with:
  - [ ] Tunnel configured
  - [ ] DNS records for subdomains
- [ ] Domain configured (e.g., ripemerchant.host)

---

## Phase 1: Backend Services

### 1.1 Twenty CRM (Docker)

```bash
# Create docker-compose.yml for Twenty
cat > ~/twenty/docker-compose.yml << 'EOF'
version: '3.9'
services:
  twenty-db:
    image: postgres:16
    environment:
      POSTGRES_DB: twenty
      POSTGRES_USER: twenty
      POSTGRES_PASSWORD: twenty_secret
    volumes:
      - twenty-db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U twenty"]
      interval: 5s
      timeout: 5s
      retries: 5

  twenty-redis:
    image: redis:7
    volumes:
      - twenty-redis-data:/data

  twenty-server:
    image: twentycrm/twenty:latest
    environment:
      PG_DATABASE_URL: postgres://twenty:twenty_secret@twenty-db:5432/twenty
      REDIS_URL: redis://twenty-redis:6379
      SERVER_URL: http://localhost:3001
      FRONT_BASE_URL: http://localhost:3001
    ports:
      - "3001:3000"
    depends_on:
      twenty-db:
        condition: service_healthy

  twenty-worker:
    image: twentycrm/twenty:latest
    command: yarn worker:prod
    environment:
      PG_DATABASE_URL: postgres://twenty:twenty_secret@twenty-db:5432/twenty
      REDIS_URL: redis://twenty-redis:6379
    depends_on:
      - twenty-server

volumes:
  twenty-db-data:
  twenty-redis-data:
EOF

# Start Twenty
cd ~/twenty && docker compose up -d

# Verify
curl http://localhost:3001/rest/health
```

**Verification:**
- [ ] Twenty UI accessible at http://localhost:3001
- [ ] Admin login works (admin/LifeOS2025!)
- [ ] GraphQL endpoint responds at /graphql

### 1.2 Twilio Service

```bash
# Clone/update the service
cd ~/LifeOS-Core/agents/twilio-service

# Create .env file
cat > .env << 'EOF'
TWILIO_ACCOUNT_SID=ACxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_API_KEY=SKxxxxxx
TWILIO_API_SECRET=your_api_secret
TWILIO_TWIML_APP_SID=APxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
PORT=4115
EOF

# Install dependencies
npm install

# Start with PM2
pm2 start src/index.js --name twilio-service

# Verify
curl http://localhost:4115/health
```

**Verification:**
- [ ] Health check returns `{ status: 'ok', twilioConfigured: true }`
- [ ] Token generation works (`curl -X POST localhost:4115/token`)

### 1.3 Voice Service

```bash
# Setup Python environment
cd ~/LifeOS-Core/agents/voice-service
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download Whisper model (first run will download)
python -c "from faster_whisper import WhisperModel; WhisperModel('base')"

# Start with PM2
pm2 start main.py --name voice-service --interpreter .venv/bin/python

# Verify
curl http://localhost:4130/health
```

**Verification:**
- [ ] Health check returns `{ status: 'healthy', whisper_model: 'base' }`
- [ ] Transcription works (upload audio file)

---

## Phase 2: HELM Dashboard

### 2.1 Build the Application

```bash
# From local development machine
cd /path/to/LIDS-monorepo/apps/ads-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# Output: dist/
#   - dist/index.cjs (server)
#   - dist/public/ (client assets)
```

### 2.2 Deploy to Admiral-Server

```bash
# Create deployment directory
ssh edwardsdavid913@192.168.1.23 "mkdir -p ~/apps/helm-dashboard"

# Copy built files
scp -r dist/* edwardsdavid913@192.168.1.23:~/apps/helm-dashboard/

# Copy package.json for dependencies
scp package.json edwardsdavid913@192.168.1.23:~/apps/helm-dashboard/
```

### 2.3 Configure and Start

```bash
# On admiral-server
cd ~/apps/helm-dashboard

# Install production dependencies
npm install --omit=dev

# Create PM2 ecosystem file
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'helm-dashboard',
    script: 'dist/index.cjs',
    cwd: '/home/edwardsdavid913/apps/helm-dashboard',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 3100,
      VITE_TWENTY_API_URL: 'http://localhost:3001',
      TWENTY_API_KEY: 'eyJhbGci...'
    }
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save
```

**Verification:**
- [ ] Dashboard accessible at http://localhost:3100
- [ ] Twenty connection shows "connected"
- [ ] Dialer shows "configured" (not "error")

---

## Phase 3: Cloudflare Tunnel

### 3.1 Install Cloudflared

```bash
# Download and install
curl -L https://pkg.cloudflare.com/cloudflared-stable-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Login to Cloudflare
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create lifeos

# Note the tunnel ID (e.g., bc1135f2-3f07-4b4b-9006-f9b03d079e98)
```

### 3.2 Configure Tunnel

```bash
# Create config file
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << 'EOF'
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/edwardsdavid913/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # ADS Dashboard (HELM)
  - hostname: helm.yourdomain.com
    service: http://localhost:3100
  # Twenty CRM
  - hostname: twenty.yourdomain.com
    service: http://localhost:3001
  # Agents API
  - hostname: agents.yourdomain.com
    service: http://localhost:4110
  # Catch-all
  - service: http_status:404
EOF
```

### 3.3 Configure DNS

In Cloudflare dashboard:
- [ ] Add CNAME record: `helm` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- [ ] Add CNAME record: `twenty` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- [ ] Add CNAME record: `agents` → `YOUR_TUNNEL_ID.cfargotunnel.com`
- [ ] Ensure proxy status is enabled (orange cloud)

### 3.4 Start Tunnel with PM2

```bash
pm2 start "cloudflared tunnel run" --name lifeos-tunnel
pm2 save
```

**Verification:**
- [ ] `https://helm.yourdomain.com` loads the dashboard
- [ ] `https://twenty.yourdomain.com` loads Twenty CRM
- [ ] No certificate errors

---

## Phase 4: Final Verification

### 4.1 Service Health Checks

```bash
# Run all health checks
echo "=== Service Health ==="
curl -s http://localhost:3001/rest/health && echo " ✓ Twenty CRM"
curl -s http://localhost:3100/api/twenty/status && echo " ✓ HELM Dashboard"
curl -s http://localhost:4115/health && echo " ✓ Twilio Service"
curl -s http://localhost:4130/health && echo " ✓ Voice Service"
```

### 4.2 End-to-End Tests

- [ ] **Dashboard Load:** Navigate to https://helm.yourdomain.com
- [ ] **CRM Connection:** Dashboard shows "Twenty Connected"
- [ ] **Lead Display:** Leads load from Twenty CRM
- [ ] **Dialer Init:** Dialer shows "Ready" or "Configured"
- [ ] **Make Test Call:** Dial a test number, verify audio
- [ ] **Transcription:** After call, verify transcription appears
- [ ] **XP Tracking:** Verify XP increases after call disposition

### 4.3 PM2 Persistence

```bash
# Save current PM2 state
pm2 save

# Configure PM2 to start on boot
pm2 startup

# Verify startup script
sudo systemctl status pm2-edwardsdavid913
```

---

## Rollback Procedure

### If Deployment Fails

```bash
# Stop new deployment
pm2 stop helm-dashboard

# Restore previous version (if exists)
mv ~/apps/helm-dashboard ~/apps/helm-dashboard-failed
mv ~/apps/helm-dashboard-backup ~/apps/helm-dashboard

# Restart
pm2 restart helm-dashboard
```

### If Twenty CRM Fails

```bash
# Check logs
docker logs twenty-server --tail 100

# Restart containers
cd ~/twenty && docker compose restart

# If data corruption, restore from backup
docker compose down
docker volume rm twenty_twenty-db-data
# Restore from backup...
docker compose up -d
```

---

## Maintenance Tasks

### Daily
- [ ] Check PM2 status: `pm2 status`
- [ ] Check disk space: `df -h`

### Weekly
- [ ] Review error logs: `pm2 logs --err`
- [ ] Check Docker container health: `docker ps`
- [ ] Verify tunnel is running: `pm2 logs lifeos-tunnel`

### Monthly
- [ ] Update Twenty CRM: `docker compose pull && docker compose up -d`
- [ ] Update Node.js dependencies: `npm audit fix`
- [ ] Review Supabase usage and quotas

---

## Configuration Reference

### Required Environment Variables

| Service | Variable | Description |
|---------|----------|-------------|
| twilio-service | `TWILIO_ACCOUNT_SID` | Twilio account identifier |
| twilio-service | `TWILIO_API_KEY` | API key for token generation |
| twilio-service | `TWILIO_API_SECRET` | API secret |
| twilio-service | `TWILIO_TWIML_APP_SID` | TwiML app for outbound calls |
| twilio-service | `TWILIO_PHONE_NUMBER` | Outbound caller ID |
| twilio-service | `SUPABASE_URL` | Supabase project URL |
| twilio-service | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key |
| helm-dashboard | `PORT` | Server port (default: 3100) |
| helm-dashboard | `TWENTY_API_KEY` | Twenty CRM API key |

### Port Allocations

| Port | Service | External Access |
|------|---------|-----------------|
| 3001 | Twenty CRM | twenty.domain.com |
| 3100 | HELM Dashboard | helm.domain.com |
| 3101 | Compass PWA | compass.domain.com |
| 3102 | RedHawk Academy | academy.domain.com |
| 4115 | Twilio Service | Via proxy only |
| 4130 | Voice Service | Via proxy only |

---

*Last Updated: December 24, 2025*
