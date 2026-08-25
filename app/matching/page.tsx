"use client";

import { useEffect, useMemo, useState } from "react";
import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import { colourWords, familyName } from "@/lib/labels";
import { defaultLang, readLang, saveLang, type UiLang } from "@/lib/lang";
import { matchPileToOrder, type OrderMatchFields } from "@/lib/match";
import { kmFromHub } from "@/lib/places";
import { loadPiles } from "@/lib/store";
import type { Pile } from "@/lib/types";

const order = starter.order;

const ORDER_FIELDS: OrderMatchFields = {
  productFamily: order.productFamily,
  size: order.size,
  colourFamily: order.colourFamily,
  colourName: order.colourName,
  finish: order.finish,
  finishName: order.finishName,
  minGrade: order.minGrade,
};

function lookWords(finish: string, lang: UiLang) {
  if (finish === "plain_glossy") return lang === "hi" ? "चमकदार" : "shiny";
  if (finish === "matte") return lang === "hi" ? "मैट" : "matte";
  return finish.replace(/_/g, " ");
}

function whyOut(pile: Pile, want: OrderMatchFields, lang: UiLang): string {
  const hi = lang === "hi";
  if (pile.productFamily !== want.productFamily) {
    return hi ? "यह चूड़ी नहीं है" : "Not glass bangles";
  }
  if (pile.size !== want.size) {
    return hi
      ? `साइज़ ${pile.size} है, खरीदार ${want.size} चाहता है`
      : `Size ${pile.size}, buyer wants ${want.size}`;
  }
  if (pile.colourFamily !== want.colourFamily) {
    return hi
      ? `${colourWords(pile.colourFamily, "hi")} है, खरीदार ${colourWords(want.colourFamily, "hi")} चाहता है`
      : `${colourWords(pile.colourFamily, "en")}, buyer wants ${colourWords(want.colourFamily, "en").toLowerCase()}`;
  }
  if (pile.finish !== want.finish) {
    return hi
      ? `${lookWords(pile.finish, "hi")} है, खरीदार ${lookWords(want.finish, "hi")} चाहता है`
      : `${lookWords(pile.finish, "en")}, buyer wants ${lookWords(want.finish, "en")}`;
  }
  return hi
    ? `ग्रेड ${pile.grade} है, खरीदार ${want.minGrade}+ चाहता है`
    : `Grade ${pile.grade}, buyer wants ${want.minGrade}+`;
}

function outSortRank(pile: Pile, want: OrderMatchFields) {
  if (pile.colourFamily !== want.colourFamily) return 0;
  if (pile.size !== want.size) return 1;
  if (pile.finish !== want.finish) return 2;
  if (pile.productFamily !== want.productFamily) return 3;
  return 4;
}

