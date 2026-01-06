/**
 * DeepSeek R1 Tool Definitions and Parsing
 * Part of Project 32: DeepSeek R1 Agent Integration
 */

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

export const WRITE_TOOLS: Tool[] = [
  {
    name: "proposeEdit",
    description: "Propose a code edit for user approval. The edit will be shown to the user who can approve or reject it.",
    parameters: {
      path: "string - file path relative to C:\\LifeOS\\LIDS",
      search: "string - exact text to find and replace",
      replace: "string - replacement text",
      description: "string - brief description of what this change does"
    }
  },
  {
    name: "proposeNewFile",
    description: "Propose creating a new file for user approval",
    parameters: {
      path: "string - file path relative to C:\\LifeOS\\LIDS",
      content: "string - file contents",
      description: "string - brief description of this new file"
    }
  }
];

export const SHELL_TOOLS: Tool[] = [
  {
    name: "proposeCommand",
    description: "Propose a shell command for user approval. Commands require explicit approval before execution.",
    parameters: {
      command: "string - the shell command to execute",
      description: "string - what this command does and why it's needed",
      workingDir: "string (optional) - working directory, defaults to /home/ubuntu/lids"
    }
  }
];

export const ALL_TOOLS: Tool[] = [...READ_TOOLS, ...WRITE_TOOLS, ...SHELL_TOOLS];

export interface EditProposal {
  id: string;
  type: 'edit' | 'newFile';
  path: string;
  search?: string;
  replace?: string;
  content?: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CommandProposal {
  id: string;
  command: string;
  description: string;
  workingDir: string;
  status: 'pending' | 'approved' | 'rejected';
  output?: string;
  error?: string;
  isDangerous: boolean;
}

// Patterns that indicate potentially dangerous commands
const DANGEROUS_PATTERNS = [
  /\brm\s+-rf?\b/i,
  /\brmdir\b/i,
  /\bdel\s+\/[sq]/i,
  /\bformat\b/i,
  /\bmkfs\b/i,
  /\bdd\s+if=/i,
  />\s*\/dev\//i,
  /\bsudo\s+rm\b/i,
  /\breboot\b/i,
  /\bshutdown\b/i,
  /\bkill\s+-9\b/i,
  /\bpkill\b/i,
  /\bdrop\s+database\b/i,
  /\bdrop\s+table\b/i,
  /\btruncate\b/i,
];

/**
 * Check if a command is potentially dangerous
 */
export function isDangerousCommand(command: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

/**
 * Format tools as instructions for DeepSeek's system prompt
 */
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

When you need to use a tool, output the tool_call XML tag. I will execute it and provide you with the result, then you can continue your response.`;
}

export interface ParsedToolCall {
  name: string;
  params: Record<string, string>;
}

/**
 * Parse tool calls from DeepSeek's response
 */
export function parseToolCalls(text: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];
  const regex = /<tool_call name="(\w+)">([\s\S]*?)<\/tool_call>/g;

  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    const paramsXml = match[2];
    const params: Record<string, string> = {};

    // Parse parameters from XML
    const paramRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let paramMatch;
    while ((paramMatch = paramRegex.exec(paramsXml)) !== null) {
      params[paramMatch[1]] = paramMatch[2].trim();
    }

    toolCalls.push({ name, params });
  }

  return toolCalls;
}

/**
 * Remove tool call XML from text for display
 */
export function removeToolCalls(text: string): string {
  return text.replace(/<tool_call[\s\S]*?<\/tool_call>/g, '').trim();
}

/**
 * Check if a tool is a write tool (requires approval)
 */
export function isWriteTool(toolName: string): boolean {
  return WRITE_TOOLS.some(t => t.name === toolName);
}

/**
 * Check if a tool is a shell tool (requires approval)
 */
export function isShellTool(toolName: string): boolean {
  return SHELL_TOOLS.some(t => t.name === toolName);
}

/**
 * Check if a tool requires approval (write or shell)
 */
export function requiresApproval(toolName: string): boolean {
  return isWriteTool(toolName) || isShellTool(toolName);
}

/**
 * Extract edit proposals from parsed tool calls
 */
export function extractEditProposals(toolCalls: ParsedToolCall[]): EditProposal[] {
  return toolCalls
    .filter(tc => isWriteTool(tc.name))
    .map(tc => ({
      id: crypto.randomUUID(),
      type: tc.name === 'proposeNewFile' ? 'newFile' as const : 'edit' as const,
      path: tc.params.path || '',
      search: tc.params.search,
      replace: tc.params.replace,
      content: tc.params.content,
      description: tc.params.description || 'No description provided',
      status: 'pending' as const
    }));
}

/**
 * Extract command proposals from parsed tool calls
 */
export function extractCommandProposals(toolCalls: ParsedToolCall[]): CommandProposal[] {
  return toolCalls
    .filter(tc => isShellTool(tc.name))
    .map(tc => ({
      id: crypto.randomUUID(),
      command: tc.params.command || '',
      description: tc.params.description || 'No description provided',
      workingDir: tc.params.workingDir || '/home/ubuntu/lids',
      status: 'pending' as const,
      isDangerous: isDangerousCommand(tc.params.command || '')
    }));
}
