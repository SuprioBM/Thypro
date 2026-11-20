import { describe, expect, it, vi } from 'vitest';
import { emptyState } from '../app/reducer';
import { DEFAULT_CONTEXT, type AppState } from '../domain/types';
import { shiftDate } from '../domain/week';
import { translate } from '../i18n';
import { freshPlanner } from '../planner/types';
import { EMPTY_WEARABLES, parseCsv, simulatedFeed } from '../wearables/feed';
import { handleCoachExplain, parseRequest } from '../server/coachExplain';
import { COACH_CONFIG } from './config';
import { isAllowedAction, selectProposal, validateProposal, type CoachContext } from './actions';
import { explainProposal, redactForLlm, screenExplanation, templateExplanation, validateExplanationShape } from './explain';
import { buildCoachContext, buildCoachInput, trackCompletion, visibleWearable } from './input';
import { assessRisk, type CoachInput } from './risk';
import { coachReducer, emptyCoach, revertProposal } from './reducer';
import { COACH_ACTIONS, type CoachProposal } from './types';
import { buildFhirBundle, validateBundle } from '../fhir/export';

const TODAY = '2026-11-12';
const base = (over: Partial<CoachInput> = {}): CoachInput => ({
  today: TODAY,
  completion: {},
  startedOn: shiftDate(TODAY, -14),
  barriers: [],
  shiftWork: 'none',
  heat: 'mild',
  fasting: 'none',
  usualTime: '19:30',
  preShiftOn: false,
  sleepHours: [],
  used: ['planner', 'checkins'],
  missing: [],
  ...over
});
const t = (key: never, params?: Record<string, string | number>) => translate('en', key, params);

