# Kanch-Net

Student demo for Firozabad glass households. Small home piles become one matching buyer order. Money screens are fake.

## How to run

```bash
npm install
npm run dev
```

Open http://localhost:3000 (http://127.0.0.1:3000 also works)

Login code is always **1234**

| Phone | Who | Page |
|---|---|---|
| 9000000001 | Family 1 | Phone |
| 9000000002 | Family 2 | Phone |
| 9000000003 | Family 3 (blue pile) | Phone |
| 9000000010 | Collector | Pickup |
| 9000000020 | Coordinator | Matching |
| 9000000030 | Buyer | Matching |

## Shared glue (lead-owned `lib/`)

Builders may **import** these; do not rewrite them in your folder:

- `lib/match.ts` — Person B: IN/OUT with a simple reason (B-003 blue → out)
- `lib/settlement.ts` — Person C: pay **accepted** qty only; mark simulated
- `data/starter-list.json` — demo users, ORD-001, starter piles

## Team files

Send builders these from `team-guide/`:
- `01-EVERYONE-READ-THIS.txt`
- `08-KANCH-NET-PRD.txt`
- `09-CHATGPT-ZERO-SETUP.txt`
- their role file

Lead uses Cursor. Person A, B, C use ChatGPT (teacher) + Antigravity (code) on this same repo.
