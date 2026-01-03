# Project 25: Studio Content Creation Suite - Audit Findings

## Executive Summary

Studio currently provides Leigh with AI agents (Sarai/Muse) and a content calendar, but lacks video generation and seamless social publishing. Leigh must manually create videos externally, upload to Postiz UI separately, and track status across multiple tools. This project consolidates the entire content creation workflow into a single wizard-based interface.

**UPDATE (2026-01-02):** Wizard UI is now COMPLETE. Leigh can navigate to `/create` and go through the full 6-step flow. Backend integration (video generation, Postiz scheduling) pending.

---

## Current State Analysis

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  BEFORE: Fragmented Workflow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Get idea ──► Studio /chat (Sarai)      ← Works                         │
│  2. Write script ──► Manual (Notion/Docs)  ← No integration                │
│  3. Create video ──► External tools        ← No integration                │
│  4. Schedule ──► Postiz UI directly        ← Separate login                │
│  5. Track ──► Calendar + Postiz            ← Two places                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  AFTER: Unified Wizard (IMPLEMENTED)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Get idea ──► /create Step 1            ← TikTok/YouTube/Explainer/Image│
│  2. Write script ──► /create Step 2        ← Manual + "Ask Sarai" button   │
│  3. Create video ──► /create Step 3        ← Mock (real API pending)       │
│  4. Preview ──► /create Step 4             ← Phone-frame + controls        │
│  5. Schedule ──► /create Step 5            ← Platform selection + timing   │
│  6. Celebrate ──► /create Step 6           ← Confetti + XP                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Issue Status

### C1: No Video Generation Capability
- **Status:** PARTIALLY RESOLVED
- **Severity:** HIGH → MEDIUM
- **Resolution:** Wizard UI complete with mock generation. Real backend (Phase 1) pending.
- **Evidence:** `GenerationPanel.tsx` has provider selection and progress animation

### C2: Postiz Not Integrated
- **Status:** UI COMPLETE, BACKEND PENDING
- **Severity:** HIGH
- **Resolution:** `SchedulePanel.tsx` has platform selection and API calls. Backend proxy pending (Phase 3).
- **Note:** Postiz deployed to Oracle ARM (193.122.153.249:3200) - Jan 3, 2026

### C3: Sarai Not Specialized for Video Scripts
- **Status:** PARTIALLY RESOLVED
- **Severity:** MEDIUM
- **Resolution:** "Ask Sarai" button in ScriptEditor prompts for video scripts. Full prompt enhancement pending (Phase 4).
- **Evidence:** `ScriptEditor.tsx:41-52` sends video-specific prompt

### C4: Content Calendar Disconnected from Publishing
- **Status:** PENDING
- **Severity:** MEDIUM
- **Resolution:** Will be addressed when Postiz integration complete

---

## Existing Infrastructure

### Postiz
- **URL:** http://193.122.153.249:3200 (Oracle ARM - deployed Jan 3, 2026)
- **Status:** LIVE on Oracle ARM
- **API:** REST at `/api/public/v1/*`
- **OAuth:** TikTok/YouTube pending connection

### Sarai & Muse Agents
- **Sarai:** :4065 - Working, integrated in wizard
- **Muse:** :4066 - Working, available for strategy

### GPU Resources
- **AdmiralEnergy:** RTX 4060 Ti (ComfyUI target)
- **lifeos-arm:** 24GB ARM (Ollama)
- **OpenArt.ai:** Infinite subscription (fallback)

---

## Implementation Status

### COMPLETE: Files Created

```
apps/studio/client/src/
├── pages/
│   └── create.tsx                        # 6-step wizard (122 lines)
└── components/create/
    ├── WizardContainer.tsx               # Progress bar + navigation (75 lines)
    └── steps/
        ├── TypeSelector.tsx              # Content type cards (76 lines)
        ├── ScriptEditor.tsx              # Script + Sarai (125 lines)
        ├── GenerationPanel.tsx           # Provider + progress (145 lines)
        ├── PreviewPanel.tsx              # Phone-frame preview (108 lines)
        ├── SchedulePanel.tsx             # Platforms + timing (178 lines)
        └── SuccessPanel.tsx              # Confetti + XP (150 lines)
```

