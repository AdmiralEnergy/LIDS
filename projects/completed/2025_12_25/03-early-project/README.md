# Project 3: Progression System SSOT

## Status: COMPLETED

**Completed:** December 25, 2025

---

## Summary

This project implemented Twenty CRM as the Single Source of Truth (SSOT) for the progression system. Previously, XP earned in the LIDS Dashboard dialer stayed local in Dexie while XP earned in RedHawk Academy synced to Twenty CRM, resulting in two different XP totals.

## What Was Fixed

- Full bidirectional sync between Dexie and Twenty CRM
- Periodic sync every 5 minutes to keep apps in sync
- Debounced post-XP sync after every activity (2 second debounce)
- Offline queue with retry logic for sync failures
- All progression fields now sync (bosses, exams, efficiency metrics)
- Array merge strategy (union) for lists, Twenty wins for scalars

## Files

| File | Description |
|------|-------------|
| [AUDIT_FINDINGS.md](AUDIT_FINDINGS.md) | Detailed findings and sync strategy |
| [CODEX_IMPLEMENTATION_PLAN.md](CODEX_IMPLEMENTATION_PLAN.md) | 10-task implementation guide |

## Files Modified

- `apps/ads-dashboard/client/src/lib/progressionDb.ts` - syncQueue table
- `apps/ads-dashboard/client/src/lib/twentySync.ts` - Full sync logic
- `apps/ads-dashboard/client/src/lib/twentyStatsApi.ts` - API interface
- `apps/ads-dashboard/client/src/features/progression/hooks/useProgression.ts` - Post-XP sync trigger
- `apps/ads-dashboard/client/src/App.tsx` - Periodic sync initialization

## Verification

```javascript
// 1. Check sync queue
indexedDB.open('ADS_Progression').onsuccess = (e) => {
  e.target.result.transaction('syncQueue').objectStore('syncQueue').getAll().onsuccess = (r) => {
    console.log('Sync queue:', r.target.result);
  };
};

// 2. Force sync
import { syncToTwenty, syncFromTwenty } from '@/lib/twentySync';
await syncToTwenty();
await syncFromTwenty();

// 3. Toggle offline/online to test queue flush
```

## Prerequisites

These custom fields must exist in Twenty CRM (repProgressions object):
- `defeatedBosses` - Text (JSON)
- `passedExams` - Text (JSON)
- `efficiencyMetrics` - Text (JSON)
- `lastActivityDate` - DateTime

## Dependencies

- Project 1 (Security) - COMPLETED
- Project 2 (Progression Fixes) - COMPLETED

---

*Implemented by Codex*
