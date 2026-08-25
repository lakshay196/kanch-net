"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import ScoreBadge from "@/components/ScoreBadge";
import { artisanCopy } from "@/lib/copy";
import { colourWords, gradeWords, pileTitle } from "@/lib/labels";
import { defaultLang, readLang, saveLang, type UiLang } from "@/lib/lang";
import { HOUSE_PLACE, distanceLabel } from "@/lib/places";
import { browserSpeechAvailable, listenOnce } from "@/lib/speech";
import {
  artisanChatPile,
  householdStockCards,
  loadDemands,
  loadPiles,
  nextBatchId,
  onStoreChange,
  saveExtraPile,
  type Demand,
} from "@/lib/store";
import type { Pile, SessionUser } from "@/lib/types";

type Craft = "bangles" | "pottery" | "textile";

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

function micFailNote(code: string, t: ReturnType<typeof artisanCopy>) {
  if (code === "no-speech-api" || code === "insecure-context") return t.micNeedChrome;
  if (code === "not-allowed" || code === "service-not-allowed") return t.micDenied;
  if (code === "no-speech") return t.hearFail;
  return t.hearFail;
}

function ArtisanHome({ user }: { user: SessionUser }) {
  const [lang, setLang] = useState<UiLang>(defaultLang("artisan"));
  const t = artisanCopy(lang);
  const [craft, setCraft] = useState<Craft>("bangles");
  const [colourFamily, setColourFamily] = useState<"ruby_red" | "blue">("ruby_red");
  const [qty, setQty] = useState(200);
  const [grade, setGrade] = useState<"A" | "B">("B");
  const [hearing, setHearing] = useState(false);
  const [voiceNote, setVoiceNote] = useState("");
  const [saved, setSaved] = useState<{ colour: "ruby_red" | "blue"; qty: number } | null>(
    null,
  );
  const [micOk, setMicOk] = useState(false);
  const [piles, setPiles] = useState<Pile[]>([]);
  const [demands, setDemands] = useState<Demand[]>([]);

  useEffect(() => {
    setLang(readLang("artisan"));
    setMicOk(browserSpeechAvailable());
    function refresh() {
      setPiles(loadPiles());
      setDemands(loadDemands());
    }
    refresh();
    return onStoreChange(refresh);
  }, []);

  const mine = householdStockCards(piles, user.householdId || "");
  const chatPile = artisanChatPile(piles, user.householdId || "");
  const lockedCraft = craft !== "bangles";

  function changeLang(next: UiLang) {
    saveLang("artisan", next);
    setLang(next);
  }

  async function hear() {
    setVoiceNote("");
    if (!browserSpeechAvailable()) {
      setMicOk(false);
      setVoiceNote(t.micNeedChrome);
      return;
    }
    setMicOk(true);
    setHearing(true);
    try {
      const hit = await listenOnce({
        speechLang: lang,
        onPartial: (text) => setVoiceNote(`${t.heardPrefix} ${text}`),
        onListening: () => setHearing(true),
      });
      if (hit.colourFamily === "blue") setColourFamily("blue");
      if (hit.colourFamily === "ruby_red") setColourFamily("ruby_red");
      if (hit.qty) setQty(hit.qty);
      if (hit.grade) setGrade(hit.grade);
      setVoiceNote(hit.raw ? `${t.heardPrefix} ${hit.raw}` : t.heardPrefix);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      if (code === "no-speech-api" || code === "insecure-context") setMicOk(false);
      setVoiceNote(micFailNote(code, t));
    } finally {
      setHearing(false);
    }
  }

  function postStock() {
    if (lockedCraft) return;
    if (qty < 1) return;
    const householdId = user.householdId || "HH-01";
    const locality = HOUSE_PLACE[householdId] || "Ramnagar";
    const next = loadPiles();
    const pile: Pile = {
      batchId: nextBatchId(next),
      householdId,
      locality,
      productFamily: "glass_bangle",
      size: "2-6",
      colourFamily,
      finish: "plain_glossy",
      grade,
      declaredQty: qty,
      collectedQty: null,
      acceptedQty: null,
      rejectedQty: null,
      damagedQty: null,
      status: "declared",
      rejectionReason: null,
      readyDate: "2026-09-08",
      spokenTerm: colourFamily === "blue" ? "neeli chudi" : "lal chudi",
    };
    saveExtraPile(pile);
    setPiles(loadPiles());
    setSaved({ colour: colourFamily, qty });
  }

  return (
    <main className="kn-shell mx-auto max-w-md px-5 pb-28 pt-7">
      <h1 className="text-3xl font-extrabold leading-tight">{t.title}</h1>
      <p className="mt-1.5 text-base text-[#5c4638]">{user.name}</p>
      {user.householdId ? <ScoreBadge householdId={user.householdId} lang={lang} /> : null}
      <LangBar lang={lang} onChange={changeLang} />

      <label className="mt-6 block text-base font-bold">{t.craft}</label>
      <select
        value={craft}
        onChange={(e) => setCraft(e.target.value as Craft)}
        className="kn-field mt-1.5"
      >
        <option value="bangles">{t.bangles}</option>
        <option value="pottery">{t.pottery}</option>
        <option value="textile">{t.textile}</option>
      </select>

      {lockedCraft ? (
        <p className="mt-8 text-lg leading-snug text-[#5c4638]">{t.locked}</p>
      ) : (
        <section className="kn-stock">
          <h2 className="font-extrabold">{t.addStock}</h2>
          <p className="kn-hint text-[#5c4638]">{t.addHint}</p>

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() => void hear()}
              disabled={hearing}
              aria-pressed={hearing}
              className={`kn-mic${hearing ? " is-listening" : ""}`}
            >
              <span className="kn-mic-dot" aria-hidden />
              {hearing ? t.listening : t.speak}
            </button>
          </div>
          <p className="mt-2 text-center text-sm text-[#5c4638]">
            {micOk ? t.micHint : t.micNeedChrome}
          </p>
          {voiceNote ? (
            <p className="mt-1.5 text-center text-base text-[#8b1e14]">{voiceNote}</p>
          ) : null}

          <p className="mt-6 text-center text-base font-bold">{t.colour}</p>
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

          <label className="mt-6 block text-base font-bold">{t.howMany}</label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="kn-field mt-1.5 text-xl"
          />

          <p className="mt-5 text-base font-bold">{t.quality}</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setGrade("A")}
              className={`kn-chip flex-1 text-base ${grade === "A" ? "is-on" : ""}`}
            >
              {t.gradeA}
            </button>
            <button
              type="button"
              onClick={() => setGrade("B")}
              className={`kn-chip flex-1 text-base ${grade === "B" ? "is-on" : ""}`}
            >
              {t.gradeB}
            </button>
          </div>

          {saved ? (
            <p className="mt-4 text-base text-[#8b1e14]">
              {t.savedPrefix} {pileTitle(saved.colour, saved.qty, lang)}. {t.buyerCanSee}
            </p>
          ) : null}

          <div className="kn-cta-bar">
            <button
              type="button"
              onClick={postStock}
              className="kn-btn-primary rounded-full bg-[#8b1e14] py-3.5 text-lg font-extrabold text-white shadow-[0_14px_28px_-16px_rgba(139,30,20,0.5)]"
            >
              {t.postStock}
            </button>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">{t.buyerWants}</h2>
        <ul className="mt-3 space-y-2.5">
          {demands.map((d) => (
            <li key={d.demandId} className="kn-row">
              <span
                className={`kn-dot ${d.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
              />
              <div>
                <p className="text-base font-bold">
                  {colourWords(d.colourFamily, lang)} · {d.quantityNeeded}{" "}
                  {lang === "hi" ? "टुकड़े" : "pieces"}
                </p>
                <p className="text-xs text-[#5c4638]">
                  {t.size} {d.size} · {gradeWords(d.grade, lang)} · {d.locality}
                </p>
                {chatPile ? (
                  <Link
                    href={`/chat?demandId=${encodeURIComponent(d.demandId)}&batchId=${encodeURIComponent(chatPile.batchId)}`}
                    className="kn-chip mt-2 inline-flex text-sm text-[#8b1e14]"
                  >
                    {t.openChat}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-extrabold">{t.yourStock}</h2>
        <ul className="mt-3 space-y-2.5">
          {mine.length === 0 ? (
            <li className="text-base text-[#5c4638]">{t.noneYet}</li>
          ) : (
            mine.map((pile) => (
              <li key={pile.batchId} className="kn-row">
                <span
                  className={`kn-dot ${pile.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                />
                <div>
                  <p className="text-base font-bold">
                    {pileTitle(pile.colourFamily, pile.declaredQty, lang)}
                  </p>
                  <p className="text-xs text-[#5c4638]">
                    {gradeWords(pile.grade, lang)} · {distanceLabel(pile.locality, lang)}
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

export default function ArtisanPage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {(user) =>
          user.role === "artisan" ? <ArtisanHome user={user} /> : <ArtisanWrongRole />
        }
      </NeedLogin>
    </>
  );
}

function ArtisanWrongRole() {
  const [lang, setLang] = useState<UiLang>(defaultLang("artisan"));
  useEffect(() => setLang(readLang("artisan")), []);
  return <p className="p-6 text-[#5c4638]">{artisanCopy(lang).wrongRole}</p>;
}