### COMPLETE: Files Modified

| File | Changes |
|------|---------|
| `apps/studio/client/src/App.tsx` | Added Video icon, `/create` route (5 nav items) |
| `packages/compass-sales/package.json` | Fixed `workspace:*` → `*` |
| `packages/compass-studio/package.json` | Fixed `workspace:*` → `*` |

### PENDING: Backend Files

| File | Purpose | Phase |
|------|---------|-------|
| `LifeOS-Core/.../video-generator/` | Video orchestration service | 1 |
| `apps/studio/server/routes.ts` | Add Postiz + video-gen proxies | 1, 3 |

---

## Target State (Updated)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TARGET: Full End-to-End Flow                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Studio /create Wizard (6 Steps):                                           │
│                                                                              │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│  │  TYPE  │─►│ SCRIPT │─►│GENERATE│─►│PREVIEW │─►│SCHEDULE│─►│SUCCESS │   │
│  │   ✓    │  │   ✓    │  │  mock  │  │   ✓    │  │  mock  │  │   ✓    │   │
│  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘  └────────┘   │
│       │           │           │           │           │           │        │
│       ▼           ▼           ▼           ▼           ▼           ▼        │
│   TikTok/YT   Sarai:4065  ComfyUI/    Phone-frame  Postiz ARM  Confetti   │
│   Explainer   (working)   OpenArt     (working)   (pending)   +50 XP      │
│   Image                   (pending)                                        │
│                                                                              │
│  ✓ = Implemented    mock = UI ready, backend pending                       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Success Criteria (Updated)

**COMPLETE:**
- [x] Leigh can go from idea to success screen in one session
- [x] Wizard has 6 clear steps with progress indicator
- [x] Sarai integration for script generation
- [x] Sarai integration for caption generation
- [x] Phone-frame preview with video controls
- [x] Platform selection (TikTok/YouTube/LinkedIn)
- [x] Schedule now or later options
- [x] XP animation on success (+50 XP)
- [x] Confetti celebration
- [x] "Create Another" flow

**PENDING (Backend):**
- [ ] Video generation via ComfyUI (real)
- [ ] Video generation via OpenArt (fallback)
- [ ] Postiz scheduling actually works
- [ ] XP persists to progression system
- [ ] Calendar reflects scheduled status

---

## Risk Assessment (Updated)

| Risk | Likelihood | Impact | Status |
|------|------------|--------|--------|
| ComfyUI setup complexity | Medium | High | Pending - Phase 1 |
| Video generation slow | High | Medium | Mitigated - progress UI done |
| Postiz OAuth token expiry | Low | High | Pending - Phase 3 |
| AdmiralEnergy offline | Medium | Medium | Mitigated - OpenArt fallback in UI |
| Leigh abandons wizard | Medium | Low | Mitigated - clear 6-step flow |
| npm workspace issues | N/A | N/A | RESOLVED - fixed package.json |

---

## Remaining Work

### Phase 1: Video Generation Service
- Create Express service on admiral-server:4200
- Integrate with ComfyUI (AdmiralEnergy:8188)
- Integrate with OpenArt.ai API
- WebSocket for progress updates
- SQLite job queue

### Phase 3: Postiz Integration
- Deploy Postiz to Oracle ARM (193.122.153.249)
- Add proxy routes to routes.ts
- Configure TikTok/YouTube OAuth

### Phase 4: Sarai Enhancement
- Add TikTok hook prompts
- Add YouTube Shorts prompts
- Platform-specific hashtag generation

---

*Audit Updated: 2026-01-02 - Phase 2 & 5 Complete*
