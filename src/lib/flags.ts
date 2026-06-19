/**
 * Flag image utilities.
 *
 * Priority order:
 *  1. /images/flags/{code}.png  (local file the user drops in)
 *  2. https://flagcdn.com/48x36/{code}.png  (free CDN fallback)
 *
 * `code` is the ISO 3166-1 alpha-2 two-letter country code (lowercase).
 *
 * Usage:
 *   import { flagUrl, teamCodeToFlag } from '@/lib/flags'
 *   <img src={flagUrl('mx')} alt="Mexico" />
 */

/** Map from 3-letter team codes (stored in DB) → 2-letter ISO codes */
export const CODE3_TO_ISO2: Record<string, string> = {
  // Group A
  MEX: 'mx', ZAF: 'za', KOR: 'kr', CZE: 'cz',
  // Group B
  CAN: 'ca', BIH: 'ba', QAT: 'qa', SUI: 'ch',
  // Group C
  HTI: 'ht', SCO: 'gb-sct', BRA: 'br', MAR: 'ma',
  // Group D
  USA: 'us', PRY: 'py', AUS: 'au', TUR: 'tr',
  // Group E
  GER: 'de', CUW: 'cw', CIV: 'ci', ECU: 'ec',
  // Group F
  NED: 'nl', JPN: 'jp', SWE: 'se', TUN: 'tn',
  // Group G
  IRN: 'ir', NZL: 'nz', BEL: 'be', EGY: 'eg',
  // Group H
  KSA: 'sa', URY: 'uy', ESP: 'es', CPV: 'cv',
  // Group I
  FRA: 'fr', SEN: 'sn', IRQ: 'iq', NOR: 'no',
  // Group J
  ARG: 'ar', ALG: 'dz', AUT: 'at', JOR: 'jo',
  // Group K
  POR: 'pt', COD: 'cd', UZB: 'uz', COL: 'co',
  // Group L
  GHA: 'gh', PAN: 'pa', ENG: 'gb-eng', CRO: 'hr',

  // Extra aliases
  GBR: 'gb', UK: 'gb', SCT: 'gb-sct',
}

/** Map from common team names → 2-letter ISO codes */
export const NAME_TO_ISO2: Record<string, string> = {
  'mexico': 'mx', 'south africa': 'za', 'south korea': 'kr', 'czechia': 'cz',
  'canada': 'ca', 'bosnia-herzegovina': 'ba', 'bosnia and herzegovina': 'ba',
  'qatar': 'qa', 'switzerland': 'ch',
  'haiti': 'ht', 'scotland': 'gb-sct', 'brazil': 'br', 'morocco': 'ma',
  'united states': 'us', 'usa': 'us', 'paraguay': 'py', 'australia': 'au',
  'türkiye': 'tr', 'turkiye': 'tr', 'turkey': 'tr',
  'germany': 'de', 'curaçao': 'cw', 'curacao': 'cw', 'ivory coast': 'ci',
  "côte d'ivoire": 'ci', 'ecuador': 'ec',
  'netherlands': 'nl', 'japan': 'jp', 'sweden': 'se', 'tunisia': 'tn',
  'iran': 'ir', 'new zealand': 'nz', 'belgium': 'be', 'egypt': 'eg',
  'saudi arabia': 'sa', 'uruguay': 'uy', 'spain': 'es', 'cabo verde': 'cv',
  'cape verde': 'cv',
  'france': 'fr', 'senegal': 'sn', 'iraq': 'iq', 'norway': 'no',
  'argentina': 'ar', 'algeria': 'dz', 'austria': 'at', 'jordan': 'jo',
  'portugal': 'pt', 'dr congo': 'cd', 'congo dr': 'cd', 'uzbekistan': 'uz',
  'colombia': 'co',
  'ghana': 'gh', 'panama': 'pa', 'england': 'gb-eng', 'croatia': 'hr',
}

/**
 * Get flag image URL from a 2-letter ISO code.
 * Uses local file first, falls back to flagcdn.com.
 */
export function flagUrl(iso2: string): string {
  const code = iso2.toLowerCase()
  return `/images/flags/${code}.png`
}

/** Get flag URL from a 3-letter DB code */
export function flagFromCode(code3: string): string {
  const iso2 = CODE3_TO_ISO2[code3.toUpperCase()] ?? code3.toLowerCase().slice(0, 2)
  return flagUrl(iso2)
}

/** Get flag URL from a team name */
export function flagFromName(name: string): string {
  const iso2 = NAME_TO_ISO2[name.toLowerCase()]
  if (iso2) return flagUrl(iso2)
  // Fallback: try first 2 chars of name
  return flagUrl(name.toLowerCase().slice(0, 2))
}

/** Get CDN fallback URL (flagcdn.com) for a given iso2 code */
export function flagCdnUrl(iso2: string, size: '20x15' | '24x18' | '40x30' | '48x36' = '48x36'): string {
  return `https://flagcdn.com/${size}/${iso2.toLowerCase()}.png`
}

/**
 * Convert a 3-letter DB team code to an ISO 3166-1 alpha-2 code.
 * Use this instead of re-implementing the lookup in every page.
 */
export function toIso2(code3: string): string {
  return CODE3_TO_ISO2[code3?.toUpperCase()] ?? code3?.toLowerCase()?.slice(0, 2) ?? ''
}

/** FlagImage component props helper — returns src + onError fallback src */
export function flagSources(iso2: string) {
  return {
    src: flagUrl(iso2),
    fallback: flagCdnUrl(iso2),
  }
}
