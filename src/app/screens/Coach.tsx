import React, { useEffect, useMemo, useState } from 'react';
import { Bot, History, Info, PlayCircle, Undo2 } from 'lucide-react';
import { COACH_CONFIG } from '../../coach/config';
import { COACH_SAFETY_VERSION } from '../../coach/actions';
import { templateExplanation, type Explanation } from '../../coach/explain';
import { buildCoachInput } from '../../coach/input';
import { assessRisk } from '../../coach/risk';
import { isBlockedSetup } from '../../coach/blocked';
import { COACH_SIGNALS, type CoachProposal, type CoachRecord, type FactorId } from '../../coach/types';
import { useI18n, type Key, type TFn } from '../../i18n';
import { go } from '../router';
import { useStore } from '../store';
import { Wearables } from '../components/Wearables';
import { Card, Chip, EmptyState, ScreenHeader, Switch } from '../ui/kit';

const CHANNELS = ['in-app', 'message', 'voice'] as const;

/** Shows a proposal value in words: levels, times and channels. */
function valueText(t: TFn, p: CoachProposal, v: string): string {
  if (p.action === 'switch_channel' && (CHANNELS as readonly string[]).includes(v)) return t(`channel.${v}` as Key);
  if (p.action === 'reduce_goal') return t('planner.level', { n: v });
  if (p.action === 'swap_behaviour') return v === 'alt' ? t('planner.adapt.indoor_variant') : v;
  if (p.action === 'add_preshift_reminder') return v === 'off' ? t('coach.decision.undone') : v;
  return v;
}

function wording(t: TFn, rec: CoachRecord, lang: string): Explanation {
  const e = rec.explanation;
  if (e.source === 'llm' && e.text && e.text.lang === lang) return { headline: e.text.headline, body: e.text.body };
  return templateExplanation(rec.proposal, t);
}

