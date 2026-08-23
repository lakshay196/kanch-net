"use client";

import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

export default function PickupPage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-lg px-4 py-6">
            <h1 className="text-3xl font-bold">Pickup + quality</h1>
            <p className="mt-1 text-[#5c4638]">Type a pile name like B-001. Camera is extra.</p>
            <div className="mt-4">
              <OwnerNote who="Person C" folder="app/pickup" />
            </div>
            <p className="mt-4 text-sm text-[#5c4638]">
              Build: collected quantity → then accepted / rejected / damaged with a reason.
              Fake money is a separate page: /money
            </p>
            <h2 className="mt-6 text-xl font-semibold">Starter piles</h2>
            <ul className="mt-3 space-y-2">
              {starter.piles.map((pile) => (
                <li key={pile.batchId} className="rounded-2xl bg-white px-4 py-3 text-sm">
                  <span className="font-semibold">{pile.batchId}</span> · {pile.status} ·{" "}
                  {pile.declaredQty} declared
                </li>
              ))}
            </ul>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
