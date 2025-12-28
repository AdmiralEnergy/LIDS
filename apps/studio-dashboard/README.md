# Studio Dashboard (v2)

**Next-generation Marketing Dashboard using shared COMPASS components**

Status: IN DEVELOPMENT

---

## Overview

This is the **v2 Studio Dashboard** - a redesigned marketing command center that leverages the shared `@lids/compass-core` and `@lids/compass-studio` packages.

### Why v2?

| Version | Location | Status | Architecture |
|---------|----------|--------|--------------|
| **v1** (current) | `apps/studio` | LIVE at studio.ripemerchant.host | Standalone with Sarai/Muse agents |
| **v2** (this) | `apps/studio-dashboard` | IN DEVELOPMENT | Uses shared COMPASS packages |

v2 integrates the COMPASS AI chat as a sidebar component while adding dashboard-specific features like content calendar and campaign management.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Studio Dashboard v2                                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐  ┌────────────────────────────┐  ┌──────────────────┐ │
│  │   Sidebar    │  │      Main Content          │  │  COMPASS Chat   │ │
│  │   - Nav      │  │   - Content Calendar       │  │  (ChatWindow)   │ │
│  │   - Links    │  │   - Campaign Management    │  │                 │ │
│  │              │  │   - Analytics              │  │  @lids/compass- │ │
│  │              │  │                            │  │  studio agents  │ │
│  └──────────────┘  └────────────────────────────┘  └──────────────────┘ │
│                                                                          │
│  Uses: @lids/compass-core (ChatWindow, CompassProvider)                 │
│        @lids/compass-studio (studioConfig, marketing agents)            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Package Dependencies

| Package | Purpose |
|---------|---------|
| `@lids/compass-core` | Shared COMPASS components (ChatWindow, hooks, providers) |
| `@lids/compass-studio` | Studio-specific agents and commands (Sarai, Muse) |

```typescript
// Usage example
import { CompassProvider, ChatWindow } from '@lids/compass-core';
import { studioConfig } from '@lids/compass-studio';

function App() {
  return (
    <CompassProvider config={studioConfig}>
      <ChatWindow title="Studio Assistant" />
    </CompassProvider>
  );
}
```

---

## Planned Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Content Calendar** | Visual calendar for scheduling posts | Planned |
| **Campaign Management** | Create and track marketing campaigns | Planned |
| **Social Accounts** | Dashboard of connected accounts | Planned |
| **COMPASS Sidebar** | AI chat for content generation | Scaffolded |
| **Analytics** | Performance metrics from platforms | Planned |

---

## Development

```bash
# Install dependencies (from repo root)
pnpm install

# Start development server
cd apps/studio-dashboard
pnpm dev
# → http://localhost:3103

# Build for production
pnpm build
# → dist/index.cjs + dist/public/
```

---

## File Structure

```
apps/studio-dashboard/
├── client/
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── index.css
│       └── pages/
│           └── dashboard.tsx    # Main dashboard with COMPASS sidebar
├── server/
│   └── index.ts                 # Express server
├── shared/                      # Shared types (if any)
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Relationship to Other Apps

### vs apps/studio (v1)

| Aspect | v1 (apps/studio) | v2 (apps/studio-dashboard) |
|--------|------------------|---------------------------|
| Status | LIVE | In development |
| COMPASS | Embedded (Sarai/Muse chat) | Shared package sidebar |
| Features | Quick post, content ideas | Full dashboard planned |
| Auth | Twenty CRM | TBD (will use same) |

### vs apps/compass

| App | Purpose |
|-----|---------|
| `apps/compass` | Standalone COMPASS PWA for sales reps |
| `apps/studio-dashboard` | Marketing dashboard with COMPASS sidebar |
| `packages/compass-core` | Shared components both can use |

---

## Migration Path

When v2 is ready:
1. Deploy to `studio.ripemerchant.host` (replacing v1)
2. Archive `apps/studio` → `apps/studio-legacy`
3. Rename `apps/studio-dashboard` → `apps/studio`

---

## Related Documentation

- [apps/studio/README.md](../studio/README.md) - Current production Studio v1
- [packages/compass-core](../../packages/compass-core/) - Shared COMPASS components
- [packages/compass-studio](../../packages/compass-studio/) - Studio-specific agents

---

*Last Updated: December 28, 2025*
*Status: IN DEVELOPMENT*
