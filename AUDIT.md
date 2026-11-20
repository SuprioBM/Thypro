# AUDIT — "Sustaining Healthy Behaviors" additions

Written before any code was changed. Date: 2026-11-07.

## 1. What the repo is (facts)

| Area | Finding |
|---|---|
| Stack | Vite 5 + React 18 + TypeScript (strict, `noUnusedLocals`) + Tailwind 3. Static SPA. |
| Routing | **None.** One page; sections are scrolled to by id. |
| Auth / accounts | **None.** No login page. The "Pilot Access" modal posts a form to a Google Apps Script URL (`src/config.ts`). |
| Backend / DB / ORM / migrations | **None.** Nothing server-side exists, so there is no schema to migrate. |
| i18n | **No library.** `lang: 'en' \| 'bn'` is passed as a prop and used in inline ternaries (landing page only). |
| Animation | Plain CSS keyframes + a small `Reveal` (IntersectionObserver) in `src/components/ui`. No Framer Motion. |
| Design system | Tailwind tokens (`ivory`, `forest`, `sage`, `ochre`, `ember`), `thy-*` component classes in `src/index.css`. |
| Family access | Marketing content only (`PeoplePermissionsSection`). **No functional family-access module to reuse.** |
| Tests | **None.** No test runner installed. |
| Lint | **No ESLint.** `tsc --noEmit` (strict + unused checks) is the only static gate. |
| Browser automation | Playwright is **not installed**. |
| Baseline (before changes) | `tsc --noEmit`: 0 errors. `vite build`: succeeds (CSS 55 kB, JS 323 kB). No console errors on the landing page. |

## 2. Per-feature status

| # | Feature | Exists? | Plan |
|---|---|---|---|
| 1 | Guest mode | No | Add. In-memory session, synthetic demo profile, reset on exit, "Continue as Guest" on landing + Access modal (no login page exists). |
| 2 | Language choice | Partial (en/bn on marketing page only) | Add a small typed i18n (en, bn, hi, ur) for the app; RTL for Urdu. Landing keeps its existing en/bn toggle. |
| 3 | One-goal setup | No | Add 6-step flow. Unknown stays `unknown`. |
| 4 | Template plans | No | Typed template library (`src/plan/templates.ts`) + pure generator with versioning and `templateId`. |
| 5 | Daily check-in | No | Add; optional Web Speech voice with graceful fallback; original + translation stored. |
| 6 | Reminders | No | Add; in-app channel, simulated delivery log, `ReminderChannel` hook interface. |
| 7 | Weekly review / restart | No | Add; pure calculation module, no-shame wording, missing data shown as missing. |
| 8 | Safety rules engine | No | Pure module + versioned config with owner field, unit-tested. |
| 9 | Escalation | No | Pure check-in rules → clinician / family-contact card. |
| 10 | Family view | Marketing only | Add scoped read-only view with per-field consent. Demonstration only: nothing is transmitted. |
| 11 | Open export | No | FHIR Bundle (JSON) + structural validator + PDF via the browser print pipeline. |
| 12 | "Why this plan item" | No | Expandable card per item (reason + template id + guidance source). |
| 13 | Audit log screen | No | Read-only, filterable. |

## 3. Decisions (ambiguities resolved the safest way)

