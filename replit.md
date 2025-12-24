# COMPASS - AI Sales Assistant

## Overview

COMPASS (Cognitive Operations Management & Performance Assistance System for Sales) is an AI-powered sales assistant application for Admiral Energy. It provides sales representatives with AI agent partners that help with lead discovery, data analysis, outreach, documentation, and pipeline management. The application features a conversational chat interface where users interact with specialized AI agents, manage sales leads, and enrich lead data with property and utility information.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built with Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state and data fetching
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Design System**: Custom design tokens following Linear/Discord/Notion hybrid approach for professional sales productivity

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful JSON APIs under `/api/*` prefix
- **Build**: esbuild for server bundling, Vite for client bundling

### Data Storage
- **ORM**: Drizzle ORM configured for PostgreSQL
- **Schema Location**: `shared/schema.ts` contains type definitions and validation schemas
- **Current State**: In-memory storage implementation exists in `server/storage.ts` with sample NC lead data; database migration ready via `drizzle-kit push`

### Key Domain Concepts
- **Agents**: AI assistants with distinct personalities (SCOUT, ANALYST, CALLER, SCRIBE, WATCHMAN, APEX) defined in `shared/schema.ts`
- **Leads**: Sales leads with contact info, address, mortgage data, and status tracking
- **Enrichment**: Property data enrichment including year built, square footage, solar potential scores, utility rates, and savings calculations
- **Suggested Actions**: Agent responses include actionable buttons for guided workflows

### Project Structure
```
client/src/           # React frontend
  components/compass/ # COMPASS-specific components (chat, leads, enrichment)
  components/ui/      # shadcn/ui components
  hooks/              # Custom React hooks
  lib/                # Utilities and API client
  pages/              # Route pages
server/               # Express backend
  routes.ts           # API endpoint definitions
  storage.ts          # Data storage layer
  enrichment.ts       # Lead enrichment logic
  agent-responses.ts  # AI agent response simulation
shared/               # Shared types and schemas
```

## External Dependencies

### Database
- PostgreSQL via `DATABASE_URL` environment variable
- Drizzle ORM for type-safe queries
- connect-pg-simple for session storage (configured but sessions not yet implemented)

### Frontend Libraries
- Radix UI primitives for accessible components
- Embla Carousel for carousel functionality
- React Hook Form with Zod validation
- date-fns for date formatting
- Lucide React for icons

### Build & Development
- Vite with React plugin and Replit-specific plugins (dev banner, cartographer, error overlay)
- TypeScript with strict mode
- PostCSS with Tailwind CSS and Autoprefixer

### Future Integrations (Referenced in Design Docs)
- Twenty CRM (port 3001) for lead CRUD operations
- FieldOps Agents (ports 5001-5010) for direct AI chat
- Agent-Claude (port 4110) for complex task fallback
- Google Generative AI and OpenAI SDKs (installed but not yet integrated)