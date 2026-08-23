"use client";

import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

export default function PhonePage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {(user) => {
          const mine = starter.piles.filter(
            (pile) => pile.householdId === user.householdId,
          );
          return (
            <main className="mx-auto max-w-lg px-4 py-6">
              <h1 className="text-3xl font-bold">Phone</h1>
              <p className="mt-1 text-[#5c4638]">घर का पेज / Home worker page</p>
              <div className="mt-4">
                <OwnerNote who="Person A" folder="app/phone" />
              </div>
              <p className="mt-4 text-sm text-[#5c4638]">
                Empty house is ready. Add: speak/type → confirm → my piles.
                Easy version: a form is enough. Microphone is extra.
              </p>
              <h2 className="mt-6 text-xl font-semibold">My piles (starter list)</h2>
              <ul className="mt-3 space-y-3">
                {mine.length === 0 ? (
                  <li className="rounded-2xl bg-white p-4">No pile for this login yet.</li>
                ) : (
                  mine.map((pile) => (
                    <li key={pile.batchId} className="rounded-2xl bg-white p-4">
                      <p className="font-semibold">
                        {pile.batchId} · {pile.declaredQty} pieces
                      </p>
                      <p className="text-sm text-[#5c4638]">
                        {pile.spokenTerm} · {pile.status}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </main>
          );
        }}
      </NeedLogin>
    </>
  );
}