1. **No backend exists, so none is faked.** "Guest sessions store no personal data server-side" is trivially true; the guest store additionally never touches `localStorage`/`sessionStorage` (enforced by a test). The brief's DB migration/seed requirements do not apply: there is no database. The synthetic seed is a TypeScript module.
2. **"Normal mode"** has no accounts to log into. I added a **Local mode** ("my own plan, kept on this device only") that persists to `localStorage` with a clearly labelled notice. No credentials are collected anywhere.
3. **Routing** is a tiny hash router (`#/app/...`), no new dependency. Landing page and its anchors are untouched.
4. **PDF export** uses the browser's print pipeline (a print-styled report in a hidden frame). Standard PDF fonts cannot render Bangla/Hindi/Urdu; the print pipeline can. No PDF library added.
5. **Animation** uses the existing CSS approach, not Framer Motion (the project already has one). `prefers-reduced-motion` is already globally honoured and I extend it.
6. **AI / language layer.** No AI is called by default. A `LanguageLayer` interface exists for optional rephrase/translate via `VITE_LANGUAGE_API_URL`; on any failure the UI says so and approved fixed wording is used. AI never touches plan content or safety.
7. **Screening answers:** `yes` on pregnancy, eating concerns, or a high-risk condition **blocks** plan generation and routes to the clinician pathway. `unknown` / `prefer not to say` never blocks and is never treated as "no"; the plan carries a visible "some safety questions unanswered" note and uses only conservative starting values.
8. **Numeric limits** (calories, fasting hours, exercise minutes, sleep hours, glucose-meter thresholds) are placeholders in `rules.config.ts` with an `owner` field marked *pending clinical review*. They are conservative defaults, not clinical guidance, and are shown as such.
9. **Guidance sources.** Only sources that exist are named (WHO physical-activity guidelines 2020; WHO healthy-diet fact sheet). Sleep and medicine-routine templates state "clinician review pending". The UI never claims clinical validation.
10. **Glucose.** Only a manually entered *meter* reading is accepted; watch/wearable-sourced values are rejected by the engine.
11. **Translations** for Bangla, Hindi and Urdu are my own and **must be reviewed by native speakers** before public use.
12. **No ESLint** is configured and adding one is out of scope; `tsc` strict + unused checks serve as the lint gate.
13. **Only new dev dependency:** `vitest` (test runner). No runtime dependencies added.
14. **Latin digits everywhere.** Bangla, Hindi and Urdu UI text uses 0-9 so times, doses, phone numbers and emergency numbers are unambiguous. Dates use localized month and weekday names.
15. **Guest language.** "Continue as Guest" from the landing page opens in the language the visitor was viewing (English by default); the demo persona is a Bangla speaker and the banner says so. The start screen (`#/app`) has an explicit language picker first.
16. **Bundle split.** The habit app is a lazy chunk, so marketing-page visitors do not download it. The marketing page imports the i18n dictionaries (for the guest button label), which grew its main bundle by about 65 kB.
17. **Crash handling.** A top-level error boundary plus a per-screen boundary mean a broken screen shows a recovery message, never a blank page.
18. **Screenshots** are captured with the in-app browser (Playwright is unavailable offline), at 360px and desktop widths, into `docs/demo-screens/`.

## 4. Planned order of work

1. Domain types, safety engine + config, template library, plan generator, week/restart maths, FHIR + audit — with tests.
2. i18n (4 languages, RTL), guest/local persistence, store.
3. Hash router, app shell, landing "Continue as Guest".
4. Screens: setup, today/check-in, plan, review; then family, reminders, export, audit.
5. Motion, a11y, 360px pass.
6. Tests, build, walkthrough screenshots, final report.

## 5. Outcome (filled in after the build)

* All 13 features are implemented; see `docs/demo-screens/` for the walkthrough at 360px and desktop widths.
* Tests: `npm test` (vitest, 106 tests: safety engine, plan generation, week/restart logic, family consent, FHIR export + validator, PDF report, reminders, language layer, i18n completeness, guest isolation).
* Not verifiable here: the browser print dialog itself (PDF), real speech-recognition audio, and Bangla/Hindi/Urdu wording quality (needs native review).

---

# Phase 2 — the habit loop (Future Health Challenge addendum)

Date: 2026-11-14. Branch `feature/habit-loop-phase2`. The 13 features above were **extended, not rebuilt**; every old test still passes.

## 6. What existed at the start of phase 2

| Area | State before phase 2 |
|---|---|
| Behaviours | Walk, eating, sleep, medicine routine. No tobacco. |
| Context | Dietary pattern and allergies only. No shift work, fasting, heat, budget, literacy or disability inputs. |
| Progress | Weekly completion plus "current run / best run" streak counters. No levels. |
| Lapses | Restart offer after missed days. No barrier question, no adaptation. |
| Reminders | One in-app channel + simulated delivery log. No quiet hours, no channel choice. |
| Sharing | One family contact with per-field consent. |
| Reporting | None for sponsors or pilots. |
| Website | Landing with "Continue as Guest", en/bn toggle, Dubai in the corridor list. |

## 7. What changed (existing code)

* `GoalType` gained `tobacco`; plans gained a `level`; check-ins gained optional activity minutes, blood pressure and weight; state gained prefs, progress, barriers, proposal, people and pilot signals. Saved local data moves from schema 1 to schema 2 through `normalizeState` (the local "migration"; old saves load unchanged, missing fields get defaults). Tested.
* **Streak counters removed** (`currentRun`/`bestRun`). Replaced by cumulative "days done in total", which never resets.
* Templates rewritten (v1.1.0) with context variants and a small-step ladder; the safety config is now `2026.11.2` with a tobacco rule and a per-behaviour coverage map.
* Reminders now go through a delivery planner (frequency, quiet hours, preferred → fallback channel). Suppressed reminders are logged, not dropped.
* Family view supports several people, each with their own consent toggles.
* Website: header and hero gained **Try the Habit Loop**; a "Sustaining healthy habits" section; Abu Dhabi next to Dubai; Hindi and Urdu in the language switch; four public pages.

