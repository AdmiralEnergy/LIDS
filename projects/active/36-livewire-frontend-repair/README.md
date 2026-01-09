# Project 36: LiveWire Frontend Repair

**Status:** IN PROGRESS
**Started:** January 8, 2026
**Owner:** Claude (Terminal)

## Objective

Fix broken Approve/Reject buttons in the LiveWire Control dashboard by implementing the missing backend feedback endpoint.

## Problem

The frontend `LiveWireControl.tsx` calls `POST /api/livewire/leads/:id/feedback` with `{ action: 'approved' | 'rejected' }`, but the backend `agents/livewire/src/index.ts` lacked this route, causing 404 errors.

## Solution

Added a compatibility endpoint that bridges the frontend's expected API contract with the backend's existing `OutcomeTracker` system.

## Changes Made

| File | Change |
|------|--------|
| `LifeOS-Core/agents/livewire/src/index.ts` | Added `POST /leads/:leadId/feedback` endpoint at line 1528 |

## Technical Details

The new endpoint maps frontend actions to backend systems:
- `approved` -> `OutcomeTracker.recordOutcome(leadId, 'qualified')` + status update to `qualified`
- `rejected` -> `OutcomeTracker.recordOutcome(leadId, 'rejected')` + status update to `rejected`

## Verification

- [x] Code added to `index.ts`
- [x] TypeScript compiles (CJS/ESM build succeeds)
- [ ] Service restart on admiral-server (`pm2 restart livewire`)
- [ ] Manual test: Click Approve/Reject in dashboard

## Next Steps

1. Deploy to admiral-server: `ssh edwardsdavid913@100.66.42.81 "cd ~/LifeOS-Core && git pull && pm2 restart livewire"`
2. Test from LIDS Dashboard
3. Mark project complete

## Related Documents

- [Audit](./audit.md)
- [Implementation Plan](./CODEX_IMPLEMENTATION_PLAN.md)
