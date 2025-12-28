# Project 9: Studio Dashboard Launch

## Status: PARTIAL - DOMAIN SETUP PENDING

**Started:** December 28, 2025
**Updated:** December 28, 2025

---

## Summary

Studio Dashboard for marketing users (Leigh). The app and droplet infrastructure are ready - only need Cloudflare DNS record.

## Current State

| Component | Status | Notes |
|-----------|--------|-------|
| Studio App | READY | Running at `/var/www/lids/apps/studio` |
| PM2 Process | RUNNING | `studio` on port 3103 |
| Nginx Config | READY | `/etc/nginx/sites-enabled/studio` |
| SSL Certs | READY | Cloudflare origin certs |
| Cloudflare DNS | MISSING | Need A record for `studio` |

---

## Droplet Configuration (COMPLETE)

### Nginx (`/etc/nginx/sites-enabled/studio`)
```nginx
server {
    listen 80;
    server_name studio.ripemerchant.host;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name studio.ripemerchant.host;

    ssl_certificate /etc/ssl/cloudflare/origin.crt;
    ssl_certificate_key /etc/ssl/cloudflare/origin.key;

    location / {
        proxy_pass http://localhost:3103;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2 Process
```
Name: studio
Script: /var/www/lids/apps/studio/dist/index.cjs
Port: 3103
Status: online
```

---

## Cloudflare DNS Setup (REQUIRED)

**Domain:** ripemerchant.host (in Cloudflare dashboard)

### Add DNS Record

| Field | Value |
|-------|-------|
| Type | A |
| Name | studio |
| IPv4 Address | 165.227.111.24 |
| Proxy status | Proxied (orange cloud ON) |
| TTL | Auto |

### Steps

1. Log into Cloudflare dashboard
2. Select `ripemerchant.host` domain
3. Go to DNS → Records
4. Click "Add record"
5. Enter values from table above
6. Save

### Verify

After DNS propagates (usually instant with Cloudflare):
```bash
# Test from anywhere
curl -I https://studio.ripemerchant.host

# Should return 200 OK
```

---

## What's Already Working

Studio has a full marketing dashboard with:
- **Sarai** - Content Creator agent (posts, captions)
- **Muse** - Strategy Planner agent
- **Quick Post** - Direct links to LinkedIn, TikTok, Google Business
- **Content Ideas** - Pre-built prompts for solar marketing

### Studio Features
- Gold particles animated background
- Dual agent chat (Sarai + Muse)
- Copy-to-clipboard for generated content
- Content ideas chips
- Platform quick-post buttons

---

## Also Completed Today

1. **Removed `/studio` path from ADS** - Studio no longer accessible at `helm.ripemerchant.host/studio`
2. **Rebuilt ADS Dashboard** - Clean navigation without Studio link
3. **Studio is standalone** - Dedicated app at port 3103

---

## User Routing (After DNS Setup)

| User | Role | Primary URL | Notes |
|------|------|-------------|-------|
| Leigh Edwards | CMO | studio.ripemerchant.host | Marketing tools, Sarai/Muse |
| Sales Reps | Rep | helm.ripemerchant.host | ADS dialer, pipeline, CRM |
| David Edwards | Owner | Any | Full access to all dashboards |

---

## Next Steps

1. [ ] **Add Cloudflare DNS record** (only blocking step)
2. [ ] Test `https://studio.ripemerchant.host`
3. [ ] Verify Leigh can log in (Twenty auth already working)

---

*Created: December 28, 2025*
*Updated: December 28, 2025 - Droplet ready, awaiting DNS*
