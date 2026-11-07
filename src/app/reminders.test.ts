import { describe, expect, it, vi } from 'vitest';
import type { DeliveryLogEntry, Reminder } from '../domain/types';
import { InAppChannel, deliver, dueReminders, type ReminderChannel } from './reminders';
import { translateNote } from './languageLayer';

const rem = (over: Partial<Reminder> = {}): Reminder => ({ id: 'r1', time: '19:15', enabled: true, channel: 'in-app', ...over });
const at = (h: number, m: number) => new Date(2026, 10, 7, h, m, 5);

describe('dueReminders', () => {
  it('fires an enabled reminder at its minute, once per day', () => {
    expect(dueReminders([rem()], at(19, 15), [])).toHaveLength(1);
    expect(dueReminders([rem()], at(19, 16), [])).toHaveLength(0);
    const log: DeliveryLogEntry[] = [
      { id: 'l', at: at(19, 15).toISOString(), reminderId: 'r1', channel: 'in-app', status: 'delivered', simulated: true }
    ];
    expect(dueReminders([rem()], at(19, 15), log)).toHaveLength(0);
  });

  it('does not fire disabled reminders, and retries after a failed delivery', () => {
    expect(dueReminders([rem({ enabled: false })], at(19, 15), [])).toHaveLength(0);
    const failed: DeliveryLogEntry[] = [
      { id: 'l', at: at(19, 15).toISOString(), reminderId: 'r1', channel: 'in-app', status: 'failed', simulated: true }
    ];
    expect(dueReminders([rem()], at(19, 15), failed)).toHaveLength(1);
  });
});

describe('deliver', () => {
  it('uses the channel interface and logs a simulated delivery', async () => {
    const notify = vi.fn();
    const entry = await deliver(new InAppChannel(notify), rem(), 'Time to walk', at(19, 15), 'id1');
    expect(notify).toHaveBeenCalledWith('Time to walk');
    expect(entry).toMatchObject({ status: 'delivered', simulated: true, channel: 'in-app', reminderId: 'r1' });
  });

  it('any other channel can be plugged in, and a failing one is logged, not thrown', async () => {
    const broken: ReminderChannel = { id: 'sms', send: async () => ({ ok: false, error: 'no network' }) };
    const entry = await deliver(broken, rem(), 'x', at(19, 15), 'id2');
    expect(entry).toMatchObject({ status: 'failed', channel: 'sms', error: 'no network' });
  });

  it('a channel that throws is reported as failed by InAppChannel', async () => {
    const entry = await deliver(
      new InAppChannel(() => {
        throw new Error('boom');
      }),
      rem(),
      'x',
      at(19, 15),
      'id3'
    );
    expect(entry.status).toBe('failed');
    expect(entry.error).toBe('boom');
  });
});

describe('language layer degrades gracefully', () => {
  it('is unconfigured without a URL and never calls the network', async () => {
    const f = vi.fn();
    expect(await translateNote('hi', 'bn', 'en', f as unknown as typeof fetch, undefined)).toEqual({ ok: false, reason: 'unconfigured' });
    expect(f).not.toHaveBeenCalled();
  });

  it('reports failure on network error, bad status or a malformed body', async () => {
    const url = 'https://example.invalid/t';
    const boom = vi.fn().mockRejectedValue(new Error('offline'));
    expect((await translateNote('x', 'bn', 'en', boom as unknown as typeof fetch, url))).toEqual({ ok: false, reason: 'failed' });
    const bad = vi.fn().mockResolvedValue({ ok: false });
    expect((await translateNote('x', 'bn', 'en', bad as unknown as typeof fetch, url))).toEqual({ ok: false, reason: 'failed' });
    const junk = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ nope: 1 }) });
    expect((await translateNote('x', 'bn', 'en', junk as unknown as typeof fetch, url))).toEqual({ ok: false, reason: 'failed' });
  });

  it('returns the translation on success', async () => {
    const good = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ translation: 'Hello' }) });
    const r = await translateNote('হ্যালো', 'bn', 'en', good as unknown as typeof fetch, 'https://example.invalid/t');
    expect(r).toEqual({ ok: true, text: 'Hello', provider: 'language-layer' });
  });
});
