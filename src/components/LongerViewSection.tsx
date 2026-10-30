import React from 'react';
import { ShieldCheck, HeartHandshake, GitFork, Milestone, Lock } from 'lucide-react';

interface LongerViewSectionProps {
  lang: 'en' | 'bn';
}

export const LongerViewSection: React.FC<LongerViewSectionProps> = ({ lang }) => {
  return (
    <section id="vision" className="py-24 sm:py-36 bg-ivory-100 border-b border-forest-900/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>06 — {lang === 'en' ? 'The Lifelong View' : 'দীর্ঘমেয়াদী দর্শন'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-forest-950 font-normal leading-[1.10] mb-6">
            {lang === 'en' ? (
              <>
                Your health story <br className="hidden sm:inline" />
                <span className="italic text-forest-800">doesn’t end with one appointment.</span>
              </>
            ) : (
              <>
                আপনার স্বাস্থ্যযাত্রা <br className="hidden sm:inline" />
                <span className="italic text-forest-800">একটিমাত্র প্রেসক্রিপশনে শেষ হয় না।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-xl text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'A person’s health history should not disappear when they change physicians, relocate overseas, or grow old. In decades to come, children and grandchildren should be able to understand the medical conditions that shaped their family.'
              : 'চিকিৎসক বদলালে কিংবা দেশ ছাড়লে একজন মানুষের স্বাস্থ্য ইতিহাস মুছে যাওয়া উচিত নয়। ভবিষ্যৎ প্রজন্মের সন্তানরা যাতে তাদের পারিবারিক স্বাস্থ্যঝুঁকি সম্পর্কে অবগত হতে পারে, সেজন্য এই তথ্য রক্ষা করা প্রয়োজন।'}
          </p>
        </div>

        {/* Cinematic Split: Large Reflective Photographic Composition & Editorial Manifesto */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Generational Portrait (6 cols) */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-xl overflow-hidden border border-forest-900/15 shadow-editorial bg-ivory-200 relative">
              <img
                src="/images/generational-continuity.jpg"
                alt="South Asian grandfather on a sunlit veranda holding the small hand of his grandchild, representing generational continuity"
                className="w-full h-[480px] sm:h-[580px] object-cover object-center filter contrast-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/70 via-transparent to-transparent" />
              
              <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 text-ivory-50">
                <span className="text-[11px] font-mono uppercase tracking-widest text-ochre-300 font-semibold mb-2 block">
                  Generational Heritage & Provenance
                </span>
                <p className="font-editorial text-xl sm:text-2xl text-ivory-100 font-normal leading-snug">
                  "No company can honestly promise to exist for two hundred years. That is why we promise something we can keep: the record outlives Thypro."
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: The Four Lifelong Commitments (6 cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
            <div className="space-y-6">
              {/* Commitment 1 */}
              <div className="p-6 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-forest-900/5 flex items-center justify-center text-forest-900">
                    <Milestone className="w-4 h-4" />
                  </div>
                  <h3 className="font-editorial text-xl text-forest-950 font-normal">
                    The Record Outlives Any Single Institution
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                  Your data is not locked in a proprietary clinic silo. Under REC08, complete medical histories export into open international standards (PDF, JSON, FHIR) with all original lab citations intact.
                </p>
              </div>

              {/* Commitment 2 */}
              <div className="p-6 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-forest-900/5 flex items-center justify-center text-forest-900">
                    <GitFork className="w-4 h-4" />
                  </div>
                  <h3 className="font-editorial text-xl text-forest-950 font-normal">
                    Family Health Tree Across Generations
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                  Consented hereditary links allow grandchildren to know whether cardiovascular conditions or diabetes exist in family lineage (REC12), sharing only the specific conditions each person chooses.
                </p>
              </div>

              {/* Commitment 3 */}
              <div className="p-6 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-forest-900/5 flex items-center justify-center text-forest-900">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <h3 className="font-editorial text-xl text-forest-950 font-normal">
                    Cryptographic Integrity Without Blockchain
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                  Health data on a public blockchain cannot legally be corrected or deleted under privacy laws. Instead, Thypro uses TRU07 cryptographic fingerprints and trusted timestamps to verify record authenticity without ever exposing medical details.
                </p>
              </div>

              {/* Commitment 4 */}
              <div className="p-6 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded bg-forest-900/5 flex items-center justify-center text-forest-900">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <h3 className="font-editorial text-xl text-forest-950 font-normal">
                    Digital Legacy & Clear Succession
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                  Under REC11, individuals designate verified legacy contacts and explicit release rules, ensuring continuity of care directives and family knowledge under local legal standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
