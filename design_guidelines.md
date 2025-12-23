# CRM Dashboard Design Guidelines

## Design Approach
**System-Based: Ant Design 5** - This is a data-heavy dashboard application where consistency, learnability, and efficiency are paramount. Ant Design's robust component library provides the foundation, customized with the specified dark theme.

## Core Design Principles
1. **Information Density First** - Maximize data visibility while maintaining scanability
2. **Action Accessibility** - Keep primary actions (Call, Edit, View) immediately accessible
3. **Status Clarity** - Use visual indicators (badges, colors) to communicate lead status at a glance
4. **Efficient Navigation** - Sidebar should remain visible and clearly indicate current location

---

## Typography
- **Primary Font**: Inter or System UI (-apple-system, BlinkMacSystemFont)
- **Headings**: 24px/semibold for page titles, 18px/medium for section headers
- **Body Text**: 14px/regular for table content, 16px for primary content
- **Small Text**: 12px for metadata, timestamps, secondary info

## Layout System
**Spacing Units**: Use Tailwind's 4, 8, 16, 24, 32 (p-1, p-2, p-4, p-6, p-8)
- Sidebar width: 256px fixed
- Content area: Full remaining width with 32px padding
- Card spacing: 24px gap between dashboard cards
- Table row height: 56px for comfortable scanning

---

## Color Application (Dark Theme)
**User-specified colors**:
- Background: #0c2f4a (navy)
- Accent: #c9a648 (gold)
- Apply gold to: Active nav items, primary buttons, success indicators, high ICP scores
- Secondary text: rgba(255,255,255,0.65)
- Borders: rgba(255,255,255,0.12)

---

## Component Specifications

### Sidebar Navigation
- Fixed left position, full height
- Navy background (#0c2f4a) slightly lighter than main content
- Gold highlight bar (4px left border) + gold icon/text for active items
- Icon + label for each nav item (Dashboard, Leads, Pipeline, Activity)
- Company logo/name at top with 24px padding

### Dashboard Stats Cards
- 4-column grid on desktop (1 column mobile)
- White/dark surface with subtle border
- Large number (32px semibold) for primary metric
- Descriptive label below (14px)
- Optional icon in gold as visual anchor
- Include trend indicator (↑ 12% from last week) in secondary text

### Leads Table
- Sortable columns with clear header row
- Alternating row backgrounds for scanability
- ICP Score: Progress bar or colored badge (0-40: red, 41-70: yellow, 71-100: gold)
- Status: Colored badges (new: blue, contacted: purple, qualified: gold, converted: green)
- Action buttons: Icon buttons in row (phone, edit, eye icons) with tooltips
- Pagination at bottom, showing "X of Y leads"

### Pipeline Kanban Board
- 5 columns: New → Contacted → Qualified → Proposal → Won/Lost
- Column headers with count badges
- Cards with: Lead name (bold), company, ICP score badge, last activity timestamp
- Drag handle indicator on hover
- Drop zone highlighting when dragging
- Cards have subtle shadow, white/dark surface

### Buttons & Actions
- Primary CTA: Gold background (#c9a648), white text, rounded corners
- Secondary: Outlined gold border, gold text
- Icon-only actions: Gray icons, gold on hover
- Consistent 8px padding for buttons

---

## Interactions
- **Hover states**: Subtle background change on table rows, cards
- **Loading states**: Skeleton screens for tables, spinner for actions
- **Empty states**: Centered icon + message for empty tables/pipelines
- **Drag feedback**: Card elevation increases, cursor changes to grabbing

---

## Responsive Behavior
- **Desktop (>1200px)**: Full sidebar, 4-column stats grid, full table columns
- **Tablet (768-1200px)**: Collapsed sidebar (icons only), 2-column stats, scrollable table
- **Mobile (<768px)**: Bottom nav bar, 1-column stats, card-based lead view instead of table

---

## Data Visualization
- Use gold for positive metrics, muted colors for neutral data
- Keep charts simple: bar charts for pipeline values, line charts for trends
- Tooltips on hover showing exact values