/** Completion map: done every day except those offsets back from today. */
function completionWithMisses(missOffsets: number[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (let i = 14; i >= 1; i--) out[shiftDate(TODAY, -i)] = missOffsets.includes(i) ? 0 : 1;
  return out;
}

describe('risk score and factor ranking', () => {
  it('is 0 for a steady person with no pressure and is bounded 0..100', () => {
    const r = assessRisk(base({ completion: completionWithMisses([]) }));
    expect(r.score).toBe(0);
    expect(r.band).toBe('low');
    expect(r.top).toEqual([]);
    const worst = assessRisk(base({ completion: completionWithMisses([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]), barriers: [1, 2, 3, 4].map((i) => ({ date: shiftDate(TODAY, -i), barrier: 'tired' })), shiftWork: 'night', heat: 'hot', sleepHours: [4, 4, 4], usualTime: '21:00' }));
    expect(worst.score).toBeLessThanOrEqual(100);
    expect(worst.band).toBe('high');
  });

  it('weights sum to 100 and every factor appears once', () => {
    expect(Object.values(COACH_CONFIG.weights).reduce((a, b) => a + b, 0)).toBe(100);
    expect(assessRisk(base()).factors).toHaveLength(6);
  });

  it('ranks factors by contribution, shows only the top three, and is stable on ties', () => {
    const r = assessRisk(
      base({
        completion: completionWithMisses([1, 2, 3]),
        barriers: [{ date: shiftDate(TODAY, -1), barrier: 'shift' }, { date: shiftDate(TODAY, -2), barrier: 'shift' }],
        shiftWork: 'night',
        heat: 'hot',
        usualTime: '21:00'
      })
    );
    expect(r.top.length).toBeLessThanOrEqual(3);
    const pts = r.factors.map((f) => f.points);
    expect([...pts].sort((a, b) => b - a)).toEqual(pts);
    expect(r.top.map((f) => f.id)).toEqual(r.factors.filter((f) => f.points > 0).slice(0, 3).map((f) => f.id));
    expect(assessRisk(base())).toEqual(assessRisk(base()));
  });

  it('more consecutive misses never lowers the score', () => {
    const s = (n: number) => assessRisk(base({ completion: completionWithMisses(Array.from({ length: n }, (_, i) => i + 1)) })).score;
    expect(s(0)).toBeLessThanOrEqual(s(1));
    expect(s(1)).toBeLessThanOrEqual(s(2));
    expect(s(2)).toBeLessThanOrEqual(s(3));
  });

  it('a pre-shift reminder lowers the shift-conflict contribution', () => {
    const night = { shiftWork: 'night' as const, usualTime: '21:00' };
    const without = assessRisk(base(night)).factors.find((f) => f.id === 'shift')!.points;
    const withPre = assessRisk(base({ ...night, preShiftOn: true })).factors.find((f) => f.id === 'shift')!.points;
    expect(withPre).toBeLessThan(without);
  });

  it('sleep debt only counts when sleep data exists; missing data stays missing', () => {
    expect(assessRisk(base({ sleepHours: [] })).factors.find((f) => f.id === 'sleepDebt')!.points).toBe(0);
    expect(assessRisk(base({ sleepHours: [5, 5, 5] })).factors.find((f) => f.id === 'sleepDebt')!.points).toBeGreaterThan(0);
  });
});

describe('allowed-action validation', () => {
  const ctx = (over: Partial<CoachContext> = {}): CoachContext => ({
    planner: freshPlanner(),
    context: DEFAULT_CONTEXT,
    screening: { kidneyDisease: 'no', heartCondition: 'no' },
    prefs: { channels: { 'in-app': true, message: true, voice: false }, preferredChannel: 'in-app', quietHours: { enabled: true, start: '22:00', end: '07:00' } },
    setupBlocked: false,
    ...over
  });

  it('the allowed set is exactly the six approved actions; anything else is rejected', () => {
    expect([...COACH_ACTIONS].sort()).toEqual(['add_preshift_reminder', 'change_time', 'pause_hydration_fasting', 'reduce_goal', 'swap_behaviour', 'switch_channel']);
    for (const bad of ['increase_goal', 'send_message', 'prescribe', 'delete_data', '', undefined, 3, null]) expect(isAllowedAction(bad)).toBe(false);
    expect(validateProposal({ action: 'increase_goal', from: '1', to: '2' }, ctx()).breaches).toContain('action_not_allowed');
  });

  it('reduce_goal must lower by exactly one level and never below 1', () => {
    expect(validateProposal({ action: 'reduce_goal', track: 'activity', from: '2', to: '1' }, ctx()).ok).toBe(true);
    expect(validateProposal({ action: 'reduce_goal', track: 'activity', from: '2', to: '0' }, ctx()).ok).toBe(false);
    const c = ctx();
    c.planner.tracks.activity.level = 1;
    expect(validateProposal({ action: 'reduce_goal', track: 'activity', from: '1', to: '0' }, c).ok).toBe(false);
  });

  it('change_time rejects invalid times, quiet hours, and midday heat for activity', () => {
    expect(validateProposal({ action: 'change_time', track: 'activity', from: '19:30', to: '25:99' }, ctx()).ok).toBe(false);
    expect(validateProposal({ action: 'change_time', track: 'activity', from: '19:30', to: '23:00' }, ctx()).breaches).toContain('time_in_quiet_hours');
    const hot = ctx({ context: { ...DEFAULT_CONTEXT, heat: 'hot' } });
    expect(validateProposal({ action: 'change_time', track: 'activity', from: '19:30', to: '13:00' }, hot).breaches).toContain('time_in_heat');
    expect(validateProposal({ action: 'change_time', track: 'activity', from: '19:30', to: '18:30' }, hot).ok).toBe(true);
  });

  it('never proposes hydration changes for a flagged condition, or pausing outside Ramadan', () => {
    const flagged = ctx({ context: { ...DEFAULT_CONTEXT, fasting: 'ramadan' }, screening: { kidneyDisease: 'yes', heartCondition: 'no' } });
    expect(validateProposal({ action: 'pause_hydration_fasting', track: 'hydration', from: 'on', to: 'paused' }, flagged).breaches).toContain('hydration_flagged');
    expect(validateProposal({ action: 'pause_hydration_fasting', track: 'hydration', from: 'on', to: 'paused' }, ctx()).breaches).toContain('pause_invalid');
  });

  it('switch_channel needs an enabled, different channel', () => {
    expect(validateProposal({ action: 'switch_channel', from: 'in-app', to: 'message' }, ctx()).ok).toBe(true);
    expect(validateProposal({ action: 'switch_channel', from: 'in-app', to: 'voice' }, ctx()).ok).toBe(false);
    expect(validateProposal({ action: 'switch_channel', from: 'in-app', to: 'in-app' }, ctx()).ok).toBe(false);
  });

  it('proposes exactly one valid action, or none below the threshold, or none when safety answers block', () => {
    const input = base({ completion: completionWithMisses([1, 2]), shiftWork: 'night', usualTime: '21:00' });
    const risk = assessRisk(input);
    const c = ctx({ context: { ...DEFAULT_CONTEXT, shiftWork: 'night' } });
    const pick = (over: Partial<CoachContext> = {}, r = risk) => selectProposal({ input, risk: r, ctx: { ...c, ...over }, trackCompletion: () => 0.2, id: 'p1', nowIso: 'x' });
    const p = pick();
    expect(p).not.toBeNull();
    expect(isAllowedAction(p!.action)).toBe(true);
    expect(validateProposal(p!, c).ok).toBe(true);
    expect(pick({ setupBlocked: true })).toBeNull();
    expect(pick({}, assessRisk(base({ completion: completionWithMisses([]) })))).toBeNull();
  });

  it('a recurring shift barrier leads to a pre-shift reminder; tiredness to a time change', () => {
    const mk = (barrier: string) => {
      const input = base({ completion: completionWithMisses([1, 2]), barriers: [1, 2, 3].map((i) => ({ date: shiftDate(TODAY, -i), barrier })) });
      return selectProposal({ input, risk: assessRisk(input), ctx: ctx(), trackCompletion: () => 0.1, id: 'p', nowIso: 'x' })!;
    };
    expect(mk('shift').action).toBe('add_preshift_reminder');
    expect(mk('tired').action).toBe('change_time');
  });
});

describe('explanations and LLM fallback', () => {
  const proposal: CoachProposal = {
    id: 'p1', action: 'change_time', track: 'activity', from: '19:30', to: '18:30', topFactors: ['misses', 'heat'], score: 62, band: 'high',
    effort: 'medium', reversible: true, configVersion: COACH_CONFIG.version, createdAt: 'x', used: ['planner']
  };
  const opts = { t: t as never, lang: 'en' as const, tone: 'neutral' as const, now: 1000, cooldownUntil: null };

  it('redacts: only allow-listed fields leave the page, no identifiers', () => {
    const r = redactForLlm({ ...proposal, barrier: 'family' }, 'bn', 'neutral');
    expect(Object.keys(r).sort()).toEqual(['action', 'band', 'effort', 'factors', 'from', 'lang', 'task', 'to', 'tone', 'track']);
    const json = JSON.stringify(r);
    for (const secret of ['Rahim', 'Nasrin', 'Abu Dhabi', '+971', 'p1', 'family']) expect(json).not.toContain(secret);
  });

  it('uses the template when no provider is configured', async () => {
    const f = vi.fn();
    const r = await explainProposal(proposal, { ...opts, fetchImpl: f as never });
    expect(f).not.toHaveBeenCalled();
    expect(r.record).toEqual({ source: 'template', fallbackReason: 'not_configured' });
    expect(r.explanation).toEqual(templateExplanation(proposal, t as never));
  });

  it('falls back on network error and sets a cooldown, then does not call again', async () => {
    const f = vi.fn().mockRejectedValue(new Error('offline'));
    const r1 = await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: f as never });
    expect(r1.record.source).toBe('template');
    expect(r1.cooldownUntil).toBeGreaterThan(1000);
    const r2 = await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: f as never, cooldownUntil: r1.cooldownUntil });
    expect(r2.record.fallbackReason).toBe('cooldown');
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('falls back with a cooldown on quota (429) and on server errors', async () => {
    const quota = await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: (async () => new Response('{}', { status: 429 })) as never });
    expect(quota.record).toMatchObject({ source: 'template', fallbackReason: 'quota' });
    expect(quota.cooldownUntil).not.toBeNull();
    const err = await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: (async () => new Response('{}', { status: 500 })) as never });
    expect(err.record.fallbackReason).toBe('http_error');
  });

  it('falls back on invalid JSON shape, extra-long text, and unsafe wording', async () => {
    const reply = (body: unknown) => (async () => new Response(JSON.stringify(body), { status: 200 })) as never;
    expect((await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: reply({ headline: 5 }) })).record.fallbackReason).toBe('invalid_json');
    expect((await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: reply({ headline: 'ok', body: 'x'.repeat(500) }) })).record.fallbackReason).toBe('invalid_json');
    expect((await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: reply({ headline: 'A new time', body: 'Take 2 mg of this to cure it.' }) })).record.fallbackReason).toBe('forbidden_wording');
    expect((await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: reply({ headline: 'A new time', body: 'Walk for 45 minutes at 18:30.' }) })).record.fallbackReason).toBe('unexpected_number');
  });

  it('accepts a valid, safe model reply and records the model name', async () => {
    const f = (async () => new Response(JSON.stringify({ headline: 'A cooler time', body: 'Moving your walk from 19:30 to 18:30 may feel easier.', model: 'test-model' }), { status: 200 })) as never;
    const r = await explainProposal(proposal, { ...opts, url: 'x', fetchImpl: f });
    expect(r.record).toMatchObject({ source: 'llm', model: 'test-model' });
    expect(r.explanation.headline).toBe('A cooler time');
  });

  it('never lets a model pick the action: a non-allowed action is never sent or shown', async () => {
    const f = vi.fn();
    const r = await explainProposal({ ...proposal, action: 'prescribe' as never }, { ...opts, url: 'x', fetchImpl: f as never });
    expect(f).not.toHaveBeenCalled();
    expect(r.record.fallbackReason).toBe('action_not_allowed');
  });

  it('schema and screen helpers', () => {
    expect(validateExplanationShape({ headline: 'a', body: 'b' })).toBe(true);
    expect(validateExplanationShape({ headline: '', body: 'b' })).toBe(false);
    expect(screenExplanation({ headline: 'Visit http://x.com', body: 'hi' }, proposal).ok).toBe(false);
  });

  it('has a template for every allowed action in every language', () => {
    for (const lang of ['en', 'bn', 'hi', 'ur'] as const) {
      for (const action of COACH_ACTIONS) {
        const e = templateExplanation({ ...proposal, action }, ((k: never, p?: Record<string, string | number>) => translate(lang, k, p)) as never);
        expect(e.headline.length).toBeGreaterThan(3);
        expect(e.body.length).toBeGreaterThan(10);
      }
    }
  });
});

