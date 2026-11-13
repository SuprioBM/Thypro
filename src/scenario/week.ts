/**
 * "One person's week": a scripted, SYNTHETIC week for guest mode.
 *
 * The person (Bangla speaker, night-shift worker, goal: a 10-minute walk after
 * dinner) is invented. The events are scripted, but every consequence (the
 * step down, the barrier question, the time move, the channel switch, the
 * audit entries) is produced by the same pure reducer and rules the app uses.
 * Replaying is deterministic: day N always gives the same state.
 */

import { emptyState, reducer } from '../app/reducer';
import { planDelivery } from '../app/reminders';
import { DEFAULT_CONTEXT, type AppState, type Barrier, type CheckinStatus, type Feel, type GoalSetup } from '../domain/types';
import { shiftDate } from '../domain/week';

export type StoryEvent =
  | { kind: 'reminder' }
  | { kind: 'tick' }
  | { kind: 'checkin'; status: CheckinStatus; feel: Feel }
  | { kind: 'missing' }
  | { kind: 'barrier'; barrier: Barrier };

export interface StoryDay {
  index: number;
  date: string;
  events: StoryEvent[];
}

export interface Story {
  initial: AppState;
  days: StoryDay[];
}

export const STORY_SETUP: GoalSetup = {
  goalType: 'walk',
  usualTime: '19:30',
  preferences: ['evening'],
  dietary: ['halal'],
  allergyState: 'none',
  allergies: [],
  baseline: { walkMinutesPerDay: 'unknown', sleepHours: 'unknown', mealsPerDay: 'unknown', medicineTimesPerDay: 'unknown' },
  ownTargets: {},
  screening: {
    pregnancy: 'no',
    eatingConcerns: 'no',
    heartCondition: 'no',
    kidneyDisease: 'no',
    insulinDiabetes: 'no',
    otherHighRisk: 'no'
  },
  context: { ...DEFAULT_CONTEXT, shiftWork: 'night', heat: 'hot' }
};

/** Monday of the last full week before `today`, so Mon–Sun are all in the past. */
export function storyMonday(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  const sinceMonday = (dow + 6) % 7;
  return shiftDate(today, -sinceMonday - 7);
}

const SCRIPT: StoryEvent[][] = [
  /* Mon */ [{ kind: 'reminder' }, { kind: 'checkin', status: 'done', feel: 'good' }],
  /* Tue */ [{ kind: 'reminder' }, { kind: 'checkin', status: 'done', feel: 'tired' }],
  /* Wed */ [{ kind: 'reminder' }, { kind: 'checkin', status: 'skipped', feel: 'tired' }],
  /* Thu */ [{ kind: 'reminder' }, { kind: 'missing' }],
  /* Fri */ [{ kind: 'tick' }, { kind: 'barrier', barrier: 'shift' }, { kind: 'reminder' }, { kind: 'checkin', status: 'done', feel: 'okay' }],
  /* Sat */ [{ kind: 'reminder' }, { kind: 'checkin', status: 'done', feel: 'good' }],
  /* Sun */ [{ kind: 'reminder' }, { kind: 'checkin', status: 'done', feel: 'good' }]
];

export function buildStory(today: string): Story {
  const monday = storyMonday(today);
  const base = emptyState('guest', 'bn');
  const seeded: AppState = {
    ...base,
    profile: {
      ...base.profile,
      id: 'story-demo',
      displayName: 'Karim (demo)',
      synthetic: true,
      familyContact: { name: 'Shirin (demo)', relation: 'Wife', phone: '+971 50 000 0001 (demo)' }
    },
    reminders: [{ id: 'rem-1', time: STORY_SETUP.usualTime, enabled: true, channel: 'in-app' }]
  };
  const initial = reducer(seeded, {
    type: 'completeSetup',
    setup: STORY_SETUP,
    nowIso: `${shiftDate(monday, -1)}T09:00:00.000Z`,
    seed: 'story-setup'
  });
  const days = SCRIPT.map((events, index) => ({ index, date: shiftDate(monday, index), events }));
  return { initial, days };
}

/** Applies one scripted day. PURE: ids and times derive from the date. */
export function applyDay(state: AppState, day: StoryDay): AppState {
  let s = state;
  day.events.forEach((ev, i) => {
    const seed = `story-${day.date}-${i}`;
    const nowIso = `${day.date}T${String(9 + i).padStart(2, '0')}:00:00.000Z`;
    switch (ev.kind) {
      case 'tick':
        s = reducer(s, { type: 'tick', today: day.date, nowIso, seed });
        break;
      case 'barrier':
        s = reducer(s, { type: 'recordBarrier', barrier: ev.barrier, today: day.date, nowIso, seed, autoApply: true });
        break;
      case 'reminder': {
        const r = s.reminders[0];
        const [hh, mm] = r.time.split(':').map(Number);
        const [y, m, d] = day.date.split('-').map(Number);
        const when = new Date(y, m - 1, d, hh, mm);
        const plan = planDelivery(r, s.prefs, when);
        s = reducer(s, {
          type: 'logDelivery',
          entry: plan.send
            ? { id: seed, at: `${day.date}T${r.time}:00.000Z`, reminderId: r.id, channel: plan.channel, status: 'delivered', simulated: true }
            : { id: seed, at: `${day.date}T${r.time}:00.000Z`, reminderId: r.id, channel: 'none', status: 'suppressed', simulated: true, reason: plan.reason }
        });
        break;
      }
      case 'checkin':
        s = reducer(s, {
          type: 'saveCheckin',
          checkin: {
            id: seed,
            date: day.date,
            status: ev.status,
            feel: ev.feel,
            redFlags: [],
            input: 'text',
            createdAt: `${day.date}T20:15:00.000Z`,
            activityMinutes: ev.status === 'done' ? s.plans[s.plans.length - 1]?.items[0]?.params.minutes as number : undefined
          },
          nowIso,
          seed
        });
        break;
      case 'missing':
        break;
    }
  });
  return s;
}

/** State after the first `n` days (0 = before Monday). */
export function replayTo(story: Story, n: number): AppState {
  return story.days.slice(0, Math.max(0, n)).reduce(applyDay, story.initial);
}
