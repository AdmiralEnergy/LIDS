# Codex Implementation Plan - Project 8

**LIDS Reorganization: Multi-Dashboard Architecture**
*For use with OpenAI Codex, Claude, or similar AI coding assistants*

---

## Status: COMPLETE (Executed December 28, 2025)

---

## System Prompt

```
You are reorganizing the LIDS monorepo to support multiple dashboards with a shared COMPASS core.

Context:
- Monorepo: LIDS (React + TypeScript + Vite apps)
- Problem: Marketing users (Leigh) see sales tools; COMPASS not reusable
- Solution: Extract COMPASS into packages; create Studio Dashboard

Current structure:
- apps/ads-dashboard/ - Sales dashboard (keep working)
- apps/compass/ - Standalone PWA (extract to packages)
- apps/redhawk-academy/ - Training (unchanged)
- packages/shared/ - Empty (will hold compass packages)

Target structure:
- packages/compass-core/ - Shared chat UI, hooks, providers
- packages/compass-sales/ - Sales commands and agents
- packages/compass-studio/ - Marketing commands and agents
- apps/studio-dashboard/ - New marketing dashboard

Brand tokens:
- Navy: #0c2f4a
- Gold: #c9a648
- White: #f7f5f2

Key constraint: ADS Dashboard must keep working throughout.
```

---

## Phase 1: Extract compass-core Package (HIGH)

### Task 1.1: Configure Monorepo Workspaces

**File:** `package.json` (root)

Add workspaces configuration:

```json
{
  "name": "lids",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev:ads": "npm run dev --workspace=apps/ads-dashboard",
    "dev:studio": "npm run dev --workspace=apps/studio-dashboard",
    "dev:compass": "npm run dev --workspace=apps/compass",
    "build:all": "npm run build --workspaces --if-present"
  }
}
```

### Task 1.2: Create compass-core Package Structure

**Directory:** `packages/compass-core/`

```bash
mkdir -p packages/compass-core/src/{components,hooks,providers,types}
```

### Task 1.3: Create compass-core package.json

**File:** `packages/compass-core/package.json`

```json
{
  "name": "@lids/compass-core",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./components": "./src/components/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./providers": "./src/providers/index.ts"
  },
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "dependencies": {
    "lucide-react": "^0.400.0"
  }
}
```

### Task 1.4: Create compass-core tsconfig.json

**File:** `packages/compass-core/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

### Task 1.5: Create Types

**File:** `packages/compass-core/src/types/index.ts`

```typescript
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  agent?: string;
}

export interface Agent {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  endpoint: string;
}

export interface Command {
  name: string;
  description: string;
  usage: string;
  handler: (args: string) => Promise<string>;
}

export interface CompassConfig {
  agents: Agent[];
  commands: Command[];
  defaultAgent?: string;
  placeholder?: string;
}
```

### Task 1.6: Create useMessages Hook

**File:** `packages/compass-core/src/hooks/useMessages.ts`

```typescript
import { useState, useCallback } from 'react';
import type { Message } from '../types';

export function useMessages(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, addMessage, clearMessages };
}
```

### Task 1.7: Create useAgent Hook

**File:** `packages/compass-core/src/hooks/useAgent.ts`

```typescript
import { useState, useCallback } from 'react';
import type { Agent, Message } from '../types';

interface UseAgentOptions {
  agent: Agent;
  onMessage?: (message: Message) => void;
}

