# Codex Implementation Plan

**Project 1: Security & Configuration Remediation**
*For use with OpenAI Codex, Claude, or similar AI coding assistants*

---

## Status: COMPLETED

**Completed:** December 25, 2025
**Executor:** Codex

### Summary

Removed embedded keys and hardcoded IPs by moving ADS/Compass/RedHawk configuration to env-driven values, and refreshed per-app env templates/ignores for safer setup.

### Files Modified

| File | Changes |
|------|---------|
| `apps/ads-dashboard/client/src/lib/settings.ts` | Env-driven Twenty key, backend host, external domain + validation |
| `apps/ads-dashboard/server/index.ts` | Required BACKEND_HOST, env-driven proxy targets |
| `apps/ads-dashboard/server/routes.ts` | Removed hardcoded Twenty API URL fallback |
| `apps/ads-dashboard/vite.config.ts` | Env-driven proxy targets |
| `apps/ads-dashboard/client/src/pages/settings.tsx` | Removed hardcoded IP placeholder |
| `apps/compass/server/routes.ts` | Env-configured hosts with warnings |
| `apps/compass/client/src/lib/settings.ts` | Env-driven backend host |
| `apps/compass/client/src/lib/user-context.tsx` | Env-driven Twenty workspace lookup |
| `apps/redhawk-academy/client/src/lib/twentyProgressionApi.ts` | Env-hosted Twenty config with warnings |
| `apps/ads-dashboard/.env.example` | Created comprehensive template |
| `apps/compass/.env.example` | Created comprehensive template |
| `apps/redhawk-academy/.env.example` | Created comprehensive template |
| `apps/ads-dashboard/.gitignore` | Added .env exclusions |
| `apps/compass/.gitignore` | Added .env exclusions |
| `apps/redhawk-academy/.gitignore` | Added .env exclusions |

---

## Task Completion Status

| Task | Description | Status |
|------|-------------|--------|
| 1 | Remove API Key from ADS Dashboard Settings | **COMPLETE** |
| 2 | Remove Hardcoded IP from ADS Dashboard Settings | **COMPLETE** |
| 3 | Extract Domain Detection to Environment Variable | **COMPLETE** |
| 4 | Make BACKEND_HOST Required in Server | **COMPLETE** |
| 5 | Use Environment Variables in Vite Config | **COMPLETE** |
| 6 | Remove API Key from RedHawk Academy | **COMPLETE** |
| 7 | Fix COMPASS Server Routes | **COMPLETE** |
| 8 | Fix COMPASS Client Settings | **COMPLETE** |
| 9 | Fix COMPASS User Context | **COMPLETE** |
| 10 | Update .gitignore Files | **COMPLETE** |
| 11 | Create Comprehensive .env.example Files | **COMPLETE** |

---

## Verification (Pending)

Run these commands to verify the implementation:

```bash
# 1. Check no API keys in bundles
cd apps/ads-dashboard && npm run build
grep -r "eyJhbGci" dist/ # Should return nothing

cd apps/redhawk-academy && npm run build
grep -r "eyJhbGci" dist/ # Should return nothing

# 2. Check no hardcoded IPs in source
grep -r "192.168.1.23" apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Should return nothing (except maybe comments/docs)

grep -r "100.66.42.81" apps/ --include="*.ts" --include="*.tsx" | grep -v node_modules
# Should return nothing

# 3. Test startup without env vars
cd apps/ads-dashboard && unset BACKEND_HOST && npm run dev
# Should fail with clear error message

# 4. Test with env vars set
export BACKEND_HOST=100.66.42.81
cd apps/ads-dashboard && npm run dev
# Should start successfully
```

---

## Next Steps

1. Run verification checks above
2. Test ADS dashboard with `BACKEND_HOST` unset - confirm failure path works
3. Test ADS dashboard with `BACKEND_HOST` set - confirm normal startup
4. Deploy to staging and verify proxy connections work
5. Rotate the old Twenty CRM API keys (they were exposed in git history)

---

## Original Task Details (Reference)

<details>
<summary>Click to expand original task specifications</summary>

### Task 1: Remove API Key from ADS Dashboard Settings

**File:** `apps/ads-dashboard/client/src/lib/settings.ts`

**Removed:**
```typescript
const TWENTY_API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Replaced with:**
```typescript
function getTwentyApiKey(): string {
  const envKey = import.meta.env.VITE_TWENTY_API_KEY;
  if (!envKey) {
    console.warn('VITE_TWENTY_API_KEY not set - Twenty CRM features disabled');
    return '';
  }
  return envKey;
}
```

### Task 2: Remove Hardcoded IP from ADS Dashboard Settings

**Changed:**
```typescript
backendHost: import.meta.env.VITE_BACKEND_HOST || "",
```

**Added validation:**
```typescript
if (!settings.backendHost && !isExternalAccess()) {
  console.error('VITE_BACKEND_HOST not configured. Set in .env file.');
}
```

### Task 3: Extract Domain Detection to Environment Variable

**Changed:**
```typescript
const externalDomain = import.meta.env.VITE_EXTERNAL_DOMAIN || 'ripemerchant.host';
```

### Task 4: Make BACKEND_HOST Required in Server

**Added:**
```typescript
const BACKEND_HOST = process.env.BACKEND_HOST;
if (!BACKEND_HOST) {
  console.error('FATAL: BACKEND_HOST environment variable is required');
  process.exit(1);
}
```

### Task 5: Use Environment Variables in Vite Config

**Changed proxy targets to use env vars.**

### Task 6: Remove API Key from RedHawk Academy

**Removed hardcoded fallback, added warning.**

### Task 7-9: Fix COMPASS Configuration

**Removed hardcoded IPs, added env vars with warnings.**

### Task 10-11: Update .gitignore and .env.example Files

**Created proper templates and exclusions.**

</details>

---

## Rollback Plan

If issues occur, revert to previous commit:
```bash
git checkout HEAD~1 -- apps/
```

---

*Implementation completed by Codex - December 25, 2025*