describe('proxy server core', () => {
  const good = { task: 'coach_explain', lang: 'en', tone: 'neutral', action: 'change_time', track: 'activity', from: '19:30', to: '18:30', factors: ['misses'], band: 'high', effort: 'medium' };
  it('rejects non-allow-listed requests', () => {
    expect(parseRequest(good).ok).toBe(true);
    expect(parseRequest({ ...good, action: 'prescribe' }).ok).toBe(false);
    expect(parseRequest({ ...good, from: 'Rahim lives in Abu Dhabi, call 050' }).ok).toBe(false);
    expect(parseRequest({ ...good, lang: 'fr' }).ok).toBe(false);
  });
  it('reports not_configured without a key and never calls the provider', async () => {
    const f = vi.fn();
    expect((await handleCoachExplain(good, {}, f as never)).status).toBe(503);
    expect(f).not.toHaveBeenCalled();
  });
  it('passes the key only in the Authorization header and returns the shape the client expects', async () => {
    const f = vi.fn(async (_u: string, init?: RequestInit) => {
      expect(String(init?.body)).not.toContain('secret-key');
      return new Response(JSON.stringify({ choices: [{ message: { content: '{"headline":"Hi","body":"Hello"}' } }] }), { status: 200 });
    });
    const out = await handleCoachExplain(good, { GROQ_API_KEY: 'secret-key' }, f as never);
    expect(out.status).toBe(200);
    expect(out.body).toMatchObject({ headline: 'Hi', body: 'Hello' });
    expect(JSON.stringify(out.body)).not.toContain('secret-key');
  });
  it('fails over to the next key on 429 and stops at the first success', async () => {
    const seen: string[] = [];
    const f = vi.fn(async (_u: string, init?: RequestInit) => {
      const auth = String((init?.headers as Record<string, string>).Authorization);
      seen.push(auth);
      return auth.endsWith('k2') ? new Response(JSON.stringify({ choices: [{ message: { content: '{"headline":"Hi","body":"Hello"}' } }] }), { status: 200 }) : new Response('{}', { status: 429 });
    });
    const out = await handleCoachExplain(good, { GROQ_API_KEYS: 'k1, k2,k3' }, f as never);
    expect(out.status).toBe(200);
    expect(seen).toEqual(['Bearer k1', 'Bearer k2']);
  });
  it('maps provider quota to 429 so the browser backs off', async () => {
    expect((await handleCoachExplain(good, { GROQ_API_KEY: 'k' }, (async () => new Response('{}', { status: 429 })) as never)).status).toBe(429);
  });
});

