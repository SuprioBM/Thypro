import React, { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { ShiftSection } from './components/ShiftSection';
import { PeoplePermissionsSection } from './components/PeoplePermissionsSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { FamilyCareSection } from './components/FamilyCareSection';
import { BloodNetworkSection } from './components/BloodNetworkSection';
import { WellnessSection } from './components/WellnessSection';
import { InteractiveWalkthrough } from './components/InteractiveWalkthrough';
import { ImpactSection } from './components/ImpactSection';
import { LongerViewSection } from './components/LongerViewSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { Modals } from './components/Modals';
import { HabitLoopSection } from './components/HabitLoopSection';
import type { Lang } from './domain/types';
import { isRtl, translate } from './i18n';

export const Landing: React.FC<{ onContinueAsGuest: (lang: Lang) => void; onTryLoop: (lang: Lang) => void }> = ({
  onContinueAsGuest,
  onTryLoop
}) => {
  /** Full UI language (four languages). Older sections exist in English and Bangla only. */
  const [uiLang, setUiLang] = useState<Lang>('en');
  const lang: 'en' | 'bn' = uiLang === 'bn' ? 'bn' : 'en';
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  /* Fade-and-rise every section's top-level blocks as they scroll into view. */
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>('main section > .thy-container > *:not(.thy-reveal), footer .thy-container > *')
    ).filter((el) => !el.closest('[data-reveal]') || el.hasAttribute('data-reveal'));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            (e.target as HTMLElement).setAttribute('data-visible', '');
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08, rootMargin: '0px 0px -6% 0px' }
    );
    targets.forEach((el, i) => {
      el.setAttribute('data-reveal', '');
      el.style.setProperty('--reveal-delay', `${(i % 3) * 60}ms`);
      io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div
      id="top"
      className="min-h-screen bg-ivory-100 text-forest-900 selection:bg-ochre-100 selection:text-forest-950 font-sans flex flex-col"
    >
      {/* Keyboard users reach the content without tabbing the whole nav */}
      <a href="#main-content" className="thy-skip-link">
        Skip to main content
      </a>

      {/* Editorial Navigation */}
      <Navbar
        onContinueAsGuest={() => onContinueAsGuest(uiLang)}
        onTryLoop={() => onTryLoop(uiLang)}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        lang={lang}
        uiLang={uiLang}
        onSetLang={setUiLang}
      />

      {(uiLang === 'hi' || uiLang === 'ur') && (
        <p
          role="status"
          lang={uiLang}
          dir={isRtl(uiLang) ? 'rtl' : 'ltr'}
          className="fixed inset-x-0 top-[5.25rem] z-40 mx-auto w-fit max-w-[92vw] rounded-full border border-ochre-300 bg-ochre-50 px-4 py-1.5 text-center text-xs text-forest-950 shadow-soft-sm"
        >
          {translate(uiLang, 'site.langNote')}
        </p>
      )}

      {/* Main Narrative Flow */}
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <HeroSection
          onDiscoverClick={() => scrollToSection('problem')}
          onHowItWorksClick={() => scrollToSection('walkthrough')}
          onOpenAccessModal={() => setIsAccessModalOpen(true)}
          onContinueAsGuest={() => onContinueAsGuest(uiLang)}
          onTryLoop={() => onTryLoop(uiLang)}
          uiLang={uiLang}
          lang={lang}
        />

        {/* 01 — The Problem */}
        <ProblemSection lang={lang} />

        {/* 02 — The Shift */}
        <ShiftSection lang={lang} />

        {/* 03 — People & Permissions */}
        <PeoplePermissionsSection lang={lang} />

        {/* 04 — Core Capabilities */}
        <CapabilitiesSection lang={lang} />

        {/* Sustaining healthy habits: the habit loop (all four languages) */}
        <HabitLoopSection lang={uiLang} onReplay={() => onTryLoop(uiLang)} />

        {/* 05 — Thypro Family Care */}
        <FamilyCareSection lang={lang} />

        {/* 06 — Blood Donor Network */}
        <BloodNetworkSection lang={lang} />

        {/* 07 — Wellness & Emergency Readiness */}
        <WellnessSection lang={lang} />

        {/* 08 — A Closer Look (Interactive Demonstration) */}
        <InteractiveWalkthrough lang={lang} />

        {/* 09 — Mission & Milestones */}
        <ImpactSection lang={lang} />

        {/* 10 — The Longer View */}
        <LongerViewSection lang={lang} />

        {/* Final Call to Action */}
        <FinalCtaSection
          onOpenAccessModal={() => setIsAccessModalOpen(true)}
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          onContinueAsGuest={() => onContinueAsGuest(uiLang)}
          lang={lang}
        />
      </main>

      {/* Footer */}
      <Footer
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        lang={lang}
      />

      {/* Modals & Dialogs */}
      <Modals
        isAccessModalOpen={isAccessModalOpen}
        onCloseAccessModal={() => setIsAccessModalOpen(false)}
        isPrivacyModalOpen={isPrivacyModalOpen}
        onClosePrivacyModal={() => setIsPrivacyModalOpen(false)}
        onContinueAsGuest={() => {
          setIsAccessModalOpen(false);
          onContinueAsGuest(uiLang);
        }}
        lang={lang}
      />
    </div>
  );
};

export default Landing;
