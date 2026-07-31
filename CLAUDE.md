# meal-planner-web (React PWA)

Shared `docs/` (ARCHITECTURE.md, ROADMAP.md, STATUS.md) live in the `meal-planner-api` repo, not here — read them there before starting work. If it's checked out as a sibling directory, that's `../meal-planner-api/docs/`; otherwise pull the current versions from that repo on GitHub.

## Before doing anything
Read, in order, from `meal-planner-api`'s docs:
1. `docs/STATUS.md` — actual current state, what's built, what's in progress, open decisions
2. `docs/ARCHITECTURE.md` — stack, data model, system design, and §5 for the type-generation workflow this repo depends on
3. `docs/ROADMAP.md` — the phase plan (planned, not necessarily current — STATUS.md wins on conflicts)

## Working conventions
- Terse, self-documenting code. No gold-plating, no speculative abstraction for features not yet in the current phase.
- Stage changes; don't commit unless explicitly told to.
- Never hand-edit `src/types/api.d.ts` or `src/types/api.zod.ts` — they're generated from the API repo's OpenAPI spec via the `generate:types` script. If the API shape changed, run that script, don't patch the generated files.
- Validate API responses through the generated Zod schemas at the network boundary (see ARCHITECTURE.md §5) rather than trusting the TS types alone.
- If a decision deviates from ARCHITECTURE.md or ROADMAP.md, note it — it should go in `meal-planner-api`'s `docs/STATUS.md` Decisions log since that's the single shared log for both repos.

## End of session
Before finishing:
- Flag in chat (for the user to carry into `meal-planner-api`'s `docs/STATUS.md`) anything completed, in progress, or decided — this repo doesn't hold its own status log by design, to avoid two conflicting sources of truth
- If a type regen is needed and wasn't run, say so explicitly
