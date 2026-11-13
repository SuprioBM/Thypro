import { describe, expect, it } from 'vitest';
import { cumulativeDays } from '../domain/ladder';
import { buildStory, replayTo, storyMonday } from './week';

const TODAY = '2026-11-14'; // a Saturday

describe("one person's week", () => {
  const story = buildStory(TODAY);

  it('covers the last full Monday to Sunday before today', () => {
    expect(storyMonday(TODAY)).toBe('2026-11-02');
    expect(story.days.map((d) => d.date)).toEqual([
      '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'
    ]);
  });

  it('starts as a Bangla-speaking night-shift worker with a 10-minute walk', () => {
    const s = story.initial;
    expect(s.profile.lang).toBe('bn');
    expect(s.profile.synthetic).toBe(true);
    expect(s.setup?.context?.shiftWork).toBe('night');
    expect(s.plans[0].targets.exerciseMinutesPerDay).toBe(10);
    expect(s.progress.level).toBe(2);
  });

  it('nothing happens to the level until two days are missed', () => {
    expect(replayTo(story, 4).progress.level).toBe(2);
  });

  it('on Friday: steps down, asks the barrier, moves the time and switches the channel', () => {
    const fri = replayTo(story, 5);
    expect(fri.progress.level).toBe(1);
    expect(fri.barriers.map((b) => b.barrier)).toEqual(['shift']);
    expect(fri.setup?.usualTime).toBe('16:30');
    expect(fri.prefs.preferredChannel).toBe('message');
    const codes = fri.audit.map((a) => a.reasonCode);
    expect(codes).toContain('ladder_step_down');
    expect(codes).toContain('adapt_move_time');
    expect(codes).toContain('adapt_switch_channel');
  });

  it('the reminder channel actually changes after the switch', () => {
    const end = replayTo(story, 7);
    expect(end.deliveryLog.map((d) => d.channel)).toEqual(['in-app', 'in-app', 'in-app', 'in-app', 'message', 'message', 'message']);
  });

  it('ends with 5 done days counted cumulatively; nothing resets', () => {
    const end = replayTo(story, 7);
    expect(cumulativeDays(end.checkins)).toBe(5);
    for (let n = 1; n <= 7; n++) expect(cumulativeDays(replayTo(story, n).checkins)).toBeGreaterThanOrEqual(cumulativeDays(replayTo(story, n - 1).checkins));
  });

  it('is deterministic and never touches the starting state', () => {
    const snap = JSON.stringify(story.initial);
    expect(replayTo(story, 7)).toEqual(replayTo(buildStory(TODAY), 7));
    expect(JSON.stringify(story.initial)).toBe(snap);
  });
});
