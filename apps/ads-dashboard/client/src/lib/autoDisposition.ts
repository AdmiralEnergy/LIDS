/**
 * Auto-Disposition System
 *
 * Automatically infers call outcomes from duration + transcription
 * so reps don't have to manually select dispositions.
 */

export interface TranscriptionEntry {
  id: string;
  speaker: 'rep' | 'customer' | 'system';
  text: string;
}

export interface AutoDispositionResult {
  disposition: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
  xpEventType: string;
}

// Duration thresholds (in seconds)
const THRESHOLD_NO_ANSWER = 10;
const THRESHOLD_SHORT_CALL = 30;
const THRESHOLD_QUALITY_CALL = 120;

// Keyword patterns for transcription analysis
const KEYWORD_PATTERNS = {
  negative: [
    'not interested',
    'no thank you',
    'no thanks',
    "don't call",
    'dont call',
    'remove me',
    'take me off',
    'stop calling',
    'wrong number',
    "don't need",
    'dont need',
    'already have',
    'not buying',
    'go away',
    'leave me alone',
  ],
  callback: [
    'call me back',
    'call back',
    'call later',
    'busy right now',
    'not a good time',
    'bad time',
    'next week',
    'tomorrow',
    'this afternoon',
    'tonight',
    'schedule',
    'give me a call',
    'try again',
  ],
  appointment: [
    'appointment',
    'come by',
    'come over',
    'stop by',
    'visit',
    'send someone',
    'send somebody',
    'quote',
    'estimate',
    'meet',
    'meeting',
    'see you',
    'sounds good',
    'interested',
    "let's do it",
    'lets do it',
    'sign me up',
  ],
  voicemail: [
    'leave a message',
    'leave your message',
    'at the tone',
    'after the beep',
    'voicemail',
    'voice mail',
    'not available',
    'unavailable',
    'mailbox',
    'please leave',
    'record your message',
  ],
  dnc: [
    'do not call',
    'dont call me again',
    "don't call me again",
    'harassment',
    'sue you',
    'lawyer',
    'attorney',
    'reported',
    'ftc',
    'federal trade',
  ],
};

/**
 * Check if transcription contains any keywords from a pattern list
 */
function containsKeywords(entries: TranscriptionEntry[], patterns: string[]): boolean {
  const fullText = entries.map(e => e.text.toLowerCase()).join(' ');
  return patterns.some(pattern => fullText.includes(pattern));
}

/**
 * Check if customer spoke during the call
 */
function customerSpoke(entries: TranscriptionEntry[]): boolean {
  return entries.some(e => e.speaker === 'customer' && e.text.trim().length > 5);
}

/**
 * Get the dominant sentiment from transcription
 */
function getTranscriptionSentiment(entries: TranscriptionEntry[]): 'positive' | 'negative' | 'neutral' {
  if (containsKeywords(entries, KEYWORD_PATTERNS.appointment)) return 'positive';
  if (containsKeywords(entries, KEYWORD_PATTERNS.negative)) return 'negative';
  if (containsKeywords(entries, KEYWORD_PATTERNS.dnc)) return 'negative';
  return 'neutral';
}

/**
 * Main inference function - determines disposition from call data
 */
