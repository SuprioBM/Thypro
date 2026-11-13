import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { RotateProgress, useAutoRotate } from './ui/autoRotate';

interface CapabilitiesSectionProps {
  lang: 'en' | 'bn';
}

export const CapabilitiesSection: React.FC<CapabilitiesSectionProps> = ({ lang }) => {

  const pillars = [
    {
      id: 0,
      title: 'A Connected Health Record',
      category: 'Foundation',
      status: 'Stage 1 Available',
      statusColor: 'bg-sage-100 text-forest-900 border-sage-300',
      tagline: 'A portable, source-labeled timeline that belongs to you.',
      description:
        'Loose papers and separate hospital portals become one timeline in date order. Every condition, lab value and medicine links back to the signed document or scan it came from, and notes the patient wrote are kept apart from clinical records.',
      requirements: ['Verified profile and contacts', 'One timeline across clinics', 'Exports the person controls, in open formats'],
      safeguard: 'Zero lock-in. You can download your entire medical record in open formats (PDF, JSON, HL7 FHIR) anytime.'
    },
    {
      id: 1,
      title: 'Care That Continues',
      category: 'Adherence & Follow-up',
      status: 'Stage 1 Available',
      statusColor: 'bg-sage-100 text-forest-900 border-sage-300',
      tagline: 'Track appointments, medication routines, and check-ins effortlessly.',
      description:
        'Most care happens between visits. A short scheduled call in Bangla or English asks whether today’s medicines were taken and how the person feels. If a check-in is missed, or an answer is worrying, the family coordinator is told.',
      requirements: ['Daily check-ins by voice or message', 'Medicine schedule and doses taken', 'Appointment tracking'],
      safeguard: 'Never claims emergency monitoring. Check-ins are administrative and supportive, not a replacement for urgent care.'
    },
    {
      id: 2,
      title: 'People Working Together',
      category: 'Coordination',
      status: 'Stage 1 Pilot (Dhaka)',
      statusColor: 'bg-ochre-100 text-forest-950 border-ochre-300',
      tagline: 'Care circles connecting family at home, relatives abroad, and clinics.',
      description:
        'The patient invites family with a role: coordinator, payer or viewer. Relatives abroad can book a companion for a clinic visit in Dhaka, arrange a home sample collection, and pay the clinic directly.',
      requirements: ['Family roles across borders', 'Clinic companion booking', 'Paying clinics directly from abroad'],
      safeguard: 'Payer role is strictly separated from clinical disclosure. Paying the clinic bill does not expose private doctor notes.'
    },
    {
      id: 3,
      title: 'Help With the Paperwork',
      category: 'Assistance',
      status: 'Admin only, human-checked',
      statusColor: 'bg-ivory-300 text-forest-950 border-forest-900/20',
      tagline: 'Reads, summarises and schedules. A person checks every value.',
      description:
        'Software reads handwritten prescriptions, turns discharge papers into plain language and drafts reminders. Each value points to the exact spot on the original page, and a person confirms it. Doctors make every medical decision.',
      requirements: ['Admin help only: reading, summarising, scheduling', 'Every summary links to its source page', 'Clinical models: research track, not in the pilot'],
      safeguard: 'No autonomous medical diagnoses. Thypro does not independently diagnose illness or alter prescription dosages.'
    }
  ];

  const rot = useAutoRotate(pillars.length, 0, 2000);
  const active = pillars[rot.index];

  return (
    <section id="capabilities" className="thy-section bg-ivory-100 border-b border-forest-900/10">
      <div className="thy-container">
        {/* Header */}
        <div className="max-w-3xl mb-12 sm:mb-14">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>04 — {lang === 'en' ? 'Core Capabilities' : 'প্লাটফর্মের কার্যকারিতা'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {lang === 'en' ? (
              <>
                Concrete tools built <br className="hidden sm:inline" />
                <span className="italic text-forest-800">for everyday healthcare needs.</span>
              </>
            ) : (
              <>
                প্রতিদিনের স্বাস্থ্য সুরক্ষায় <br className="hidden sm:inline" />
                <span className="italic text-forest-800">বাস্তবধর্মী ও নির্ভরযোগ্য সেবা।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed">
            {lang === 'en'
              ? 'Each card says what runs in the Stage 1 pilot today and what is still research, so nothing here is promised early.'
              : 'আমরা অস্পষ্ট বা অতিরঞ্জিত প্রতিশ্রুতি দিই না। বর্তমান পাইলটে চালু থাকা সেবা এবং গবেষণাধীন দীর্ঘমেয়াদী লক্ষ্যগুলোর মাঝে আমরা স্পষ্ট সীমারেখা বজায় রাখি।'}
          </p>
        </div>

        <div {...rot.bind} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* Capability list */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-widest text-forest-800/60">
                {lang === 'en' ? 'Four pillars' : 'চারটি স্তম্ভ'}
              </span>
            </div>
            <div role="tablist" aria-orientation="vertical" aria-label={lang === 'en' ? 'Capabilities' : 'কার্যকারিতা'} className="flex flex-col gap-3">
              {pillars.map((item, idx) => {
                const isActive = rot.index === idx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`cap-tab-${idx}`}
                    aria-selected={isActive}
                    aria-controls="cap-panel"
                    onClick={() => rot.select(idx)}
                    className={`group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500 ease-editorial ${
                      isActive
                        ? 'thy-luxe !rounded-2xl !border-forest-900/15 lg:translate-x-1.5'
                        : 'border-forest-900/[0.07] bg-white/40 hover:bg-white/80 hover:border-forest-900/15'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full bg-ochre-500 transition-all duration-500 ease-editorial ${
                        isActive ? 'opacity-100' : 'opacity-0 -translate-x-1'
                      }`}
                    />
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-forest-800/55 font-semibold">
                        0{idx + 1} · {item.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${item.statusColor}`}>{item.status}</span>
                    </div>
                    <h3 className={`font-editorial text-lg mb-1 transition-colors duration-500 ${isActive ? 'text-forest-950' : 'text-forest-900/80'}`}>
                      {item.title}
                    </h3>
                    <p className="text-xs text-forest-900/65 leading-relaxed line-clamp-2">{item.tagline}</p>
                    <RotateProgress
                      active={isActive}
                      autoplay={rot.autoplay}
                      running={rot.running}
                      intervalMs={rot.intervalMs}
                      onDone={rot.next}
                      cycleKey={rot.index}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail */}
          <div
            id="cap-panel"
            role="tabpanel"
            aria-labelledby={`cap-tab-${rot.index}`}
            aria-live={rot.autoplay ? 'off' : 'polite'}
            className="lg:col-span-7 thy-luxe-dark p-6 sm:p-9 flex flex-col justify-between min-h-[480px] overflow-hidden"
          >
            <div key={active.id}>
              <div className="thy-swap flex flex-wrap items-start justify-between gap-3 pb-5 mb-6 border-b border-white/10">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-widest text-ochre-400 block mb-2">{active.category}</span>
                  <h4 className="font-editorial text-2xl sm:text-[2rem] leading-tight text-ivory-50">{active.title}</h4>
                </div>
                <span className="text-[11px] font-mono px-3 py-1 rounded-full border border-white/15 bg-white/[0.06] text-ivory-100">
                  {active.status}
                </span>
              </div>

              <p className="thy-swap thy-swap-1 text-sm sm:text-base text-ivory-200/90 leading-relaxed mb-8">{active.description}</p>

              <div className="thy-swap thy-swap-2 mb-8">
                <div className="text-[11px] uppercase tracking-widest text-ivory-200/55 font-semibold mb-3">
                  {lang === 'en' ? 'Included' : 'অন্তর্ভুক্ত'}
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {active.requirements.map((req) => (
                    <li key={req} className="flex items-start gap-2.5 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3 text-xs text-ivory-100/90">
                      <Check className="w-3.5 h-3.5 text-ochre-400 shrink-0 mt-px" aria-hidden="true" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div key={`g-${active.id}`} className="thy-swap thy-swap-3 rounded-2xl bg-ivory-50 p-4 sm:p-5 text-forest-950">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-forest-800 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs leading-relaxed text-forest-900/85">
                  <strong className="font-semibold text-forest-950">{lang === 'en' ? 'Where we stop: ' : 'সীমারেখা: '}</strong>
                  {active.safeguard}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
