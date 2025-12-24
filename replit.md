# CRM Dashboard

## Overview

A CRM (Customer Relationship Management) dashboard application built for managing sales leads and pipeline tracking. The application features a dark-themed interface with navy background and gold accents, designed for data-heavy operations including lead management, pipeline visualization with drag-and-drop, activity tracking, and dashboard analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Components**: Dual approach using both Ant Design 5 and shadcn/ui (Radix primitives)
  - Ant Design provides the primary dashboard components (tables, forms, layouts)
  - shadcn/ui components available for additional UI flexibility
- **State Management**: Refine framework for data management with TanStack Query
- **Styling**: Tailwind CSS with custom dark theme (navy #0c2f4a background, gold #c9a648 accents)
- **Drag and Drop**: @dnd-kit for pipeline kanban board

### Backend Architecture
- **Runtime**: Node.js with Express
- **API Design**: RESTful endpoints under `/api` prefix
- **Build Tool**: Vite for development with esbuild for production builds
- **TypeScript**: Full-stack TypeScript with shared types

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` contains all database tables
- **Current Storage**: In-memory storage with sample data (database-ready schema exists)
- **Validation**: Zod schemas generated from Drizzle tables via drizzle-zod

### Key Data Models
- **Users**: Authentication-ready user table
- **Leads**: Core entity with name, email, phone, company, stage, status, ICP score, source
- **Activities**: Lead-related activities (calls, emails, meetings, notes)

### Offline-First Storage
- **Database**: Dexie.js (IndexedDB wrapper) for client-side storage
- **Tables**: activities, cachedLeads, syncQueue
- **Auto-Sync**: Background sync every 30 seconds to Twenty CRM when online
- **Location**: `client/src/lib/db.ts`

### Power Dialer Features
- **Disposition Modal**: 7 call outcomes (Contact, Callback, Voicemail, No Answer, Not Interested, Wrong Number, DNC)
- **Auto-Advance**: Automatically moves to next lead after call disposition
- **Voicemail Drop**: Pre-recorded voicemail button during active calls
- **Activity Timeline**: Complete activity history per lead from IndexedDB
- **Call Duration**: Tracked from useDialer hook and saved in activity metadata

### Project Structure
```
client/           # Frontend React application
  src/
    components/ui/  # shadcn/ui components
    pages/          # Route pages (dashboard, leads, pipeline, activity)
    providers/      # Data providers and mock data
    hooks/          # Custom React hooks
    lib/            # Utilities and query client
server/           # Express backend
  routes.ts       # API route definitions
  storage.ts      # Data storage interface and implementation
  static.ts       # Static file serving for production
shared/           # Shared TypeScript types and schemas
  schema.ts       # Drizzle database schema
migrations/       # Database migrations (drizzle-kit)
```

## External Dependencies

### Database
- **PostgreSQL**: Configured via `DATABASE_URL` environment variable
- **Drizzle Kit**: For schema migrations (`npm run db:push`)

### Key NPM Packages
- **@refinedev/core & @refinedev/antd**: Data management and Ant Design integration
- **@tanstack/react-query**: Server state management
- **antd**: Primary UI component library
- **@dnd-kit**: Drag and drop functionality
- **drizzle-orm & drizzle-zod**: Database ORM and schema validation
- **express**: HTTP server framework
- **dexie**: IndexedDB wrapper for offline-first storage

### Development Tools
- **Vite**: Development server with HMR
- **tsx**: TypeScript execution for Node.js
- **Replit plugins**: Dev banner, cartographer, runtime error overlay

## Data Provider

The application connects to Twenty CRM via GraphQL (`client/src/providers/twentyDataProvider.ts`):
- Implements Refine's DataProvider interface (getList, getOne, create, update, deleteOne)
- No sample/mock data - requires Twenty CRM connection for lead management
- Configure via Settings page with Twenty API URL and API key
- Shows "Not Connected" status when Twenty CRM is not configured

### Progression/Gamification System
- **Database**: Dexie.js (IndexedDB) for offline-first storage at `client/src/lib/progressionDb.ts`
- **Config Files**: Located in `client/src/features/progression/config/`
  - `xp.ts`: XP thresholds (15 levels) and XP sources with base amounts
  - `badges.ts`: 8 badge types with 4 tiers each (Bronze/Silver/Gold/Platinum)
  - `ranks.ts`: 5 ranks (SDR I, SDR II, SDR III, Lead Operative, Senior Operative)
  - `specializations.ts`: 4 specializations with XP multipliers

**XP Earning Events:**
- dial: 5 XP | connect: 15 XP | voicemail: 8 XP | callback_scheduled: 25 XP
- appointment: 100 XP | deal_closed: 500 XP
- email_sent: 10 XP | sms_sent: 8 XP | note_added: 3 XP
- first_dial_of_day: 25 XP | streak_bonus: 10 XP

**Components:**
- `PlayerCard`: Displays rank, level, XP progress, badges, and specialization
- `XPFloater`: Animated +XP notification in bottom-right corner
- `LevelProgress`: Progress bar showing XP to next level
- `BadgeDisplay`: Grid of earned badges with tier indicators

**Integration Points:**
- Dialer: Awards XP on disposition submission (maps to appropriate event type)
- SMS: Awards 8 XP per message sent
- Email: Awards 10 XP per email sent
- Dashboard: Shows PlayerCard with current progression status

### Future Improvements
- Refactor Dashboard stats to use Refine's useCustom hook for API calls
- Refactor Pipeline kanban to use Refine's useUpdate hook for stage changes
- Connect to PostgreSQL database for persistent storage
- Add badge unlock modal animation when new badges are earned
- Add specialization selection UI in settings