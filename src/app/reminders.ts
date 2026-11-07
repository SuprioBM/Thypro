/**
 * Reminders.
 *
 * Delivery goes through a ReminderChannel. The only channel in this build is
 * InAppChannel, which shows a notification inside the page ("simulated"
 * delivery). A real channel (SMS, WhatsApp, push…) can be added later by
 * implementing ReminderChannel; none is connected and none is required.
 */

import type { DeliveryLogEntry, Reminder } from '../domain/types';
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
  readonly id = 'in-app';
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
    return !log.some((l) => l.reminderId === r.id && l.status === 'delivered' && toDateKey(new Date(l.at)) === today);
  });
}
