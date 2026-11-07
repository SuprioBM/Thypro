import { describe, expect, it } from 'vitest';
import { createDemoState } from '../data/demoSeed';
import type { CheckIn } from '../domain/types';
import { buildFhirBundle, validateBundle, type FhirBundle } from './export';

const NOW = new Date('2026-11-07T09:30:00.000Z');
const TODAY = '2026-11-07';

describe('FHIR export', () => {
  const state = createDemoState(TODAY);
  const bundle = buildFhirBundle(state, NOW);

  it('produces a structurally valid collection Bundle', () => {
    const result = validateBundle(bundle);
    expect(result.errors).toEqual([]);
    expect(result.valid).toBe(true);
    expect(bundle.type).toBe('collection');
    expect(bundle.timestamp).toBe(NOW.toISOString());
  });

  it('includes Patient, Goal, CarePlan, Observation and Provenance', () => {
    const types = new Set(bundle.entry.map((e) => e.resource.resourceType));
    for (const t of ['Patient', 'Goal', 'CarePlan', 'Observation', 'Provenance']) expect(types.has(t)).toBe(true);
  });

  it('carries provenance and the template id, and labels synthetic data', () => {
    const prov = bundle.entry.find((e) => e.resource.resourceType === 'Provenance')!.resource as unknown as {
      recorded: string;
      target: unknown[];
    };
    expect(prov.recorded).toBe(NOW.toISOString());
    expect(prov.target.length).toBeGreaterThan(5);
    expect(bundle.meta.tag[0].code).toBe('demo-data');
    const plan = bundle.entry.find((e) => e.resource.resourceType === 'CarePlan')!.resource as unknown as {
      extension: { valueString: string }[];
    };
    expect(plan.extension[0].valueString).toBe('tpl-activity-walk');
  });

  it('keeps the original wording of a note exactly, with the translation beside it', () => {
    const noted = bundle.entry.find((e) => (e.resource as { note?: unknown }).note) as FhirBundle['entry'][number];
    const note = (noted.resource as unknown as { note: { text: string; extension: { valueString: string }[] }[] }).note[0];
    expect(note.text).toBe('আজ খুব গরম ছিল, তাই মলের ভেতরে হাঁটলাম।');
    expect(note.extension[0].valueString).toContain('en: It was very hot today');
  });

  it('exports a glucose Observation only for meter readings, never for watch data', () => {
    const base = createDemoState(TODAY);
    const mk = (source: 'meter' | 'watch'): CheckIn => ({
      id: 'g',
      date: TODAY,
      status: 'done',
      feel: 'good',
      redFlags: [],
      input: 'text',
      createdAt: NOW.toISOString(),
      glucose: { value: 110, unit: 'mg/dL', source }
    });
    const hasGlucose = (b: FhirBundle) => b.entry.some((e) => e.resource.id.startsWith('glucose-'));
    expect(hasGlucose(buildFhirBundle({ ...base, checkins: [...base.checkins, mk('meter')] }, NOW))).toBe(true);
    expect(hasGlucose(buildFhirBundle({ ...base, checkins: [...base.checkins, mk('watch')] }, NOW))).toBe(false);
  });

  it('exports a minimal valid bundle for a person who has no plan yet', () => {
    const empty = { ...createDemoState(TODAY), setup: null, plans: [], checkins: [] };
    expect(validateBundle(buildFhirBundle(empty, NOW)).valid).toBe(true);
  });

  it('survives a JSON round trip', () => {
    expect(validateBundle(JSON.parse(JSON.stringify(bundle))).valid).toBe(true);
  });
});

describe('validateBundle catches structural problems', () => {
  const good = () => JSON.parse(JSON.stringify(buildFhirBundle(createDemoState(TODAY), NOW))) as FhirBundle;

  it('rejects a non-bundle', () => {
    expect(validateBundle({ resourceType: 'Patient' }).valid).toBe(false);
    expect(validateBundle(null).valid).toBe(false);
  });

  it('rejects a dangling reference', () => {
    const b = good();
    const goal = b.entry.find((e) => e.resource.resourceType === 'Goal')!.resource as unknown as { subject: { reference: string } };
    goal.subject.reference = 'Patient/does-not-exist';
    const r = validateBundle(b);
    expect(r.valid).toBe(false);
    expect(r.errors.join(' ')).toContain('does not resolve');
  });

  it('rejects a missing required element', () => {
    const b = good();
    const obs = b.entry.find((e) => e.resource.resourceType === 'Observation')!.resource as Record<string, unknown>;
    delete obs.status;
    expect(validateBundle(b).errors.join(' ')).toContain('status is required');
  });

  it('rejects duplicate ids and a missing Provenance', () => {
    const b = good();
    b.entry.push(b.entry[0]);
    expect(validateBundle(b).errors.join(' ')).toContain('Duplicate');
    const c = good();
    c.entry = c.entry.filter((e) => e.resource.resourceType !== 'Provenance');
    expect(validateBundle(c).valid).toBe(false);
  });
});
