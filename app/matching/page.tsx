"use client";

import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

type Pile = (typeof starter.piles)[number];

type MatchResult = {
  isMatch: boolean;
  reason: string | null;
};

/**
 * Deterministic rule-based matching logic.
 * A pile is IN only when:
 * - product = glass_bangle
 * - colour = ruby_red
 * - size is within 2–6 (i.e. "2-6")
 * - finish = plain_glossy
 * - grade is A or B (Grade B or better)
 */
function evaluatePileMatch(pile: Pile): MatchResult {
  if (pile.productFamily !== "glass_bangle") {
    return {
      isMatch: false,
      reason: `Product ${pile.productFamily} does not match glass_bangle`,
    };
  }
  if (pile.colourFamily !== "ruby_red") {
    const colourDisplay = pile.colourFamily === "blue" ? "blue" : pile.colourFamily;
    return {
      isMatch: false,
      reason: `Colour ${colourDisplay} does not match ruby red`,
    };
  }
  if (pile.size !== "2-6") {
    return {
      isMatch: false,
      reason: `Size ${pile.size} is outside the required range 2–6`,
    };
  }
  if (pile.finish !== "plain_glossy") {
    const finishDisplay = pile.finish === "matte" ? "matte" : pile.finish;
    return {
      isMatch: false,
      reason: `Finish ${finishDisplay} does not match plain glossy`,
    };
  }
  if (pile.grade !== "A" && pile.grade !== "B") {
    return {
      isMatch: false,
      reason: `Grade ${pile.grade} is below the required Grade B`,
    };
  }
  return { isMatch: true, reason: null };
}

