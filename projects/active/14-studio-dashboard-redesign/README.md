# Project 14: Studio Dashboard Redesign

## Status: PHASE 1 COMPLETE

**Started:** December 28, 2025
**Phase 1 Completed:** December 28, 2025

---

## Summary

Redesign Studio as a full marketing dashboard for Leigh (CMO) with content calendar, TikTok workflow, and progression system.

---

## Target User

**Leigh Edwards (CMO)**
- Not tech savvy - needs step-by-step guidance
- Prefers mobile/tablet (Surface Pro 9)
- Gen Z mindset - likes swipe/mobile UX
- Human-in-the-loop for video creation

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Content Calendar + Planning | COMPLETE |
| Phase 2 | MUSE RAG System | PENDING |
| Phase 3 | TikTok Workflow | PENDING |
| Phase 4 | Postiz Integration | **INSTALLED Dec 30, 2025** |
| Phase 5 | Marketing Progression | PENDING |

---

## Twenty CRM Custom Objects

Created via REST API on December 28, 2025:

| Object | ID | Purpose |
|--------|-----|---------|
| `studioContentItem` | `59076336-a524-410f-ac85-9c7ba5858c84` | Content pieces to create/post |
| `studioWeeklyPlan` | `a95fc0e3-6685-45cf-ba4d-2ccf4a72dfd4` | MUSE weekly suggestions |
| `marketingProgression` | `c55ddb2b-d734-4a1e-bcdd-bce928314c41` | Leigh's XP, ranks, badges |

**Field setup script:** `scripts/add_twenty_fields.py`

---

## Phase 1: Content Calendar + Planning (COMPLETE)

### Files Created

- [x] `apps/studio/client/src/lib/contentDb.ts` - Dexie schema for offline cache
- [x] `apps/studio/client/src/pages/calendar.tsx` - Week view calendar with content cards
- [x] `apps/studio/client/src/pages/dashboard.tsx` - Home dashboard with progression
- [x] `scripts/add_twenty_fields.py` - Twenty CRM field setup script

### Files Modified

- [x] `apps/studio/client/src/App.tsx` - Added wouter routing + responsive NavBar
- [x] `apps/studio/server/routes.ts` - Added content/progression API endpoints

### Features Implemented

- **Content Calendar**: Week view with day columns (desktop) / timeline (mobile)
- **Dashboard**: Progression card, quick stats, upcoming content, quick actions
- **Navigation**: Bottom nav on mobile, top nav on desktop
- **API Routes**: Full CRUD for content, weekly plans, and progression
- **XP System**: Level calculation from thresholds, add-xp endpoint

---

## Key Decisions

1. **Scheduling:** Postiz (self-hosted, open-source) instead of Buffer
2. **Marketing Plan Access:** RAG system in LifeOS-Core for MUSE
3. **Priority:** Content calendar + planning view first
4. **Progression:** Octalysis framework, same as ADS
5. **Data Storage:** Twenty CRM (SSOT) + Dexie (local cache)

### Postiz vs Buffer Decision

| Feature | Buffer | Postiz |
|---------|--------|--------|
| Cost | $6-100/mo | Free (self-hosted) |
| TikTok | Yes | Yes |
| LinkedIn | Yes | Yes |
| n8n Integration | Via API | Native |
| Self-hosted | No | Yes |
| Repository | N/A | github.com/gitroomhq/postiz-app |

---

## Data Architecture

```
Twenty CRM (SSOT - Persistent across devices)
    │
    ├── studioContentItems (custom object)
    │   - Content pieces to create/post
    │   - Status tracking (idea → posted)
    │
    ├── studioWeeklyPlans (custom object)
    │   - MUSE's weekly suggestions
    │   - Acceptance tracking
    │
    └── marketingProgressions (custom object)
        - Leigh's XP, ranks, badges
        - Separate from rep progressions
    │
    ▼
Dexie (IndexedDB - Local cache)
    │
    └── Offline support, sync on reconnect
```

