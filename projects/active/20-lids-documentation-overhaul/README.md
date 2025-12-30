# Project 20: LIDS Documentation Overhaul

## Status: ✅ ALL PHASES COMPLETE

**Created:** December 29, 2025
**Completed:** December 29, 2025
**Priority:** P2 (Documentation)

---

## Summary

Analyze the entire LIDS monorepo and update all architecture documentation to reflect the current state of apps, packages, projects, and infrastructure.

---

## Problem Statement

Documentation has fallen behind the rapid development of LIDS:

| Gap | Impact |
|-----|--------|
| ARCHITECTURE.md outdated | Missing lids-unified app, packages section, project status |
| 3 apps missing README.md | compass, redhawk-academy, lids-unified have no documentation |
| PORT_REFERENCE.md incomplete | Missing Studio (3103), lids-unified (5001), Sarai/MUSE agents |
| Service inventory inaccurate | Shows 6 services, reality has 7+ apps |

---

## Current State Analysis

### Apps Inventory (7 total)

| App | Port (Dev/Prod) | URL | Status | Purpose |
|-----|-----------------|-----|--------|---------|
| ads-dashboard | 3100/5000 | helm.ripemerchant.host | LIVE | Sales CRM + Dialer |
| studio | 3103/3103 | studio.ripemerchant.host | LIVE | Marketing Dashboard |
| compass | 3101/3101 | compass.ripemerchant.host | LIVE | AI Rep Assistant (PWA) |
| redhawk-academy | 3102/3102 | academy.ripemerchant.host | LIVE | Sales Training |
| twenty-crm | -/3001 | twenty.ripemerchant.host | LIVE | CRM (Docker) |
| admiral-chat | - | (shared package) | Phase 4 | Team Messaging |
| lids-unified | 5001/5000 | (planned) | Phase 2 | Unified API Gateway |

### Packages Inventory (5 total)

| Package | Purpose | Status |
|---------|---------|--------|
| @lids/admiral-chat | Team chat components + hooks | MVP Complete |
| @lids/compass-core | Base agent framework | Stable |
| @lids/compass-sales | Sales agents (Coach, Intel, Guard) | Phase 1 Complete |
| @lids/compass-studio | Marketing agents (Sarai, MUSE) | Planning |
| shared | Common utilities | Empty/Placeholder |

### Documentation Gaps

**Gap 1: ARCHITECTURE.md Outdated**
- Missing lids-unified app
- Missing packages section
- Admiral Chat not fully documented
- Project status references outdated

**Gap 2: App READMEs Incomplete**
- Apps WITH README.md: ads-dashboard, studio, admiral-chat, twenty-crm
- Apps WITHOUT README.md: compass, redhawk-academy, lids-unified

**Gap 3: PORT_REFERENCE.md Missing Entries**
- Studio (3103) - Not listed at all
- lids-unified (5001) - New app
- Sarai (4065) and MUSE (4066) - Marketing agents

**Gap 4: Service Inventory Incomplete**
- ARCHITECTURE.md has 6 services, reality has 7+ apps
- Admiral-server services list missing Sarai, MUSE, Postiz

---

## Phases

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Update docs/architecture/ARCHITECTURE.md | ✅ COMPLETE |
| Phase 2 | Create 3 missing App READMEs | ✅ COMPLETE |
| Phase 3 | Update root documentation (README.md, PORT_REFERENCE.md) | ✅ COMPLETE |
| Phase 4 | Verify project status references current | ✅ COMPLETE |

---

## Phase 1: Update ARCHITECTURE.md

**File:** `docs/architecture/ARCHITECTURE.md`

**Changes:**
- Update version to 3.0
- Add comprehensive Apps Inventory table (all 7 apps)
- Add Packages section with all 5 packages
- Update Service Inventory with accurate ports
- Add Admiral Chat architecture section
- Add lids-unified server details (in-progress)
- Update project status references
- Add "Planned: Postiz" to Studio architecture

**New Structure:**
```
# LIDS Monorepo - Service Architecture
**Version:** 3.0 | **Updated:** December 29, 2025

## Overview
## Three Pillars (Leads, Structure, Progression)
## Apps Inventory (7 apps with table)
## Packages Inventory (5 packages with table)
## Service Inventory
  - DO Droplet services
  - Admiral-server services (optional)
## Authentication Architecture
## Dialer Component Architecture
## SMS Architecture
## Admiral Chat Architecture (NEW)
## Studio Dashboard Architecture
## Progression System (reference to PROGRESSION_SYSTEM.md)
## Project Status Summary (NEW)
## Related Documentation
```

