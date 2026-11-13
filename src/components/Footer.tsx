import React from 'react';
import { ArrowUp, Target, Globe2 } from 'lucide-react';
import { FullLogo } from './ui/Logo';
import { SITE_PAGES } from '../app/router';
import { translate, type Key } from '../i18n';

const PAGE_TITLES: Record<(typeof SITE_PAGES)[number], Key> = {
  'how-suggestions-work': 'tech.title',
  rights: 'site.rights.title',
  accessibility: 'site.a11y.title',
  pilot: 'site.pilot.title'
};

interface FooterProps {
  onOpenAccessModal: () => void;
  onOpenPrivacyModal: () => void;
  lang: 'en' | 'bn';
}

export const Footer: React.FC<FooterProps> = ({
  onOpenAccessModal,
  onOpenPrivacyModal,
  lang
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const exploreLinks = [
    { id: 'problem', label: lang === 'en' ? 'The Problem' : 'সমস্যা' },
    { id: 'approach', label: lang === 'en' ? 'Our Approach' : 'আমাদের উদ্যোগ' },
    { id: 'permissions', label: lang === 'en' ? 'People & Permissions' : 'ব্যক্তি ও নিরাপত্তা' },
    { id: 'capabilities', label: lang === 'en' ? 'Platform Capabilities' : 'প্লাটফর্মের কার্যকারিতা' },
    { id: 'walkthrough', label: lang === 'en' ? 'Interactive Tour' : 'সরাসরি ডেমো' },
    { id: 'vision', label: lang === 'en' ? 'The Lifelong Vision' : 'দীর্ঘমেয়াদী লক্ষ্য' }
  ];

  const productLinks = [
    { id: 'capabilities', label: lang === 'en' ? 'Personal health records' : 'ব্যক্তিগত স্বাস্থ্য রেকর্ড' },
    { id: 'family-care', label: lang === 'en' ? 'Thypro Family Care' : 'থাইপ্রো ফ্যামিলি কেয়ার' },
    { id: 'blood-network', label: lang === 'en' ? 'Blood donor network' : 'রক্তদাতা নেটওয়ার্ক' },
    { id: 'wellness', label: lang === 'en' ? 'Wellness & emergency card' : 'সুস্থতা ও জরুরি কার্ড' },
    { id: 'impact', label: lang === 'en' ? 'Mission & milestones' : 'লক্ষ্য ও অগ্রগতি' }
  ];

  return (
    <footer className="bg-ivory-100 border-t border-forest-900/10 text-forest-900 py-14 sm:py-20 font-sans">
      <div className="thy-container">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 sm:pb-16 border-b border-forest-900/10">
          {/* Brand & Manifesto Column */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <FullLogo className="w-52 -ml-2 mb-3" />
              <p className="text-sm text-forest-900/75 leading-relaxed max-w-sm mb-6 font-normal">
                {lang === 'en'
                  ? 'A person-owned, lifelong health record with a care layer that acts on it — so patients, families wherever they live, and clinics can manage care together.'
                  : 'ব্যক্তির নিজস্ব নিয়ন্ত্রণাধীন দীর্ঘমেয়াদী স্বাস্থ্য রেকর্ড এবং সহায়ক সেবাস্তর—যাতে রোগী, প্রবাসী পরিবার ও ক্লিনিক একসাথে স্বাস্থ্য পরিচর্যা নিশ্চিত করতে পারে।'}
              </p>

              <div className="flex flex-wrap gap-2 mb-6">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-forest-900/12 text-[11px] font-medium text-forest-900">
                  <Target className="w-3 h-3 text-ochre-600" aria-hidden="true" />
                  Millennium Fellowship 2026
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-forest-900/12 text-[11px] font-medium text-forest-900">
                  <Globe2 className="w-3 h-3 text-sage-600" aria-hidden="true" />
                  UN SDG 3
                </span>
              </div>
            </div>

            <div className="text-[11px] text-forest-800/60 font-mono leading-relaxed">
              Thypro Architecture Specification v3.0 (October 2026)
              <br />
              13 modules · 104 verified requirements
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="md:col-span-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Explore */}
            <div>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                {lang === 'en' ? 'Explore' : 'ঘুরে দেখুন'}
              </h2>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                {exploreLinks.map((link) => (
                  <li key={link.id}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(link.id)}
                      className="hover:text-forest-950 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* What Thypro does */}
            <div>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                {lang === 'en' ? 'Platform' : 'প্লাটফর্ম'}
              </h2>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                {productLinks.map((link) => (
                  <li key={link.label}>
                    <button
                      type="button"
                      onClick={() => scrollToSection(link.id)}
                      className="hover:text-forest-950 transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Governance & Trust */}
            <div>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                {lang === 'en' ? 'Governance' : 'নীতিমালা'}
              </h2>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'Data sovereignty & privacy' : 'তথ্যের মালিকানা ও গোপনীয়তা'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'No blockchain, no data sale' : 'ব্লকচেইন নয়, তথ্য বিক্রি নয়'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'Governed AI boundaries' : 'এআই ব্যবহারের সীমা'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenPrivacyModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'TRU07 cryptographic proof' : 'TRU07 ক্রিপ্টোগ্রাফিক প্রমাণ'}
                  </button>
                </li>
                {SITE_PAGES.map((p) => (
                  <li key={p}>
                    <a href={`#/page/${p}`} className="hover:text-forest-950 transition-colors">
                      {translate(lang, PAGE_TITLES[p])}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Participation */}
            <div>
              <h2 className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                {lang === 'en' ? 'Participation' : 'অংশগ্রহণ'}
              </h2>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                <li>
                  <button
                    type="button"
                    onClick={onOpenAccessModal}
                    className="text-ochre-700 font-semibold hover:text-ochre-600 text-left"
                  >
                    {lang === 'en' ? 'Apply for the family pilot' : 'ফ্যামিলি পাইলটে আবেদন'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAccessModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'Clinic partner enquiries (Dhaka)' : 'ক্লিনিক অংশীদারিত্ব (ঢাকা)'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onOpenAccessModal}
                    className="hover:text-forest-950 transition-colors text-left"
                  >
                    {lang === 'en' ? 'Blood bank partnerships' : 'ব্লাড ব্যাংক অংশীদারিত্ব'}
                  </button>
                </li>
                <li className="pt-2 text-[11px] text-forest-800/65 leading-relaxed">
                  {lang === 'en'
                    ? 'Initial corridor: Dhaka, London, New York, Dubai, Abu Dhabi'
                    : 'প্রাথমিক করিডোর: ঢাকা, লন্ডন, নিউইয়র্ক, দুবাই, আবুধাবি'}
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-forest-800/65 gap-4">
          <div className="leading-relaxed">
            &copy; {new Date().getFullYear()} Thypro.{' '}
            {lang === 'en'
              ? 'A Millennium Fellowship 2026 project in development. Thypro is not a medical provider and does not give medical advice.'
              : 'নির্মাণাধীন একটি মিলেনিয়াম ফেলোশিপ ২০২৬ প্রকল্প। থাইপ্রো কোনো চিকিৎসা প্রতিষ্ঠান নয় এবং চিকিৎসা পরামর্শ দেয় না।'}
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-forest-900/80 hover:text-forest-950 transition-colors shrink-0"
          >
            <span>{lang === 'en' ? 'Back to top' : 'উপরে ফিরুন'}</span>
            <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
};
