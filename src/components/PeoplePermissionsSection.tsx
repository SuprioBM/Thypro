import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Eye, CreditCard, Lock, CheckCircle2, UserX, AlertCircle } from 'lucide-react';

interface PeoplePermissionsSectionProps {
  lang: 'en' | 'bn';
}

export const PeoplePermissionsSection: React.FC<PeoplePermissionsSectionProps> = ({ lang }) => {
  const [activePersona, setActivePersona] = useState<'patient' | 'coordinator' | 'clinician'>('coordinator');

  const personas = {
    patient: {
      name: 'Tariq Ahmed',
      role: 'The Patient (Dhaka)',
      image: '/images/hero-family.jpg',
      quote: 'My children support me from London and Dubai, but my medical dignity belongs to me.',
      tag: 'Full Sovereign Ownership',
      rights: [
        'Grants and revokes family or clinic access with a single tap',
        'Sensitive reproductive and psychiatric history remains private by default (REC04)',
        'Receives daily automated voice check-in in natural Bangla (FAM02)',
        'Can export full medical history anytime in open standard formats'
      ],
      permissionPreview: {
        accessLevel: 'Owner & Sovereign Controller',
        badge: 'Zero-Lockin',
        canSeeDiagnostics: true,
        canSeeMedications: true,
        canSeeFullHistory: true,
        canRevokeOthers: true
      }
    },
    coordinator: {
      name: 'Samira Ahmed',
      role: 'Family Coordinator (London)',
      image: '/images/daughter-coordination.jpg',
      quote: 'Living five thousand miles away, I don’t want to interrogate my father every evening. I just need to know his care plan is working.',
      tag: 'Care Coordinator Role',
      rights: [
        'Views medication adherence and morning check-in confirmations',
        'Coordinates appointments and books hospital companions in Dhaka',
        'Direct settlement of clinic and pharmacy bills in GBP or USD',
        'Cannot inspect sensitive medical records without explicit separate consent'
      ],
      permissionPreview: {
        accessLevel: 'Care Coordinator (Consented by Tariq)',
        badge: 'FAM01 Delegation',
        canSeeDiagnostics: true,
        canSeeMedications: true,
        canSeeFullHistory: false,
        canRevokeOthers: false
      }
    },
    clinician: {
      name: 'Dr. Reza Rahman',
      role: 'Consultant Cardiologist (Dhaka)',
      image: '/images/doctor-consultation.jpg',
      quote: 'When Tariq walks into my clinic, I don’t spend 15 minutes hunting for lost lab papers. I see his verified timeline immediately.',
      tag: 'Clinical Workspace',
      rights: [
        'Reviews longitudinal timeline of vitals, lab reports, and medication trends',
        'Confirms extracted diagnostic data against original laboratory scans',
        'Signs clinical encounter notes and prescribes adjustments',
        'Access strictly limited to active encounter duration with audited logging'
      ],
      permissionPreview: {
        accessLevel: 'Verified Physician (BMDC Registered)',
        badge: 'TRU01 Verified',
        canSeeDiagnostics: true,
        canSeeMedications: true,
        canSeeFullHistory: true,
        canRevokeOthers: false
      }
    }
  };

  const current = personas[activePersona];

  return (
    <section id="permissions" className="py-24 sm:py-32 bg-ivory-50 border-b border-forest-900/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>03 — {lang === 'en' ? 'Sovereignty & Trust' : 'ব্যক্তি ও নিরাপত্তা'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {lang === 'en' ? (
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
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'Healthcare is rarely solitary. It involves patients, loving family members, and trusted clinicians. Thypro enables granular collaboration while ensuring the patient maintains absolute privacy and consent.'
              : 'চিকিৎসা কখনোই একার বিষয় নয়। এর সাথে জড়িয়ে থাকেন রোগী, দূর-দূরান্তে থাকা প্রিয়জন এবং চিকিৎসক। থাইপ্রো নিশ্চিত করে স্বজনদের সহযোগিতা এবং রোগীর তথ্যের পূর্ণ স্বাধীনতা।'}
          </p>
        </div>

        {/* Persona Selector Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-10 pb-4 border-b border-forest-900/10">
          <button
            onClick={() => setActivePersona('patient')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePersona === 'patient'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'bg-ivory-200/80 text-forest-900/75 hover:bg-ivory-300'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>The Patient</span>
          </button>

          <button
            onClick={() => setActivePersona('coordinator')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePersona === 'coordinator'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'bg-ivory-200/80 text-forest-900/75 hover:bg-ivory-300'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Family Coordinator</span>
          </button>

          <button
            onClick={() => setActivePersona('clinician')}
            className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activePersona === 'clinician'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'bg-ivory-200/80 text-forest-900/75 hover:bg-ivory-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>The Clinician</span>
          </button>
        </div>

        {/* Persona Visual & Permission Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Dominant Editorial Photography (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="h-full rounded-lg overflow-hidden border border-forest-900/15 shadow-editorial relative bg-ivory-200 min-h-[380px]">
              <img
                src={current.image}
                alt={current.name}
                className="w-full h-full object-cover object-center filter saturate-[0.98] transition-all duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/75 via-forest-950/20 to-transparent" />
              
              <div className="absolute bottom-0 inset-x-0 p-6 text-ivory-50">
                <span className="text-[11px] font-mono uppercase tracking-widest text-ochre-300 font-semibold mb-1 block">
                  {current.tag}
                </span>
                <div className="font-editorial text-2xl text-ivory-50 mb-1">{current.name}</div>
                <div className="text-xs text-ivory-200/80 mb-3">{current.role}</div>
                <blockquote className="text-xs italic text-ivory-200 font-serif border-l-2 border-ochre-400 pl-3 leading-snug">
                  "{current.quote}"
                </blockquote>
              </div>
            </div>
          </div>

          {/* Persona Rights & Permission Matrix (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-lg bg-white border border-forest-900/15 shadow-soft">
            <div>
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-forest-900/10">
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-forest-800/60 font-semibold">
                    Permission Scope & Governance
                  </div>
                  <div className="text-lg font-editorial text-forest-950 font-medium">
                    {current.permissionPreview.accessLevel}
                  </div>
                </div>
                <span className="text-xs font-mono bg-sage-100 text-forest-900 px-3 py-1 rounded-full border border-sage-300">
                  {current.permissionPreview.badge}
                </span>
              </div>

              {/* Rights list */}
              <div className="space-y-3.5 mb-8">
                {current.rights.map((right, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-forest-900/85 leading-relaxed font-normal">
                      {right}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crucial Ethical Boundary Notice (FAM01 Principle) */}
            <div className="p-4 rounded bg-ivory-100 border border-forest-900/10">
              <div className="flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-ochre-600 shrink-0 mt-0.5" />
                <div className="text-xs text-forest-900/80 leading-relaxed">
                  <strong className="text-forest-950 font-semibold">The Payer Privacy Principle:</strong> Under Thypro's FAM01 standard, paying for care does not automatically grant unrestricted access to private clinical records. A family member in Dubai can pay hospital bills and pharmacy deliveries without reading sensitive notes unless Tariq explicitly grants that scope.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
