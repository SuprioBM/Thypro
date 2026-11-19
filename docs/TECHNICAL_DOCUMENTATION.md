# Thypro technical documentation

Status: **demonstration build (simulation).** Not clinically validated. No real users, no partners, no pilot data. Everything shown in Guest mode is invented.

Last updated: 2026-11-20. Branch `zubayer-hasan`.

## 1. What this is

A static single-page web app (Vite 5, React 18, TypeScript strict, Tailwind 3) for building, keeping and restarting healthy habits in the person's own language (English, Bangla, Hindi, Urdu with right-to-left layout). State is a pure reducer. **Guest** keeps it in memory only. **Local** keeps it in the browser's `localStorage`. **Account** (optional email sign-in, no password) syncs it to a Supabase Postgres database protected by row-level security (section 14). The only other server-side code is one serverless function that rewords a coach suggestion (section 6).

## 2. Local setup

```bash
pnpm install            # or: npm install  (both lockfiles are kept in sync)
npm run dev             # http://localhost:3000
npm run typecheck       # tsc --noEmit (strict, noUnusedLocals)
npm run lint            # ESLint 9 + typescript-eslint + react-hooks
npm test                # Vitest, 291 unit tests
npm run db:apply supabase/migrations/<file>.sql   # run SQL on the Supabase project (needs .env.local)
npm run db:test         # row-level-security tests in the database (rolls back)
npm run build           # production build to dist/
npm run test:e2e        # Playwright: builds, serves dist/ on :4173, runs 18 browser tests
npm run check           # typecheck + lint + unit tests + build
```

First e2e run needs the free Chromium download: `npx playwright install chromium`.

Optional environment (see `.env.example`): `VITE_COACH_API_URL` (public proxy URL, no secret) and `GROQ_API_KEY` (server-side only, never `VITE_`-prefixed). Everything works with none of them set.

## 3. Architecture and data flow

```
UI (React screens)  ──dispatch──▶  reducer (pure) ──▶ AppState
        ▲                              │  ▲
        │ useStore()                   │  └── rules modules (pure, versioned):
        │                              │       safety/  planner/  adapt/  coach/
   StoreProvider ──── persistence ─────┘
        │              guest: in-memory only (no storage API imported)
        │              local: localStorage, schema 4, migrated on load
        │              account: Supabase (debounced, retry, audit mirrored)
        └── optional: explainProposal() ──POST──▶ /api/coach-explain ──▶ Groq
```

Key rule: **AI handles wording only.** Risk scoring, the allowed actions, safety limits and consent are deterministic code. The reducer is pure (ids and timestamps arrive inside actions), so the same input always gives the same state, which is what lets the week replay and the tests be exact.

| Area | Where |
|---|---|
| Safety engine (ranges, screening, tobacco referral-only, escalation) | `src/safety/` |
| Plan templates, small-step ladder, lapse detection, adaptation | `src/plan/`, `src/domain/ladder.ts`, `src/adapt/` |
| Daily planner (four tracks, runs, freezes, context, hydration safety) | `src/planner/` |
| Comeback Coach (config, risk, actions, explanations, consent, personas) | `src/coach/` |
| Device signals (simulated feed, CSV import) | `src/wearables/` |
| Optional wording proxy | `src/server/coachExplain.ts`, `api/coach-explain.ts` |
| Sponsor aggregate (n>=20), equity gaps, outcome logging | `src/pilot/`, `src/domain/outcomes.ts` |
| FHIR export + validator, PDF report | `src/fhir/`, `src/export/` |
| i18n (en, bn, hi, ur; RTL) | `src/i18n/` |

### Save schema and migrations

There is no database. The "migration" is `normalizeState` in `src/app/reducer.ts`: it fills defaults for anything missing and **never removes data**. Schema 1, 2 and 3 saves load unchanged; the planner, coach and device-signal fields get safe defaults (schema 4). Tested.

## 4. Rules engine

`src/safety/` is a pure module with versioned data in `rules.config.ts` (currently `2026.11.2`). The engine contains no thresholds.

