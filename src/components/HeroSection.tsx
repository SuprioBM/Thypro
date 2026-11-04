import React from 'react';
import {
  ArrowDown,
  ArrowRight,
  Shield,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  Droplet,
  Activity,
  Target
} from 'lucide-react';
import { Picture } from './ui/Picture';

interface HeroSectionProps {
  onDiscoverClick: () => void;
  onHowItWorksClick: () => void;
  onOpenAccessModal: () => void;
  lang: 'en' | 'bn';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onDiscoverClick,
  onHowItWorksClick,
  lang
}) => {
  /* Three-word answer to "what is this?", shown directly under the headline. */
  const pillars = [
    {
      icon: FileText,
      label: lang === 'en' ? 'One health record' : 'এক স্বাস্থ্য রেকর্ড',
      detail: lang === 'en' ? 'Prescriptions, labs, history' : 'ব্যবস্থাপত্র, ল্যাব, ইতিহাস'
    },
    {
      icon: Users,
      label: lang === 'en' ? 'Family Care' : 'ফ্যামিলি কেয়ার',
      detail: lang === 'en' ? 'Parents at home, children abroad' : 'দেশে বাবা-মা, প্রবাসে সন্তান'
    },
    {
      icon: Droplet,
      label: lang === 'en' ? 'Blood donor network' : 'রক্তদাতা নেটওয়ার্ক',
      detail: lang === 'en' ? 'In development' : 'নির্মাণাধীন'
    }
  ];

  return (
    <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 overflow-hidden bg-ivory-100 border-b border-forest-900/10">
      {/* Subtle architectural background texture */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#0E1D17_1px,transparent_1px)] [background-size:24px_24px]"
      />
      {/* Warm ambient light behind the headline */}
      <div
        aria-hidden="true"
        className="absolute -top-24 -left-24 w-[34rem] h-[34rem] rounded-full bg-ochre-100/40 blur-3xl pointer-events-none"
      />

      <div className="thy-container relative">
        {/* Stage status + fellowship credibility */}
        <div className="flex flex-wrap items-center gap-2.5 mb-7 animate-fade-in-up">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-forest-900/12 text-forest-800 text-xs font-medium shadow-soft-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-ember-500 animate-pulse" aria-hidden="true" />
            <span className="font-semibold tracking-wide uppercase text-[10px] text-forest-900">
              {lang === 'en' ? 'Stage 1 Pilot' : 'প্রথম পর্যায়'}
            </span>
            <span className="text-forest-800/40" aria-hidden="true">
              •
            </span>
            <span>{lang === 'en' ? 'Dhaka & global family corridors' : 'ঢাকা ও প্রবাসী পরিবার নেটওয়ার্ক'}</span>
          </span>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sage-50 border border-sage-200 text-forest-900 text-[11px] font-medium">
            <Target className="w-3 h-3 text-sage-700" aria-hidden="true" />
            <span>Millennium Fellowship 2026 · UN SDG 3</span>
          </span>
        </div>

        {/* Hero Grid: Asymmetrical Editorial Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-10 items-start">
          {/* Left Column: Typography & Intent (7 columns) */}
          <div className="lg:col-span-7 flex flex-col justify-center lg:pr-6">
            <h1 className="font-editorial text-[2.1rem] xs:text-4xl sm:text-6xl lg:text-[4.1rem] leading-[1.1] tracking-tight text-forest-950 font-normal mb-5 break-words">
              {lang === 'en' ? (
                <>
                  A clearer picture <br className="hidden sm:inline" />
                  <span className="italic font-normal text-forest-800">of your family&rsquo;s health.</span>
                </>
              ) : (
                <>
                  আপনার পরিবারের স্বাস্থ্যের <br className="hidden sm:inline" />
                  <span className="italic font-normal text-forest-800">একটি স্পষ্ট চিত্র।</span>
                </>
              )}
            </h1>

            {/* The single-sentence promise */}
            <p className="text-base sm:text-[1.3rem] text-forest-900 leading-snug font-medium mb-4 max-w-xl">
              {lang === 'en'
                ? 'One health record. A whole family. Better care, together.'
                : 'এক স্বাস্থ্য রেকর্ড। পুরো পরিবার। একসাথে উন্নত যত্ন।'}
            </p>

            <p className="text-[0.95rem] sm:text-lg text-forest-900/80 leading-relaxed max-w-xl font-normal mb-8">
              {lang === 'en'
                ? 'Thypro keeps a lifelong health record for people in Bangladesh and the families who look after them from abroad — prescriptions organised, medication reminders that actually reach an elderly parent, and the right relatives connected without anyone losing control of their own records.'
                : 'থাইপ্রো বাংলাদেশের মানুষ এবং প্রবাস থেকে তাঁদের যত্ন নেওয়া পরিবারের জন্য আজীবন স্বাস্থ্য রেকর্ড রাখে — গোছানো ব্যবস্থাপত্র, বয়স্ক অভিভাবকের কাছে সত্যিই পৌঁছায় এমন ওষুধের রিমাইন্ডার, এবং নিজের তথ্যের নিয়ন্ত্রণ না হারিয়ে পরিবারের সঠিক মানুষদের যুক্ত রাখা।'}
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-10">
              <button type="button" onClick={onDiscoverClick} className="thy-btn-primary group">
                <span>{lang === 'en' ? 'Discover Thypro' : 'থাইপ্রো সম্পর্কে জানুন'}</span>
                <ArrowRight
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              <button type="button" onClick={onHowItWorksClick} className="thy-btn-ghost">
                <span>{lang === 'en' ? 'How it works' : 'এটি কীভাবে কাজ করে'}</span>
                <ArrowDown className="w-3.5 h-3.5 opacity-70" aria-hidden="true" />
              </button>
            </div>

            {/* What Thypro actually is, in three lines */}
            <ul className="grid grid-cols-1 xs:grid-cols-3 gap-3 mb-8">
              {pillars.map((p) => {
                const Icon = p.icon;
                return (
                  <li
                    key={p.label}
                    className="flex items-start gap-2.5 p-3 rounded-lg bg-white/70 border border-forest-900/8"
                  >
                    <Icon className="w-4 h-4 text-ochre-600 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-xs font-semibold text-forest-950 leading-snug">
                        {p.label}
                      </span>
                      <span className="block text-[11px] text-forest-800/70 leading-snug">
                        {p.detail}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>

            {/* Editorial Commitment Checklist */}
            <div className="pt-7 border-t border-forest-900/10 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
              <div className="flex items-start gap-2.5 text-xs text-forest-800/85">
                <CheckCircle2 className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-forest-950">Person-owned records:</strong> consented access
                  with one-tap revocation.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-forest-800/85">
                <Shield className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  <strong className="text-forest-950">Governed assistance:</strong> extracted data
                  links back to the source document.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Photographic canvas with a product card overlay (5 columns) */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative rounded-card overflow-hidden shadow-editorial border border-forest-900/12 bg-ivory-200">
                <Picture
                  src="/images/hero-family.jpg"
                  alt="A daughter sits beside her elderly father in a sunlit Dhaka living room, going through his health records together"
                  width={1376}
                  height={768}
                  priority
                  sizes="(min-width: 1024px) 40vw, 92vw"
                  className="w-full h-[380px] sm:h-[500px] object-cover object-center filter contrast-[1.02]"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-b from-forest-950/55 via-transparent to-forest-950/35 pointer-events-none"
                />

                {/* Editorial caption, anchored top-left so the floating product
                    card can sit over the lower corner without colliding. */}
                <div className="absolute top-0 left-0 right-0 p-5 text-ivory-100 flex flex-col gap-1">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ember-200 font-semibold">
                    <Clock className="w-3 h-3" aria-hidden="true" />
                    <span>{lang === 'en' ? 'Family care continuity' : 'পারিবারিক যত্নের ধারাবাহিকতা'}</span>
                  </div>
                  <p className="text-xs text-ivory-100/90 leading-snug font-light max-w-[16rem]">
                    {lang === 'en'
                      ? 'Tariq and his daughter Samira coordinating a post-clinic care plan between London and Dhaka.'
                      : 'লন্ডন ও ঢাকার মাঝে তারিক ও তাঁর মেয়ে সামিরার চিকিৎসা পরিকল্পনা সমন্বয়।'}
                  </p>
                </div>
              </div>

              {/* Floating product card — today's adherence at a glance.
                  Sits over the top-left of the photo so it never collides with
                  the caption anchored at the bottom. */}
              <div className="hidden sm:block absolute -bottom-8 -left-6 lg:-left-10 w-[248px] rounded-card bg-white border border-forest-900/12 shadow-soft-lg overflow-hidden">
                <div className="px-4 py-2.5 border-b border-forest-900/8 flex items-center justify-between bg-ivory-100/80">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-forest-800/65 font-semibold">
                    Today · Tariq
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sage-700">
                    <Activity className="w-3 h-3" aria-hidden="true" />
                    On track
                  </span>
                </div>
                <div className="p-4 space-y-2.5">
                  {[
                    { label: 'Metformin 500 mg', meta: '8:00 AM · taken', done: true },
                    { label: 'Amlodipine 5 mg', meta: '8:00 AM · taken', done: true },
                    { label: 'Atorvastatin 20 mg', meta: '9:30 PM · scheduled', done: false }
                  ].map((d) => (
                    <div key={d.label} className="flex items-center gap-2.5">
                      <span
                        className={`w-4 h-4 rounded-full shrink-0 flex items-center justify-center ${
                          d.done ? 'bg-sage-600 text-white' : 'border border-forest-900/25'
                        }`}
                        aria-hidden="true"
                      >
                        {d.done && <CheckCircle2 className="w-3 h-3" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-medium text-forest-950 truncate">
                          {d.label}
                        </span>
                        <span className="block text-[10px] text-forest-800/65">{d.meta}</span>
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 bg-ivory-100 text-[10px] text-forest-800/65 font-mono">
                  Interface preview
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
