/**
 * DPC-Focused Efficiency Metrics
 * Based on ADMIRAL_UNIFIED_SALES_FRAMEWORK.md Part 2-3
 *
 * Philosophy: Quality-adjusted efficiency tracking, not raw dial volume
 * Primary metric: DPC (Dials Per Confirmed) - lower is better
 * Quality gate: ECR (Enrollment Confirmation Rate) - higher is better
 */

// Efficiency Tiers (DPC-based, lower is better)
export const EFFICIENCY_TIERS = {
  RAMP: 'Building baseline',
  DEVELOPING: 'Developing',
  SATISFACTORY: 'Satisfactory',
  ABOVE_SATISFACTORY: 'Above Satisfactory',
  ELITE: 'Elite',
} as const;

export type EfficiencyTier = typeof EFFICIENCY_TIERS[keyof typeof EFFICIENCY_TIERS];

// Tier thresholds from framework Part 3.1
export const DPC_THRESHOLDS = {
  ELITE: 30,           // DPC < 30
  ABOVE_SATISFACTORY: 45,  // DPC 30-45
  SATISFACTORY: 70,    // DPC 45-70
  // DPC > 70 = Developing
} as const;

export const ECR_THRESHOLDS = {
  HIGH: 85,        // ECR > 85% (Elite requirement)
  ABOVE_SAT: 75,   // ECR > 75% (Above Satisfactory requirement)
  GOOD: 65,        // ECR > 65% (Satisfactory requirement)
  // ECR < 65% = low
} as const;

// Ramp period threshold
export const RAMP_THRESHOLD = 25; // Need 25 confirmed enrollments to exit ramp

// Enrollment status
export type EnrollmentStatus = 'pending' | 'confirmed' | 'unconfirmed' | 'declined';

// Primary efficiency metrics
export interface DPCMetrics {
  // Core metrics (Part 2.1)
  dpe: number;               // Dials Per Enrollment (lower = better)
  ecr: number;               // Enrollment Confirmation Rate 0-100 (higher = better)
  dpc: number;               // Dials Per Confirmed - PRIMARY (lower = better)
  ear: number;               // Enrollment-to-Appointment Rate 0-100 (higher = better)

  // Tier assessments
  dpcTier: EfficiencyTier;
  ecrLevel: 'low' | 'good' | 'high';

  // Trend (7-day rolling comparison)
  dpcTrend: 'improving' | 'stable' | 'declining';

  // Raw counts
  rawData: {
    totalDials: number;
    totalEnrollments: number;
    confirmedEnrollments: number;
    unconfirmedEnrollments: number;
    declinedEnrollments: number;
    appointments: number;
  };

  // Ramp tracking (Part 3.3)
  isRampPeriod: boolean;
  rampProgress: number;      // X/25 confirmed to exit ramp
}

// Enrollment record (Part 8.2)
export interface EnrollmentRecord {
  id: string;
  leadId: string;
  repId: string;
  source: 'offensive' | 'passive';
  status: EnrollmentStatus;
  qualificationScore: number; // 0-100 based on fields filled
  enrolledAt: Date;
  confirmationSentAt?: Date;
  confirmedAt?: Date;
  metadata: {
    homeowner?: boolean;
    roofAge?: number;
    monthlyBill?: number;
    decisionMaker?: boolean;
  };
}

// Daily metrics record (Part 8.3)
export interface DailyMetricsRecord {
  id: string;
  date: string;             // YYYY-MM-DD
  repId: string;

  // Activity
  dials: number;
  connects: number;
  callsUnder30s: number;
  callsOver2Min: number;
  voicemailsLeft: number;

  // Enrollment
  enrollments: number;
  confirmedEnrollments: number;
  unconfirmedEnrollments: number;
  declinedEnrollments: number;

  // Conversion
  appointments: number;
  shows: number;
  deals: number;
  revenue: number;

  // Cadence
  cadenceTouchesAttempted: number;
  cadenceTouchesCompleted: number;
  cadencesCompleted: number;

