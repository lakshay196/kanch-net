import starter from "@/data/starter-list.json";
import { HOUSE_PLACE } from "@/lib/places";
import type { Pile } from "@/lib/types";

const PILE_KEY = "kanch-shared-piles";
const DEMAND_KEY = "kanch-shared-demands";
const OLD_PHONE_KEY = "kanch-artisan-piles";
const THREAD_KEY = "kanch-chat-threads";
const POOL_KEY = "kanch-money-pools";
/** Person C pickup/money writes QC here. Lead reads it for pool + score. */
export const COLLECTOR_BATCH_KEY = "kanch-person-c-batches";
const STORE_EVENT = "kanch-store";

export type Demand = {
  demandId: string;
  buyerName: string;
  productFamily: string;
  size: string;
  colourFamily: string;
  grade: string;
  quantityNeeded: number;
  locality: string;
};

export type ChatFrom = "artisan" | "buyer" | "system";

export type ChatMessage = {
  id: string;
  at: string;
  from: ChatFrom;
  text: string;
};

export type DemoStatus = "none" | "sent" | "accepted" | "rejected";

export type DemoPiece = {
  colourFamily: string;
  qty: number;
  photoUrl: string;
  sentAt: string;
};

export type ChatThread = {
  threadId: string;
  demandId: string;
  batchId: string;
  householdId: string;
  messages: ChatMessage[];
  demo: DemoPiece | null;
  demoStatus: DemoStatus;
};

export type MoneyPool = {
  demandId: string;
  qtyLocked: number | null;
  bookingPaid: boolean;
  bookingInr: number;
  remainingInr: number;
  confirmed: boolean;
};

export type CollectorOverride = {
  batchId?: string;
  householdId?: string;
  locality?: string;
  colourFamily?: string;
  declaredQty?: number;
  collectedQty?: number | null;
  condition?: "OK" | "Damaged" | null;
  acceptedQty?: number | null;
  rejectedQty?: number | null;
  damagedQty?: number | null;
  status?: string;
  rejectionReason?: string | null;
};

function asPile(raw: Record<string, unknown>): Pile | null {
  const batchId = String(raw["batchId"] ?? "");
  const householdId = String(raw["householdId"] ?? "");
  if (!batchId || !householdId) return null;
  return {
    batchId,
    householdId,
    locality: String(raw.locality ?? HOUSE_PLACE[householdId] ?? "Ramnagar"),
    productFamily: String(raw["productFamily"] ?? "glass_bangle"),
    size: String(raw.size ?? "2-6"),
    colourFamily: String(raw["colourFamily"] ?? "ruby_red"),
    finish: String(raw.finish ?? "plain_glossy"),
    grade: String(raw.grade ?? "B"),
    declaredQty: Number(raw["declaredQty"] ?? 0),
    collectedQty: (raw["collectedQty"] as number | null) ?? null,
    acceptedQty: (raw["acceptedQty"] as number | null) ?? null,
    rejectedQty: (raw["rejectedQty"] as number | null) ?? null,
    damagedQty: (raw["damagedQty"] as number | null) ?? null,
    status: String(raw.status ?? "declared"),
    rejectionReason: (raw["rejectionReason"] as string | null) ?? null,
    readyDate: String(raw["readyDate"] ?? "2026-09-08"),
    spokenTerm: String(raw["spokenTerm"] ?? "lal chudi"),
  };
}

function readJsonArray(key: string): unknown[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function notifyStore() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(STORE_EVENT));
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
  notifyStore();
}

export function onStoreChange(fn: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("focus", fn);
  window.addEventListener("storage", fn);
  window.addEventListener(STORE_EVENT, fn);
  return () => {
    window.removeEventListener("focus", fn);
    window.removeEventListener("storage", fn);
    window.removeEventListener(STORE_EVENT, fn);
  };
}

function starterPiles(): Pile[] {
  return (starter.piles as unknown as Record<string, unknown>[])
    .map(asPile)
    .filter((p): p is Pile => p !== null);
}

export function seedDemand(): Demand {
  const order = starter.order;
  return {
    demandId: order["orderId"] as unknown as string,
    buyerName: "Wholesale buyer",
    productFamily: order["productFamily"] as unknown as string,
    size: order.size,
    colourFamily: order["colourFamily"] as unknown as string,
    grade: order["minGrade"] as unknown as string,
    quantityNeeded: order["quantityNeeded"] as unknown as number,
    locality: "Firozabad mandi",
  };
}

