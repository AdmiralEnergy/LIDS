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
- **Styling**: Tailwind CSS with "Ascension Protocol" dark theme
  - Pure black base (#000000) with 2% film grain overlay for analog texture
  - Obsidian matte surfaces (#050505) for cards and panels
  - Thin neon cyan borders (0.5px solid rgba(0, 255, 255, 0.2))
  - JetBrains Mono for monospace, Space Grotesk for display
  - Framer Motion spring animations with GPU-accelerated transforms
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
- **Appointment Scheduling**: ScheduleModal component with date/time pickers, appointment types (discovery_call, demo, follow_up, closing), and optional calendar sync

### Calendar Integration (Twenty CRM Primary)
- **Primary Scheduling**: Twenty CRM is the primary calendar source - appointments are created directly via REST API
- **ScheduleModal**: Direct scheduling with date picker (dayjs), time picker, duration selector, appointment type (Phone Call, Site Visit, Virtual Meeting), location, and notes
- **twentyCalendar.ts**: API client for Twenty CRM calendar operations (create, list, delete events, add participants)
- **Auto-sync**: Events created in Twenty CRM automatically sync to Google Calendar via Twenty's native integration
- **CalendarView**: Month grid with navigation, event badges showing appointments per day, and "Upcoming Appointments" sidebar
- **Pipeline Toggle**: Segmented control to switch between Kanban list view and calendar view
- **Calendly Integration (Optional)**: Available as alternative booking method for slot-based scheduling
- **Booking Drawer**: Two options - "Quick Schedule" (opens ScheduleModal for any date/time) or "Calendly Slots" (fetches available slots from Calendly API)

### Ascension Protocol UI Components
- **KineticADSLogo**: SVG logo with liquid displacement filter on ADS text and cycling electric arcs around border
- **ParticleBackground**: Canvas-based 40-particle system with electric sparks, jitter movement, and mouse-reactive grid parallax
- **PlasmaXPBar**: Energy tube with gradient flow, flash effects, shockwave pulse, and slot-machine digit rolling animation
- **ApexKeypad**: Mechanical keypad with 3D depth press effect, spring animations, and spark feedback
- **DialerHUD**: Compact progression display with PlasmaXPBar integration and obsidian styling
- **Breathing Glow**: Call status cards with pulsating boxShadow animations (red for connecting, green for connected)
- **Film Grain Overlay**: 2% noise overlay on pure black background for analog texture

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

### Progression/Gamification System (Admiral Framework)
- **Philosophy**: Conversion efficiency > dial volume - rewards quality outcomes over activity volume
- **Database**: Dexie.js (IndexedDB) for offline-first storage at `client/src/lib/progressionDb.ts`
- **Config Files**: Located in `client/src/features/progression/config/`
  - `xp.ts`: XP thresholds (25 levels) and efficiency-focused XP sources
  - `badges.ts`: Efficiency badges (Opener Elite, Conversion Champion, Engagement Master, Efficiency Elite, Show Rate Champion) + performance/special badges
  - `ranks.ts`: 7 ranks (SDR I, SDR II, SDR III, Sales Operative, Senior Operative, Team Lead, Manager) with module requirements
  - `specializations.ts`: 4 specializations with XP multipliers
  - `modules.ts`: Framework Mastery training modules (7 modules from Product Foundations to Full Certification)

**XP Earning Events (Efficiency-Focused):**
- dial_made: 2 XP | call_connected: 5 XP | two_plus_minute_call: 15 XP
- callback_scheduled: 25 XP | appointment_set: 100 XP | appointment_held: 50 XP
- deal_closed: 300 XP | voicemail_left: 8 XP
- email_sent: 10 XP | email_reply: 30 XP | sms_sent: 8 XP | sms_reply: 20 XP | sms_enrollment: 35 XP
- module_passed: 50 XP | elite_exam_bonus: 100 XP | certification_earned: 300 XP
- first_dial_of_day: 25 XP | streak_day: 10 XP

**Efficiency Metrics (PRIMARY KPIs):**
- Sub-30s Drop Rate: Calls <30s / Connects (target: <50%, lower is better)
- Call-to-Appt Rate: Appointments / Connects (target: 5%+, PRIMARY metric)
- 2+ Minute Rate: Calls 2+ min / Connects (target: 25%+)
- Show Rate: Shows / Appointments (target: 75%+)
- SMS Enrollment Rate: SMS Opt-ins / Contacts (target: 3%+)

**Tier System:**
- Unsatisfactory (red) | Satisfactory (blue) | Above (green) | Elite (purple)

**Framework Mastery Modules:**
1. Product Foundations (80% pass, 50 XP) - Solar terminology, roof assessment, Duke Energy
2. Opener Mastery (80% pass, 50 XP) - Psychology of attention, 3 opener types
3. Timing Optimization (80% pass, 50 XP) - Legal calling windows, Power Hour strategy
4. Cadence Excellence (80% pass, 50 XP) - Trust-Builder sequence, email/voicemail templates
5. Objection Exploration (85% pass, 75 XP) - Dialogue vs. battle, common objections
6. TCPA Compliance (100% pass, 100 XP) - Federal requirements, NC-specific rules
7. Full Framework Certification (80% pass, 300 XP) - Comprehensive assessment

**Rank Requirements:**
- SDR II (E-2): Level 3, 2 deals, opener_elite.bronze, modules 0-1
- SDR III (E-3): Level 6, 10 deals, opener_elite.silver, conversion_champion.bronze, modules 0-3
- Sales Operative (E-4): Level 10, 25 deals, modules 0-5, sub_30s_drop_rate <50%
- Senior Operative (E-5): Level 15, 100 deals, modules 0-6, call_to_appt_rate >5%, defeat RedHawk
- Team Lead (E-6): Level 18, 25 deals, modules 0-6, cadence_completion >70%, mentor 2 reps
- Manager (E-7): Level 25, 50 deals, module 6, team_conversion >5%, leadership certification

**Components:**
- `PlayerCard`: Displays rank, level, XP progress, badges, specialization, and Framework Mastery progress
- `DialerHUD`: Compact progression display with 5 efficiency metric cards (Sub-30s, Call-to-Appt, 2+ Min, Show Rate, SMS Enrollment)
- `XPFloater`: Animated +XP notification in bottom-right corner
- `LevelProgress`: Progress bar showing XP to next level
- `BadgeDisplay`: Grid of earned badges with tier indicators
- `AchievementPopup`: Animated celebration with confetti for badges, levels, ranks, and boss defeats
- `BossGate`: Modal for challenging skill-gate bosses (RedHawk unlocks at Level 12)
- `PromotionGateModal`: Shows rank promotion requirements including boss battles, exams, and module completion

**Boss Battle System:**
- RedHawk AI boss: Unlocks at Level 12, required for Senior Sales Operative (E-5) promotion
- Rewards: 1000 XP, "redhawk_slayer" badge, "RedHawk Conqueror" title
- Tracks defeated bosses, boss attempts, and victory history in IndexedDB

**Daily Metrics Tracking:**
- Stored in IndexedDB `dailyMetrics` table
- Tracks: dials, connects, callsUnder30s, callsOver2Min, appointments, shows, deals, smsEnrollments
- Used to calculate rolling 7-day efficiency metrics

**Achievement Events:**
- Custom events dispatched: `badgeUnlock`, `levelUp`, `rankUp`, `bossDefeated`
- AchievementPopup listens globally and shows confetti celebrations

**Integration Points:**
- Dialer: Awards XP on disposition submission, tracks call duration for 2+ minute metric
- SMS: Awards 8 XP per message sent, 35 XP for SMS enrollment
- Email: Awards 10 XP per email sent, 30 XP for replies
- Dashboard: Shows PlayerCard with current progression status and efficiency metrics

### Future Improvements
- Refactor Dashboard stats to use Refine's useCustom hook for API calls
- Refactor Pipeline kanban to use Refine's useUpdate hook for stage changes
- Connect to PostgreSQL database for persistent storage
- Add badge unlock modal animation when new badges are earned
- Add specialization selection UI in settings
- Add module quiz/exam UI for Framework Mastery completion
- Add mentee tracking for Team Lead rank requirement