export function useAgent({ agent, onMessage }: UseAgentOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = useCallback(async (content: string): Promise<string> => {
    setIsLoading(true);
    try {
      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content }),
      });

      if (!response.ok) {
        throw new Error(`Agent error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.message || 'No response';
    } catch (error) {
      console.error('[COMPASS] Agent error:', error);
      return 'I apologize, but I encountered an error. Please try again.';
    } finally {
      setIsLoading(false);
    }
  }, [agent.endpoint]);

  return { sendMessage, isConnected, isLoading };
}
```

### Task 1.8: Create useCommands Hook

**File:** `packages/compass-core/src/hooks/useCommands.ts`

```typescript
import { useCallback } from 'react';
import type { Command } from '../types';

export function useCommands(commands: Command[]) {
  const parseCommand = useCallback((input: string): { command: Command; args: string } | null => {
    if (!input.startsWith('/')) return null;

    const [commandName, ...argParts] = input.slice(1).split(' ');
    const command = commands.find(c => c.name.toLowerCase() === commandName.toLowerCase());

    if (!command) return null;

    return { command, args: argParts.join(' ') };
  }, [commands]);

  const executeCommand = useCallback(async (input: string): Promise<string | null> => {
    const parsed = parseCommand(input);
    if (!parsed) return null;

    try {
      return await parsed.command.handler(parsed.args);
    } catch (error) {
      console.error('[COMPASS] Command error:', error);
      return `Error executing /${parsed.command.name}`;
    }
  }, [parseCommand]);

  const isCommand = useCallback((input: string): boolean => {
    return input.startsWith('/');
  }, []);

  return { parseCommand, executeCommand, isCommand, commands };
}
```

### Task 1.9: Create Hooks Index

**File:** `packages/compass-core/src/hooks/index.ts`

```typescript
export { useMessages } from './useMessages';
export { useAgent } from './useAgent';
export { useCommands } from './useCommands';
```

### Task 1.10: Create CompassProvider

**File:** `packages/compass-core/src/providers/CompassProvider.tsx`

```typescript
import React, { createContext, useContext, useMemo } from 'react';
import type { CompassConfig, Agent, Command } from '../types';
import { useMessages } from '../hooks/useMessages';
import { useCommands } from '../hooks/useCommands';

interface CompassContextValue {
  config: CompassConfig;
  messages: ReturnType<typeof useMessages>['messages'];
  addMessage: ReturnType<typeof useMessages>['addMessage'];
  clearMessages: ReturnType<typeof useMessages>['clearMessages'];
  commands: Command[];
  executeCommand: ReturnType<typeof useCommands>['executeCommand'];
  isCommand: ReturnType<typeof useCommands>['isCommand'];
  currentAgent: Agent | undefined;
}

const CompassContext = createContext<CompassContextValue | null>(null);

interface CompassProviderProps {
  config: CompassConfig;
  children: React.ReactNode;
}

export function CompassProvider({ config, children }: CompassProviderProps) {
  const { messages, addMessage, clearMessages } = useMessages();
  const { executeCommand, isCommand, commands } = useCommands(config.commands);

  const currentAgent = useMemo(() => {
    return config.agents.find(a => a.id === config.defaultAgent) || config.agents[0];
  }, [config.agents, config.defaultAgent]);

  const value = useMemo(() => ({
    config,
    messages,
    addMessage,
    clearMessages,
    commands,
    executeCommand,
    isCommand,
    currentAgent,
  }), [config, messages, addMessage, clearMessages, commands, executeCommand, isCommand, currentAgent]);

  return (
    <CompassContext.Provider value={value}>
      {children}
    </CompassContext.Provider>
  );
}

export function useCompass() {
  const context = useContext(CompassContext);
  if (!context) {
    throw new Error('useCompass must be used within a CompassProvider');
  }
  return context;
}
```

### Task 1.11: Create Providers Index

**File:** `packages/compass-core/src/providers/index.ts`

```typescript
export { CompassProvider, useCompass } from './CompassProvider';
```

### Task 1.12: Create ChatWindow Component

**File:** `packages/compass-core/src/components/ChatWindow.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useCompass } from '../providers/CompassProvider';
import { useAgent } from '../hooks/useAgent';
import { MessageList } from './MessageList';

interface ChatWindowProps {
  title?: string;
  className?: string;
}

export function ChatWindow({ title = 'COMPASS', className = '' }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, addMessage, currentAgent, executeCommand, isCommand } = useCompass();
  const { sendMessage, isLoading } = useAgent({
    agent: currentAgent!,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userInput = input.trim();
    setInput('');

    // Add user message
    addMessage({ role: 'user', content: userInput });

    // Check if it's a command
    if (isCommand(userInput)) {
      const result = await executeCommand(userInput);
      if (result) {
        addMessage({ role: 'assistant', content: result, agent: 'system' });
      }
      return;
    }

    // Send to agent
    const response = await sendMessage(userInput);
    addMessage({
      role: 'assistant',
      content: response,
      agent: currentAgent?.name
    });
  };

  return (
    <div className={`flex flex-col h-full bg-[#f7f5f2] ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#0c2f4a] text-white">
        <div className="w-8 h-8 rounded-full bg-[#c9a648] flex items-center justify-center text-sm font-bold">
          {currentAgent?.name?.[0] || 'C'}
        </div>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-xs text-white/70">{currentAgent?.name || 'Assistant'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message or /command..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0c2f4a]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-[#0c2f4a] text-white rounded-lg hover:bg-[#0c2f4a]/90 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
```

### Task 1.13: Create MessageList Component

**File:** `packages/compass-core/src/components/MessageList.tsx`

```typescript
import React from 'react';
import type { Message } from '../types';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Start a conversation...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-4 py-2 rounded-lg ${
              message.role === 'user'
                ? 'bg-[#0c2f4a] text-white'
                : 'bg-white border shadow-sm'
            }`}
          >
            {message.agent && message.role === 'assistant' && (
              <p className="text-xs text-[#c9a648] font-medium mb-1">{message.agent}</p>
            )}
            <p className="whitespace-pre-wrap">{message.content}</p>
            <p className="text-xs opacity-50 mt-1">
              {message.timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Task 1.14: Create Components Index

**File:** `packages/compass-core/src/components/index.ts`

```typescript
export { ChatWindow } from './ChatWindow';
export { MessageList } from './MessageList';
```

### Task 1.15: Create Main Index

**File:** `packages/compass-core/src/index.ts`

```typescript
// Components
export { ChatWindow, MessageList } from './components';

// Hooks
export { useMessages, useAgent, useCommands } from './hooks';

// Providers
export { CompassProvider, useCompass } from './providers';

// Types
export type { Message, Agent, Command, CompassConfig } from './types';
```

### Task 1.16: Verify compass-core

```bash
cd packages/compass-core
npm install
# Should complete without errors
```

---

## Phase 2: Create Studio Dashboard Shell (HIGH)

### Task 2.1: Create Studio Dashboard Structure

```bash
mkdir -p apps/studio-dashboard/{client/src/{pages,components,lib,hooks},server,shared}
```

### Task 2.2: Copy Base Files from ADS Dashboard

Copy and modify from `apps/ads-dashboard/`:
- `package.json` (update name, ports)
- `vite.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `postcss.config.js`
- `components.json`
- `drizzle.config.ts`

### Task 2.3: Create Studio package.json

**File:** `apps/studio-dashboard/package.json`

```json
{
  "name": "studio-dashboard",
  "version": "0.1.0",
  "scripts": {
    "dev": "NODE_ENV=development tsx watch --clear-screen=false server/index.ts",
    "build": "vite build && esbuild server/index.ts --bundle --platform=node --outfile=dist/index.cjs --packages=external",
    "start": "NODE_ENV=production node dist/index.cjs"
  },
  "dependencies": {
    "@lids/compass-core": "workspace:*",
    "@lids/compass-studio": "workspace:*",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.400.0",
    "express": "^4.18.2",
    "tailwindcss": "^3.4.0"
  }
}
```

### Task 2.4: Create Studio vite.config.ts

**File:** `apps/studio-dashboard/vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'client',
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  server: {
    port: 3103,
    proxy: {
      '/api': 'http://localhost:3103',
    },
  },
});
```

### Task 2.5: Create Studio Main Page

**File:** `apps/studio-dashboard/client/src/pages/dashboard.tsx`

```typescript
import React from 'react';
import { CompassProvider, ChatWindow } from '@lids/compass-core';
import { studioConfig } from '@lids/compass-studio';

export default function StudioDashboard() {
  return (
    <CompassProvider config={studioConfig}>
      <div className="flex h-screen bg-[#f7f5f2]">
        {/* Sidebar */}
        <aside className="w-64 bg-[#0c2f4a] text-white p-4">
          <h1 className="text-xl font-bold mb-6">Studio</h1>
          <nav className="space-y-2">
            <a href="/" className="block px-3 py-2 rounded bg-white/10">Dashboard</a>
            <a href="/content" className="block px-3 py-2 rounded hover:bg-white/10">Content</a>
            <a href="/campaigns" className="block px-3 py-2 rounded hover:bg-white/10">Campaigns</a>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold text-[#0c2f4a] mb-4">Marketing Dashboard</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Recent Content</h3>
              <p className="text-gray-500">No content yet</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold mb-2">Active Campaigns</h3>
              <p className="text-gray-500">No campaigns yet</p>
            </div>
          </div>
        </main>

        {/* COMPASS Chat Sidebar */}
        <aside className="w-96 border-l">
          <ChatWindow title="Studio Assistant" />
        </aside>
      </div>
    </CompassProvider>
  );
}
```

### Task 2.6: Create Studio Entry Point

**File:** `apps/studio-dashboard/client/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import StudioDashboard from './pages/dashboard';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StudioDashboard />
  </React.StrictMode>
);
```

### Task 2.7: Create Studio Server

**File:** `apps/studio-dashboard/server/index.ts`

```typescript
import express from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3103;

app.use(express.json());

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', app: 'studio-dashboard' });
});

// Static files (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Studio Dashboard running on http://localhost:${PORT}`);
});
```

---

## Phase 3: Create compass-studio Package (MEDIUM)

### Task 3.1: Create compass-studio Structure

```bash
mkdir -p packages/compass-studio/src/{commands,agents}
```

### Task 3.2: Create compass-studio package.json

**File:** `packages/compass-studio/package.json`

```json
{
  "name": "@lids/compass-studio",
  "version": "0.1.0",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "peerDependencies": {
    "@lids/compass-core": "workspace:*"
  }
}
```

### Task 3.3: Create Studio Agents

**File:** `packages/compass-studio/src/agents/index.ts`

```typescript
import type { Agent } from '@lids/compass-core';

