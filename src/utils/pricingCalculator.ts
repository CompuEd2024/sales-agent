// Regional subscription pricing for the Agent Portal.
//   price = base JOD price x LIVE exchange rate (1 JOD = X local), rounded to the country's rounding unit.
// There are NO hardcoded exchange rates and NO fallback prices in this file:
// if the country is unsupported or no live rate exists for its currency, the result is
// { ok: false, reason } and the caller must show a message instead of inventing a price.

export interface CountryPricingConfig {
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  roundingUnit: number; // 1, 10, 50, 100, 500, 1000
  flagEmoji: string;
  region: 'Middle East' | 'Europe' | 'Americas' | 'Africa' | 'Asia & Pacific' | 'Oceania';
}

export interface CalculatedShopTierPricing {
  country_code: string;
  country_name: string;
  currency_code: string;
  currency_symbol: string;
  tier_1_price: number; // bronze
  tier_2_price: number; // silver
  tier_3_price: number; // gold
  tier_4_price: number; // platinum
  rate_used: number; // live rate: 1 JOD = rate_used units of currency_code
}

export type PricingResult =
  | { ok: true; pricing: CalculatedShopTierPricing }
  | { ok: false; reason: 'unsupported_country' | 'rate_unavailable' };

// Live rates keyed by ISO currency code, quoted as 1 JOD = X units (e.g. { AED: 5.18, KWD: 0.43 })
export type JodRates = Record<string, number>;

// Base monthly prices expressed in JOD (reference currency only, never displayed as a default)
export const BASE_JOD_TIERS = {
  tier_1: 20,
  tier_2: 60,
  tier_3: 120,
  tier_4: 200,
} as const;

