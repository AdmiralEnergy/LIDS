# Gemini Context: LIDS Repository

## 1. Project Overview
**Name:** LIDS (Live Interactive Dashboard)
**Purpose:** Frontend-first sales software for Admiral Energy solar reps.
**Type:** Monorepo (npm workspaces).
**Stack:** React (Vite), TypeScript, Tailwind CSS, Dexie.js (Offline-first), Express (Proxy).
**Identity Provider:** Twenty CRM (via `workspaceMemberId`).

## 2. Core Mandates
*   **Frontend-First:** The product is the UI/UX in `apps/ads-dashboard`.
*   **Offline-First:** Critical data lives in Dexie (IndexedDB) and syncs to Twenty CRM.
*   **Auth:** **Strictly** use Twenty CRM for identity. DO NOT implement Supabase, Firebase, or other auth.
*   **Secrets:** NO API keys in client-side code (except workspace-scoped public keys). Use server-side proxies.
*   **Workflow:** **Must** use the `projects/` directory structure for all non-trivial work.

## 3. Directory Structure
| Path | Description |
|------|-------------|
| `apps/ads-dashboard` | **Primary App**. Sales rep dashboard. High-touch area. |
| `apps/compass` | Mobile PWA / Agent interface. |
| `apps/redhawk-academy` | Gamified training platform (LMS). |
| `apps/twenty-crm` | Canonical CRM instance (Dockerized). **DO NOT TOUCH**. |
| `packages/` | Shared libraries (`admiral-chat`, `compass-core`). |
| `projects/` | **Work Management**. See Workflow below. |
| `docs/` | Architecture and deployment docs. |

## 4. Development Workflow ("The Project System")
**Rule:** Do not edit code randomly. Isolate work in `projects/`.

1.  **Check Active Projects:** `projects/active/`
    *   *Note:* Check for conflicts with active projects like `31-lead-assignment-by-rep` or `18-progression-system-fix`.
2.  **Start New Project:**
    *   Create `projects/active/XX-project-name/`
    *   Create `AUDIT_FINDINGS.md` (Analysis of current state vs target)
    *   Create `CODEX_IMPLEMENTATION_PLAN.md` (Step-by-step plan)
3.  **Execute:** Modify code based on the plan.
4.  **Complete:** Move folder to `projects/completed/YYYY_MM_DD/`.

## 5. ADS Dashboard Internals (Developer Guide)
**Root:** `apps/ads-dashboard`

### Critical Files
*   **Data Layer:** `client/src/providers/twentyDataProvider.ts` (1200+ lines). Handles ALL CRUD interactions with Twenty CRM.
*   **Sync Logic:** `client/src/lib/twentySync.ts`. Manages the bidirectional sync between Dexie (local) and Twenty (remote).
*   **Configuration:** `client/src/lib/settings.ts`. Resolves API URLs based on environment (Dev vs Prod vs LAN).
*   **Stats/Gamification:** `client/src/lib/twentyStatsApi.ts`. Calculates XP, ranks, and efficiency metrics.

### Key Concepts
*   **Identity:** `workspaceMemberId` is the *only* immutable user key. `email` is mutable.
*   **Sync Pattern:** UI -> Dexie (Instant) -> Sync Queue -> Twenty CRM (Async).
*   **Leads:** Stored as `Person` objects in Twenty with custom PropStream fields (`cell1`, `tcpaStatus`, etc.).

## 6. Architecture & Infrastructure
*   **Production:** DigitalOcean Droplet (Standalone).
*   **Optional Backend:** `admiral-server` (AI/Voice). LIDS must work even if this is down.
*   **Connectivity:**
    *   **LIDS UI** -> **Dexie** (Local)
    *   **LIDS UI** -> **Twenty CRM** (Sync)
    *   **LIDS UI** -> **Admiral Server** (Optional, via Tailscale)

## 7. Critical References
*   **Auth/Identity:** `apps/ads-dashboard/twenty-crm/TWENTY_CRM_INTEGRATION.md` (Read this before touching auth/sync)
*   **System Map:** `docs/architecture/ARCHITECTURE.md`
*   **Deployment:** `docs/architecture/DEPLOYMENT_CHECKLIST.md`

## 8. User Context
*   **Users:** Solar sales reps (Edwin, Jonathan, Kareem).
*   **Environment:** Mobile/Tablet, bad network conditions (between doors).
*   **Priorities:** Speed, Offline reliability, Gamification (XP/Progress).

## 9. Key Commands
*   `npm run dev`: Start local development servers (LIDS: 3100, Compass: 3101).
*   `npm run build`: Build all workspaces.
*   `/help`: View agent help.