export const studioAgents: Agent[] = [
  {
    id: 'sarai',
    name: 'Sarai',
    description: 'Content generation and copywriting',
    endpoint: 'http://100.66.42.81:4065/chat',
  },
  {
    id: 'muse',
    name: 'Muse',
    description: 'Creative AI for visuals and campaigns',
    endpoint: 'http://100.66.42.81:4065/chat', // TODO: Update when Muse deployed
  },
];
```

### Task 3.4: Create Studio Commands

**File:** `packages/compass-studio/src/commands/generate.ts`

```typescript
import type { Command } from '@lids/compass-core';

export const generateCommand: Command = {
  name: 'generate',
  description: 'Generate content with Sarai',
  usage: '/generate <prompt>',
  handler: async (args: string) => {
    if (!args.trim()) {
      return 'Usage: /generate <prompt>\nExample: /generate Write a social media post about solar savings';
    }
    // This will be handled by the agent
    return `Generating content for: "${args}"`;
  },
};
```

**File:** `packages/compass-studio/src/commands/campaign.ts`

```typescript
import type { Command } from '@lids/compass-core';

export const campaignCommand: Command = {
  name: 'campaign',
  description: 'Manage marketing campaigns',
  usage: '/campaign <create|list|status>',
  handler: async (args: string) => {
    const [action] = args.split(' ');
    switch (action) {
      case 'create':
        return 'Campaign creation wizard coming soon...';
      case 'list':
        return 'No active campaigns.';
      case 'status':
        return 'Campaign status: No campaigns running.';
      default:
        return 'Usage: /campaign <create|list|status>';
    }
  },
};
```

**File:** `packages/compass-studio/src/commands/index.ts`

```typescript
import type { Command } from '@lids/compass-core';
import { generateCommand } from './generate';
import { campaignCommand } from './campaign';