* Blocks extreme calorie, fasting, exercise and sleep targets; screens for pregnancy, eating concerns and high-risk conditions (any "yes" blocks the plan and routes to a clinician). "Unknown" is never treated as "no".
* Tobacco is **referral-only**: the only allowed plan items are refer / support / no-advice; nothing about nicotine or medicines can pass.
* Meter-only glucose; watch-sourced glucose is rejected.
* Escalation shows the family contact and the verified UAE numbers (998 ambulance, 999 police) only; Thypro says it is not an emergency service. No other numbers are invented.
* Every numeric limit is a conservative placeholder with an `owner` field marked *pending clinical review*.

### Planner rules (`planner-2026.11.1`, `src/planner/config.ts`)

* Four tracks, each one small daily action at level 1 to 3: nutrition (meals checked), sleep (window tolerance), hydration (glasses), activity (minutes).
* **Runs:** current run, best run, total days. A missed day pauses the run; one automatic freeze per ISO week (Mon to Sun) protects it, applied to that week's first miss and only when there is a run to protect. Total days are derived from entries and cannot reset. UI: "Your N total days are safe."
* **Step-down:** two missed days in a row lower a track by one level once per lapse, restorable. **Step-up** after a good week (6 of 7 days) is only offered, never applied, and a decline starts a 7-day cooldown.
* **Context:** night shift moves the sleep window; rotating shifts get no fixed window; Ramadan puts meals and water between iftar and suhoor; heat adds a gentle +2 glasses only when kidney and heart answers are both a definite "No", capped at 8; a flagged kidney or heart condition **hides the hydration track** and points to the clinician pathway.

## 5. Comeback Coach

**Inputs (consent-gated):** check-ins, planner entries, barrier answers, context settings, and optional device steps / sleep / activity minutes. Each has its own switch; unauthorised signals are not read and are reported as "not shared". In Local mode nothing is authorised until the person turns it on. In Guest mode the invented non-device signals start on; device signals always start off.

**Risk score (`coach-2026.11.1`):** a transparent weighted sum, 0 to 100.

| Factor | Weight | Feature |
|---|---|---|
| Recent completion trend | 30 | 7-day mean vs the 7 days before (or vs 0.6 when history is short) |
| Consecutive misses | 25 | missed days in a row, saturating at 2 |
| Recurring barrier | 15 | most frequent barrier in the last 14 days |
| Shift conflict | 12 | night / rotating shift and habit time inside 19:00 to 07:00; reduced by a pre-shift reminder |
| Sleep debt | 10 | average of the last 5 recorded nights below 7 h |
| Heat | 8 | hot weather noted |

The UI shows the score, band and **top three contributing factors**, plus the honest line: *"Estimated from your patterns, not a diagnosis. Starts rule-based; personal learning begins in the pilot."* The weights are hand-set; **nothing was trained on real users.**

**Proposal:** at score >= 15 *and* at least one lapse signal (misses or trend), the coach proposes **exactly one** action from the closed set `reduce_goal | change_time | swap_behaviour | switch_channel | add_preshift_reminder | pause_hydration_fasting`. Priority: Ramadan hydration misses, then the barrier named in the last two days, then a barrier named twice, then the top factors, then safe fallbacks. `validateProposal` (version `coach-safety-2026.11.1`) rejects anything outside the set, below level 1, inside quiet hours, in midday heat (activity), onto a disabled channel, or touching hydration when flagged. Blocked proposals are logged and never shown.

**Controls:** Accept, Edit (time or channel), Not now, undo, a visible **Turn off coach** switch, and optional automatic adjustment (**off by default**; applies only reversible low-risk actions: time, channel, pre-shift reminder; each can be undone).

**Audit:** every proposal and decision writes an audit entry with input summary, safety and config versions, wording source, model name (if any) and outcome. Coach records are included in the FHIR export and are removed by "delete my data".

## 6. Language model (Groq) and fallback