## 8. What was added

| # | Item | Where |
|---|---|---|
| 1 | Tobacco: referral-only template; safety rule `T-REFERRAL-ONLY` blocks any item other than refer / support / no-advice | `src/plan/templates.ts`, `src/safety/` |
| 2 | Context profile read by templates (pure, tested) | `ContextProfile` in `src/domain/types.ts`, `matchesContext`/`pickVariant` |
| 3 | Small-step ladder (2 misses in a row → one step down per lapse; step-up offered after a good week, declinable, 7-day cooldown) | `src/domain/ladder.ts`, `src/plan/generate.ts` |
| 4 | Lapse detector + one-tap barrier question (8 barriers) | `detectLapse`, `BarrierCard` |
| 5 | Channels: in-app, simulated message, simulated voice (browser text-to-speech), quiet hours | `src/app/reminders.ts`, `src/app/speech.ts` |
| 6 | Rule-based adaptation engine `adapt-2026.11.1`, every change logged to the audit log; "personal best time and tone" tracker that only records | `src/adapt/` |
| 7 | Six technique cards (rationale, limits, source) in 4 languages | `src/techniques/techniques.ts` |
| 8 | My controls: goal, quiet hours, channels, frequency, per-person sharing, export, delete, voice-first, large text, picture mode | `Settings.tsx` |
| 9 | Sponsor view: group totals only, groups under 20 show "not enough data" (with secondary suppression of totals), fixed banner, synthetic in demo | `src/pilot/aggregate.ts`, `Sponsor.tsx` |
| 10 | Outcome + equity logging; pilot report flags gaps over 10 percentage points | `src/domain/outcomes.ts`, `equityReport`, `Pilot.tsx` |
| 11 | "One person's week" scenario, replayed through the real reducer | `src/scenario/week.ts`, `Story.tsx` |
| 12 | Technique transparency screen + public "How suggestions work" page generated from the same data | `Techniques.tsx`, `InfoPage.tsx` |

## 9. Phase 2 decisions

1. **No machine learning.** Adaptation is a fixed, versioned rules table. The "personal best time and tone" tracker only records; nothing reads it.
2. **Tobacco is referral-only.** No nicotine-replacement, medicine or dosage content exists in the templates, and the safety engine blocks a plan that contains any.
3. **Voice channel = browser text-to-speech**, not recorded audio. If the browser has no speech synthesis, the reminder falls back to the next chosen channel and the log says so.
4. **Message and voice are simulated** behind the existing `ReminderChannel` interface. Nothing is sent anywhere.
5. **Step-up is only offered**, never applied automatically. Step-down is applied once per lapse episode and explained.
6. **Sponsor and pilot data are synthetic** (seeded generator, three invented sites, one under 20 to show suppression). No real participants, partners or results are claimed.
7. **Technique mapping is a design choice, not a validated intervention.** Cards cite the BCT Taxonomy v1 (Michie et al., 2013) as the vocabulary source only; each card states its limits.
8. **Rule owners** (safety, tobacco, adaptation) are named placeholders pending appointment and clinical review.
9. **Header buttons**: Continue as Guest / Try the Habit Loop show in the header from 1024px; below that they are in the hero and the menu, so the header never overflows (checked at 360, 768, 1024, 1280, 1536).
10. **Older landing sections stay en/bn.** In Hindi or Urdu, the new habit-loop section and public pages are translated; older marketing sections show English with a notice.
11. **Playwright still unavailable**, so the walk (including the replayed week) was driven in the in-app browser; screenshots 20–32 are in `docs/demo-screens/`.
12. **No new dependencies** in phase 2.

## 10. Phase 2 outcome

* `npm run typecheck`: 0 errors. `npm test`: 179 tests in 13 files pass (73 new: adaptation engine, ladder, lapse, tobacco rule, context matching, sponsor under-20 threshold, equity gap, delivery planning, schema migration, scenario replay). `npm run build`: succeeds.
* No console errors on any app screen in guest and local mode, or on the landing page and the four public pages.
* Known limits: the landing bundle is about 475 kB (153 kB gzip) because it imports the four dictionaries and technique data; Bangla/Hindi/Urdu wording needs native-speaker review; numeric limits and rule owners need clinical sign-off.

---

# Strength & mobility (web only)

