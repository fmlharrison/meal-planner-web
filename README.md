# meal-planner-web

The PWA for the personal project that will help me plan meals, extract recipes and build shopping lists.

API types are generated from `meal-planner-api`'s OpenAPI spec via `npm run generate:types`. Never hand-edit `src/types/api.d.ts` or `src/types/api.zod.ts`.

## Local development

```bash
# Terminal A — API (sibling repo)
cd ../meal-planner-api && bin/rails s   # http://localhost:3000

# Terminal B — web
npm run dev                             # http://localhost:5173
```

Vite proxies `/api/*` → `http://localhost:3000/*`.

## End-to-end tests (Playwright)

Requires the API running on `:3000` (real Postgres). The Playwright config starts Vite itself.

```bash
# API must already be up
cd ../meal-planner-api && bin/rails s

# Then, in this repo:
npx playwright install chromium   # once per machine
npm run test:e2e                  # headless
npm run test:e2e:ui               # interactive debugger
```

Suite lives in `e2e/` (P0 core-loop + P1 feature specs). CI wiring is a Phase 1.5 item — see `meal-planner-api` docs/ROADMAP.md.
