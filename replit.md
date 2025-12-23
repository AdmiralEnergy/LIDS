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

### Development Tools
- **Vite**: Development server with HMR
- **tsx**: TypeScript execution for Node.js
- **Replit plugins**: Dev banner, cartographer, runtime error overlay