export function inferDisposition(
  durationSeconds: number,
  transcriptionEntries: TranscriptionEntry[]
): AutoDispositionResult {
  const hasTranscription = transcriptionEntries.length > 0;
  const hasCustomerSpeech = customerSpoke(transcriptionEntries);

  // Rule 1: Very short call (< 10 seconds) = No Answer
  if (durationSeconds < THRESHOLD_NO_ANSWER) {
    return {
      disposition: 'no_answer',
      confidence: 'high',
      reason: 'Call under 10 seconds - no pickup',
      xpEventType: 'dial_made',
    };
  }

  // Rule 2: Check for DNC keywords first (any duration)
  if (hasTranscription && containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.dnc)) {
    return {
      disposition: 'dnc',
      confidence: 'high',
      reason: 'Do Not Call request detected',
      xpEventType: 'dial_made',
    };
  }

  // Rule 3: Short call (10-30 seconds) without customer speech = Voicemail
  if (durationSeconds >= THRESHOLD_NO_ANSWER && durationSeconds < THRESHOLD_SHORT_CALL) {
    // Check for voicemail indicators
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.voicemail) || !hasCustomerSpeech) {
      return {
        disposition: 'voicemail',
        confidence: hasTranscription ? 'high' : 'medium',
        reason: 'Short call with voicemail indicators',
        xpEventType: 'voicemail_left',
      };
    }

    // Short call with customer speech - check sentiment
    if (hasCustomerSpeech) {
      if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.negative)) {
        return {
          disposition: 'not_interested',
          confidence: 'medium',
          reason: 'Brief contact with negative response',
          xpEventType: 'dial_made',
        };
      }
      return {
        disposition: 'contact',
        confidence: 'low',
        reason: 'Brief contact - may need review',
        xpEventType: 'call_connected',
      };
    }
  }

  // Rule 4: Medium call (30-120 seconds)
  if (durationSeconds >= THRESHOLD_SHORT_CALL && durationSeconds < THRESHOLD_QUALITY_CALL) {
    // Check for callback intent
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.callback)) {
      return {
        disposition: 'callback',
        confidence: 'medium',
        reason: 'Callback request detected in conversation',
        xpEventType: 'callback_scheduled',
      };
    }

    // Check for appointment intent
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.appointment)) {
      return {
        disposition: 'callback',
        confidence: 'high',
        reason: 'Appointment interest detected',
        xpEventType: 'callback_scheduled',
      };
    }

    // Check for negative response
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.negative)) {
      return {
        disposition: 'not_interested',
        confidence: 'high',
        reason: 'Not interested response detected',
        xpEventType: 'dial_made',
      };
    }

    // Default for medium call = Contact
    return {
      disposition: 'contact',
      confidence: 'high',
      reason: 'Meaningful conversation duration',
      xpEventType: 'call_connected',
    };
  }

  // Rule 5: Long call (2+ minutes) = Quality Contact
  if (durationSeconds >= THRESHOLD_QUALITY_CALL) {
    // Long call with appointment keywords = definite callback
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.appointment)) {
      return {
        disposition: 'callback',
        confidence: 'high',
        reason: 'Extended conversation with appointment discussion',
        xpEventType: 'callback_scheduled',
      };
    }

    // Long call with callback keywords
    if (containsKeywords(transcriptionEntries, KEYWORD_PATTERNS.callback)) {
      return {
        disposition: 'callback',
        confidence: 'high',
        reason: 'Extended conversation with callback request',
        xpEventType: 'callback_scheduled',
      };
    }

    // Default long call = good contact
    return {
      disposition: 'contact',
      confidence: 'high',
      reason: '2+ minute quality conversation',
      xpEventType: 'call_connected',
    };
  }

  // Fallback - should not reach here
  return {
    disposition: 'contact',
    confidence: 'low',
    reason: 'Unable to determine - defaulting to contact',
    xpEventType: 'call_connected',
  };
}

/**
 * Calculate XP amount for a disposition
 */
export function calculateXpAmount(xpEventType: string, durationSeconds: number): number {
  // Base XP values (should match XP_SOURCES in config/xp.ts)
  const baseXp: Record<string, number> = {
    dial_made: 2,
    call_connected: 5,
    voicemail_left: 8,
    callback_scheduled: 25,
    two_plus_minute_call: 15,
  };

  let amount = baseXp[xpEventType] || 2;

  // Add 2+ minute bonus
  if (durationSeconds >= 120) {
    amount += baseXp.two_plus_minute_call || 15;
  }

  return amount;
}

/**
 * Get display label for disposition
 */
export function getDispositionLabel(disposition: string): string {
  const labels: Record<string, string> = {
    contact: 'Contact Made',
    callback: 'Callback Scheduled',
    voicemail: 'Left Voicemail',
    no_answer: 'No Answer',
    not_interested: 'Not Interested',
    wrong_number: 'Wrong Number',
    dnc: 'Do Not Call',
  };
  return labels[disposition] || disposition;
}

/**
 * Get color for disposition
 */
export function getDispositionColor(disposition: string): string {
  const colors: Record<string, string> = {
    contact: '#52c41a',      // Green
    callback: '#1890ff',     // Blue
    voicemail: '#722ed1',    // Purple
    no_answer: '#8c8c8c',    // Gray
    not_interested: '#fa8c16', // Orange
    wrong_number: '#f5222d', // Red
    dnc: '#000000',          // Black
  };
  return colors[disposition] || '#8c8c8c';
}
