import starter from "@/data/starter-list.json";
import { settlementForAccepted } from "@/lib/settlement";
import {
  loadDemands,
  loadPilesWithQc,
  loadPool,
  loadThreads,
} from "@/lib/store";

export function moneyRates() {
  const order = starter.order;
  return {
    buyer: Number(order.buyerUnitPriceInr),
    artisan: Number(order.artisanUnitPriceInr),
    coop: Number(order.coopFeePercent),
    booking: Number(order.bookingPercent),
  };
}

export function formatInr(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export type PoolView = {
  demandId: string;
  qty: number;
  qtyLocked: boolean;
  bookingInr: number;
  remainingInr: number;
  bookingPaid: boolean;
  confirmed: boolean;
  inPoolInr: number;
  releasedInr: number;
  returnedInr: number;
  acceptedQty: number;
  rejectedQty: number;
  awaitingQc: boolean;
  canConfirm: boolean;
  canPayBooking: boolean;
  hasAcceptedDemo: boolean;
  linkedBatchIds: string[];
};

function defaultAmounts(qty: number) {
  const rates = moneyRates();
  const total = qty * rates.buyer;
  const bookingInr = Math.round((total * rates.booking) / 100);
  return { bookingInr, remainingInr: total - bookingInr };
}

export function computePoolView(demandId: string): PoolView | null {
  const demand = loadDemands().find((row) => row.demandId === demandId);
  if (!demand) return null;
  const pool = loadPool(demandId);
  const rates = moneyRates();
  const qty = pool?.qtyLocked ?? demand.quantityNeeded;
  const fallback = defaultAmounts(qty);
  const bookingPaid = pool?.bookingPaid ?? false;
  const confirmed = pool?.confirmed ?? false;
  const bookingInr = bookingPaid && pool ? pool.bookingInr : fallback.bookingInr;
  const remainingInr = bookingPaid && pool ? pool.remainingInr : fallback.remainingInr;

  const linked = loadThreads().filter(
    (thread) => thread.demandId === demandId && thread.demoStatus === "accepted",
  );
  const piles = loadPilesWithQc();
  let acceptedQty = 0;
  let rejectedQty = 0;
  let releasedInr = 0;
  for (const thread of linked) {
    const pile = piles.find((row) => row.batchId === thread.batchId);
    acceptedQty += pile?.acceptedQty ?? 0;
    rejectedQty += pile?.rejectedQty ?? 0;
    const line = settlementForAccepted(thread.batchId, pile?.acceptedQty ?? 0, {
      artisanUnitPriceInr: rates.artisan,
      coopFeePercent: rates.coop,
    });
    if (line) releasedInr += line.netInr;
  }
  const returnedInr = rejectedQty * rates.buyer;
  const inPoolInr = confirmed
    ? Math.max(0, remainingInr - releasedInr - returnedInr)
    : 0;
  const hasAcceptedDemo = linked.length > 0;

  return {
    demandId,
    qty,
    qtyLocked: pool?.qtyLocked != null,
    bookingInr,
    remainingInr,
    bookingPaid,
    confirmed,
    inPoolInr,
    releasedInr,
    returnedInr,
    acceptedQty,
    rejectedQty,
    awaitingQc: confirmed && acceptedQty === 0 && rejectedQty === 0,
    canConfirm: hasAcceptedDemo && bookingPaid && !confirmed,
    canPayBooking: hasAcceptedDemo && !bookingPaid,
    hasAcceptedDemo,
    linkedBatchIds: linked.map((thread) => thread.batchId),
  };
}

export function allPoolViews(): PoolView[] {
  return loadDemands()
    .map((demand) => computePoolView(demand.demandId))
    .filter((row): row is PoolView => row !== null);
}
