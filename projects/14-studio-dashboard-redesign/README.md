# Project 14: Studio Dashboard Redesign

## Status: IN PROGRESS

**Started:** December 28, 2025

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
| Phase 1 | Content Calendar + Planning | IN PROGRESS |
| Phase 2 | MUSE RAG System | PENDING |
| Phase 3 | TikTok Workflow | PENDING |
| Phase 4 | Buffer Integration | PENDING |
| Phase 5 | Marketing Progression | PENDING |

---

## Phase 1: Content Calendar + Planning

### Files to Create

- [ ] `apps/studio/client/src/lib/contentDb.ts` - Dexie schema
- [ ] `apps/studio/client/src/pages/calendar.tsx` - Calendar view
- [ ] `apps/studio/client/src/pages/dashboard.tsx` - Home dashboard
- [ ] `apps/studio/client/src/features/calendar/` - Calendar components

### Files to Modify

- [ ] `apps/studio/client/src/App.tsx` - Add routing
- [ ] `apps/studio/server/routes.ts` - Add content endpoints

---

## Key Decisions

1. **Scheduling:** Buffer (subscription active), manual posting as fallback
2. **Marketing Plan Access:** RAG system in LifeOS-Core for MUSE
3. **Priority:** Content calendar + planning view first
4. **Progression:** Octalysis framework, same as ADS
5. **Data Storage:** Twenty CRM (SSOT) + Dexie (local cache)

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

*Last Updated: December 28, 2025*
