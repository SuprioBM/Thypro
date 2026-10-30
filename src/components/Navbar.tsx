import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, ShieldCheck, Globe } from 'lucide-react';

interface NavbarProps {
  onOpenAccessModal: () => void;
  onOpenPrivacyModal: () => void;
  lang: 'en' | 'bn';
  onToggleLang: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAccessModal,
  onOpenPrivacyModal,
  lang,
  onToggleLang
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: lang === 'en' ? 'The Problem' : 'সমস্যা', href: '#problem' },
    { label: lang === 'en' ? 'Our Approach' : 'আমাদের উদ্যোগ', href: '#approach' },
    { label: lang === 'en' ? 'People & Permissions' : 'ব্যক্তি ও নিরাপত্তা', href: '#permissions' },
    { label: lang === 'en' ? 'Platform' : 'প্লাটফর্ম', href: '#capabilities' },
    { label: lang === 'en' ? 'Interactive Tour' : 'সরাসরি ডেমো', href: '#walkthrough' },
    { label: lang === 'en' ? 'Lifelong Vision' : 'দীর্ঘমেয়াদী লক্ষ্য', href: '#vision' },
  ];

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-ivory-100/92 backdrop-blur-md border-b border-forest-900/10 py-3 shadow-soft-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          {/* Logo & Brand Wordmark */}
          <a
            href="#"
            className="group flex items-baseline gap-2.5 focus:outline-none"
            aria-label="Thypro Homepage"
          >
            <span className="font-editorial text-2xl sm:text-[1.75rem] font-medium tracking-tight text-forest-950 transition-colors group-hover:text-forest-700">
              Thypro
            </span>
            <span className="hidden sm:inline-block text-[11px] font-sans uppercase tracking-widest text-forest-800/60 font-semibold pl-1 border-l border-forest-900/20">
              Connected Care
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-xs uppercase tracking-wider font-medium text-forest-900/80 hover:text-forest-950 transition-colors py-1 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-forest-800 hover:after:w-full after:transition-all after:duration-300"
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Language Toggle */}
            <button
              onClick={onToggleLang}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-forest-800/75 hover:text-forest-950 rounded border border-forest-900/10 hover:border-forest-900/25 transition-all"
              title="Toggle language preview (English / বাংলা)"
            >
              <Globe className="w-3.5 h-3.5 text-sage-600" />
              <span>{lang === 'en' ? 'বাংলা' : 'English'}</span>
            </button>

            {/* Privacy & Governance quick pill */}
            <button
              onClick={onOpenPrivacyModal}
              className="flex items-center gap-1 text-xs text-forest-800/70 hover:text-forest-950 font-medium px-2 py-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sage-600" />
              <span>Data Principles</span>
            </button>

            {/* Primary CTA */}
            <button
              onClick={onOpenAccessModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded bg-forest-900 text-ivory-50 hover:bg-forest-800 transition-all shadow-soft-sm active:translate-y-0.5"
            >
              <span>{lang === 'en' ? 'Pilot Access' : 'পাইলট এক্সেস'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              onClick={onOpenAccessModal}
              className="px-3 py-1.5 text-xs font-semibold rounded bg-forest-900 text-ivory-50"
            >
              Access
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-forest-900 rounded focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-ivory-100/98 backdrop-blur-lg pt-24 px-6 flex flex-col justify-between pb-8 lg:hidden animate-fade-in-up">
          <nav className="flex flex-col gap-5">
            {navLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-left font-editorial text-2xl text-forest-950 hover:text-ochre-600 transition-colors py-1"
              >
                {link.label}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-forest-900/10 flex flex-col gap-4">
            <div className="flex items-center justify-between text-xs text-forest-800/80">
              <button
                onClick={onToggleLang}
                className="flex items-center gap-1.5 py-1 px-3 border border-forest-900/15 rounded"
              >
                <Globe className="w-3.5 h-3.5 text-sage-600" />
                <span>Switch to {lang === 'en' ? 'বাংলা' : 'English'}</span>
              </button>
              <button onClick={onOpenPrivacyModal} className="underline text-forest-800">
                Data Sovereignty
              </button>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAccessModal();
              }}
              className="w-full py-3.5 text-center text-sm uppercase tracking-wider font-semibold rounded bg-forest-900 text-ivory-50 shadow-soft"
            >
              Join the Family Care Pilot
            </button>
          </div>
        </div>
      )}
    </>
  );
};
