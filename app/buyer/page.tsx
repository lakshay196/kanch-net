"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import PoolCard from "@/components/PoolCard";
import ScoreBadge from "@/components/ScoreBadge";
import { buyerCopy } from "@/lib/copy";
import { colourWords, familyName, gradeWords, pileTitle } from "@/lib/labels";
import { defaultLang, readLang, saveLang, type UiLang } from "@/lib/lang";
import { matchPileToOrder } from "@/lib/match";
import { kmFromHub, distanceLabel } from "@/lib/places";
import { computePoolView } from "@/lib/pool";
import {
  cancelDemand,
  confirmToPool,
  demandHasAcceptedDemo,
  isSeedDemand,
  isStarterBatch,
  loadDemands,
  loadPiles,
  nextDemandId,
  onStoreChange,
  payBooking,
  saveDemand,
  type Demand,
} from "@/lib/store";
import type { Pile, SessionUser } from "@/lib/types";

type Ranked = { pile: Pile; km: number; reason: string | null };

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

function splitBuyerFeed(inn: Ranked[], out: Ranked[], extraNewestFirst: string[]) {
  const extraRank = new Map(extraNewestFirst.map((id, i) => [id, i]));
  const byNew = (a: Ranked, b: Ranked) =>
    (extraRank.get(a.pile.batchId) ?? 99) - (extraRank.get(b.pile.batchId) ?? 99);
  const extraInn = inn
    .filter((row) => !isStarterBatch(row.pile.batchId))
    .sort(byNew);
  const extraOut = out
    .filter((row) => !isStarterBatch(row.pile.batchId))
    .sort(byNew);
  const seedInn = inn.filter((row) => isStarterBatch(row.pile.batchId));
  const seedOut = out.filter((row) => isStarterBatch(row.pile.batchId));
  const shownInn = [...extraInn, ...seedInn.slice(0, 3)];
  const blue = seedOut.find((row) => row.pile.colourFamily === "blue");
  const demoOut = blue ? [blue] : seedOut.slice(0, 1);
  const shownOut = [...extraOut, ...demoOut];
  const shownIds = new Set(
    [...shownInn, ...shownOut].map((row) => row.pile.batchId),
  );
  return {
    shownInn,
    shownOut,
    moreInn: seedInn.filter((row) => !shownIds.has(row.pile.batchId)),
    moreOut: seedOut.filter((row) => !shownIds.has(row.pile.batchId)),
  };
}

