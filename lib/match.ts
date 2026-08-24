import type { Pile } from "@/lib/types";

/** Buyer lot fields used for yes/no matching. */
export type OrderMatchFields = {
  productFamily: string;
  size: string;
  colourFamily: string;
  colourName: string;
  finish: string;
  finishName: string;
  minGrade: string;
};

export type MatchResult = {
  /** True = pile may join this order (IN). */
  ok: boolean;
  /** Simple human reason when OUT. Null when IN. */
  reason: string | null;
};

const GRADE_RANK: Record<string, number> = {
  A: 3,
  B: 2,
  C: 1,
};

function colourLabel(family: string) {
  if (family === "ruby_red") return "red";
  return family.replace(/_/g, " ");
}

/**
 * Deterministic matching for Person B.
 * No AI. First failing field wins the reason.
 */
export function matchPileToOrder(
  pile: Pile,
  order: OrderMatchFields,
): MatchResult {
  if (pile.productFamily !== order.productFamily) {
    return {
      ok: false,
      reason: `Product does not match. Buyer wants ${order.productFamily}.`,
    };
  }
  if (pile.size !== order.size) {
    return {
      ok: false,
      reason: `Size is ${pile.size}, buyer wants ${order.size}.`,
    };
  }
  if (pile.colourFamily !== order.colourFamily) {
    return {
      ok: false,
      reason: `Colour is ${colourLabel(pile.colourFamily)}, buyer wants ${colourLabel(order.colourFamily)}.`,
    };
  }
  if (pile.finish !== order.finish) {
    return {
      ok: false,
      reason: `Look is ${pile.finish.replace(/_/g, " ")}, buyer wants ${order.finishName}.`,
    };
  }
  const pileGrade = GRADE_RANK[pile.grade] ?? 0;
  const minGrade = GRADE_RANK[order.minGrade] ?? 0;
  if (pileGrade < minGrade) {
    return {
      ok: false,
      reason: `Grade is ${pile.grade}, buyer wants ${order.minGrade} or better.`,
    };
  }
  return { ok: true, reason: null };
}

/** Split starter piles into IN / OUT for ORD-001 style screens. */
export function splitPilesByMatch(
  piles: Pile[],
  order: OrderMatchFields,
): { inn: Array<Pile & { reason: null }>; out: Array<Pile & { reason: string }> } {
  const inn: Array<Pile & { reason: null }> = [];
  const out: Array<Pile & { reason: string }> = [];
  for (const pile of piles) {
    const result = matchPileToOrder(pile, order);
    if (result.ok) {
      inn.push({ ...pile, reason: null });
    } else {
      out.push({ ...pile, reason: result.reason ?? "Does not match." });
    }
  }
  return { inn, out };
}
