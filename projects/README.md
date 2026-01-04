# Projects Directory

**This directory tracks the execution of specific features, refactors, and bug fixes.**

Unlike `apps/` or `packages/` (which contain code), this folder contains **Context & State** for the development process itself.

## Directory Structure

*   `active/`: Work currently in progress. **Check here first.**
*   `completed/`: Finished work (organized by date).
*   `archive/`: Old projects.

## How to use this directory

### 1. Starting a Task
Don't just start editing files. Create a "container" for your context:

```bash
mkdir -p projects/active/01-fix-login-bug
```

### 2. Required Artifacts
Inside your project folder, you must have:

*   **`README.md`**: The status board.
    *   What are we doing?
    *   Current Status (Planning, Coding, Verifying, Done)
    *   Verification steps.
*   **`AUDIT_FINDINGS.md`**: The "Understand" phase.
    *   What is the current code doing?
    *   Why is it broken?
    *   Trace the data flow.
*   **`CODEX_IMPLEMENTATION_PLAN.md`**: The "Plan" phase.
    *   Step-by-step instructions for the coding agent.
    *   Atomic tasks.

### 3. completion
When the task is done and verified:
1.  Update the project's `README.md` to "COMPLETE".
2.  Move the folder to `projects/completed/YYYY_MM_DD/`.

## Why do we do this?
*   **Context Preservation:** If an agent session crashes or restarts, the `active` folder contains the full memory of the task.
*   **Audit Trail:** We can see *why* changes were made 6 months ago.
*   **Focus:** It forces us to "Measure twice, cut once."
