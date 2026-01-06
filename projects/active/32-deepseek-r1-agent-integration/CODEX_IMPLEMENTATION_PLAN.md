# Codex Implementation Plan - Project 32: DeepSeek R1 Agent Integration

## System Prompt

```
You are implementing DeepSeek R1 agent capabilities for the Command Dashboard.

Context:
- App: apps/command-dashboard (React + TypeScript + Vite + Express)
- DeepSeek R1 14B runs on Oracle ARM via Ollama (port 11434)
- Current state: Text generation only, no tool calling
- Goal: Add system awareness, file operations, and shell commands

Key files:
- server/routes.ts - Express backend with DeepSeek proxy (lines 150-217)
- client/src/hooks/useDeepSeekChat.ts - Chat hook with thinking extraction
- client/src/components/chat/DeepSeekChat.tsx - Chat UI component

Existing patterns:
- <think> tags are already parsed from DeepSeek responses
- XML parsing uses regex: /<think>([\s\S]*?)<\/think>/
- Context tokens passed between turns for conversation memory
- 180s timeout for ARM inference
```

---

## Phase 1: System Context Injection

### Task 1.1: Create Context Endpoint

**File:** `apps/command-dashboard/server/routes.ts`

Add after line 217 (after DeepSeek health endpoint):

```typescript
// GET /api/deepseek/context - System context for DeepSeek prompts
app.get("/api/deepseek/context", async (req, res) => {
  try {
    // Fetch status of all services in parallel
    const [gridHealth, liveWireHealth, twentyHealth] = await Promise.allSettled([
      fetchWithTimeout(`http://${SERVICES.gridEngine.host}:${SERVICES.gridEngine.port}/health`, {}, 5000),
      fetchWithTimeout(`http://${SERVICES.liveWire.host}:${SERVICES.liveWire.port}/health`, {}, 5000),
      fetchWithTimeout(`http://${SERVICES.twentyCrm.host}:${SERVICES.twentyCrm.port}/health`, {}, 5000),
    ]);

    const getStatus = (result: PromiseSettledResult<Response>) =>
      result.status === 'fulfilled' && result.value.ok ? 'online' : 'offline';

    const context = {
      services: {
        gridEngine: { status: getStatus(gridHealth), host: SERVICES.gridEngine.host, port: SERVICES.gridEngine.port },
        liveWire: { status: getStatus(liveWireHealth), host: SERVICES.liveWire.host, port: SERVICES.liveWire.port },
        twentyCrm: { status: getStatus(twentyHealth), host: SERVICES.twentyCrm.host, port: SERVICES.twentyCrm.port },
        deepSeek: { status: 'online', host: SERVICES.deepSeek.host, port: SERVICES.deepSeek.port },
      },
      codebase: {
        root: 'C:\\LifeOS\\LIDS',
        commandDashboard: 'C:\\LifeOS\\LIDS\\apps\\command-dashboard',
        keyFiles: [
          { path: 'server/routes.ts', purpose: 'Express API endpoints' },
          { path: 'client/src/hooks/useDeepSeekChat.ts', purpose: 'DeepSeek chat integration' },
          { path: 'client/src/components/chat/', purpose: 'Chat UI components' },
          { path: 'client/src/components/grid/GridStatusPanel.tsx', purpose: 'Grid Engine dashboard' },
        ],
      },
      infrastructure: {
        oracleArm: { ip: '193.122.153.249', tailscale: '100.125.221.62', services: ['Grid Engine', 'DeepSeek R1', 'Command Dashboard'] },
        admiralServer: { ip: '192.168.1.23', tailscale: '100.66.42.81', services: ['LiveWire', 'Agent Claude', 'Twilio'] },
        droplet: { ip: '165.227.111.24', tailscale: '100.94.207.1', services: ['Twenty CRM', 'LIDS Apps'] },
      },
    };

    res.json(context);
  } catch (error) {
    res.status(500).json({ error: 'Failed to gather context' });
  }
});
```

### Task 1.2: Inject Context into Chat Hook

**File:** `apps/command-dashboard/client/src/hooks/useDeepSeekChat.ts`

Add state for system context (after line 34):
```typescript
const [systemContext, setSystemContext] = useState<string | null>(null);
```

Add function to fetch and format context (before sendMessage):
```typescript
const fetchSystemContext = useCallback(async () => {
  try {
    const response = await fetch('/api/deepseek/context');
    const ctx = await response.json();

    const contextPrompt = `You are DeepSeek R1, an AI assistant integrated with the Command Dashboard.

## Connected Services (Live Status)
- Grid Engine (${ctx.services.gridEngine.host}:${ctx.services.gridEngine.port}): ${ctx.services.gridEngine.status} - Power grid monitoring
- LiveWire (${ctx.services.liveWire.host}:${ctx.services.liveWire.port}): ${ctx.services.liveWire.status} - Lead intelligence
- Twenty CRM (${ctx.services.twentyCrm.host}:${ctx.services.twentyCrm.port}): ${ctx.services.twentyCrm.status} - Customer database

## Infrastructure
- Oracle ARM: Grid Engine, DeepSeek R1, Command Dashboard
- Admiral Server: LiveWire, Agent Claude, Twilio
- Droplet: Twenty CRM, LIDS Apps

## Codebase: ${ctx.codebase.root}
Key files:
${ctx.codebase.keyFiles.map((f: any) => `- ${f.path}: ${f.purpose}`).join('\n')}

## You Can Help With
- Explaining how services work
- Debugging connection issues
- Suggesting code changes (user will apply)
- Answering questions about the system architecture`;

    setSystemContext(contextPrompt);
    return contextPrompt;
  } catch {
    return null;
  }
}, []);
```

Modify sendMessage to inject context on first message (around line 67):
```typescript
const sendMessage = useCallback(async (content: string) => {
  // ... existing code ...

  // Inject system context on first message
  let finalPrompt = content;
  if (messages.length === 0 && !systemContext) {
    const ctx = await fetchSystemContext();
    if (ctx) {
      finalPrompt = `${ctx}\n\n---\n\nUser: ${content}`;
    }
  } else if (messages.length === 0 && systemContext) {
    finalPrompt = `${systemContext}\n\n---\n\nUser: ${content}`;
  }

  // Use finalPrompt instead of content in fetch body
  // ...
}, [context, messages.length, systemContext, fetchSystemContext]);
```

### Task 1.3: Add Context Indicator to UI

**File:** `apps/command-dashboard/client/src/components/chat/DeepSeekChat.tsx`

Add indicator in header (after the LIVE badge around line 48):
```tsx
{messages.length > 0 && (
  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
    <Database className="w-3 h-3" />
    Context Aware
  </span>
)}
```

Import Database icon:
```tsx
import { Wifi, WifiOff, Send, Trash2, Brain, Database } from "lucide-react";
```

### Verification

1. Start command-dashboard: `npm run dev`
2. Open DeepSeek chat panel
3. Ask: "What services are connected to this dashboard?"
4. DeepSeek should list Grid Engine, LiveWire, Twenty CRM with their status
5. "Context Aware" badge should appear after first message

---

## Phase 2: Read-Only Tools

### Task 2.1: Create Tool Definitions

**File:** `apps/command-dashboard/client/src/lib/deepseekTools.ts` (NEW)

```typescript
export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, string>;
}

