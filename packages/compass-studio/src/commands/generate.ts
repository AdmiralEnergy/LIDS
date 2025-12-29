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
