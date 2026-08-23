"use client";

import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

export default function MatchingPage() {
  const order = starter.order;

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-3xl px-4 py-6">
            <h1 className="text-3xl font-bold">Matching</h1>
            <p className="mt-1 text-[#5c4638]">Does this pile fit the buyer order?</p>
            <div className="mt-4">
              <OwnerNote who="Person B" folder="app/matching" />
            </div>
            <section className="mt-6 rounded-3xl bg-white p-5">
              <p className="text-sm font-semibold text-[#8b1e14]">ORDER {order.orderId}</p>
              <h2 className="mt-1 text-2xl font-bold">{order.productName}</h2>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <li>Size: {order.size}</li>
                <li>Colour: {order.colourName}</li>
                <li>Look: {order.finishName}</li>
                <li>Grade: {order.minGrade} or better</li>
                <li>Needed: {order.quantityNeeded} pieces</li>
                <li>Packing: {order.packaging}</li>
              </ul>
            </section>
            <p className="mt-6 text-sm text-[#5c4638]">
              Person B: add an IN list and an OUT list. OUT must show a simple reason.
              Example: B-003 is blue, buyer wants red. Do not use AI guessing. Simple yes/no rules.
              Starter piles are in data/starter-list.json.
            </p>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