export const READ_TOOLS: Tool[] = [
  {
    name: "readFile",
    description: "Read contents of a file from the LIDS codebase",
    parameters: { path: "string - relative path from C:\\LifeOS\\LIDS" }
  },
  {
    name: "listFiles",
    description: "List files in a directory",
    parameters: { path: "string - directory path", pattern: "string (optional) - glob pattern" }
  },
  {
    name: "searchCode",
    description: "Search for text in the codebase",
    parameters: { query: "string - search term", path: "string (optional) - limit to path" }
  },
  {
    name: "getServiceStatus",
    description: "Get detailed status of a connected service",
    parameters: { service: "string - gridEngine|liveWire|twentyCrm|deepSeek" }
  },
  {
    name: "queryGridEngine",
    description: "Query Grid Engine API endpoint",
    parameters: { endpoint: "string - e.g., /api/counties, /status, /api/outages/current" }
  }
];

export function formatToolsForPrompt(tools: Tool[]): string {
  return `## Available Tools

You can use tools by outputting XML in this format:
<tool_call name="toolName">
<param1>value1</param1>
<param2>value2</param2>
</tool_call>

Available tools:
${tools.map(t => `
### ${t.name}
${t.description}
Parameters: ${Object.entries(t.parameters).map(([k, v]) => `${k}: ${v}`).join(', ')}
`).join('\n')}

When using tools, output ONLY the tool_call tag. I will execute it and give you the result.`;
}

