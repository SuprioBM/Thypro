import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { ShiftSection } from './components/ShiftSection';
import { PeoplePermissionsSection } from './components/PeoplePermissionsSection';
import { CapabilitiesSection } from './components/CapabilitiesSection';
import { InteractiveWalkthrough } from './components/InteractiveWalkthrough';
import { LongerViewSection } from './components/LongerViewSection';
import { FinalCtaSection } from './components/FinalCtaSection';
import { Footer } from './components/Footer';
import { Modals } from './components/Modals';

export const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const scrollToProblem = () => {
    const el = document.getElementById('problem');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToWalkthrough = () => {
    const el = document.getElementById('walkthrough');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-ivory-100 text-forest-900 selection:bg-ochre-100 selection:text-forest-950 font-sans flex flex-col">
      {/* Editorial Navigation */}
      <Navbar
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
        lang={lang}
        onToggleLang={toggleLanguage}
      />

      {/* Main Narrative Flow */}
      <main className="flex-1">
        {/* Section 1: Hero */}
        <HeroSection
          onDiscoverClick={scrollToProblem}
          onHowItWorksClick={scrollToWalkthrough}
          onOpenAccessModal={() => setIsAccessModalOpen(true)}
          lang={lang}
        />

        {/* Section 2: The Problem */}
        <ProblemSection lang={lang} />

        {/* Section 3: The Shift */}
        <ShiftSection lang={lang} />

        {/* Section 4: People & Permissions */}
        <PeoplePermissionsSection lang={lang} />

        {/* Section 5: How Thypro Helps */}
        <CapabilitiesSection lang={lang} />

        {/* Section 6: A Closer Look (Interactive Demonstration) */}
        <InteractiveWalkthrough lang={lang} />

        {/* Section 7: The Longer View */}
        <LongerViewSection lang={lang} />

        {/* Section 8: Final Call to Action */}
        <FinalCtaSection
          onOpenAccessModal={() => setIsAccessModalOpen(true)}
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
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
        lang={lang}
      />
    </div>
  );
};

export default App;
