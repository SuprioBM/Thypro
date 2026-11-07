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