export const studioCommands: Command[] = [
  generateCommand,
  campaignCommand,
];
```

### Task 3.5: Create Studio Config

**File:** `packages/compass-studio/src/index.ts`

```typescript
import type { CompassConfig } from '@lids/compass-core';
import { studioAgents } from './agents';
import { studioCommands } from './commands';

export const studioConfig: CompassConfig = {
  agents: studioAgents,
  commands: studioCommands,
  defaultAgent: 'sarai',
  placeholder: 'Ask Sarai for content ideas...',
};

export { studioAgents } from './agents';
export { studioCommands } from './commands';
```

---

## Phase 4: Wire Studio Dashboard (MEDIUM)

### Task 4.1: Install Dependencies

```bash
cd apps/studio-dashboard
npm install
```

### Task 4.2: Create Index HTML

**File:** `apps/studio-dashboard/client/index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Studio | LIDS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### Task 4.3: Create Tailwind CSS

**File:** `apps/studio-dashboard/client/src/index.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Task 4.4: Test Studio Dashboard

```bash
cd apps/studio-dashboard
npm run dev
# Should open http://localhost:3103
# Verify: Sidebar, main content, COMPASS chat panel visible
```

---

## Phase 5: Create compass-sales Package (LOW)

### Task 5.1: Create compass-sales Structure

```bash
mkdir -p packages/compass-sales/src/{commands,agents}
```

### Task 5.2: Create Sales Agents

**File:** `packages/compass-sales/src/agents/index.ts`

```typescript
import type { Agent } from '@lids/compass-core';

