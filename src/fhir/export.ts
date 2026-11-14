/**
 * Open export: FHIR R4 Bundle (collection) built from the person's own data.
 * PURE: the timestamp is passed in. A structural validator is included and is
 * exercised by tests; it checks required elements and that every reference
 * resolves inside the bundle. It is NOT a replacement for a full FHIR profile
 * validator.
 */

import type { AppState, CheckIn, GoalType } from '../domain/types';
import { getTemplateById, resolvePlanItem } from '../plan/templates';
import { SAFETY_RULES_CONFIG } from '../safety/rules.config';

const BASE = 'https://thypro.app/fhir';
const CS = 'https://thypro.app/fhir/CodeSystem';
const EXT_TEMPLATE = 'https://thypro.app/fhir/StructureDefinition/template-id';

type Json = Record<string, unknown>;

export interface FhirBundle {
  resourceType: 'Bundle';
  id: string;
  type: 'collection';
  timestamp: string;
  meta: { tag: { system: string; code: string; display: string }[] };
  entry: { fullUrl: string; resource: Json & { resourceType: string; id: string } }[];
}

const GOAL_TEXT: Record<GoalType, string> = {
  walk: 'Build a daily walking habit',
  sleep: 'Keep a regular sleep routine',
  eating: 'Eat a balanced plate with local foods',
  medicine: 'Take prescribed medicine as a daily routine',
  tobacco: 'Get support from a licensed cessation service (referral only)'
};

const ref = (type: string, id: string) => ({ reference: `${type}/${id}` });

function observationForCheckin(c: CheckIn): Json[] {
  const subject = ref('Patient', 'patient-1');
  const out: Json[] = [
    {
      resourceType: 'Observation',
      id: `checkin-${c.date}`,
      status: 'final',
      category: [
        {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'survey', display: 'Survey' }
          ]
        }
      ],
      code: { coding: [{ system: CS, code: 'habit-checkin', display: 'Habit check-in' }], text: 'Habit check-in' },
      subject,
      effectiveDateTime: c.date,
      valueCodeableConcept: {
        coding: [{ system: CS, code: c.status, display: c.status }],
        text: c.status
      },
      component: [
        {
          code: { coding: [{ system: CS, code: 'how-i-feel', display: 'How I feel' }], text: 'How I feel' },
          valueCodeableConcept: { coding: [{ system: CS, code: c.feel, display: c.feel }], text: c.feel }
        }
      ],
      ...(c.note
        ? {
            note: [
              {
                text: c.note.original,
                // Original wording is kept exactly; a translation, if any, is added beside it.
                extension: c.note.translation
                  ? [
                      {
                        url: `${BASE}/StructureDefinition/note-translation`,
                        valueString: `${c.note.translation.lang}: ${c.note.translation.text}`
                      }
                    ]
                  : undefined
              }
            ]
          }
        : {})
    }
  ];

  // Only manually entered meter readings are exported as glucose. Watch / other sources never are.
  if (c.glucose && c.glucose.source === 'meter') {
    out.push({
      resourceType: 'Observation',
      id: `glucose-${c.date}`,
      status: 'final',
      category: [
        {
          coding: [
            { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'laboratory', display: 'Laboratory' }
          ]
        }
      ],
      code: {
        coding: [{ system: 'http://loinc.org', code: '2339-0', display: 'Glucose [Mass/volume] in Blood' }],
        text: 'Blood glucose (self-reported, glucose meter)'
      },
      subject,
      effectiveDateTime: c.date,
      valueQuantity: { value: c.glucose.value, unit: 'mg/dL', system: 'http://unitsofmeasure.org', code: 'mg/dL' },
      method: { text: 'Glucose meter, entered by the person' }
    });
  }

  const vitalSigns = [
    { system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }
  ];

  // Optional self-recorded values. Exported as recorded; Thypro never interprets them.
  if (c.bp) {
    out.push({
      resourceType: 'Observation',
      id: `bp-${c.date}`,
      status: 'final',
      category: [{ coding: vitalSigns }],
      code: { coding: [{ system: 'http://loinc.org', code: '85354-9', display: 'Blood pressure panel' }], text: 'Blood pressure (self-recorded)' },
      subject,
      effectiveDateTime: c.date,
      component: [
        {
          code: { coding: [{ system: 'http://loinc.org', code: '8480-6', display: 'Systolic blood pressure' }] },
          valueQuantity: { value: c.bp.systolic, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        },
        {
          code: { coding: [{ system: 'http://loinc.org', code: '8462-4', display: 'Diastolic blood pressure' }] },
          valueQuantity: { value: c.bp.diastolic, unit: 'mm[Hg]', system: 'http://unitsofmeasure.org', code: 'mm[Hg]' }
        }
      ]
    });
  }
  if (c.weightKg !== undefined) {
    out.push({
      resourceType: 'Observation',
      id: `weight-${c.date}`,
      status: 'final',
      category: [{ coding: vitalSigns }],
      code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Body weight (self-recorded)' },
      subject,
      effectiveDateTime: c.date,
      valueQuantity: { value: c.weightKg, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' }
    });
  }
  if (c.activityMinutes !== undefined) {
    out.push({
      resourceType: 'Observation',
      id: `activity-${c.date}`,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'activity', display: 'Activity' }] }],
      code: { coding: [{ system: CS, code: 'activity-minutes', display: 'Activity minutes (self-recorded)' }], text: 'Activity minutes (self-recorded)' },
      subject,
      effectiveDateTime: c.date,
      valueQuantity: { value: c.activityMinutes, unit: 'min', system: 'http://unitsofmeasure.org', code: 'min' }
    });
  }
  return out;
}

