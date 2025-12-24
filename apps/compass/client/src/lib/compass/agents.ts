import scoutAvatar from '@assets/FieldOps1_SCOUT_1766542775289.png';
import analystAvatar from '@assets/FieldOps2_ANALYST_1766542775290.png';
import callerAvatar from '@assets/FieldOps3_CALLER_1766542775290.png';
import scribeAvatar from '@assets/FieldOps4_SCRIBE_1766542775291.png';
import watchmanAvatar from '@assets/FieldOps5_WATCHMAN_1766542775291.png';
import apexAvatar from '@assets/FieldOps10_APEX_1766542775291.png';
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
    color: '#EF4444',
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
    color: '#84CC16',
    avatar: scribeAvatar,
    status: 'online',
  },
  'fo-005': {
    id: 'fo-005',
    name: 'WATCHMAN',
    description: 'Pipeline monitoring',
    color: '#A855F7',
    avatar: watchmanAvatar,
    status: 'busy',
  },
  'fo-010': {
    id: 'fo-010',
    name: 'APEX',
    description: 'Strategic command',
    color: '#D4AF37',
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
