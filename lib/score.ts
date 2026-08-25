import { loadPilesWithQc } from "@/lib/store";

/** Seed when this household has no QC yet. Family 1 high; Family 3 lower (blue / rejects). */
const SEED_SCORE: Record<string, number> = {
  "HH-01": 94,
  "HH-02": 88,
  "HH-03": 62,
};

export function reliabilityScore(householdId: string) {
  const piles = loadPilesWithQc().filter((pile) => pile.householdId === householdId);
  let accepted = 0;
  let rejected = 0;
  for (const pile of piles) {
    if (pile.acceptedQty == null && pile.rejectedQty == null) continue;
    accepted += pile.acceptedQty ?? 0;
    rejected += pile.rejectedQty ?? 0;
  }
  const den = accepted + rejected;
  if (den > 0) return Math.round((100 * accepted) / den);
  return SEED_SCORE[householdId] ?? 80;
}
