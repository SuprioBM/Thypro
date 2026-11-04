import React from 'react';
import {
  Target,
  Users,
  Building2,
  Droplet,
  MessagesSquare,
  Globe2,
  HeartHandshake,
  Accessibility,
  BrainCircuit,
  Activity
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';

interface ImpactSectionProps {
  lang: 'en' | 'bn';
}

/**
 * Section 09 — Mission and milestones.
 * States the Millennium Fellowship 2026 / SDG 3 framing and the development
 * targets, labelled explicitly as targets for December 2026 rather than
 * achievements already banked.
 */
export const ImpactSection: React.FC<ImpactSectionProps> = ({ lang }) => {
  const milestones = [
    {
      icon: MessagesSquare,
      metric: '20 + 10',
      label: 'Research interviews',
      labelBn: 'গবেষণা সাক্ষাৎকার',
      body:
        'At least 20 families living abroad and 10 parents at home, interviewed about how care is actually coordinated across the distance.',
      bodyBn:
        'অন্তত ২০টি প্রবাসী পরিবার ও দেশে থাকা ১০ জন অভিভাবকের সাক্ষাৎকার, দূরত্বের মধ্যে চিকিৎসা সমন্বয় বাস্তবে কীভাবে হয় তা বোঝার জন্য।'
    },
    {
      icon: Users,
      metric: '10',
      label: 'Families in the Family Care pilot',
      labelBn: 'ফ্যামিলি কেয়ার পাইলটে পরিবার',
      body:
        'Running Family Care end to end with at least ten households, so the workflow is tested by real routines rather than a demo script.',
      bodyBn:
        'অন্তত দশটি পরিবারের সাথে ফ্যামিলি কেয়ার সম্পূর্ণভাবে পরিচালনা, যাতে বাস্তব দৈনন্দিন রুটিনে এটি পরীক্ষিত হয়।'
    },
    {
      icon: Building2,
      metric: '3',
      label: 'Partner clinics',
      labelBn: 'অংশীদার ক্লিনিক',
      body:
        'Three clinics willing to receive a Thypro record in consultation and tell us plainly where it slows them down.',
      bodyBn:
        'তিনটি ক্লিনিক, যারা পরামর্শের সময় থাইপ্রো রেকর্ড গ্রহণ করবে এবং স্পষ্টভাবে জানাবে কোথায় সমস্যা হচ্ছে।'
    },
    {
      icon: Droplet,
      metric: '1',
      label: 'Verified blood bank',
      labelBn: 'যাচাইকৃত ব্লাড ব্যাংক',
      body:
        'One verified blood bank partnership, so the donor workflow is screened and handled by people qualified to do it.',
      bodyBn:
        'একটি যাচাইকৃত ব্লাড ব্যাংকের সাথে অংশীদারিত্ব, যাতে রক্তদাতা প্রক্রিয়াটি যোগ্য পেশাদারদের তত্ত্বাবধানে চলে।'
    }
  ];

  const commitments = [
    {
      icon: Accessibility,
      title: 'Accessible healthcare',
      titleBn: 'সহজলভ্য স্বাস্থ্যসেবা',
      body: 'Usable on a modest phone, in Bangla, by someone who has never used a health app.',
      bodyBn: 'সাধারণ মোবাইলে, বাংলায়, স্বাস্থ্য অ্যাপে অনভিজ্ঞ মানুষের জন্যও ব্যবহারযোগ্য।'
    },
    {
      icon: HeartHandshake,
      title: 'Family-centred care',
      titleBn: 'পরিবারকেন্দ্রিক যত্ন',
      body: 'Built around households and caregivers, not around a single logged-in individual.',
      bodyBn: 'একক ব্যবহারকারী নয়, পরিবার ও সেবাদাতাদের ঘিরে তৈরি।'
    },
    {
      icon: Globe2,
      title: 'Digital health inclusion',
      titleBn: 'ডিজিটাল স্বাস্থ্যে অন্তর্ভুক্তি',
      body: 'A record that works without the household owning a laptop or a hospital subscription.',
      bodyBn: 'ল্যাপটপ বা হাসপাতালের সাবস্ক্রিপশন ছাড়াই কার্যকর রেকর্ড।'
    },
    {
      icon: Activity,
      title: 'Healthcare continuity',
      titleBn: 'চিকিৎসার ধারাবাহিকতা',
      body: 'History that survives a change of doctor, a change of city, and a change of decade.',
      bodyBn: 'চিকিৎসক, শহর কিংবা দশক বদলালেও টিকে থাকা স্বাস্থ্য ইতিহাস।'
    },
    {
      icon: BrainCircuit,
      title: 'Responsible AI',
      titleBn: 'দায়িত্বশীল এআই',
      body: 'Assistance that organises and explains, with a clinician holding every clinical decision.',
      bodyBn: 'এআই সাজায় ও ব্যাখ্যা করে; প্রতিটি চিকিৎসাগত সিদ্ধান্ত থাকে চিকিৎসকের হাতে।'
    },
    {
      icon: Droplet,
      title: 'Community blood donation',
      titleBn: 'সামাজিক রক্তদান',
      body: 'A calmer, consent-based route from an urgent request to a screened donor.',
      bodyBn: 'জরুরি অনুরোধ থেকে যাচাইকৃত দাতা পর্যন্ত একটি শান্ত, সম্মতিভিত্তিক পথ।'
    }
  ];

  return (
    <section
      id="impact"
      className="thy-section bg-ivory-100 border-b border-forest-900/10 relative overflow-hidden"
    >
      <div className="thy-container relative">
        <SectionHeading
          index="09"
          eyebrow={lang === 'en' ? 'Mission & Milestones' : 'লক্ষ্য ও অগ্রগতি'}
          title={lang === 'en' ? 'A health project with a deadline' : 'নির্দিষ্ট সময়সীমার একটি স্বাস্থ্য উদ্যোগ'}
          titleAccent={lang === 'en' ? 'and numbers we can be held to.' : 'এবং যাচাইযোগ্য লক্ষ্যমাত্রা।'}
          lede={
            lang === 'en'
              ? 'Thypro is a Millennium Fellowship 2026 project working towards UN Sustainable Development Goal 3 — good health and well-being. The four numbers below are what we have committed to reach by December 2026. None of them is done yet; publishing them is how we stay honest about the gap.'
              : 'থাইপ্রো একটি মিলেনিয়াম ফেলোশিপ ২০২৬ প্রকল্প, যা জাতিসংঘের টেকসই উন্নয়ন লক্ষ্য ৩ — সুস্বাস্থ্য ও কল্যাণ — অর্জনে কাজ করছে। নিচের চারটি সংখ্যা ডিসেম্বর ২০২৬ সালের মধ্যে আমাদের অঙ্গীকার। এর একটিও এখনো সম্পন্ন হয়নি।'
          }
          className="mb-10"
        />

        {/* Affiliation strip */}
        <Reveal className="mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-forest-900/12 text-xs font-medium text-forest-900 shadow-soft-sm">
              <Target className="w-3.5 h-3.5 text-ochre-600" aria-hidden="true" />
              Millennium Fellowship 2026
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-forest-900/12 text-xs font-medium text-forest-900 shadow-soft-sm">
              <Globe2 className="w-3.5 h-3.5 text-sage-600" aria-hidden="true" />
              UN SDG 3 · Good Health and Well-being
            </span>
            <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-ember-50 border border-ember-200 text-xs font-medium text-ember-800">
              <span className="w-1.5 h-1.5 rounded-full bg-ember-500" aria-hidden="true" />
              {lang === 'en' ? 'Targets for December 2026' : 'ডিসেম্বর ২০২৬-এর লক্ষ্যমাত্রা'}
            </span>
          </div>
        </Reveal>

        {/* Milestone targets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {milestones.map((m, i) => {
            const Icon = m.icon;
            return (
              <Reveal key={m.label} delay={i * 70}>
                <article className="thy-card-interactive h-full p-6 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-lg bg-forest-900/5 flex items-center justify-center text-forest-800">
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <span className="thy-status-planned">Target</span>
                  </div>
                  <div className="font-editorial text-4xl text-forest-950 leading-none mb-2 tracking-tight">
                    {m.metric}
                  </div>
                  <div className="text-xs uppercase tracking-wider text-ochre-700 font-semibold mb-3">
                    {lang === 'en' ? m.label : m.labelBn}
                  </div>
                  <p className="text-sm text-forest-900/75 leading-relaxed">
                    {lang === 'en' ? m.body : m.bodyBn}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        {/* Commitments */}
        <Reveal>
          <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 mb-2">
            {lang === 'en' ? 'What we are committing to' : 'আমাদের অঙ্গীকার'}
          </h3>
          <p className="text-sm text-forest-900/75 leading-relaxed max-w-2xl mb-8">
            {lang === 'en'
              ? 'Six commitments that decide what gets built and, just as often, what gets refused.'
              : 'ছয়টি অঙ্গীকার, যা ঠিক করে দেয় আমরা কী তৈরি করব এবং কোন কাজটি করব না।'}
          </p>
        </Reveal>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {commitments.map((c, i) => {
            const Icon = c.icon;
            return (
              <Reveal as="li" key={c.title} delay={i * 50}>
                <div className="h-full flex items-start gap-3.5 p-5 rounded-card bg-white/70 border border-forest-900/8 transition-colors duration-300 hover:bg-white hover:border-forest-900/16">
                  <span className="w-9 h-9 rounded-lg bg-sage-50 border border-sage-200 flex items-center justify-center text-sage-700 shrink-0">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h4 className="text-sm font-semibold text-forest-950 mb-1">
                      {lang === 'en' ? c.title : c.titleBn}
                    </h4>
                    <p className="text-xs text-forest-900/75 leading-relaxed">
                      {lang === 'en' ? c.body : c.bodyBn}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
