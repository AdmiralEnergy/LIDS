# @lids/compass-core

**Shared core library for the COMPASS agent framework.**

This package provides the foundational React components, hooks, and providers used to build AI agent interfaces across the LIDS ecosystem.

## Structure

*   `components/`: Reusable UI elements (Agent avatars, chat bubbles, status indicators).
*   `hooks/`: Shared logic (useAgentStatus, useChatStream).
*   `providers/`: Context providers for agent state.
*   `types/`: Shared TypeScript interfaces for Agent objects.

## Usage

```typescript
import { AgentProvider } from '@lids/compass-core/providers';
import { AgentAvatar } from '@lids/compass-core/components';

function App() {
  return (
    <AgentProvider>
      <AgentAvatar agentId="coach-v1" />
    </AgentProvider>
  );
}
```
