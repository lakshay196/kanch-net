"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import ChatPanel from "@/components/ChatPanel";
import NeedLogin from "@/components/NeedLogin";
import { artisanCopy, buyerCopy } from "@/lib/copy";
import { colourWords, familyName } from "@/lib/labels";
import { defaultLang, readLang, type UiLang } from "@/lib/lang";
import {
  artisanChatPile,
  ensureThread,
  loadDemands,
  loadPiles,
  loadThreads,
  onStoreChange,
} from "@/lib/store";
import type { SessionUser } from "@/lib/types";

function ChatHome({ user }: { user: SessionUser }) {
  const roleLang = user.role === "buyer" ? "buyer" : "artisan";
  const [lang, setLang] = useState<UiLang>(defaultLang(roleLang));
  const params = useSearchParams();
  const demandId = params.get("demandId") ?? "";
  const batchId = params.get("batchId") ?? "";
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setLang(readLang(roleLang));
    return onStoreChange(() => setTick((n) => n + 1));
  }, [roleLang]);

  const piles = useMemo(() => loadPiles(), [tick]);
  const demands = useMemo(() => loadDemands(), [tick]);
  const threads = useMemo(() => loadThreads(), [tick]);

  const openId = useMemo(() => {
    if (!demandId || !batchId) return "";
    const pile = piles.find((p) => p.batchId === batchId);
    if (!pile) return "";
    return ensureThread({
      demandId,
      batchId,
      householdId: pile.householdId,
    }).threadId;
  }, [demandId, batchId, piles]);

  const t =
    user.role === "buyer" ? buyerCopy(lang) : artisanCopy(lang === "hi" ? "hi" : "en");
  const hi = lang === "hi";

  if (user.role !== "artisan" && user.role !== "buyer") {
    return <p className="p-6 text-[#5c4638]">Chat is for families and the buyer.</p>;
  }

  if (openId) {
    const pile = piles.find((p) => p.batchId === batchId);
    const demand = demands.find((d) => d.demandId === demandId);
    return (
      <main className="kn-shell mx-auto max-w-md px-5 pb-24 pt-8">
        <h1 className="text-4xl font-extrabold">{hi ? "बात" : "Chat"}</h1>
        <p className="mt-2 text-lg text-[#5c4638]">
          {demand
            ? `${colourWords(demand.colourFamily, lang)} · ${demand.quantityNeeded}`
            : demandId}
          {pile ? ` · ${familyName(pile.householdId, lang)}` : ""}
        </p>
        <ChatPanel threadId={openId} role={user.role} lang={lang} />
      </main>
    );
  }

  const artisanPile =
    user.role === "artisan" ? artisanChatPile(piles, user.householdId || "") : null;

  return (
    <main className="kn-shell mx-auto max-w-md px-5 pb-24 pt-8">
      <h1 className="text-4xl font-extrabold">{hi ? "बात" : "Chat"}</h1>
      <p className="mt-2 text-lg text-[#5c4638]">
        {hi
          ? "डेमो टुकड़ा भेजें, फिर बड़ी ऑर्डर।"
          : "Send a demo piece, then the large order."}
      </p>

      {user.role === "artisan" ? (
        <ul className="mt-8 space-y-4">
          {demands.map((d) => {
            const pile = artisanPile;
            const href = pile
              ? `/chat?demandId=${encodeURIComponent(d.demandId)}&batchId=${encodeURIComponent(pile.batchId)}`
              : "";
            return (
              <li key={d.demandId} className="kn-row">
                <span
                  className={`kn-dot ${d.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold">
                    {colourWords(d.colourFamily, lang)} · {d.quantityNeeded}
                  </p>
                  {href ? (
                    <Link href={href} className="kn-chip mt-3 inline-flex text-[#8b1e14]">
                      {t.chat}
                    </Link>
                  ) : (
                    <p className="mt-2 text-sm text-[#5c4638]">
                      {hi ? "पहले स्टॉक डालें।" : "Post stock first."}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="mt-8 space-y-4">
          {threads.length === 0 ? (
            <li className="text-lg text-[#5c4638]">
              {hi ? "अभी बात नहीं। स्टॉक पर चैट खोलें।" : "No chats yet. Open chat from stock."}
            </li>
          ) : (
            threads.map((th) => {
              const pile = piles.find((p) => p.batchId === th.batchId);
              return (
                <li key={th.threadId} className="kn-row">
                  <span
                    className={`kn-dot ${pile?.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-bold">
                      {pile ? familyName(pile.householdId, lang) : th.batchId}
                    </p>
                    <Link
                      href={`/chat?demandId=${encodeURIComponent(th.demandId)}&batchId=${encodeURIComponent(th.batchId)}`}
                      className="kn-chip mt-3 inline-flex text-[#8b1e14]"
                    >
                      {t.chat}
                    </Link>
                  </div>
                </li>
              );
            })
          )}
        </ul>
      )}
    </main>
  );
}

export default function ChatPage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {(user) => (
          <Suspense fallback={<p className="p-6 text-[#5c4638]">…</p>}>
            <ChatHome user={user} />
          </Suspense>
        )}
      </NeedLogin>
    </>
  );
}