describe('signal consent', () => {
  const sample = (): AppState => {
    const s = emptyState('local', 'en');
    return { ...s, planner: { ...freshPlanner(), startedOn: shiftDate(TODAY, -3), entries: { [shiftDate(TODAY, -3)]: { activity: { done: true, at: 'x' } } } }, wearables: { source: 'csv', data: { [shiftDate(TODAY, -1)]: { sleepMinutes: 300, steps: 4000 } } } };
  };

  it('local mode starts with nothing authorised; guest starts with synthetic non-device signals only', () => {
    expect(Object.values(emptyCoach('local').consent).some(Boolean)).toBe(false);
    const g = emptyCoach('guest').consent;
    expect([g.steps, g.sleep, g.activity]).toEqual([false, false, false]);
    expect(g.checkins && g.planner && g.barriers && g.context).toBe(true);
  });

  it('reads no signal without consent and reports it as missing', () => {
    const s = sample();
    const input = buildCoachInput(s, TODAY);
    expect(input.used).toEqual([]);
    expect(input.missing).toContain('planner');
    expect(input.completion).toEqual({});
    expect(visibleWearable(s, 'sleepMinutes', shiftDate(TODAY, -1))).toBeNull();
  });

  it('grants and revokes per signal, with an audit entry each time', () => {
    let s = sample();
    s = coachReducer(s, { type: 'setSignal', signal: 'sleep', value: true, nowIso: 'n', seed: 'a' });
    expect(visibleWearable(s, 'sleepMinutes', shiftDate(TODAY, -1))).toBe(300);
    expect(visibleWearable(s, 'steps', shiftDate(TODAY, -1))).toBeNull(); // steps still not authorised
    expect(buildCoachInput(s, TODAY).sleepHours).toEqual([5]);
    s = coachReducer(s, { type: 'setSignal', signal: 'sleep', value: false, nowIso: 'n', seed: 'b' });
    expect(visibleWearable(s, 'sleepMinutes', shiftDate(TODAY, -1))).toBeNull();
    expect(buildCoachInput(s, TODAY).sleepHours).toEqual([]);
    expect(s.audit.filter((a) => a.kind === 'coach').map((a) => a.reasonCode)).toEqual(['coach_signal_on', 'coach_signal_off']);
  });

  it('missing wearable values stay missing and are never zero', () => {
    let s = sample();
    s = coachReducer(s, { type: 'setSignal', signal: 'steps', value: true, nowIso: 'n', seed: 'a' });
    expect(visibleWearable(s, 'steps', shiftDate(TODAY, -2))).toBeNull();
  });
});

