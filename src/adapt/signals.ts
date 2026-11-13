/**
 * Placeholder "personal best time and tone" tracker.
 *
 * It ONLY records when check-ins happen and which channel and tone were in
 * use, so the pilot can later study whether timing matters. Nothing here
 * changes reminders, plans or wording, and nothing is called machine learning.
 */

import type { ChannelId, PilotSignal, UserPrefs } from '../domain/types';

export function makeSignal(date: string, createdAtIso: string, channel: ChannelId | null, tone: UserPrefs['tone']): PilotSignal {
  return { date, hour: new Date(createdAtIso).getHours(), channel, tone };
}

export interface SignalSummary {
  count: number;
  byHour: Record<number, number>;
  /** Most frequent check-in hour so far. Shown as data only; never acted on. */
  mostCommonHour: number | null;
  byTone: Record<UserPrefs['tone'], number>;
  byChannel: Record<ChannelId | 'none', number>;
}

export function summarizeSignals(signals: PilotSignal[]): SignalSummary {
  const byHour: Record<number, number> = {};
  const byTone: Record<UserPrefs['tone'], number> = { neutral: 0, encouraging: 0 };
  const byChannel: Record<ChannelId | 'none', number> = { 'in-app': 0, message: 0, voice: 0, none: 0 };
  for (const s of signals) {
    byHour[s.hour] = (byHour[s.hour] ?? 0) + 1;
    byTone[s.tone] += 1;
    byChannel[s.channel ?? 'none'] += 1;
  }
  let mostCommonHour: number | null = null;
  let best = 0;
  for (const [h, n] of Object.entries(byHour)) {
    if (n > best || (n === best && mostCommonHour !== null && Number(h) < mostCommonHour)) {
      best = n;
      mostCommonHour = Number(h);
    }
  }
  return { count: signals.length, byHour, mostCommonHour, byTone, byChannel };
}