function ColourDot({ family }: { family: string }) {
  return (
    <span
      className={`kn-dot ${family === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
      aria-hidden
    />
  );
}

function LangBar({ lang, onChange }: { lang: UiLang; onChange: (lang: UiLang) => void }) {
  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={() => onChange("hi")}
        className={`kn-chip flex-1 text-base ${lang === "hi" ? "is-on" : ""}`}
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`kn-chip flex-1 text-base ${lang === "en" ? "is-on" : ""}`}
      >
        English
      </button>
    </div>
  );
}

export default function MatchingPage() {
  const [lang, setLang] = useState<UiLang>(defaultLang("coordinator"));
  const [piles, setPiles] = useState<Pile[] | null>(null);
  const hi = lang === "hi";

  useEffect(() => {
    setLang(readLang("coordinator"));
    function refresh() {
      setPiles(loadPiles());
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const { keep, cannot, remaining } = useMemo(() => {
    const list = piles ?? [];
    const keep: Pile[] = [];
    const cannot: Array<{ pile: Pile; reason: string }> = [];
    for (const pile of list) {
      const result = matchPileToOrder(pile, ORDER_FIELDS);
      if (result.ok) keep.push(pile);
      else cannot.push({ pile, reason: whyOut(pile, ORDER_FIELDS, lang) });
    }
    keep.sort((a, b) => kmFromHub(a.locality) - kmFromHub(b.locality));
    cannot.sort(
      (a, b) => outSortRank(a.pile, ORDER_FIELDS) - outSortRank(b.pile, ORDER_FIELDS),
    );
    const keptQty = keep.reduce((sum, pile) => sum + pile.declaredQty, 0);
    return {
      keep,
      cannot,
      remaining: Math.max(0, order.quantityNeeded - keptQty),
    };
  }, [piles, lang]);

  function changeLang(next: UiLang) {
    saveLang("coordinator", next);
    setLang(next);
  }

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() =>
          piles === null ? (
            <p className="p-6 text-[#5c4638]">…</p>
          ) : (
            <main className="kn-shell mx-auto max-w-md px-5 pb-16 pt-8">
              <h1 className="text-3xl font-extrabold leading-tight">
                {hi ? "मैचिंग" : "Matching"}
              </h1>
              <LangBar lang={lang} onChange={changeLang} />

              <section className="mt-8">
                <p className="text-sm font-bold text-[#5c4638]">
                  {hi ? "खरीदार चाहता है" : "Buyer wants"}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <span
                    className={`kn-dot ${order.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                    aria-hidden
                  />
                  <p className="text-xl font-extrabold leading-snug">
                    {order.quantityNeeded.toLocaleString("en-IN")}{" "}
                    {colourWords(order.colourFamily, lang).toLowerCase()} · {order.size}
                  </p>
                </div>
              </section>

              <section className="mt-8">
                <p className="text-sm font-bold text-[#5c4638]">
                  {hi ? "अभी चाहिए" : "Still need"}
                </p>
                <p className="mt-1 text-4xl font-extrabold tracking-tight text-[#8b1e14]">
                  {remaining.toLocaleString("en-IN")}
                </p>
                <p className="mt-1 text-sm text-[#5c4638]">
                  {remaining === 0
                    ? hi
                      ? "पूरा हो गया"
                      : "Lot is full"
                    : hi
                      ? "टुकड़े और चाहिए"
                      : "pieces short"}
                </p>
              </section>

              <section className="mt-10">
                <h2 className="text-xl font-extrabold">
                  {hi ? "रखें" : "Keep"}
                </h2>
                <p className="mt-1 text-sm text-[#5c4638]">
                  {hi ? "मिलती हुई लाल" : "Matching red"}
                </p>
                <ul className="mt-4 space-y-3">
                  {keep.length === 0 ? (
                    <li className="text-base text-[#5c4638]">
                      {hi ? "अभी कोई नहीं" : "None yet"}
                    </li>
                  ) : (
                    keep.map((pile) => (
                      <li key={pile.batchId} className="kn-row">
                        <ColourDot family={pile.colourFamily} />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            {colourWords(pile.colourFamily, lang)} ·{" "}
                            {pile.declaredQty.toLocaleString("en-IN")}
                          </p>
                          <p className="text-sm text-[#5c4638]">
                            {familyName(pile.householdId, lang)} · {pile.locality}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="mt-10">
                <h2 className="text-xl font-extrabold">
                  {hi ? "नहीं ले सकते" : "Cannot take"}
                </h2>
                <p className="mt-1 text-sm text-[#5c4638]">
                  {hi ? "नीली वगैरह" : "Blue and the rest"}
                </p>
                <ul className="mt-4 space-y-3">
                  {cannot.length === 0 ? (
                    <li className="text-base text-[#5c4638]">
                      {hi ? "सब चल सकता है" : "Everything can join"}
                    </li>
                  ) : (
                    cannot.map(({ pile, reason }) => (
                      <li key={pile.batchId} className="kn-row">
                        <ColourDot family={pile.colourFamily} />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">
                            {colourWords(pile.colourFamily, lang)} ·{" "}
                            {pile.declaredQty.toLocaleString("en-IN")}
                          </p>
                          <p className="mt-0.5 text-sm leading-snug text-[#8b1e14]">
                            {reason}
                          </p>
                          <p className="text-sm text-[#5c4638]">
                            {familyName(pile.householdId, lang)} · {pile.locality}
                          </p>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            </main>
          )
        }
      </NeedLogin>
    </>
  );
}
