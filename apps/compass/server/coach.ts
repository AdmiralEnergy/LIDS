/**
 * Coach Micro-Agent
 * Objection handling and call flow suggestions
 * No external dependencies - uses local objections library
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface ObjectionResponse {
  response: string;
  technique: string;
  confidence: number;
  followUp?: string;
}

export interface NextAction {
  action: string;
  script?: string;
  tip: string;
}

interface ObjectionEntry {
  id: string;
  match: string[];
  response: string;
  technique: string;
  confidence: number;
  followUp?: string;
}

// Load objections library
let objectionLibrary: ObjectionEntry[] = [];
try {
  const dataPath = join(__dirname, 'data', 'objections.json');
  objectionLibrary = JSON.parse(readFileSync(dataPath, 'utf-8'));
} catch (error) {
  console.warn('[Coach] Failed to load objections.json, using empty library');
}

const defaultResponse: ObjectionResponse = {
  response: 'Totally fair. Can I ask what you have heard that makes you feel that way?',
  technique: 'Clarify',
  confidence: 0.4,
  followUp: 'If we could address that concern, would you be open to the next step?',
};

function normalize(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * Get response for an objection using fuzzy matching
 */
export function getObjectionResponse(
  objection: string,
  context?: { previousAttempts?: number }
): ObjectionResponse {
  const normalized = normalize(objection);
  if (!normalized) return defaultResponse;

  // Find match using includes (fuzzy matching)
  const match = objectionLibrary.find(entry =>
    entry.match.some(phrase => normalized.includes(phrase))
  );

  if (!match) {
    return defaultResponse;
  }

  // Decrease confidence with more attempts
  const attempts = context?.previousAttempts ?? 0;
  const confidence = Math.max(0.3, match.confidence - attempts * 0.1);

  return {
    response: match.response,
    technique: match.technique,
    confidence,
    followUp: match.followUp,
  };
}

/**
 * Suggest next action based on call state
 */
export function suggestNextAction(
  callState: 'opening' | 'discovery' | 'objection' | 'closing',
  leadData: { status: string; attempts: number; lastOutcome?: string }
): NextAction {
  switch (callState) {
    case 'opening':
      return {
        action: 'confirm_identity',
        script: 'Just to make sure I have the right person, is this still a good number for you?',
        tip: 'Keep it quick and move into a curiosity hook.',
      };
    case 'discovery':
      return {
        action: 'probe_bill',
        script: 'What did your last electric bill run you roughly?',
        tip: 'Anchor on a simple, easy-to-answer question.',
      };
    case 'objection':
      if (leadData.attempts >= 3 || leadData.lastOutcome === 'not_interested') {
        return {
          action: 'soft_exit',
          script: 'Totally understand. Would it be okay if I send a quick summary for later?',
          tip: 'Preserve the relationship for a future touch.',
        };
      }
      return {
        action: 'reframe_value',
        script: 'Most people felt the same way until they saw the side-by-side bill comparison.',
        tip: 'Reframe with social proof and a low-friction next step.',
      };
    case 'closing':
      return {
        action: 'lock_next_step',
        script: 'If we could line up a quick 15-minute review, does Tuesday or Wednesday work better?',
        tip: 'Offer two options to reduce decision friction.',
      };
    default:
      return {
        action: 'hold',
        tip: 'Maintain the current flow and listen for the next cue.',
      };
  }
}
