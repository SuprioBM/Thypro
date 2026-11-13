import React from 'react';
import { ShieldCheck, UserCheck, Eye, Lock, Check, Minus } from 'lucide-react';
import { Picture } from './ui/Picture';
import { RotateProgress, useAutoRotate } from './ui/autoRotate';

interface PeoplePermissionsSectionProps {
  lang: 'en' | 'bn';
}

type Access = { meds: boolean; results: boolean; history: boolean; manage: boolean };

const PERSONAS = [
  {
    id: 'patient',
    tab: 'The Patient',
    tabBn: 'রোগী',
    icon: UserCheck,
    name: 'Tariq Ahmed',
    role: 'Patient, Dhaka',
    image: '/images/hero-family.jpg',
    quote: 'My children support me from London and Dubai, but my medical dignity belongs to me.',
    badge: 'Owner',
    level: 'Owns the record and decides who else sees it',
    rights: [
      'Gives or removes access for family and clinics with one tap',
      'Keeps sensitive history, such as reproductive or mental health notes, private by default',
      'Gets a short daily check-in call in Bangla',
      'Can download the whole record at any time, in open formats'
    ],
    access: { meds: true, results: true, history: true, manage: true } as Access
  },
  {
    id: 'coordinator',
    tab: 'Family Coordinator',
    tabBn: 'পারিবারিক সমন্বয়কারী',
    icon: Eye,
    name: 'Samira Ahmed',
    role: 'Daughter and coordinator, London',
    image: '/images/daughter-coordination.jpg',
    quote: 'Living five thousand miles away, I don’t want to interrogate my father every evening. I just need to know his care plan is working.',
    badge: 'Invited by Tariq',
    level: 'Sees what Tariq has shared, nothing more',
    rights: [
      'Sees whether medicines were taken and the morning check-in answered',
      'Books appointments and a companion for visits in Dhaka',
      'Pays clinic and pharmacy bills from abroad',
      'Cannot open sensitive notes unless Tariq shares them separately'
    ],
    access: { meds: true, results: true, history: false, manage: false } as Access
  },
  {
    id: 'clinician',
    tab: 'The Clinician',
    tabBn: 'চিকিৎসক',
    icon: ShieldCheck,
    name: 'Dr. Reza Rahman',
    role: 'Consultant cardiologist, Dhaka',
    image: '/images/doctor-consultation.jpg',
    quote: 'When Tariq walks into my clinic, I don’t spend 15 minutes hunting for lost lab papers. I see his verified timeline immediately.',
    badge: 'Registered doctor',
    level: 'Access during the visit, and every view is logged',
    rights: [
      'Reads the timeline of vitals, lab results and medicines',
      'Checks extracted values against the original lab scan',
      'Signs visit notes and adjusts the prescription',
      'Access ends with the visit; every view is recorded'
    ],
    access: { meds: true, results: true, history: true, manage: false } as Access
  }
] as const;

const ACCESS_ROWS: { key: keyof Access; label: string }[] = [
  { key: 'meds', label: 'Medicines and check-ins' },
  { key: 'results', label: 'Lab results' },
  { key: 'history', label: 'Full history, incl. sensitive notes' },
  { key: 'manage', label: 'Decide who else has access' }
];