  // Calculated
  dpe: number;
  ecr: number;
  dpc: number;
  ear: number;
}

/**
 * Calculate DPE (Dials Per Enrollment)
 * Lower is better - how many dials to get one enrollment
 */
export function calculateDPE(dials: number, enrollments: number): number {
  if (enrollments === 0) return Infinity;
  return Math.round(dials / enrollments);
}

/**
 * Calculate ECR (Enrollment Confirmation Rate)
 * Higher is better - quality gate for enrollments (0-100)
 */
export function calculateECR(confirmed: number, totalEnrollments: number): number {
  if (totalEnrollments === 0) return 0;
  return Math.round((confirmed / totalEnrollments) * 100);
}

/**
 * Calculate DPC (Dials Per Confirmed) - PRIMARY METRIC
 * Lower is better - quality-adjusted efficiency
 */
export function calculateDPC(dials: number, confirmedEnrollments: number): number {
  if (confirmedEnrollments === 0) return Infinity;
  return Math.round(dials / confirmedEnrollments);
}

/**
 * Calculate EAR (Enrollment-to-Appointment Rate)
 * Higher is better - cadence effectiveness (0-100)
 */
export function calculateEAR(appointments: number, confirmedEnrollments: number): number {
  if (confirmedEnrollments === 0) return 0;
  return Math.round((appointments / confirmedEnrollments) * 100);
}

/**
 * Get DPC tier based on BOTH DPC value AND ECR (per framework Part 3.1)
 * Elite: DPC < 30 + ECR > 85%
 * Above Satisfactory: DPC 30-45 + ECR > 75%
 * Satisfactory: DPC 45-70 + ECR > 65%
 * Developing: DPC > 70 OR ECR below tier requirement
 * Ramp: <25 confirmed enrollments (still building baseline)
 */
export function getDPCTier(dpc: number, confirmedEnrollments: number, ecr: number = 0): EfficiencyTier {
  // Ramp period: less than 25 confirmed enrollments
  if (confirmedEnrollments < RAMP_THRESHOLD) {
    return EFFICIENCY_TIERS.RAMP;
  }

  // Check BOTH DPC AND ECR requirements (per framework Part 3.1)
  if (dpc < DPC_THRESHOLDS.ELITE && ecr > ECR_THRESHOLDS.HIGH) {
    return EFFICIENCY_TIERS.ELITE;
  }
  if (dpc < DPC_THRESHOLDS.ABOVE_SATISFACTORY && ecr > ECR_THRESHOLDS.ABOVE_SAT) {
    return EFFICIENCY_TIERS.ABOVE_SATISFACTORY;
  }
  if (dpc < DPC_THRESHOLDS.SATISFACTORY && ecr > ECR_THRESHOLDS.GOOD) {
    return EFFICIENCY_TIERS.SATISFACTORY;
  }
  return EFFICIENCY_TIERS.DEVELOPING;
}

/**
 * Get ECR quality level
 */
export function getECRLevel(ecr: number): 'low' | 'good' | 'high' {
  if (ecr >= ECR_THRESHOLDS.HIGH) return 'high';
  if (ecr >= ECR_THRESHOLDS.GOOD) return 'good';
  return 'low';
}

/**
 * Get tier color for display
 */
export function getTierColor(tier: EfficiencyTier): string {
  switch (tier) {
    case EFFICIENCY_TIERS.ELITE:
      return '#c9a648'; // Gold
    case EFFICIENCY_TIERS.ABOVE_SATISFACTORY:
      return '#52c41a'; // Green
    case EFFICIENCY_TIERS.SATISFACTORY:
      return '#1890ff'; // Blue
    case EFFICIENCY_TIERS.DEVELOPING:
      return '#faad14'; // Orange
    case EFFICIENCY_TIERS.RAMP:
      return '#8c8c8c'; // Gray
    default:
      return '#8c8c8c';
  }
}

/**
 * Get ECR level color for display
 */