const ProposalPanel: React.FC<{ rec: CoachRecord }> = ({ rec }) => {
  const { t, lang } = useI18n();
  const { coach, state } = useStore();
  const p = rec.proposal;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(p.to);
  const text = wording(t, rec, lang);
  const timeEdit = p.action === 'change_time' || p.action === 'add_preshift_reminder';
  const channelEdit = p.action === 'switch_channel';
  const trackName = p.track ? t(`planner.track.${p.track}` as Key) : '';

  return (
    <Card index={2} tone="soft" className="border-sage-300" labelledBy="proposal-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-100 text-forest-700">
          <Bot className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-forest-800/85">{t('coach.proposal')}</p>
          <h2 id="proposal-title" className="font-editorial text-lg leading-snug text-forest-950">{text.headline}</h2>
          <p className="mt-1 break-words text-sm text-forest-900/90">{text.body}</p>
        </div>
      </div>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-forest-950">{t('coach.change')}</dt>
          <dd className="text-forest-900/85">
            <Chip tone="good" className="me-2">{t(`coach.action.${p.action}` as Key)}{trackName ? ` · ${trackName}` : ''}</Chip>
            {t('coach.changeLine', { from: valueText(t, p, p.from), to: valueText(t, p, p.to) })}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-forest-950">{t('coach.why')}</dt>
          <dd>
            <ul className="mt-1 flex flex-wrap gap-1.5">
              {p.topFactors.map((f) => <li key={f}><Chip>{t(`coach.factor.${f}` as Key)}</Chip></li>)}
            </ul>
          </dd>
        </div>
        <div>
          <dt className="font-medium text-forest-950">{t('coach.data')}</dt>
          <dd className="text-forest-900/85">{p.used.length ? p.used.map((s) => t(`coach.signal.${s}` as Key)).join(', ') : t('coach.noSignals.title')}</dd>
        </div>
        <div>
          <dt className="font-medium text-forest-950">{t('coach.effort')}</dt>
          <dd className="text-forest-900/85">{t(`coach.effort.${p.effort}` as Key)}</dd>
        </div>
        <div>
          <dt className="font-medium text-forest-950">{t('coach.limits')}</dt>
          <dd className="text-forest-900/85">{t(`coach.limit.${p.action}` as Key)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-forest-800/85">
        {rec.explanation.source === 'llm'
          ? t('coach.wording.llm', { model: rec.explanation.model ?? '' })
          : t('coach.wording.template', { reason: t(`coach.fallback.${rec.explanation.fallbackReason ?? 'not_configured'}` as Key) })}
      </p>

      {editing ? (
        <div className="mt-3 space-y-3 rounded-xl border border-forest-900/10 bg-white p-3">
          {timeEdit && (
            <div>
              <label htmlFor="coach-edit-time" className="mb-1 block text-xs font-medium text-forest-800">{t('coach.editTime')}</label>
              <input id="coach-edit-time" type="time" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-forest-900/20 px-3 text-base" />
            </div>
          )}
          {channelEdit && (
            <div>
              <label htmlFor="coach-edit-channel" className="mb-1 block text-xs font-medium text-forest-800">{t('coach.editChannel')}</label>
              <select id="coach-edit-channel" value={value} onChange={(e) => setValue(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-forest-900/20 bg-white px-3 text-base">
                {CHANNELS.filter((c) => state.prefs.channels[c] && c !== state.prefs.preferredChannel).map((c) => <option key={c} value={c}>{t(`channel.${c}` as Key)}</option>)}
              </select>
            </div>
          )}
          {!timeEdit && !channelEdit && <p className="text-sm text-forest-900/85">{t('coach.noEdit')}</p>}
          <div className="flex flex-wrap gap-2">
            {(timeEdit || channelEdit) && (
              <button type="button" onClick={() => { coach.decide('edited', value); setEditing(false); }} className="thy-btn-primary min-h-[44px] !py-2">{t('coach.save')}</button>
            )}
            <button type="button" onClick={() => setEditing(false)} className="thy-btn-ghost min-h-[44px] !py-2">{t('coach.cancel')}</button>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => coach.decide('accepted')} className="thy-btn-primary min-h-[44px] !py-2.5">{t('coach.accept')}</button>
          <button type="button" onClick={() => setEditing(true)} className="thy-btn-ghost min-h-[44px] !py-2.5">{t('coach.edit')}</button>
          <button type="button" onClick={() => coach.decide('not_now')} className="thy-btn-quiet min-h-[44px] !py-2.5">{t('coach.notNow')}</button>
        </div>
      )}
    </Card>
  );
};

export const Coach: React.FC = () => {
  const { t, fmtDateTime } = useI18n();
  const { state, today, coach } = useStore();
  const c = state.coach;
  const blocked = isBlockedSetup(state);

  useEffect(() => {
    void coach.refresh();
    // Re-check when consent or the coach switch changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.enabled, c.consent]);

  const input = useMemo(() => buildCoachInput(state, today), [state, today]);
  const risk = useMemo(() => assessRisk(input), [input]);
  const anySignal = COACH_SIGNALS.some((s) => c.consent[s]);
  const lastAuto = [...c.history].reverse().find((h) => h.decision === 'auto_applied');

  return (
    <div className="space-y-4">
      <ScreenHeader title={t('coach.title')} subtitle={t('coach.subtitle')} right={<Chip tone="warn">{t('coach.simBadge')}</Chip>} />

      <Card index={0} tone="soft">
        <p className="flex items-start gap-2 text-sm font-medium text-forest-950">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-ochre-700" aria-hidden="true" />
          <span>{t('coach.honest')}</span>
        </p>
        <p className="mt-2 text-xs text-forest-800/85">{t('coach.rulesOnly')}</p>
        <div className="mt-3 border-t border-forest-900/10 pt-1">
          <Switch checked={c.enabled} onChange={coach.setEnabled} label={t('coach.on')} hint={t('coach.turnOff')} />
        </div>
      </Card>

      {!c.enabled ? (
        <EmptyState title={t('coach.off.title')} body={t('coach.off.body')} />
      ) : (
        <>
          {blocked && <Card tone="alert"><p className="text-sm text-forest-900/90">{t('coach.blockedSetup')}</p></Card>}

          {!anySignal ? (
            <EmptyState title={t('coach.noSignals.title')} body={t('coach.noSignals.body')} />
          ) : (
            <Card index={1} labelledBy="risk-title">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="risk-title" className="font-editorial text-lg text-forest-950">{t('coach.score')}</h2>
                <Chip tone={risk.band === 'high' ? 'bad' : risk.band === 'moderate' ? 'warn' : 'good'}>
                  {t(`coach.band.${risk.band}` as Key)} · {t('coach.scoreOf', { n: risk.score })}
                </Chip>
              </div>
              <div className="mt-3" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={risk.score} aria-label={t('coach.score')}>
                <div className="h-2.5 overflow-hidden rounded-full bg-forest-900/10">
                  <div className="h-full rounded-full bg-ochre-500 transition-[width] duration-700 ease-editorial" style={{ width: `${risk.score}%` }} />
                </div>
              </div>
              <h3 className="mt-4 text-sm font-medium text-forest-950">{t('coach.factors')}</h3>
              {risk.top.length === 0 ? (
                <p className="mt-1 text-sm text-forest-800/85">{t('coach.factor.none')}</p>
              ) : (
                <ol className="mt-2 space-y-1.5">
                  {risk.top.map((f) => (
                    <li key={f.id} className="flex items-center justify-between gap-3 rounded-xl bg-ivory-100 px-3 py-2 text-sm">
                      <span className="min-w-0 break-words text-forest-950">{t(`coach.factor.${f.id as FactorId}` as Key)}</span>
                      <span className="shrink-0 text-xs text-forest-800/85">{t('coach.factor.points', { n: Math.round(f.points) })}</span>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-forest-800/85">{t('coach.signalsUsed', { list: risk.used.length ? risk.used.map((s) => t(`coach.signal.${s}` as Key)).join(', ') : '–' })}</p>
              {risk.missing.length > 0 && <p className="mt-1 text-xs text-forest-800/85">{t('coach.signalsMissing', { list: risk.missing.map((s) => t(`coach.signal.${s}` as Key)).join(', ') })}</p>}
              <p className="mt-2 font-mono text-[11px] text-forest-800/85">{t('coach.version', { c: COACH_CONFIG.version, s: COACH_SAFETY_VERSION })}</p>
            </Card>
          )}

          {c.pending ? (
            <ProposalPanel key={c.pending.id} rec={c.pending} />
          ) : (
            anySignal && !blocked && (
              <Card index={2}>
                <h2 className="font-editorial text-lg text-forest-950">{t('coach.none.title')}</h2>
                <p className="mt-1 text-sm text-forest-900/80">{t('coach.none.body')}</p>
                <button type="button" onClick={() => void coach.refresh()} disabled={coach.checking} className="thy-btn-ghost mt-3 min-h-[44px] !py-2">
                  {coach.checking ? t('coach.checking') : t('coach.check')}
                </button>
              </Card>
            )
          )}

          {lastAuto && (
            <Card index={3} tone="soft">
              <p className="text-sm text-forest-900">{t('coach.applied', { action: t(`coach.action.${lastAuto.proposal.action}` as Key) })}</p>
              <button type="button" onClick={() => coach.undo(lastAuto.id)} className="thy-btn-ghost mt-2 min-h-[44px] !py-2">
                <Undo2 className="h-4 w-4" aria-hidden="true" />
                {t('coach.undo')}
              </button>
            </Card>
          )}
        </>
      )}

      <Card index={3} labelledBy="auto-title">
        <h2 id="auto-title" className="font-editorial text-lg text-forest-950">{t('coach.auto')}</h2>
        <Switch checked={c.autoAdjust} onChange={coach.setAuto} label={t('coach.auto')} hint={t('coach.auto.body')} />
      </Card>

      <Card index={4} labelledBy="consent-title">
        <h2 id="consent-title" className="font-editorial text-lg text-forest-950">{t('coach.consent.title')}</h2>
        <p className="mt-1 text-sm text-forest-900/75">{t('coach.consent.body')}</p>
        <div className="mt-2 divide-y divide-forest-900/10">
          {COACH_SIGNALS.map((s) => (
            <Switch key={s} checked={c.consent[s]} onChange={(v) => coach.setSignal(s, v)} label={t(`coach.signal.${s}` as Key)} />
          ))}
        </div>
        <div className="mt-2 border-t border-forest-900/10 pt-1">
          <Switch checked={c.clinicianShare} onChange={coach.setClinicianShare} label={t('coach.clinicianShare')} />
        </div>
        <p className="mt-2 text-xs text-forest-800/85">{t('coach.privacy')}</p>
      </Card>

      <Wearables />

      <Card index={6} labelledBy="hist-title">
        <h2 id="hist-title" className="flex items-center gap-2 font-editorial text-lg text-forest-950">
          <History className="h-5 w-5 text-ochre-700" aria-hidden="true" />
          {t('coach.history')}
        </h2>
        {c.history.length === 0 ? (
          <p className="mt-1 text-sm text-forest-800/85">{t('coach.history.empty')}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {[...c.history].reverse().slice(0, 8).map((h) => (
              <li key={h.id} className="rounded-xl bg-ivory-100 px-3 py-2 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words font-medium text-forest-950">{t(`coach.action.${h.proposal.action}` as Key)}</span>
                  <Chip tone={h.decision === 'blocked' ? 'bad' : h.decision === 'pending' ? 'warn' : 'neutral'}>{t(`coach.decision.${h.decision}` as Key)}</Chip>
                </div>
                <p className="mt-0.5 text-xs text-forest-800/85">{fmtDateTime(h.at)}</p>
                {h.breaches?.[0] && <p className="mt-0.5 text-xs text-signal-crimson">{t('coach.blockedLine', { rule: t(`coach.rule.${h.breaches[0]}` as Key) })}</p>}
                {(h.decision === 'accepted' || h.decision === 'edited') && (
                  <button type="button" onClick={() => coach.undo(h.id)} className="thy-btn-quiet mt-1 min-h-[44px] !py-1.5">
                    <Undo2 className="h-4 w-4" aria-hidden="true" />
                    {t('coach.undo')}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <button type="button" onClick={() => go('replay')} className="thy-btn-ghost min-h-[44px] w-full">
        <PlayCircle className="h-4 w-4" aria-hidden="true" />
        {t('coach.replayLink')}
      </button>
    </div>
  );
};
