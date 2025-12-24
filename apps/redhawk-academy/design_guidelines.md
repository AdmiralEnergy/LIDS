# RedHawk Sales Academy - Design Guidelines

## Design Approach: Gamified Learning Platform
**Reference Inspiration:** Duolingo (progression mechanics) + Linear (clean dashboards) + Gaming UIs (achievement systems)

**Core Principle:** Transform dry sales training into an engaging, competitive experience through bold visual hierarchy and clear progression feedback.

---

## Typography System

**Font Stack:** 
- Primary: Inter or DM Sans (Google Fonts) - clean, professional, excellent at small sizes
- Accent: Space Grotesk or Outfit - for hero numbers (XP counts, scores)

**Hierarchy:**
- Page Headers: 2xl-3xl, bold (700)
- Section Titles: xl-2xl, semibold (600)
- Stat Numbers: 3xl-5xl, bold (700) - make XP/scores pop
- Body/Cards: base-lg, medium (500)
- Labels/Meta: sm-base, regular (400)

---

## Layout & Spacing

**Container System:**
- Dashboard: max-w-7xl, centered
- Full-bleed modules: w-full with inner max-w-6xl padding
- Cards: Consistent card-based layouts with distinct depth

**Spacing Primitives:** Tailwind units of 3, 4, 6, 8, 12, 16
- Card padding: p-6 (standard), p-8 (prominent cards)
- Section gaps: gap-6 (grids), gap-8 (major sections)
- Page margins: px-4 md:px-6 lg:px-8

---

## Component Library

### Dashboard Components

**XP Progress Header:**
- Horizontal progress bar spanning full width
- Current XP / Next Rank XP clearly labeled
- Rank badge (shield/chevron shape) prominently displayed
- Level number in bold, large type

**Module Cards (7-card grid):**
- Grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Card structure: Icon/emoji at top, title, progress indicator
- Lock states: Locked (opacity-50, lock icon), Unlocked (full opacity), Completed (checkmark badge)
- Hover: Subtle lift effect (translate-y-1)

**Battle Stats Panel:**
- Compact stat blocks: Wins, Losses, Avg Score, Streak
- Icon-number pairs in grid-cols-2 md:grid-cols-4
- Large numbers (2xl) with small labels (xs)

### Quiz Interface

**Question Display:**
- Timer: Fixed top-right, countdown with warning states (<1min)
- Question counter: "Question 5/15" top-left
- Large, readable question text (lg-xl)
- Answer options: Radio cards with full click targets, generous padding (p-4)

**Results Screen:**
- Hero score display: Massive percentage (5xl-6xl)
- Pass/fail badge/icon immediately visible
- XP awarded animation (number count-up suggested)
- Expandable answer explanations accordion

### Boss Battle Interface

**Chat Layout:**
- Split view: Left = conversation thread, Right = live scoring panel
- Conversation: Message bubbles (prospect vs rep clearly distinguished)
- Input: Fixed bottom bar with submit button
- Turn counter & persona info at top

**Scoring Dashboard:**
- Real-time score bars (opener, rapport, discovery, etc.)
- Radar chart or bar visualization for 6 metrics
- Overall score prominently displayed

### Profile/Badges

**Badge Gallery:**
- Masonry or grid showcase of earned badges
- Unearned badges shown as outlines/grayed
- Each badge: Icon, title, earn date
- Filter tabs: All, Modules, Battles, Milestones

**Rank Progression Tree:**
- Vertical timeline showing rank ladder (E-1 → E-7)
- Current rank highlighted
- Next rank requirements clearly listed (XP + modules)

---

## Visual Patterns

**Status Indicators:**
- Locked: Lock icon, reduced opacity
- In Progress: Progress ring/bar, active state
- Completed: Checkmark badge, success treatment
- Failed: X icon or warning indicator

**Progress Visualization:**
- Use progress bars liberally (module completion, quiz progress, XP to next level)
- Circular progress rings for completion percentages
- Milestone markers on XP timeline

**Card Depth:**
- Subtle shadows to create hierarchy
- Hover states lift cards slightly
- Active/selected states with border or glow

---

## Interaction Patterns

**Animations (Minimal):**
- XP number count-up on quiz completion
- Badge "unlock" micro-animation when earned
- Progress bar fills (smooth transitions)
- NO scroll-triggered or continuous animations

**Navigation:**
- Sidebar navigation (Dashboard, Modules, Battles, Certification, Profile)
- Active page clearly highlighted
- Logout in header or sidebar bottom

**Feedback:**
- Ant Design notifications for actions (quiz submitted, battle started)
- Loading states with spinners for API calls
- Disabled button states for locked content

---

## Images

**Dashboard Hero (Optional):**
No large hero image needed - dashboard is data-first. Small motivational illustration/icon acceptable in empty states only.

**Module Cards:**
Each module card can include small representative icons or illustrations (solar panel, phone, checklist, etc.). Keep decorative, not photographic.

**Battle Personas:**
Avatar placeholders for AI prospects - simple illustrated circles or initials on colored backgrounds (no photos needed).

**Badges:**
Icon-based illustrations - shield shapes, stars, ribbons. Vector/SVG style, not photorealistic.

**No Images Needed For:** Quiz interfaces, progress screens, stats panels

---

## Accessibility

- All interactive elements have clear focus states (Ant Design provides these)
- Progress indicators include text labels, not just visual bars
- Quiz timer warnings announced via aria-live regions
- Button text clear and action-oriented ("Start Battle", "Submit Exam")

---

## Page-Specific Notes

**Login:** Clean centered card, logo at top, simple email/ID input
**Dashboard:** Hero XP bar + 3-column module grid + stats panel below
**Modules:** List or grid of 7 modules with clear lock/unlock/complete states
**Quiz:** Clean, distraction-free question layout with fixed timer
**Battle:** Immersive chat interface with real-time scoring sidebar
**Profile:** Badge gallery + rank ladder + stats history