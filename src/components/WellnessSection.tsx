import React from 'react';
import {
  QrCode,
  Footprints,
  Apple,
  Moon,
  HeartPulse,
  Stethoscope,
  AlertTriangle,
  Languages
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface WellnessSectionProps {
  lang: 'en' | 'bn';
}

/**
 * Section 07 — Everyday wellbeing and emergency readiness.
 * Pairs the emergency QR card (what a stranger or a paramedic needs in the
 * first minute) with the daily wellness plans built on the same record.
 */
export const WellnessSection: React.FC<WellnessSectionProps> = ({ lang }) => {
  const plans = [
    {
      icon: Footprints,
      title: 'Daily movement',
      titleBn: 'দৈনিক চলাফেরা',
      body:
        'A realistic walking or stretching target set against age, mobility and what the record already says about joints, heart and blood sugar.',
      bodyBn:
        'বয়স, চলাফেরার সক্ষমতা এবং রেকর্ডে থাকা হৃদযন্ত্র, অস্থিসন্ধি ও রক্তে শর্করার তথ্য বিবেচনায় বাস্তবসম্মত হাঁটা বা ব্যায়ামের লক্ষ্য।'
    },
    {
      icon: Apple,
      title: 'Food and nutrition',
      titleBn: 'খাদ্য ও পুষ্টি',
      body:
        'Guidance written around food people in Bangladesh actually eat — rice portions, iftar, sweets at a wedding — rather than a template built for another kitchen.',
      bodyBn:
        'বিদেশি ছকে নয়, বাংলাদেশের বাস্তব খাদ্যাভ্যাস — ভাতের পরিমাণ, ইফতার, অনুষ্ঠানের মিষ্টি — মাথায় রেখে পরামর্শ।'
    },
    {
      icon: Moon,
      title: 'Sleep and lifestyle',
      titleBn: 'ঘুম ও জীবনযাপন',
      body:
        'Simple sleep, weight and blood-pressure logging, so a change over months is visible as a trend instead of a vague feeling.',
      bodyBn:
        'ঘুম, ওজন ও রক্তচাপের সহজ হিসাব রাখা, যাতে মাসের পর মাসের পরিবর্তন অনুমান নয়, স্পষ্ট ধারা হিসেবে দেখা যায়।'
    },
    {
      icon: HeartPulse,
      title: 'Built on your own record',
      titleBn: 'আপনার নিজের রেকর্ডের ভিত্তিতে',
      body:
        'Suggestions draw on your own history and nobody else’s. Nothing in a wellness plan is shared outside the people you have already given access.',
      bodyBn:
        'পরামর্শ তৈরি হয় শুধু আপনার নিজের ইতিহাস থেকে। আপনি যাঁদের অনুমতি দিয়েছেন, তাঁদের বাইরে কিছুই যায় না।'
    }
  ];

  return (
    <section
      id="wellness"
      className="thy-section bg-ivory-50 border-b border-forest-900/10 relative overflow-hidden"
    >
      <div
        aria-hidden="true"
        className="absolute -bottom-40 -left-32 w-[34rem] h-[34rem] rounded-full bg-sage-100/50 blur-3xl pointer-events-none"
      />

      <div className="thy-container relative">
        <SectionHeading
          index="07"
          eyebrow={lang === 'en' ? 'Wellness & Emergency Readiness' : 'সুস্থতা ও জরুরি প্রস্তুতি'}
          title={lang === 'en' ? 'The same record that helps on a quiet Tuesday' : 'যে রেকর্ড সাধারণ দিনে কাজে লাগে'}
          titleAccent={lang === 'en' ? 'is the one that helps in an emergency.' : 'সেটিই জরুরি মুহূর্তে পাশে থাকে।'}
          lede={
            lang === 'en'
              ? 'Day to day, your record powers small, specific suggestions about movement, food and sleep. In the first minutes of an emergency, the same record answers the only questions that matter immediately: blood group, allergies, current medication, who to call.'
              : 'প্রতিদিনের জীবনে আপনার রেকর্ড চলাফেরা, খাদ্য ও ঘুম নিয়ে ছোট ছোট সুনির্দিষ্ট পরামর্শ দেয়। আর জরুরি মুহূর্তের প্রথম কয়েক মিনিটে সেই একই রেকর্ড জানায় সবচেয়ে জরুরি তথ্যগুলো — রক্তের গ্রুপ, অ্যালার্জি, চলমান ওষুধ এবং কাকে ফোন করতে হবে।'
          }
          className="mb-14"
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Emergency card preview */}
          <Reveal className="lg:col-span-5">
            <div className="rounded-card bg-forest-950 text-ivory-100 p-6 sm:p-7 shadow-editorial on-dark relative overflow-hidden">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.06] bg-[radial-gradient(#FAF8F3_1px,transparent_1px)] [background-size:22px_22px]"
              />
              <div className="relative">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-ember-300 font-semibold mb-1.5">
                      {lang === 'en' ? 'Emergency card' : 'জরুরি কার্ড'}
                    </div>
                    <div className="font-editorial text-2xl text-ivory-50">Tariq Ahmed</div>
                    <div className="text-xs text-ivory-200/70">Age 68 · Dhaka</div>
                  </div>
                  <div className="w-20 h-20 rounded-lg bg-ivory-50 flex items-center justify-center shrink-0">
                    <QrCode className="w-14 h-14 text-forest-950" aria-hidden="true" />
                  </div>
                </div>

                <dl className="space-y-3 mb-6">
                  <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ivory-100/12">
                    <dt className="text-[10px] uppercase tracking-widest text-ivory-200/60 font-semibold">
                      Blood group
                    </dt>
                    <dd className="text-lg font-semibold text-ember-300">B+</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ivory-100/12">
                    <dt className="text-[10px] uppercase tracking-widest text-ivory-200/60 font-semibold shrink-0">
                      Allergies
                    </dt>
                    <dd className="text-sm text-ivory-100 text-right">Penicillin · Sulfa drugs</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4 pb-3 border-b border-ivory-100/12">
                    <dt className="text-[10px] uppercase tracking-widest text-ivory-200/60 font-semibold shrink-0">
                      Current medication
                    </dt>
                    <dd className="text-sm text-ivory-100 text-right">Metformin · Amlodipine</dd>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-[10px] uppercase tracking-widest text-ivory-200/60 font-semibold shrink-0">
                      Emergency contact
                    </dt>
                    <dd className="text-sm text-ivory-100 text-right">Samira Ahmed (daughter)</dd>
                  </div>
                </dl>

                <p className="text-[11px] text-ivory-200/70 leading-relaxed">
                  {lang === 'en'
                    ? 'Scanning the code shows only this card — the essentials a paramedic needs. The full medical history stays behind consent, exactly as it was before the scan.'
                    : 'কোড স্ক্যান করলে শুধু এই কার্ডটিই দেখা যায় — যা একজন জরুরি স্বাস্থ্যকর্মীর প্রয়োজন। সম্পূর্ণ মেডিকেল ইতিহাস সম্মতির আড়ালেই থাকে।'}
                </p>
              </div>
            </div>

            <Reveal delay={100}>
              <div className="mt-4 flex items-start gap-2.5 p-4 rounded-card bg-white border border-forest-900/10">
                <Languages className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-xs text-forest-900/80 leading-relaxed">
                  {lang === 'en'
                    ? 'Every card, reminder and summary is available in Bangla and English. Accessibility here means a 68-year-old in Mirpur can read it without help — not just that the app has a language setting.'
                    : 'প্রতিটি কার্ড, রিমাইন্ডার ও সারসংক্ষেপ বাংলা ও ইংরেজিতে পাওয়া যায়। প্রবেশগম্যতা মানে মিরপুরের ৬৮ বছর বয়সী একজন মানুষও যেন কারও সাহায্য ছাড়া পড়তে পারেন।'}
                </p>
              </div>
            </Reveal>
          </Reveal>

          {/* Wellness plans */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {plans.map((plan, i) => {
                const Icon = plan.icon;
                return (
                  <Reveal key={plan.title} delay={i * 70}>
                    <article className="thy-card-interactive h-full p-6">
                      <span className="w-10 h-10 rounded-lg bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-700 mb-4">
                        <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                      </span>
                      <h3 className="font-editorial text-lg sm:text-xl text-forest-950 mb-2">
                        {lang === 'en' ? plan.title : plan.titleBn}
                      </h3>
                      <p className="text-sm text-forest-900/75 leading-relaxed">
                        {lang === 'en' ? plan.body : plan.bodyBn}
                      </p>
                    </article>
                  </Reveal>
                );
              })}
            </div>

            <Reveal delay={200}>
              <div className="mt-5 p-5 sm:p-6 rounded-card bg-white border border-ochre-300/60 shadow-soft-sm">
                <div className="flex items-start gap-3">
                  <Stethoscope className="w-5 h-5 text-ochre-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <h3 className="font-editorial text-lg text-forest-950 mb-1.5">
                      {lang === 'en'
                        ? 'If a condition is involved, a professional signs off'
                        : 'রোগ জড়িত থাকলে পেশাদারের অনুমোদন বাধ্যতামূলক'}
                    </h3>
                    <p className="text-sm text-forest-900/80 leading-relaxed">
                      {lang === 'en'
                        ? 'A walking plan for a healthy adult is one thing. A diet plan for someone with kidney disease, or an exercise plan after a cardiac event, is a clinical decision — those are prepared with, and approved by, a qualified professional before they ever appear in the app.'
                        : 'সুস্থ একজন মানুষের হাঁটার পরিকল্পনা এক বিষয়, আর কিডনি রোগীর খাদ্যতালিকা কিংবা হৃদরোগের পরে ব্যায়ামের পরিকল্পনা সম্পূর্ণ ভিন্ন — এগুলো যোগ্য পেশাদারের সাথে তৈরি এবং তাঁর অনুমোদনের পরই অ্যাপে আসে।'}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={260}>
              <div className="mt-5 flex items-start gap-2.5 text-xs text-forest-800/75 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-ochre-600 shrink-0 mt-0.5" aria-hidden="true" />
                <p>
                  {lang === 'en'
                    ? 'Thypro is not an emergency service and does not monitor vital signs in real time. For a medical emergency, call local emergency services or go to the nearest hospital.'
                    : 'থাইপ্রো কোনো জরুরি সেবা নয় এবং সরাসরি শারীরিক অবস্থা পর্যবেক্ষণ করে না। জরুরি অবস্থায় নিকটস্থ হাসপাতাল বা জরুরি সেবায় যোগাযোগ করুন।'}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
