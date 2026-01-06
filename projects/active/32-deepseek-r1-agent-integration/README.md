# Project 32: DeepSeek R1 Agent Integration

## Status: COMPLETE
**Started:** 2026-01-05
**Completed:** 2026-01-06
**Phase:** 4 of 4 COMPLETE

---

## Overview

Enable DeepSeek R1 (14B model on Oracle ARM) to be a full agent within the Command Dashboard, with:
- System awareness of all connected services
- File read/write capabilities (with approval)
- Shell command execution (with approval)

## Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | System Context | COMPLETE | Inject service knowledge into prompts |
| 2 | Read Tools | COMPLETE | File reading, API queries |
| 3 | Write Tools | COMPLETE | Code edits with approval workflow |
| 4 | Shell Commands | COMPLETE | Command execution with approval |

## Architecture

### Tool Calling Approach
XML-based tool calls parsed from DeepSeek responses (matches existing `<think>` tag pattern):
```xml
<tool_call name="readFile"><path>/server/routes.ts</path></tool_call>
```

### Security
- **File scope**: `C:\LifeOS\LIDS` only
- **Shell access**: Full, but all commands require approval
- **Size limits**: 10KB per file read
- **Secrets**: .env files filtered out

## Files to Modify

| File | Changes |
|------|---------|
| `server/routes.ts` | Tool execution endpoints |
| `client/src/hooks/useDeepSeekChat.ts` | Tool parsing, execution loop |
| `client/src/lib/deepseekTools.ts` | NEW: Tool definitions |
| `client/src/components/chat/CodeEditProposal.tsx` | NEW: Edit approval UI |
| `client/src/components/chat/CommandProposal.tsx` | NEW: Shell approval UI |

## Progress Log

### 2026-01-05
- Project created
- Plan approved
- Phase 1 COMPLETE:
  - Added `/api/deepseek/context` endpoint (routes.ts)
  - Modified `useDeepSeekChat.ts` to inject context on first message
  - Added "Context Aware" badge to DeepSeekChat.tsx
  - Deployed to Oracle ARM - all services showing ONLINE
  - Commit: `9986f00`
- Phase 2 COMPLETE:
  - Created `deepseekTools.ts` with tool definitions and XML parsing
  - Added `/api/deepseek/execute-tool` endpoint with 5 tools
  - Tools: readFile, listFiles, searchCode, getServiceStatus, queryGridEngine
  - Security: path validation, .env filtering, 10KB file limit
  - Automatic tool execution loop in useDeepSeekChat hook
  - Commit: `7c137b5`

### 2026-01-06
- Phase 3 COMPLETE:
  - Added WRITE_TOOLS: proposeEdit, proposeNewFile
  - Added `/api/deepseek/apply-edit` endpoint for applying approved edits
  - Created `CodeEditProposal.tsx` component with diff view and approve/reject buttons
  - Write tools create proposals (pending), read tools auto-execute
  - Proposals displayed in chat with status badges (pending/approved/rejected)
  - Updated hook with `proposals`, `approveProposal`, `rejectProposal`

- Phase 4 COMPLETE:
  - Added SHELL_TOOLS: proposeCommand
  - Added `/api/deepseek/execute-command` endpoint with 30s timeout, 1MB output limit
  - Created `CommandProposal.tsx` component with dangerous command warnings
  - Dangerous patterns detected: rm -rf, format, dd, drop database, etc.
  - Commands show working directory and output/error after execution
  - Updated hook with `commandProposals`, `approveCommand`, `rejectCommand`
  - Security: working directory restricted to /home/ubuntu/lids

---

## Success Criteria

- [ ] Phase 1: DeepSeek knows about connected services without being told
- [ ] Phase 2: DeepSeek can read files and query APIs
- [ ] Phase 3: DeepSeek can propose code edits with diff view
- [ ] Phase 4: DeepSeek can run shell commands with approval

---

*See CODEX_IMPLEMENTATION_PLAN.md for detailed implementation instructions*
