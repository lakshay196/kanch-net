/**
 * Fake money math for Person C.
 * Pay only accepted pieces. Declared / collected alone never earn rupees.
 */

export type SettlementRates = {
  artisanUnitPriceInr: number;
  coopFeePercent: number;
};

export type SettlementLine = {
  batchId: string;
  acceptedQty: number;
  grossInr: number;
  coopFeeInr: number;
  netInr: number;
  simulated: true;
};

export function settlementForAccepted(
  batchId: string,
  acceptedQty: number | null | undefined,
  rates: SettlementRates,
): SettlementLine | null {
  const qty = acceptedQty ?? 0;
  if (qty <= 0) return null;
  const grossInr = qty * rates.artisanUnitPriceInr;
  const coopFeeInr = Math.round((grossInr * rates.coopFeePercent) / 100);
  const netInr = grossInr - coopFeeInr;
  return {
    batchId,
    acceptedQty: qty,
    grossInr,
    coopFeeInr,
    netInr,
    simulated: true,
  };
}

export function settlementTable(
  piles: Array<{ batchId: string; acceptedQty: number | null }>,
  rates: SettlementRates,
): SettlementLine[] {
  return piles
    .map((pile) => settlementForAccepted(pile.batchId, pile.acceptedQty, rates))
    .filter((line): line is SettlementLine => line !== null);
}
