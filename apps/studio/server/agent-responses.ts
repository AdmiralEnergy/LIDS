// Agent response simulation for COMPASS
// In production, this would connect to actual AI agents

interface SuggestedAction {
  id: string;
  label: string;
  action: string;
  params: Record<string, unknown>;
  destructive?: boolean;
}

interface AgentResponse {
  message: string;
  suggestedActions?: SuggestedAction[];
}

// Agent personalities and response styles
const agentPersonalities: Record<string, {
  greeting: string;
  style: string;
  specialties: string[];
}> = {
  'fo-001': {
    greeting: "SCOUT here! I'm ready to help you discover new opportunities.",
    style: 'enthusiastic and proactive',
    specialties: ['lead discovery', 'market research', 'prospecting'],
  },
  'fo-002': {
    greeting: "ANALYST reporting in. Let me help you make data-driven decisions.",
    style: 'analytical and precise',
    specialties: ['data analysis', 'insights', 'forecasting'],
  },
  'fo-003': {
    greeting: "CALLER standing by. Ready to help with your outreach strategy.",
    style: 'friendly and conversational',
    specialties: ['calling', 'communication', 'follow-ups'],
  },
  'fo-004': {
    greeting: "SCRIBE at your service. I'll help you capture everything important.",
    style: 'detailed and organized',
    specialties: ['documentation', 'notes', 'record-keeping'],
  },
  'fo-005': {
    greeting: "WATCHMAN on duty. I'm monitoring your pipeline for opportunities.",
    style: 'vigilant and thorough',
    specialties: ['monitoring', 'alerts', 'pipeline management'],
  },
  'fo-010': {
    greeting: "APEX here. Let's strategize and maximize your success.",
    style: 'strategic and commanding',
    specialties: ['strategy', 'leadership', 'optimization'],
  },
};

// Response templates based on user intent
const responseTemplates: Record<string, (agentId: string, context?: Record<string, unknown>) => AgentResponse> = {
  greeting: (agentId) => {
    const personality = agentPersonalities[agentId] || agentPersonalities['fo-001'];
    return {
      message: personality.greeting,
      suggestedActions: [
        { id: '1', label: 'Show my leads', action: 'show_leads', params: {} },
        { id: '2', label: 'Pipeline status', action: 'pipeline_status', params: {} },
        { id: '3', label: 'Schedule tasks', action: 'schedule', params: {} },
      ],
    };
  },
  
  leads: (agentId) => ({
    message: `I've pulled up your active leads. You have 5 leads in your pipeline. Would you like me to prioritize them based on engagement or potential value?`,
    suggestedActions: [
      { id: '1', label: 'Sort by value', action: 'sort_leads', params: { by: 'value' } },
      { id: '2', label: 'Sort by recency', action: 'sort_leads', params: { by: 'recent' } },
      { id: '3', label: 'Show hot leads', action: 'filter_leads', params: { status: 'qualified' } },
    ],
  }),
  
  enrich: (agentId, context) => ({
    message: `I'll enrich this lead with property data, utility information, and estimated values. This helps us understand their potential savings and tailor our pitch accordingly.`,
    suggestedActions: [
      { id: '1', label: 'Enrich now', action: 'enrich_lead', params: { leadId: context?.leadId } },
      { id: '2', label: 'Skip enrichment', action: 'skip', params: {} },
    ],
  }),
  
  pipeline: (agentId) => ({
    message: `Here's your pipeline overview:\n\n• New leads: 2\n• Contacted: 1\n• Qualified: 1\n• Proposal sent: 1\n\nYour conversion rate is looking good at 45%. The qualified lead is ready for a proposal.`,
    suggestedActions: [
      { id: '1', label: 'View qualified leads', action: 'filter_leads', params: { status: 'qualified' } },
      { id: '2', label: 'Send proposal', action: 'create_proposal', params: {} },
      { id: '3', label: 'Export report', action: 'export_pipeline', params: {} },
    ],
  }),
  
  help: (agentId) => {
    const personality = agentPersonalities[agentId] || agentPersonalities['fo-001'];
    return {
      message: `I specialize in ${personality.specialties.join(', ')}. Here are some things I can help you with:\n\n• Manage and enrich your leads\n• Analyze property data\n• Track your pipeline\n• Generate insights and reports\n• Automate follow-ups\n\nJust ask me anything!`,
      suggestedActions: [
        { id: '1', label: 'Show leads', action: 'show_leads', params: {} },
        { id: '2', label: 'Pipeline overview', action: 'pipeline_status', params: {} },
        { id: '3', label: 'Today\'s tasks', action: 'daily_tasks', params: {} },
      ],
    };
  },
  
  default: (agentId) => {
    const personality = agentPersonalities[agentId] || agentPersonalities['fo-001'];
    return {
      message: `I understand you're looking for assistance. As ${personality.style.split(' ')[0]} agent, I'm here to help. Could you tell me more about what you'd like to accomplish?`,
      suggestedActions: [
        { id: '1', label: 'View leads', action: 'show_leads', params: {} },
        { id: '2', label: 'Get insights', action: 'insights', params: {} },
        { id: '3', label: 'Help me', action: 'help', params: {} },
      ],
    };
  },
};

// Intent detection (simplified - in production would use NLP)
function detectIntent(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return 'greeting';
  }
  if (lowerMessage.includes('lead') || lowerMessage.includes('prospect') || lowerMessage.includes('customer')) {
    return 'leads';
  }
  if (lowerMessage.includes('enrich') || lowerMessage.includes('property') || lowerMessage.includes('data')) {
    return 'enrich';
  }
  if (lowerMessage.includes('pipeline') || lowerMessage.includes('status') || lowerMessage.includes('overview')) {
    return 'pipeline';
  }
  if (lowerMessage.includes('help') || lowerMessage.includes('what can') || lowerMessage.includes('how do')) {
    return 'help';
  }
  
  return 'default';
}

// Main function to generate agent response
export function generateAgentResponse(
  agentId: string,
  message: string,
  context?: { leadId?: string; callSid?: string }
): AgentResponse {
  const intent = detectIntent(message);
  const responseGenerator = responseTemplates[intent] || responseTemplates.default;
  
  return responseGenerator(agentId, context);
}

// Get agent greeting when first selecting
export function getAgentGreeting(agentId: string): AgentResponse {
  return responseTemplates.greeting(agentId);
}
