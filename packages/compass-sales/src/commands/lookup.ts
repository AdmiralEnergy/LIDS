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
