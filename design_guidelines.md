# COMPASS Design Guidelines

## Design Approach

**System Selected:** Hybrid approach drawing from Linear (clean productivity), Discord (chat interfaces), and Notion (information hierarchy)

**Justification:** COMPASS is a utility-focused sales productivity tool requiring efficient data display, seamless chat interactions, and professional credibility. The interface must prioritize speed, clarity, and trust.

**Core Principles:**
- Agent-centric: Avatars and agent personality are central to the experience
- Information density without clutter: Sales data must be scannable
- Conversational flow: Chat feels natural and responsive
- Professional trust: Enterprise-grade polish

---

## Typography

**Font Families:**
- Primary: Inter (via Google Fonts) - UI text, buttons, labels
- Code/Data: JetBrains Mono - property data, calculations, technical details

**Hierarchy:**
- H1: text-4xl font-bold (Agent introductions, main headings)
- H2: text-2xl font-semibold (Section headers, lead names)
- H3: text-xl font-medium (Subsections, enrichment categories)
- Body: text-base font-normal (Chat messages, descriptions)
- Small: text-sm (Metadata, timestamps, helper text)
- Tiny: text-xs (Labels, badge text)

**Weight Variations:**
- font-normal: Body text
- font-medium: Interactive elements, buttons
- font-semibold: Subheadings, emphasis
- font-bold: Primary headings, critical information

---

## Layout System

**Spacing Primitives:** Use Tailwind units of **2, 3, 4, 6, 8, 12, 16**

**Application:**
- Micro spacing (gaps, padding in dense areas): p-2, gap-2, space-y-2
- Standard component padding: p-4, px-6 py-3 (buttons)
- Section spacing: py-8, my-8
- Major layout gaps: gap-6, space-y-6
- Screen margins: px-8, py-12

**Grid System:**
- Main layout: Two-column split (sidebar + main content)
- Sidebar: w-80 fixed width for agent/lead navigation
- Main area: flex-1 for chat/enrichment display
- Cards: grid-cols-2 for enrichment data pairs
- Action buttons: flex gap-2 for suggested actions

---

## Component Library

### Agent Chat Interface

**Layout:**
- Full-height container: h-screen flex flex-col
- Messages area: flex-1 overflow-y-auto with p-4
- Input area: Fixed bottom with border-t, p-4
- Message bubbles: max-w-[80%] with rounded-lg
- Avatar integration: Avatars always accompany agent messages (w-8 h-8 for inline, w-12 h-12 for standalone)

**Message Styling:**
- User messages: Right-aligned, compact
- Agent messages: Left-aligned with avatar, more spacious (space-y-3)
- System messages: Centered, subtle styling

### Agent Avatars

**Sizes:**
- Small (inline chat): w-8 h-8
- Medium (headers): w-12 h-12
- Large (intro/profile): w-16 h-16
- Hero (3D intro): w-32 h-32 or larger

**Treatment:**
- rounded-full with subtle ring-2 border
- Accompany every agent message
- Include agent name label below for larger variants

### Suggested Actions

**Layout:**
- Horizontal flex-wrap below agent messages
- gap-2 spacing between buttons
- Maximum 3-4 buttons per row before wrapping

**Button Styling:**
- Standard action: px-4 py-2 rounded-md text-sm
- Destructive action: Slightly darker treatment with warning indicator
- Numbered: Include "1." prefix for keyboard shortcuts
- Hover state: Transform scale(1.02) with transition

### Enrichment Display

**Layout:**
- Two-column grid: grid-cols-2 gap-6 for property data
- Single column on mobile: grid-cols-1
- Section grouping: space-y-8 between major data categories

**Data Pairs:**
- Label: text-sm font-medium uppercase tracking-wide
- Value: text-2xl font-semibold mt-1
- Unit/context: text-sm inline after value

**Summary Cards:**
- Rounded container: rounded-lg with p-6
- Icon/visual: Left side (w-12 h-12)
- Content: Right side with flex-1
- Border accent: border-l-4 for category differentiation

### Form Inputs

**Text Inputs:**
- Height: px-4 py-3
- Border: rounded-lg with focus:ring-2
- Full width: w-full
- Placeholder: Contextual, action-oriented

**Buttons:**
- Primary: px-6 py-3 rounded-lg text-base font-medium
- Secondary: px-4 py-2 rounded-md text-sm
- Icon buttons: p-2 rounded-md (square)

### Navigation

**Sidebar:**
- Fixed width: w-80
- Sticky positioning for agent list
- Active state: Visual indicator with border-l-4
- Hover states: Subtle background transition

**Agent List Items:**
- p-4 with flex layout
- Avatar left (w-10 h-10)
- Name/status right
- gap-3 between elements

---

## Animations

**Minimal, Purposeful Only:**

**3D Agent Intro (Spline):**
- 3-5 second entrance on first load
- Fade out transition to chat interface
- Embed with max-h-96 container

**Chat Interactions:**
- Message appearance: Fade-in with slide-up (150ms)
- Typing indicator: Subtle pulse animation
- Scroll to new message: smooth behavior

**Suggested Actions:**
- Appear with stagger delay: 50ms per button
- Click: Quick scale feedback (100ms)

**NO animations for:**
- Page transitions
- Hover states (instant only)
- Data updates
- Form interactions

---

## Images

**Agent Avatars:**
- Required for each of 6 agents: SCOUT, ANALYST, CALLER, SCRIBE, WATCHMAN, APEX
- Style: Professional headshots or abstract geometric representations
- Format: PNG with transparency
- Placement: `/public/avatars/{agent-id}.png`
- Fallback: Default avatar for missing images

**No Hero Image:** This is a productivity application, not a marketing site. Start immediately with functional interface (agent list/chat).

**Optional Contextual Images:**
- Property thumbnails in enrichment results (if available from data)
- Company logo in header (small, w-24)
- Empty state illustrations (minimal line art)