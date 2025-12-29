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
