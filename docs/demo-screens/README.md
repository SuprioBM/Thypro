# Demo walkthrough screenshots

Captured from the running app (guest mode unless noted) with the in-app browser, at **360px** (`-mobile`) and **1280px** (`-desktop`) widths. Playwright was not available offline, so the walk was driven through the page and screenshotted by hand; the steps are reproducible by following the numbers below.

| # | Step | Files |
|---|---|---|
| 00 | Landing page with **Continue as Guest** | `00-landing-guest-cta-*` |
| 01 | Start screen: language picker, Guest / own plan | `01-entry-language-guest-mobile` |
| 02 | Today, with the no-shame restart offer | `02-today-*` |
| 03 | 60-second check-in (form, saved state) | `03-checkin-*` |
| 04 | Language switch: Bangla, Hindi, Urdu (right-to-left) | `04-*`, `04b-*`, `04c-*` |
| 05 | Plan with "Why this plan item" expanded | `05-plan-*` |
| 06 | Escalation card for a worrying check-in | `06-escalation-*` |
| 07 | Weekly review (missing data shown as missing) | `07-review-*` |
| 08 | Family view with per-field consent | `08-family-*` |
| 09 | Reminders with simulated delivery log | `09-reminders-log-*` |
| 10 | Export: PDF and FHIR JSON (with structure check) | `10-export-*` |
| 11 | Read-only, filterable audit log | `11-audit-*` |
| 12 | Goal setup (goal step, safety questions) | `12-setup-*`, `13-setup-safety-desktop` |
| 14 | Safety engine blocked the plan, clinician pathway | `14-clinician-blocked-*` |

## Phase 2: the habit loop

Same method (in-app browser, 360px and 1280px). The pilot has not started; every person and number below is invented.

| # | Step | Files |
|---|---|---|
| 20 | Header and hero with **Try the Habit Loop** | `20-landing-try-habit-loop-desktop` |
| 21 | "Sustaining healthy habits" section: the five loop steps | `21-landing-habit-loop-*` |
| 22 | The replayable week and the scope (tobacco is referral-only) | `22-landing-week-scope-desktop` |
| 23 | "One person's week" before and after **Replay the week** | `23-story-*` |
| 24 | End of the week: 5 days done in total, nothing reset | `24-story-week-end-desktop` |
| 25 | Friday: two misses, step down, time moved, channel switched | `25-story-lapse-adapt-*`, `25b-story-urdu-rtl-mobile` |
| 26 | Today after a lapse: the one-tap barrier question | `26-today-barrier-question-desktop` |
| 27 | Gentle step-down card and the adaptation proposals | `27-today-*` |
| 28 | Audit log with the logged adaptations and rule version | `28-audit-adaptation-desktop` |
| 29 | My controls: goal, quiet hours, channels | `29-controls-desktop` |
| 30 | Sponsor view: group totals only, groups under 20 suppressed | `30-sponsor-*` |
| 31 | Pilot report: equity check flags a gap over 10 points | `31-pilot-equity-desktop` |
| 32 | "How suggestions work" page in Urdu (right-to-left) | `32-how-suggestions-urdu-mobile` |

## Strength & mobility

Same method as above. Guest demo person, invented data.

| # | Step | Files |
|---|---|---|
| 40 | Strength home: the next session with a body map and exercise list | `40-strength-today-desktop` |
| 41 | Guided workout: target and reason per exercise, set steppers, progress bar | `41-strength-workout-desktop` |
| 42 | Progress: muscle map (this week's work), per-muscle sets | `42-strength-muscle-map-mobile` |
