# Kanch-Net

Student demo for Firozabad glass households. Small home piles become one matching buyer lot. The in-app money pool shows booking, pool, and release. No live UPI or bank.

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000 (http://127.0.0.1:3000 also works)

Login code is always **1234**. Demo phones are behind **Demo help** on the login page.

| Phone | Who | Page |
|---|---|---|
| 9000000001 | Ramesh | Artisan home |
| 9000000002 | Suresh | Artisan home |
| 9000000003 | Imran (blue pile) | Artisan home |
| 9000000010 | Collector | Pickup |
| 9000000020 | Coordinator | Matching (staff) |
| 9000000030 | Buyer | Buyer home |

Artisan home defaults to Hindi; buyer home defaults to English. Switch with **हिन्दी | English**. Buyer can cancel extra demands they posted, not ORD-001, and not after a demo is accepted.

## Four demo features

1. **Chat + demo piece** — Ramesh (`9000000001`) opens Chat on the buyer demand, sends a red demo. Buyer (`9000000030`) Accepts (qty locks) or Rejects (pile stays in the pool). Confirm stays closed until a demo is accepted.
2. **Money pool** — After accept, buyer Pay booking (25%), then Confirm (rest into the pool). Collector (`9000000010`) QC on pickup. Money page and buyer home show Booking / In pool / Released / Returned. Released uses accepted pieces; rejected money returns to the buyer.
3. **Map** — `/map` Leaflet + OSM pins (vendored in `public/leaflet`). Spec match still comes first; the map is “people near you”.
4. **Reliability** — Score on artisan bio and on buyer stock rows. Ramesh starts high. Imran starts lower (blue / rejects). After QC, accepted ÷ (accepted + rejected).

Pottery and textile stay “making in process”. Matching IN/OUT is unchanged.

## Shared glue (lead-owned `lib/`)

Builders may **import** these; do not rewrite them in your folder:

- `lib/match.ts` — Person B: IN/OUT with a simple reason (B-003 blue → out)
- `lib/settlement.ts` — Person C: pay **accepted** qty only
- `lib/store.ts` — piles, demands, chat threads, money pool (localStorage)
- `data/starter-list.json` — demo users, ORD-001, starter piles

## Team files

Send builders these from `team-guide/`:

- `01-EVERYONE-READ-THIS.txt`
- `12-KANCH-NET-PRD-AS-BUILT.txt` (live product + locked MVP: GST, Aadhaar, locations)
- `09-CHATGPT-ZERO-SETUP.txt`
- their role file

Lead uses Cursor. Person A, B, C use ChatGPT (teacher) + Antigravity (code) on this same repo.