export function buildFhirBundle(state: AppState, now: Date): FhirBundle {
  const timestamp = now.toISOString();
  const resources: (Json & { resourceType: string; id: string })[] = [];
  const subject = ref('Patient', 'patient-1');

  resources.push({
    resourceType: 'Patient',
    id: 'patient-1',
    name: [{ text: state.profile.displayName }],
    communication: [
      { language: { coding: [{ system: 'urn:ietf:bcp:47', code: state.profile.lang }] }, preferred: true }
    ],
    address: [{ city: state.profile.city }]
  });

  if (state.setup) {
    resources.push({
      resourceType: 'Goal',
      id: 'goal-1',
      lifecycleStatus: 'active',
      description: { text: GOAL_TEXT[state.setup.goalType] },
      subject
    });
  }

  const plan = state.plans[state.plans.length - 1];
  const targets: { type: string; id: string }[] = [{ type: 'Patient', id: 'patient-1' }];
  if (state.setup) targets.push({ type: 'Goal', id: 'goal-1' });

  if (plan) {
    const template = getTemplateById(plan.templateId);
    const carePlanId = `careplan-v${plan.version}`;
    resources.push({
      resourceType: 'CarePlan',
      id: carePlanId,
      status: 'active',
      intent: 'plan',
      title: `${GOAL_TEXT[plan.goalType]} (plan v${plan.version})`,
      description: template ? `From approved template ${template.id} v${template.version}` : undefined,
      subject,
      created: plan.createdAt,
      ...(state.setup ? { goal: [ref('Goal', 'goal-1')] } : {}),
      extension: [{ url: EXT_TEMPLATE, valueString: plan.templateId }],
      activity: plan.items.map((item) => {
        const text = resolvePlanItem(plan, item, 'en');
        return { detail: { status: 'scheduled', description: text?.title ?? item.templateItemId } };
      })
    });
    targets.push({ type: 'CarePlan', id: carePlanId });
  }

  for (const c of [...state.checkins].sort((a, b) => (a.date < b.date ? -1 : 1))) {
    for (const obs of observationForCheckin(c)) {
      resources.push(obs as Json & { resourceType: string; id: string });
      targets.push({ type: 'Observation', id: obs.id as string });
    }
  }

  // Strength sessions: minutes only (a count of time, not an interpretation), plus self-entered body weight.
  for (const sess of state.strength.sessions) {
    const id = `strength-${sess.id}`;
    resources.push({
      resourceType: 'Observation',
      id,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'activity', display: 'Activity' }] }],
      code: { coding: [{ system: CS, code: 'strength-training-minutes', display: 'Strength and mobility minutes (self-recorded)' }], text: 'Strength and mobility minutes (self-recorded)' },
      subject,
      effectiveDateTime: sess.date,
      valueQuantity: { value: sess.minutes, unit: 'min', system: 'http://unitsofmeasure.org', code: 'min' }
    } as Json & { resourceType: string; id: string });
    targets.push({ type: 'Observation', id });
  }
  for (const w of state.strength.bodyWeights) {
    const id = `strength-weight-${w.date}`;
    resources.push({
      resourceType: 'Observation',
      id,
      status: 'final',
      category: [{ coding: [{ system: 'http://terminology.hl7.org/CodeSystem/observation-category', code: 'vital-signs', display: 'Vital Signs' }] }],
      code: { coding: [{ system: 'http://loinc.org', code: '29463-7', display: 'Body weight' }], text: 'Body weight (self-recorded)' },
      subject,
      effectiveDateTime: w.date,
      valueQuantity: { value: w.kg, unit: 'kg', system: 'http://unitsofmeasure.org', code: 'kg' }
    } as Json & { resourceType: string; id: string });
    targets.push({ type: 'Observation', id });
  }

  resources.push({
    resourceType: 'Provenance',
    id: 'provenance-1',
    target: targets.map((t) => ref(t.type, t.id)),
    recorded: timestamp,
    agent: [{ who: { display: 'Thypro self-export (person-controlled)' } }],
    entity: [
      {
        role: 'source',
        what: {
          display: `Thypro safety rules ${SAFETY_RULES_CONFIG.version}; ${state.profile.synthetic ? 'synthetic demo data' : 'person-entered data'}`
        }
      }
    ]
  });

  return {
    resourceType: 'Bundle',
    id: `thypro-export-${timestamp.replace(/[^0-9]/g, '').slice(0, 14)}`,
    type: 'collection',
    timestamp,
    meta: {
      tag: [
        {
          system: `${BASE}/tags`,
          code: state.profile.synthetic ? 'demo-data' : 'user-data',
          display: state.profile.synthetic ? 'Synthetic demo data' : 'Person-entered data'
        }
      ]
    },
    entry: resources.map((resource) => ({ fullUrl: `${BASE}/${resource.resourceType}/${resource.id}`, resource }))
  };
}

