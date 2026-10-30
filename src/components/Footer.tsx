import React from 'react';
import { ArrowUp, ShieldCheck, Heart, FileText, Globe } from 'lucide-react';

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

  return (
    <footer className="bg-ivory-100 border-t border-forest-900/10 text-forest-900 py-16 sm:py-20 font-sans">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 border-b border-forest-900/10">
          {/* Brand & Manifesto Column (5 cols) */}
          <div className="md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-editorial text-2xl text-forest-950 font-medium">Thypro</span>
                <span className="text-xs uppercase tracking-widest text-forest-800/60 font-semibold pl-1 border-l border-forest-900/20">
                  Connected Health
                </span>
              </div>
              <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed max-w-sm mb-6 font-normal">
                {lang === 'en'
                  ? 'A person-owned, lifelong health record with an AI care layer that acts on it—so patients, families wherever they live, and clinics can manage care together.'
                  : 'ব্যক্তির নিজস্ব নিয়ন্ত্রণাধীন দীর্ঘমেয়াদী স্বাস্থ্য রেকর্ড এবং এআই সমন্বয় স্তর—যাতে রোগী, প্রবাসী পরিবার ও ক্লিনিক একসাথে স্বাস্থ্য পরিচর্যা নিশ্চিত করতে পারে।'}
              </p>
            </div>

            <div className="text-xs text-forest-800/60 font-mono">
              Thypro Architecture Specification v3.0 (October 2026) <br />
              13 Modules · 104 Verified Requirements
            </div>
          </div>

          {/* Navigation Columns (7 cols) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            {/* Column 1: Exploration */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                Explore
              </div>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                <li>
                  <button onClick={() => scrollToSection('problem')} className="hover:text-forest-950 transition-colors">
                    The Problem
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('approach')} className="hover:text-forest-950 transition-colors">
                    Our Approach
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('permissions')} className="hover:text-forest-950 transition-colors">
                    People & Permissions
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('capabilities')} className="hover:text-forest-950 transition-colors">
                    Platform Capabilities
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('walkthrough')} className="hover:text-forest-950 transition-colors">
                    Interactive Tour
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('vision')} className="hover:text-forest-950 transition-colors">
                    The Lifelong Vision
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 2: Governance & Trust */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                Governance
              </div>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                <li>
                  <button onClick={onOpenPrivacyModal} className="hover:text-forest-950 transition-colors text-left">
                    Data Sovereignty & Privacy
                  </button>
                </li>
                <li>
                  <button onClick={onOpenPrivacyModal} className="hover:text-forest-950 transition-colors text-left">
                    No Blockchain / No Data Sale
                  </button>
                </li>
                <li>
                  <button onClick={onOpenPrivacyModal} className="hover:text-forest-950 transition-colors text-left">
                    Governed AI Boundaries
                  </button>
                </li>
                <li>
                  <button onClick={onOpenPrivacyModal} className="hover:text-forest-950 transition-colors text-left">
                    TRU07 Cryptographic Proof
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact & Pilot */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-forest-950 font-bold mb-4">
                Participation
              </div>
              <ul className="space-y-2.5 text-xs text-forest-800/80">
                <li>
                  <button onClick={onOpenAccessModal} className="text-ochre-700 font-semibold hover:text-ochre-600">
                    Apply for Family Pilot
                  </button>
                </li>
                <li>
                  <button onClick={onOpenAccessModal} className="hover:text-forest-950 transition-colors text-left">
                    Clinic Partner Inquiries (Dhaka)
                  </button>
                </li>
                <li className="pt-2 text-[11px] text-forest-800/60">
                  Initial Corridor: Dhaka, London, New York, Dubai
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-forest-800/60 gap-4">
          <div>
            &copy; {new Date().getFullYear()} Thypro Health Inc. All rights reserved. Built with human care and dignity.
          </div>

          <button
            onClick={scrollToTop}
            className="inline-flex items-center gap-1.5 text-forest-900/80 hover:text-forest-950 transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
