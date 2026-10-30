import React from 'react';
import { ArrowDown, ArrowRight, Shield, CheckCircle2, Clock } from 'lucide-react';

interface HeroSectionProps {
  onDiscoverClick: () => void;
  onHowItWorksClick: () => void;
  onOpenAccessModal: () => void;
  lang: 'en' | 'bn';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onDiscoverClick,
  onHowItWorksClick,
  onOpenAccessModal,
  lang
}) => {
  return (
    <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-28 overflow-hidden bg-ivory-100 border-b border-forest-900/10">
      {/* Subtle architectural background texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#0E1D17_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative">
        {/* Stage Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-forest-900/5 border border-forest-900/12 text-forest-800 text-xs font-medium mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-ochre-500 animate-pulse" />
          <span className="font-semibold tracking-wide uppercase text-[10px] text-forest-900">
            {lang === 'en' ? 'Stage 1 Pilot' : 'প্রথম পর্যায়'}
          </span>
          <span className="text-forest-800/40">•</span>
          <span>{lang === 'en' ? 'Dhaka & Global Family Corridors' : 'ঢাকা এবং প্রবাসী পরিবার নেটওয়ার্ক'}</span>
        </div>

        {/* Hero Grid: Asymmetrical Editorial Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          {/* Left Column: Typography & Intent (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-6">
            <h1 className="font-editorial text-3xl xs:text-4xl sm:text-6xl lg:text-[4.25rem] leading-[1.12] sm:leading-[1.08] tracking-tight text-forest-950 font-normal mb-7 break-words">
              {lang === 'en' ? (
                <>
                  A clearer picture <br className="hidden sm:inline" />
                  <span className="italic font-normal text-forest-800">of your health.</span>
                </>
              ) : (
                <>
                  আপনার স্বাস্থ্যের <br className="hidden sm:inline" />
                  <span className="italic font-normal text-forest-800">একটি স্পষ্ট চিত্র।</span>
                </>
              )}
            </h1>

            <p className="text-base sm:text-xl text-forest-900/80 leading-relaxed max-w-xl font-normal mb-9">
              {lang === 'en'
                ? 'Bring your health information together, keep the people you trust connected, and make the next step in care easier to navigate.'
                : 'আপনার স্বাস্থ্যসংক্রান্ত সমস্ত তথ্য রাখুন এক সুতোয়, বিশ্বস্ত মানুষদের সাথে সহজে যুক্ত থাকুন, এবং পরবর্তী চিকিৎসার প্রতিটি ধাপ পরিচালনা করুন স্বাচ্ছন্দ্যে।'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 mb-12">
              <button
                onClick={onDiscoverClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded bg-forest-900 text-ivory-50 text-sm font-medium hover:bg-forest-800 transition-all shadow-soft active:translate-y-0.5 group"
              >
                <span>{lang === 'en' ? 'Discover Thypro' : 'থাইপ্রো সম্পর্কে জানুন'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={onHowItWorksClick}
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded border border-forest-900/20 text-forest-900 text-sm font-medium hover:bg-forest-900/5 transition-all"
              >
                <span>{lang === 'en' ? 'How it works' : 'এটি কীভাবে কাজ করে'}</span>
                <ArrowDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>

            {/* Editorial Commitment Checklist */}
            <div className="pt-8 border-t border-forest-900/10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="flex items-start gap-2.5 text-xs text-forest-800/80">
                <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Person-owned records:</strong> Consented access with one-tap revocation.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-forest-800/80">
                <Shield className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Governed assistance:</strong> Extracted data links directly to source documents.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Photographic Canvas with Controlled Overlap (5 columns) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Outer decorative architectural frame */}
              <div className="relative rounded-lg overflow-hidden shadow-editorial border border-forest-900/12 bg-ivory-200">
                <img
                  src="/images/hero-family.jpg"
                  alt="Daughter and elderly father in Dhaka reviewing health records in a warm, sunlit living room"
                  className="w-full h-[420px] sm:h-[500px] object-cover object-center filter contrast-[1.02]"
                  loading="eager"
                />

                {/* Subtle vignette gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-forest-950/60 via-transparent to-transparent pointer-events-none" />

                {/* Overlaid Editorial Caption */}
                <div className="absolute bottom-0 left-0 right-0 p-5 text-ivory-100 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ochre-200 font-semibold">
                    <Clock className="w-3 h-3" />
                    <span>Family Care Continuity</span>
                  </div>
                  <p className="text-xs text-ivory-200/90 leading-snug font-light">
                    "Tariq and his daughter Samira coordinating a post-clinic care plan between London and Dhaka."
                  </p>
                </div>
              </div>

              {/* Floating Context Plaque */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 bg-ivory-50 p-4 rounded border border-forest-900/12 shadow-soft max-w-[240px]">
                <div className="text-[10px] uppercase tracking-widest text-forest-800/60 font-semibold mb-1">
                  Origin & Integrity
                </div>
                <div className="text-xs font-serif italic text-forest-950">
                  "Health information should not disappear when you change doctors or cross a border."
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