export function loadPiles(): Pile[] {
  const extras = [...readJsonArray(PILE_KEY), ...readJsonArray(OLD_PHONE_KEY)]
    .map((item) => asPile(item as Record<string, unknown>))
    .filter((p): p is Pile => p !== null);

  const seen = new Set<string>();
  const out: Pile[] = [];
  for (const pile of [...starterPiles(), ...extras]) {
    if (seen.has(pile.batchId)) continue;
    seen.add(pile.batchId);
    out.push(pile);
  }
  return out;
}

export function loadCollectorMap(): Record<string, CollectorOverride> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(COLLECTOR_BATCH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, CollectorOverride>;
  } catch {
    return {};
  }
}

/** Pickup/money write QC here so pool + score refresh in the same tab. */
export function saveCollectorMap(map: Record<string, CollectorOverride>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COLLECTOR_BATCH_KEY, JSON.stringify(map));
  notifyStore();
}

export function pileWithQc(pile: Pile): Pile {
  const override = loadCollectorMap()[pile.batchId];
  if (!override) return pile;
  return {
    ...pile,
    householdId: override.householdId || pile.householdId,
    locality: override.locality || pile.locality,
    colourFamily: override.colourFamily || pile.colourFamily,
    declaredQty: override.declaredQty ?? pile.declaredQty,
    collectedQty:
      override.collectedQty !== undefined ? override.collectedQty : pile.collectedQty,
    acceptedQty:
      override.acceptedQty !== undefined ? override.acceptedQty : pile.acceptedQty,
    rejectedQty:
      override.rejectedQty !== undefined ? override.rejectedQty : pile.rejectedQty,
    damagedQty:
      override.damagedQty !== undefined ? override.damagedQty : pile.damagedQty,
    status: override.status || pile.status,
    rejectionReason:
      override.rejectionReason !== undefined
        ? override.rejectionReason
        : pile.rejectionReason,
  };
}

export function loadPilesWithQc(): Pile[] {
  return loadPiles().map(pileWithQc);
}

export function loadExtraPiles(): Pile[] {
  const starterIds = new Set(starterPiles().map((p) => p.batchId));
  return loadPiles().filter((p) => !starterIds.has(p.batchId));
}

export function saveExtraPile(pile: Pile) {
  const extras = loadExtraPiles().filter((p) => p.batchId !== pile.batchId);
  extras.push(pile);
  writeJson(PILE_KEY, extras);
}

export function nextBatchId(piles: Pile[]) {
  let max = 20;
  for (const pile of piles) {
    const m = pile.batchId.match(/^B-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `B-${String(max + 1).padStart(3, "0")}`;
}

export function loadDemands(): Demand[] {
  const extras = readJsonArray(DEMAND_KEY) as Demand[];
  const seed = seedDemand();
  const seen = new Set<string>([seed.demandId]);
  const out = [seed];
  for (const demand of extras) {
    if (!demand?.demandId || seen.has(demand.demandId)) continue;
    seen.add(demand.demandId);
    out.push(demand);
  }
  return out;
}

export function isSeedDemand(demandId: string) {
  return demandId === seedDemand().demandId;
}

export function starterBatchIds() {
  return new Set(starterPiles().map((p) => p.batchId));
}

export function isStarterBatch(batchId: string) {
  return starterBatchIds().has(batchId);
}

/** This household’s extras first, then at most one seed pile. */
export function householdStockCards(piles: Pile[], householdId: string): Pile[] {
  const extras: Pile[] = [];
  const seeds: Pile[] = [];
  for (const pile of piles) {
    if (pile.householdId !== householdId) continue;
    if (isStarterBatch(pile.batchId)) seeds.push(pile);
    else extras.push(pile);
  }
  extras.reverse();
  return [...extras, ...seeds.slice(0, 1)];
}

export function saveDemand(demand: Demand) {
  if (isSeedDemand(demand.demandId)) return;
  const extras = loadDemands().filter(
    (d) => !isSeedDemand(d.demandId) && d.demandId !== demand.demandId,
  );
  extras.push(demand);
  writeJson(DEMAND_KEY, extras);
}

export function demandHasAcceptedDemo(demandId: string) {
  return loadThreads().some(
    (thread) => thread.demandId === demandId && thread.demoStatus === "accepted",
  );
}

export function cancelDemand(demandId: string) {
  if (isSeedDemand(demandId)) return;
  if (demandHasAcceptedDemo(demandId)) return;
  const extras = loadDemands().filter(
    (d) => !isSeedDemand(d.demandId) && d.demandId !== demandId,
  );
  writeJson(DEMAND_KEY, extras);
}

export function nextDemandId(demands: Demand[]) {
  let max = 1;
  for (const demand of demands) {
    const m = demand.demandId.match(/^D-(\d+)$/);
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `D-${String(max + 1).padStart(3, "0")}`;
}

export function threadId(demandId: string, batchId: string) {
  return `${demandId}::${batchId}`;
}

function asThread(raw: unknown): ChatThread | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const threadKey = String(row.threadId ?? "");
  const demandId = String(row.demandId ?? "");
  const batchId = String(row.batchId ?? "");
  const householdId = String(row.householdId ?? "");
  if (!threadKey || !demandId || !batchId || !householdId) return null;
  const demoStatus = row.demoStatus;
  const status: DemoStatus =
    demoStatus === "sent" || demoStatus === "accepted" || demoStatus === "rejected"
      ? demoStatus
      : "none";
  const messagesRaw = Array.isArray(row.messages) ? row.messages : [];
  const demoRaw = row.demo;
  let demo: DemoPiece | null = null;
  if (demoRaw && typeof demoRaw === "object") {
    const d = demoRaw as Record<string, unknown>;
    demo = {
      colourFamily: String(d.colourFamily ?? "ruby_red"),
      qty: Number(d.qty ?? 0),
      photoUrl: String(d.photoUrl ?? ""),
      sentAt: String(d.sentAt ?? ""),
    };
  }
  return {
    threadId: threadKey,
    demandId,
    batchId,
    householdId,
    demoStatus: status,
    demo,
    messages: messagesRaw
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const m = item as Record<string, unknown>;
        const from = m.from;
        const who: ChatFrom =
          from === "artisan" || from === "buyer" || from === "system" ? from : "system";
        return {
          id: String(m.id ?? ""),
          at: String(m.at ?? ""),
          from: who,
          text: String(m.text ?? ""),
        };
      })
      .filter((m): m is ChatMessage => Boolean(m?.id)),
  };
}

