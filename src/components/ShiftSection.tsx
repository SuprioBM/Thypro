import React, { useEffect, useRef, useState } from 'react';
import { Check, Link2, ScanLine, ShieldCheck, FileText, MessageCircle, Mic } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { Reveal } from './ui/Reveal';

interface ShiftSectionProps {
  lang: 'en' | 'bn';
}

type Stage = 0 | 1 | 2;
const STAGE_MS = 6500;

/** Staggered entrance helper: elements fade up one after another when a stage mounts. */
const stagger = (i: number): React.CSSProperties => ({ animationDelay: `${120 + i * 110}ms` });
const enter = 'opacity-0 animate-fade-in-up';

export const ShiftSection: React.FC<ShiftSectionProps> = ({ lang }) => {
  const en = lang === 'en';
  const [stage, setStage] = useState<Stage>(0);
  const [inView, setInView] = useState(false);
  const [userLocked, setUserLocked] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [reduced, setReduced] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduced(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const autoplay = inView && !userLocked && !reduced;
  const paused = !autoplay || hovering;

  const steps = [
    {
      n: '01',
      title: en ? 'Fragmented slips' : 'ছড়িয়ে থাকা প্রেসক্রিপশন',
      desc: en
        ? 'Prescriptions in a drawer, reports in a chat, advice in someone’s memory.'
        : 'ড্রয়ারে প্রেসক্রিপশন, চ্যাটে রিপোর্ট, আর পরামর্শ কারও স্মৃতিতে।'
    },
    {
      n: '02',
      title: en ? 'Source-linked extraction' : 'উৎস যাচাই ও সংকলন',
      desc: en
        ? 'Every value is read out and keeps a pointer to the page it came from.'
        : 'প্রতিটি তথ্য আলাদা করা হয় এবং মূল পাতার সাথে যুক্ত থাকে।'
    },
    {
      n: '03',
      title: en ? 'One connected story' : 'সুসংগঠিত স্বাস্থ্যধারা',
      desc: en
        ? 'A single chronological record the patient, family and doctor all read.'
        : 'একটি সময়ানুক্রমিক রেকর্ড, যা রোগী, পরিবার ও চিকিৎসক সবাই দেখতে পান।'
    }
  ];

  const select = (i: Stage) => {
    setStage(i);
    setUserLocked(true);
  };

  return (
    <section
      id="approach"
      className="thy-section relative overflow-hidden border-b border-forest-900/10 bg-ivory-100"
    >
      {/* Ambient colour washes */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 right-[-8rem] h-[34rem] w-[34rem] rounded-full bg-ochre-100/50 blur-3xl animate-float-slow" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-48 left-[-10rem] h-[34rem] w-[34rem] rounded-full bg-forest-800/[0.06] blur-3xl animate-float-slow [animation-delay:-6s]" />

      <div className="thy-container relative">
        <SectionHeading
          index="02"
          eyebrow={en ? 'The Turning Point' : 'সংযোগ ও সমাধান'}
          title={en ? 'Care feels clearer' : 'চিকিৎসা অনেক সহজ ও নিশ্চিত হয়ে ওঠে,'}
          titleAccent={en ? 'when the pieces connect.' : 'যখন খণ্ড খণ্ড তথ্যগুলো এক সুতোয় গাঁথা হয়।'}
          lede={
            en
              ? 'Instead of keeping medical papers locked in cupboards or scattered across chats, Thypro turns them into one verified, chronological story — so the patient, their loved ones and their doctors share the same truth.'
              : 'আলমারির ড্রয়ারে আটকে থাকা কিংবা ফোনের ছবিতে হারানো ব্যবস্থাপত্রগুলোকে থাইপ্রো সাজিয়ে তোলে একটি সময়ানুক্রমিক ডিজিটাল স্বাস্থ্যচিত্রে—যেখানে রোগী, স্বজন ও চিকিৎসক সবাই দেখতে পান নির্ভুল তথ্য।'
          }
          className="mb-12 sm:mb-16"
        />

        <Reveal>
          <div ref={rootRef} className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-8">
            {/* Step rail */}
            <div className="lg:col-span-4">
              <ol className="relative flex flex-col gap-3 lg:sticky lg:top-28" role="tablist" aria-label={en ? 'Stages' : 'ধাপসমূহ'}>
                {steps.map((s, i) => {
                  const active = stage === i;
                  const done = i < stage;
                  return (
                    <li key={s.n}>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => select(i as Stage)}
                        className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-500 ease-editorial ${
                          active
                            ? 'border-forest-800 bg-forest-800 text-ivory-50 shadow-lift lg:translate-x-2'
                            : 'border-forest-900/10 bg-white/70 text-forest-950 hover:border-forest-900/25 hover:bg-white hover:shadow-soft'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold transition-colors duration-500 ${
                              active
                                ? 'bg-ochre-500 text-white'
                                : done
                                  ? 'bg-forest-800 text-white'
                                  : 'bg-forest-900/8 text-forest-800'
                            }`}
                          >
                            {done ? <Check className="h-4 w-4" aria-hidden="true" /> : s.n}
                          </span>
                          <span className="min-w-0">
                            <span className="block font-editorial text-lg leading-snug">{s.title}</span>
                            <span
                              className={`mt-1 block text-[13px] leading-relaxed transition-colors duration-500 ${
                                active ? 'text-ivory-200/85' : 'text-forest-900/65'
                              }`}
                            >
                              {s.desc}
                            </span>
                          </span>
                        </div>

                        {/* Auto-advance progress */}
                        {active && (
                          <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[3px] bg-white/15">
                            <span
                              key={`${stage}-${userLocked}`}
                              className="block h-full origin-left bg-gradient-to-r from-ochre-400 to-ember-300"
                              style={{
                                transform: autoplay ? undefined : 'scaleX(1)',
                                animation: autoplay ? `stageProgress ${STAGE_MS}ms linear forwards` : undefined,
                                animationPlayState: paused ? 'paused' : 'running'
                              }}
                              onAnimationEnd={() => {
                                if (autoplay) setStage(((stage + 1) % 3) as Stage);
                              }}
                            />
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Stage */}
            <div
              className="lg:col-span-8"
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            >
              <div className="relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-3xl border border-forest-900/10 bg-white p-5 shadow-editorial sm:p-8">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-[0.035] [background-size:22px_22px] bg-[radial-gradient(#0A332C_1px,transparent_1px)]"
                />

                <div key={stage} className="relative" role="tabpanel">
                  {stage === 0 && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        {
                          icon: FileText,
                          tag: 'Paper slip #104',
                          title: en ? 'Doctor’s handwritten note' : 'ডাক্তারের হাতে লেখা নোট',
                          body: '“Tab. Atorva 20mg 0-0-1 hs… Check LFT & Lipid in 4 wks…”',
                          status: en ? 'Stored in a bedroom drawer' : 'শোবার ঘরের ড্রয়ারে রাখা',
                          rot: '-rotate-2'
                        },
                        {
                          icon: MessageCircle,
                          tag: 'WhatsApp photo',
                          title: en ? 'Diagnostic lab report' : 'ল্যাব রিপোর্ট',
                          body: 'HbA1c 7.4%, fasting glucose 134 mg/dL.',
                          status: en ? 'Low-res photo, forwarded 2 months ago' : '২ মাস আগে পাঠানো ঝাপসা ছবি',
                          rot: 'rotate-1 md:translate-y-5'
                        },
                        {
                          icon: Mic,
                          tag: 'Verbal memory',
                          title: en ? 'Clinic follow-up advice' : 'ফলো-আপ পরামর্শ',
                          body: '“Doctor said to consult the cardiologist before next month.”',
                          status: en ? 'No reminder set; visit delayed' : 'কোনো রিমাইন্ডার নেই; ভিজিট পিছিয়েছে',
                          rot: 'rotate-2'
                        }
                      ].map((c, i) => {
                        const Icon = c.icon;
                        return (
                          <div key={c.tag} className={`${enter} ${c.rot}`} style={stagger(i)}>
                            <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-forest-900/25 bg-ivory-50 p-5 transition-all duration-500 ease-editorial hover:-translate-y-1 hover:rotate-0 hover:shadow-soft">
                              <div>
                                <div className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase text-ochre-700">
                                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                                  {c.tag}
                                </div>
                                <div className="mb-2 font-editorial text-base font-medium text-forest-950">{c.title}</div>
                                <p className="text-xs italic leading-relaxed text-forest-800/70">{c.body}</p>
                              </div>
                              <div className="mt-4 border-t border-forest-900/10 pt-3 text-[11px] font-medium text-signal-crimson">
                                {c.status}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {stage === 1 && (
                    <div>
                      <div className={`${enter} relative mb-5 flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-xl border border-sage-200 bg-sage-50/80 p-4`} style={stagger(0)}>
                        <span className="flex items-center gap-2.5 text-xs font-medium text-forest-900">
                          <ScanLine className="h-4 w-4 text-forest-600" aria-hidden="true" />
                          {en ? 'Reading the document · every field keeps a pointer to its page' : 'নথি পড়া হচ্ছে · প্রতিটি তথ্য মূল পাতার সাথে যুক্ত'}
                        </span>
                        <span className="rounded border border-sage-300 bg-white px-2 py-0.5 font-mono text-[11px] text-sage-700">
                          REC02 &amp; AST02
                        </span>
                        <span aria-hidden="true" className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-ochre-300/40 to-transparent animate-scan" />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {[
                          {
                            label: en ? 'Extracted medication' : 'চিহ্নিত ওষুধ',
                            badge: en ? 'High confidence' : 'উচ্চ নিশ্চয়তা',
                            value: 'Atorvastatin Calcium 20 mg',
                            sub: en ? 'Once daily, night' : 'দিনে একবার, রাতে',
                            src: 'Prescription · Dr. R. Rahman · 14 Oct 2026 · line 2'
                          },
                          {
                            label: en ? 'Extracted marker' : 'চিহ্নিত পরীক্ষা',
                            badge: en ? 'Verified source' : 'যাচাইকৃত উৎস',
                            value: 'HbA1c 7.4%',
                            sub: en ? 'Reference: < 5.7%' : 'রেফারেন্স: < ৫.৭%',
                            src: 'Popular Diagnostic · specimen #PD9182, Dhaka'
                          }
                        ].map((f, i) => (
                          <div key={f.label} className={`${enter} rounded-2xl border border-forest-900/12 bg-ivory-50 p-5 transition-shadow duration-500 hover:shadow-soft`} style={stagger(i + 1)}>
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-forest-950">{f.label}</span>
                              <span className="rounded-full bg-sage-200/70 px-2 py-0.5 font-mono text-[10px] text-forest-900">{f.badge}</span>
                            </div>
                            <div className="font-editorial text-2xl leading-tight text-forest-950">{f.value}</div>
                            <div className="text-xs text-forest-800/70">{f.sub}</div>
                            <div className="mt-4 flex items-start gap-1.5 text-xs text-forest-800/75">
                              <Link2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ochre-600" aria-hidden="true" />
                              <span>{f.src}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {stage === 2 && (
                    <div>
                      <div className={`${enter} mb-6 flex items-center justify-between gap-3 border-b border-forest-900/10 pb-5`} style={stagger(0)}>
                        <div className="flex items-center gap-3">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-forest-700 to-forest-900 font-editorial text-lg text-white">T</span>
                          <div>
                            <div className="text-sm font-semibold text-forest-950">Tariq Ahmed (68) — Dhaka record</div>
                            <div className="text-xs text-forest-800/70">{en ? 'Coordinated by Samira Ahmed, London' : 'সমন্বয়কারী: সামিরা আহমেদ, লন্ডন'}</div>
                          </div>
                        </div>
                        <span className="hidden items-center gap-1.5 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-xs font-medium text-sage-700 sm:inline-flex">
                          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {en ? 'Consented & verified (TRU07)' : 'সম্মতি ও যাচাই (TRU07)'}
                        </span>
                      </div>

                      <div className="relative space-y-6 pl-7">
                        <span aria-hidden="true" className="absolute bottom-2 left-[9px] top-2 w-[2px] origin-top rounded bg-gradient-to-b from-forest-700 via-ochre-400 to-sage-500 animate-grow-y" />
                        {[
                          {
                            dot: 'bg-forest-800',
                            when: '14 Oct 2026 · ' + (en ? 'Clinical visit' : 'ক্লিনিক ভিজিট'),
                            who: 'Dr. R. Rahman (Cardiology)',
                            what: en ? 'Medication reviewed and adjusted. Atorvastatin 20 mg confirmed.' : 'ওষুধ পর্যালোচনা হয়েছে। অ্যাটরভাস্ট্যাটিন ২০ মি.গ্রা. নিশ্চিত।',
                            foot: en ? 'Signed encounter · shared with London coordinator' : 'স্বাক্ষরিত ভিজিট · লন্ডনের সমন্বয়কারীর সাথে ভাগ করা'
                          },
                          {
                            dot: 'bg-ochre-500',
                            when: en ? 'Daily check-in' : 'দৈনিক চেক-ইন',
                            who: en ? 'Automated voice call (Bangla)' : 'স্বয়ংক্রিয় ভয়েস কল (বাংলা)',
                            what: en ? 'Morning dose confirmed. BP 128/82 recorded via caregiver.' : 'সকালের ডোজ নিশ্চিত। সহায়ক রক্তচাপ ১২৮/৮২ নথিভুক্ত করেছেন।',
                            foot: en ? 'Samira notified in London' : 'লন্ডনে সামিরাকে জানানো হয়েছে'
                          },
                          {
                            dot: 'bg-sage-500',
                            when: en ? 'Upcoming · 12 Nov 2026' : 'আসন্ন · ১২ নভেম্বর ২০২৬',
                            who: en ? 'Follow-up & lab sample' : 'ফলো-আপ ও ল্যাব নমুনা',
                            what: en ? 'Fasting lipid profile, with a clinic companion booked in Dhaka.' : 'ফাস্টিং লিপিড প্রোফাইল, ঢাকায় ক্লিনিক সঙ্গী বুক করা আছে।',
                            foot: en ? 'Invoice paid by Samira (GBP) · clinic settled in BDT' : 'সামিরা পাউন্ডে পরিশোধ করেছেন · ক্লিনিক টাকায় পেয়েছে'
                          }
                        ].map((e, i) => (
                          <div key={e.when} className={`${enter} relative`} style={stagger(i + 1)}>
                            <span className={`absolute -left-[26px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ring-2 ring-forest-900/10 ${e.dot}`} />
                            <div className="flex flex-col justify-between gap-0.5 sm:flex-row sm:items-center">
                              <span className="font-mono text-xs font-semibold uppercase text-ochre-700">{e.when}</span>
                              <span className="text-[11px] text-forest-800/60">{e.who}</span>
                            </div>
                            <div className="mt-1 font-editorial text-[15px] font-medium text-forest-950">{e.what}</div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-forest-800/70">
                              <Check className="h-3 w-3 text-sage-700" aria-hidden="true" />
                              {e.foot}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative mt-8 flex flex-col justify-between gap-2 border-t border-forest-900/10 pt-4 text-xs text-forest-800/70 sm:flex-row sm:items-center">
                  <span>
                    <strong className="text-forest-950">{en ? 'Integrity commitment:' : 'অঙ্গীকার:'}</strong>{' '}
                    {en ? 'Thypro connects the records you and your clinics choose to share.' : 'আপনি ও আপনার ক্লিনিক যে রেকর্ড ভাগ করতে চান, থাইপ্রো কেবল তা-ই যুক্ত করে।'}
                  </span>
                  <span className="text-[11px] italic">
                    {en ? 'No automatic integration with every hospital system is claimed.' : 'সব হাসপাতালের সিস্টেমের সাথে স্বয়ংক্রিয় সংযোগের দাবি করা হয় না।'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};
