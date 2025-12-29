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