export function getECRColor(level: 'low' | 'good' | 'high'): string {
  switch (level) {
    case 'high':
      return '#52c41a'; // Green
    case 'good':
      return '#1890ff'; // Blue
    case 'low':
      return '#faad14'; // Orange
    default:
      return '#8c8c8c';
  }
}

/**
 * Get trend direction based on current vs previous period
 */
export function getDPCTrend(currentDPC: number, previousDPC: number): 'improving' | 'stable' | 'declining' {
  // Lower DPC is better, so if current < previous, we're improving
  const changePercent = previousDPC > 0
    ? ((previousDPC - currentDPC) / previousDPC) * 100
    : 0;

  if (changePercent > 5) return 'improving';
  if (changePercent < -5) return 'declining';
  return 'stable';
}

/**
 * Calculate qualification score based on fields filled (Part 4.4)
 * 4 fields: homeowner, roofAge, monthlyBill, decisionMaker
 */
export function calculateQualificationScore(metadata: EnrollmentRecord['metadata']): number {
  const fields = ['homeowner', 'roofAge', 'monthlyBill', 'decisionMaker'] as const;
  const filledCount = fields.filter(field =>
    metadata[field] !== undefined && metadata[field] !== null
  ).length;
  return Math.round((filledCount / fields.length) * 100);
}

/**
 * Check if rep needs coaching based on metrics (Part 12.1)
 */
export function needsCoaching(metrics: DPCMetrics, consecutiveDays: number = 1): {
  needed: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Low ECR for 7 days - qualification technique
  if (metrics.ecr < 60 && consecutiveDays >= 7) {
    reasons.push('ECR below 60% for 7+ days - review qualification technique');
  }

  // High DPC for 7 days - opener/engagement
  if (metrics.dpc > 80 && consecutiveDays >= 7 && !metrics.isRampPeriod) {
    reasons.push('DPC above 80 for 7+ days - review opener/engagement');
  }

  // Zero confirmed enrollments for 2 consecutive days
  if (metrics.rawData.confirmedEnrollments === 0 && consecutiveDays >= 2) {
    reasons.push('Zero confirmed enrollments for 2+ days - same-day shadowing needed');
  }

  // Low EAR (cadence effectiveness)
  if (metrics.ear < 10 && metrics.rawData.confirmedEnrollments >= 20) {
    reasons.push('EAR below 10% with 20+ confirmed - review cadence execution');
  }

  return { needed: reasons.length > 0, reasons };
}

/**
 * Check if rep earned recognition (Part 12.2)
 */
export function earnedRecognition(metrics: DPCMetrics): {
  earned: boolean;
  achievements: string[];
} {
  const achievements: string[] = [];

  // DPC Elite for 7 days
  if (metrics.dpc < 30 && !metrics.isRampPeriod) {
    achievements.push('Elite DPC (<30) - Team shoutout earned!');
  }

  // ECR Champion - 90%+ with min 20 enrollments
  if (metrics.ecr >= 90 && metrics.rawData.totalEnrollments >= 20) {
    achievements.push('Quality Champion - ECR 90%+ with 20+ enrollments');
  }

  // Conversion Elite - EAR 30%+
  if (metrics.ear >= 30 && metrics.rawData.confirmedEnrollments >= 10) {
    achievements.push('Conversion Elite - EAR 30%+');
  }

  return { earned: achievements.length > 0, achievements };
}

/**
 * Build complete DPCMetrics object from raw data
 */