Date: 2026-11-14. Branch `zubayer-hasan`. Inspired by the features of an open-source gym log (per-weekday or rotating plans, double progression, personal records, a muscle map, a lighter week). **Nothing was copied**: its code is AGPL-3.0 and its exercise media is licensed to that project only, so Thypro's module is written from scratch with its own artwork and wording.

## What it adds

| Area | What |
|---|---|
| Plans | Three starter plans (chair and wall basics, full body three days, balance and mobility). Fixed weekdays or a rotation where the next session is the next one not yet done. |
| Library | 29 gentle exercises with a "how to" in en, bn, hi, ur. Filter by muscle and equipment; search. |
| Workout | Guided session: target and the reason for it, last time, steppers, per-set done, rest timer (speech cue if voice-first), "I don't feel well" stop, add or remove sets, discard. A draft survives a refresh. |
| Progression | Double progression (`prog-2026.11.1`). Missed reps never add load; two missed sessions lower it by 10%; bodyweight and holds never invent a load and suggest a harder variation at the top. |
| Progress | Personal bests (never on first-ever use), muscle map (this week / recently trained / not trained), 8-week activity grid, optional body weight. |
| Safety | Three screening questions. Any "yes" blocks the plan and points to a clinician; "not sure" never counts as "no" and starts lighter. Stopping unwell is logged as an escalation. All in the audit log. |
| Lighter week | One set fewer per exercise for seven days. |
| Integration | Today card; family sharing field `strength` (counts only: sessions, minutes, last date; off by default); FHIR export adds strength minutes and self-entered body weight. Guest demo has a plan, five sessions and three weights, built by running the real reducer. |
| Data | Local save schema 2 to 3 through `normalizeState` (old saves load unchanged; consent gains a `strength` flag). |

## Decisions

1. **Web only**; no app code touched.
2. **Not a powerlifting log.** No estimated 1RM, plate maths or rep-max charts: they do not fit older users and imply precision the module should not claim.
3. **Starter plans and the screening wording are placeholders** pending a physiotherapist and clinical review (owner field in `src/strength/safety.ts`). No clinical validation is claimed.
4. **Translations** (bn, hi, ur) are the team's drafts and need native-speaker review, including exercise instructions.
5. **No new dependencies.**

## Tests

`src/strength/strength.test.ts`: 33 tests (progression rules including "missed reps never add load", records, schedule, screening, reducer, audit entries, save upgrade, demo). Whole suite 213.

## Known limits

No exercise animations or photos (icons and a body map only). No custom exercises or routine editing yet (swap plan or mode only). Rest timer and speech cue need the app to stay open. Not verified: real devices, screen readers.


---

# Phase 3: Final product (Wellness Challenge 09)

Date: 2026-11-20. Branch `zubayer-hasan`. Audit done before any change; existing features were extended, never rebuilt.

## Baseline (before changes)

`tsc`: 0 errors. `vitest`: 213 passed. `vite build`: OK. No ESLint, no Playwright, no backend, no database (so there are no database migrations; the save-schema upgrade is `normalizeState`). Git tree clean.

## Feature audit

| Feature | Existing implementation | Required changes | Status |
|---|---|---|---|
| Guest mode | Synthetic Bangla persona, 3 weeks of check-ins, in-memory only, tested | Persona made a night-shift worker; planner history added | Done |
| Languages en/bn/hi/ur, RTL | Complete, tested for key parity | +~230 keys (p4) in all four; Urdu RTL checked in browser | Done, needs native review |
| Goal setup (4 goals, context, tobacco referral-only) | Exists | None | Retained |
| Adaptive plans, step-down/up | Exists for the main goal | Same rules added per planner track | Done |
| Daily check-in, reminders, quiet hours, channels | Exists (simulated) | None | Retained |
| Lapse recovery, barrier question | Exists | Barrier feeds the coach | Done |
| Safety engine | Exists, versioned, tested | Planner/hydration rules (planner-2026.11.1) and coach validation (coach-safety-2026.11.1) | Done |
| Technique cards, How suggestions work | Exists | Planner actions tagged with technique, rationale, limits, source | Done |
| User controls, export, deletion | Exists | Export/deletion cover coach, planner and device data | Done |
| Family, clinician pathway, sponsor, pilot/equity, audit log | Exist | Audit gains planner and coach entries with input summary, versions, model, outcome | Done |
| Daily habit planner (4 tracks) | Missing | New: runs, weekly freeze, context adaptation, hydration safety | Done |
| Comeback Coach | Missing | New: weighted risk score, top-3 factors, one proposal from 6 allowed actions, Accept/Edit/Not now, Turn Off, auto-adjust off by default, per-signal consent | Done |
| LLM wording | Language layer for notes only | New proxy (Groq), redaction, schema + safety validation, template fallback, cooldown | Built, **not live-tested** |
| Wearables | Missing | Simulated feed + CSV import, consent, missing values, no glucose | Done |
| Personas / replay with and without coach | One-week story exists | 3 personas through the real reducer | Done |
| Clinician coach view | Missing | Demo view with confirm/override and audit trail | Done (demo) |
| ESLint | Missing | Added (0 problems) | Done |
| Playwright 360px + desktop | Missing | 18 browser tests incl. axe-core | Done |
| Technical documentation | Missing | `docs/TECHNICAL_DOCUMENTATION.md` | Done |
| Deploy to thypro.app | Site is on Vercel under an account this machine's login does not own | None possible here | **Not done** |

