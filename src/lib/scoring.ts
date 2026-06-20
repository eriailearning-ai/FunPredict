/**
 * FIFAFun Points system (matches eagledrop.net):
 *  5 pts — exact score
 *  3 pts — correct outcome only (win/draw/loss), wrong score
 *  1 pt  — per correct team's goal count (home or away, 0–2 max)
 *  ×2    — joker multiplier (applied on top)
 */
export function calcPoints(
  predHome: number, predAway: number,
  realHome: number, realAway: number,
  joker = false
): number {
  let pts = 0

  if (predHome === realHome && predAway === realAway) {
    // Exact score
    pts = 5
  } else {
    const predResult = Math.sign(predHome - predAway)
    const realResult = Math.sign(realHome - realAway)

    if (predResult === realResult) {
      // Correct outcome
      pts = 3
    } else {
      // Wrong outcome — check per-team goals
      if (predHome === realHome) pts += 1
      if (predAway === realAway) pts += 1
    }
  }

  return joker ? pts * 2 : pts
}
