# Codex Implementation Plan: Dialer UI Enhancement

## Phase 1: Clean Up & Layout
**Goal:** Remove inline styles and establish a proper Tailwind grid layout.

### Task 1: Refactor `dialer.tsx` Layout
-   **File:** `apps/ads-dashboard/client/src/pages/dialer.tsx`
-   **Action:** Replace `div style={{ display: 'flex' ... }}` with Tailwind classes.
    -   Container: `flex h-screen overflow-hidden bg-background`
    -   Main Panel: `flex-1 min-w-0`
    -   Right Panel: `hidden xl:flex w-96 flex-col border-l border-border bg-card`

### Task 2: Review `MobileDialer` Wrapper
-   **File:** `apps/ads-dashboard/client/src/components/dialer/MobileDialer.tsx`
-   **Action:** Ensure it expands correctly within the new flex container.

## Phase 2: Component Polish
**Goal:** Make the Lead Card and Call Controls visually stunning.

### Task 3: Enhance `LeadCard`
-   **File:** `apps/ads-dashboard/client/src/components/dialer/LeadCard.tsx`
-   **Action:**
    -   Use `Card` primitive from shadcn/ui (if available) or standard Tailwind borders.
    -   Highlight "ICP Score" with a badge color scale (Green > 80, Yellow > 50, Red < 50).
    -   Increase font size for Name and Phone.

## Phase 3: Dopamine & Interaction
**Goal:** Make interactions feel "juicy".

### Task 4: Disposition Animation
-   **File:** `apps/ads-dashboard/client/src/components/DispositionStrip.tsx`
-   **Action:** Add Framer Motion `layout` props to animate chips when they appear.
