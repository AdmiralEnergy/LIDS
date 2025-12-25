import { useLiveQuery } from 'dexie-react-hooks';
import { progressionDb, DailyMetrics } from '../../../lib/progressionDb';

export type EfficiencyTier = 'unsatisfactory' | 'satisfactory' | 'above' | 'elite' | 'ramp';

// Minimum dials before metrics "count" - grace period for new reps
// Sales companies don't penalize reps before they have enough data
export const MIN_DIALS_FOR_METRICS = 200;

export interface EfficiencyMetrics {
  // Is the rep still in ramp period? (under MIN_DIALS_FOR_METRICS)
  isRampPeriod: boolean;
  rampProgress: number; // 0-100% towards MIN_DIALS_FOR_METRICS
  sub30sDropRate: number;
  callToApptRate: number;
  twoPlusMinRate: number;
  showRate: number;
  smsEnrollmentRate: number;

  sub30sTier: EfficiencyTier;
  callToApptTier: EfficiencyTier;
  twoPlusMinTier: EfficiencyTier;
  showRateTier: EfficiencyTier;
  smsEnrollmentTier: EfficiencyTier;

  rawData: {
    dials: number;
    connects: number;
    callsUnder30s: number;
    callsOver2Min: number;
    appointments: number;
    shows: number;
    deals: number;
    smsEnrollments: number;
  };
}

const TIER_THRESHOLDS = {
  sub30sDropRate: {
    elite: 0.35,
    above: 0.50,
    satisfactory: 0.70,
  },
  callToApptRate: {
    elite: 0.067,
    above: 0.05,
    satisfactory: 0.02,
  },
  twoPlusMinRate: {
    elite: 0.35,
    above: 0.26,
    satisfactory: 0.15,
  },
  showRate: {
    elite: 0.85,
    above: 0.76,
    satisfactory: 0.60,
  },
  smsEnrollmentRate: {
    elite: 0.05,
    above: 0.03,
    satisfactory: 0.01,
  },
};

export const TIER_COLORS: Record<EfficiencyTier, string> = {
  ramp: '#6b7280',       // Gray - neutral, collecting data
  unsatisfactory: '#ff4d4f',
  satisfactory: '#1890ff',
  above: '#52c41a',
  elite: '#722ed1',
};

export const TIER_ICONS: Record<EfficiencyTier, string> = {
  ramp: '📊',            // Chart - collecting data
  unsatisfactory: '❌',
  satisfactory: '✅',
  above: '⭐',
  elite: '🏆',
};

function calculateTier(
  value: number,
  thresholds: { elite: number; above: number; satisfactory: number },
  lowerIsBetter: boolean = false
): EfficiencyTier {
  if (lowerIsBetter) {
    if (value <= thresholds.elite) return 'elite';
    if (value <= thresholds.above) return 'above';
    if (value <= thresholds.satisfactory) return 'satisfactory';
    return 'unsatisfactory';
  } else {
    if (value >= thresholds.elite) return 'elite';
    if (value >= thresholds.above) return 'above';
    if (value >= thresholds.satisfactory) return 'satisfactory';
    return 'unsatisfactory';
  }
}

export function useEfficiencyMetrics(daysBack: number = 7): EfficiencyMetrics | null {
  const dailyMetrics = useLiveQuery(async () => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startStr = startDate.toISOString().split('T')[0];
    
    const metrics = await progressionDb.dailyMetrics
      .where('date')
      .aboveOrEqual(startStr)
      .toArray();
    
    return metrics;
  }, [daysBack]);

  if (!dailyMetrics || dailyMetrics.length === 0) {
    // No data = ramp period (not penalized)
    return {
      isRampPeriod: true,
      rampProgress: 0,
      sub30sDropRate: 0,
      callToApptRate: 0,
      twoPlusMinRate: 0,
      showRate: 0,
      smsEnrollmentRate: 0,
      sub30sTier: 'ramp',
      callToApptTier: 'ramp',
      twoPlusMinTier: 'ramp',
      showRateTier: 'ramp',
      smsEnrollmentTier: 'ramp',
      rawData: {
        dials: 0,
        connects: 0,
        callsUnder30s: 0,
        callsOver2Min: 0,
        appointments: 0,
        shows: 0,
        deals: 0,
        smsEnrollments: 0,
      },
    };
  }

  interface MetricTotals {
    dials: number;
    connects: number;
    callsUnder30s: number;
    callsOver2Min: number;
    appointments: number;
    shows: number;
    deals: number;
    smsEnrollments: number;
  }

  const totals = dailyMetrics.reduce<MetricTotals>(
    (acc, day) => ({
      dials: acc.dials + day.dials,
      connects: acc.connects + day.connects,
      callsUnder30s: acc.callsUnder30s + day.callsUnder30s,
      callsOver2Min: acc.callsOver2Min + day.callsOver2Min,
      appointments: acc.appointments + day.appointments,
      shows: acc.shows + day.shows,
      deals: acc.deals + day.deals,
      smsEnrollments: acc.smsEnrollments + day.smsEnrollments,
    }),
    {
      dials: 0,
      connects: 0,
      callsUnder30s: 0,
      callsOver2Min: 0,
      appointments: 0,
      shows: 0,
      deals: 0,
      smsEnrollments: 0,
    }
  );

  const sub30sDropRate = totals.connects > 0 ? totals.callsUnder30s / totals.connects : 0;
  const callToApptRate = totals.connects > 0 ? totals.appointments / totals.connects : 0;
  const twoPlusMinRate = totals.connects > 0 ? totals.callsOver2Min / totals.connects : 0;
  const showRate = totals.appointments > 0 ? totals.shows / totals.appointments : 0;
  const smsEnrollmentRate = totals.connects > 0 ? totals.smsEnrollments / totals.connects : 0;

  // Check if still in ramp period (under minimum dials)
  const isRampPeriod = totals.dials < MIN_DIALS_FOR_METRICS;
  const rampProgress = Math.min((totals.dials / MIN_DIALS_FOR_METRICS) * 100, 100);

  // During ramp period, show neutral 'ramp' tier instead of pass/fail
  const getTierOrRamp = (tier: EfficiencyTier): EfficiencyTier => {
    return isRampPeriod ? 'ramp' : tier;
  };

  return {
    isRampPeriod,
    rampProgress,
    sub30sDropRate,
    callToApptRate,
    twoPlusMinRate,
    showRate,
    smsEnrollmentRate,
    sub30sTier: getTierOrRamp(calculateTier(sub30sDropRate, TIER_THRESHOLDS.sub30sDropRate, true)),
    callToApptTier: getTierOrRamp(calculateTier(callToApptRate, TIER_THRESHOLDS.callToApptRate, false)),
    twoPlusMinTier: getTierOrRamp(calculateTier(twoPlusMinRate, TIER_THRESHOLDS.twoPlusMinRate, false)),
    showRateTier: getTierOrRamp(calculateTier(showRate, TIER_THRESHOLDS.showRate, false)),
    smsEnrollmentTier: getTierOrRamp(calculateTier(smsEnrollmentRate, TIER_THRESHOLDS.smsEnrollmentRate, false)),
    rawData: totals,
  };
}

export function getTargetForMetric(metric: keyof typeof TIER_THRESHOLDS): string {
  const targets: Record<string, string> = {
    sub30sDropRate: '<50%',
    callToApptRate: '5%+',
    twoPlusMinRate: '25%+',
    showRate: '75%+',
    smsEnrollmentRate: '3%+',
  };
  return targets[metric] || '';
}
