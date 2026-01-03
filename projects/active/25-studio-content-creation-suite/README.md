# Project 25: Studio Content Creation Suite

**Status:** IN PROGRESS
**Started:** 2026-01-02
**Owner:** David Edwards
**Priority:** P1

---

## Overview

Transform Studio into a seamless content creation and publishing hub for Leigh (CMO). This project integrates:

1. **Video Generation** - Hybrid approach using ComfyUI (local GPU), OpenArt.ai (cloud), and video_explainer (long-form)
2. **Headless Postiz** - Social scheduling API integration (deployed to Oracle ARM 193.122.153.249:3200)
3. **Wizard-based UX** - Step-by-step flow: Type -> Script -> Generate -> Preview -> Schedule -> Success
4. **Agent Enhancement** - Sarai generates scripts, Muse recommends timing

**Target Platforms:** TikTok + YouTube Shorts (video-first strategy)

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Video Generation Service (admiral-server :4200) | **COMPLETE** |
| Phase 2 | Studio Create Wizard UI (/create page) | **COMPLETE** |
| Phase 3 | Postiz API Integration (Oracle ARM :3200) | **COMPLETE** |
| Phase 4 | Sarai Script Generation Enhancement | Pending |
| Phase 5 | Navigation & Polish | **COMPLETE** |

---

## Completed Work

### Phase 2 & 5: Wizard UI + Navigation (COMPLETE)

**Files Created:**
```
apps/studio/client/src/
├── pages/
│   └── create.tsx                        # 6-step wizard page
└── components/create/
    ├── WizardContainer.tsx               # Progress bar + step navigation
    └── steps/
        ├── TypeSelector.tsx              # TikTok/YouTube/Explainer/Image selection
        ├── ScriptEditor.tsx              # Script editor + "Ask Sarai" button
        ├── GenerationPanel.tsx           # Provider selection + mock generation
        ├── PreviewPanel.tsx              # Phone-frame video preview
        ├── SchedulePanel.tsx             # Platform + caption + timing
        └── SuccessPanel.tsx              # Confetti animation + XP display
```

**Files Modified:**
| File | Changes |
|------|---------|
| `apps/studio/client/src/App.tsx` | Added `/create` route, Video icon in nav (5 items) |
| `packages/compass-sales/package.json` | Fixed pnpm→npm workspace syntax (`workspace:*` → `*`) |
| `packages/compass-studio/package.json` | Fixed pnpm→npm workspace syntax (`workspace:*` → `*`) |

**Wizard Flow:**
```
┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
│  TYPE   │──►│ SCRIPT  │──►│GENERATE │──►│ PREVIEW │──►│SCHEDULE │──►│ SUCCESS │
└─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘
     │             │             │             │             │             │
     ▼             ▼             ▼             ▼             ▼             ▼
 TikTok/YT    Sarai API     ComfyUI/      Phone-frame   Postiz API    Confetti
 Explainer    + Tips        OpenArt       + controls    + caption     +50 XP
 Image        panel         (mock now)    + download    generation
```

---

## Architecture

```
Studio (Droplet :3103)
    │
    ├──► /create wizard (IMPLEMENTED)
    │       │
    │       ├── Step 1: Type (TikTok/YouTube/Explainer/Image)
    │       ├── Step 2: Script (manual or Sarai-generated)
    │       ├── Step 3: Generate (ComfyUI/OpenArt - mock for now)
    │       ├── Step 4: Preview (phone-frame video player)
    │       ├── Step 5: Schedule (platform selection + timing)
    │       └── Step 6: Success (confetti + XP animation)
    │
    ├──► /api/video-gen/* → admiral-server:4200 (TODO: Phase 1)
    ├──► /api/postiz/*    → Oracle ARM:3200 (TODO: Phase 3)
    ├──► /api/sarai/*     → admiral-server:4065 (working)
    └──► /api/muse/*      → admiral-server:4066 (working)
```

---

## Current Functionality

