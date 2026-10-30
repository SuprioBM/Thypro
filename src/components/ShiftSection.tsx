import React, { useState } from 'react';
import { ArrowRight, Check, Link2, Sparkles, FileCheck, Users, Calendar, ShieldCheck } from 'lucide-react';

interface ShiftSectionProps {
  lang: 'en' | 'bn';
}

export const ShiftSection: React.FC<ShiftSectionProps> = ({ lang }) => {
  const [shiftStage, setShiftStage] = useState<'fragmented' | 'organizing' | 'connected'>('connected');

  return (
    <section id="approach" className="py-24 sm:py-32 bg-ivory-100 border-b border-forest-900/10 relative overflow-hidden">
      {/* Background soft ambient grid */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>02 — {lang === 'en' ? 'The Turning Point' : 'সংযোগ ও সমাধান'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {lang === 'en' ? (
              <>
                Care feels clearer <br className="hidden sm:inline" />
                <span className="italic text-forest-800">when the pieces connect.</span>
              </>
            ) : (
              <>
                চিকিৎসা অনেক সহজ ও নিশ্চিত হয়ে ওঠে, <br className="hidden sm:inline" />
                <span className="italic text-forest-800">যখন খণ্ড খণ্ড তথ্যগুলো এক সুতোয় গাঁথা হয়।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'Instead of keeping medical papers locked in cupboards or scattered across chats, Thypro transforms disparate records into one verified, chronological story—so the patient, their loved ones, and their doctors share the same truth.'
              : 'আলমারির ড্রয়ারে আটকে থাকা কিংবা ফোনের ছবিতে হারানো ব্যবস্থাপত্রগুলোকে থাইপ্রো সাজিয়ে তোলে একটি সময়ানুক্রমিক ডিজিটাল স্বাস্থ্যচিত্রে—যেখানে রোগী, স্বজন ও চিকিৎসক সবাই দেখতে পান নির্ভুল তথ্য।'}
          </p>
        </div>

        {/* State Interactive Switcher: Visual Progression */}
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4 p-2 rounded-lg bg-ivory-200/80 border border-forest-900/10 max-w-2xl">
          <button
            onClick={() => setShiftStage('fragmented')}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
              shiftStage === 'fragmented'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'text-forest-900/70 hover:text-forest-950'
            }`}
          >
            1. {lang === 'en' ? 'Fragmented Slips' : 'ছড়িয়ে থাকা প্রেসক্রিপশন'}
          </button>
          <div className="w-4 h-[1px] bg-forest-900/20 hidden sm:block" />
          <button
            onClick={() => setShiftStage('organizing')}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
              shiftStage === 'organizing'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'text-forest-900/70 hover:text-forest-950'
            }`}
          >
            2. {lang === 'en' ? 'Source-Linked Extraction' : 'উৎস যাচাই ও সংকলন'}
          </button>
          <div className="w-4 h-[1px] bg-forest-900/20 hidden sm:block" />
          <button
            onClick={() => setShiftStage('connected')}
            className={`px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
              shiftStage === 'connected'
                ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                : 'text-forest-900/70 hover:text-forest-950'
            }`}
          >
            3. {lang === 'en' ? 'Connected Care Story' : 'সুসংগঠিত স্বাস্থ্যধারা'}
          </button>
        </div>

        {/* Visual Transformation Stage */}
        <div className="relative rounded-xl border border-forest-900/15 bg-white p-6 sm:p-10 shadow-editorial min-h-[460px] flex flex-col justify-between transition-all duration-500">
          {/* Dynamic Stage Render */}
          {shiftStage === 'fragmented' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
              <div className="p-5 rounded border border-dashed border-forest-900/25 bg-ivory-100 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-ochre-600 uppercase font-semibold mb-2">Paper Slip #104</div>
                  <div className="text-sm font-editorial text-forest-950 mb-2 font-medium">Doctor's Handwritten Note</div>
                  <p className="text-xs text-forest-800/70 italic">
                    "Tab. Atorva 20mg 0-0-1 hs... Check LFT & Lipid in 4 wks..."
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-forest-900/10 text-[11px] text-red-700/80 font-medium">
                  Status: Stored in bedroom drawer
                </div>
              </div>

              <div className="p-5 rounded border border-dashed border-forest-900/25 bg-ivory-100 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-ochre-600 uppercase font-semibold mb-2">WhatsApp Photo</div>
                  <div className="text-sm font-editorial text-forest-950 mb-2 font-medium">Popular Diagnostic Lab Report</div>
                  <p className="text-xs text-forest-800/70">
                    Image: HbA1c 7.4%, Fasting Glucose 134 mg/dL.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-forest-900/10 text-[11px] text-red-700/80 font-medium">
                  Status: Low-res photo forwarded 2 months ago
                </div>
              </div>

              <div className="p-5 rounded border border-dashed border-forest-900/25 bg-ivory-100 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-mono text-ochre-600 uppercase font-semibold mb-2">Verbal Memory</div>
                  <div className="text-sm font-editorial text-forest-950 mb-2 font-medium">Clinic Follow-up Advice</div>
                  <p className="text-xs text-forest-800/70 italic">
                    "Doctor said to consult the cardiologist before next month."
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-forest-900/10 text-[11px] text-red-700/80 font-medium">
                  Status: No reminder set; appointment delayed
                </div>
              </div>
            </div>
          )}

          {shiftStage === 'organizing' && (
            <div className="animate-fade-in-up">
              <div className="bg-sage-50/70 p-4 rounded-lg border border-sage-200 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-sage-600" />
                  <span className="text-xs font-medium text-forest-900">
                    Governed OCR & Extraction in progress · Every extracted field retains a pointer to the original page
                  </span>
                </div>
                <span className="text-[11px] font-mono text-sage-700 bg-white px-2 py-0.5 rounded border border-sage-300">
                  REC02 & AST02 Standard
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded bg-ivory-100 border border-forest-900/15">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-forest-950">
                      Extracted Medication
                    </span>
                    <span className="text-[11px] bg-sage-200/60 text-forest-900 px-2 py-0.5 rounded font-mono">
                      High Confidence
                    </span>
                  </div>
                  <div className="text-base font-editorial text-forest-950 mb-1">
                    Atorvastatin Calcium 20 mg (Once daily, night)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-forest-800/75 mt-2">
                    <Link2 className="w-3.5 h-3.5 text-ochre-600" />
                    <span>Source: Prescription Dr. R. Rahman, 14 Oct 2026 (Line 2)</span>
                  </div>
                </div>

                <div className="p-5 rounded bg-ivory-100 border border-forest-900/15">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-forest-950">
                      Extracted Diagnostic Marker
                    </span>
                    <span className="text-[11px] bg-sage-200/60 text-forest-900 px-2 py-0.5 rounded font-mono">
                      Verified Source
                    </span>
                  </div>
                  <div className="text-base font-editorial text-forest-950 mb-1">
                    Glycated Hemoglobin (HbA1c): 7.4% (Ref: &lt; 5.7%)
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-forest-800/75 mt-2">
                    <Link2 className="w-3.5 h-3.5 text-ochre-600" />
                    <span>Source: Popular Diagnostic Lab Specimen #PD9182, Dhaka</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {shiftStage === 'connected' && (
            <div className="animate-fade-in-up">
              {/* Top status bar */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-forest-900/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-forest-900 text-ivory-50 flex items-center justify-center font-editorial font-medium">
                    T
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-forest-950">Tariq Ahmed (Age 68) — Dhaka Record</div>
                    <div className="text-xs text-forest-800/70">Coordinated by Samira Ahmed (London, UK)</div>
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-sage-700 bg-sage-50 px-3 py-1.5 rounded-full border border-sage-200">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Consented & Cryptographically Verified (TRU07)</span>
                </div>
              </div>

              {/* Connected Timeline Sequence */}
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-forest-900/20">
                {/* Event 1 */}
                <div className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-forest-900 border-2 border-white ring-2 ring-forest-900/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">14 Oct 2026 · Clinical Visit</span>
                    <span className="text-[11px] text-forest-800/60 font-sans">Encounter with Dr. R. Rahman (Cardiologist)</span>
                  </div>
                  <div className="text-sm font-editorial text-forest-950 mt-1 font-medium">
                    Medication reviewed & adjusted. Atorvastatin 20mg confirmed.
                  </div>
                  <div className="flex items-center gap-4 text-xs text-forest-800/75 mt-2">
                    <span className="inline-flex items-center gap-1 text-sage-700 font-medium">
                      <Check className="w-3 h-3" /> Signed Clinical Encounter
                    </span>
                    <span className="text-forest-800/40">•</span>
                    <span>Shared with London Coordinator</span>
                  </div>
                </div>

                {/* Event 2 */}
                <div className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-ochre-500 border-2 border-white ring-2 ring-ochre-500/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">Daily Adherence & Check-in</span>
                    <span className="text-[11px] text-forest-800/60 font-sans">Automated Voice Check-in (Bangla)</span>
                  </div>
                  <div className="text-sm font-editorial text-forest-950 mt-1 font-medium">
                    Morning dose confirmed taken. Vitals: BP 128/82 mmHg recorded via caregiver.
                  </div>
                  <div className="text-xs text-forest-800/75 mt-1">
                    Samira notified in London via caregiver dashboard.
                  </div>
                </div>

                {/* Event 3 */}
                <div className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-sage-600 border-2 border-white ring-2 ring-sage-600/20" />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-mono uppercase text-sage-600 font-semibold">Upcoming 12 Nov 2026</span>
                    <span className="text-[11px] text-forest-800/60 font-sans">Scheduled Follow-up & Lab Sample</span>
                  </div>
                  <div className="text-sm font-editorial text-forest-950 mt-1 font-medium">
                    Fasting Lipid Profile check + Dhaka clinic companion booked.
                  </div>
                  <div className="text-xs text-forest-800/75 mt-1">
                    Invoice paid directly by Samira (GBP) · Clinic received immediate settlement in BDT.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Clarification & Transparency note */}
          <div className="mt-8 pt-4 border-t border-forest-900/10 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-forest-800/70 gap-2">
            <span>
              <strong>Integrity Commitment:</strong> Thypro connects the records you and your clinics choose to share.
            </span>
            <span className="text-[11px] italic">
              We do not claim automatic integration with every hospital system.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
