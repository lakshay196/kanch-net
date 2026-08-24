"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

const STORAGE_KEY = "kanch-person-c-batches";

type BatchRecord = {
  batchId: string;
  householdId: string;
  locality: string;
  declaredQty: number;
  collectedQty: number | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  damagedQty: number | null;
  status: string;
  rejectionReason: string | null;
};

export default function MoneyPage() {
  const order = starter.order;
  const unitRate = order.artisanUnitPriceInr || 8; // ₹8 per accepted piece
  const feePercent = order.coopFeePercent || 5; // 5% fee

  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "settled_only">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedMap: Record<string, Partial<BatchRecord>> = saved ? JSON.parse(saved) : {};

      const initialBatches: BatchRecord[] = starter.piles.map((pile) => {
        const override = savedMap[pile.batchId] || {};
        return {
          batchId: pile.batchId,
          householdId: pile.householdId,
          locality: pile.locality,
          declaredQty: pile.declaredQty,
          collectedQty:
            override.collectedQty !== undefined ? override.collectedQty : pile.collectedQty,
          acceptedQty:
            override.acceptedQty !== undefined ? override.acceptedQty : pile.acceptedQty,
          rejectedQty:
            override.rejectedQty !== undefined ? override.rejectedQty : pile.rejectedQty,
          damagedQty:
            override.damagedQty !== undefined ? override.damagedQty : pile.damagedQty,
          status: override.status !== undefined ? override.status : pile.status,
          rejectionReason:
            override.rejectionReason !== undefined
              ? override.rejectionReason
              : pile.rejectionReason,
        };
      });

      // Include custom batches added via localStorage
      Object.keys(savedMap).forEach((id) => {
        if (!initialBatches.some((b) => b.batchId === id)) {
          const item = savedMap[id];
          initialBatches.unshift({
            batchId: id,
            householdId: item.householdId || "Custom",
            locality: item.locality || "Local",
            declaredQty: item.declaredQty || (item.collectedQty ?? 0),
            collectedQty: item.collectedQty ?? null,
            acceptedQty: item.acceptedQty ?? null,
            rejectedQty: item.rejectedQty ?? null,
            damagedQty: item.damagedQty ?? null,
            status: item.status || "collected",
            rejectionReason: item.rejectionReason ?? null,
          });
        }
      });

      setBatches(initialBatches);
    } catch {
      // Fallback
      setBatches(starter.piles);
    }
  }, []);

  // Filtered rows
  const displayBatches =
    filterMode === "settled_only"
      ? batches.filter((b) => (b.acceptedQty ?? 0) > 0)
      : batches;

  // Calculate totals strictly from ACCEPTED quantities
  const totalAcceptedPieces = displayBatches.reduce(
    (acc, b) => acc + (b.acceptedQty ?? 0),
    0
  );
  const totalGross = totalAcceptedPieces * unitRate;
  const totalFee = (totalGross * feePercent) / 100;
  const totalPayout = totalGross - totalFee;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(val);
  };

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-4xl px-4 py-6">
            {/* Exact Required Banner */}
            <div className="rounded-2xl bg-[#8b1e14] px-4 py-3 text-center text-sm sm:text-base font-bold tracking-wider text-white shadow-md">
              SIMULATED — NOT REAL MONEY
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-3xl font-bold text-[#2a1810]">Settlement & Payout Simulator</h1>
                <p className="mt-1 text-sm text-[#5c4638]">
                  Person C Demo: Strict calculation based solely on inspected & accepted quantities.
                </p>
              </div>
              <Link
                href="/pickup"
                className="inline-flex items-center text-sm font-semibold text-[#8b1e14] underline hover:text-[#72180f]"
              >
                ← Back to pickup
              </Link>
            </div>

            <div className="mt-4">
              <OwnerNote who="Person C" folder="app/money" />
            </div>

            {/* Core Rules & Formula Summary Card */}
            <div className="mt-6 rounded-2xl border border-[#ead9c4] bg-[#fffaf3] p-5 shadow-sm">
              <h2 className="text-base font-bold text-[#2a1810]">Settlement Rules</h2>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm">
                <div className="rounded-xl border border-[#ead9c4] bg-white p-3">
                  <span className="text-[#7d6756] block">Family Rate:</span>
                  <strong className="text-base text-[#2a1810]">
                    ₹{unitRate} / accepted piece
                  </strong>
                </div>
                <div className="rounded-xl border border-[#ead9c4] bg-white p-3">
                  <span className="text-[#7d6756] block">Cooperative Fee:</span>
                  <strong className="text-base text-[#2a1810]">
                    {feePercent}% of Gross
                  </strong>
                </div>
                <div className="rounded-xl border border-[#ead9c4] bg-white p-3">
                  <span className="text-[#7d6756] block">Unaccepted Pieces:</span>
                  <strong className="text-base text-[#8b1e14]">
                    ₹0 Payout (Rej / Dam)
                  </strong>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#f6efe4] p-3 text-xs text-[#5c4638] space-y-1">
                <p>
                  <strong>Formula:</strong> <code>Gross = Accepted Qty × ₹{unitRate}</code> |{" "}
                  <code>5% Fee = Gross × 0.05</code> |{" "}
                  <code>Family Gets = Gross - Fee</code>
                </p>
                <p className="text-[#8b1e14]">
                  ⚠️ Money is calculated <strong>ONLY</strong> from Accepted quantity. Never from declared, collected, rejected, or damaged pieces.
                </p>
                <p className="italic text-stone-600">
                  Booking amount is a reservation note only. It is not used for family payout.
                </p>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="mt-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#2a1810]">Batch Settlement Table</h2>
              <div className="flex items-center gap-1 rounded-xl bg-white border border-[#ead9c4] p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterMode("all")}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    filterMode === "all"
                      ? "bg-[#8b1e14] text-white"
                      : "text-[#5c4638] hover:bg-[#f6efe4]"
                  }`}
                >
                  All Batches ({batches.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode("settled_only")}
                  className={`rounded-lg px-3 py-1 font-medium transition-colors ${
                    filterMode === "settled_only"
                      ? "bg-[#8b1e14] text-white"
                      : "text-[#5c4638] hover:bg-[#f6efe4]"
                  }`}
                >
                  With Accepted Piles ({batches.filter((b) => (b.acceptedQty ?? 0) > 0).length})
                </button>
              </div>
            </div>

            {/* Money Table */}
            <div className="mt-3 overflow-hidden rounded-2xl border border-[#ead9c4] bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-[#ead9c4] bg-[#fffaf3] text-xs font-bold uppercase tracking-wider text-[#5c4638]">
                    <tr>
                      <th className="px-4 py-3">Batch</th>
                      <th className="px-3 py-3">Household / Locality</th>
                      <th className="px-3 py-3 text-right">Accepted Qty</th>
                      <th className="px-3 py-3 text-right">Rate</th>
                      <th className="px-3 py-3 text-right">Gross</th>
                      <th className="px-3 py-3 text-right">5% Fee</th>
                      <th className="px-4 py-3 text-right text-[#8b1e14]">Family Gets</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f3e7d8]">
                    {displayBatches.map((pile) => {
                      const accepted = pile.acceptedQty ?? 0;
                      const gross = accepted * unitRate;
                      const fee = (gross * feePercent) / 100;
                      const familyGets = gross - fee;
                      const hasAccepted = accepted > 0;

                      return (
                        <tr
                          key={pile.batchId}
                          className={`hover:bg-[#fffdfa] transition-colors ${
                            hasAccepted ? "bg-white" : "bg-[#faf7f2]/50 text-stone-400"
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-[#2a1810]">
                            {pile.batchId}
                            {pile.batchId === "B-011" || pile.batchId === "B-016" ? (
                              <span className="ml-1.5 inline-block rounded bg-amber-100 px-1.5 py-0.2 text-[10px] font-sans font-semibold text-amber-800">
                                Starter demo
                              </span>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-xs text-[#5c4638]">
                            {pile.householdId} · {pile.locality}
                          </td>
                          <td className="px-3 py-3 text-right font-semibold">
                            {hasAccepted ? (
                              <span className="text-green-700">{accepted}</span>
                            ) : (
                              <span className="text-stone-400">0</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-[#7d6756]">
                            ₹{unitRate}
                          </td>
                          <td className="px-3 py-3 text-right font-medium text-[#2a1810]">
                            {formatCurrency(gross)}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-amber-900">
                            - {formatCurrency(fee)}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-[#8b1e14]">
                            {formatCurrency(familyGets)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Totals Footer */}
                  <tfoot className="border-t-2 border-[#d9c5b2] bg-[#fdf8f0] font-bold text-[#2a1810]">
                    <tr>
                      <td colSpan={2} className="px-4 py-4 text-sm uppercase tracking-wider">
                        Total Payout Summary
                      </td>
                      <td className="px-3 py-4 text-right text-base text-green-800">
                        {totalAcceptedPieces} pcs
                      </td>
                      <td className="px-3 py-4 text-right text-xs text-[#7d6756]">—</td>
                      <td className="px-3 py-4 text-right text-base">
                        {formatCurrency(totalGross)}
                      </td>
                      <td className="px-3 py-4 text-right text-sm text-amber-900">
                        - {formatCurrency(totalFee)}
                      </td>
                      <td className="px-4 py-4 text-right text-lg text-[#8b1e14]">
                        {formatCurrency(totalPayout)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-2xl border border-[#ead9c4] bg-white p-4 shadow-xs">
                <span className="text-xs text-[#7d6756] block">Total Accepted Pieces</span>
                <span className="mt-1 text-2xl font-bold text-green-800">
                  {totalAcceptedPieces.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="rounded-2xl border border-[#ead9c4] bg-white p-4 shadow-xs">
                <span className="text-xs text-[#7d6756] block">Total Gross Amount</span>
                <span className="mt-1 text-2xl font-bold text-[#2a1810]">
                  {formatCurrency(totalGross)}
                </span>
              </div>

              <div className="rounded-2xl border border-[#ead9c4] bg-white p-4 shadow-xs">
                <span className="text-xs text-[#7d6756] block">Total 5% Fee</span>
                <span className="mt-1 text-2xl font-bold text-amber-900">
                  {formatCurrency(totalFee)}
                </span>
              </div>

              <div className="rounded-2xl border border-[#ead9c4] bg-[#fffaf3] p-4 shadow-xs">
                <span className="text-xs font-semibold text-[#8b1e14] block">Total Family Payout</span>
                <span className="mt-1 text-2xl font-bold text-[#8b1e14]">
                  {formatCurrency(totalPayout)}
                </span>
              </div>
            </div>

            {/* Reservation Note & Navigation */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#ead9c4] pt-4 text-xs text-[#5c4638]">
              <p>
                📌 <em>Booking amount is a reservation note only. It is not used for family payout.</em>
              </p>
              <Link href="/pickup" className="font-semibold text-[#8b1e14] underline hover:text-[#72180f]">
                Back to pickup
              </Link>
            </div>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
