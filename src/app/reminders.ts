/**
 * Reminders.
 *
 * Delivery goes through a ReminderChannel. This build has three SIMULATED
 * channels: an in-app notification, a message shown as a phone-style text
 * bubble, and a voice message read aloud with the browser's own
 * text-to-speech. Nothing leaves the page. A real provider (SMS, WhatsApp,
 * phone call) can be added later by implementing ReminderChannel.
 *
 * planDelivery decides, purely, whether and how a reminder may go out:
 * frequency, quiet hours and the person's chosen channels always win.
 */

import type { ChannelId, DeliveryLogEntry, Reminder, UserPrefs } from '../domain/types';
import { toDateKey } from '../domain/week';

export interface ReminderMessage {
  reminderId: string;
  text: string;
  at: string;
}

export interface ReminderChannel {
  id: string;
  /** Resolves ok:false (never throws) when delivery fails. */
  send(message: ReminderMessage): Promise<{ ok: boolean; error?: string }>;
}

export class InAppChannel implements ReminderChannel {
  readonly id: string = 'in-app';
  constructor(private readonly notify: (text: string) => void) {}
  async send(message: ReminderMessage): Promise<{ ok: boolean; error?: string }> {
    try {
      this.notify(message.text);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }
}

/** Simulated text message: shown as a message bubble in the page. */
export class SimulatedMessageChannel extends InAppChannel {
  readonly id: string = 'message';
}

/**
 * Simulated voice message: read aloud with the browser's text-to-speech when
 * available, and always shown as text too, so it degrades to a visible message.
 */
export class SimulatedVoiceChannel implements ReminderChannel {
  readonly id: string = 'voice';
  constructor(
    private readonly notify: (text: string) => void,
    private readonly speak: (text: string) => boolean
  ) {}
  async send(message: ReminderMessage): Promise<{ ok: boolean; error?: string }> {
    try {
      this.notify(message.text);
      this.speak(message.text);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }
}

/** True when `now` falls inside quiet hours. Handles windows that cross midnight. */
export function isQuietTime(now: Date, quiet: UserPrefs['quietHours']): boolean {
  if (!quiet.enabled || quiet.start === quiet.end) return false;
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const t = `${hh}:${mm}`;
  return quiet.start < quiet.end ? t >= quiet.start && t < quiet.end : t >= quiet.start || t < quiet.end;
}

export type DeliveryPlan = { send: true; channel: ChannelId } | { send: false; reason: 'frequency' | 'quiet_hours' | 'no_channel' };

/**
 * Whether and how a reminder may be sent right now. PURE.
 * `force` (a test reminder the person asked for) skips frequency and quiet hours, never channel choice.
 */
export function planDelivery(reminder: Reminder, prefs: UserPrefs, now: Date, force = false): DeliveryPlan {
  if (!force) {
    if (prefs.frequency === 'off') return { send: false, reason: 'frequency' };
    const day = now.getDay();
    if (prefs.frequency === 'weekdays' && (day === 0 || day === 6)) return { send: false, reason: 'frequency' };
    if (isQuietTime(now, prefs.quietHours)) return { send: false, reason: 'quiet_hours' };
  }
  const order: ChannelId[] = [prefs.preferredChannel, reminder.channel, 'in-app', 'message', 'voice'];
  const channel = order.find((c) => prefs.channels[c]);
  return channel ? { send: true, channel } : { send: false, reason: 'no_channel' };
}

export async function deliver(
  channel: ReminderChannel,
  reminder: Reminder,
  text: string,
  now: Date,
  id: string
): Promise<DeliveryLogEntry> {
  const at = now.toISOString();
  const result = await channel.send({ reminderId: reminder.id, text, at });
  return {
    id,
    at,
    reminderId: reminder.id,
    channel: channel.id,
    status: result.ok ? 'delivered' : 'failed',
    simulated: true,
    error: result.ok ? undefined : result.error
  };
}

/**
 * Reminders that should fire right now: enabled, the clock reads their time,
 * and they have not already been delivered today. PURE.
 */
export function dueReminders(reminders: Reminder[], now: Date, log: DeliveryLogEntry[]): Reminder[] {
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const clock = `${hh}:${mm}`;
  const today = toDateKey(now);
  return reminders.filter((r) => {
    if (!r.enabled || r.time !== clock) return false;
    // Delivered or deliberately held back (quiet hours, frequency) both count as handled for today.
    return !log.some(
      (l) => l.reminderId === r.id && (l.status === 'delivered' || l.status === 'suppressed') && toDateKey(new Date(l.at)) === today
    );
  });
}