export const SUPPORTED_COUNTRIES: Record<string, CountryPricingConfig> = {
  // Middle East & Levant (Original Core)
  JO: { country_code: 'JO', country_name: 'Jordan', currency_code: 'JOD', currency_symbol: 'JOD', roundingUnit: 1, flagEmoji: '🇯🇴', region: 'Middle East' },
  SA: { country_code: 'SA', country_name: 'Saudi Arabia', currency_code: 'SAR', currency_symbol: 'SAR', roundingUnit: 1, flagEmoji: '🇸🇦', region: 'Middle East' },
  AE: { country_code: 'AE', country_name: 'United Arab Emirates', currency_code: 'AED', currency_symbol: 'AED', roundingUnit: 1, flagEmoji: '🇦🇪', region: 'Middle East' },
  QA: { country_code: 'QA', country_name: 'Qatar', currency_code: 'QAR', currency_symbol: 'QAR', roundingUnit: 1, flagEmoji: '🇶🇦', region: 'Middle East' },
  KW: { country_code: 'KW', country_name: 'Kuwait', currency_code: 'KWD', currency_symbol: 'KD', roundingUnit: 1, flagEmoji: '🇰🇼', region: 'Middle East' },
  BH: { country_code: 'BH', country_name: 'Bahrain', currency_code: 'BHD', currency_symbol: 'BD', roundingUnit: 1, flagEmoji: '🇧🇭', region: 'Middle East' },
  OM: { country_code: 'OM', country_name: 'Oman', currency_code: 'OMR', currency_symbol: 'RO', roundingUnit: 1, flagEmoji: '🇴🇲', region: 'Middle East' },
  TR: { country_code: 'TR', country_name: 'Turkey', currency_code: 'TRY', currency_symbol: '₺', roundingUnit: 10, flagEmoji: '🇹🇷', region: 'Europe' },

  // North America & Oceania
  US: { country_code: 'US', country_name: 'United States of America', currency_code: 'USD', currency_symbol: '$', roundingUnit: 10, flagEmoji: '🇺🇸', region: 'Americas' },
  CA: { country_code: 'CA', country_name: 'Canada', currency_code: 'CAD', currency_symbol: 'CA$', roundingUnit: 10, flagEmoji: '🇨🇦', region: 'Americas' },
  AU: { country_code: 'AU', country_name: 'Australia', currency_code: 'AUD', currency_symbol: 'A$', roundingUnit: 10, flagEmoji: '🇦🇺', region: 'Oceania' },
  NZ: { country_code: 'NZ', country_name: 'New Zealand', currency_code: 'NZD', currency_symbol: 'NZ$', roundingUnit: 10, flagEmoji: '🇳🇿', region: 'Oceania' },

  // European Countries (Individual All-Europe Coverage)
  GB: { country_code: 'GB', country_name: 'United Kingdom', currency_code: 'GBP', currency_symbol: '£', roundingUnit: 10, flagEmoji: '🇬🇧', region: 'Europe' },
  DE: { country_code: 'DE', country_name: 'Germany', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇩🇪', region: 'Europe' },
  FR: { country_code: 'FR', country_name: 'France', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇫🇷', region: 'Europe' },
  IT: { country_code: 'IT', country_name: 'Italy', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇮🇹', region: 'Europe' },
  ES: { country_code: 'ES', country_name: 'Spain', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇪🇸', region: 'Europe' },
  NL: { country_code: 'NL', country_name: 'Netherlands', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇳🇱', region: 'Europe' },
  CH: { country_code: 'CH', country_name: 'Switzerland', currency_code: 'CHF', currency_symbol: 'CHF', roundingUnit: 10, flagEmoji: '🇨🇭', region: 'Europe' },
  SE: { country_code: 'SE', country_name: 'Sweden', currency_code: 'SEK', currency_symbol: 'kr', roundingUnit: 10, flagEmoji: '🇸🇪', region: 'Europe' },
  NO: { country_code: 'NO', country_name: 'Norway', currency_code: 'NOK', currency_symbol: 'kr', roundingUnit: 10, flagEmoji: '🇳🇴', region: 'Europe' },
  PL: { country_code: 'PL', country_name: 'Poland', currency_code: 'PLN', currency_symbol: 'zł', roundingUnit: 10, flagEmoji: '🇵🇱', region: 'Europe' },
  BE: { country_code: 'BE', country_name: 'Belgium', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇧🇪', region: 'Europe' },
  AT: { country_code: 'AT', country_name: 'Austria', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇦🇹', region: 'Europe' },
  PT: { country_code: 'PT', country_name: 'Portugal', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇵🇹', region: 'Europe' },
  GR: { country_code: 'GR', country_name: 'Greece', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇬🇷', region: 'Europe' },
  IE: { country_code: 'IE', country_name: 'Ireland', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇮🇪', region: 'Europe' },
  DK: { country_code: 'DK', country_name: 'Denmark', currency_code: 'DKK', currency_symbol: 'kr', roundingUnit: 10, flagEmoji: '🇩🇰', region: 'Europe' },
  FI: { country_code: 'FI', country_name: 'Finland', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇫🇮', region: 'Europe' },
  CZ: { country_code: 'CZ', country_name: 'Czech Republic', currency_code: 'CZK', currency_symbol: 'Kč', roundingUnit: 10, flagEmoji: '🇨🇿', region: 'Europe' },
  RO: { country_code: 'RO', country_name: 'Romania', currency_code: 'RON', currency_symbol: 'lei', roundingUnit: 10, flagEmoji: '🇷🇴', region: 'Europe' },
  HU: { country_code: 'HU', country_name: 'Hungary', currency_code: 'HUF', currency_symbol: 'Ft', roundingUnit: 100, flagEmoji: '🇭🇺', region: 'Europe' },
  SK: { country_code: 'SK', country_name: 'Slovakia', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇸🇰', region: 'Europe' },
  HR: { country_code: 'HR', country_name: 'Croatia', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇭🇷', region: 'Europe' },
  BG: { country_code: 'BG', country_name: 'Bulgaria', currency_code: 'BGN', currency_symbol: 'лв', roundingUnit: 10, flagEmoji: '🇧🇬', region: 'Europe' },
  RS: { country_code: 'RS', country_name: 'Serbia', currency_code: 'RSD', currency_symbol: 'din', roundingUnit: 50, flagEmoji: '🇷🇸', region: 'Europe' },
  UA: { country_code: 'UA', country_name: 'Ukraine', currency_code: 'UAH', currency_symbol: '₴', roundingUnit: 50, flagEmoji: '🇺🇦', region: 'Europe' },
  LT: { country_code: 'LT', country_name: 'Lithuania', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇱🇹', region: 'Europe' },
  LV: { country_code: 'LV', country_name: 'Latvia', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇱🇻', region: 'Europe' },
  EE: { country_code: 'EE', country_name: 'Estonia', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇪🇪', region: 'Europe' },
  SI: { country_code: 'SI', country_name: 'Slovenia', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇸🇮', region: 'Europe' },
  LU: { country_code: 'LU', country_name: 'Luxembourg', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇱🇺', region: 'Europe' },
  CY: { country_code: 'CY', country_name: 'Cyprus', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇨🇾', region: 'Europe' },
  MT: { country_code: 'MT', country_name: 'Malta', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇲🇹', region: 'Europe' },
  IS: { country_code: 'IS', country_name: 'Iceland', currency_code: 'ISK', currency_symbol: 'kr', roundingUnit: 50, flagEmoji: '🇮🇸', region: 'Europe' },
  AL: { country_code: 'AL', country_name: 'Albania', currency_code: 'ALL', currency_symbol: 'L', roundingUnit: 50, flagEmoji: '🇦🇱', region: 'Europe' },
  BA: { country_code: 'BA', country_name: 'Bosnia & Herzegovina', currency_code: 'BAM', currency_symbol: 'KM', roundingUnit: 10, flagEmoji: '🇧🇦', region: 'Europe' },
  MK: { country_code: 'MK', country_name: 'North Macedonia', currency_code: 'MKD', currency_symbol: 'ден', roundingUnit: 10, flagEmoji: '🇲🇰', region: 'Europe' },
  ME: { country_code: 'ME', country_name: 'Montenegro', currency_code: 'EUR', currency_symbol: '€', roundingUnit: 10, flagEmoji: '🇲🇪', region: 'Europe' },
  MD: { country_code: 'MD', country_name: 'Moldova', currency_code: 'MDL', currency_symbol: 'L', roundingUnit: 10, flagEmoji: '🇲🇩', region: 'Europe' },

  // South America Countries
  BR: { country_code: 'BR', country_name: 'Brazil', currency_code: 'BRL', currency_symbol: 'R$', roundingUnit: 10, flagEmoji: '🇧🇷', region: 'Americas' },
  AR: { country_code: 'AR', country_name: 'Argentina', currency_code: 'ARS', currency_symbol: '$', roundingUnit: 100, flagEmoji: '🇦🇷', region: 'Americas' },
  CO: { country_code: 'CO', country_name: 'Colombia', currency_code: 'COP', currency_symbol: '$', roundingUnit: 500, flagEmoji: '🇨🇴', region: 'Americas' },
  CL: { country_code: 'CL', country_name: 'Chile', currency_code: 'CLP', currency_symbol: '$', roundingUnit: 100, flagEmoji: '🇨🇱', region: 'Americas' },
  PE: { country_code: 'PE', country_name: 'Peru', currency_code: 'PEN', currency_symbol: 'S/', roundingUnit: 10, flagEmoji: '🇵🇪', region: 'Americas' },
  EC: { country_code: 'EC', country_name: 'Ecuador', currency_code: 'USD', currency_symbol: '$', roundingUnit: 10, flagEmoji: '🇪🇨', region: 'Americas' },
  UY: { country_code: 'UY', country_name: 'Uruguay', currency_code: 'UYU', currency_symbol: '$U', roundingUnit: 50, flagEmoji: '🇺🇾', region: 'Americas' },
  PY: { country_code: 'PY', country_name: 'Paraguay', currency_code: 'PYG', currency_symbol: '₲', roundingUnit: 1000, flagEmoji: '🇵🇾', region: 'Americas' },
  BO: { country_code: 'BO', country_name: 'Bolivia', currency_code: 'BOB', currency_symbol: 'Bs', roundingUnit: 10, flagEmoji: '🇧🇴', region: 'Americas' },
  VE: { country_code: 'VE', country_name: 'Venezuela', currency_code: 'VES', currency_symbol: 'Bs', roundingUnit: 50, flagEmoji: '🇻🇪', region: 'Americas' },

  // African Countries
  EG: { country_code: 'EG', country_name: 'Egypt', currency_code: 'EGP', currency_symbol: 'EGP', roundingUnit: 50, flagEmoji: '🇪🇬', region: 'Africa' },
  ZA: { country_code: 'ZA', country_name: 'South Africa', currency_code: 'ZAR', currency_symbol: 'R', roundingUnit: 10, flagEmoji: '🇿🇦', region: 'Africa' },
  NG: { country_code: 'NG', country_name: 'Nigeria', currency_code: 'NGN', currency_symbol: '₦', roundingUnit: 100, flagEmoji: '🇳🇬', region: 'Africa' },
  KE: { country_code: 'KE', country_name: 'Kenya', currency_code: 'KES', currency_symbol: 'KSh', roundingUnit: 50, flagEmoji: '🇰🇪', region: 'Africa' },
  MA: { country_code: 'MA', country_name: 'Morocco', currency_code: 'MAD', currency_symbol: 'DH', roundingUnit: 10, flagEmoji: '🇲🇦', region: 'Africa' },
  GH: { country_code: 'GH', country_name: 'Ghana', currency_code: 'GHS', currency_symbol: 'GH₵', roundingUnit: 10, flagEmoji: '🇬🇭', region: 'Africa' },
  ET: { country_code: 'ET', country_name: 'Ethiopia', currency_code: 'ETB', currency_symbol: 'Br', roundingUnit: 50, flagEmoji: '🇪🇹', region: 'Africa' },
  TZ: { country_code: 'TZ', country_name: 'Tanzania', currency_code: 'TZS', currency_symbol: 'TSh', roundingUnit: 100, flagEmoji: '🇹🇿', region: 'Africa' },
  DZ: { country_code: 'DZ', country_name: 'Algeria', currency_code: 'DZD', currency_symbol: 'DA', roundingUnit: 50, flagEmoji: '🇩🇿', region: 'Africa' },
  TN: { country_code: 'TN', country_name: 'Tunisia', currency_code: 'TND', currency_symbol: 'DT', roundingUnit: 10, flagEmoji: '🇹🇳', region: 'Africa' },
  UG: { country_code: 'UG', country_name: 'Uganda', currency_code: 'UGX', currency_symbol: 'USh', roundingUnit: 500, flagEmoji: '🇺🇬', region: 'Africa' },
  RW: { country_code: 'RW', country_name: 'Rwanda', currency_code: 'RWF', currency_symbol: 'FRw', roundingUnit: 100, flagEmoji: '🇷🇼', region: 'Africa' },
  SN: { country_code: 'SN', country_name: 'Senegal', currency_code: 'XOF', currency_symbol: 'CFA', roundingUnit: 50, flagEmoji: '🇸🇳', region: 'Africa' },
  CI: { country_code: 'CI', country_name: 'Ivory Coast', currency_code: 'XOF', currency_symbol: 'CFA', roundingUnit: 50, flagEmoji: '🇨🇮', region: 'Africa' },
  CM: { country_code: 'CM', country_name: 'Cameroon', currency_code: 'XAF', currency_symbol: 'FCFA', roundingUnit: 50, flagEmoji: '🇨🇲', region: 'Africa' },
  AO: { country_code: 'AO', country_name: 'Angola', currency_code: 'AOA', currency_symbol: 'Kz', roundingUnit: 100, flagEmoji: '🇦🇴', region: 'Africa' },
  ZM: { country_code: 'ZM', country_name: 'Zambia', currency_code: 'ZMW', currency_symbol: 'K', roundingUnit: 10, flagEmoji: '🇿🇲', region: 'Africa' },
  MU: { country_code: 'MU', country_name: 'Mauritius', currency_code: 'MUR', currency_symbol: '₨', roundingUnit: 50, flagEmoji: '🇲🇺', region: 'Africa' },

  // South Asian Countries & India
  IN: { country_code: 'IN', country_name: 'India', currency_code: 'INR', currency_symbol: '₹', roundingUnit: 50, flagEmoji: '🇮🇳', region: 'Asia & Pacific' },
  PK: { country_code: 'PK', country_name: 'Pakistan', currency_code: 'PKR', currency_symbol: '₨', roundingUnit: 50, flagEmoji: '🇵🇰', region: 'Asia & Pacific' },
  BD: { country_code: 'BD', country_name: 'Bangladesh', currency_code: 'BDT', currency_symbol: '৳', roundingUnit: 50, flagEmoji: '🇧🇩', region: 'Asia & Pacific' },
  LK: { country_code: 'LK', country_name: 'Sri Lanka', currency_code: 'LKR', currency_symbol: 'Rs', roundingUnit: 50, flagEmoji: '🇱🇰', region: 'Asia & Pacific' },
  NP: { country_code: 'NP', country_name: 'Nepal', currency_code: 'NPR', currency_symbol: '₨', roundingUnit: 50, flagEmoji: '🇳🇵', region: 'Asia & Pacific' },
  MV: { country_code: 'MV', country_name: 'Maldives', currency_code: 'MVR', currency_symbol: 'Rf', roundingUnit: 10, flagEmoji: '🇲🇻', region: 'Asia & Pacific' },
  BT: { country_code: 'BT', country_name: 'Bhutan', currency_code: 'BTN', currency_symbol: 'Nu', roundingUnit: 50, flagEmoji: '🇧🇹', region: 'Asia & Pacific' },

  // Russia & China
  RU: { country_code: 'RU', country_name: 'Russia', currency_code: 'RUB', currency_symbol: '₽', roundingUnit: 50, flagEmoji: '🇷🇺', region: 'Europe' },
  CN: { country_code: 'CN', country_name: 'China', currency_code: 'CNY', currency_symbol: '¥', roundingUnit: 10, flagEmoji: '🇨🇳', region: 'Asia & Pacific' },

  // East & Southeast Asia
  JP: { country_code: 'JP', country_name: 'Japan', currency_code: 'JPY', currency_symbol: '¥', roundingUnit: 50, flagEmoji: '🇯🇵', region: 'Asia & Pacific' },
  KR: { country_code: 'KR', country_name: 'South Korea', currency_code: 'KRW', currency_symbol: '₩', roundingUnit: 100, flagEmoji: '🇰🇷', region: 'Asia & Pacific' },
  SG: { country_code: 'SG', country_name: 'Singapore', currency_code: 'SGD', currency_symbol: 'S$', roundingUnit: 10, flagEmoji: '🇸🇬', region: 'Asia & Pacific' },
  MY: { country_code: 'MY', country_name: 'Malaysia', currency_code: 'MYR', currency_symbol: 'RM', roundingUnit: 10, flagEmoji: '🇲🇾', region: 'Asia & Pacific' },
  ID: { country_code: 'ID', country_name: 'Indonesia', currency_code: 'IDR', currency_symbol: 'Rp', roundingUnit: 1000, flagEmoji: '🇮🇩', region: 'Asia & Pacific' },
  TH: { country_code: 'TH', country_name: 'Thailand', currency_code: 'THB', currency_symbol: '฿', roundingUnit: 10, flagEmoji: '🇹🇭', region: 'Asia & Pacific' },
  PH: { country_code: 'PH', country_name: 'Philippines', currency_code: 'PHP', currency_symbol: '₱', roundingUnit: 10, flagEmoji: '🇵🇭', region: 'Asia & Pacific' },
  VN: { country_code: 'VN', country_name: 'Vietnam', currency_code: 'VND', currency_symbol: '₫', roundingUnit: 1000, flagEmoji: '🇻🇳', region: 'Asia & Pacific' },
};

function cleanRound(amount: number, unit: number): number {
  let rounded: number;
  if (unit > 10) {
    rounded = Math.round(amount / unit) * unit;
  } else {
    rounded = Math.round(amount);
  }
  // The last digit (units place) should always be zero in all currencies
  // so 311 becomes 310, 622 becomes 620, and 1036 becomes 1030.
  const zeroLastDigit = Math.floor(rounded / 10) * 10;
  return zeroLastDigit > 0 ? zeroLastDigit : 10;
}

export function calculateShopTierPricing(
  countryCode: string | null | undefined,
  liveRates: JodRates | null | undefined
): PricingResult {
  const code = (countryCode || '').trim().toUpperCase();
  const config = SUPPORTED_COUNTRIES[code];
  if (!config) return { ok: false, reason: 'unsupported_country' };

  const rate = liveRates ? Number(liveRates[config.currency_code]) : NaN;
  if (!Number.isFinite(rate) || rate <= 0) return { ok: false, reason: 'rate_unavailable' };

  return {
    ok: true,
    pricing: {
      country_code: config.country_code,
      country_name: config.country_name,
      currency_code: config.currency_code,
      currency_symbol: config.currency_symbol,
      tier_1_price: cleanRound(BASE_JOD_TIERS.tier_1 * rate, config.roundingUnit),
      tier_2_price: cleanRound(BASE_JOD_TIERS.tier_2 * rate, config.roundingUnit),
      tier_3_price: cleanRound(BASE_JOD_TIERS.tier_3 * rate, config.roundingUnit),
      tier_4_price: cleanRound(BASE_JOD_TIERS.tier_4 * rate, config.roundingUnit),
      rate_used: rate,
    },
  };
}

export function formatRegionalPrice(amount: number, currencySymbol: string): string {
  return `${currencySymbol} ${amount.toLocaleString()}`;
}
