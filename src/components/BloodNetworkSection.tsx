import React, { useState } from 'react';
import { Droplet, MapPin, Search, ShieldAlert, BellRing, UserCheck, Info } from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface BloodNetworkSectionProps {
  lang: 'en' | 'bn';
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/**
 * Section 06 — Blood Donor Network.
 *
 * This is a design preview of a workflow still being built. The copy and the
 * banner inside the mock both say so: no live donor directory exists yet, and
 * the figures shown are illustrative, not counts of real registered donors.
 */
export const BloodNetworkSection: React.FC<BloodNetworkSectionProps> = ({ lang }) => {
  const [group, setGroup] = useState<string>('B+');

  const steps = [
    {
      icon: Search,
      title: 'Request by group and area',
      titleBn: 'রক্তের গ্রুপ ও এলাকা অনুযায়ী অনুরোধ',
      body:
        'A requester states the blood group, the hospital, and how soon it is needed. The request carries the ward, not the patient’s medical record.',
      bodyBn:
        'অনুরোধকারী রক্তের গ্রুপ, হাসপাতাল ও প্রয়োজনের সময় উল্লেখ করেন। অনুরোধে ওয়ার্ডের তথ্য থাকে, রোগীর মেডিকেল রেকর্ড নয়।'
    },
    {
      icon: BellRing,
      title: 'Reach nearby willing donors',
      titleBn: 'কাছাকাছি ইচ্ছুক দাতাদের কাছে পৌঁছানো',
      body:
        'Donors who opted in and are inside the eligibility window are notified. Nobody is listed publicly, and a donor can pause notifications at any time.',
      bodyBn:
        'যাঁরা সম্মতি দিয়েছেন এবং দান করার উপযুক্ত সময়সীমায় আছেন, কেবল তাঁদেরই জানানো হয়। কোনো তালিকা প্রকাশ্যে থাকে না।'
    },
    {
      icon: UserCheck,
      title: 'Connect through the blood bank',
      titleBn: 'ব্লাড ব্যাংকের মাধ্যমে সংযোগ',
      body:
        'Matching is handed to a partner blood bank for screening and collection. Thypro coordinates the message, it does not certify anyone’s blood.',
      bodyBn:
        'স্ক্রিনিং ও সংগ্রহের দায়িত্ব অংশীদার ব্লাড ব্যাংকের। থাইপ্রো শুধু যোগাযোগ সমন্বয় করে, রক্তের সনদ দেয় না।'
    }
  ];

  return (
    <section
      id="blood-network"
      className="thy-section bg-ivory-100 border-b border-forest-900/10 relative overflow-hidden"
    >
      <div className="thy-container relative">
        <SectionHeading
          index="06"
          eyebrow={lang === 'en' ? 'Blood Donor Network' : 'রক্তদাতা নেটওয়ার্ক'}
          title={lang === 'en' ? 'When a family needs blood,' : 'যখন রক্ত প্রয়োজন,'}
          titleAccent={lang === 'en' ? 'the search should not start on Facebook.' : 'খোঁজ শুরু হোক নির্ভরযোগ্য জায়গা থেকে।'}
          lede={
            lang === 'en'
              ? 'In Bangladesh, an urgent blood request usually becomes a scramble across group chats and status posts at the worst possible hour. We are designing a calmer path: a consent-based way to reach willing donors nearby and hand the match to a blood bank that can screen it properly.'
              : 'বাংলাদেশে জরুরি রক্তের প্রয়োজন হলে পরিবারকে সবচেয়ে কঠিন মুহূর্তে গ্রুপ চ্যাট আর ফেসবুক পোস্টে ছুটতে হয়। আমরা একটি শান্ত পথ তৈরি করছি: সম্মতিভিত্তিকভাবে কাছাকাছি ইচ্ছুক দাতাদের কাছে পৌঁছানো এবং যাচাইয়ের দায়িত্ব ব্লাড ব্যাংকের হাতে দেওয়া।'
          }
          className="mb-10"
        />

        {/* Honest status banner — this workflow is not live */}
        <Reveal className="mb-12">
          <div className="flex items-start gap-3 p-4 rounded-card bg-signal-amberSoft border border-ochre-300/70 max-w-3xl">
            <Info className="w-4 h-4 text-ochre-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-xs sm:text-sm text-forest-900/85 leading-relaxed">
              <strong className="font-semibold text-forest-950">
                {lang === 'en' ? 'Not live yet. ' : 'এখনো চালু হয়নি। '}
              </strong>
              {lang === 'en'
                ? 'There is no donor directory running today and no verified donors registered. What follows is the interface we are designing, shown so partners and prospective donors can tell us where it is wrong. Our first milestone is working with one verified blood bank.'
                : 'বর্তমানে কোনো সক্রিয় দাতা তালিকা বা নিবন্ধিত যাচাইকৃত দাতা নেই। নিচে আমাদের নকশাধীন ইন্টারফেসটি দেখানো হয়েছে, যাতে অংশীদার ও সম্ভাব্য দাতারা মতামত দিতে পারেন। প্রথম লক্ষ্য একটি যাচাইকৃত ব্লাড ব্যাংকের সাথে কাজ শুরু করা।'}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Donor discovery interface preview */}
          <Reveal className="lg:col-span-7">
            <div className="thy-mock">
              <div className="thy-mock-bar justify-between">
                <span className="flex items-center gap-2">
                  <span className="thy-mock-dot" />
                  <span className="thy-mock-dot" />
                  <span className="text-[11px] font-mono text-forest-800/60 ml-1">
                    Blood request · design preview
                  </span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ochre-700 font-semibold">
                  Not a live service
                </span>
              </div>

              <div className="p-5 sm:p-6">
                {/* Blood group selector */}
                <fieldset>
                  <legend className="text-[11px] font-mono uppercase tracking-wider text-forest-800/70 font-semibold mb-3">
                    {lang === 'en' ? 'Blood group needed' : 'প্রয়োজনীয় রক্তের গ্রুপ'}
                  </legend>
                  <div className="grid grid-cols-4 gap-2 mb-6">
                    {BLOOD_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGroup(g)}
                        aria-pressed={group === g}
                        className={`py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ease-editorial border ${
                          group === g
                            ? 'bg-forest-900 text-ivory-50 border-forest-900 shadow-soft-sm'
                            : 'bg-ivory-100 text-forest-900/80 border-forest-900/12 hover:border-forest-900/30 hover:bg-white'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </fieldset>

                {/* Location + urgency row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-ivory-100 border border-forest-900/10">
                    <MapPin className="w-4 h-4 text-ochre-600 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-forest-800/60 font-semibold">
                        Hospital
                      </div>
                      <div className="text-sm text-forest-950 truncate">
                        Dhaka Medical College, Ward 7
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-lg bg-ivory-100 border border-forest-900/10">
                    <ShieldAlert className="w-4 h-4 text-ember-500 shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider text-forest-800/60 font-semibold">
                        Needed within
                      </div>
                      <div className="text-sm text-forest-950">6 hours · 2 bags</div>
                    </div>
                  </div>
                </div>

                {/* Illustrative match result */}
                <div className="rounded-lg border border-forest-900/10 overflow-hidden">
                  <div className="px-4 py-2.5 bg-forest-900 text-ivory-100 flex items-center justify-between">
                    <span className="text-xs font-semibold">
                      {lang === 'en' ? 'Donors who would be notified' : 'যাঁদের জানানো হবে'}
                    </span>
                    <span className="text-[10px] font-mono text-ivory-200/70">
                      {group} · within 5 km
                    </span>
                  </div>
                  <ul className="divide-y divide-forest-900/8 bg-white">
                    {[
                      { initials: 'M.H.', area: 'Dhanmondi', last: 'Eligible · last donated 5 months ago' },
                      { initials: 'S.A.', area: 'Mohammadpur', last: 'Eligible · last donated 7 months ago' },
                      { initials: 'R.K.', area: 'Lalmatia', last: 'Eligible · first-time donor' }
                    ].map((d) => (
                      <li key={d.initials} className="flex items-center gap-3 px-4 py-3">
                        <span className="w-9 h-9 rounded-full bg-signal-crimsonSoft text-signal-crimson flex items-center justify-center text-xs font-semibold shrink-0">
                          {group}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-forest-950">
                            {d.initials} · {d.area}
                          </div>
                          <div className="text-[11px] text-forest-800/70">{d.last}</div>
                        </div>
                        <span className="thy-status-planned shrink-0">Illustrative</span>
                      </li>
                    ))}
                  </ul>
                  <div className="px-4 py-3 bg-ivory-100 text-[11px] text-forest-800/70 leading-relaxed">
                    {lang === 'en'
                      ? 'Donors are shown by initials and area only. A phone number is exchanged through the partner blood bank after the donor accepts — never scraped, never published, never sold.'
                      : 'দাতাদের শুধু আদ্যক্ষর ও এলাকা দেখানো হয়। দাতা সম্মত হওয়ার পর অংশীদার ব্লাড ব্যাংকের মাধ্যমে যোগাযোগের তথ্য বিনিময় হয় — কখনোই প্রকাশ বা বিক্রি করা হয় না।'}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>

          {/* How the workflow is meant to run */}
          <div className="lg:col-span-5 space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 80}>
                  <article className="thy-card-interactive p-5 sm:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="w-9 h-9 rounded-lg bg-signal-crimsonSoft border border-signal-crimson/15 flex items-center justify-center text-signal-crimson shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <h3 className="font-editorial text-lg text-forest-950 leading-snug">
                        {lang === 'en' ? step.title : step.titleBn}
                      </h3>
                    </div>
                    <p className="text-sm text-forest-900/75 leading-relaxed">
                      {lang === 'en' ? step.body : step.bodyBn}
                    </p>
                  </article>
                </Reveal>
              );
            })}

            <Reveal delay={240}>
              <div className="p-5 rounded-card bg-forest-950 text-ivory-100 on-dark">
                <div className="flex items-center gap-2 mb-2">
                  <Droplet className="w-4 h-4 text-ember-300" aria-hidden="true" />
                  <h3 className="font-editorial text-lg text-ivory-50">
                    {lang === 'en' ? 'Responsible by design' : 'দায়িত্বশীল নকশা'}
                  </h3>
                </div>
                <p className="text-xs text-ivory-200/85 leading-relaxed">
                  {lang === 'en'
                    ? 'Donor location and availability are health information. They are never sold, never used for advertising, and never shared with a requester until the donor has said yes to that specific request.'
                    : 'দাতার অবস্থান ও প্রাপ্যতা স্বাস্থ্যসংক্রান্ত তথ্য। এগুলো কখনোই বিক্রি বা বিজ্ঞাপনে ব্যবহার করা হয় না, এবং দাতার সম্মতি ছাড়া কারও সাথে ভাগ করা হয় না।'}
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