export const PeoplePermissionsSection: React.FC<PeoplePermissionsSectionProps> = ({ lang }) => {
  const en = lang === 'en';
  const rot = useAutoRotate(PERSONAS.length, 1, 2000);
  const current = PERSONAS[rot.index];

  return (
    <section id="permissions" className="thy-section bg-ivory-50 border-b border-forest-900/10">
      <div className="thy-container">
        <div className="max-w-3xl mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>03 — {en ? 'Sovereignty & Trust' : 'ব্যক্তি ও নিরাপত্তা'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {en ? (
              <>
                Keep the right people <br className="hidden sm:inline" />
                <span className="italic text-forest-800">connected to care.</span>
              </>
            ) : (
              <>
                চিকিৎসার সাথে যুক্ত রাখুন <br className="hidden sm:inline" />
                <span className="italic text-forest-800">শুধুমাত্র আপনার বিশ্বস্ত মানুষদের।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed">
            {en
              ? 'Care involves the patient, the family and the doctor. Each sees what they need for their part, and the patient decides who that is.'
              : 'চিকিৎসা কখনোই একার বিষয় নয়। এর সাথে জড়িয়ে থাকেন রোগী, দূর-দূরান্তে থাকা প্রিয়জন এবং চিকিৎসক। থাইপ্রো নিশ্চিত করে স্বজনদের সহযোগিতা এবং রোগীর তথ্যের পূর্ণ স্বাধীনতা।'}
          </p>
        </div>

        <div {...rot.bind}>
          {/* Persona tabs */}
          <div className="mb-8 flex items-center justify-between gap-3">
            <div className="thy-seg" role="tablist" aria-label={en ? 'Who is looking' : 'কে দেখছেন'}>
              {PERSONAS.map((p, i) => {
                const Icon = p.icon;
                const active = rot.index === i;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    id={`persona-tab-${p.id}`}
                    aria-selected={active}
                    aria-controls="persona-panel"
                    onClick={() => rot.select(i)}
                    className="thy-seg-btn"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{en ? p.tab : p.tabBn}</span>
                    <RotateProgress
                      active={active}
                      autoplay={rot.autoplay}
                      running={rot.running}
                      intervalMs={rot.intervalMs}
                      onDone={rot.next}
                      cycleKey={rot.index}
                      tone="dark"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="persona-panel"
            role="tabpanel"
            aria-labelledby={`persona-tab-${current.id}`}
            aria-live={rot.autoplay ? 'off' : 'polite'}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
          >
            {/* Photograph: all three stacked, cross-faded */}
            <div className="lg:col-span-5">
              <div className="thy-luxe relative h-full min-h-[400px] overflow-hidden !bg-forest-950">
                {PERSONAS.map((p, i) => (
                  <div
                    key={p.id}
                    aria-hidden={rot.index !== i}
                    className={`absolute inset-0 transition-all duration-[1100ms] ease-editorial ${
                      rot.index === i ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'
                    }`}
                  >
                    <Picture
                      src={p.image}
                      alt={rot.index === i ? `${p.name}, ${p.role}` : ''}
                      width={1200}
                      height={896}
                      sizes="(min-width: 1024px) 42vw, 92vw"
                      className="h-full w-full object-cover object-center"
                    />
                  </div>
                ))}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/90 via-forest-950/25 to-transparent" />

                <div key={current.id} className="absolute inset-x-0 bottom-0 p-6 sm:p-7 text-ivory-50">
                  <span className="thy-swap mb-3 inline-flex rounded-full bg-ochre-500 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-white">
                    {current.badge}
                  </span>
                  <div className="thy-swap thy-swap-1 font-editorial text-2xl sm:text-[1.75rem] leading-tight">{current.name}</div>
                  <div className="thy-swap thy-swap-1 mb-4 text-xs text-ivory-200/80">{current.role}</div>
                  <blockquote className="thy-swap thy-swap-2 border-l-2 border-ochre-400 pl-3 font-editorial text-[15px] italic leading-snug text-ivory-100/95">
                    “{current.quote}”
                  </blockquote>
                </div>
              </div>
            </div>

            {/* What this person can do */}
            <div className="lg:col-span-7 thy-luxe flex flex-col p-6 sm:p-8">
              <div key={current.id} className="flex-1">
                <div className="thy-swap mb-6 border-b border-forest-900/[0.08] pb-5">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-ochre-600">
                    {en ? 'What they can do' : 'তাঁদের ভূমিকা'}
                  </div>
                  <div className="font-editorial text-xl sm:text-2xl text-forest-950">{current.level}</div>
                </div>

                <ul className="mb-8 space-y-3">
                  {current.rights.map((right, idx) => (
                    <li key={right} className={`thy-swap thy-swap-${Math.min(idx + 1, 4)} flex items-start gap-3`}>
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-900 text-ivory-50">
                        <Check className="h-3 w-3" aria-hidden="true" />
                      </span>
                      <span className="text-sm leading-relaxed text-forest-900/85">{right}</span>
                    </li>
                  ))}
                </ul>

                {/* Access at a glance */}
                <div className="thy-swap thy-swap-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ACCESS_ROWS.map((row) => {
                    const on = current.access[row.key];
                    return (
                      <div
                        key={row.key}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs transition-colors duration-500 ${
                          on ? 'border-forest-900/10 bg-ivory-50 text-forest-950' : 'border-dashed border-forest-900/15 bg-transparent text-forest-800/55'
                        }`}
                      >
                        <span>{row.label}</span>
                        {on ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-forest-800" aria-label={en ? 'Allowed' : 'অনুমোদিত'} />
                        ) : (
                          <Minus className="h-3.5 w-3.5 shrink-0" aria-label={en ? 'Not allowed' : 'অনুমোদিত নয়'} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="thy-luxe-dark mt-6 !rounded-2xl p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ochre-400" aria-hidden="true" />
                  <p className="text-xs leading-relaxed text-ivory-200/90">
                    <strong className="font-semibold text-ivory-50">Paying is not the same as reading. </strong>
                    A relative in Dubai can settle hospital and pharmacy bills without seeing private notes, unless Tariq chooses to share them.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
