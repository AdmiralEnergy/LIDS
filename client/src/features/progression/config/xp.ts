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
];

export const XP_SOURCES: Record<string, { base: number; name: string }> = {
  dial: { base: 5, name: 'Dial Made' },
  connect: { base: 15, name: 'Call Connected' },
  voicemail: { base: 8, name: 'Voicemail Left' },
  callback_scheduled: { base: 25, name: 'Callback Scheduled' },
  appointment: { base: 100, name: 'Appointment Set' },
  deal_closed: { base: 500, name: 'Deal Closed' },
  email_sent: { base: 10, name: 'Email Sent' },
  email_replied: { base: 30, name: 'Email Reply Received' },
  sms_sent: { base: 8, name: 'SMS Sent' },
  sms_replied: { base: 20, name: 'SMS Reply Received' },
  note_added: { base: 3, name: 'Note Added' },
  referral: { base: 150, name: 'Referral Generated' },
  first_dial_of_day: { base: 25, name: 'First Dial of Day' },
  streak_bonus: { base: 10, name: 'Streak Day Bonus' },
};

export type XPSourceType = keyof typeof XP_SOURCES;

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