describe('coach decisions and audit', () => {
  const proposal: CoachProposal = {
    id: 'cp1', action: 'switch_channel', from: 'in-app', to: 'message', topFactors: ['misses'], score: 60, band: 'high', effort: 'medium',
    reversible: true, configVersion: COACH_CONFIG.version, createdAt: 'x', used: ['planner']
  };
  const start = () => {
    const s = emptyState('guest', 'en');
    return { ...s, coach: { ...s.coach, consent: { ...s.coach.consent, planner: true } } };
  };
  const propose = (s: AppState, p = proposal) => coachReducer(s, { type: 'propose', proposal: p, explanation: { source: 'template' }, inputSummary: 'score 60', nowIso: 'n1', seed: 's1' });

  it('is pending until the person decides; automatic adjustment is OFF by default', () => {
    expect(emptyCoach('guest').autoAdjust).toBe(false);
    const s = propose(start());
    expect(s.coach.pending?.proposal.id).toBe('cp1');
    expect(s.prefs.preferredChannel).toBe('in-app');
    const entry = s.audit.find((a) => a.kind === 'coach')!;
    expect(entry.meta).toMatchObject({ configVersion: COACH_CONFIG.version, explanation: 'template', input: 'score 60' });
  });

  it('accept applies exactly the proposed change; undo restores it; both are audited', () => {
    let s = coachReducer(propose(start()), { type: 'decide', decision: 'accepted', today: 'd', nowIso: 'n2', seed: 's2' });
    expect(s.prefs.preferredChannel).toBe('message');
    expect(s.coach.pending).toBeNull();
    s = coachReducer(s, { type: 'undo', id: 'cp1', nowIso: 'n3', seed: 's3' });
    expect(s.prefs.preferredChannel).toBe('in-app');
    expect(s.audit.filter((a) => a.kind === 'coach').map((a) => a.result)).toEqual(['proposed', 'accepted', 'undone']);
  });

  it('"Not now" changes nothing and is logged', () => {
    const s = coachReducer(propose(start()), { type: 'decide', decision: 'not_now', today: 'd', nowIso: 'n2', seed: 's2' });
    expect(s.prefs.preferredChannel).toBe('in-app');
    expect(s.coach.history[0].decision).toBe('not_now');
  });

  it('edit re-validates: an unsafe edited time is blocked and nothing changes', () => {
    const p: CoachProposal = { ...proposal, action: 'change_time', track: 'activity', from: '19:30', to: '18:30' };
    const s = coachReducer(propose(start(), p), { type: 'decide', decision: 'edited', editedTo: '23:30', today: 'd', nowIso: 'n2', seed: 's2' });
    expect(s.planner.tracks.activity.time).toBeUndefined();
    expect(s.coach.history[0].decision).toBe('blocked');
    const ok = coachReducer(propose(start(), p), { type: 'decide', decision: 'edited', editedTo: '18:00', today: 'd', nowIso: 'n2', seed: 's2' });
    expect(ok.planner.tracks.activity.time).toBe('18:00');
  });

  it('auto-adjust applies only reversible low-risk actions; reduce_goal still waits for the person', () => {
    let s = { ...start(), coach: { ...start().coach, autoAdjust: true } };
    s = propose(s);
    expect(s.prefs.preferredChannel).toBe('message');
    expect(s.coach.history[0].decision).toBe('auto_applied');
    const reduce: CoachProposal = { ...proposal, id: 'cp2', action: 'reduce_goal', track: 'activity', from: '2', to: '1', reversible: false };
    const s2 = propose({ ...start(), coach: { ...start().coach, autoAdjust: true } }, reduce);
    expect(s2.planner.tracks.activity.level).toBe(2);
    expect(s2.coach.pending).not.toBeNull();
  });

  it('blocks an invalid proposal (and logs it) instead of showing it', () => {
    const bad = { ...proposal, action: 'prescribe' as never };
    const s = propose(start(), bad);
    expect(s.coach.pending).toBeNull();
    expect(s.coach.history[0].decision).toBe('blocked');
    expect(s.audit.find((a) => a.kind === 'coach')!.result).toBe('blocked');
  });

  it('Turn Off Coach clears the pending proposal and stops proposals', () => {
    let s = propose(start());
    s = coachReducer(s, { type: 'setEnabled', value: false, nowIso: 'n', seed: 'x' });
    expect(s.coach.pending).toBeNull();
    expect(propose(s, { ...proposal, id: 'cp9' }).coach.pending).toBeNull();
  });

  it('clinician override reverts an applied change and is audited as the clinician demo', () => {
    let s = coachReducer(propose(start()), { type: 'decide', decision: 'accepted', today: 'd', nowIso: 'n2', seed: 's2' });
    s = coachReducer(s, { type: 'clinician', id: 'cp1', decision: 'overridden', nowIso: 'n3', seed: 's3' });
    expect(s.prefs.preferredChannel).toBe('in-app');
    expect(s.audit[s.audit.length - 1].meta).toMatchObject({ by: 'clinician-demo' });
    const hidden = coachReducer(coachReducer(propose(start()), { type: 'setClinicianShare', value: false }), { type: 'clinician', id: 'cp1', decision: 'overridden', nowIso: 'n', seed: 'z' });
    expect(hidden.audit.filter((a) => a.result === 'overridden')).toHaveLength(0);
  });

  it('every action reverts to its previous state', () => {
    const s = start();
    for (const [action, track, from, to] of [['reduce_goal', 'activity', '2', '1'], ['change_time', 'activity', '19:30', '18:30'], ['swap_behaviour', 'activity', 'default', 'alt'], ['add_preshift_reminder', undefined, 'off', '18:30'], ['pause_hydration_fasting', 'hydration', 'on', 'paused']] as const) {
      const p = { ...proposal, action, track, from, to } as CoachProposal;
      const applied = coachReducer(coachReducer(propose(s, p), { type: 'decide', decision: 'accepted', today: 'd', nowIso: 'n', seed: 'q' }), { type: 'undo', id: 'cp1', nowIso: 'n', seed: 'r' });
      expect(applied.planner.tracks.activity.level).toBe(2);
      expect(applied.planner.preShift.enabled).toBe(false);
      expect(applied.planner.hydrationPausedFasting).toBe(false);
      expect(revertProposal(s, p).planner.tracks.activity.variant).toBe('default');
    }
  });
});

