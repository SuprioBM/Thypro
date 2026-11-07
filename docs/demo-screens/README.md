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