---

## Phase 2: Create App READMEs

### 2a. Create apps/compass/README.md

```markdown
# COMPASS - AI Rep Assistant

**Purpose:** Mobile PWA - AI-powered rep assistant for field sales
**Tech Stack:** React + Express + vite-plugin-pwa
**Port:** 3101 (dev/prod)
**URL:** compass.ripemerchant.host

## Features
- Lead enrichment
- Objection handling
- AI suggestions

## Micro-agents
| Agent | Status | Purpose |
|-------|--------|---------|
| Coach | Wired | Sales coaching suggestions |
| Intel | Next | Lead intelligence |
| Guard | Planning | Compliance checking |
| Scribe | Planning | Call notes generation |

## Development
\`\`\`bash
cd apps/compass
npm run dev  # http://localhost:3101
\`\`\`
```

### 2b. Create apps/redhawk-academy/README.md

```markdown
# RedHawk Academy - Sales Training

**Purpose:** Sales training platform with certifications
**Tech Stack:** React + Express
**Port:** 3102 (dev/prod)
**URL:** academy.ripemerchant.host

## Features
- Training modules
- Certification exams
- Boss battles (gamified challenges)
- Progression gates

## Integration
- Twenty CRM progression sync
- Future: Academy cohort channels (Project 16 Phase 6)

## Development
\`\`\`bash
cd apps/redhawk-academy
npm run dev  # http://localhost:3102
\`\`\`
```

### 2c. Create apps/lids-unified/README.md

```markdown
# LIDS Unified - API Gateway

**Purpose:** Unified API gateway (Project 19)
**Status:** Phase 2 In Progress
**Goal:** Single Node.js process for all 4 SPAs
**Port:** 5001 (dev), 5000 (prod - replaces current setup)
**RAM Savings:** ~100MB target

## Architecture
See: [Project 19: Unified LIDS Architecture](../../projects/19-unified-lids-architecture/README.md)

## Development
\`\`\`bash
cd apps/lids-unified
npm install
npm run dev  # http://localhost:5001
\`\`\`
```

---

## Phase 3: Update Root Documentation

### 3a. Update README.md
- Current app status table
- Package inventory
- Quick start updated

### 3b. Update PORT_REFERENCE.md
- Add Studio (3103)
- Add lids-unified port (5001)
- Verify all ports accurate

---

## Phase 4: Verify Project References

**Files to check:**
- docs/PROGRESSION_SYSTEM.md - Already updated (Project 15/18 status)
- CLAUDE.md - Verify project references current

---

## Files Summary

### Must Modify (3 files)

| File | Changes |
|------|---------|
| docs/architecture/ARCHITECTURE.md | Add apps/packages inventory, Admiral Chat section, project status |
| PORT_REFERENCE.md | Add Studio (3103), lids-unified (5001), Sarai/MUSE agents |
| README.md | Minor updates - packages section, accurate quick start |

### Must Create (3 new files)

| File | Template |
|------|----------|
| apps/compass/README.md | PWA rep assistant with micro-agents |
| apps/redhawk-academy/README.md | Training platform with progression |
| apps/lids-unified/README.md | Unified server (Project 19 status) |

### Already Updated (Earlier Today)

- docs/PROGRESSION_SYSTEM.md - Fixed issues section
- docs/architecture/ARCHITECTURE.md - Version 2.1 (will become 3.0)
- projects/15-dialer-data-architecture/README.md - ALL COMPLETE
- projects/16-admiral-chat/README.md - Phase 4 COMPLETE
- projects/17-compass-micro-agents/README.md - Phase 1 COMPLETE
- projects/18-progression-system-fix/README.md - SUPERSEDED

---

## Success Criteria

- [x] ARCHITECTURE.md reflects all 7 apps
- [x] ARCHITECTURE.md includes packages section
- [x] All app READMEs exist and are current
- [x] PORT_REFERENCE.md includes lids-unified
- [x] Project status references are accurate
- [x] No documentation references outdated infrastructure

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| Phase 1: ARCHITECTURE.md | 30 min |
| Phase 2: App READMEs | 20 min |
| Phase 3: Root docs | 10 min |
| Phase 4: Project refs | 5 min |
| **Total** | **~1 hour** |

---

## Related Projects

- [Project 19: Unified LIDS Architecture](../19-unified-lids-architecture/README.md) - lids-unified context
- [Project 16: Admiral Chat](../16-admiral-chat/README.md) - Chat architecture
- [Project 17: COMPASS Micro-Agents](../17-compass-micro-agents/README.md) - Agent framework

---

*Created: December 29, 2025*