The model receives an **allow-listed, redacted** payload (action, track, from/to values, up to three factor ids, risk band, effort, language, tone). No names, notes, contacts, cities, dates or ids are ever read into it. Its reply must pass, in order: a JSON-shape check (`headline` <= 120, `body` <= 420 characters), a wording screen (no medicine, diagnosis, dose, URL, hype, or numbers that are not in the proposal), then it is displayed. On **any** failure (no URL, offline, timeout, 429 quota, 5xx, bad JSON, unsafe wording) the fixed template for that action is shown, and a 10-minute cooldown stops repeated calls after a failure or quota error. Templates exist for every action in all four languages (tested).

The key lives only in the serverless function (`api/coach-explain.ts`, Vercel-style) as `GROQ_API_KEY`; the browser only knows the proxy URL. The function re-validates the request. Model: `openai/gpt-oss-20b` on Groq's free tier, which is rate-limited. Local trial: put the key in `.env.local`, set `VITE_COACH_API_URL=/api/coach-explain`, run `npm run dev` (a dev-only middleware serves the same handler).

**Status: the Groq call path is unit-tested with a mocked provider only. It has not been called with a real key and the serverless function has not been run on a host.** Default behaviour in every build is the template fallback.

## 7. Device signals (optional)

`src/wearables/feed.ts` defines the feed abstraction. Working adapters: a **simulated** feed (invented, deterministic, with deliberate gaps) and a **CSV import** (`date, steps, sleep_minutes, activity_minutes`, read in the browser, never uploaded, 1 MB limit, out-of-range and bad rows skipped and counted). Glucose columns are ignored and reported; glucose is never inferred. Missing values show as "Missing", never as zero. **Health Connect and Apple Health are listed in the UI as future interfaces. They are not built.**

## 8. Personas and replay (simulation)

`src/coach/sim.ts` runs three invented personas (night-shift worker, Ramadan participant, traveller) for one week with and without the coach. The script only gives each day a "capacity" per track; a track is done when capacity plus accepted-change bonuses is at least its level. The coach is the real pipeline; the one assumption is that the invented person accepts. Everything is labelled SIMULATION. It illustrates behaviour; it is not evidence.

## 9. Privacy, security and responsible AI

* Guest mode stores nothing: the guest persistence adapter imports no storage API (a test spies on the globals; a browser test checks localStorage and cookies).
* No dark patterns, leaderboards or punitive streaks. Cumulative days never reset.
* Sponsor view shows aggregate results only for groups of 20 or more; smaller groups show "not enough data" with secondary suppression. Demo data is synthetic.
* Per-person family consent per field; the clinician coach view is a **demo** that needs the person's switch.
* Secrets: no secret is in the bundle (`GROQ_API_KEYS` and the Supabase access token are server/local only; `.env*.local` is git-ignored). Only the Supabase public URL and publishable key are bundled, by design.
* No claims of clinical validation, partnerships or real users anywhere in the product.

## 10. Test results (2026-11-20)

| Check | Result |
|---|---|
| Fresh frozen-lockfile install in a clean copy | pass |
| `tsc --noEmit` | 0 errors |
| ESLint | 0 errors, 0 warnings |
| Vitest | **291 passed**, 18 files (213 existing + 78 new) |
| Production build | succeeds |
| Playwright (Chromium, 360 px and 1280 px) | **19 passed** (plus the live-Supabase account test): guest journey, local mode, guest isolation, coach switch, axe-core (no serious/critical violations on 7 screens), long Bangla/Hindi/Urdu layouts, keyboard focus, reduced motion |
| Console, hydration, key and network errors in the journeys | none, in both the dev server and the production build |

New unit coverage: runs and weekly freezes; step-down/step-up; hydration safety and context adaptation; risk scores and factor ranking; allowed-action validation; template fallback, quota/network/invalid/unsafe model replies; proxy request validation; signal consent and revocation; coach decisions, auto-adjust, undo, clinician override; CSV import (glucose ignored); persona replay; FHIR export of coach data. Existing suites keep covering tobacco referral-only, the sponsor threshold (<20 never shown), equity gaps and guest isolation.

