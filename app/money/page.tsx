"use client";

import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

export default function MoneyPage() {
  const order = starter.order;

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-3xl px-4 py-6">
            <div className="rounded-2xl bg-[#8b1e14] px-4 py-3 text-center text-white">
              SIMULATED — NOT REAL MONEY
            </div>
            <h1 className="mt-6 text-3xl font-bold">Fake money page</h1>
            <div className="mt-4">
              <OwnerNote who="Person C" folder="app/money" />
            </div>
            <p className="mt-4 text-sm text-[#5c4638]">
              Pay only accepted pieces. {order.artisanUnitPriceInr} rupees each, then{" "}
              {order.coopFeePercent}% group fee. Rejected pieces = 0. Never use the old full
              number. {order.bookingPercent}% booking is only a reservation note. It does not
              pay every family.
            </p>
            <p className="mt-3 text-sm text-[#5c4638]">
              Person C: put a table here. Piles B-011 and B-016 already have accepted numbers
              so you can demo even before pickup is finished.
            </p>
            <p className="mt-6">
              <a className="text-[#8b1e14] underline" href="/pickup">
                Back to pickup
              </a>
            </p>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