export const salesAgents: Agent[] = [
  {
    id: 'scout',
    name: 'Scout',
    description: 'Lead research and property data',
    endpoint: 'http://100.66.42.81:5001/chat',
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Data analysis and insights',
    endpoint: 'http://100.66.42.81:5002/chat',
  },
  {
    id: 'caller',
    name: 'Caller',
    description: 'Call scripting and objection handling',
    endpoint: 'http://100.66.42.81:5003/chat',
  },
];
```

### Task 5.3: Create Sales Commands

**File:** `packages/compass-sales/src/commands/lookup.ts`

```typescript
import type { Command } from '@lids/compass-core';

export const lookupCommand: Command = {
  name: 'lookup',
  description: 'Look up property data by address',
  usage: '/lookup <address>',
  handler: async (args: string) => {
    if (!args.trim()) {
      return 'Usage: /lookup <address>\nExample: /lookup 123 Main St, Charlotte NC';
    }
    return `Looking up property: "${args}"...`;
  },
};
```

**File:** `packages/compass-sales/src/commands/objection.ts`

```typescript
import type { Command } from '@lids/compass-core';

export const objectionCommand: Command = {
  name: 'objection',
  description: 'Get response for common objections',
  usage: '/objection <type>',
  handler: async (args: string) => {
    const objections: Record<string, string> = {
      'price': 'I understand budget is important. Let me show you how solar actually saves money from day one...',
      'roof': 'Great question about the roof! Our installers do a full assessment first...',
      'timing': 'Actually, now is the best time because of current incentives...',
    };
    const type = args.toLowerCase().trim();
    return objections[type] || `Objection types: ${Object.keys(objections).join(', ')}`;
  },
};
```

### Task 5.4: Create Sales Index

**File:** `packages/compass-sales/src/index.ts`

```typescript
import type { CompassConfig } from '@lids/compass-core';
import { salesAgents } from './agents';
import { lookupCommand } from './commands/lookup';
import { objectionCommand } from './commands/objection';

export const salesCommands = [lookupCommand, objectionCommand];

export const salesConfig: CompassConfig = {
  agents: salesAgents,
  commands: salesCommands,
  defaultAgent: 'scout',
  placeholder: 'Ask about a lead or /lookup an address...',
};

export { salesAgents } from './agents';
```

---

## Phase 6: Integrate compass-core into ADS Dashboard (LOW)

This phase refactors `apps/ads-dashboard` to use the new packages. **Defer until Phases 1-4 are verified working.**

### Task 6.1: Add Dependencies

Update `apps/ads-dashboard/package.json`:

```json
{
  "dependencies": {
    "@lids/compass-core": "workspace:*",
    "@lids/compass-sales": "workspace:*"
  }
}
```

### Task 6.2: Embed COMPASS in ADS

Add ChatWindow to a new sidebar or modal in the ADS Dashboard.

---

## Verification Commands

```bash
# Verify monorepo workspaces
npm ls --workspaces

# Verify compass-core builds
cd packages/compass-core && npm run build

# Verify studio-dashboard runs
cd apps/studio-dashboard && npm run dev
# → http://localhost:3103

# Verify ADS still works
cd apps/ads-dashboard && npm run dev
# → http://localhost:3100
```

---

## Rollback

If issues occur:

```bash
# Revert package changes
git checkout HEAD~1 -- packages/
git checkout HEAD~1 -- apps/studio-dashboard/

# Keep ADS untouched until Phase 6
```

---

## Port Assignments

| App | Dev Port | Prod Port |
|-----|----------|-----------|
| ADS Dashboard | 3100 | 5000 |
| COMPASS (standalone) | 3101 | 3101 |
| RedHawk Academy | 3102 | 3102 |
| Studio Dashboard | 3103 | 5003 |

---

*Implementation plan ready for execution*
*Created: December 28, 2025*
