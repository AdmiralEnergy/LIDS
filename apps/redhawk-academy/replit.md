# RedHawk Sales Academy

## Overview

RedHawk Sales Academy is a gamified training platform for solar sales representatives. The application transforms traditional sales training into an engaging, competitive experience through progression mechanics, quizzes, AI-powered role-play battles, and certification exams. Sales reps earn XP, unlock ranks, complete training modules, and compete on leaderboards.

**Core Features:**
- 7 Framework Mastery modules (quizzes)
- Boss Battles (AI-powered sales role-play scenarios)
- Compliance certification exams (TCPA, DNC)
- XP/rank progression system with military-style rankings
- Badge and achievement tracking
- Profile and leaderboard views

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite with custom build script for production
- **Routing:** Wouter (lightweight React router)
- **State Management:** TanStack React Query for server state, React Context for auth state
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** Tailwind CSS with custom theme variables for light/dark mode support
- **Forms:** React Hook Form with Zod validation

### Backend Architecture
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESM modules)
- **API Pattern:** RESTful endpoints under `/api/redhawk/*`
- **Build:** esbuild for server bundling with selective dependency bundling for cold start optimization

### Data Storage
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema Location:** `shared/schema.ts` (shared between client and server)
- **Migrations:** Drizzle Kit with `db:push` command
- **Session State:** In-memory storage for development (MemStorage class), with connect-pg-simple available for production sessions

### Authentication
- **Current Implementation:** Simple localStorage-based session with rep ID, name, and email
- **Auth Context:** React Context provider wrapping the application
- **Session Persistence:** LocalStorage for client-side session data

### Project Structure
```
├── client/src/           # React frontend
│   ├── components/       # Reusable UI components
│   ├── pages/            # Route-based page components
│   ├── api/              # API client functions
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   └── config/           # Configuration (ranks, etc.)
├── server/               # Express backend
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Data storage interface
│   └── static.ts         # Static file serving
├── shared/               # Shared code between client/server
│   └── schema.ts         # Drizzle database schema
└── migrations/           # Database migrations
```

### Design System
- **Theme:** Custom CSS variables for consistent theming
- **Typography:** DM Sans (primary), Space Grotesk (accent for numbers/stats)
- **Color Palette:** Red primary color (brand: RedHawk), neutral grays, semantic colors for success/error states
- **Component Style:** Card-based layouts with elevation effects, gamification-focused UI patterns

## External Dependencies

### Database
- **PostgreSQL:** Primary database via `DATABASE_URL` environment variable
- **Drizzle ORM:** Type-safe database queries and schema management

### UI Libraries
- **Radix UI:** Accessible component primitives (dialogs, dropdowns, tooltips, etc.)
- **shadcn/ui:** Pre-built component implementations using Radix
- **Lucide React:** Icon library

### Build & Development
- **Vite:** Frontend development server and bundler
- **esbuild:** Server-side TypeScript bundling
- **Tailwind CSS:** Utility-first CSS framework

### Data Fetching
- **TanStack Query:** Server state management and caching

### Utilities
- **date-fns:** Date formatting and manipulation
- **Zod:** Schema validation
- **class-variance-authority:** Component variant management