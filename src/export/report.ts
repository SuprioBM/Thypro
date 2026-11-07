/**
 * PDF export, via the browser's print pipeline.
 *
 * Standard PDF fonts cannot draw Bangla, Hindi or Urdu, so instead of a PDF
 * library this builds a print-styled HTML document and hands it to the
 * browser's own "Save as PDF", which uses the system's real fonts.
 * buildReportHtml is PURE (time and translator are passed in) and tested.
 */

import { SAFETY_RULES_CONFIG } from '../safety/rules.config';
import type { AppState, Lang } from '../domain/types';
import type { Key, TFn } from '../i18n';
import { isRtl } from '../i18n';
import { resolvePlanItem } from '../plan/templates';

export const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export interface ReportInput {
  state: AppState;
  lang: Lang;
  t: TFn;
  now: Date;
}

export function buildReportHtml({ state, lang, t, now }: ReportInput): string {
  const dir = isRtl(lang) ? 'rtl' : 'ltr';
  const plan = state.plans[state.plans.length - 1];
  const demo = state.profile.synthetic;
  const e = escapeHtml;

  const planRows = plan
    ? plan.items
        .map((item, i) => {
          const text = resolvePlanItem(plan, item, lang);
          return text
            ? `<tr><td class="n">${i + 1}</td><td>${e(text.title)}<div class="why">${e(text.reason)}</div></td></tr>`
            : '';
        })
        .join('')
    : '';

  const checkinRows = [...state.checkins]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((c) => {
      const note = c.note ? e(c.note.original) + (c.note.translation ? ` <em>(${e(c.note.translation.text)})</em>` : '') : '';
      return `<tr><td class="mono">${e(c.date)}</td><td>${e(t(`checkin.status.${c.status}` as Key))}</td><td>${e(
        c.feel === 'unknown' ? t('common.unknown') : t(`checkin.feel.${c.feel}` as Key)
      )}</td><td>${note}</td></tr>`;
    })
    .join('');

  const none = e(t('report.empty'));

  return `<!doctype html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="utf-8">
<title>${e(t('report.title'))}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600&family=Noto+Sans+Devanagari:wght@400;600&family=Noto+Naskh+Arabic:wght@400;600&display=swap">
<style>
  @page { margin: 16mm; }
  body { font-family: 'Noto Sans Bengali','Noto Sans Devanagari','Noto Naskh Arabic','Segoe UI','Nirmala UI',system-ui,sans-serif; color: #0A332C; font-size: 12.5px; line-height: 1.6; }
  h1 { font-size: 22px; margin: 0 0 4px; } h2 { font-size: 15px; margin: 22px 0 6px; border-bottom: 1px solid #ccd6d2; padding-bottom: 3px; }
  table { width: 100%; border-collapse: collapse; } td { border-bottom: 1px solid #e4e9e6; padding: 5px 6px; vertical-align: top; }
  .n, .mono { font-family: ui-monospace, Menlo, monospace; white-space: nowrap; } .why { color: #46635b; font-size: 11.5px; }
  .demo { background: #FFF5ED; border: 1px solid #FFA870; padding: 6px 10px; border-radius: 6px; margin: 10px 0; }
  .foot { margin-top: 26px; font-size: 11px; color: #46635b; border-top: 1px solid #ccd6d2; padding-top: 8px; }
</style>
</head>
<body>
<h1>${e(t('report.title'))}</h1>
<div>${e(t('report.generated'))}: <span class="mono">${e(now.toISOString())}</span></div>
${demo ? `<div class="demo">${e(t('export.demoNote'))}</div>` : ''}
<h2>${e(t('report.profile'))}</h2>
<div>${e(state.profile.displayName || '—')} · ${e(state.profile.city)} · ${e(t(demo ? 'report.dataKind.demo' : 'report.dataKind.own'))}</div>
<h2>${e(t('report.goal'))}</h2>
<div>${state.setup ? e(t(`goal.${state.setup.goalType}` as Key)) : none}</div>
<h2>${e(t('report.plan'))}</h2>
${plan ? `<div class="mono">${e(plan.templateId)} v${e(plan.templateVersion)} · ${e(t('plan.version', { v: plan.version }))}</div><table>${planRows}</table>` : `<div>${none}</div>`}
<h2>${e(t('report.checkins'))}</h2>
${state.checkins.length ? `<table>${checkinRows}</table>` : `<div>${none}</div>`}
<div class="foot">
  <div>${e(t('report.rules'))}: <span class="mono">${e(SAFETY_RULES_CONFIG.version)}</span> · ${e(t('export.provenance'))}</div>
  <div>${e(t('shell.disclaimer'))}</div>
</div>
</body>
</html>`;
}

/** Opens the print dialog for a report. Resolves false if the browser blocks it. */
export function printReport(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;inset-inline-end:0;bottom:0;width:0;height:0;border:0;';
      frame.srcdoc = html;
      frame.onload = () => {
        try {
          frame.contentWindow?.focus();
          frame.contentWindow?.print();
          resolve(true);
        } catch {
          resolve(false);
        }
        window.setTimeout(() => frame.remove(), 60000);
      };
      document.body.appendChild(frame);
    } catch {
      resolve(false);
    }
  });
}
