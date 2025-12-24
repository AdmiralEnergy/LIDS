/**
 * TCPA 4-Tier Compliance Filter
 *
 * - SAFE: 0 DNC, 1+ callable
 * - MODERATE: 1 DNC (manual review)
 * - DANGEROUS: 2+ DNC (exclude)
 * - DNC_DATABASE: 3+ DNC (permanent hold)
 * - NO_CONTACT_DATA: No phone numbers
 */

import { PROPSTREAM_PHONE_DNC_PAIRS } from './propstream';

export type TCPARiskLevel = 'SAFE' | 'MODERATE' | 'DANGEROUS' | 'DNC_DATABASE' | 'NO_CONTACT_DATA';

export interface TCPAAnalysis {
  riskLevel: TCPARiskLevel;
  dncCount: number;
  callableCount: number;
  phoneCount: number;
  callableNumbers: string[];
  dncNumbers: string[];
}

export function getPropstreamPhoneDncPairs(): Array<{ phoneCol: string; dncCol: string }> {
  return PROPSTREAM_PHONE_DNC_PAIRS.map(p => ({
    phoneCol: p.phone,
    dncCol: p.dnc
  }));
}

export function classifyLead(
  row: Record<string, string>,
  phoneDncPairs: Array<{ phoneCol: string; dncCol: string }>
): TCPAAnalysis {
  let dncCount = 0;
  let callableCount = 0;
  let phoneCount = 0;
  const callableNumbers: string[] = [];
  const dncNumbers: string[] = [];

  for (const { phoneCol, dncCol } of phoneDncPairs) {
    const phone = row[phoneCol]?.trim();
    const dnc = row[dncCol]?.trim().toUpperCase();

    if (!phone) continue;
    phoneCount++;

    if (dnc === 'DNC') {
      dncCount++;
      dncNumbers.push(phone);
    } else {
      callableCount++;
      callableNumbers.push(phone);
    }
  }

  let riskLevel: TCPARiskLevel;
  if (phoneCount === 0) {
    riskLevel = 'NO_CONTACT_DATA';
  } else if (dncCount >= 3) {
    riskLevel = 'DNC_DATABASE';
  } else if (dncCount >= 2) {
    riskLevel = 'DANGEROUS';
  } else if (dncCount === 1) {
    riskLevel = 'MODERATE';
  } else if (callableCount >= 1) {
    riskLevel = 'SAFE';
  } else {
    riskLevel = 'NO_CONTACT_DATA';
  }

  return { riskLevel, dncCount, callableCount, phoneCount, callableNumbers, dncNumbers };
}

export function getComplianceStatus(riskLevel: TCPARiskLevel): string {
  switch (riskLevel) {
    case 'SAFE': return 'verified';
    case 'MODERATE': return 'review';
    case 'DANGEROUS': return 'quarantined';
    case 'DNC_DATABASE': return 'dnc_hold';
    default: return 'pending';
  }
}

export function calculateSafePercentage(analyses: TCPAAnalysis[]): number {
  const leadsWithPhones = analyses.filter(a => a.phoneCount > 0);
  if (leadsWithPhones.length === 0) return 0;
  const safeLeads = leadsWithPhones.filter(a => a.riskLevel === 'SAFE');
  return Math.round((safeLeads.length / leadsWithPhones.length) * 100);
}

export function getRiskLevelColor(riskLevel: TCPARiskLevel): string {
  switch (riskLevel) {
    case 'SAFE': return '#52c41a';
    case 'MODERATE': return '#faad14';
    case 'DANGEROUS': return '#fa8c16';
    case 'DNC_DATABASE': return '#ff4d4f';
    default: return '#8c8c8c';
  }
}