describe('wearable CSV and simulated feed', () => {
  it('parses steps, sleep and activity; blank cells stay missing', () => {
    const r = parseCsv('date,steps,sleep_minutes,activity_minutes\n2026-11-01,5000,420,20\n2026-11-02,,,15\n');
    expect(r.data['2026-11-01']).toEqual({ steps: 5000, sleepMinutes: 420, activityMinutes: 20 });
    expect(r.data['2026-11-02']).toEqual({ activityMinutes: 15 });
    expect(r.errors).toEqual([]);
  });

  it('never accepts glucose: the column is ignored and reported', () => {
    const r = parseCsv('date,steps,glucose_mg_dl\n2026-11-01,5000,140\n');
    expect(r.ignored).toContain('glucose_mg_dl');
    expect(JSON.stringify(r.data)).not.toContain('140');
  });

  it('rejects bad dates and out-of-range values without crashing', () => {
    const r = parseCsv('date,steps\nnot-a-date,5\n2026-11-03,9999999\n2026-11-04,100\n');
    expect(r.errors).toHaveLength(2);
    expect(Object.keys(r.data)).toEqual(['2026-11-04']);
    expect(parseCsv('').errors).toContain('empty');
    expect(parseCsv('steps\n1').errors).toContain('no_date_column');
  });

  it('simulated feed is deterministic, labelled synthetic, and has gaps', () => {
    const a = simulatedFeed(TODAY, 14, 'night-shift', shiftDate);
    expect(a).toEqual(simulatedFeed(TODAY, 14, 'night-shift', shiftDate));
    expect(Object.keys(a).length).toBeLessThan(14);
    expect(Object.values(a).some((d) => d.sleepMinutes === undefined)).toBe(true);
  });

  it('wearable state starts empty', () => {
    expect(EMPTY_WEARABLES.source).toBeNull();
  });
});

