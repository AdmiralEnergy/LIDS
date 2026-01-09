# Implementation Plan: LiveWire Frontend Repair

**Project:** 36-livewire-frontend-repair
**Objective:** Fix broken Approve/Reject buttons in LiveWire Control by implementing the missing backend route.

## 1. Context
The frontend `LiveWireControl.tsx` calls `POST /api/livewire/leads/:id/feedback` with `{ action: 'approved' | 'rejected' }`.
The backend `agents/livewire/src/index.ts` lacks this specific route, causing 404s.

## 2. Execution Steps

### Phase 1: Backend Bridge
1.  **Modify `LifeOS-Core/agents/livewire/src/index.ts`**:
    *   Add a new route `server.post('/leads/:leadId/feedback')`.
    *   Logic:
        *   If `action === 'approved'`, call `OutcomeTracker.recordOutcome(leadId, 'qualified')`.
        *   If `action === 'rejected'`, call `OutcomeTracker.recordOutcome(leadId, 'rejected')`.
        *   Return success.

### Phase 2: Verification
1.  **Restart Service:** `pm2 restart livewire` (via SSH/Terminal Claude).
2.  **Test:** Click Approve/Reject in the dashboard.

## 3. Claude Code Prompt

Copy and paste this into the Terminal Instance:

```bash
# Project: 36-livewire-frontend-repair
# Target: LifeOS-Core/agents/livewire

We need to fix a broken API contract between the Command Dashboard and the LiveWire backend.

**Context:**
The frontend sends approval/rejection actions to `POST /leads/:leadId/feedback`. This endpoint does not exist in the backend, causing 404 errors.

**Task:**
1.  Edit `LifeOS-Core/agents/livewire/src/index.ts`.
2.  Find the `LEAD ENRICHMENT` section (around line 1700). Insert the new route BEFORE that section.
3.  Implement the following route handler:

```typescript
  // ========================
  // COMPATIBILITY ENDPOINT (Fixes LIDS Dashboard Buttons)
  // ========================
  server.post<{ 
    Params: { leadId: string }; 
    Body: { action: 'approved' | 'rejected'; message?: string; reason?: string }; 
  }>('/leads/:leadId/feedback', async (request) => {
    const { leadId } = request.params;
    const { action, message, reason } = request.body || {};

    console.log(`[API] Feedback received for ${leadId}: ${action}`);

    if (action === 'approved') {
      // Map 'approved' to 'qualified' outcome
      await OutcomeTracker.recordOutcome(leadId, 'qualified', { 
        notes: message || 'Approved via Dashboard' 
      });
      // Also update status to contacted/active if needed
      await LeadsConfig.updateLeadStatus(leadId, 'contacted');
    } 
    else if (action === 'rejected') {
      // Map 'rejected' to 'rejected' outcome
      await OutcomeTracker.recordOutcome(leadId, 'rejected', { 
        notes: reason || 'Rejected via Dashboard' 
      });
      // Also update status to dismissed
      await LeadsConfig.updateLeadStatus(leadId, 'dismissed');
    }

    return { success: true, message: `Lead ${action} successfully` };
  });
```

4.  **Verify:** Check that `OutcomeTracker` and `LeadsConfig` are imported (they should be already).
```