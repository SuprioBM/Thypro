/**
 * Synthetic demo profile for Guest mode.
 *
 * Everything here is invented. No real person, phone number, email or health
 * record is used. Dates are generated relative to "today" so the demo always
 * shows about three weeks of history ending a few days ago, which also lets the
 * no-shame restart prompt appear.
 */

import { DEFAULT_CONTEXT, type AppState, type AuditEntry, type CheckIn, type DeliveryLogEntry, type Feel, type GoalSetup } from '../domain/types';
import { shiftDate } from '../domain/week';
import { generatePlan } from '../plan/generate';
import { DEFAULT_CONSENT, NO_CONSENT, emptyState, reducer } from '../app/reducer';
import type { StrengthAction } from '../strength/reducer';

type Pattern = 'done' | 'skipped' | 'unknown' | null;

/** Offsets -22 … -3 (oldest first). null = no check-in that day (missing data). */
const PATTERN: Pattern[] = [
  'done', 'done', 'skipped', 'done', 'done', 'done', 'unknown', 'done',
  null, null,
  'done', 'skipped', 'done', 'done', 'done', 'done', 'done', 'skipped', 'done', 'done'
];

const FEELS: Feel[] = ['good', 'okay', 'good', 'tired', 'okay', 'good', 'okay'];

const at = (dateKey: string, hhmm: string) => new Date(`${dateKey}T${hhmm}:00`).toISOString();

