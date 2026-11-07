import React from 'react';
import { ArrowRight, Shield, Heart, MapPin, Target, Sparkles } from 'lucide-react';
import { translate } from '../i18n';
import { Picture } from './ui/Picture';

interface FinalCtaSectionProps {
  onOpenAccessModal: () => void;
  onOpenPrivacyModal: () => void;
  onContinueAsGuest: () => void;
  lang: 'en' | 'bn';
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({
  onOpenAccessModal,
  onOpenPrivacyModal,
  onContinueAsGuest,
  lang
}) => {
  return (
    <section id="pilot" className="thy-section bg-forest-950 text-ivory-50 relative overflow-hidden on-dark">
      {/* Background architectural grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[radial-gradient(#FAF8F3_1px,transparent_1px)] [background-size:28px_28px]" />

      <div className="thy-container relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Typographic Invitation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ivory-100/10 border border-ivory-100/15 text-ivory-200 text-xs font-mono mb-6 self-start">
              <span className="w-1.5 h-1.5 rounded-full bg-ember-400" aria-hidden="true" />
              <span>{lang === 'en' ? 'Phase 1 Controlled Rollout' : 'প্রথম ধাপের পাইলট'}</span>
            </div>

            <h2 className="font-editorial text-4xl sm:text-6xl text-ivory-50 font-normal leading-[1.08] mb-6">
              {lang === 'en' ? (
                <>
                  Bring your healthcare <br />
                  <span className="italic text-ember-200">into a clearer picture.</span>
                </>
              ) : (
                <>
                  আপনার চিকিৎসা ব্যবস্থাকে <br />
                  <span className="italic text-ember-200">আনুন এক সুস্পষ্ট রূপরেখায়।</span>
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
                className="thy-btn-accent group"
              >
                <span>{lang === 'en' ? 'Request Pilot Access' : 'পাইলট এক্সেসের জন্য আবেদন'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onContinueAsGuest}
                className="thy-btn px-5 py-3.5 border border-ivory-200/25 text-ivory-100 hover:bg-ivory-100/10 hover:border-ivory-200/45"
              >
                <Sparkles className="w-4 h-4 text-ember-300" aria-hidden="true" />
                <span>{translate(lang, 'entry.guest')}</span>
              </button>

              <button
                onClick={onOpenPrivacyModal}
                className="thy-btn px-5 py-3.5 border border-ivory-200/25 text-ivory-100 hover:bg-ivory-100/10 hover:border-ivory-200/45"
              >
                <Shield className="w-4 h-4 text-ember-300" aria-hidden="true" />
                <span>{lang === 'en' ? 'Data Sovereignty Principles' : 'তথ্য সুরক্ষার মূলনীতি'}</span>
              </button>
            </div>

            {/* Launch Corridor Footnote */}
            <div className="pt-6 border-t border-ivory-100/15 flex flex-wrap items-center gap-6 text-xs text-ivory-200/70 font-sans">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ember-300" aria-hidden="true" />
                <span>Dhaka City Pilot Cohort</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-ember-300" aria-hidden="true" />
                <span>Cross-border family care (UK · US · UAE)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-ember-300" aria-hidden="true" />
                <span>Millennium Fellowship 2026 · UN SDG 3</span>
              </span>
            </div>
          </div>

          {/* Right Column: Warm Tactile Photographic Anchor (5 cols) */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-xl overflow-hidden border border-ivory-100/15 shadow-editorial relative bg-forest-900">
              <Picture
                src="/images/hands-prescription.jpg"
                alt="Close-up of family hands reviewing a health plan together at a table"
                width={1200}
                height={896}
                sizes="(min-width: 1024px) 40vw, 92vw"
                className="w-full h-[320px] sm:h-[460px] object-cover object-center filter saturate-[0.95]"
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