export function loadThreads(): ChatThread[] {
  return readJsonArray(THREAD_KEY)
    .map(asThread)
    .filter((t): t is ChatThread => t !== null);
}

function saveThreads(threads: ChatThread[]) {
  writeJson(THREAD_KEY, threads);
}

function newMessage(from: ChatFrom, text: string): ChatMessage {
  return {
    id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    from,
    text,
  };
}

export function ensureThread(input: {
  demandId: string;
  batchId: string;
  householdId: string;
}): ChatThread {
  const id = threadId(input.demandId, input.batchId);
  const threads = loadThreads();
  const existing = threads.find((t) => t.threadId === id);
  if (existing) return existing;
  const created: ChatThread = {
    threadId: id,
    demandId: input.demandId,
    batchId: input.batchId,
    householdId: input.householdId,
    messages: [
      newMessage(
        "system",
        "बात शुरू / Chat open. Artisan sends a demo piece before Confirm.",
      ),
    ],
    demo: null,
    demoStatus: "none",
  };
  threads.push(created);
  saveThreads(threads);
  return created;
}

export function getThread(id: string) {
  return loadThreads().find((t) => t.threadId === id) ?? null;
}

function patchThread(id: string, fn: (thread: ChatThread) => ChatThread) {
  const threads = loadThreads();
  const idx = threads.findIndex((t) => t.threadId === id);
  if (idx < 0) return null;
  const next = fn(threads[idx]);
  threads[idx] = next;
  saveThreads(threads);
  return next;
}

export function postChat(id: string, from: ChatFrom, text: string) {
  const trimmed = text.trim();
  if (!trimmed) return getThread(id);
  return patchThread(id, (thread) => ({
    ...thread,
    messages: [...thread.messages, newMessage(from, trimmed)],
  }));
}

export function sendDemo(
  id: string,
  demo: { colourFamily: string; qty: number; photoUrl: string },
) {
  const qty = Math.max(1, Math.round(demo.qty) || 1);
  const colour = demo.colourFamily === "blue" ? "blue" : "ruby_red";
  const photoUrl = demo.photoUrl.trim();
  return patchThread(id, (thread) => {
    if (thread.demoStatus === "accepted") return thread;
    const piece: DemoPiece = {
      colourFamily: colour,
      qty,
      photoUrl,
      sentAt: new Date().toISOString(),
    };
    const colourWord = colour === "blue" ? "नीली / blue" : "लाल / red";
    return {
      ...thread,
      demo: piece,
      demoStatus: "sent",
      messages: [
        ...thread.messages,
        newMessage(
          "artisan",
          `डेमो टुकड़ा / Demo piece: ${colourWord} · ${qty}${photoUrl ? " · photo" : ""}`,
        ),
      ],
    };
  });
}