Screenshots from the browser tests: `docs/demo-screens/e2e/`.

## 11. Assumptions and limitations

* All numeric limits, weights, thresholds and rule owners are engineering placeholders pending clinical review.
* Translations (Bangla, Hindi, Urdu) are the team's drafts and **need native-speaker review**, including the new planner/coach strings.
* Reminders (in-app, message, voice) are simulated; voice uses the browser's text-to-speech if present.
* "Upcoming shift conflicts" is approximated from the stated shift pattern and the habit time; there is no roster feed.
* The coach sees a day with no entry as a missed day inside the person's own history, and never before they started.
* Real-device and screen-reader testing was not done; automated axe-core and keyboard checks were.
* The main bundle is about 580 kB (192 kB gzip) because the landing page imports all four dictionaries. The app itself loads lazily.

## 12. Simulated versus real

| Real in this build | Simulated or invented |
|---|---|
| Rules engines, reducers, risk score, consent, audit log, FHIR/PDF export, CSV import, i18n, email sign-in, database sync, consent-filtered sharing, server-side sponsor threshold | Guest persona and all demo data, sponsor and pilot numbers, personas and replay, reminders (message, voice), simulated device feed, clinician "console" view, the optional Groq wording (untested live) |

## 13. Explicitly NOT built

* Per-person learning (the score uses fixed, hand-set weights)
* Clinician approval console (the clinician view is a read-and-override demo with no accounts)
* Voice scam screening
* Hospital integration
* Blood donor network
* Clinical validation of any rule, template or translation
* Health Connect and Apple Health integrations (interfaces only documented)
* Real message or voice delivery
* Clinician identity verification, sponsor-group enrolment UI, multi-device conflict merging

## 14. Accounts, sync and sharing (Supabase)

**Sign-in:** email magic link (PKCE flow, no password). The client is created lazily, so Guest and Local never load or contact Supabase (a test checks the guest persistence code never references it). The browser holds only the public URL and publishable key.

**Schema** (`supabase/migrations/`, additive only): `profiles`, `user_state` (one JSON document per person), `audit_events` (append-only), `share_grants`, `cohort_groups`, `cohort_members`, plus functions `accept_share`, `shared_view`, `sponsor_group_totals`, `delete_my_data`, `delete_my_account`.

**Enforced in the database, not the UI** (`supabase/tests/rls.sql`, run with `npm run db:test`, rolls back; and `e2e/account.spec.ts` against the live project):

* Every table has row-level security; people read and write only their own rows.
* Roles `clinician` and `sponsor` cannot be self-assigned (column-level grants); an operator sets them.
* The audit log has no update or delete privilege, even for its owner (only "delete my data" or "delete my account" removes it).
* Sharing is per-field consent evaluated inside `shared_view`: it returns only fields the owner switched on and never the raw state. A clinician sees coach adjustments only if the owner also allowed it. Revocation is immediate.
* Sponsors have no read access to people's rows. `sponsor_group_totals` returns nothing numeric, not even the head-count, for groups under 20.
* "Delete my data" and "Delete my account" remove every row, including the audit trail.

**Sync policy:** one JSON document, last write wins (the most recent device to save overwrites). Writes are debounced (1.2 s). Offline or failing saves stay in memory, show a status, and retry on the next change or when the browser is online again. Closing the tab while offline loses unsaved changes; the UI says so.

**Limits and gaps:**

* The built-in Supabase email sender allows about **2 sign-in emails per hour** and its templates cannot be edited on the free plan. Real use needs a custom SMTP provider (many have free tiers).
* `clinician` is a label, not a verified identity: there is no clinician verification process.
* No sponsor groups exist yet (`cohort_groups` is empty) and there is no in-app way for people to join one.
* Moving an on-device plan into a new account is offered once; the local copy stays on the device until deleted.
* Multi-device conflict handling is last-write-wins; nothing is merged.
* Supabase free projects pause after a week of inactivity.
