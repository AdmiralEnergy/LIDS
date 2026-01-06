# Project 32: DeepSeek R1 Agent Integration

## Status: IN PROGRESS
**Started:** 2026-01-05
**Phase:** 1 of 4

---

## Overview

Enable DeepSeek R1 (14B model on Oracle ARM) to be a full agent within the Command Dashboard, with:
- System awareness of all connected services
- File read/write capabilities (with approval)
- Shell command execution (with approval)

## Phases

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | System Context | NOT STARTED | Inject service knowledge into prompts |
| 2 | Read Tools | NOT STARTED | File reading, API queries |
| 3 | Write Tools | NOT STARTED | Code edits with approval workflow |
| 4 | Shell Commands | NOT STARTED | Command execution with approval |

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
- Implementation starting with Phase 1

---

## Success Criteria

- [ ] Phase 1: DeepSeek knows about connected services without being told
- [ ] Phase 2: DeepSeek can read files and query APIs
- [ ] Phase 3: DeepSeek can propose code edits with diff view
- [ ] Phase 4: DeepSeek can run shell commands with approval

---

*See CODEX_IMPLEMENTATION_PLAN.md for detailed implementation instructions*
