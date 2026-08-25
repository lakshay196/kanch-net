"use client";

import { useEffect, useState } from "react";
import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import PoolCard from "@/components/PoolCard";
import { familyName } from "@/lib/labels";
import { allPoolViews } from "@/lib/pool";
import { loadPilesWithQc, onStoreChange } from "@/lib/store";
import { settlementForAccepted } from "@/lib/settlement";

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

const rates = {
  artisanUnitPriceInr: starter.order.artisanUnitPriceInr || 8,
  coopFeePercent: starter.order.coopFeePercent || 5,
};

function rupees(val: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
}

function batchesFromStore(): BatchRecord[] {
  return loadPilesWithQc().map((pile) => ({
    batchId: pile.batchId,
    householdId: pile.householdId,
    locality: pile.locality,
    declaredQty: pile.declaredQty,
    collectedQty: pile.collectedQty,
    acceptedQty: pile.acceptedQty,
    rejectedQty: pile.rejectedQty,
    damagedQty: pile.damagedQty,
    status: pile.status,
    rejectionReason: pile.rejectionReason,
  }));
}

export default function MoneyPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [pools, setPools] = useState<ReturnType<typeof allPoolViews>>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    function refresh() {
      setPools(allPoolViews());
      setBatches(batchesFromStore());
      setIsLoaded(true);
    }
    refresh();
    return onStoreChange(refresh);
  }, []);

  const paid = batches
    .map((pile) => {
      const line = settlementForAccepted(pile.batchId, pile.acceptedQty, rates);
      if (!line) return null;
      return { pile, line };
    })
    .filter(
      (
        row,
      ): row is {
        pile: BatchRecord;
        line: NonNullable<ReturnType<typeof settlementForAccepted>>;
      } => row !== null,
    );

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() =>
          !isLoaded ? (
            <p className="p-6 text-[#5c4638]">…</p>
          ) : (
            <main className="kn-shell mx-auto max-w-md px-5 py-8 pb-24">
              <h1 className="text-4xl font-extrabold leading-tight">पैसा पूल</h1>
              <p className="mt-1 text-lg text-[#5c4638]">Money pool</p>
              <p className="mt-4 text-lg font-medium">
                Booking. In pool. Release after QC. Returned pieces go back to the buyer.
              </p>
              <p className="text-[#5c4638]">
                बुकिंग। पूल में। QC के बाद रिहाई। अस्वीकार राशि खरीदार को वापस।
              </p>

              {pools.map((view) => (
                <PoolCard key={view.demandId} view={view} lang="en" />
              ))}

              <h2 className="mt-10 text-3xl font-extrabold">रिहाई / Released</h2>
              <p className="mt-1 text-lg text-[#5c4638]">Accepted pieces paid to families</p>

              {paid.length === 0 ? (
                <p className="mt-8 text-lg text-[#5c4638]">
                  अभी भुगतान नहीं / No payout yet. Collect first.
                </p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {paid.map(({ pile, line }) => (
                    <li key={pile.batchId} className="kn-row">
                      <span className="kn-dot kn-dot-red" />
                      <span className="min-w-0 flex-1 font-bold">
                        {familyName(pile.householdId, "en")}
                      </span>
                      <span className="shrink-0 text-sm text-[#5c4638]">
                        {line.acceptedQty} pieces
                      </span>
                      <span className="shrink-0 text-lg font-bold text-[#8b1e14]">
                        {rupees(line.netInr)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </main>
          )
        }
      </NeedLogin>
    </>
  );
}
