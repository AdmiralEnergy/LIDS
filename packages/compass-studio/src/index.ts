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
