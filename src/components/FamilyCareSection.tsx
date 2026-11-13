import React from 'react';
import {
  FileUp,
  UserCheck,
  BellRing,
  Mic,
  CalendarCheck,
  Truck,
  Stethoscope,
  MailCheck,
  ShieldCheck,
  Check,
  Clock,
  Pill
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SectionHeading } from './ui/SectionHeading';
import { RotateProgress, useAutoRotate } from './ui/autoRotate';

interface FamilyCareSectionProps {
  lang: 'en' | 'bn';
}

type FlowStage = 'upload' | 'review' | 'remind';

/**
 * Section 05 — Thypro Family Care.
 * Shows how a paper prescription becomes a reviewed medication schedule and a
 * daily reminder, then the coordination services that sit around it.
 */
const STAGES: { id: FlowStage; label: string; labelBn: string; icon: typeof FileUp }[] = [
  { id: 'upload', label: 'Upload prescription', labelBn: 'ব্যবস্থাপত্র আপলোড', icon: FileUp },
  { id: 'review', label: 'Human review', labelBn: 'মানুষের যাচাই', icon: UserCheck },
  { id: 'remind', label: 'Daily reminder', labelBn: 'দৈনিক রিমাইন্ডার', icon: BellRing }
];

export const FamilyCareSection: React.FC<FamilyCareSectionProps> = ({ lang }) => {
  const rot = useAutoRotate(STAGES.length, 0, 2000);
  const stage = STAGES[rot.index].id;

  const services = [
    {
      icon: MailCheck,
      title: 'Weekly family health update',
      titleBn: 'সাপ্তাহিক পারিবারিক স্বাস্থ্য আপডেট',
      body:
        'A short, plain-language summary of the week — doses taken, appointments attended, anything a clinician flagged — sent to the family members your parent has approved.',
      bodyBn:
        'সপ্তাহজুড়ে ওষুধ গ্রহণ, ডাক্তারের সাক্ষাৎ ও গুরুত্বপূর্ণ পর্যবেক্ষণের সহজ ভাষায় সারসংক্ষেপ, যা শুধু অনুমোদিত স্বজনদের কাছে পৌঁছায়।',
      status: 'pilot'
    },
    {
      icon: Stethoscope,
      title: 'Coordinated doctor visits',
      titleBn: 'ডাক্তার দেখানোর সমন্বয়',
      body:
        'Book the appointment, arrange a companion to attend with your parent, and have the visit summary land back in the same record — all from another time zone.',
      bodyBn:
        'অ্যাপয়েন্টমেন্ট বুকিং, সঙ্গী ব্যবস্থা এবং ভিজিটের সারসংক্ষেপ একই রেকর্ডে ফিরে আসা — সবই দূর থেকে পরিচালনাযোগ্য।',
      status: 'pilot'
    },
    {
      icon: Truck,
      title: 'Medicine delivery coordination',
      titleBn: 'ওষুধ সরবরাহের সমন্বয়',
      body:
        'When a schedule is running low, Thypro helps arrange a refill through a partner pharmacy and records what was actually delivered against the prescription.',
      bodyBn:
        'ওষুধ ফুরিয়ে আসার আগে অংশীদার ফার্মেসির মাধ্যমে রিফিলের ব্যবস্থা এবং ব্যবস্থাপত্রের সাথে মিলিয়ে সরবরাহের হিসাব সংরক্ষণ।',
      status: 'planned'
    },
    {
      icon: UserCheck,
      title: 'Verified local caregivers',
      titleBn: 'যাচাইকৃত স্থানীয় সহায়ক',
      body:
        'Identity-checked helpers who can accompany a visit or confirm a check-in in person. Every caregiver action is logged against the record, visible to the patient.',
      bodyBn:
        'পরিচয় যাচাই করা সহায়ক, যাঁরা সরাসরি উপস্থিত থেকে সহায়তা করেন। প্রতিটি কাজ রেকর্ডে সংরক্ষিত থাকে এবং রোগী তা দেখতে পান।',
      status: 'planned'
    }
  ];

  const statusLabel = (status: string) =>
    status === 'pilot'
      ? { cls: 'thy-status-pilot', text: 'In pilot' }
      : { cls: 'thy-status-planned', text: 'In development' };

  return (
    <section
      id="family-care"
      className="thy-section bg-ivory-50 border-b border-forest-900/10 relative overflow-hidden"
    >
      <div className="thy-container relative">
        <SectionHeading
          index="05"
          eyebrow={lang === 'en' ? 'Thypro Family Care' : 'থাইপ্রো ফ্যামিলি কেয়ার'}
          title={lang === 'en' ? 'Look after your parents' : 'বাবা-মায়ের যত্ন নিন'}
          titleAccent={lang === 'en' ? 'from wherever you are.' : 'আপনি যেখানেই থাকুন।'}
          lede={
            lang === 'en'
              ? 'Family Care is built for the son in Dubai and the daughter in Toronto who send money home every month but cannot see whether this morning’s tablet was taken. It turns a paper prescription into a schedule someone has actually checked, and keeps the household, the caregiver and the clinic reading from the same page.'
              : 'দুবাই কিংবা টরন্টোয় থাকা সন্তানেরা প্রতি মাসে টাকা পাঠান, কিন্তু সকালের ওষুধটি খাওয়া হয়েছে কি না তা জানতে পারেন না। ফ্যামিলি কেয়ার কাগজের ব্যবস্থাপত্রকে যাচাই করা সময়সূচিতে রূপ দেয় এবং পরিবার, সহায়ক ও ক্লিনিককে এক তথ্যে যুক্ত রাখে।'
          }
          className="mb-14"
        />

        {/* Prescription -> schedule -> reminder flow */}
        <Reveal>
        <div {...rot.bind} className="mb-16">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div
              className="thy-seg"
              role="tablist"
              aria-label={lang === 'en' ? 'Family Care flow stages' : 'ফ্যামিলি কেয়ার ধাপসমূহ'}
            >
              {STAGES.map((s, i) => {
                const Icon = s.icon;
                const isActive = rot.index === i;
                return (
                  <button
                    key={s.id}
                    type="button"
                    role="tab"
                    id={`familycare-tab-${s.id}`}
                    aria-selected={isActive}
                    aria-controls={`familycare-panel-${s.id}`}
                    onClick={() => rot.select(i)}
                    className="thy-seg-btn"
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-mono transition-colors duration-500 ${
                        isActive ? 'bg-ochre-500 text-white' : i < rot.index ? 'bg-forest-900 text-ivory-50' : 'bg-forest-900/10 text-forest-800'
                      }`}
                      aria-hidden="true"
                    >
                      {i < rot.index ? <Check className="h-3 w-3" /> : i + 1}
                    </span>
                    <Icon className="w-3.5 h-3.5 hidden xs:block" aria-hidden="true" />
                    <span>{lang === 'en' ? s.label : s.labelBn}</span>
                    <RotateProgress
                      active={isActive}
                      autoplay={rot.autoplay}
                      running={rot.running}
                      intervalMs={rot.intervalMs}
                      onDone={rot.next}
                      cycleKey={rot.index}
                      tone="dark"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div
            key={stage}
            id={`familycare-panel-${stage}`}
            role="tabpanel"
            aria-labelledby={`familycare-tab-${stage}`}
            aria-live={rot.autoplay ? 'off' : 'polite'}
            className="thy-luxe p-5 sm:p-8 lg:p-10"
          >
            {stage === 'upload' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center thy-swap">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl text-forest-950 mb-3">
                    {lang === 'en'
                      ? 'Start with the paper you already have'
                      : 'হাতে থাকা কাগজ দিয়েই শুরু'}
                  </h3>
                  <p className="text-sm text-forest-900/80 leading-relaxed mb-5">
                    {lang === 'en'
                      ? 'A photo of the prescription slip is enough. No hospital integration is required, and nothing is thrown away — the original scan stays attached to every line that comes out of it.'
                      : 'ব্যবস্থাপত্রের একটি ছবিই যথেষ্ট। কোনো হাসপাতালের সাথে সংযোগ লাগে না, আর মূল স্ক্যানটি প্রতিটি তথ্যের সাথে যুক্ত থাকে।'}
                  </p>
                  <ul className="space-y-2.5">
                    {(lang === 'en'
                      ? [
                          'Handwritten slips, printed prescriptions and lab reports',
                          'Uploaded by the patient, a relative abroad, or a caregiver',
                          'Original image retained as the source of truth'
                        ]
                      : [
                          'হাতে লেখা স্লিপ, ছাপানো ব্যবস্থাপত্র ও ল্যাব রিপোর্ট',
                          'রোগী, প্রবাসী স্বজন বা সহায়ক — যে কেউ আপলোড করতে পারেন',
                          'মূল ছবিটি প্রমাণ হিসেবে সংরক্ষিত থাকে'
                        ]
                    ).map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-forest-900/80">
                        <Check className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="thy-mock">
                  <div className="thy-mock-bar">
                    <span className="thy-mock-dot" />
                    <span className="thy-mock-dot" />
                    <span className="text-[11px] font-mono text-forest-800/60 ml-1">
                      Family Care · Add document
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="rounded-lg border-2 border-dashed border-forest-900/18 bg-ivory-100 p-6 text-center">
                      <FileUp className="w-6 h-6 text-ochre-600 mx-auto mb-2.5" aria-hidden="true" />
                      <div className="text-sm font-medium text-forest-950 mb-1">
                        prescription-14-oct.jpg
                      </div>
                      <div className="text-[11px] font-mono text-forest-800/60">
                        1.2 MB · uploaded by Samira (London)
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-forest-800/70">
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="w-3 h-3" aria-hidden="true" />
                        Queued for review
                      </span>
                      <span className="text-ochre-700">Est. under 24h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {stage === 'review' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center thy-swap">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl text-forest-950 mb-3">
                    {lang === 'en'
                      ? 'A person checks the schedule before anyone relies on it'
                      : 'নির্ভর করার আগে একজন মানুষ সময়সূচি যাচাই করেন'}
                  </h3>
                  <p className="text-sm text-forest-900/80 leading-relaxed mb-5">
                    {lang === 'en'
                      ? 'Assistive extraction reads the handwriting and proposes a medication schedule. That proposal is held until a trained reviewer confirms each line against the original image. Nothing becomes a reminder on the strength of a machine reading alone.'
                      : 'সহায়ক প্রযুক্তি হাতের লেখা পড়ে একটি সম্ভাব্য সময়সূচি তৈরি করে। প্রশিক্ষিত একজন ব্যক্তি মূল ছবির সাথে মিলিয়ে প্রতিটি লাইন নিশ্চিত না করা পর্যন্ত তা কার্যকর হয় না।'}
                  </p>
                  <div className="p-3.5 rounded-lg bg-sage-50 border border-sage-200 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-sage-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-forest-900/85 leading-relaxed">
                      <strong className="font-semibold text-forest-950">
                        {lang === 'en' ? 'Where the boundary sits: ' : 'সীমারেখা: '}
                      </strong>
                      {lang === 'en'
                        ? 'Thypro transcribes and organises what a doctor prescribed. It does not change a dose, suggest a different drug, or decide a diagnosis.'
                        : 'থাইপ্রো শুধু চিকিৎসকের নির্দেশনা সাজিয়ে রাখে। এটি ডোজ পরিবর্তন করে না, বিকল্প ওষুধ প্রস্তাব করে না, রোগ নির্ণয়ও করে না।'}
                    </p>
                  </div>
                </div>

                <div className="thy-mock">
                  <div className="thy-mock-bar">
                    <span className="thy-mock-dot" />
                    <span className="thy-mock-dot" />
                    <span className="text-[11px] font-mono text-forest-800/60 ml-1">
                      Medication schedule · pending confirmation
                    </span>
                  </div>
                  <div className="divide-y divide-forest-900/8">
                    {[
                      { name: 'Metformin 500 mg', time: 'After breakfast · After dinner', state: 'confirmed' },
                      { name: 'Amlodipine 5 mg', time: 'Morning, once daily', state: 'confirmed' },
                      { name: 'Atorvastatin 20 mg', time: 'Night, once daily', state: 'review' }
                    ].map((m) => (
                      <div key={m.name} className="flex items-center gap-3 px-4 py-3.5">
                        <Pill className="w-4 h-4 text-ochre-600 shrink-0" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-forest-950 truncate">{m.name}</div>
                          <div className="text-[11px] text-forest-800/70">{m.time}</div>
                        </div>
                        {m.state === 'confirmed' ? (
                          <span className="thy-status-live shrink-0">
                            <Check className="w-3 h-3" aria-hidden="true" />
                            Confirmed
                          </span>
                        ) : (
                          <span className="thy-status-pilot shrink-0">Needs review</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-3 bg-ivory-100 text-[11px] font-mono text-forest-800/70">
                    Reviewer: Thypro care desk · linked to prescription-14-oct.jpg
                  </div>
                </div>
              </div>
            )}

            {stage === 'remind' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center thy-swap">
                <div>
                  <h3 className="font-editorial text-xl sm:text-2xl text-forest-950 mb-3">
                    {lang === 'en'
                      ? 'A reminder in a voice your parent understands'
                      : 'বাবা-মায়ের বোধগম্য ভাষায় রিমাইন্ডার'}
                  </h3>
                  <p className="text-sm text-forest-900/80 leading-relaxed mb-5">
                    {lang === 'en'
                      ? 'Reminders arrive as a spoken call or a simple message in Bangla or English — no app to learn, no small print to squint at. A confirmation goes back to the family, so nobody has to turn an evening phone call into an interrogation.'
                      : 'রিমাইন্ডার আসে ফোনকল বা সহজ বার্তা হিসেবে, বাংলা কিংবা ইংরেজিতে — নতুন অ্যাপ শেখার দরকার নেই। নিশ্চিতকরণ পরিবারের কাছে পৌঁছে যায়, তাই প্রতিদিনের ফোনকল আর জেরা হয়ে ওঠে না।'}
                  </p>
                  <ul className="space-y-2.5">
                    {(lang === 'en'
                      ? [
                          'Voice call or SMS, chosen per person',
                          'Missed doses surface in the weekly family update',
                          'Patient can mute or change reminders at any time'
                        ]
                      : [
                          'ব্যক্তিভেদে ফোনকল অথবা এসএমএস',
                          'বাদ পড়া ডোজ সাপ্তাহিক আপডেটে উঠে আসে',
                          'রোগী যেকোনো সময় রিমাইন্ডার বন্ধ বা পরিবর্তন করতে পারেন'
                        ]
                    ).map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-forest-900/80">
                        <Check className="w-4 h-4 text-sage-600 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="thy-mock">
                  <div className="thy-mock-bar">
                    <span className="thy-mock-dot" />
                    <span className="thy-mock-dot" />
                    <span className="text-[11px] font-mono text-forest-800/60 ml-1">
                      Today · 8:00 AM reminder
                    </span>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-3 p-3.5 rounded-lg bg-forest-900 text-ivory-100">
                      <Mic className="w-4 h-4 text-ember-300 shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-ivory-200/70 font-semibold mb-1">
                          Voice call · Bangla
                        </div>
                        <p className="text-sm leading-relaxed">
                          &ldquo;সুপ্রভাত। নাশতার পরে মেটফরমিন ৫০০ মি.গ্রা. ওষুধটি নিতে ভুলবেন না।&rdquo;
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3.5 rounded-lg bg-sage-50 border border-sage-200">
                      <CalendarCheck className="w-4 h-4 text-sage-700 shrink-0" aria-hidden="true" />
                      <div className="text-xs text-forest-900/85">
                        <strong className="font-semibold text-forest-950">Confirmed 8:14 AM.</strong>{' '}
                        Samira sees this on her dashboard in London.
                      </div>
                    </div>

                    <p className="text-[11px] text-forest-800/60 leading-relaxed">
                      Reminders are supportive, not emergency monitoring. Urgent symptoms always
                      need a clinician or emergency service.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </Reveal>

        {/* Coordination services */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {services.map((service, i) => {
            const Icon = service.icon;
            const status = statusLabel(service.status);
            return (
              <Reveal key={service.title} delay={i * 70}>
                <article className="thy-luxe group h-full p-6 sm:p-7 flex flex-col transition-transform duration-500 ease-editorial hover:-translate-y-1">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <span className="w-11 h-11 rounded-xl bg-forest-900 flex items-center justify-center text-ochre-300 shrink-0 transition-colors duration-500 group-hover:bg-ochre-500 group-hover:text-white">
                      <Icon className="w-[18px] h-[18px]" aria-hidden="true" />
                    </span>
                    <span className={`${status.cls} shrink-0`}>{status.text}</span>
                  </div>
                  <h3 className="font-editorial text-lg sm:text-xl text-forest-950 mb-2">
                    {lang === 'en' ? service.title : service.titleBn}
                  </h3>
                  <p className="text-sm text-forest-900/75 leading-relaxed">
                    {lang === 'en' ? service.body : service.bodyBn}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={120}>
          <p className="mt-8 text-xs text-forest-800/70 leading-relaxed max-w-3xl">
            <strong className="text-forest-950 font-semibold">
              {lang === 'en' ? 'Where we actually are: ' : 'আমাদের বর্তমান অবস্থান: '}
            </strong>
            {lang === 'en'
              ? 'Family Care is running with a small pilot group in Dhaka. Caregiver verification and pharmacy delivery are being built with partners and are not open to the public yet — the labels above say which is which.'
              : 'ফ্যামিলি কেয়ার বর্তমানে ঢাকার একটি ছোট পাইলট দলের সাথে চলছে। সহায়ক যাচাই ও ওষুধ সরবরাহ এখনো নির্মাণাধীন — উপরের লেবেলগুলোতে প্রতিটি সেবার প্রকৃত অবস্থা উল্লেখ করা আছে।'}
          </p>
        </Reveal>
      </div>
    </section>
  );
};
