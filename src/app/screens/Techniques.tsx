import React from 'react';
import { ExternalLink, Lightbulb } from 'lucide-react';
import { TEMPLATE_LIBRARY } from '../../plan/templates';
import { TECHNIQUES, TECHNIQUE_IDS, techniqueText } from '../../techniques/techniques';
import { useI18n, type Key } from '../../i18n';
import { Card, Chip, ScreenHeader } from '../ui/kit';

/** Transparency screen: every technique, why it helps, its limits and its source. Built from the data file. */
export const Techniques: React.FC = () => {
  const { t, lang } = useI18n();
  return (
    <div className="space-y-4">
      <ScreenHeader title={t('tech.title')} subtitle={t('tech.intro')} />
      <Card tone="soft" className="text-sm text-forest-900/85">{t('tech.mappingNote')}</Card>
      <ul className="space-y-3">
        {TECHNIQUE_IDS.map((id, i) => {
          const tech = TECHNIQUES[id];
          const text = techniqueText(id, lang);
          const goals = TEMPLATE_LIBRARY.filter((tpl) => tpl.items.some((it) => it.technique === id)).map((tpl) => tpl.goalType);
          return (
            <Card as="li" key={id} index={i} labelledBy={`tech-${id}`}>
              <h2 id={`tech-${id}`} className="flex items-center gap-2 font-editorial text-xl text-forest-950">
                <Lightbulb className="h-5 w-5 text-ochre-600" aria-hidden="true" />
                {text.name}
              </h2>
              <dl className="mt-2 space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('tech.rationale')}</dt>
                  <dd className="text-forest-950">{text.rationale}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('tech.limits')}</dt>
                  <dd className="text-forest-900/85">{text.limits}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('tech.usedIn')}</dt>
                  <dd className="mt-1 flex flex-wrap gap-1.5">
                    {tech.features.map((f) => (
                      <Chip key={f}>{t(`tech.feature.${f}` as Key)}</Chip>
                    ))}
                    {goals.map((g) => (
                      <Chip key={g} tone="good">
                        {t(`goal.${g}` as Key)}
                      </Chip>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-forest-800/60">{t('tech.source')}</dt>
                  <dd>
                    <a href={tech.source.url} target="_blank" rel="noreferrer noopener" lang="en" dir="ltr" className="inline-flex items-center gap-1 text-ochre-700 underline">
                      {tech.source.label}
                      <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              </dl>
            </Card>
          );
        })}
      </ul>
    </div>
  );
};
