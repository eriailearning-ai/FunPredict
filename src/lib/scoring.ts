/**
 * FIFAFun Points system:
 *  5 pts — exact score  (3 outcome + 2 exact bonus)
 *  3 pts — correct outcome only (win/draw/loss), wrong score
 *  1 pt  — per correct team's goal count when outcome wrong (max 2)
 *  2 pts — scorer prediction correct (+2 on top of match points)
 *  ×2    — joker multiplier (applied on top of everything)
 *
 *  Max per match without joker: 7 pts  (exact 5 + scorer 2)
 *  Max per match with joker:   12 pts  (exact 5×2 + scorer 2)
 */
export function calcPoints(
  predHome: number, predAway: number,
  realHome: number, realAway: number,
  joker = false,
  scorerCorrect = false,
): number {
  let pts = 0

  if (predHome === realHome && predAway === realAway) {
    // Exact score
    pts = 5
  } else {
    const predResult = Math.sign(predHome - predAway)
    const realResult = Math.sign(realHome - realAway)

    if (predResult === realResult) {
      // Correct outcome, wrong scoreline
      pts = 3
    } else {
      // Wrong outcome — partial credit per team goal
      if (predHome === realHome) pts += 1
      if (predAway === realAway) pts += 1
    }
  }

  // Joker doubles match score points only
  const matchPts = joker ? pts * 2 : pts

  // Scorer bonus is always flat +2 — never doubled by joker
  const scorerPts = scorerCorrect ? 2 : 0

  return matchPts + scorerPts
}