## Cost and integration table

| Item | Provider | Cost | Status |
|---|---|---|---|
| AI explanations | Groq, free tier (`openai/gpt-oss-20b`) via `api/coach-explain.ts` | $0 | **Fallback active.** Integration unit-tested with a mock; not called live (no key supplied here) |
| Database | None (browser memory / localStorage) | $0 | n/a |
| Hosting | Vercel (existing, thypro.app) | $0 added | Not deployed from here (see below) |
| PDF generation | Browser print pipeline (existing) | $0 | Working |
| Notifications | In-app simulation | $0 | Simulated |
| Wearables | Simulated feed + CSV | $0 | Simulated / working CSV |
| Lint, e2e, a11y tests | ESLint, Playwright, axe-core (open source) | $0 | Working |

## Missing credentials

| Provider | Purpose | Needed |
|---|---|---|
| Groq | Coach wording | `GROQ_API_KEY` set as a **server-side** env var on the host (or `.env.local` for `npm run dev`), plus `VITE_COACH_API_URL` (public URL, no secret). Free key: https://console.groq.com/keys |
| Vercel | Deploying to thypro.app | Access to the Vercel account/team that owns the thypro.app project, or push access to `SuprioBM/Thypro` if it auto-deploys from `main` |

## Decisions

1. **Coach is rule-based and hand-weighted.** Nothing was trained; the UI and docs say so.
2. **Local mode starts with no signal consent**; Guest starts with invented non-device signals on, device signals off.
3. **Weekly freeze** absorbs a track's first miss in a week (only when a run exists), so step-down needs two misses beyond it. This is why a first lapse is gentle.
4. **Coach needs a lapse signal** (misses or trend); shift, heat or barriers alone never trigger a nudge.
5. **The week replay is a toy model** with hand-set capacities; it is labelled SIMULATION and proves nothing about results.
6. **The step-down appears in the "without coach" replay**: with the coach the proactive change comes first and prevents the second miss.
7. **Contrast:** secondary text in the app was darkened (opacity 85) to pass axe-core AA.
8. **Deployment not attempted**: creating a project in an unrelated account would not reach thypro.app and was not authorised.

## Known gaps

Per-person learning, clinician approval console, voice scam screening, hospital integration, blood donor network and clinical validation are not built. Screen readers and real devices were not tested. The marketing bundle is ~580 kB (192 kB gzip).

## Phase 4: Supabase backend (accounts, sync, sharing)

| Feature | Existing implementation | Required changes | Status |
|---|---|---|---|
| Database | None | Supabase Postgres, migrations in `supabase/migrations`, applied to the project | Done |
| Auth | None | Email magic link (PKCE), lazy client, Entry option "Sign in or create an account" | Done; see email limits |
| Sync | localStorage only | Cloud persistence with debounce, retry, offline status, audit mirror | Done, unit tested |
| Sharing | Demo only | Real grants, accept, consent-filtered `shared_view`, instant revocation | Done, tested live |
| Sponsor aggregate | Synthetic only | `sponsor_group_totals()` enforces n>=20 in SQL; shown for sponsor accounts | Done in DB; no groups seeded |
| Delete | Local only | `delete_my_data`, `delete_my_account` | Done, tested live |
| Security tests | None | `supabase/tests/rls.sql` and `e2e/account.spec.ts` | Pass |

Costs: Supabase free plan, $0. Limits: about 2 auth emails/hour on the built-in sender; email templates locked; projects pause after a week idle.

Credentials: the project URL and publishable key are bundled by design. The Supabase access token and DB password were used only for migrations and tests, from `.env.local`; rotate them (they were shared in chat). Vercel needs `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` before the build.
