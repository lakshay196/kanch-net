"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import { colourWords, familyName } from "@/lib/labels";
import { defaultLang, readLang, saveLang, type UiLang } from "@/lib/lang";
import {
  loadCollectorMap,
  loadPiles,
  saveCollectorMap,
  type CollectorOverride,
} from "@/lib/store";

type BatchRecord = {
  batchId: string;
  householdId: string;
  locality: string;
  colourFamily: string;
  declaredQty: number;
  collectedQty: number | null;
  condition: "OK" | "Damaged" | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  damagedQty: number | null;
  status: string;
  rejectionReason: string | null;
};

function toBatch(
  pile: {
    batchId: string;
    householdId: string;
    locality: string;
    colourFamily: string;
    declaredQty: number;
    collectedQty: number | null;
    acceptedQty: number | null;
    rejectedQty: number | null;
    damagedQty: number | null;
    status: string;
    rejectionReason: string | null;
  },
  override: CollectorOverride = {},
): BatchRecord {
  return {
    batchId: pile.batchId,
    householdId: override.householdId || pile.householdId,
    locality: override.locality || pile.locality,
    colourFamily: override.colourFamily || pile.colourFamily,
    declaredQty: override.declaredQty ?? pile.declaredQty,
    collectedQty:
      override.collectedQty !== undefined
        ? override.collectedQty
        : pile.collectedQty,
    condition:
      override.condition !== undefined
        ? override.condition
        : pile.collectedQty
          ? "OK"
          : null,
    acceptedQty:
      override.acceptedQty !== undefined
        ? override.acceptedQty
        : pile.acceptedQty,
    rejectedQty:
      override.rejectedQty !== undefined
        ? override.rejectedQty
        : pile.rejectedQty,
    damagedQty:
      override.damagedQty !== undefined
        ? override.damagedQty
        : pile.damagedQty,
    status: override.status !== undefined ? override.status : pile.status,
    rejectionReason:
      override.rejectionReason !== undefined
        ? override.rejectionReason
        : pile.rejectionReason,
  };
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

export default function PickupPage() {
  const [lang, setLang] = useState<UiLang>(defaultLang("collector"));
  const hi = lang === "hi";
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [collectedInput, setCollectedInput] = useState("");
  const [goodInput, setGoodInput] = useState("");
  const [brokenInput, setBrokenInput] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  useEffect(() => {
    setLang(readLang("collector"));
    try {
      const savedMap = loadCollectorMap();
      const piles = loadPiles();
      const initialBatches: BatchRecord[] = piles.map((pile) =>
        toBatch(pile, savedMap[pile.batchId] || {}),
      );

      Object.keys(savedMap).forEach((id) => {
        if (!initialBatches.some((b) => b.batchId === id)) {
          const item = savedMap[id];
          initialBatches.unshift({
            batchId: id,
            householdId: item.householdId || "Custom",
            locality: item.locality || "Local",
            colourFamily: item.colourFamily || "ruby_red",
            declaredQty: item.declaredQty || (item.collectedQty ?? 0),
            collectedQty: item.collectedQty ?? null,
            condition: item.condition ?? null,
            acceptedQty: item.acceptedQty ?? null,
            rejectedQty: item.rejectedQty ?? null,
            damagedQty: item.damagedQty ?? null,
            status: item.status || "collected",
            rejectionReason: item.rejectionReason ?? null,
          });
        }
      });

      setBatches(initialBatches);
    } catch {
      setBatches(loadPiles().map((pile) => toBatch(pile)));
    }
    setIsLoaded(true);
  }, []);

  function changeLang(next: UiLang) {
    saveLang("collector", next);
    setLang(next);
  }

  function persistBatches(updatedList: BatchRecord[]) {
    const map: Record<string, CollectorOverride> = {};
    updatedList.forEach((b) => {
      map[b.batchId] = b;
    });
    saveCollectorMap(map);
  }

  function pickPile(pile: BatchRecord) {
    setSelectedId(pile.batchId);
    const collected = pile.collectedQty ?? pile.declaredQty;
    setCollectedInput(String(collected));
    setGoodInput(String(pile.acceptedQty ?? collected));
    setBrokenInput(String(pile.damagedQty ?? 0));
    setError(null);
    setSavedNote(null);
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSavedNote(null);

    const active = batches.find((b) => b.batchId === selectedId);
    if (!active) {
      setError(hi ? "पहले ढेर चुनें।" : "Pick a pile first.");
      return;
    }

    if (
      collectedInput.trim() === "" ||
      goodInput.trim() === "" ||
      brokenInput.trim() === ""
    ) {
      setError(hi ? "तीनों संख्या लिखें।" : "Fill collected, good, and broken.");
      return;
    }

    const collected = Number(collectedInput);
    const good = Number(goodInput);
    const broken = Number(brokenInput);

    if (
      !Number.isInteger(collected) ||
      !Number.isInteger(good) ||
      !Number.isInteger(broken) ||
      collected < 0 ||
      good < 0 ||
      broken < 0
    ) {
      setError(hi ? "पूरी संख्या लिखें।" : "Use whole numbers, 0 or more.");
      return;
    }

    if (good + broken > collected) {
      setError(
        hi
          ? "अच्छा + टूटा, इकट्ठा से ज़्यादा नहीं।"
          : "Good + broken cannot exceed collected.",
      );
      return;
    }

    const leftover = collected - good - broken;
    const updated: BatchRecord = {
      ...active,
      collectedQty: collected,
      condition: broken > 0 ? "Damaged" : "OK",
      acceptedQty: good,
      rejectedQty: leftover,
      damagedQty: broken,
      status: "accepted",
      rejectionReason: broken > 0 || leftover > 0 ? "Broken" : null,
    };

    const updatedList = batches.map((b) =>
      b.batchId === selectedId ? updated : b,
    );
    setBatches(updatedList);
    persistBatches(updatedList);
    setSavedNote(hi ? "सेव हो गया।" : "Saved. Pay uses the good pieces.");
  }

  const selected = batches.find((b) => b.batchId === selectedId);

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() =>
          !isLoaded ? (
            <p className="p-6 text-[#5c4638]">…</p>
          ) : (
            <main className="kn-shell mx-auto max-w-md px-5 py-8 pb-24">
              <h1 className="text-3xl font-extrabold leading-tight">
                {hi ? "इकट्ठा करें" : "Collect"}
              </h1>
              <p className="mt-2 text-base text-[#5c4638]">
                {hi ? "ढेर इकट्ठा करें। फिर पैसा।" : "Collect piles. Then pay."}
              </p>
              <LangBar lang={lang} onChange={changeLang} />

              <section className="mt-8">
                <p className="text-sm font-bold text-[#5c4638]">1</p>
                <p className="mt-1 text-xl font-extrabold">
                  {hi ? "कौन सा ढेर" : "Which pile"}
                </p>
                <ul className="mt-4 space-y-3">
                  {batches.map((pile) => {
                    const on = pile.batchId === selectedId;
                    return (
                      <li key={pile.batchId}>
                        <button
                          type="button"
                          onClick={() => pickPile(pile)}
                          className={`kn-row w-full ${on ? "is-on" : ""}`}
                        >
                          <span
                            className={`kn-dot ${pile.colourFamily === "blue" ? "kn-dot-blue" : "kn-dot-red"}`}
                          />
                          <span className="min-w-0 flex-1 text-left">
                            <span className="block font-bold">
                              {familyName(pile.householdId, lang)}
                            </span>
                            <span className="block text-sm text-[#5c4638]">
                              {colourWords(pile.colourFamily, lang)} · {pile.declaredQty}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>

              {selected ? (
                <form onSubmit={handleSave} className="mt-8">
                  <p className="text-sm font-bold text-[#5c4638]">2</p>
                  <p className="mt-1 text-xl font-extrabold">
                    {hi ? "संख्या" : "Numbers"}
                  </p>

                  <label className="mt-4 block">
                    <span className="font-bold">
                      {hi ? "इकट्ठा" : "Collected"}
                    </span>
                    <input
                      className="kn-input mt-2 w-full"
                      inputMode="numeric"
                      value={collectedInput}
                      onChange={(e) => setCollectedInput(e.target.value)}
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="font-bold">{hi ? "अच्छा" : "Good"}</span>
                    <input
                      className="kn-input mt-2 w-full"
                      inputMode="numeric"
                      value={goodInput}
                      onChange={(e) => setGoodInput(e.target.value)}
                    />
                  </label>
                  <label className="mt-3 block">
                    <span className="font-bold">{hi ? "टूटा" : "Broken"}</span>
                    <input
                      className="kn-input mt-2 w-full"
                      inputMode="numeric"
                      value={brokenInput}
                      onChange={(e) => setBrokenInput(e.target.value)}
                    />
                  </label>

                  {error ? <p className="mt-3 text-[#8b1e14]">{error}</p> : null}
                  {savedNote ? (
                    <p className="mt-3 font-bold text-[#8b1e14]">{savedNote}</p>
                  ) : null}

                  <p className="mt-8 text-sm font-bold text-[#5c4638]">3</p>
                  <button
                    type="submit"
                    className="kn-btn-primary mt-3 w-full rounded-full bg-[#8b1e14] py-3 text-lg font-extrabold text-white"
                  >
                    {hi ? "सेव" : "Save"}
                  </button>
                </form>
              ) : null}

              <p className="mt-10 text-center">
                <Link href="/money" className="kn-chip inline-flex text-[#8b1e14]">
                  {hi ? "पैसा →" : "Money →"}
                </Link>
              </p>
            </main>
          )
        }
      </NeedLogin>
    </>
  );
}
