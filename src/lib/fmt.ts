/**
 * Shared formatting utilities and constants.
 * Import from here instead of re-implementing in every page.
 */

// ─── Tournament constants ─────────────────────────────────────────────────────

export const GROUPS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const

export const CONFEDERATION: Record<string, string> = {
  // CONCACAF
  MEX: 'CONCACAF', CAN: 'CONCACAF', USA: 'CONCACAF', HTI: 'CONCACAF',
  CUW: 'CONCACAF', PAN: 'CONCACAF',
  // CAF
  ZAF: 'CAF', MAR: 'CAF', CIV: 'CAF', TUN: 'CAF',
  EGY: 'CAF', SEN: 'CAF', ALG: 'CAF', COD: 'CAF', GHA: 'CAF', CPV: 'CAF',
  // AFC
  KOR: 'AFC', QAT: 'AFC', AUS: 'AFC', JPN: 'AFC',
  IRN: 'AFC', KSA: 'AFC', IRQ: 'AFC', UZB: 'AFC', JOR: 'AFC',
  // UEFA
  CZE: 'UEFA', BIH: 'UEFA', SCO: 'UEFA', TUR: 'UEFA',
  GER: 'UEFA', NED: 'UEFA', SWE: 'UEFA', BEL: 'UEFA',
  ESP: 'UEFA', NOR: 'UEFA', ARG: 'CONMEBOL', AUT: 'UEFA',
  POR: 'UEFA', ENG: 'UEFA', CRO: 'UEFA', SUI: 'UEFA',
  // CONMEBOL
  BRA: 'CONMEBOL', PRY: 'CONMEBOL', ECU: 'CONMEBOL', URY: 'CONMEBOL',
  COL: 'CONMEBOL',
  // OFC
  NZL: 'OFC',
}

// ─── Date & time helpers ──────────────────────────────────────────────────────

/** "14:30" */
export function fmtTime(d: string | Date): string {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** "Thu, Jun 19" */
export function fmtDate(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/** "Thursday, 19 June 2026" */
export function fmtDayHeader(d: string | Date): string {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

// ─── Stage label helpers ──────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  R32: 'Round of 32', R16: 'Round of 16',
  QF:  'Quarter-finals', SF: 'Semi-final',
  '3rd': 'Third place', F: 'Final',
}

/** "First stage · Group A" or "Round of 16" */
export function stageName(stage: string, group: string): string {
  if (stage === 'group') return `First stage · Group ${group}`
  return STAGE_LABELS[group] ?? group
}

/** stageName + optional venue suffix */
export function stageLine(stage: string, group: string, venue?: string): string {
  const label = stageName(stage, group)
  return venue ? `${label} · ${venue}` : label
}
