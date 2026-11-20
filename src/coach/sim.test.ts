import { describe, expect, it } from 'vitest';
import { PERSONA_IDS, simulate } from './sim';
import { isAllowedAction } from './actions';

const TODAY = '2026-11-20';

describe('persona simulation (synthetic)', () => {
  it('is deterministic and uses only invented, synthetic profiles', () => {
    for (const id of PERSONA_IDS) {
      expect(simulate(id, true, TODAY).days).toEqual(simulate(id, true, TODAY).days);
      expect(simulate(id, true, TODAY).state.profile.synthetic).toBe(true);
    }
  });

  it('the coach never makes the week worse and helps every persona', () => {
    for (const id of PERSONA_IDS) {
      const w = simulate(id, true, TODAY).summary;
      const wo = simulate(id, false, TODAY).summary;
      expect(w.doneTrackDays, id).toBeGreaterThan(wo.doneTrackDays);
      expect(w.missedDays, id).toBeLessThanOrEqual(wo.missedDays);
      expect(wo.proposals).toBe(0);
    }
  });

  it('without the coach there are no coach events; with it every proposal is an allowed action', () => {
    for (const id of PERSONA_IDS) {
      const without = simulate(id, false, TODAY);
      expect(without.state.audit.filter((a) => a.kind === 'coach')).toHaveLength(0);
      for (const d of simulate(id, true, TODAY).days) for (const e of d.events) if (e.kind === 'proposal') expect(isAllowedAction(e.detail)).toBe(true);
    }
  });

  it('night-shift: a missed day, the barrier question, a proactive adjustment BEFORE a second miss, and a channel switch; step-down appears without the coach', () => {
    const w = simulate('night-shift', true, TODAY).days;
    const kinds = w.flatMap((d) => d.events.map((e) => e.kind));
    expect(kinds).toEqual(expect.arrayContaining(['missed', 'barrier', 'proposal', 'accepted', 'channel_switch']));
    const firstMiss = w.findIndex((d) => d.events.some((e) => e.kind === 'missed'));
    const firstProposal = w.findIndex((d) => d.events.some((e) => e.kind === 'proposal'));
    expect(firstProposal).toBe(firstMiss + 1);
    expect(w[firstProposal].completion).toBeGreaterThanOrEqual(0.5); // no second miss
    expect(simulate('night-shift', false, TODAY).days.flatMap((d) => d.events).some((e) => e.kind === 'step_down')).toBe(true);
  });

  it('cumulative total days are never lower than the days actually done', () => {
    for (const id of PERSONA_IDS) {
      const r = simulate(id, false, TODAY);
      expect(r.summary.totalDays).toBe(r.summary.doneTrackDays);
    }
  });

  it('Ramadan: the coach moves water to after iftar; hydration stays inside approved limits', () => {
    const r = simulate('ramadan', true, TODAY);
    expect(r.state.planner.hydrationPausedFasting).toBe(true);
    expect(r.days.flatMap((d) => d.events).some((e) => e.kind === 'proposal' && e.detail === 'pause_hydration_fasting')).toBe(true);
  });
});
