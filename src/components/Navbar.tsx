import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowUpRight, ShieldCheck, Globe } from 'lucide-react';
import { Wordmark } from './ui/Logo';

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
  const [activeSection, setActiveSection] = useState<string>('');
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  const en = lang === 'en';
  const navLinks = [
    { label: en ? 'Problem' : 'সমস্যা', full: en ? 'The Problem' : 'সমস্যা', href: '#problem' },
    { label: en ? 'Approach' : 'উদ্যোগ', full: en ? 'Our Approach' : 'আমাদের উদ্যোগ', href: '#approach' },
    { label: en ? 'Trust' : 'নিরাপত্তা', full: en ? 'People & Permissions' : 'ব্যক্তি ও নিরাপত্তা', href: '#permissions' },
    { label: en ? 'Platform' : 'প্লাটফর্ম', full: en ? 'Platform' : 'প্লাটফর্ম', href: '#capabilities' },
    { label: en ? 'Family' : 'পরিবার', full: en ? 'Family Care' : 'ফ্যামিলি কেয়ার', href: '#family-care' },
    { label: en ? 'Blood' : 'রক্ত', full: en ? 'Blood Network' : 'রক্তদাতা নেটওয়ার্ক', href: '#blood-network' },
    { label: en ? 'Wellness' : 'সুস্থতা', full: en ? 'Wellness' : 'সুস্থতা', href: '#wellness' },
    { label: en ? 'Tour' : 'ডেমো', full: en ? 'Interactive Tour' : 'সরাসরি ডেমো', href: '#walkthrough' },
    { label: en ? 'Mission' : 'লক্ষ্য', full: en ? 'Mission & Milestones' : 'লক্ষ্য ও অগ্রগতি', href: '#impact' }
  ];

  /* Scroll state + reading-progress line (written straight to the DOM, no re-render per frame). */
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      setIsScrolled(y > 24);
      if (y < 160) setActiveSection('');
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  /* Highlight the section currently in view. */
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const sections = navLinks
      .map((l) => document.getElementById(l.href.slice(1)))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveSection(`#${visible.target.id}`);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: [0, 0.25, 0.5] }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Slide the highlight pill under the active link. */
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const measure = () => {
      const el = rail.querySelector<HTMLElement>(`[data-href="${activeSection}"]`);
      setPill(el ? { left: el.offsetLeft, width: el.offsetWidth } : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeSection, lang]);

  /* Drawer: Escape closes, background scroll locked. */
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileMenuOpen]);

  const handleNavClick = (href: string) => {
    setMobileMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 px-3 sm:px-5 pt-3 pointer-events-none">
        <div
          className={`pointer-events-auto relative mx-auto max-w-[88rem] rounded-2xl border transition-all duration-500 ease-editorial ${
            isScrolled
              ? 'bg-white/85 backdrop-blur-xl border-forest-900/10 shadow-lift'
              : 'bg-white/55 backdrop-blur-md border-white/60 shadow-soft-sm'
          }`}
        >
          <div className="flex items-center justify-between gap-3 pl-4 pr-2.5 sm:pl-5 py-2">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="shrink-0 transition-transform duration-300 ease-editorial hover:scale-[1.03]"
              aria-label="Thypro — back to top"
            >
              <Wordmark markClassName="h-8 sm:h-9" />
            </a>

            {/* Link rail with sliding active pill */}
            <nav className="hidden xl:block min-w-0 flex-1 max-w-fit" aria-label="Main navigation">
              <div ref={railRef} className="relative flex items-center gap-0.5 rounded-full bg-forest-900/[0.04] p-1">
                <span
                  aria-hidden="true"
                  className="absolute top-1 bottom-1 rounded-full bg-forest-800 shadow-soft-sm transition-all duration-500 ease-editorial"
                  style={{
                    left: pill?.left ?? 0,
                    width: pill?.width ?? 0,
                    opacity: pill ? 1 : 0
                  }}
                />
                {navLinks.map((link) => {
                  const isActive = activeSection === link.href;
                  return (
                    <button
                      key={link.href}
                      type="button"
                      data-href={link.href}
                      onClick={() => handleNavClick(link.href)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`relative z-10 whitespace-nowrap rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors duration-300 ${
                        isActive ? 'text-white' : 'text-forest-900/75 hover:text-forest-950'
                      }`}
                    >
                      <span className="3xl:hidden">{link.label}</span>
                      <span className="hidden 3xl:inline">{link.full}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={onToggleLang}
                className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-forest-800 hover:bg-forest-900/5 transition-colors"
                aria-label={en ? 'Switch language preview to Bangla' : 'ইংরেজিতে পরিবর্তন করুন'}
              >
                <Globe className="w-3.5 h-3.5 text-ochre-600" aria-hidden="true" />
                <span>{en ? 'বাংলা' : 'English'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenPrivacyModal}
                className="hidden 3xl:flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium text-forest-800 hover:bg-forest-900/5 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-forest-600" aria-hidden="true" />
                <span>{en ? 'Data principles' : 'তথ্যনীতি'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenAccessModal}
                className="group inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-ochre-400 to-ember-600 px-4 py-2.5 text-xs font-semibold text-white shadow-soft-sm transition-all duration-300 ease-editorial hover:shadow-lift hover:-translate-y-px active:translate-y-0"
              >
                <span>{en ? 'Pilot Access' : 'পাইলট এক্সেস'}</span>
                <ArrowUpRight
                  className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                />
              </button>

              <button
                ref={menuButtonRef}
                type="button"
                onClick={() => setMobileMenuOpen((o) => !o)}
                className="xl:hidden p-2 rounded-full text-forest-900 hover:bg-forest-900/5 transition-colors"
                aria-label={en ? 'Toggle navigation menu' : 'মেনু খুলুন বা বন্ধ করুন'}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {/* Reading progress */}
          <div className="absolute left-5 right-5 bottom-0 h-[2px] overflow-hidden rounded-full" aria-hidden="true">
            <div
              ref={progressRef}
              className="h-full origin-left bg-gradient-to-r from-forest-700 via-ochre-400 to-ember-500"
              style={{ transform: 'scaleX(0)' }}
            />
          </div>
        </div>
      </header>

      {/* Mobile / tablet drawer */}
      {mobileMenuOpen && (
        <div
          id="mobile-navigation"
          className="fixed inset-0 z-40 bg-ivory-100/98 backdrop-blur-lg pt-28 px-6 flex flex-col justify-between pb-8 xl:hidden animate-fade-in-up overflow-y-auto"
        >
          <nav className="flex flex-col gap-3" aria-label="Mobile navigation">
            {navLinks.map((link, i) => (
              <button
                key={link.href}
                type="button"
                onClick={() => handleNavClick(link.href)}
                style={{ animationDelay: `${i * 35}ms` }}
                className={`animate-fade-in-up opacity-0 text-left font-editorial text-2xl transition-colors py-1 ${
                  activeSection === link.href ? 'text-ochre-600' : 'text-forest-950 hover:text-ochre-600'
                }`}
              >
                {link.full}
              </button>
            ))}
          </nav>

          <div className="pt-6 mt-6 border-t border-forest-900/10 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 text-xs text-forest-800/80">
              <button
                type="button"
                onClick={onToggleLang}
                className="flex items-center gap-1.5 py-2 px-3 border border-forest-900/15 rounded-full"
              >
                <Globe className="w-3.5 h-3.5 text-ochre-600" aria-hidden="true" />
                <span>{en ? 'বাংলায় দেখুন' : 'View in English'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPrivacyModal();
                }}
                className="underline text-forest-800"
              >
                {en ? 'Data principles' : 'তথ্যনীতি'}
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAccessModal();
              }}
              className="w-full py-3.5 text-center text-sm font-semibold rounded-full bg-gradient-to-br from-ochre-400 to-ember-600 text-white shadow-soft"
            >
              {en ? 'Join the Family Care pilot' : 'ফ্যামিলি কেয়ার পাইলটে যোগ দিন'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
