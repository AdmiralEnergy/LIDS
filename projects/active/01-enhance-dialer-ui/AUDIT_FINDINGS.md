# Audit Findings: Dialer UI

## Current State Analysis
The current `dialer.tsx` is a functional but somewhat "developer-designed" interface.
-   **Layout:** Uses inline styles for the main container and right panel.
-   **Responsiveness:** Has a hard `display: none` toggle for the right panel based on width.
-   **Component Structure:** Heavily relies on `MobileDialer`, which suggests a mobile-only design pattern being forced onto desktop.

## Critical Issues
1.  **Inline CSS:** `dialer.tsx` contains significant inline styling (`style={{ ... }}`), making it hard to maintain and inconsistent with the Tailwind system.
2.  **Hidden Complexity:** `MobileDialer` likely contains too much logic.
3.  **Visual Hierarchy:** The distinction between "Active Call" and "Lead Info" needs to be sharper.

## Target State
-   **Full Tailwind:** Remove all inline styles.
-   **Adaptive Layout:** A responsive grid that naturally handles Mobile (1 col) -> Tablet (2 col) -> Desktop (3 col).
-   **Theme Adherence:** Strict usage of `--admiral-navy`, `--admiral-gold`, etc.