**Why Twenty CRM?**
- Persistent across devices (Surface Pro, phone, desktop)
- Already our identity provider
- Custom objects are flexible
- No additional infrastructure

---

## Agent Architecture

Agents are stored in LifeOS-Core (separate repo):

| Agent | Location | Port |
|-------|----------|------|
| MUSE | `C:\LifeOS\LifeOS-Core\agents\python\muse` | 4066 |
| Sarai | `C:\LifeOS\LifeOS-Core\agents\python\sarai` | 4065 |

---

## Phase 4: Postiz Integration (PLANNED)

### Architecture Decision

**Postiz lives on the DROPLET, not admiral-server.**

Postiz is to Studio what Twenty is to ADS - a headless backend service that Leigh never directly sees.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DROPLET (165.227.111.24)                                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Twenty CRM (:3001)     Postiz (:3200)     Studio (:3100)              │
│       │                      │                   │                       │
│       │                      │                   │                       │
│       └──────────────────────┴───────────────────┘                       │
│                              │                                           │
│                     Studio Server proxies                                │
│                     /api/postiz/* → localhost:3200                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Postiz Has TikTok API Access

Postiz went through TikTok's developer audit process ONCE. All self-hosters benefit:

1. Postiz applied for TikTok Developer Account
2. Built and submitted their app for audit
3. Got approved App ID
4. When Leigh connects TikTok → OAuth to Postiz's approved app
5. Postiz posts using THEIR app + LEIGH's OAuth token

**Result:** Leigh gets TikTok API access without Admiral Energy applying.

### Postiz Deployment - COMPLETED Dec 30, 2025

| Step | Action | Status |
|------|--------|--------|
| 1 | Clone Postiz repo on droplet | ✅ `/var/www/postiz` |
| 2 | Configure Docker Compose (port 3200) | ✅ Running |
| 3 | Add nginx config: `postiz.ripemerchant.host` | ✅ Configured |
| 4 | Add Cloudflare DNS A record | ✅ DONE Dec 30, 2025 |
| 5 | Connect TikTok + LinkedIn accounts via OAuth | PENDING |
| 6 | Add proxy routes in Studio: `/api/postiz/*` | PENDING |
| 7 | Build upload UI in Studio calendar | PENDING |

**Postiz Docker Stack:**
```
postiz           :3200 → ghcr.io/gitroomhq/postiz-app:latest
postiz-postgres  :5432 → postgres:17-alpine
postiz-redis     :6379 → redis:7.2-alpine
```

**RAM Usage:** ~500MB (droplet has 1.1GB available after install)

### Leigh's Workflow (Zero File Operations)

```
1. MUSE suggests: "Create TikTok about propane safety"
2. Leigh creates video in Canva (exports to Downloads)
3. Opens Studio → drag-drop upload OR file picker
4. Studio uploads to Postiz Content Library
5. Leigh picks schedule date in calendar
6. Postiz posts at scheduled time
7. Status syncs back to Twenty CRM
```

### TikTok API Limitations

| Limit | Value |
|-------|-------|
| Requests/minute | 6 per access token |
| Posts/day | ~15 per creator account |
| Scheduling | Beyond native 10-day limit |
| Audit status | Postiz is audited → public posts work |

### Canva Integration

**No direct API integration possible** (requires Enterprise $$$).

Leigh's flow:
1. Create in Canva web/app
2. Export video to local
3. Upload via Studio UI
4. Schedule via Postiz

---

## Service Architecture (Complete)

| Service | Port | Location | Role |
|---------|------|----------|------|
| **Twenty CRM** | 3001 | Droplet | Auth + Data SSOT |
| **Postiz** | 3200 | Droplet | Social scheduling |
| **Studio** | 3100 | Droplet | Marketing dashboard |
| **MUSE** | 4066 | Admiral | Strategy agent |
| **Sarai** | 4065 | Admiral | Content agent |

**Pattern:** Postiz is to Studio what Twenty is to ADS.

---

*Last Updated: December 30, 2025 - Postiz Installed on Droplet*
