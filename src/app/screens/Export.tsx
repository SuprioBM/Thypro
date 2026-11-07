import React, { useMemo, useState } from 'react';
import { Download, FileJson, FileText, Printer } from 'lucide-react';
import { buildReportHtml, printReport } from '../../export/report';
import { buildFhirBundle, validateBundle } from '../../fhir/export';
import { useI18n } from '../../i18n';
import { useStore } from '../store';
import { Card, Chip, ErrorState, ScreenHeader } from '../ui/kit';

export const Export: React.FC = () => {
  const { t, lang } = useI18n();
  const { state } = useStore();
  const [showPreview, setShowPreview] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const built = useMemo(() => {
    try {
      const bundle = buildFhirBundle(state, new Date());
      return { bundle, json: JSON.stringify(bundle, null, 2), validation: validateBundle(bundle) };
    } catch {
      return null;
    }
    // `attempt` lets "Try again" rebuild with a fresh timestamp.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, attempt]);

  if (!built || failed) {
    return (
      <>
        <ScreenHeader title={t('export.title')} />
        <ErrorState
          title={t('export.error')}
          retryLabel={t('common.retry')}
          onRetry={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
        />
      </>
    );
  }

  const download = () => {
    const blob = new Blob([built.json], { type: 'application/fhir+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thypro-fhir-${built.bundle.timestamp.slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const print = async () => {
    const ok = await printReport(buildReportHtml({ state, lang, t, now: new Date() }));
    if (!ok) setFailed(true);
  };

  const previewText = built.json.split('\n').slice(0, 60).join('\n');

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('export.title')} subtitle={t('export.body')} />

      {state.profile.synthetic && (
        <Card tone="alert" index={0} className="text-sm text-forest-950">
          {t('export.demoNote')}
        </Card>
      )}

      <Card index={1} labelledBy="pdf-title">
        <div className="flex items-start gap-3">
          <FileText className="mt-1 h-5 w-5 shrink-0 text-ochre-700" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="pdf-title" className="font-editorial text-lg text-forest-950">{t('export.pdf')}</h2>
            <p className="text-sm text-forest-900/75">{t('export.pdfHint')}</p>
            <button type="button" onClick={print} className="thy-btn-primary mt-3 min-h-[48px]">
              <Printer className="h-4 w-4" aria-hidden="true" />
              {t('export.print')}
            </button>
          </div>
        </div>
      </Card>

      <Card index={2} labelledBy="fhir-title">
        <div className="flex items-start gap-3">
          <FileJson className="mt-1 h-5 w-5 shrink-0 text-ochre-700" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 id="fhir-title" className="font-editorial text-lg text-forest-950">{t('export.fhir')}</h2>
            <p className="text-sm text-forest-900/75">{t('export.fhirHint')}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Chip tone={built.validation.valid ? 'good' : 'bad'}>
                {built.validation.valid ? t('export.valid', { n: built.validation.resourceCount }) : t('export.invalid')}
              </Chip>
              <Chip>{t('export.provenance')}</Chip>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={download} className="thy-btn-primary min-h-[48px]">
                <Download className="h-4 w-4" aria-hidden="true" />
                {t('export.download')}
              </button>
              <button type="button" aria-expanded={showPreview} onClick={() => setShowPreview((v) => !v)} className="thy-btn-ghost min-h-[48px]">
                {showPreview ? t('common.hide') : t('export.preview')}
              </button>
            </div>
            {showPreview && (
              <pre dir="ltr" lang="en" tabIndex={0} className="mt-3 max-h-72 overflow-auto rounded-xl bg-forest-950 p-3 text-start text-[11px] leading-relaxed text-ivory-100">
                {previewText}
              </pre>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
