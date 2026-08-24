"use client";

import { useEffect, useState } from "react";
import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";
import type { Pile, SessionUser } from "@/lib/types";

const LOCAL_STORAGE_PILES_KEY = "kanch-artisan-piles";

// Standard mapping constants as defined in PRD and instructions
const PRODUCT_OPTIONS = [
  {
    id: "lal_chudi",
    hindiName: "लाल चूड़ी",
    englishName: "Red glass bangle",
    spokenTerm: "lal chudi",
    productFamily: "glass_bangle",
    colourFamily: "ruby_red",
    colourLabel: "लाल (Ruby Red)",
    finish: "plain_glossy",
    finishName: "plain shiny",
    grade: "B",
    icon: "🔴",
  },
  {
    id: "neeli_chudi",
    hindiName: "नीली चूड़ी",
    englishName: "Blue glass bangle",
    spokenTerm: "neeli chudi",
    productFamily: "glass_bangle",
    colourFamily: "blue",
    colourLabel: "नीला (Blue)",
    finish: "plain_glossy",
    finishName: "plain shiny",
    grade: "B",
    icon: "🔵",
  },
];

const SIZE_OPTIONS = ["2-6", "2-4", "2-2", "2-8"];

const DEFAULT_LOCALITY_MAP: Record<string, string> = {
  "HH-01": "Ramnagar",
  "HH-02": "Suhag Nagar",
  "HH-03": "Ramnagar",
};

export default function PhonePage() {
  return (
    <>
      <AppHeader />
      <NeedLogin>
        {(user) => <ArtisanPhoneHome user={user} />}
      </NeedLogin>
    </>
  );
}

