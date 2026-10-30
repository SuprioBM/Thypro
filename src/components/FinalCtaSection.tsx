import React from 'react';
import { ArrowRight, Shield, Check, Heart, MapPin } from 'lucide-react';

interface FinalCtaSectionProps {
  onOpenAccessModal: () => void;
  onOpenPrivacyModal: () => void;
  lang: 'en' | 'bn';
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenAccessModal,
  onOpenPrivacyModal,
  lang
}) => {
  return (
    <section className="py-24 sm:py-36 bg-forest-950 text-ivory-50 relative overflow-hidden">
      {/* Background architectural grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(#FAF8F3_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typographic Invitation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ivory-100/10 border border-ivory-100/15 text-ivory-200 text-xs font-mono mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-ochre-400" />
              <span>{lang === 'en' ? 'Phase 1 Controlled Rollout' : 'প্রথম ধাপের পাইলট'}</span>
            </div>

            <h2 className="font-editorial text-4xl sm:text-6xl text-ivory-50 font-normal leading-[1.08] mb-6">
              {lang === 'en' ? (
                <>
                  Bring your healthcare <br />
                  <span className="italic text-ochre-200">into a clearer picture.</span>
                </>
              ) : (
                <>
                  আপনার চিকিৎসা ব্যবস্থাকে <br />
                  <span className="italic text-ochre-200">আনুন এক সুস্পষ্ট রূপরেখায়।</span>
                </>
              )}
            </h2>

            <p className="text-base sm:text-lg text-ivory-200/80 leading-relaxed font-normal mb-8 max-w-xl">
              {lang === 'en'
                ? 'Discover a more connected way to organize health information, support family across borders, and keep the people who care in step.'
                : 'স্বাস্থ্যতথ্য সংগঠিত করার, দূর থেকেও পরিবারকে পাশে পাওয়ার এবং চিকিৎসার প্রতিটি পদক্ষেপ নির্ভুলভাবে সমন্বয় করার এক আত্মবিশ্বাসী যাত্রা।'}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-10">
              <button
                onClick={onOpenAccessModal}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded bg-ochre-500 text-forest-950 font-semibold text-sm hover:bg-ochre-400 transition-all shadow-soft active:translate-y-0.5 group"
              >
                <span>{lang === 'en' ? 'Request Pilot Access' : 'পাইলট এক্সেসের জন্য আবেদন'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onOpenPrivacyModal}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded border border-ivory-200/20 text-ivory-100 hover:bg-ivory-100/10 text-sm font-medium transition-all"
              >
                <Shield className="w-4 h-4 text-ochre-300" />
                <span>{lang === 'en' ? 'Data Sovereignty Principles' : 'তথ্য সুরক্ষার মূলনীতি'}</span>
              </button>
            </div>

            {/* Launch Corridor Footnote */}
            <div className="pt-6 border-t border-ivory-100/15 flex flex-wrap items-center gap-6 text-xs text-ivory-200/70 font-sans">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ochre-300" />
                <span>Dhaka City Pilot Cohort</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-ochre-300" />
                <span>Cross-Border Family Care (UK · US · UAE)</span>
              </span>
            </div>
          </div>

          {/* Right Column: Warm Tactile Photographic Anchor (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-xl overflow-hidden border border-ivory-100/15 shadow-editorial relative bg-forest-900">
              <img
                src="/images/hands-prescription.jpg"
                alt="Close-up of South Asian family hands gently reviewing health plan together at table"
                className="w-full h-[380px] sm:h-[460px] object-cover object-center filter saturate-[0.95]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 inset-x-0 p-6 text-ivory-100 text-xs leading-relaxed font-light">
                <div className="font-editorial text-base text-ivory-50 mb-1">Human care at the center</div>
                "Technology exists only to keep the people who matter close, and their health story intact."
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
