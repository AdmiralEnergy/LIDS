const AGENT_RESPONSES: Record<string, string[]> = {
  'fo-001': [
    "I've identified 3 properties in Matthews that match your ICP criteria. Want me to pull the details?",
    "Based on the property data, this lead has high solar potential - south-facing roof, minimal shade, built 2015.",
    "I found the homeowner's LinkedIn - they work in tech, likely data-driven decision maker.",
    "The neighborhood has 12 existing solar installations within 0.5 miles. Social proof opportunity.",
  ],
  'fo-002': [
    "Looking at this lead's utility data: average $180/month, peak usage in summer. Good candidate for 8kW system.",
    "Credit score range suggests they'd qualify for the 0% APR financing option.",
    "Property value appreciation of 15% since purchase - they have equity to leverage.",
    "Based on similar conversions, this lead has a 73% close probability.",
  ],
  'fo-003': [
    "I'd recommend opening with the Duke Energy rate increase angle - it's been in local news.",
    "Their voicemail mentioned they work from home - try calling mid-morning.",
    "Previous attempt notes show interest but timing concern. Lead with financing flexibility.",
    "Based on their communication style, keep the pitch data-focused, not emotional.",
  ],
  'fo-004': [
    "I've documented the call notes and updated the lead status to 'Qualified'.",
    "Summary logged: Interested in site visit, concerned about roof age, spouse needs to be present.",
    "Activity timeline updated. Next action: Follow-up call scheduled for Tuesday 2pm.",
    "I've added the objection 'roof age' to this lead's profile for the closer to address.",
  ],
  'fo-005': [
    "Alert: This lead was last contacted 5 days ago. Recommend follow-up today.",
    "Pipeline check: You have 3 leads in 'Proposal Sent' over 48 hours - time to follow up.",
    "Daily summary: 12 calls made, 4 contacts, 2 appointments set. Above target.",
    "Reminder: Site visit with Johnson family tomorrow at 2pm. Confirming appointment.",
  ],
  'fo-010': [
    "Strategic recommendation: Focus on Matthews/Mint Hill today - highest conversion rates this quarter.",
    "Your close rate improves 23% when you mention the federal tax credit in the first 2 minutes.",
    "Top performer insight: Nate books 40% more appointments by offering specific time slots vs 'when works for you'.",
    "Weekly goal check: 8/15 appointments set. Push for 3 more today to hit target.",
  ],
};

const GENERIC_RESPONSES = [
  "I'm analyzing that now. Give me a moment...",
  "Good question. Based on what I'm seeing...",
  "Let me check the data on that.",
  "I've updated the records accordingly.",
  "Here's what I found...",
];

export function getMockResponse(agentId: string, message: string): string {
  const agentResponses = AGENT_RESPONSES[agentId] || GENERIC_RESPONSES;

  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes('lead') || lowerMsg.includes('property')) {
    return agentResponses[0];
  }
  if (lowerMsg.includes('call') || lowerMsg.includes('contact')) {
    return agentResponses[Math.min(2, agentResponses.length - 1)];
  }
  if (lowerMsg.includes('schedule') || lowerMsg.includes('appointment')) {
    return agentResponses[Math.min(3, agentResponses.length - 1)];
  }

  return agentResponses[Math.floor(Math.random() * agentResponses.length)];
}

export function getMockDelay(): number {
  return 800 + Math.random() * 1200;
}