export default function MatchingPage() {
  const order = starter.order;
  const targetQuantity = order.quantityNeeded;

  // Process all piles deterministically
  const evaluatedPiles = starter.piles.map((pile) => ({
    pile,
    ...evaluatePileMatch(pile),
  }));

  const inPiles = evaluatedPiles.filter((item) => item.isMatch);
  const outPiles = evaluatedPiles.filter((item) => !item.isMatch);

  // Calculate total quantity of IN piles without double counting
  const totalInQuantity = inPiles.reduce(
    (sum, item) => sum + item.pile.declaredQty,
    0,
  );

  const remainingQuantity = Math.max(0, targetQuantity - totalInQuantity);

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-4xl px-4 py-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-3xl font-bold">Matching Screen</h1>
                <p className="mt-1 text-[#5c4638]">
                  Rule-based pile matching for Buyer Order ORD-001
                </p>
              </div>
            </div>

            <div className="mt-4">
              <OwnerNote who="Person B" folder="app/matching" />
            </div>

            {/* 1. ORDER CARD */}
            <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm border border-[#e5dcd3]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f0e8e0] pb-4">
                <div>
                  <span className="inline-block rounded-full bg-[#8b1e14]/10 px-3 py-1 text-xs font-bold text-[#8b1e14]">
                    ORDER {order.orderId}
                  </span>
                  <h2 className="mt-2 text-2xl font-bold text-[#2d1e18]">
                    10,000 red glass bangles
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#7c6658]">Target Quantity</span>
                  <p className="text-xl font-bold text-[#8b1e14]">
                    {targetQuantity.toLocaleString()} pcs
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl bg-[#faf6f0] p-3">
                  <span className="text-xs text-[#7c6658]">Size</span>
                  <p className="font-semibold text-[#2d1e18]">Size 2–6</p>
                </div>
                <div className="rounded-2xl bg-[#faf6f0] p-3">
                  <span className="text-xs text-[#7c6658]">Colour</span>
                  <p className="font-semibold text-[#2d1e18]">Ruby Red</p>
                </div>
                <div className="rounded-2xl bg-[#faf6f0] p-3">
                  <span className="text-xs text-[#7c6658]">Finish</span>
                  <p className="font-semibold text-[#2d1e18]">Plain glossy</p>
                </div>
                <div className="rounded-2xl bg-[#faf6f0] p-3">
                  <span className="text-xs text-[#7c6658]">Quality Grade</span>
                  <p className="font-semibold text-[#2d1e18]">Grade B or better</p>
                </div>
              </div>
            </section>

            {/* 4. REMAINING QUANTITY */}
            <section className="mt-6 rounded-3xl bg-[#8b1e14] p-6 text-white shadow-md">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-red-100">
                    Order Fulfillment Summary
                  </h3>
                  <p className="mt-1 text-3xl font-extrabold">
                    {remainingQuantity.toLocaleString()} pcs remaining
                  </p>
                  <p className="mt-1 text-sm text-red-100">
                    Calculation: 10,000 (Needed) - {totalInQuantity.toLocaleString()} (IN Piles Total)
                  </p>
                </div>
                <div className="flex gap-4 rounded-2xl bg-white/10 p-4 text-center backdrop-blur-sm">
                  <div>
                    <span className="text-xs text-red-200">IN Piles</span>
                    <p className="text-xl font-bold">{inPiles.length}</p>
                  </div>
                  <div className="border-r border-white/20" />
                  <div>
                    <span className="text-xs text-red-200">Total Matched</span>
                    <p className="text-xl font-bold">{totalInQuantity.toLocaleString()} pcs</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. IN LIST */}
            <section className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#2d1e18]">
                  IN List ({inPiles.length} Piles Satisfying All Rules)
                </h3>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {totalInQuantity.toLocaleString()} pieces matched
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5c4638]">
                These piles match product (glass_bangle), colour (ruby_red), size (2–6), finish (plain_glossy), and grade (A/B).
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {inPiles.map(({ pile }) => (
                  <div
                    key={pile.batchId}
                    className="flex flex-col justify-between rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-base font-bold text-[#2d1e18]">
                          {pile.batchId}
                        </span>
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                          IN MATCH
                        </span>
                      </div>
                      <div className="mt-2 text-2xl font-extrabold text-[#8b1e14]">
                        {pile.declaredQty.toLocaleString()}{" "}
                        <span className="text-sm font-normal text-[#5c4638]">
                          pieces
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-md bg-[#faf6f0] px-2 py-1 text-[#5c4638]">
                          Size: {pile.size}
                        </span>
                        <span className="rounded-md bg-[#faf6f0] px-2 py-1 text-[#5c4638]">
                          Colour: {pile.colourFamily}
                        </span>
                        <span className="rounded-md bg-[#faf6f0] px-2 py-1 text-[#5c4638]">
                          Finish: {pile.finish}
                        </span>
                        <span className="rounded-md bg-emerald-50 px-2 py-1 font-semibold text-emerald-800">
                          Grade {pile.grade}
                        </span>
                      </div>
                    </div>
                    {/* Privacy preserved: Only displaying Household ID and Locality, no phone numbers */}
                    <div className="mt-4 flex items-center justify-between border-t border-[#f5efe8] pt-3 text-xs text-[#7c6658]">
                      <span>{pile.householdId} ({pile.locality})</span>
                      <span className="capitalize">Status: {pile.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. OUT LIST */}
            <section className="mt-10">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#2d1e18]">
                  OUT List ({outPiles.length} Non-Matching Piles)
                </h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
                  {outPiles.length} excluded
                </span>
              </div>
              <p className="mt-1 text-sm text-[#5c4638]">
                Piles that fail one or more mandatory buyer requirements, with human-readable reasons.
              </p>

              <div className="mt-4 space-y-3">
                {outPiles.map(({ pile, reason }) => (
                  <div
                    key={pile.batchId}
                    className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-[#2d1e18]">
                          {pile.batchId}
                        </span>
                        <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800">
                          OUT
                        </span>
                        <span className="text-xs text-[#7c6658]">
                          {pile.declaredQty} pcs · {pile.householdId} ({pile.locality})
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#5c4638]">
                        <span>Size: {pile.size}</span>
                        <span>•</span>
                        <span>Colour: {pile.colourFamily}</span>
                        <span>•</span>
                        <span>Finish: {pile.finish}</span>
                        <span>•</span>
                        <span>Grade: {pile.grade}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-rose-50 px-3.5 py-2 border border-rose-100 text-xs font-semibold text-rose-800">
                      Reason: &quot;{reason}&quot;
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>
        )}
      </NeedLogin>
    </>
  );
}

