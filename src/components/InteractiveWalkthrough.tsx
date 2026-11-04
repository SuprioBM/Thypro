import React, { useState } from 'react';
import {
  FileUp,
  Sparkles,
  Users2,
  CalendarCheck,
  Smartphone,
  CheckCircle2,
  Shield,
  ArrowRight,
  Clock,
  MapPin,
  Check,
  Link as LinkIcon
} from 'lucide-react';

interface InteractiveWalkthroughProps {
  lang: 'en' | 'bn';
}

export const InteractiveWalkthrough: React.FC<InteractiveWalkthroughProps> = ({ lang }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedField, setSelectedField] = useState<string>('glucose');
  const [previewPerspective, setPreviewPerspective] = useState<'tariq' | 'samira' | 'doctor'>('samira');

  const steps = [
    { id: 1, title: 'Upload Document', short: '1. Ingestion', icon: FileUp },
    { id: 2, title: 'Source-Linked Extraction', short: '2. Extraction', icon: Sparkles },
    { id: 3, title: 'Permission Scoping', short: '3. Permissions', icon: Users2 },
    { id: 4, title: 'Follow-up & Task', short: '4. Care Task', icon: CalendarCheck },
    { id: 5, title: 'Synchronized Views', short: '5. Multi-View', icon: Smartphone }
  ];

  return (
    <section id="walkthrough" className="thy-section bg-ivory-50 border-b border-forest-900/10">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>08 — {lang === 'en' ? 'Interactive Demonstration' : 'সরাসরি প্রোডাক্ট ডেমো'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {lang === 'en' ? (
              <>
                A closer look <br className="hidden sm:inline" />
                <span className="italic text-forest-800">at connected care in action.</span>
              </>
            ) : (
              <>
                এক নজরে দেখুন <br className="hidden sm:inline" />
                <span className="italic text-forest-800">থাইপ্রোর সমন্বিত চিকিৎসা প্রবাহ।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'Walk through a realistic five-step journey: from uploading a paper diagnostic slip in Dhaka, to verifying extracted laboratory values, assigning family permissions, and coordinating longitudinal care across borders.'
              : 'একটি বাস্তবসম্মত ৫-ধাপের প্রক্রিয়া দেখুন: ঢাকা থেকে ল্যাব রিপোর্ট আপলোড করা, তথ্যের নির্ভুলতা যাচাই, প্রবাসের স্বজনদের অনুমতি নির্ধারণ এবং চিকিৎসকের সাথে সংযোগ।'}
          </p>
        </div>

        {/* Step Navigation Bar */}
        <div className="flex items-center justify-between overflow-x-auto pb-4 mb-8 border-b border-forest-900/10 gap-2 sm:gap-4 no-scrollbar">
          {steps.map((s) => {
            const Icon = s.icon;
            const isActive = currentStep === s.id;
            const isCompleted = currentStep > s.id;

            return (
              <button
                key={s.id}
                onClick={() => setCurrentStep(s.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                    : isCompleted
                    ? 'bg-sage-100 text-forest-900'
                    : 'bg-ivory-200/60 text-forest-800/70 hover:bg-ivory-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{s.title}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-sage-700 ml-1" />}
              </button>
            );
          })}
        </div>

        {/* Interactive Workspace Container */}
        <div className="bg-white rounded-xl border border-forest-900/15 shadow-editorial p-6 sm:p-10 min-h-[520px]">
          {/* STEP 1: UPLOAD */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in-up">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">
                  Step 01 / Document Ingestion
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                  A photo or scan is added in Dhaka
                </h3>
                <p className="text-xs sm:text-sm text-forest-900/80 leading-relaxed font-normal">
                  Tariq visits Popular Diagnostic Centre in Dhanmondi. Rather than losing the printed report in a file folder, he or his visiting caregiver snaps a photo via the Thypro app or uploads a PDF.
                </p>

                <div className="p-4 rounded-lg bg-ivory-100 border border-forest-900/10 space-y-2 text-xs text-forest-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-forest-950">File Detected:</span>
                    <span className="font-mono text-[11px]">Popular_Lab_Report_9182.pdf</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-forest-950">Provider:</span>
                    <span>Popular Diagnostic Centre, Dhaka</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-forest-950">Origin Integrity:</span>
                    <span className="text-sage-700 font-medium">TRU07 Fingerprint Logged</span>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all self-start mt-2"
                >
                  <span>Extract & Verify Data</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Step 1 Visual Representation */}
              <div className="lg:col-span-7 bg-ivory-100 rounded-lg p-6 border border-dashed border-forest-900/20 flex flex-col items-center justify-center min-h-[340px]">
                <div className="w-16 h-16 rounded-full bg-forest-900/5 flex items-center justify-center text-forest-800 mb-4">
                  <FileUp className="w-8 h-8 text-forest-900" />
                </div>
                <div className="text-base font-editorial text-forest-950 mb-1">
                  Popular Diagnostic Centre — Biochemistry Report
                </div>
                <div className="text-xs text-forest-800/70 mb-4 font-mono">
                  Specimen ID: #PD9182 • Date: 14 Oct 2026 • Patient: Tariq Ahmed (M/68)
                </div>
                <div className="w-full max-w-sm bg-white p-4 rounded shadow-soft-sm border border-forest-900/10 text-[11px] font-mono space-y-2 text-forest-900/80">
                  <div className="flex justify-between border-b pb-1">
                    <span>TEST PARAMETER</span>
                    <span>RESULT</span>
                  </div>
                  <div className="flex justify-between text-ochre-600 font-semibold">
                    <span>Fasting Blood Sugar (FBS)</span>
                    <span>132 mg/dL</span>
                  </div>
                  <div className="flex justify-between text-ochre-600 font-semibold">
                    <span>HbA1c (Glycated Hb)</span>
                    <span>7.2 %</span>
                  </div>
                  <div className="flex justify-between text-forest-800">
                    <span>Serum Creatinine</span>
                    <span>1.1 mg/dL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXTRACTION WITH HIGHLIGHTED SOURCE PROVENANCE */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">
                  Step 02 / Governed Extraction
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                  Source-linked data with zero guesswork
                </h3>
                <p className="text-xs sm:text-sm text-forest-900/80 leading-relaxed font-normal">
                  Thypro's OCR and administrative assistant parses the values, but <strong className="text-forest-950">never invents numbers</strong>. Click any extracted item on the right to inspect its exact citation on the physical lab slip.
                </p>

                {/* Extracted field cards */}
                <div className="space-y-2.5">
                  <div
                    onClick={() => setSelectedField('glucose')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedField === 'glucose'
                        ? 'bg-ochre-50/80 border-ochre-400 shadow-soft-sm'
                        : 'bg-ivory-100 border-forest-900/10 hover:bg-ivory-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-forest-950">Fasting Blood Glucose</span>
                      <span className="font-mono text-ochre-600 font-bold">132 mg/dL</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-forest-800/70">
                      <LinkIcon className="w-3 h-3 text-ochre-600" />
                      <span>Linked to Slip #9182, Section 1, Row 1</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedField('hba1c')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedField === 'hba1c'
                        ? 'bg-ochre-50/80 border-ochre-400 shadow-soft-sm'
                        : 'bg-ivory-100 border-forest-900/10 hover:bg-ivory-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-forest-950">Glycated Hemoglobin (HbA1c)</span>
                      <span className="font-mono text-ochre-600 font-bold">7.2 %</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-forest-800/70">
                      <LinkIcon className="w-3 h-3 text-ochre-600" />
                      <span>Linked to Slip #9182, Section 1, Row 3</span>
                    </div>
                  </div>

                  <div
                    onClick={() => setSelectedField('creatinine')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedField === 'creatinine'
                        ? 'bg-ochre-50/80 border-ochre-400 shadow-soft-sm'
                        : 'bg-ivory-100 border-forest-900/10 hover:bg-ivory-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-forest-950">Serum Creatinine</span>
                      <span className="font-mono text-forest-900 font-bold">1.1 mg/dL</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-forest-800/70">
                      <LinkIcon className="w-3 h-3 text-sage-600" />
                      <span>Normal range (0.7 - 1.3 mg/dL)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all"
                  >
                    <span>Configure Permissions</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="text-xs text-forest-800/70 hover:text-forest-950"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Document Visualizer with Interactive Bounding Box Highlight */}
              <div className="lg:col-span-7 bg-ivory-200/90 rounded-lg p-5 border border-forest-900/15">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-forest-900/10 text-xs">
                  <span className="font-mono text-forest-900 font-semibold">
                    DOCUMENT INSPECTOR (PAGE 1/1)
                  </span>
                  <span className="text-[11px] text-ochre-600 font-medium">
                    Click an item on left to jump highlight
                  </span>
                </div>

                <div className="bg-white rounded p-6 shadow-soft relative font-mono text-xs text-forest-900/90 space-y-4 select-none">
                  <div className="text-center border-b pb-3">
                    <div className="font-bold tracking-wider text-forest-950">POPULAR DIAGNOSTIC CENTRE LTD.</div>
                    <div className="text-[10px] text-forest-800/60">House 16, Road 2, Dhanmondi R/A, Dhaka-1205</div>
                  </div>

                  <div className="grid grid-cols-2 text-[11px] text-forest-800/70 border-b pb-2">
                    <div>Patient: Tariq Ahmed (68Y / Male)</div>
                    <div className="text-right">Date: 14-OCT-2026 08:30 AM</div>
                  </div>

                  {/* Highlightable Rows */}
                  <div className="space-y-2 pt-1">
                    <div
                      className={`p-2 rounded transition-all flex justify-between ${
                        selectedField === 'glucose'
                          ? 'bg-ochre-100/90 border border-ochre-400 font-semibold text-forest-950'
                          : 'hover:bg-ivory-100'
                      }`}
                    >
                      <span>FASTING BLOOD SUGAR (GLUCOSE)</span>
                      <span className="text-ochre-700">132 mg/dL [H]</span>
                    </div>

                    <div
                      className={`p-2 rounded transition-all flex justify-between ${
                        selectedField === 'hba1c'
                          ? 'bg-ochre-100/90 border border-ochre-400 font-semibold text-forest-950'
                          : 'hover:bg-ivory-100'
                      }`}
                    >
                      <span>GLYCATED HEMOGLOBIN (HbA1c)</span>
                      <span className="text-ochre-700">7.2 % [H]</span>
                    </div>

                    <div
                      className={`p-2 rounded transition-all flex justify-between ${
                        selectedField === 'creatinine'
                          ? 'bg-sage-100/90 border border-sage-400 font-semibold text-forest-950'
                          : 'hover:bg-ivory-100'
                      }`}
                    >
                      <span>SERUM CREATININE</span>
                      <span>1.1 mg/dL</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t text-[10px] text-forest-800/50 flex justify-between items-center">
                    <span>Verified by: Senior Biochemist, Popular Dhaka</span>
                    <span className="font-mono">PROVENANCE: TRU07-HASH-CONFIRMED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PERMISSION SCOPING */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">
                  Step 03 / Permission Scoping
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                  The patient decides who sees what
                </h3>
                <p className="text-xs sm:text-sm text-forest-900/80 leading-relaxed font-normal">
                  Tariq configures the circle of care. Access is not all-or-nothing. Different roles grant different visibility, ensuring family members can assist with logistics without violating medical privacy.
                </p>

                <div className="p-4 rounded-lg bg-ivory-100 border border-forest-900/10 text-xs text-forest-900/80 space-y-1">
                  <div className="font-semibold text-forest-950 mb-1 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-sage-600" />
                    <span>FAM01 Granular Boundary:</span>
                  </div>
                  <div>• Samira (London): Care Coordinator (Full adherence & appointment access)</div>
                  <div>• Farhan (Dubai): Payer Only (Can pay bills; doctor's notes hidden)</div>
                  <div>• Dr. Rahman (Dhaka): 30-Day Clinical Encounter Access</div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all"
                  >
                    <span>Schedule Follow-up</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="text-xs text-forest-800/70 hover:text-forest-950"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Permission Matrix Visualizer */}
              <div className="lg:col-span-7 bg-ivory-100 rounded-lg p-6 border border-forest-900/15 space-y-4">
                <div className="text-xs font-mono uppercase text-forest-800/70 font-semibold">
                  ACTIVE DELEGATION CONTRACTS FOR TARIQ AHMED
                </div>

                {/* Member 1: Samira */}
                <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-forest-950">Samira Ahmed</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sage-100 text-sage-800">
                        Coordinator (London)
                      </span>
                    </div>
                    <div className="text-xs text-forest-800/70 mt-1">
                      Permissions: Vitals, Medication Check-in, Appointments, Payment
                    </div>
                  </div>
                  <span className="text-xs text-sage-700 font-semibold bg-sage-50 px-2.5 py-1 rounded border border-sage-200">
                    Active
                  </span>
                </div>

                {/* Member 2: Farhan (Dubai) */}
                <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-forest-950">Farhan Ahmed</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ochre-100 text-ochre-800">
                        Payer Role (Dubai)
                      </span>
                    </div>
                    <div className="text-xs text-forest-800/70 mt-1">
                      Permissions: Settle Invoices & Lab Fees Only · <span className="text-forest-950 font-medium">Clinical notes blocked</span>
                    </div>
                  </div>
                  <span className="text-xs text-sage-700 font-semibold bg-sage-50 px-2.5 py-1 rounded border border-sage-200">
                    Active
                  </span>
                </div>

                {/* Member 3: Dr. Rahman */}
                <div className="p-4 rounded-lg bg-white border border-forest-900/10 shadow-soft-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-forest-950">Dr. Reza Rahman</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-forest-900/10 text-forest-900">
                        Attending Cardiologist
                      </span>
                    </div>
                    <div className="text-xs text-forest-800/70 mt-1">
                      Permissions: Signed encounter notes, historical diagnostics (Expires in 28 days)
                    </div>
                  </div>
                  <span className="text-xs text-sage-700 font-semibold bg-sage-50 px-2.5 py-1 rounded border border-sage-200">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: FOLLOW-UP & CARE COORDINATION */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in-up">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <span className="text-xs font-mono uppercase text-ochre-600 font-semibold">
                  Step 04 / Care Task Coordination
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                  Turn records into concrete follow-up tasks
                </h3>
                <p className="text-xs sm:text-sm text-forest-900/80 leading-relaxed font-normal">
                  Diagnoses require follow-through. Thypro connects the clinical encounter to real-world tasks: booking a companion for the next hospital visit in Dhaka, ordering prescription refills, and scheduling in-home sample collection.
                </p>

                <div className="p-4 rounded-lg bg-ivory-100 border border-forest-900/10 space-y-2 text-xs text-forest-800/80">
                  <div className="font-medium text-forest-950">Dhaka In-Person Support (FAM04 / FAM05):</div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                    <span>Clinic companion booked to assist Tariq with hospital paperwork</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sage-600" />
                    <span>Blood sample pickup scheduled at home for fasting repeat</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded bg-forest-900 text-ivory-50 text-xs font-semibold uppercase tracking-wider hover:bg-forest-800 transition-all"
                  >
                    <span>Inspect Synchronized Views</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="text-xs text-forest-800/70 hover:text-forest-950"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Task Dispatch Visualizer */}
              <div className="lg:col-span-7 bg-ivory-100 rounded-lg p-6 border border-forest-900/15 space-y-3.5">
                <div className="text-xs font-mono uppercase text-forest-800/70 font-semibold mb-2">
                  DISPATCHED WORKFLOW TASKS
                </div>

                <div className="p-4 rounded bg-white border border-forest-900/10 shadow-soft-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-ochre-600 font-semibold uppercase">
                      Task #TK-409 · Clinic Companion
                    </span>
                    <span className="text-[11px] bg-ochre-100 text-ochre-800 px-2 py-0.5 rounded font-mono">
                      Confirmed
                    </span>
                  </div>
                  <div className="text-sm font-editorial text-forest-950 font-medium mb-1">
                    Hospital visit accompaniment: Square Hospital Cardiology
                  </div>
                  <div className="flex items-center gap-4 text-xs text-forest-800/75">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sage-600" /> 18 Nov 2026, 10:30 AM
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sage-600" /> Panthapath, Dhaka
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded bg-white border border-forest-900/10 shadow-soft-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono text-sage-700 font-semibold uppercase">
                      Task #TK-410 · Payment Settled
                    </span>
                    <span className="text-[11px] bg-sage-100 text-sage-800 px-2 py-0.5 rounded font-mono">
                      Paid via GBP
                    </span>
                  </div>
                  <div className="text-sm font-editorial text-forest-950 font-medium mb-1">
                    Consultation fee & diagnostic follow-up invoice settled
                  </div>
                  <div className="text-xs text-forest-800/75">
                    Direct cross-border settlement: £42.00 converted to ৳6,450 BDT paid to clinic account.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: SYNCHRONIZED VIEWS */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-6 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-forest-900/10">
                <div>
                  <span className="text-xs font-mono uppercase text-ochre-600 font-semibold block mb-1">
                    Step 05 / Real-time Perspective Preview
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-forest-950 font-normal">
                    One single truth, tailored for each role
                  </h3>
                </div>

                {/* Perspective Toggles */}
                <div className="inline-flex rounded-lg bg-ivory-200/90 p-1 border border-forest-900/10 self-start sm:self-auto">
                  <button
                    onClick={() => setPreviewPerspective('tariq')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                      previewPerspective === 'tariq'
                        ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                        : 'text-forest-900/70 hover:text-forest-950'
                    }`}
                  >
                    Tariq's Phone (Dhaka)
                  </button>
                  <button
                    onClick={() => setPreviewPerspective('samira')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                      previewPerspective === 'samira'
                        ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                        : 'text-forest-900/70 hover:text-forest-950'
                    }`}
                  >
                    Samira's View (London)
                  </button>
                  <button
                    onClick={() => setPreviewPerspective('doctor')}
                    className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                      previewPerspective === 'doctor'
                        ? 'bg-forest-900 text-ivory-50 shadow-soft-sm'
                        : 'text-forest-900/70 hover:text-forest-950'
                    }`}
                  >
                    Dr. Rahman (Clinic)
                  </button>
                </div>
              </div>

              {/* Dynamic View Representation */}
              <div className="bg-ivory-100 rounded-xl p-6 sm:p-8 border border-forest-900/15 min-h-[320px] flex items-center justify-center">
                {previewPerspective === 'tariq' && (
                  <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-editorial border border-forest-900/10">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-forest-900/10 text-xs">
                      <span className="font-semibold text-forest-950">শুভ সকাল, তারিক সাহেব</span>
                      <span className="text-[11px] font-mono text-sage-700">বাংলা ইন্টারফেস</span>
                    </div>
                    <div className="bg-sage-50/80 p-4 rounded-lg border border-sage-200 mb-4 text-center">
                      <div className="text-xs text-forest-800/80 mb-1">আজকের সকালের ওষুধ</div>
                      <div className="font-editorial text-lg text-forest-950 font-medium">
                        অ্যাটোরভাস্ট্যাটিন ২০ মিগ্রা — সকালের নাস্তার পর
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-forest-900 text-ivory-50 text-xs font-semibold rounded-full">
                        <Check className="w-3 h-3" /> গ্রহণ করা হয়েছে
                      </div>
                    </div>
                    <div className="text-xs text-forest-800/70 text-center">
                      পরবর্তী ডাক্তারের অ্যাপয়েন্টমেন্ট: ১৮ নভেম্বর, ড. রেজা রহমান
                    </div>
                  </div>
                )}

                {previewPerspective === 'samira' && (
                  <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-editorial border border-forest-900/10">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-forest-900/10 text-xs">
                      <div>
                        <div className="font-semibold text-forest-950">Father's Care Overview · Dhaka</div>
                        <div className="text-[11px] text-forest-800/60">London Coordinator Sync (GMT+0)</div>
                      </div>
                      <span className="text-xs bg-sage-100 text-sage-800 px-2.5 py-1 rounded font-mono">
                        Synced 12m ago
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                      <div className="p-3 rounded bg-ivory-100 border border-forest-900/8">
                        <div className="text-forest-800/60 text-[10px] uppercase font-semibold">Today's Check-in</div>
                        <div className="font-medium text-forest-950 mt-1">Confirmed (Voice Bangla)</div>
                      </div>
                      <div className="p-3 rounded bg-ivory-100 border border-forest-900/8">
                        <div className="text-forest-800/60 text-[10px] uppercase font-semibold">Latest BP</div>
                        <div className="font-medium text-forest-950 mt-1">128 / 82 mmHg (Normal)</div>
                      </div>
                    </div>
                    <div className="p-3.5 rounded bg-sage-50/70 border border-sage-200 text-xs text-forest-900">
                      <strong>Companion Dispatched:</strong> Field companion Tariqul booked for Nov 18 cardiology visit. Real-time updates will appear here.
                    </div>
                  </div>
                )}

                {previewPerspective === 'doctor' && (
                  <div className="w-full max-w-xl bg-white rounded-xl p-6 shadow-editorial border border-forest-900/10 font-mono text-xs">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-forest-900/10">
                      <div>
                        <span className="font-bold text-forest-950 text-sm">THYPRO CLINIC WORKSPACE</span>
                        <div className="text-[10px] text-forest-800/60">Patient: Tariq Ahmed (PID: #BD-90412)</div>
                      </div>
                      <span className="bg-forest-900 text-ivory-50 px-2 py-0.5 rounded text-[10px]">
                        BMDC-Verified Session
                      </span>
                    </div>
                    <div className="space-y-2 text-forest-900/90 text-[11px]">
                      <div className="flex justify-between border-b pb-1">
                        <span>14-OCT-2026 HbA1c: 7.2%</span>
                        <span className="text-sage-700">Down from 7.8% (3 mos ago)</span>
                      </div>
                      <div className="flex justify-between border-b pb-1">
                        <span>Active Regimen: Atorvastatin 20mg</span>
                        <span className="text-sage-700">Adherence 94% (Last 30d)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Allergies: Penicillin (Severe)</span>
                        <span className="text-red-700 font-bold">Documented REC03</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Reset / restart walkthrough */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="text-xs text-forest-800/70 hover:text-forest-950 underline"
                >
                  Restart demonstration from Step 1
                </button>
                <div className="text-xs text-forest-800/60 italic">
                  Live conceptual representation using Thypro's production component system
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
