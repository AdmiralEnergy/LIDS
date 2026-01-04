# Project 28: Standalone Dialer

**Status:** IN PROGRESS
**Started:** January 4, 2026
**Priority:** HIGH - Launch tomorrow

## Summary

Transform ADS Dashboard dialer from lead-centric tool to iPhone-style standalone phone.

## Key Decisions

| Decision | Choice |
|----------|--------|
| XP/Progression | LATER - Focus on core dialer first |
| UI Style | iPhone-style (Keypad + Recents + Favorites tabs) |
| Call Storage | Sync to Twenty CRM |
| Communication | SMS + Email + Combined send option |

## Current Work

Creating new phone components in `components/phone/`:
- [ ] PhoneApp.tsx - Main container
- [ ] KeypadTab.tsx - Numeric keypad
- [ ] RecentsTab.tsx - Call history
- [ ] FavoritesTab.tsx - Quick dial
- [ ] InCallOverlay.tsx - Active call UI
- [ ] MessagePanel.tsx - SMS + Email + Combined

## Context for Next Session

**What was done:**
1. Explored entire ADS Dashboard architecture with 3 agents
2. Identified all dialer dependencies (useDialer, Twilio, etc.)
3. Found no dead pages - all 4 pages active
4. Created comprehensive plan for iPhone-style phone UI
5. User confirmed: Progression deferred, focus on core dialer
6. User wants: SMS + Email + Combined send from any tab

**Key Files:**
- `hooks/useDialer.ts` - Core Twilio integration (KEEP)
- `hooks/useSms.ts` - Has sendSmsToNumber() (KEEP)
- `pages/dialer.tsx` - MAJOR REFACTOR needed
- `components/dialer/*` - Most lead-specific, not used in new design

**What the dialer actually needs:**
- Twilio SDK via useDialer hook
- `/twilio-api` proxy endpoint
- Token from backend
- That's it - NO leads required

**Plan file:** `C:\Users\Edwar\.claude\plans\idempotent-tumbling-wolf.md`

**Reference docs:**
- `C:\LifeOS\LIDS\docs\ADMIRAL_UNIFIED_SALES_FRAMEWORK.md` - For progression later
- `C:\LifeOS\LIDS\CLAUDE.md` - Main project docs

## Execution Order

1. Create `components/phone/` folder
2. Build PhoneApp container (3 tabs)
3. Build KeypadTab (number entry + call)
4. Build RecentsTab (call history)
5. Build FavoritesTab (quick dial)
6. Build InCallOverlay (active call UI)
7. Build MessagePanel (SMS + Email + Both)
8. Replace dialer.tsx with PhoneApp
9. Test and deploy