function ArtisanPhoneHome({ user }: { user: SessionUser }) {
  // Piles state (starter + local additions)
  const [allPiles, setAllPiles] = useState<Pile[]>(starter.piles);
  const [isLoaded, setIsLoaded] = useState(false);

  // Screen / view state: "form" | "confirm"
  const [currentStep, setCurrentStep] = useState<"form" | "confirm">("form");

  // Form inputs
  const [selectedProductId, setSelectedProductId] = useState<string>("lal_chudi");
  const [size, setSize] = useState<string>("2-6");
  const [declaredQty, setDeclaredQty] = useState<number | "">(450);
  const [readyDate, setReadyDate] = useState<string>("2026-09-08");

  // Speech demo modal state
  const [showVoiceModal, setShowVoiceModal] = useState<boolean>(false);
  const [voiceNotification, setVoiceNotification] = useState<string | null>(null);

  // Success alert state
  const [recentSavedBatchId, setRecentSavedBatchId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Load custom piles from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_PILES_KEY);
      if (stored) {
        const parsed: Pile[] = JSON.parse(stored);
        // Merge without duplicate batchIds
        const existingIds = new Set(starter.piles.map((p) => p.batchId));
        const customOnly = parsed.filter((p) => !existingIds.has(p.batchId));
        setAllPiles([...starter.piles, ...customOnly]);
      }
    } catch {
      // fallback to starter list
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const selectedProduct =
    PRODUCT_OPTIONS.find((p) => p.id === selectedProductId) || PRODUCT_OPTIONS[0];

  // Filter piles for the current logged-in artisan household
  const myPiles = allPiles.filter((p) => p.householdId === user.householdId);

  // Helper to determine next batchId e.g. "B-021"
  function getNextBatchId(): string {
    let maxNum = 20;
    allPiles.forEach((p) => {
      const match = p.batchId.match(/^B-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    });
    const nextNum = maxNum + 1;
    return `B-${String(nextNum).padStart(3, "0")}`;
  }

  // Handle Voice phrase quick selection (Demo speech-to-text)
  function handleSelectVoicePhrase(phrase: {
    productId: string;
    size: string;
    qty: number;
    date: string;
    text: string;
  }) {
    setSelectedProductId(phrase.productId);
    setSize(phrase.size);
    setDeclaredQty(phrase.qty);
    setReadyDate(phrase.date);
    setShowVoiceModal(false);
    setVoiceNotification(`आवाज़ पहचानी: "${phrase.text}"`);
    setTimeout(() => setVoiceNotification(null), 5000);
  }

  // Step 1: Validate and go to CONFIRM screen
  function handleGoToConfirm() {
    setFormError(null);
    if (!declaredQty || Number(declaredQty) <= 0) {
      setFormError("कृपया सही संख्या दर्ज करें (कम से कम 1 पीस) / Please enter a valid quantity.");
      return;
    }
    if (!readyDate) {
      setFormError("कृपया तैयार होने की तारीख चुनें / Please pick a ready date.");
      return;
    }
    setCurrentStep("confirm");
    // Scroll to top of the card smoothly
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Step 2: Confirm and save the pile
  function handleSaveConfirmedPile() {
    const newBatchId = getNextBatchId();
    const householdId = user.householdId || "HH-01";
    const locality = DEFAULT_LOCALITY_MAP[householdId] || "Ramnagar";

    const newPile: Pile = {
      batchId: newBatchId,
      householdId: householdId,
      locality: locality,
      productFamily: selectedProduct.productFamily,
      size: size,
      colourFamily: selectedProduct.colourFamily,
      finish: selectedProduct.finish,
      grade: selectedProduct.grade,
      declaredQty: Number(declaredQty),
      collectedQty: null,
      acceptedQty: null,
      rejectedQty: null,
      damagedQty: null,
      status: "declared",
      rejectionReason: null,
      readyDate: readyDate,
      spokenTerm: selectedProduct.spokenTerm,
    };

    const updated = [...allPiles, newPile];
    setAllPiles(updated);

    try {
      // Save custom ones in localStorage
      const existingIds = new Set(starter.piles.map((p) => p.batchId));
      const customPiles = updated.filter((p) => !existingIds.has(p.batchId));
      localStorage.setItem(LOCAL_STORAGE_PILES_KEY, JSON.stringify(customPiles));
    } catch {
      // local storage error ignored
    }

    setRecentSavedBatchId(newBatchId);
    setCurrentStep("form");
    setDeclaredQty(450); // reset to comfortable default

    // Scroll to success notification / piles list
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-md px-4 py-6 pb-24 font-sans text-[#2a1810]">
      {/* Top Banner / Role Identity */}
      <div className="mb-4">
        <OwnerNote who="Person A" folder="app/phone" />
      </div>

      {/* Header Info */}
      <div className="rounded-3xl border border-[#ead9c4] bg-[#fffaf3] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-block rounded-full bg-[#8b1e14]/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8b1e14]">
              {user.householdId ? `${user.householdId} · ${user.name}` : user.name}
            </span>
            <h1 className="mt-1 text-2xl font-black text-[#2a1810]">
              घर का काम <span className="text-base font-medium text-[#7d5e49]">/ Home Worker</span>
            </h1>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8b1e14] text-2xl text-white shadow-md">
            📱
          </div>
        </div>
        <p className="mt-2 text-xs text-[#6b5240]">
          यहाँ अपनी चूड़ियों का नया बंडल दर्ज करें और अपने पुराने बंडल देखें।
        </p>
      </div>

      {/* Success Notification after Save */}
      {recentSavedBatchId && (
        <div className="mt-4 animate-in fade-in rounded-3xl border-2 border-emerald-500 bg-emerald-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="font-bold text-emerald-900">
                बंडल <span className="underline">{recentSavedBatchId}</span> सफलतापूर्वक दर्ज हो गया!
              </p>
              <p className="mt-0.5 text-xs text-emerald-700">
                Batch {recentSavedBatchId} has been confirmed & saved under &quot;मेरे बंडल&quot;.
              </p>
              <button
                type="button"
                onClick={() => setRecentSavedBatchId(null)}
                className="mt-2 text-xs font-semibold text-emerald-800 underline"
              >
                बंद करें / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Voice Recognition notification */}
      {voiceNotification && (
        <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-3 text-xs font-medium text-amber-900">
          🗣️ {voiceNotification}
        </div>
      )}

      {/* STEP 1: FORM VIEW */}
      {currentStep === "form" && (
        <section className="mt-5 rounded-3xl border border-[#ead9c4] bg-white p-5 shadow-sm">
          {/* Big Voice Button */}
          <div className="mb-6 text-center">
            <button
              type="button"
              id="voice-speak-button"
              onClick={() => setShowVoiceModal(true)}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#8b1e14] to-[#b32b1f] px-5 py-4 text-lg font-bold text-white shadow-md transition active:scale-95 hover:brightness-110"
            >
              <span className="text-2xl animate-pulse">🎤</span>
              <span>बोलो / Speak</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-normal">
                आवाज़ से भरें
              </span>
            </button>
            <p className="mt-1.5 text-xs text-[#7d5e49]">
              माइक दबाएँ या नीचे दिए गए आसान फ़ॉर्म को भरें
            </p>
          </div>

          <div className="border-t border-[#f0e4d4] pt-4">
            <h2 className="text-lg font-bold text-[#2a1810]">
              नया माल दर्ज करें <span className="text-xs font-normal text-[#7d5e49]">/ Add New Pile</span>
            </h2>

            {formError && (
              <div className="mt-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-semibold text-red-700">
                ⚠️ {formError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoToConfirm();
              }}
              className="mt-4 space-y-5"
            >
              {/* 1. PRODUCT SELECTION */}
              <div>
                <label className="block text-sm font-bold text-[#2a1810]">
                  1. उत्पाद चुनें <span className="text-xs font-normal text-[#7d5e49]">/ Product</span>
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2.5">
                  {PRODUCT_OPTIONS.map((prod) => {
                    const isSelected = selectedProductId === prod.id;
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => setSelectedProductId(prod.id)}
                        className={`flex flex-col items-center justify-center rounded-2xl border-2 p-3 text-center transition ${
                          isSelected
                            ? "border-[#8b1e14] bg-[#fff6e8] shadow-sm ring-1 ring-[#8b1e14]"
                            : "border-[#e5d6c3] bg-[#faf6f0] hover:border-[#cbb398]"
                        }`}
                      >
                        <span className="text-3xl">{prod.icon}</span>
                        <span className="mt-1 font-bold text-sm text-[#2a1810]">{prod.hindiName}</span>
                        <span className="text-[11px] text-[#7d5e49]">{prod.englishName}</span>
                        <span className="mt-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#8b1e14] border border-[#ead9c4]">
                          &ldquo;{prod.spokenTerm}&rdquo;
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. SIZE SELECTION */}
              <div>
                <label className="block text-sm font-bold text-[#2a1810]">
                  2. साइज़ चुनें <span className="text-xs font-normal text-[#7d5e49]">/ Size</span>
                </label>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {SIZE_OPTIONS.map((s) => {
                    const isSelected = size === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSize(s)}
                        className={`rounded-2xl border-2 py-3 text-center font-bold text-base transition ${
                          isSelected
                            ? "border-[#8b1e14] bg-[#8b1e14] text-white shadow-sm"
                            : "border-[#e5d6c3] bg-[#faf6f0] text-[#2a1810] hover:border-[#cbb398]"
                        }`}
                      >
                        {s}
                        {s === "2-6" && (
                          <span className="block text-[9px] font-normal opacity-90">मानक</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. COLOUR INFO (Mapped from Product) */}
              <div>
                <label className="block text-sm font-bold text-[#2a1810]">
                  3. रंग <span className="text-xs font-normal text-[#7d5e49]">/ Colour</span>
                </label>
                <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-[#ead9c4] bg-[#fffaf3] px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{selectedProduct.icon}</span>
                    <div>
                      <p className="font-bold text-sm text-[#2a1810]">{selectedProduct.colourLabel}</p>
                      <p className="text-xs text-[#7d5e49]">Family: {selectedProduct.colourFamily}</p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#8b1e14]">उत्पाद से तय</span>
                </div>
              </div>

              {/* 4. QUANTITY SELECTION */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-bold text-[#2a1810]">
                    4. संख्या (टुकड़े) <span className="text-xs font-normal text-[#7d5e49]">/ Quantity (pieces)</span>
                  </label>
                  <span className="text-xs font-bold text-[#8b1e14]">
                    {declaredQty ? `${declaredQty} पीस` : "0 पीस"}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={declaredQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDeclaredQty(val === "" ? "" : Number(val));
                    }}
                    placeholder="उदा. 450"
                    className="w-full rounded-2xl border-2 border-[#ead9c4] bg-white px-4 py-3 text-xl font-black text-[#2a1810] focus:border-[#8b1e14] focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setDeclaredQty("")}
                    className="rounded-2xl border border-[#ead9c4] bg-[#faf6f0] px-3 py-3 text-xs text-[#7d5e49] hover:bg-[#eae0d2]"
                  >
                    साफ़
                  </button>
                </div>
                {/* Quick Add buttons for easy tap */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="py-1 text-[11px] text-[#7d5e49]">जल्दी जोड़ें:</span>
                  {[200, 300, 450, 500].map((qty) => (
                    <button
                      key={qty}
                      type="button"
                      onClick={() => setDeclaredQty(qty)}
                      className={`rounded-xl px-2.5 py-1 text-xs font-bold transition ${
                        declaredQty === qty
                          ? "bg-[#8b1e14] text-white"
                          : "border border-[#e0cfbd] bg-[#faf6f0] text-[#5c4638] hover:bg-[#eee3d5]"
                      }`}
                    >
                      {qty}
                    </button>
                  ))}
                  {[+50, +100].map((inc) => (
                    <button
                      key={inc}
                      type="button"
                      onClick={() =>
                        setDeclaredQty((prev) => (Number(prev) || 0) + inc)
                      }
                      className="rounded-xl border border-[#8b1e14]/30 bg-[#fff4ec] px-2 py-1 text-xs font-bold text-[#8b1e14] hover:bg-[#ffe6d6]"
                    >
                      +{inc}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. READY DATE */}
              <div>
                <label className="block text-sm font-bold text-[#2a1810]">
                  5. तैयार होने की तारीख <span className="text-xs font-normal text-[#7d5e49]">/ Ready Date</span>
                </label>
                <div className="mt-1.5">
                  <input
                    type="date"
                    value={readyDate}
                    onChange={(e) => setReadyDate(e.target.value)}
                    className="w-full rounded-2xl border-2 border-[#ead9c4] bg-white px-4 py-3 text-base font-semibold text-[#2a1810] focus:border-[#8b1e14] focus:outline-none"
                    required
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReadyDate("2026-09-08")}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${
                      readyDate === "2026-09-08"
                        ? "bg-[#8b1e14] text-white"
                        : "border border-[#ead9c4] bg-[#faf6f0] text-[#5c4638]"
                    }`}
                  >
                    8 सित (कल)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadyDate("2026-09-09")}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${
                      readyDate === "2026-09-09"
                        ? "bg-[#8b1e14] text-white"
                        : "border border-[#ead9c4] bg-[#faf6f0] text-[#5c4638]"
                    }`}
                  >
                    9 सित (परसों)
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadyDate("2026-09-10")}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold ${
                      readyDate === "2026-09-10"
                        ? "bg-[#8b1e14] text-white"
                        : "border border-[#ead9c4] bg-[#faf6f0] text-[#5c4638]"
                    }`}
                  >
                    10 सित
                  </button>
                </div>
              </div>

              {/* Submit to Confirmation */}
              <div className="pt-2">
                <button
                  type="submit"
                  id="submit-to-confirm-button"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#8b1e14] px-5 py-4 text-lg font-black text-white shadow-lg transition active:scale-95 hover:bg-[#72170e]"
                >
                  <span>आगे बढ़ें (पुष्टि करें)</span>
                  <span>➔</span>
                </button>
                <p className="mt-2 text-center text-xs text-[#7d5e49]">
                  अगली स्क्रीन पर पुष्टि करने के बाद ही बंडल सुरक्षित होगा।
                </p>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* STEP 2: CONFIRMATION SCREEN (MANDATORY REQUIREMENT: Must tap confirm before saving) */}
      {currentStep === "confirm" && (
        <section className="mt-5 animate-in fade-in rounded-3xl border-2 border-[#8b1e14] bg-[#fffaf3] p-5 shadow-xl">
          <div className="text-center">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#8b1e14]/10 text-3xl">
              📝
            </span>
            <h2 className="mt-2 text-2xl font-black text-[#8b1e14]">
              क्या यह सही है?
            </h2>
            <p className="text-sm font-semibold text-[#5c4638]">
              I heard this. Is this right?
            </p>
            <p className="mt-1 text-xs text-[#7d5e49]">
              कृपया नीचे दी गई जानकारी की जाँच करें और &quot;हाँ, पक्का करें&quot; दबाएँ।
            </p>
          </div>

          {/* Large Summary Card */}
          <div className="mt-5 space-y-3 rounded-2xl border border-[#ead9c4] bg-white p-4 text-sm shadow-sm">
            <div className="flex items-center justify-between border-b border-[#f4ebdf] pb-2">
              <span className="text-[#7d5e49]">उत्पाद / Product:</span>
              <span className="font-bold text-base text-[#2a1810] flex items-center gap-1.5">
                <span>{selectedProduct.icon}</span>
                <span>{selectedProduct.hindiName}</span>
                <span className="text-xs font-normal text-[#7d5e49]">({selectedProduct.spokenTerm})</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#f4ebdf] pb-2">
              <span className="text-[#7d5e49]">साइज़ / Size:</span>
              <span className="font-bold text-base text-[#2a1810]">
                {size} <span className="text-xs font-normal text-[#7d5e49]">(मानक)</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#f4ebdf] pb-2">
              <span className="text-[#7d5e49]">रंग / Colour:</span>
              <span className="font-bold text-[#2a1810]">
                {selectedProduct.colourLabel} <span className="text-xs font-normal text-[#7d5e49]">({selectedProduct.colourFamily})</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#f4ebdf] pb-2">
              <span className="text-[#7d5e49]">संख्या / Quantity:</span>
              <span className="text-xl font-black text-[#8b1e14]">
                {declaredQty} टुकड़े <span className="text-xs font-normal text-[#7d5e49]">(pieces)</span>
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-[#f4ebdf] pb-2">
              <span className="text-[#7d5e49]">तैयार तारीख / Ready Date:</span>
              <span className="font-bold text-[#2a1810]">
                {readyDate}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-[#7d5e49]">नया बैच कोड / Batch ID:</span>
              <span className="rounded-md bg-[#faf0e1] px-2 py-0.5 font-mono font-bold text-[#8b1e14]">
                {getNextBatchId()}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              type="button"
              id="confirm-save-pile-button"
              onClick={handleSaveConfirmedPile}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-4 text-lg font-black text-white shadow-lg transition active:scale-95 hover:bg-emerald-800"
            >
              <span>✅ हाँ, पक्का करें / Yes, Confirm</span>
            </button>

            <button
              type="button"
              id="back-to-edit-button"
              onClick={() => setCurrentStep("form")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#8b1e14] bg-white px-5 py-3 text-base font-bold text-[#8b1e14] transition active:scale-95 hover:bg-[#fff6e8]"
            >
              <span>✏️ वापस बदलें / Edit / Go Back</span>
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: "MY PILES" LIST (मेरे बंडल) */}
      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-[#2a1810]">
              मेरे बंडल <span className="text-sm font-medium text-[#7d5e49]">/ My piles</span>
            </h2>
            <p className="text-xs text-[#7d5e49]">
              {user.name} ({user.householdId}) के सभी बंडल
            </p>
          </div>
          <span className="rounded-full bg-[#8b1e14] px-3 py-1 text-xs font-bold text-white">
            {myPiles.length} बंडल
          </span>
        </div>

        <ul className="mt-4 space-y-3">
          {myPiles.length === 0 ? (
            <li className="rounded-3xl border border-dashed border-[#ead9c4] bg-white p-6 text-center text-[#7d5e49]">
              <p className="text-2xl">📦</p>
              <p className="mt-2 font-bold text-sm">अभी कोई बंडल दर्ज नहीं है</p>
              <p className="text-xs">ऊपर दिए गए फ़ॉर्म से पहला बंडल जोड़ें।</p>
            </li>
          ) : (
            myPiles.map((pile) => {
              const isNewlyAdded = pile.batchId === recentSavedBatchId;
              const isRed =
                pile.colourFamily === "ruby_red" || pile.spokenTerm === "lal chudi";

              return (
                <li
                  key={pile.batchId}
                  className={`rounded-3xl border p-4 transition ${
                    isNewlyAdded
                      ? "border-2 border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-200"
                      : "border-[#ead9c4] bg-white shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{isRed ? "🔴" : "🔵"}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-black text-[#8b1e14]">
                            {pile.batchId}
                          </span>
                          {isNewlyAdded && (
                            <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                              नया / New
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-[#2a1810]">
                          {isRed ? "लाल चूड़ी" : "नीली चूड़ी"}{" "}
                          <span className="font-normal text-[#7d5e49]">
                            ({pile.spokenTerm || pile.productFamily})
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {pile.status === "declared" && (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
                          🟡 दर्ज (declared)
                        </span>
                      )}
                      {pile.status === "collected" && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                          🔵 उठाया गया (collected)
                        </span>
                      )}
                      {pile.status === "accepted" && (
                        <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                          🟢 स्वीकृत (accepted)
                        </span>
                      )}
                      {pile.status === "rejected" && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800">
                          🔴 अस्वीकृत (rejected)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Details Grid */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#faf6f0] p-3 text-xs">
                    <div>
                      <span className="text-[#7d5e49]">संख्या / Quantity:</span>
                      <p className="text-sm font-black text-[#2a1810]">
                        {pile.declaredQty} टुकड़े <span className="font-normal text-xs text-[#7d5e49]">(pieces)</span>
                      </p>
                    </div>

                    <div>
                      <span className="text-[#7d5e49]">साइज़ / Size:</span>
                      <p className="text-sm font-bold text-[#2a1810]">
                        {pile.size}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#7d5e49]">रंग / Colour:</span>
                      <p className="font-medium text-[#2a1810]">
                        {pile.colourFamily}
                      </p>
                    </div>

                    <div>
                      <span className="text-[#7d5e49]">तैयार तारीख / Ready:</span>
                      <p className="font-medium text-[#2a1810]">
                        {pile.readyDate || "—"}
                      </p>
                    </div>
                  </div>

                  {/* If Rejection Reason exists */}
                  {pile.rejectionReason && (
                    <div className="mt-2 rounded-xl bg-red-50 p-2 text-xs text-red-800">
                      <strong>कारण / Reason:</strong> {pile.rejectionReason}
                    </div>
                  )}
                </li>
              );
            })
          )}
        </ul>
      </section>

      {/* Voice Assistant / Speak Modal (Demo assisted entry) */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-5 rounded-3xl border border-[#ead9c4] bg-[#fffaf3] p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl animate-bounce">🎙️</span>
                <h3 className="text-lg font-black text-[#2a1810]">
                  बोलकर दर्ज करें <span className="text-xs font-normal text-[#7d5e49]">/ Speak</span>
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="h-8 w-8 rounded-full bg-[#ead9c4] text-sm font-bold text-[#5c4638] hover:bg-[#dbc3a8]"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-[#5c4638]">
              डेमो के लिए किसी भी वाक्य पर टैप करें या बोलें:
            </p>

            <div className="mt-4 space-y-2.5">
              {[
                {
                  productId: "lal_chudi",
                  size: "2-6",
                  qty: 450,
                  date: "2026-09-08",
                  text: "लाल चूड़ी 450 पीस 2-6 साइज़ कल तक",
                  sub: "Red bangle 450 pcs size 2-6 by tomorrow",
                  icon: "🔴",
                },
                {
                  productId: "lal_chudi",
                  size: "2-6",
                  qty: 500,
                  date: "2026-09-08",
                  text: "लाल चूड़ी 500 पीस मानक साइज़ 8 तारीख",
                  sub: "Red bangle 500 pcs standard size 8 Sep",
                  icon: "🔴",
                },
                {
                  productId: "neeli_chudi",
                  size: "2-6",
                  qty: 300,
                  date: "2026-09-09",
                  text: "नीली चूड़ी 300 पीस साइज़ 2-6 परसों तक",
                  sub: "Blue bangle 300 pcs size 2-6 by 9 Sep",
                  icon: "🔵",
                },
                {
                  productId: "lal_chudi",
                  size: "2-4",
                  qty: 200,
                  date: "2026-09-08",
                  text: "लाल चूड़ी 200 पीस साइज़ 2-4",
                  sub: "Red bangle 200 pcs size 2-4",
                  icon: "🔴",
                },
              ].map((phrase, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectVoicePhrase(phrase)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-[#ead9c4] bg-white p-3 text-left transition hover:border-[#8b1e14] hover:bg-[#fff6e8] active:scale-98"
                >
                  <span className="text-2xl mt-0.5">{phrase.icon}</span>
                  <div>
                    <p className="font-bold text-sm text-[#2a1810]">&ldquo;{phrase.text}&rdquo;</p>
                    <p className="text-[11px] text-[#7d5e49]">{phrase.sub}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="w-full rounded-2xl bg-[#ead9c4] py-3 text-sm font-bold text-[#5c4638] hover:bg-[#dbc3a8]"
              >
                बंद करें / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
