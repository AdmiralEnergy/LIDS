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