export interface ParsedToolCall {
  name: string;
  params: Record<string, string>;
}

export function parseToolCalls(text: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];
  const regex = /<tool_call name="(\w+)">([\s\S]*?)<\/tool_call>/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const paramsXml = match[2];
    const params: Record<string, string> = {};

    // Parse parameters
    const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsXml)) !== null) {
      params[paramMatch[1]] = paramMatch[2].trim();
    }

    toolCalls.push({ name, params });
  }

  return toolCalls;
}

export function removeToolCalls(text: string): string {
  return text.replace(/<tool_call[\s\S]*?<\/tool_call>/g, '').trim();
}
```

### Task 2.2: Add Tool Execution Endpoint

**File:** `apps/command-dashboard/server/routes.ts`

Add after context endpoint:

```typescript
import { readFile, readdir } from 'fs/promises';
import { join, resolve, relative } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const LIDS_ROOT = 'C:\\LifeOS\\LIDS';

// Security: validate path is within LIDS
function validatePath(inputPath: string): string | null {
  const fullPath = resolve(LIDS_ROOT, inputPath);
  if (!fullPath.startsWith(LIDS_ROOT)) return null;
  if (fullPath.includes('.env') || fullPath.includes('credentials')) return null;
  return fullPath;
}

// POST /api/deepseek/execute-tool
app.post("/api/deepseek/execute-tool", async (req, res) => {
  const { tool, params } = req.body;

  try {
    switch (tool) {
      case "readFile": {
        const safePath = validatePath(params.path);
        if (!safePath) return res.status(403).json({ error: 'Path not allowed' });

        const content = await readFile(safePath, 'utf-8');
        return res.json({ result: content.slice(0, 10000) }); // 10KB limit
      }

      case "listFiles": {
        const safePath = validatePath(params.path || '');
        if (!safePath) return res.status(403).json({ error: 'Path not allowed' });

        const files = await readdir(safePath, { withFileTypes: true });
        const result = files.map(f => ({
          name: f.name,
          type: f.isDirectory() ? 'directory' : 'file'
        }));
        return res.json({ result });
      }

      case "searchCode": {
        const searchPath = params.path ? validatePath(params.path) : LIDS_ROOT;
        if (!searchPath) return res.status(403).json({ error: 'Path not allowed' });

        // Use ripgrep if available, otherwise grep
        const { stdout } = await execAsync(
          `rg -l --max-count=20 "${params.query}" "${searchPath}" 2>/dev/null || grep -rl --max-count=20 "${params.query}" "${searchPath}" 2>/dev/null`,
          { timeout: 10000, maxBuffer: 1024 * 1024 }
        );
        return res.json({ result: stdout.trim().split('\n').filter(Boolean) });
      }

      case "getServiceStatus": {
        const service = SERVICES[params.service as keyof typeof SERVICES];
        if (!service) return res.status(400).json({ error: 'Unknown service' });

        const start = Date.now();
        try {
          const response = await fetchWithTimeout(
            `http://${service.host}:${service.port}${service.healthEndpoint}`,
            {},
            5000
          );
          return res.json({
            result: {
              status: response.ok ? 'healthy' : 'degraded',
              responseTime: Date.now() - start,
              host: service.host,
              port: service.port
            }
          });
        } catch {
          return res.json({
            result: { status: 'offline', host: service.host, port: service.port }
          });
        }
      }

      case "queryGridEngine": {
        const response = await fetchWithTimeout(
          `http://${SERVICES.gridEngine.host}:${SERVICES.gridEngine.port}${params.endpoint}`,
          {},
          10000
        );
        const data = await response.json();
        return res.json({ result: data });
      }

      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Tool execution failed'
    });
  }
});
```

### Task 2.3: Implement Tool Execution Loop in Hook

**File:** `apps/command-dashboard/client/src/hooks/useDeepSeekChat.ts`

Import tools:
```typescript
import { READ_TOOLS, formatToolsForPrompt, parseToolCalls, removeToolCalls } from '@/lib/deepseekTools';
```

Add tool execution function:
```typescript
const executeTool = useCallback(async (tool: string, params: Record<string, string>) => {
  const response = await fetch('/api/deepseek/execute-tool', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tool, params }),
  });
  return response.json();
}, []);
```

Modify sendMessage to handle tool calls (replace the fetch logic):
```typescript
const sendMessage = useCallback(async (content: string) => {
  // ... existing user message handling ...

  // Include tools in system context
  let systemPrompt = systemContext || '';
  if (systemPrompt) {
    systemPrompt += '\n\n' + formatToolsForPrompt(READ_TOOLS);
  }

  const response = await fetch("/api/deepseek/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: messages.length === 0 ? `${systemPrompt}\n\n---\n\nUser: ${content}` : content,
      host,
      port,
      context: context,
    }),
  });

  const data = await response.json();
  const parsed = parseResponse(data.response);

  // Check for tool calls
  const toolCalls = parseToolCalls(data.response);

  if (toolCalls.length > 0) {
    // Execute tools and get results
    const toolResults = await Promise.all(
      toolCalls.slice(0, 5).map(async (tc) => {
        const result = await executeTool(tc.name, tc.params);
        return { tool: tc.name, params: tc.params, result };
      })
    );

    // Send results back to DeepSeek
    const toolResultsText = toolResults.map(tr =>
      `Tool: ${tr.tool}\nParams: ${JSON.stringify(tr.params)}\nResult: ${JSON.stringify(tr.result.result || tr.result.error, null, 2)}`
    ).join('\n\n');

    const followUpResponse = await fetch("/api/deepseek/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: `Tool execution results:\n\n${toolResultsText}\n\nNow provide your response to the user based on these results.`,
        host,
        port,
        context: data.context,
      }),
    });

    const followUpData = await followUpResponse.json();
    const finalParsed = parseResponse(followUpData.response);

    // Add assistant message with final response
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: finalParsed.response,
      thinking: (parsed.thinking || '') + '\n\n[Tool calls executed]\n' + toolResultsText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setContext(followUpData.context);
  } else {
    // No tool calls - normal response
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: parsed.response,
      thinking: parsed.thinking,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setContext(data.context);
  }
}, [context, messages, systemContext, executeTool, host, port]);
```

### Verification

1. Restart command-dashboard
2. Ask DeepSeek: "Read the server/routes.ts file and tell me what endpoints exist"
3. DeepSeek should use readFile tool, get the content, and summarize endpoints
4. Check thinking block to see tool execution trace

---

## Phase 3 & 4: Write Tools and Shell Commands

These phases follow the same pattern:
1. Add tool definitions to deepseekTools.ts
2. Add execution endpoints to routes.ts
3. Create approval UI components
4. Wire up approval workflow in useDeepSeekChat.ts

See the full plan at: `C:\Users\Edwar\.claude\plans\floofy-meandering-barto.md`

---

## Rollback

If integration breaks:
1. Revert `useDeepSeekChat.ts` to remove tool handling
2. Remove tool endpoints from `routes.ts`
3. Delete `deepseekTools.ts`
4. DeepSeek reverts to plain text generation

---

## Testing Checklist

- [ ] System context endpoint returns service status
- [ ] DeepSeek knows about services on first message
- [ ] readFile tool works within LIDS directory
- [ ] readFile blocks .env and credentials files
- [ ] searchCode returns relevant files
- [ ] queryGridEngine returns live data
- [ ] Tool results appear in thinking block
- [ ] Multiple tool calls execute correctly
- [ ] 5 tool call limit enforced
