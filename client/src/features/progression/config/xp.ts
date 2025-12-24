export const XP_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1900,   // Level 7
  2700,   // Level 8
  3800,   // Level 9
  5200,   // Level 10
  7000,   // Level 11
  9200,   // Level 12
  12000,  // Level 13
  15500,  // Level 14
  20000,  // Level 15
  25000,  // Level 16
  30000,  // Level 17
  36000,  // Level 18
  43000,  // Level 19
  51000,  // Level 20
  60000,  // Level 21
  70000,  // Level 22
  82000,  // Level 23
  96000,  // Level 24
  112000, // Level 25
];

export const XP_SOURCES: Record<string, { base: number; name: string }> = {
  dial_made: { base: 2, name: 'Dial Made' },
  call_connected: { base: 5, name: 'Call Connected' },
  two_plus_minute_call: { base: 15, name: '2+ Minute Call' },
  callback_scheduled: { base: 25, name: 'Callback Scheduled' },
  appointment_set: { base: 100, name: 'Appointment Set' },
  appointment_held: { base: 50, name: 'Appointment Held' },
  deal_closed: { base: 300, name: 'Deal Closed' },
  voicemail_left: { base: 8, name: 'Voicemail Left' },
  email_sent: { base: 10, name: 'Email Sent' },
  email_reply: { base: 30, name: 'Email Reply Received' },
  sms_sent: { base: 8, name: 'SMS Sent' },
  sms_reply: { base: 20, name: 'SMS Reply Received' },
  sms_enrollment: { base: 35, name: 'SMS Campaign Enrollment' },
  note_added: { base: 3, name: 'Note Added' },
  referral_generated: { base: 150, name: 'Referral Generated' },
  first_dial_of_day: { base: 25, name: 'First Dial of Day' },
  streak_day: { base: 10, name: 'Streak Day Bonus' },
  module_passed: { base: 50, name: 'Module Passed' },
  elite_exam_bonus: { base: 100, name: 'Elite Exam Score (95%+)' },
  certification_earned: { base: 300, name: 'Framework Certification' },
};

export const XP_SOURCE_ALIASES: Record<string, string> = {
  dial: 'dial_made',
  connect: 'call_connected',
  voicemail: 'voicemail_left',
  appointment: 'appointment_set',
  email_replied: 'email_reply',
  sms_replied: 'sms_reply',
  referral: 'referral_generated',
  streak_bonus: 'streak_day',
};

export type XPSourceType = keyof typeof XP_SOURCES;

export function resolveXPSource(eventType: string): string {
  return XP_SOURCE_ALIASES[eventType] || eventType;
}

export function calculateLevel(totalXp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getXpForLevel(level: number): { current: number; next: number } {
  const index = Math.min(level - 1, XP_THRESHOLDS.length - 1);
  const nextIndex = Math.min(level, XP_THRESHOLDS.length - 1);
  return {
    current: XP_THRESHOLDS[index],
    next: XP_THRESHOLDS[nextIndex],
  };
}