export const DEMO_SETUP: GoalSetup = {
  goalType: 'walk',
  usualTime: '19:30',
  preferences: ['evening', 'indoors-when-hot'],
  dietary: ['halal'],
  allergyState: 'none',
  allergies: [],
  baseline: { walkMinutesPerDay: 10, sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  screening: {
    pregnancy: 'no',
    eatingConcerns: 'no',
    heartCondition: 'no',
    kidneyDisease: 'unknown',
    insulinDiabetes: 'no',
    otherHighRisk: 'no'
  },
  context: { ...DEFAULT_CONTEXT, heat: 'hot' }
};

export function createDemoState(today: string): AppState {
  const checkins: CheckIn[] = [];
  PATTERN.forEach((status, i) => {
    if (!status) return;
    const date = shiftDate(today, -22 + i);
    const feel: Feel | 'unknown' = status === 'unknown' ? 'unknown' : FEELS[i % FEELS.length];
    const checkin: CheckIn = {
      id: `demo-checkin-${date}`,
      date,
      status,
      feel,
      redFlags: [],
      input: 'text',
      createdAt: at(date, '20:10'),
      activityMinutes: status === 'done' ? 10 + (i % 3) * 2 : undefined
    };
    if (i === 6 || i === 17) checkin.bp = i === 6 ? { systolic: 128, diastolic: 82 } : { systolic: 124, diastolic: 80 };
    if (i === 6 || i === 17) checkin.weightKg = i === 6 ? 74.5 : 74.1;
    if (i === 4) {
      checkin.note = {
        original: 'আজ খুব গরম ছিল, তাই মলের ভেতরে হাঁটলাম।',
        lang: 'bn',
        translation: { text: 'It was very hot today, so I walked inside the mall.', lang: 'en', provider: 'demo-sample' }
      };
    }
    checkins.push(checkin);
  });

  const startDate = shiftDate(today, -22);
  const startIso = at(startDate, '08:00');
  const generated = generatePlan(DEMO_SETUP, { planId: 'plan-demo-1', version: 1, nowIso: startIso });
  if (generated.status !== 'ok') {
    // The demo setup is fixed and known-good; this guards against a future rules change.
    throw new Error('Demo setup unexpectedly failed the safety engine');
  }

  const blockedDate = shiftDate(today, -23);
  const audit: AuditEntry[] = [
    {
      id: 'demo-audit-blocked',
      at: at(blockedDate, '21:40'),
      kind: 'safety',
      ruleVersion: generated.input.ruleVersion,
      result: 'blocked',
      reasonCode: 'fastingHoursPerDay_too_high',
      reasonParams: { value: 20, limit: 16 }
    },
    {
      id: 'demo-audit-safety',
      at: startIso,
      kind: 'safety',
      ruleVersion: generated.input.ruleVersion,
      result: 'pass',
      reasonCode: 'all_rules_passed'
    },
    {
      id: 'demo-audit-plan',
      at: startIso,
      kind: 'plan',
      ruleVersion: generated.plan.ruleVersion,
      result: 'generated',
      reasonCode: 'plan_generated',
      templateId: generated.plan.templateId
    }
  ];

  const deliveryLog: DeliveryLogEntry[] = [-7, -6, -5, -4, -3].map((offset) => {
    const date = shiftDate(today, offset);
    return {
      id: `demo-delivery-${date}`,
      at: at(date, '19:15'),
      reminderId: 'rem-1',
      channel: 'in-app',
      status: 'delivered',
      simulated: true
    };
  });

  const base: AppState = {
    ...emptyState('guest', 'bn'),
    mode: 'guest',
    profile: {
      id: 'demo-guest',
      displayName: 'Rahim (demo)',
      lang: 'bn',
      city: 'Abu Dhabi',
      synthetic: true,
      familyContact: { name: 'Nasrin (demo)', relation: 'Sister', phone: '+971 50 000 0000 (demo)' },
      demographics: { gender: 'male', ageGroup: '30-44' }
    },
    setup: DEMO_SETUP,
    plans: [generated.plan],
    checkins,
    reminders: [{ id: 'rem-1', time: '19:15', enabled: true, channel: 'in-app' }],
    deliveryLog,
    audit,
    consent: { ...DEFAULT_CONSENT },
    progress: { level: 2 },
    people: [{ id: 'coach-1', name: 'Coach Farid (demo)', relation: 'Coach', consent: { ...NO_CONSENT, weeklyCompletion: true } }]
  };
  return withStrength(base, today);
}

/**
 * Invented strength history, built by running the real reducer so the demo
 * can never drift from the app's own rules: five gentle sessions over the last
 * two weeks (the next one is "today"), plus a few body-weight entries.
 */
function withStrength(state: AppState, today: string): AppState {
  let s = state;
  const run = (action: StrengthAction, date: string, hhmm: string, seed: string) => {
    s = reducer(s, { type: 'strength', action, seed: `demo-${seed}`, nowIso: at(date, hhmm) });
  };
  const planStart = shiftDate(today, -13);
  run({ type: 'screen', answers: { chest: 'no', faint: 'no', advised: 'no' }, nowIso: at(planStart, '17:50') }, planStart, '17:50', 'screen');
  run({ type: 'startPlan', starterId: 'basics', today: planStart }, planStart, '17:55', 'plan');
  [-12, -10, -8, -5, -3].forEach((offset, i) => {
    const date = shiftDate(today, offset);
    const routineId = s.strength.plan?.routines[i % 2].id ?? 'basics-a';
    run({ type: 'startWorkout', routineId, id: `demo-ws-${i}`, nowIso: at(date, '17:30'), today: date }, date, '17:30', `start-${i}`);
    const draft = s.strength.draft;
    draft?.exercises.forEach((e, ex) => e.sets.forEach((_, set) => run({ type: 'setSet', ex, set, patch: { done: true } }, date, '17:40', `set-${i}-${ex}-${set}`)));
    run({ type: 'finishWorkout', nowIso: at(date, '17:52') }, date, '17:52', `finish-${i}`);
  });
  const weights: [number, number][] = [[-13, 74.6], [-6, 74.3], [-1, 74.1]];
  weights.forEach(([offset, kg]) => run({ type: 'logBodyWeight', date: shiftDate(today, offset), kg }, today, '08:00', `bw-${offset}`));
  return s;
}
