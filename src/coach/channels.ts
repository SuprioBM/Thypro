import type { ChannelId, UserPrefs } from '../domain/types';

const ORDER: readonly ChannelId[] = ['in-app', 'message', 'voice'];

/** Next enabled reminder channel after the preferred one, or null if there is none. */
export function nextChannelFor(prefs: Pick<UserPrefs, 'channels' | 'preferredChannel'>): ChannelId | null {
  const start = ORDER.indexOf(prefs.preferredChannel);
  for (let step = 1; step < ORDER.length; step++) {
    const c = ORDER[(start + step) % ORDER.length];
    if (prefs.channels[c]) return c;
  }
  return null;
}