export function acceptDemo(id: string): { ok: boolean; reason?: string } {
  const thread = getThread(id);
  if (!thread || thread.demoStatus !== "sent" || !thread.demo) {
    return { ok: false, reason: "No demo piece yet." };
  }
  const taken = loadThreads().find(
    (row) =>
      row.demandId === thread.demandId &&
      row.demoStatus === "accepted" &&
      row.threadId !== id,
  );
  if (taken) {
    return { ok: false, reason: "Another demo is already accepted for this demand." };
  }
  const demand = loadDemands().find((d) => d.demandId === thread.demandId);
  if (!demand) return { ok: false, reason: "Demand missing." };
  patchThread(id, (row) => ({
    ...row,
    demoStatus: "accepted",
    messages: [
      ...row.messages,
      newMessage(
        "system",
        `डेमो स्वीकार / Demo accepted. Quantity locked at ${demand.quantityNeeded}. Cannot shrink.`,
      ),
    ],
  }));
  lockPoolQty(thread.demandId, demand.quantityNeeded);
  return { ok: true };
}

export function rejectDemo(id: string): { ok: boolean; reason?: string } {
  const thread = getThread(id);
  if (!thread || thread.demoStatus !== "sent") {
    return { ok: false, reason: "No demo piece waiting." };
  }
  patchThread(id, (row) => ({
    ...row,
    demoStatus: "rejected",
    messages: [
      ...row.messages,
      newMessage(
        "system",
        "डेमो अस्वीकार / Demo rejected. Pile stays in the pool. No stock waste.",
      ),
    ],
  }));
  return { ok: true };
}

function asPool(raw: unknown): MoneyPool | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const demandId = String(row.demandId ?? "");
  if (!demandId) return null;
  return {
    demandId,
    qtyLocked: row.qtyLocked == null ? null : Number(row.qtyLocked),
    bookingPaid: Boolean(row.bookingPaid),
    bookingInr: Number(row.bookingInr ?? 0),
    remainingInr: Number(row.remainingInr ?? 0),
    confirmed: Boolean(row.confirmed),
  };
}

export function loadPools(): MoneyPool[] {
  return readJsonArray(POOL_KEY)
    .map(asPool)
    .filter((p): p is MoneyPool => p !== null);
}

export function loadPool(demandId: string) {
  return loadPools().find((p) => p.demandId === demandId) ?? null;
}

function savePool(pool: MoneyPool) {
  const rest = loadPools().filter((p) => p.demandId !== pool.demandId);
  rest.push(pool);
  writeJson(POOL_KEY, rest);
}

function orderRates() {
  const order = starter.order;
  return {
    buyer: Number(order.buyerUnitPriceInr),
    booking: Number(order.bookingPercent),
  };
}

function amountsForQty(qty: number) {
  const { buyer, booking } = orderRates();
  const total = qty * buyer;
  const bookingInr = Math.round((total * booking) / 100);
  return { bookingInr, remainingInr: total - bookingInr };
}

function lockPoolQty(demandId: string, qty: number) {
  const existing = loadPool(demandId);
  if (existing?.qtyLocked != null) return;
  savePool({
    demandId,
    qtyLocked: qty,
    bookingPaid: existing?.bookingPaid ?? false,
    bookingInr: existing?.bookingInr ?? 0,
    remainingInr: existing?.remainingInr ?? 0,
    confirmed: existing?.confirmed ?? false,
  });
}

export function payBooking(demandId: string): { ok: boolean; reason?: string } {
  if (!demandHasAcceptedDemo(demandId)) {
    return { ok: false, reason: "Accept a demo piece first." };
  }
  const demand = loadDemands().find((d) => d.demandId === demandId);
  if (!demand) return { ok: false, reason: "Demand missing." };
  const existing = loadPool(demandId);
  if (existing?.bookingPaid) return { ok: true };
  const qty = existing?.qtyLocked ?? demand.quantityNeeded;
  const money = amountsForQty(qty);
  savePool({
    demandId,
    qtyLocked: qty,
    bookingPaid: true,
    bookingInr: money.bookingInr,
    remainingInr: money.remainingInr,
    confirmed: false,
  });
  return { ok: true };
}

export function confirmToPool(demandId: string): { ok: boolean; reason?: string } {
  if (!demandHasAcceptedDemo(demandId)) {
    return { ok: false, reason: "Accept a demo piece before Confirm." };
  }
  const pool = loadPool(demandId);
  if (!pool?.bookingPaid) return { ok: false, reason: "Pay booking first." };
  if (pool.confirmed) return { ok: true };
  savePool({ ...pool, confirmed: true });
  return { ok: true };
}

export function artisanChatPile(piles: Pile[], householdId: string): Pile | null {
  const cards = householdStockCards(piles, householdId);
  if (cards[0]) return cards[0];
  return piles.find((p) => p.householdId === householdId) ?? null;
}
