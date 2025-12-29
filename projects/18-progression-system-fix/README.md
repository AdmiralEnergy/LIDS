# Project 18: Progression System Fix

## Status: READY FOR IMPLEMENTATION

**Started:** December 29, 2025

---

## Summary

Fix the ADS Dashboard progression system to sync with Twenty CRM. Currently, progression data is stored only in IndexedDB and never persists to the server.

**Why This Matters:** The progression system is one of THREE CORE PILLARS of ADS. 70% of solar reps quit in the first month because they can't see their progress. This system shows improvement BEFORE the first sale.

---

## The Problem

From `docs/PROGRESSION_SYSTEM.md` Known Issues:
1. **Sync not implemented in ADS** - Currently IndexedDB only, no Twenty sync
2. **No repProgressions object in Twenty** - May need to create custom object
3. **Badge/Exam sync gap** - RedHawk badges not appearing in ADS

**Impact:** Rep earns XP, it shows in UI, they close browser, data is lost or stuck on that device.

---

## The Solution

1. Create/verify `repProgressions` custom object in Twenty CRM
2. Implement sync in `twentySync.ts` (reference RedHawk Academy's pattern)
3. Connect existing progression features to Twenty sync
4. Mirror RedHawk Academy data (exams, certifications, boss battles)
5. Calculate efficiency metrics from call data

---

## Authoritative Documentation

**DO NOT INVENT REQUIREMENTS.** All specs are documented:

| Document | Location | Contains |
|----------|----------|----------|
| SalesOperativeProgression.md | LifeOS-Core/docs/_SYSTEMS/LIDS/RedHawk_Training_Academy/Admiral Energy Sales Academy/ | Rank requirements, XP sources, badge tiers |
| redhawk.md | LifeOS-Core/agents/apex/redhawk/ | RedHawk API, modules, exams |
| PROGRESSION_SYSTEM.md | LIDS/docs/ | Twenty CRM schema, sync strategy |
| REDHAWK_ACADEMY.md | LIDS/docs/ | App integration, twentyProgressionApi.ts |

---

## Files to Modify

| File | Changes |
|------|---------|
| `lib/twentySync.ts` | Add progression sync functions |
| `lib/progressionDb.ts` | Add Twenty sync on write |
| `features/progression/hooks/useProgression.ts` | Add sync triggers |
| `contexts/user-context.tsx` | Ensure workspaceMemberId available |

---

## Success Criteria

- [ ] repProgressions custom object exists in Twenty CRM
- [ ] XP earned in ADS syncs to Twenty within 5 seconds
- [ ] Closing browser preserves progression (from Twenty)
- [ ] RedHawk badges/certifications appear in ADS
- [ ] Efficiency metrics calculated from call data
- [ ] workspaceMemberId (not email) links all data

---

## Related Projects

- **Project 15:** Dialer Data Architecture (login system - COMPLETE)
- **Project 17:** COMPASS Micro-Agents (Coach agent - COMPLETE)

---

*Last Updated: December 29, 2025*
