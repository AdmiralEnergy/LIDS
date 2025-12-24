// Utility Provider types and data
export interface UtilityProvider {
  id: string;
  name: string;
  ratePerKwh: number;
  avgMonthlyUsage: number;
}

export const NC_UTILITIES: Record<string, UtilityProvider> = {
  duke_progress: {
    id: 'duke_progress',
    name: 'Duke Energy Progress',
    ratePerKwh: 0.11,
    avgMonthlyUsage: 1100,
  },
  duke_carolinas: {
    id: 'duke_carolinas',
    name: 'Duke Energy Carolinas',
    ratePerKwh: 0.115,
    avgMonthlyUsage: 1050,
  },
  dominion: {
    id: 'dominion',
    name: 'Dominion Energy',
    ratePerKwh: 0.12,
    avgMonthlyUsage: 1000,
  },
};

// NC zip prefixes to utility mapping
const ZIP_PREFIX_TO_UTILITY: Record<string, string> = {
  '280': 'duke_carolinas',  // Charlotte
  '281': 'duke_carolinas',
  '282': 'duke_carolinas',
  '283': 'duke_carolinas',
  '276': 'duke_progress',   // Raleigh area
  '277': 'duke_progress',
  '278': 'dominion',        // NE NC
  '279': 'dominion',
  '270': 'duke_progress',   // Winston-Salem
  '271': 'duke_progress',
  '272': 'duke_progress',   // Greensboro
  '273': 'duke_progress',
  '274': 'duke_progress',   // Durham
  '275': 'duke_progress',
};

export function lookupUtility(zip: string): UtilityProvider {
  const prefix = zip.substring(0, 3);
  const utilityId = ZIP_PREFIX_TO_UTILITY[prefix] || 'duke_progress';
  return NC_UTILITIES[utilityId];
}

// NC county average price per sqft
const NC_PRICE_PER_SQFT: Record<string, number> = {
  mecklenburg: 220,  // Charlotte
  wake: 210,         // Raleigh
  durham: 200,
  guilford: 160,     // Greensboro
  forsyth: 155,      // Winston-Salem
  cabarrus: 180,     // Concord
  union: 190,        // Monroe
  default: 180,
};

export function calculateEstimatedValue(sqft: number, county?: string): number {
  const pricePerSqft = county
    ? NC_PRICE_PER_SQFT[county.toLowerCase()] || NC_PRICE_PER_SQFT.default
    : NC_PRICE_PER_SQFT.default;

  return Math.round(sqft * pricePerSqft);
}

export function calculateElectricBill(sqft: number, utility: UtilityProvider): number {
  const kwhPerThousandSqft = 900;
  const monthlyKwh = (sqft / 1000) * kwhPerThousandSqft;
  return Math.round(monthlyKwh * utility.ratePerKwh);
}

export function calculateEstimatedEquity(
  estimatedValue: number,
  mortgageBalance?: number
): number | null {
  if (mortgageBalance == null) return null;
  return estimatedValue - mortgageBalance;
}

// Property data types
export interface PropertyData {
  address: string;
  sqft: number | null;
  yearBuilt: number | null;
  propertyType: string | null;
  estimatedValue: number | null;
  roofType: string | null;
  lotSize: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

// Simulated property data lookup (in real app, would scrape Zillow/Redfin)
export function lookupProperty(address: string, city: string, state: string, zip: string): PropertyData {
  // Generate realistic simulated data based on zip code
  const prefix = zip.substring(0, 3);
  
  // Base values vary by area
  const areaMultipliers: Record<string, number> = {
    '280': 1.2,   // Charlotte (expensive)
    '281': 1.15,
    '276': 1.1,   // Raleigh
    '277': 1.05,
    '274': 1.0,   // Durham
    '272': 0.85,  // Greensboro
    '270': 0.8,   // Winston-Salem
  };
  
  const multiplier = areaMultipliers[prefix] || 1.0;
  
  // Generate random but realistic property data
  const baseSqft = 1800 + Math.floor(Math.random() * 1200);
  const sqft = Math.round(baseSqft * multiplier);
  
  const currentYear = new Date().getFullYear();
  const yearBuilt = currentYear - Math.floor(Math.random() * 50) - 5;
  
  const propertyTypes = ['Single Family', 'Townhouse', 'Condo'];
  const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
  
  const roofTypes = ['Asphalt Shingle', 'Metal', 'Tile', 'Composition'];
  const roofType = roofTypes[Math.floor(Math.random() * roofTypes.length)];
  
  const bedrooms = 3 + Math.floor(Math.random() * 3);
  const bathrooms = 2 + Math.floor(Math.random() * 2);
  
  const lotSizes = ['0.25 acre', '0.35 acre', '0.5 acre', '0.75 acre', '1 acre'];
  const lotSize = lotSizes[Math.floor(Math.random() * lotSizes.length)];

  return {
    address: `${address}, ${city}, ${state} ${zip}`,
    sqft,
    yearBuilt,
    propertyType,
    estimatedValue: null, // Will be calculated
    roofType,
    lotSize,
    bedrooms,
    bathrooms,
  };
}

// Enrichment result types
export interface EnrichmentResult {
  property: PropertyData;
  utility: UtilityProvider;
  calculations: {
    estimatedValue: number;
    monthlyElectricBill: number;
    estimatedEquity: number | null;
  };
  source: 'scraped' | 'calculated';
}

// Main enrichment function
export function enrichLead(
  address: string,
  city: string,
  state: string,
  zip: string,
  county?: string,
  mortgageBalance?: number
): EnrichmentResult {
  // 1. Lookup property data
  const property = lookupProperty(address, city, state, zip);
  
  // 2. Lookup utility provider
  const utility = lookupUtility(zip);
  
  // 3. Calculate estimates
  const sqft = property.sqft || 2000;
  const estimatedValue = calculateEstimatedValue(sqft, county);
  const monthlyElectricBill = calculateElectricBill(sqft, utility);
  const estimatedEquity = calculateEstimatedEquity(estimatedValue, mortgageBalance);
  
  // Update property with calculated value
  property.estimatedValue = estimatedValue;

  return {
    property,
    utility,
    calculations: {
      estimatedValue,
      monthlyElectricBill,
      estimatedEquity,
    },
    source: 'calculated',
  };
}
