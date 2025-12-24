import scoutAvatar from '@assets/generated_images/scout_agent_avatar_blue.png';
import analystAvatar from '@assets/generated_images/analyst_agent_avatar_green.png';
import callerAvatar from '@assets/generated_images/caller_agent_avatar_orange.png';
import scribeAvatar from '@assets/generated_images/scribe_agent_avatar_purple.png';
import watchmanAvatar from '@assets/generated_images/watchman_agent_avatar_red.png';
import apexAvatar from '@assets/generated_images/apex_agent_avatar_gold.png';
import defaultAvatar from '@assets/generated_images/default_agent_avatar_gray.png';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
  color: string;
  avatar: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

export const AGENTS: Record<string, AgentInfo> = {
  'fo-001': {
    id: 'fo-001',
    name: 'SCOUT',
    description: 'Lead discovery & research',
    color: '#3B82F6',
    avatar: scoutAvatar,
    status: 'online',
  },
  'fo-002': {
    id: 'fo-002',
    name: 'ANALYST',
    description: 'Data analysis & insights',
    color: '#10B981',
    avatar: analystAvatar,
    status: 'online',
  },
  'fo-003': {
    id: 'fo-003',
    name: 'CALLER',
    description: 'Outbound communications',
    color: '#F59E0B',
    avatar: callerAvatar,
    status: 'away',
  },
  'fo-004': {
    id: 'fo-004',
    name: 'SCRIBE',
    description: 'Documentation & notes',
    color: '#8B5CF6',
    avatar: scribeAvatar,
    status: 'online',
  },
  'fo-005': {
    id: 'fo-005',
    name: 'WATCHMAN',
    description: 'Pipeline monitoring',
    color: '#EF4444',
    avatar: watchmanAvatar,
    status: 'busy',
  },
  'fo-010': {
    id: 'fo-010',
    name: 'APEX',
    description: 'Strategic command',
    color: '#F59E0B',
    avatar: apexAvatar,
    status: 'online',
  },
};

export const DEFAULT_AVATAR = defaultAvatar;

export function getAgent(agentId: string): AgentInfo | undefined {
  return AGENTS[agentId];
}

export function getAgentAvatar(agentId: string): string {
  return AGENTS[agentId]?.avatar || DEFAULT_AVATAR;
}

export function getAgentName(agentId: string): string {
  return AGENTS[agentId]?.name || 'Agent';
}

export function getAllAgents(): AgentInfo[] {
  return Object.values(AGENTS);
}