function BuyerHome({ user }: { user: SessionUser }) {
  const [lang, setLang] = useState<UiLang>(defaultLang("buyer"));
  const t = buyerCopy(lang);
  const [colourFamily, setColourFamily] = useState<"ruby_red" | "blue">("ruby_red");
  const [qty, setQty] = useState(10000);
  const [grade, setGrade] = useState<"A" | "B">("B");
  const [size, setSize] = useState("2-6");
  const [posted, setPosted] = useState(false);
  const [tick, setTick] = useState(0);
  const [demands, setDemands] = useState<Demand[]>([]);
  const [piles, setPiles] = useState<Pile[]>([]);
  const [activeId, setActiveId] = useState("");
  const [showMore, setShowMore] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const [stockOpen, setStockOpen] = useState(true);
  const [outOpen, setOutOpen] = useState(false);

  useEffect(() => {
    setLang(readLang("buyer"));
    function refresh() {
      const list = loadDemands();
      setDemands(list);
      setPiles(loadPiles());
      setActiveId((id) =>
        list.some((d) => d.demandId === id) ? id : list[0]?.demandId ?? "",
      );
    }
    refresh();
    return onStoreChange(refresh);
  }, [tick]);

  const active = demands.find((d) => d.demandId === activeId) ?? demands[0];

  const ranked = useMemo(() => {
    if (!active) {
      return { inn: [] as Ranked[], out: [] as Ranked[] };
    }
    const fields = {
      productFamily: active.productFamily,
      size: active.size,
      colourFamily: active.colourFamily,
      colourName: active.colourFamily,
      finish: "plain_glossy",
      finishName: "plain shiny",
      minGrade: active.grade,
    };
    const inn: Ranked[] = [];
    const out: Ranked[] = [];
    for (const pile of piles) {
      const result = matchPileToOrder(pile, fields);
      const row = { pile, km: kmFromHub(pile.locality), reason: result.reason };
      if (result.ok) inn.push(row);
      else out.push(row);
    }
    inn.sort((a, b) => a.km - b.km);
    out.sort((a, b) => a.km - b.km);
    return { inn, out };
  }, [piles, active]);

  const extraNewestFirst = useMemo(
    () =>
      piles
        .filter((p) => !isStarterBatch(p.batchId))
        .map((p) => p.batchId)
        .reverse(),
    [piles],
  );
  const feed = splitBuyerFeed(ranked.inn, ranked.out, extraNewestFirst);
  const innRows = showMore ? [...feed.shownInn, ...feed.moreInn] : feed.shownInn;
  const outRows = showMore ? [...feed.shownOut, ...feed.moreOut] : feed.shownOut;
  const moreCount = feed.moreInn.length + feed.moreOut.length;
  const poolView = active ? computePoolView(active.demandId) : null;
  const poolNeedsAction = Boolean(
    poolView && (poolView.canPayBooking || poolView.canConfirm),
  );

  useEffect(() => {
    if (poolNeedsAction) setPoolOpen(true);
  }, [poolNeedsAction]);

  function changeLang(next: UiLang) {
    saveLang("buyer", next);
    setLang(next);
  }

  function postDemand() {
    if (qty < 1) return;
    const list = loadDemands();
    const demand: Demand = {
      demandId: nextDemandId(list),
      buyerName: user.name,
      productFamily: "glass_bangle",
      size,
      colourFamily,
      grade,
      quantityNeeded: qty,
      locality: "Firozabad mandi",
    };
    saveDemand(demand);
    setActiveId(demand.demandId);
    setShowMore(false);
    setTick((n) => n + 1);
    setPosted(true);
  }

  function onCancel(demandId: string) {
    cancelDemand(demandId);
    setShowMore(false);
    setTick((n) => n + 1);
  }

  return (
    <main className="kn-shell mx-auto max-w-lg px-5 pb-24 pt-6">
      <h1 className="text-2xl font-extrabold leading-tight">{t.title}</h1>
      <p className="mt-1 text-sm text-[#5c4638]">{user.name}</p>
      <LangBar lang={lang} onChange={changeLang} />

      {active && poolView ? (
        <details
          className="kn-fold"
          open={poolOpen}
          onToggle={(e) => setPoolOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary>
            <span>
              {t.moneyPool}
              {poolNeedsAction ? (
                <span className="ml-2 text-xs font-bold text-[#8b1e14]">
                  {lang === "hi" ? "कार्रवाई" : "Action"}
                </span>
              ) : null}
            </span>
          </summary>
          <div className="kn-fold-body">
            <PoolCard
              compact
              view={poolView}
              lang={lang}
              onPayBooking={() => {
                payBooking(active.demandId);
                setTick((n) => n + 1);
              }}
              onConfirm={() => {
                confirmToPool(active.demandId);
                setTick((n) => n + 1);
              }}
            />
          </div>
        </details>
      ) : null}

      <section className="kn-stock">
        <h2 className="text-lg font-extrabold">{t.raiseDemand}</h2>
        <p className="kn-hint text-[#5c4638]">{t.raiseHint}</p>

        <p className="mt-4 text-center text-sm font-bold">{t.colour}</p>
        <div className="kn-colour-pick">
          <button
            type="button"
            onClick={() => setColourFamily("ruby_red")}
            className={`kn-orb kn-orb-red${colourFamily === "ruby_red" ? " is-on" : ""}`}
          >
            {t.red}
          </button>
          <button
            type="button"
            onClick={() => setColourFamily("blue")}
            className={`kn-orb kn-orb-blue${colourFamily === "blue" ? " is-on" : ""}`}
          >
            {t.blue}
          </button>
        </div>

        <label className="mt-4 block text-sm font-bold">{t.quantity}</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="kn-field mt-1.5"
        />

        <label className="mt-3 block text-sm font-bold">{t.size}</label>
        <select
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="kn-field mt-1.5"
        >
          <option value="2-6">2-6</option>
          <option value="2-4">2-4</option>
        </select>

        <p className="mt-3 text-sm font-bold">{t.quality}</p>
        <div className="mt-1.5 flex gap-2">
          <button
            type="button"
            onClick={() => setGrade("A")}
            className={`kn-chip flex-1 ${grade === "A" ? "is-on" : ""}`}
          >
            {t.gradeA}
          </button>
          <button
            type="button"
            onClick={() => setGrade("B")}
            className={`kn-chip flex-1 ${grade === "B" ? "is-on" : ""}`}
          >
            {t.gradeB}
          </button>
        </div>

        {posted ? <p className="mt-3 text-sm text-[#8b1e14]">{t.postedNote}</p> : null}

        <div className="kn-cta-bar">
          <button
            type="button"
            onClick={postDemand}
            className="kn-btn-primary rounded-full bg-[#8b1e14] text-white shadow-[0_12px_24px_-14px_rgba(139,30,20,0.5)]"
          >
            {t.postDemand}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-extrabold">{t.openDemands}</h2>
        <ul className="mt-2.5 space-y-2">
          {demands.map((d) => (
            <li key={d.demandId} className={`kn-row ${d.demandId === active?.demandId ? "is-on" : ""}`}>
              <span
                className={`kn-dot ${d.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
              />
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => setActiveId(d.demandId)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-bold">
                    {colourWords(d.colourFamily, lang)} · {d.quantityNeeded}{" "}
                    {lang === "hi" ? "टुकड़े" : "pieces"}
                  </p>
                  <p className="text-xs text-[#5c4638]">
                    {t.size} {d.size} · {gradeWords(d.grade, lang)}
                    {isSeedDemand(d.demandId) ? ` · ${t.demoOrder}` : ""}
                  </p>
                </button>
                {isSeedDemand(d.demandId) || demandHasAcceptedDemo(d.demandId) ? (
                  demandHasAcceptedDemo(d.demandId) ? (
                    <p className="mt-1 text-xs text-[#8b1e14]">{t.cancelLocked}</p>
                  ) : null
                ) : (
                  <button
                    type="button"
                    onClick={() => onCancel(d.demandId)}
                    className="kn-chip mt-1.5 px-3 text-xs text-[#8b1e14]"
                  >
                    {t.cancel}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <details
        className="kn-fold"
        open={stockOpen}
        onToggle={(e) => setStockOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>
          <span>
            {t.artisanStock}
            <span className="ml-2 text-xs font-normal text-[#5c4638]">
              ({innRows.length})
            </span>
          </span>
        </summary>
        <div className="kn-fold-body">
          <p className="mb-2 text-xs text-[#5c4638]">{t.stockHint}</p>
          <ul className="space-y-2">
            {innRows.length === 0 ? (
              <li className="text-sm text-[#5c4638]">{t.noMatch}</li>
            ) : (
              innRows.map(({ pile }) => (
                <li key={pile.batchId} className="kn-row">
                  <span
                    className={`kn-dot ${pile.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">
                      {pileTitle(pile.colourFamily, pile.declaredQty, lang)}
                    </p>
                    <p className="text-xs text-[#5c4638]">
                      {familyName(pile.householdId, lang)} ·{" "}
                      {distanceLabel(pile.locality, lang)} · {gradeWords(pile.grade, lang)}
                    </p>
                    <ScoreBadge householdId={pile.householdId} lang={lang} />
                    {active ? (
                      <Link
                        href={`/chat?demandId=${encodeURIComponent(active.demandId)}&batchId=${encodeURIComponent(pile.batchId)}`}
                        className="kn-chip mt-1.5 inline-flex text-xs text-[#8b1e14]"
                      >
                        {t.chat}
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </details>

      <details
        className="kn-fold"
        open={outOpen}
        onToggle={(e) => setOutOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary>
          <span>
            {t.wontWork}
            <span className="ml-2 text-xs font-normal text-[#5c4638]">
              ({outRows.length})
            </span>
          </span>
        </summary>
        <div className="kn-fold-body">
          <ul className="space-y-2">
            {outRows.map(({ pile, reason }) => (
              <li key={pile.batchId} className="kn-row">
                <span
                  className={`kn-dot ${pile.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">
                    {pileTitle(pile.colourFamily, pile.declaredQty, lang)}
                  </p>
                  <p className="text-xs text-[#8b1e14]">{reason}</p>
                  <p className="text-xs text-[#5c4638]">
                    {familyName(pile.householdId, lang)} · {distanceLabel(pile.locality, lang)}
                  </p>
                  <ScoreBadge householdId={pile.householdId} lang={lang} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </details>

      {moreCount > 0 ? (
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="kn-chip mt-4 w-full text-sm text-[#8b1e14]"
        >
          {showMore ? t.hideMore : t.showMore}
        </button>
      ) : null}
    </main>
  );
}

export default function BuyerPage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {(user) =>
          user.role === "buyer" ? (
            <BuyerHome user={user} />
          ) : (
            <BuyerWrongRole />
          )
        }
      </NeedLogin>
    </>
  );
}

function BuyerWrongRole() {
  const [lang, setLang] = useState<UiLang>(defaultLang("buyer"));
  useEffect(() => setLang(readLang("buyer")), []);
  return <p className="p-6 text-[#5c4638]">{buyerCopy(lang).wrongRole}</p>;
}
