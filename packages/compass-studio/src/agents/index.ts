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