export function buildDPCMetrics(
  rawData: DPCMetrics['rawData'],
  previousDPC?: number
): DPCMetrics {
  const dpe = calculateDPE(rawData.totalDials, rawData.totalEnrollments);
  const ecr = calculateECR(rawData.confirmedEnrollments, rawData.totalEnrollments);
  const dpc = calculateDPC(rawData.totalDials, rawData.confirmedEnrollments);
  const ear = calculateEAR(rawData.appointments, rawData.confirmedEnrollments);

  const dpcTier = getDPCTier(dpc, rawData.confirmedEnrollments, ecr);
  const ecrLevel = getECRLevel(ecr);
  const dpcTrend = previousDPC !== undefined
    ? getDPCTrend(dpc, previousDPC)
    : 'stable';

  const isRampPeriod = rawData.confirmedEnrollments < RAMP_THRESHOLD;
  const rampProgress = Math.min(rawData.confirmedEnrollments, RAMP_THRESHOLD);

  return {
    dpe,
    ecr,
    dpc,
    ear,
    dpcTier,
    ecrLevel,
    dpcTrend,
    rawData,
    isRampPeriod,
    rampProgress,
  };
}

/**
 * Get human-readable interpretation of metrics (Part 9.2)
 */
export function getMetricsInterpretation(metrics: DPCMetrics): {
  dpcMeaning: string;
  ecrMeaning: string;
  earMeaning: string;
  improvementFocus: string;
} {
  // DPC interpretation
  let dpcMeaning: string;
  if (metrics.isRampPeriod) {
    dpcMeaning = `Building baseline: ${metrics.rampProgress}/${RAMP_THRESHOLD} confirmed enrollments to establish your efficiency tier.`;
  } else if (metrics.dpc === Infinity) {
    dpcMeaning = 'No confirmed enrollments yet. Focus on getting leads through your cadence.';
  } else {
    dpcMeaning = `You get a quality enrollment every ${metrics.dpc} dials. ${
      metrics.dpcTier === EFFICIENCY_TIERS.ELITE ? 'Elite efficiency!' :
      metrics.dpcTier === EFFICIENCY_TIERS.ABOVE_SATISFACTORY ? 'Strong efficiency.' :
      metrics.dpcTier === EFFICIENCY_TIERS.SATISFACTORY ? 'Meeting expectations.' :
      'Room for improvement.'
    }`;
  }

  // ECR interpretation
  let ecrMeaning: string;
  if (metrics.rawData.totalEnrollments === 0) {
    ecrMeaning = 'No enrollments yet to measure quality.';
  } else {
    const confirmedRatio = Math.round(metrics.ecr / 10);
    ecrMeaning = `${confirmedRatio} out of 10 enrollees confirm interest. ${
      metrics.ecrLevel === 'high' ? 'Your enrollments are high quality.' :
      metrics.ecrLevel === 'good' ? 'Good enrollment quality.' :
      'Consider deeper qualification before enrolling.'
    }`;
  }

  // EAR interpretation
  let earMeaning: string;
  if (metrics.rawData.confirmedEnrollments === 0) {
    earMeaning = 'Need confirmed enrollments to measure cadence effectiveness.';
  } else {
    earMeaning = `${metrics.ear}% of confirmed enrollees become appointments. ${
      metrics.ear >= 30 ? 'Cadence is highly effective.' :
      metrics.ear >= 20 ? 'Cadence is working well.' :
      metrics.ear >= 10 ? 'Cadence is functional.' :
      'Consider optimizing your follow-up sequence.'
    }`;
  }

  // Improvement focus
  let improvementFocus: string;
  if (metrics.isRampPeriod) {
    improvementFocus = 'Focus on learning the process. Complete more cadences to build your baseline.';
  } else if (metrics.ecrLevel === 'low') {
    improvementFocus = 'Focus: Deeper qualification before enrolling. Make sure leads understand what they\'re opting into.';
  } else if (metrics.dpc > DPC_THRESHOLDS.SATISFACTORY) {
    improvementFocus = 'Focus: Opener refinement. Work on engaging leads faster in the first 10 seconds.';
  } else if (metrics.ear < 10) {
    improvementFocus = 'Focus: Cadence execution. Review your multi-touch sequence timing and messaging.';
  } else {
    improvementFocus = 'Keep doing what you\'re doing! Maintain your current approach.';
  }

  return {
    dpcMeaning,
    ecrMeaning,
    earMeaning,
    improvementFocus,
  };
}
