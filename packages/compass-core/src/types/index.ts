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