/* ---------- Structural validation ---------- */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  resourceCount: number;
}

function collectReferences(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    value.forEach((v) => collectReferences(v, out));
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Json)) {
      if (k === 'reference' && typeof v === 'string') out.push(v);
      else collectReferences(v, out);
    }
  }
}

export function validateBundle(bundle: unknown): ValidationResult {
  const errors: string[] = [];
  const b = bundle as Partial<FhirBundle> | null;

  if (!b || b.resourceType !== 'Bundle') {
    return { valid: false, errors: ['Root must be a Bundle'], resourceCount: 0 };
  }
  if (b.type !== 'collection') errors.push('Bundle.type must be "collection"');
  if (!b.timestamp || Number.isNaN(Date.parse(b.timestamp))) errors.push('Bundle.timestamp must be an ISO instant');
  if (!Array.isArray(b.entry) || b.entry.length === 0) {
    errors.push('Bundle.entry must be a non-empty array');
    return { valid: false, errors, resourceCount: 0 };
  }

  const ids = new Set<string>();
  const counts: Record<string, number> = {};
  for (const e of b.entry) {
    const r = e?.resource;
    if (!r || typeof r.resourceType !== 'string' || typeof r.id !== 'string') {
      errors.push('Every entry needs resource.resourceType and resource.id');
      continue;
    }
    const key = `${r.resourceType}/${r.id}`;
    if (ids.has(key)) errors.push(`Duplicate resource ${key}`);
    ids.add(key);
    counts[r.resourceType] = (counts[r.resourceType] ?? 0) + 1;
    if (!e.fullUrl) errors.push(`${key}: missing fullUrl`);
  }

  if ((counts.Patient ?? 0) !== 1) errors.push('Exactly one Patient is required');
  if ((counts.Provenance ?? 0) < 1) errors.push('A Provenance resource is required');

  for (const e of b.entry) {
    const r = e.resource as Json & { resourceType: string; id: string };
    if (!r || typeof r.resourceType !== 'string') continue;
    const at = `${r.resourceType}/${r.id}`;
    const need = (cond: boolean, msg: string) => {
      if (!cond) errors.push(`${at}: ${msg}`);
    };
    switch (r.resourceType) {
      case 'Patient':
        need(Array.isArray(r.name) && r.name.length > 0, 'name is required');
        break;
      case 'Goal':
        need(typeof r.lifecycleStatus === 'string', 'lifecycleStatus is required');
        need(Boolean((r.description as Json | undefined)?.text), 'description.text is required');
        need(Boolean((r.subject as Json | undefined)?.reference), 'subject.reference is required');
        break;
      case 'CarePlan':
        need(typeof r.status === 'string', 'status is required');
        need(typeof r.intent === 'string', 'intent is required');
        need(Boolean((r.subject as Json | undefined)?.reference), 'subject.reference is required');
        break;
      case 'Observation':
        need(typeof r.status === 'string', 'status is required');
        need(Boolean(r.code), 'code is required');
        need(Boolean((r.subject as Json | undefined)?.reference), 'subject.reference is required');
        need(
          Boolean(r.valueQuantity || r.valueCodeableConcept || r.valueString || r.component),
          'a value[x] or component is required'
        );
        break;
      case 'Provenance':
        need(Array.isArray(r.target) && r.target.length > 0, 'target is required');
        need(typeof r.recorded === 'string', 'recorded is required');
        need(Array.isArray(r.agent) && r.agent.length > 0, 'agent is required');
        break;
      default:
        break;
    }

    const refs: string[] = [];
    collectReferences(r, refs);
    for (const target of refs) {
      if (!ids.has(target)) errors.push(`${at}: reference "${target}" does not resolve inside the bundle`);
    }
  }

  return { valid: errors.length === 0, errors, resourceCount: b.entry.length };
}