### What Works Now
- [x] Full wizard UI with 6 steps
- [x] Content type selection cards (TikTok/YouTube/Explainer/Image)
- [x] Script editor with word count + estimated duration
- [x] "Ask Sarai" button for script generation
- [x] Script tips panel (togglable)
- [x] Style selection (Energetic/Professional/Casual/Educational)
- [x] Provider selection (Auto/ComfyUI/OpenArt)
- [x] Mock video generation with animated progress bar
- [x] Phone-frame preview with play/pause/mute controls
- [x] Download button for generated content
- [x] Platform selection (TikTok/YouTube/LinkedIn)
- [x] Caption editor with "Generate" via Sarai
- [x] Schedule now or later options
- [x] Success screen with CSS confetti animation
- [x] Animated XP counter (+50 XP)
- [x] "Create Another" and "View Calendar" buttons
- [x] Video icon in navigation (5 nav items total)

### What Needs Backend (Future Phases)
- [x] Real video generation via ComfyUI (COMPLETE - service on admiral-server:4200)
- [x] Real Postiz scheduling API (COMPLETE - proxy routes added)
- [ ] XP persistence to Twenty CRM progression system
- [ ] Video storage and retrieval

---

## Remaining Work

### Phase 1: Video Generation Service (admiral-server)
**Location:** `LifeOS-Core/agents/infrastructure/video-generator/`

```
src/
├── index.ts              # Express + WebSocket server on :4200
├── routes/generate.ts    # POST /api/generate, GET /api/status/:id
├── services/comfyui.ts   # ComfyUI API (AdmiralEnergy:8188)
├── services/openart.ts   # OpenArt.ai API
└── queue/jobQueue.ts     # SQLite job persistence
```

### Phase 3: Postiz API Integration
**Note:** Postiz moving from Droplet to Oracle ARM (193.122.153.249)

Add to `apps/studio/server/routes.ts`:
```typescript
const POSTIZ_URL = process.env.POSTIZ_URL || 'http://193.122.153.249:3200';

app.get('/api/postiz/posts', ...) // List scheduled
app.post('/api/postiz/posts', ...) // Create/schedule
app.post('/api/postiz/upload', ...) // Upload media
app.get('/api/postiz/integrations', ...) // Connected accounts
```

### Phase 4: Sarai Enhancement
Add specialized prompts for:
- TikTok hooks (first 3 seconds)
- YouTube Shorts (60s max)
- Platform-specific hashtags

---

## Success Criteria

**Completed:**
- [x] Leigh can navigate to /create from Studio
- [x] Wizard guides through complete 6-step flow
- [x] Sarai integration for script generation
- [x] Sarai integration for caption generation
- [x] Preview shows content in phone-frame
- [x] Platform selection for TikTok/YouTube/LinkedIn
- [x] Schedule now or later options
- [x] Celebratory success screen with XP

**Pending:**
- [ ] Video generation works with ComfyUI (primary)
- [ ] OpenArt.ai works as fallback
- [ ] Posts schedule to platforms via Postiz
- [ ] XP persists to progression system

---

## Verification

```bash
# Build Studio (verified working)
cd apps/studio && npm run build

# Local development
npm run dev:studio
# → http://localhost:3103/create

# Production (after deploy)
https://studio.ripemerchant.host/create
```

---

## Dependencies

**Available:**
- [x] Sarai agent at :4065 (working)
- [x] Muse agent at :4066 (working)
- [x] OpenArt.ai infinite subscription
- [x] Studio build passing (verified)
- [x] npm workspaces fixed

**To Set Up:**
- [ ] ComfyUI on AdmiralEnergy (RTX 4060 Ti)
- [ ] video-generator service on admiral-server (:4200)
- [ ] Postiz on Oracle ARM (:3200)
- [ ] TikTok/YouTube OAuth in Postiz

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| ComfyUI unavailable | Medium | Medium | Auto-fallback to OpenArt.ai |
| Long generation times | High | Medium | Progress bar, background jobs |
| Postiz OAuth expires | Low | High | Auto-refresh, notify Leigh |
| Oracle ARM connectivity | Low | Medium | Tailscale tunnel |

---

## Rollback Plan

1. **Phase 2 rollback:** Revert App.tsx, delete `components/create/` and `pages/create.tsx`
2. **Phase 1 rollback:** Stop video-generator PM2 process
3. **Phase 3 rollback:** Remove Postiz proxy routes from routes.ts

---

## Related Documentation

- Postiz setup: `apps/studio/postiz/README.md`
- Studio app: `apps/studio/README.md`
- Infrastructure: `docs/architecture/Admiral Energy Infrastructure Registry v2.3.md`
- video_explainer: https://github.com/prajwal-y/video_explainer

---

*Last Updated: 2026-01-04 - Phase 1, 2, 3, & 5 Complete*
