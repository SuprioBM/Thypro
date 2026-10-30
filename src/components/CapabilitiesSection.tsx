import React, { useState } from 'react';
import { FileText, CalendarClock, Users, Bot, ArrowRight, Check, AlertCircle, Sparkles, ShieldCheck } from 'lucide-react';

interface CapabilitiesSectionProps {
  lang: 'en' | 'bn';
}

export const CapabilitiesSection: React.FC<CapabilitiesSectionProps> = ({ lang }) => {
  const [selectedPillar, setSelectedPillar] = useState<number>(0);

  const pillars = [
    {
      id: 0,
      title: 'A Connected Health Record',
      category: 'Foundation',
      status: 'Stage 1 Available',
      statusColor: 'bg-sage-100 text-forest-900 border-sage-300',
      tagline: 'A portable, source-labeled timeline that belongs to you.',
      description:
        'Instead of loose papers and fragmented hospital portals, your medical history is compiled chronologically. Every condition, lab value, and medication links back to the original signed document or lab scan. Distinguishes clinical records from patient-reported notes.',
      requirements: ['REC01 Profile & Contact Verification', 'REC02 Longitudinal Timeline', 'REC08 Person-controlled exports in open formats'],
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
        'Healthcare continues between clinic visits. Automated, scheduled voice check-ins in natural Bangla or English ensure daily medications are taken and symptoms are recorded. If a check-in is missed or a worrying pattern emerges, an alert is delivered to the designated family coordinator.',
      requirements: ['FAM02 Daily Check-ins by Voice or Message', 'FAM03 Medication Schedule & Adherence', 'ACC02 Appointment Tracking'],
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
        'Patients invite family members with scoped roles (Coordinator, Payer, or Viewer). Relatives abroad can book hospital companions in Dhaka, arrange in-person sample collection through verified partner networks, and pay clinic invoices directly.',
      requirements: ['FAM01 Cross-Border Family Delegation', 'FAM05 Clinic Companion Booking', 'FAM06 International Direct Payments'],
      safeguard: 'Payer role is strictly separated from clinical disclosure. Paying the clinic bill does not expose private doctor notes.'
    },
    {
      id: 3,
      title: 'AI That Assists Thoughtfully',
      category: 'Governed Assistance',
      status: 'Governed Administrative Layer',
      statusColor: 'bg-ivory-300 text-forest-950 border-forest-900/20',
      tagline: 'Extracts, summarizes, and schedules with strict human verification.',
      description:
        'AI helps parse handwritten prescriptions, summarizes complex discharge papers into plain language, and drafts calendar reminders. Every extracted value displays the exact coordinate on the original document. Clinicians always make the medical decisions.',
      requirements: ['AST01 Administrative Intent', 'AST02 Source-Linked Summaries', 'INT01 Clinical Models (Stage 5 Research Track)'],
      safeguard: 'No autonomous medical diagnoses. Thypro does not independently diagnose illness or alter prescription dosages.'
    }
  ];

  const active = pillars[selectedPillar];

  return (
    <section id="capabilities" className="py-24 sm:py-32 bg-ivory-100 border-b border-forest-900/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-16">
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
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'We distinguish what is operational in our Stage 1 pilot today from our long-term research roadmap. No buzzwords, no simulated intelligence—just transparent, reliable infrastructure.'
              : 'আমরা অস্পষ্ট বা অতিরঞ্জিত প্রতিশ্রুতি দিই না। বর্তমান পাইলটে চালু থাকা সেবা এবং গবেষণাধীন দীর্ঘমেয়াদী লক্ষ্যগুলোর মাঝে আমরা স্পষ্ট সীমারেখা বজায় রাখি।'}
          </p>
        </div>

        {/* Editorial Layout: Left Navigation Pillars & Right Dynamic Deep Dive */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Capability Selector Pillars (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {pillars.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => setSelectedPillar(idx)}
                className={`p-5 rounded-lg cursor-pointer transition-all border ${
                  selectedPillar === idx
                    ? 'bg-white border-forest-900/20 shadow-soft'
                    : 'bg-ivory-200/50 border-forest-900/8 hover:bg-white/70'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-forest-800/60 font-semibold">
                    0{idx + 1} · {item.category}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${item.statusColor}`}>
                    {item.status}
                  </span>
                </div>
                <h3 className="font-editorial text-lg text-forest-950 font-medium mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-forest-900/70 leading-relaxed line-clamp-2">
                  {item.tagline}
                </p>
              </div>
            ))}
          </div>

          {/* Right Column: Detailed Editorial Feature View with Real Component Preview (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-9 rounded-xl border border-forest-900/15 shadow-editorial flex flex-col justify-between min-h-[480px]">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-forest-900/10">
                <div>
                  <span className="text-xs font-mono uppercase text-ochre-600 font-semibold block mb-1">
                    {active.category}
                  </span>
                  <h4 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                    {active.title}
                  </h4>
                </div>
                <span className={`text-xs font-mono px-3 py-1 rounded-full border ${active.statusColor}`}>
                  {active.status}
                </span>
              </div>

              <p className="text-sm sm:text-base text-forest-900/85 leading-relaxed mb-6 font-normal">
                {active.description}
              </p>

              {/* Requirement standards tag list */}
              <div className="mb-8">
                <div className="text-[11px] font-mono uppercase tracking-wider text-forest-800/60 font-semibold mb-3">
                  Technical & Specification Standards
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {active.requirements.map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-forest-900/80 bg-ivory-100 p-2.5 rounded border border-forest-900/8">
                      <Check className="w-3.5 h-3.5 text-sage-600 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Safeguard Commitment Card */}
            <div className="p-4 rounded-lg bg-sage-50/60 border border-sage-200">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-sage-700 shrink-0 mt-0.5" />
                <div className="text-xs text-forest-900/85 leading-relaxed">
                  <strong className="text-forest-950 font-semibold">Governance Boundary:</strong> {active.safeguard}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