describe('builds the coach context and input from state', () => {
  it('reads planner + context only with consent and exposes completion per track', () => {
    const s = emptyState('guest', 'en');
    const state: AppState = { ...s, planner: { ...freshPlanner(), startedOn: shiftDate(TODAY, -2), entries: { [shiftDate(TODAY, -1)]: { activity: { done: true, at: 'x' }, hydration: { done: true, at: 'x' } } } } };
    const input = buildCoachInput(state, TODAY);
    expect(input.used).toEqual(expect.arrayContaining(['planner', 'checkins']));
    expect(input.completion[shiftDate(TODAY, -1)]).toBeCloseTo(0.5);
    expect(buildCoachContext(state).setupBlocked).toBe(false);
    expect(trackCompletion(state, TODAY)('activity')).toBeCloseTo(1 / 7);
  });
});

describe('export and deletion cover coach data', () => {
  it('the FHIR export includes coach adjustments and self-recorded planner values, and still validates', () => {
    let s = emptyState('local', 'en');
    s = { ...s, planner: { ...freshPlanner(), startedOn: '2026-11-10', entries: { '2026-11-10': { hydration: { done: true, glasses: 6, at: 'x' }, activity: { done: true, at: 'x' } } } } };
    const proposal: CoachProposal = { id: 'cpx', action: 'switch_channel', from: 'in-app', to: 'message', topFactors: ['misses'], score: 50, band: 'high', effort: 'medium', reversible: true, configVersion: COACH_CONFIG.version, createdAt: 'x', used: [] };
    s = coachReducer({ ...s, coach: { ...s.coach, enabled: true } }, { type: 'propose', proposal, explanation: { source: 'template' }, inputSummary: 'i', nowIso: '2026-11-11T08:00:00.000Z', seed: 'a' });
    const bundle = buildFhirBundle(s, new Date('2026-11-12T00:00:00Z'));
    const types = bundle.entry.map((e) => e.resource.resourceType);
    expect(types).toContain('Basic');
    expect(JSON.stringify(bundle)).toContain('planner-water-glasses');
    expect(JSON.stringify(bundle)).not.toContain('planner-activity-minutes'); // not recorded, so not invented
    expect(validateBundle(bundle).valid).toBe(true);
  });

  it('deleting data resets coach and planner state to empty defaults', () => {
    const fresh = emptyState('local', 'en');
    expect(fresh.coach.history).toEqual([]);
    expect(fresh.planner.entries).toEqual({});
    expect(fresh.wearables.data).toEqual({});
  });
});
