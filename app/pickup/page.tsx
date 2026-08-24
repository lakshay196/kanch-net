"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import starter from "@/data/starter-list.json";
import AppHeader from "@/components/AppHeader";
import NeedLogin from "@/components/NeedLogin";
import OwnerNote from "@/components/OwnerNote";

const STORAGE_KEY = "kanch-person-c-batches";

const REASON_OPTIONS = [
  "Wrong colour",
  "Wrong size",
  "Broken",
  "Short quantity",
  "Packing",
  "Duplicate ID",
  "Other",
];

type BatchRecord = {
  batchId: string;
  householdId: string;
  locality: string;
  declaredQty: number;
  collectedQty: number | null;
  condition: "OK" | "Damaged" | null;
  acceptedQty: number | null;
  rejectedQty: number | null;
  damagedQty: number | null;
  status: string;
  rejectionReason: string | null;
};

export default function PickupPage() {
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Pickup Form state
  const [batchInput, setBatchInput] = useState("");
  const [collectedInput, setCollectedInput] = useState<string>("");
  const [conditionInput, setConditionInput] = useState<"OK" | "Damaged">("OK");
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [pickupSuccess, setPickupSuccess] = useState<string | null>(null);

  // Selected batch for Quality Check
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  // Quality Check Form state
  const [acceptedInput, setAcceptedInput] = useState<string>("");
  const [rejectedInput, setRejectedInput] = useState<string>("0");
  const [damagedInput, setDamagedInput] = useState<string>("0");
  const [reasonInput, setReasonInput] = useState<string>(REASON_OPTIONS[0]);
  const [qcError, setQcError] = useState<string | null>(null);
  const [qcSuccess, setQcSuccess] = useState<string | null>(null);

  // Initialize data from localStorage or starter-list.json
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const savedMap: Record<string, Partial<BatchRecord>> = saved ? JSON.parse(saved) : {};

      const initialBatches: BatchRecord[] = starter.piles.map((pile) => {
        const override = savedMap[pile.batchId] || {};
        return {
          batchId: pile.batchId,
          householdId: pile.householdId,
          locality: pile.locality,
          declaredQty: pile.declaredQty,
          collectedQty:
            override.collectedQty !== undefined ? override.collectedQty : pile.collectedQty,
          condition: override.condition !== undefined ? override.condition : pile.collectedQty ? "OK" : null,
          acceptedQty:
            override.acceptedQty !== undefined ? override.acceptedQty : pile.acceptedQty,
          rejectedQty:
            override.rejectedQty !== undefined ? override.rejectedQty : pile.rejectedQty,
          damagedQty:
            override.damagedQty !== undefined ? override.damagedQty : pile.damagedQty,
          status: override.status !== undefined ? override.status : pile.status,
          rejectionReason:
            override.rejectionReason !== undefined
              ? override.rejectionReason
              : pile.rejectionReason,
        };
      });

      // Also include any user-created custom batch IDs not in starter list
      Object.keys(savedMap).forEach((id) => {
        if (!initialBatches.some((b) => b.batchId === id)) {
          const item = savedMap[id];
          initialBatches.unshift({
            batchId: id,
            householdId: item.householdId || "Custom",
            locality: item.locality || "Local",
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
      // Fallback
      setBatches(
        starter.piles.map((pile) => ({
          batchId: pile.batchId,
          householdId: pile.householdId,
          locality: pile.locality,
          declaredQty: pile.declaredQty,
          collectedQty: pile.collectedQty,
          condition: pile.collectedQty ? "OK" : null,
          acceptedQty: pile.acceptedQty,
          rejectedQty: pile.rejectedQty,
          damagedQty: pile.damagedQty,
          status: pile.status,
          rejectionReason: pile.rejectionReason,
        }))
      );
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever batches update (after mount)
  const persistBatches = (updatedList: BatchRecord[]) => {
    try {
      const map: Record<string, BatchRecord> = {};
      updatedList.forEach((b) => {
        map[b.batchId] = b;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    } catch {
      // Ignore storage errors
    }
  };

  // Helper to sync QC form when selected batch changes
  const handleSelectBatchForQC = (batch: BatchRecord) => {
    setSelectedBatchId(batch.batchId);
    setAcceptedInput(
      batch.acceptedQty !== null ? String(batch.acceptedQty) : String(batch.collectedQty ?? "")
    );
    setRejectedInput(batch.rejectedQty !== null ? String(batch.rejectedQty) : "0");
    setDamagedInput(batch.damagedQty !== null ? String(batch.damagedQty) : "0");
    setReasonInput(batch.rejectionReason || REASON_OPTIONS[0]);
    setQcError(null);
    setQcSuccess(null);
  };

  // Handle Pickup Form Submit
  const handleMarkCollected = (e: React.FormEvent) => {
    e.preventDefault();
    setPickupError(null);
    setPickupSuccess(null);

    const cleanBatchId = batchInput.trim().toUpperCase();
    if (!cleanBatchId) {
      setPickupError("Please enter a valid Batch / Pile ID (e.g. B-001).");
      return;
    }

    if (collectedInput.trim() === "") {
      setPickupError("Please enter the collected quantity.");
      return;
    }

    const qty = Number(collectedInput);
    if (isNaN(qty) || qty < 0 || !Number.isInteger(qty)) {
      setPickupError("Collected quantity must be a valid non-negative whole number (0 or greater).");
      return;
    }

    let updatedList: BatchRecord[];
    const existingIndex = batches.findIndex(
      (b) => b.batchId.toUpperCase() === cleanBatchId
    );

    let updatedBatch: BatchRecord;

    if (existingIndex >= 0) {
      const prev = batches[existingIndex];
      updatedBatch = {
        ...prev,
        collectedQty: qty,
        condition: conditionInput,
        status: prev.status === "accepted" ? "accepted" : "collected",
      };
      updatedList = [...batches];
      updatedList[existingIndex] = updatedBatch;
    } else {
      updatedBatch = {
        batchId: cleanBatchId,
        householdId: "HH-New",
        locality: "Local Cluster",
        declaredQty: qty,
        collectedQty: qty,
        condition: conditionInput,
        acceptedQty: null,
        rejectedQty: null,
        damagedQty: null,
        status: "collected",
        rejectionReason: null,
      };
      updatedList = [updatedBatch, ...batches];
    }

    setBatches(updatedList);
    persistBatches(updatedList);

    setPickupSuccess(
      `Batch ${cleanBatchId} marked as COLLECTED (Qty: ${qty}, Condition: ${conditionInput})`
    );

    // Auto-select for Quality Check
    handleSelectBatchForQC(updatedBatch);
  };

  // Handle Quality Check Submit
  const handleSaveQualityCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setQcError(null);
    setQcSuccess(null);

    const activeBatch = batches.find((b) => b.batchId === selectedBatchId);
    if (!activeBatch) {
      setQcError("No batch selected for quality check.");
      return;
    }

    if (activeBatch.collectedQty === null) {
      setQcError("This batch has not been collected yet. Mark it collected first.");
      return;
    }

    if (acceptedInput.trim() === "" || rejectedInput.trim() === "" || damagedInput.trim() === "") {
      setQcError("Please fill in Accepted, Rejected, and Damaged quantities.");
      return;
    }

    const accepted = Number(acceptedInput);
    const rejected = Number(rejectedInput);
    const damaged = Number(damagedInput);

    if (
      isNaN(accepted) ||
      isNaN(rejected) ||
      isNaN(damaged) ||
      accepted < 0 ||
      rejected < 0 ||
      damaged < 0 ||
      !Number.isInteger(accepted) ||
      !Number.isInteger(rejected) ||
      !Number.isInteger(damaged)
    ) {
      setQcError("Quantities must be non-negative whole numbers (0 or greater).");
      return;
    }

    const totalQC = accepted + rejected + damaged;
    if (totalQC > activeBatch.collectedQty) {
      setQcError(
        `Total checked (${totalQC} = ${accepted} accepted + ${rejected} rejected + ${damaged} damaged) cannot exceed collected quantity (${activeBatch.collectedQty}).`
      );
      return;
    }

    const rejectionReason = rejected > 0 || damaged > 0 ? reasonInput : null;

    const updatedList = batches.map((b) => {
      if (b.batchId === selectedBatchId) {
        return {
          ...b,
          acceptedQty: accepted,
          rejectedQty: rejected,
          damagedQty: damaged,
          rejectionReason: rejectionReason,
          status: "accepted",
        };
      }
      return b;
    });

    setBatches(updatedList);
    persistBatches(updatedList);
    setQcSuccess("QUALITY CHECK SAVED");
  };

  const selectedBatch = batches.find((b) => b.batchId === selectedBatchId);

  return (
    <>
      <AppHeader />
      <NeedLogin>
        {() => (
          <main className="mx-auto max-w-3xl px-4 py-6">
            {/* Title & Scope Note */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h1 className="text-3xl font-bold text-[#2a1810]">Pickup + Quality Check</h1>
                <p className="mt-1 text-[#5c4638]">
                  Person C Demo: Field collection and quality inspection for glass piles.
                </p>
              </div>
              <Link
                href="/money"
                className="inline-flex items-center justify-center rounded-xl bg-[#8b1e14] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#72180f] transition-colors"
              >
                Go to Simulated Money →
              </Link>
            </div>

            <div className="mt-4">
              <OwnerNote who="Person C" folder="app/pickup" />
            </div>

            {/* Section 1: Pickup Form */}
            <section className="mt-6 rounded-2xl border border-[#ead9c4] bg-white p-5 shadow-sm">
              <div className="border-b border-[#f3e7d8] pb-3">
                <span className="inline-block rounded-full bg-[#f6efe4] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8b1e14]">
                  Step 1
                </span>
                <h2 className="mt-1 text-xl font-bold text-[#2a1810]">1. Field Pickup Collection</h2>
                <p className="text-xs text-[#5c4638]">
                  Manual entry for field collectors (no camera or barcode scanner required).
                </p>
              </div>

              <form onSubmit={handleMarkCollected} className="mt-4 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Batch / Pile ID */}
                  <div>
                    <label
                      htmlFor="batchId"
                      className="block text-sm font-semibold text-[#2a1810]"
                    >
                      Batch / Pile ID <span className="text-[#8b1e14]">*</span>
                    </label>
                    <input
                      id="batchId"
                      type="text"
                      placeholder="e.g. B-001"
                      value={batchInput}
                      onChange={(e) => setBatchInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d9c5b2] bg-[#fffaf3] px-3.5 py-2.5 text-sm font-medium text-[#2a1810] focus:border-[#8b1e14] focus:outline-none focus:ring-1 focus:ring-[#8b1e14]"
                    />
                    <span className="mt-1 block text-xs text-[#7d6756]">
                      Type any batch ID or click a pile below.
                    </span>
                  </div>

                  {/* Collected Quantity */}
                  <div>
                    <label
                      htmlFor="collectedQty"
                      className="block text-sm font-semibold text-[#2a1810]"
                    >
                      Collected Quantity <span className="text-[#8b1e14]">*</span>
                    </label>
                    <input
                      id="collectedQty"
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 450"
                      value={collectedInput}
                      onChange={(e) => setCollectedInput(e.target.value)}
                      className="mt-1.5 w-full rounded-xl border border-[#d9c5b2] bg-[#fffaf3] px-3.5 py-2.5 text-sm font-medium text-[#2a1810] focus:border-[#8b1e14] focus:outline-none focus:ring-1 focus:ring-[#8b1e14]"
                    />
                    <span className="mt-1 block text-xs text-[#7d6756]">
                      Must be 0 or greater.
                    </span>
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-semibold text-[#2a1810]">
                    Pile Physical Condition
                  </label>
                  <div className="mt-2 flex gap-4">
                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#ead9c4] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#2a1810] hover:bg-[#fbf4ea]">
                      <input
                        type="radio"
                        name="condition"
                        value="OK"
                        checked={conditionInput === "OK"}
                        onChange={() => setConditionInput("OK")}
                        className="accent-[#8b1e14]"
                      />
                      <span>OK (Good condition)</span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#ead9c4] bg-[#fffaf3] px-4 py-2 text-sm font-medium text-[#2a1810] hover:bg-[#fbf4ea]">
                      <input
                        type="radio"
                        name="condition"
                        value="Damaged"
                        checked={conditionInput === "Damaged"}
                        onChange={() => setConditionInput("Damaged")}
                        className="accent-[#8b1e14]"
                      />
                      <span>Damaged (Noticeable transit issues)</span>
                    </label>
                  </div>
                </div>

                {pickupError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                    ⚠️ {pickupError}
                  </div>
                )}

                {pickupSuccess && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
                    ✓ {pickupSuccess}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#8b1e14] px-4 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-[#72180f] active:scale-[0.99] transition-all"
                >
                  Mark as Collected
                </button>
              </form>
            </section>

            {/* Section 2: Quality Check */}
            <section className="mt-6 rounded-2xl border border-[#ead9c4] bg-white p-5 shadow-sm">
              <div className="border-b border-[#f3e7d8] pb-3">
                <span className="inline-block rounded-full bg-[#f6efe4] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#8b1e14]">
                  Step 2
                </span>
                <h2 className="mt-1 text-xl font-bold text-[#2a1810]">2. Quality Check Section</h2>
                <p className="text-xs text-[#5c4638]">
                  Inspect collected piles. Only accepted pieces will be eligible for settlement on the Money page.
                </p>
              </div>

              {/* Batch Selector / Info */}
              <div className="mt-4">
                <label
                  htmlFor="selectQcBatch"
                  className="block text-sm font-semibold text-[#2a1810]"
                >
                  Select Collected Batch to Inspect:
                </label>
                <div className="mt-1.5 flex gap-2">
                  <select
                    id="selectQcBatch"
                    value={selectedBatchId}
                    onChange={(e) => {
                      const found = batches.find((b) => b.batchId === e.target.value);
                      if (found) handleSelectBatchForQC(found);
                    }}
                    className="w-full rounded-xl border border-[#d9c5b2] bg-[#fffaf3] px-3.5 py-2.5 text-sm font-medium text-[#2a1810] focus:border-[#8b1e14] focus:outline-none focus:ring-1 focus:ring-[#8b1e14]"
                  >
                    <option value="">-- Choose a batch --</option>
                    {batches.map((b) => (
                      <option key={b.batchId} value={b.batchId}>
                        {b.batchId} ({b.locality}) — Status: {b.status.toUpperCase()} | Collected:{" "}
                        {b.collectedQty ?? "Not yet"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedBatch ? (
                <div className="mt-4 space-y-4">
                  {/* Current Status Overview */}
                  <div className="rounded-xl border border-[#f0e3d2] bg-[#fffaf3] p-4 text-xs sm:text-sm">
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div>
                        <span className="text-[#7d6756]">Batch ID:</span>
                        <div className="font-bold text-[#2a1810]">{selectedBatch.batchId}</div>
                      </div>
                      <div>
                        <span className="text-[#7d6756]">Status:</span>
                        <div className="font-bold text-[#8b1e14] uppercase">
                          {selectedBatch.status}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#7d6756]">Collected Qty:</span>
                        <div className="font-bold text-[#2a1810]">
                          {selectedBatch.collectedQty !== null ? selectedBatch.collectedQty : "Not Collected"}
                        </div>
                      </div>
                      <div>
                        <span className="text-[#7d6756]">Condition:</span>
                        <div className="font-bold text-[#2a1810]">
                          {selectedBatch.condition || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedBatch.collectedQty === null ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
                      ℹ️ This batch has not been collected yet. Please submit the pickup form in Step 1 first.
                    </div>
                  ) : (
                    <form onSubmit={handleSaveQualityCheck} className="space-y-4">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {/* Accepted */}
                        <div>
                          <label
                            htmlFor="acceptedQty"
                            className="block text-xs font-bold text-green-800 uppercase"
                          >
                            Accepted Quantity
                          </label>
                          <input
                            id="acceptedQty"
                            type="number"
                            min="0"
                            step="1"
                            value={acceptedInput}
                            onChange={(e) => setAcceptedInput(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-green-300 bg-green-50/50 px-3 py-2 text-sm font-bold text-[#2a1810] focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                          />
                          <span className="mt-1 block text-[11px] text-green-700">
                            Eligible for settlement
                          </span>
                        </div>

                        {/* Rejected */}
                        <div>
                          <label
                            htmlFor="rejectedQty"
                            className="block text-xs font-bold text-red-800 uppercase"
                          >
                            Rejected Quantity
                          </label>
                          <input
                            id="rejectedQty"
                            type="number"
                            min="0"
                            step="1"
                            value={rejectedInput}
                            onChange={(e) => setRejectedInput(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-red-300 bg-red-50/50 px-3 py-2 text-sm font-bold text-[#2a1810] focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
                          />
                          <span className="mt-1 block text-[11px] text-red-700">
                            Never paid (₹0)
                          </span>
                        </div>

                        {/* Damaged */}
                        <div>
                          <label
                            htmlFor="damagedQty"
                            className="block text-xs font-bold text-amber-800 uppercase"
                          >
                            Damaged Quantity
                          </label>
                          <input
                            id="damagedQty"
                            type="number"
                            min="0"
                            step="1"
                            value={damagedInput}
                            onChange={(e) => setDamagedInput(e.target.value)}
                            className="mt-1 w-full rounded-xl border border-amber-300 bg-amber-50/50 px-3 py-2 text-sm font-bold text-[#2a1810] focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-600"
                          />
                          <span className="mt-1 block text-[11px] text-amber-700">
                            Never paid (₹0)
                          </span>
                        </div>
                      </div>

                      {/* Reason */}
                      <div>
                        <label
                          htmlFor="qcReason"
                          className="block text-sm font-semibold text-[#2a1810]"
                        >
                          Rejection / Damage Reason
                        </label>
                        <select
                          id="qcReason"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          className="mt-1.5 w-full rounded-xl border border-[#d9c5b2] bg-[#fffaf3] px-3.5 py-2 text-sm font-medium text-[#2a1810] focus:border-[#8b1e14] focus:outline-none focus:ring-1 focus:ring-[#8b1e14]"
                        >
                          {REASON_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>

                      {qcError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                          ⚠️ {qcError}
                        </div>
                      )}

                      {qcSuccess && (
                        <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-green-900 shadow-xs">
                          <div className="flex items-center gap-2 font-bold text-base text-green-800">
                            <span>✓</span>
                            <span>QUALITY CHECK SAVED</span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs border-t border-green-200 pt-2">
                            <div>
                              <span className="text-green-700">Batch ID:</span>{" "}
                              <strong>{selectedBatch.batchId}</strong>
                            </div>
                            <div>
                              <span className="text-green-700">Collected:</span>{" "}
                              <strong>{selectedBatch.collectedQty}</strong>
                            </div>
                            <div>
                              <span className="text-green-700">Accepted:</span>{" "}
                              <strong className="text-green-800">{selectedBatch.acceptedQty}</strong>
                            </div>
                            <div>
                              <span className="text-red-700">Rejected:</span>{" "}
                              <strong>{selectedBatch.rejectedQty}</strong>
                            </div>
                            <div>
                              <span className="text-amber-700">Damaged:</span>{" "}
                              <strong>{selectedBatch.damagedQty}</strong>
                            </div>
                            <div>
                              <span className="text-stone-700">Reason:</span>{" "}
                              <strong>{selectedBatch.rejectionReason || "None"}</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        type="submit"
                        className="w-full rounded-xl bg-[#2a1810] px-4 py-3 text-center text-sm font-bold text-white shadow-sm hover:bg-[#1a0f0a] active:scale-[0.99] transition-all"
                      >
                        Save Quality Result
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[#7d6756]">
                  Select or submit a batch above to perform a quality check.
                </p>
              )}
            </section>

            {/* Section 3: All Batches Overview */}
            <section className="mt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#2a1810]">All Batches Overview</h2>
                <span className="text-xs text-[#7d6756]">
                  Click any batch to populate forms
                </span>
              </div>

              <div className="mt-3 space-y-2">
                {batches.map((pile) => {
                  const isCollected = pile.collectedQty !== null;
                  const isAccepted = pile.status === "accepted";

                  return (
                    <div
                      key={pile.batchId}
                      onClick={() => {
                        setBatchInput(pile.batchId);
                        setCollectedInput(
                          pile.collectedQty !== null
                            ? String(pile.collectedQty)
                            : String(pile.declaredQty)
                        );
                        if (pile.condition) {
                          setConditionInput(pile.condition);
                        }
                        handleSelectBatchForQC(pile);
                      }}
                      className="group flex cursor-pointer flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-[#ead9c4] bg-white p-4 shadow-xs hover:border-[#8b1e14] hover:bg-[#fffdfa] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-base font-bold text-[#8b1e14] group-hover:underline">
                          {pile.batchId}
                        </span>
                        <span className="text-xs text-[#7d6756]">
                          {pile.householdId} · {pile.locality}
                        </span>
                      </div>

                      <div className="mt-2 sm:mt-0 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-md bg-[#f6efe4] px-2 py-1 font-medium text-[#5c4638]">
                          {pile.declaredQty} declared
                        </span>

                        {isCollected ? (
                          <span className="rounded-md bg-blue-50 px-2 py-1 font-semibold text-blue-700">
                            {pile.collectedQty} collected
                          </span>
                        ) : (
                          <span className="rounded-md bg-stone-100 px-2 py-1 text-stone-500">
                            uncollected
                          </span>
                        )}

                        {isAccepted ? (
                          <span className="rounded-md bg-green-50 px-2 py-1 font-bold text-green-700">
                            {pile.acceptedQty} accepted
                            {pile.rejectedQty ? ` · ${pile.rejectedQty} rej` : ""}
                            {pile.damagedQty ? ` · ${pile.damagedQty} dam` : ""}
                          </span>
                        ) : null}

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                            pile.status === "accepted"
                              ? "bg-green-100 text-green-800"
                              : pile.status === "collected"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {pile.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </main>
        )}
      </NeedLogin>
    </>
  );
}
