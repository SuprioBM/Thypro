import React, { useState } from 'react';
import { AlertCircle, FileText, PhoneCall, History } from 'lucide-react';
import { Picture } from './ui/Picture';
import { Reveal } from './ui/Reveal';

interface ProblemSectionProps {
  lang: 'en' | 'bn';
}

export const ProblemSection: React.FC<ProblemSectionProps> = ({ lang }) => {
  const [activeHotspot, setActiveHotspot] = useState<number | null>(null);

  const hotspots = [
    {
      id: 1,
      x: '28%',
      y: '34%',
      title: 'Handwritten Prescription',
      problem: 'Faded dosage notes and unstandardized abbreviations make medication verification stressful across distance.',
      banglaTitle: 'হাতে লেখা ব্যবস্থাপত্র',
      banglaProblem: 'অস্পষ্ট ডোজ এবং সংক্ষিপ্ত রূপ প্রবাসে থাকা পরিবারের সদস্যদের জন্য সঠিক ওষুধ যাচাই কঠিন করে তোলে।'
    },
    {
      id: 2,
      x: '68%',
      y: '42%',
      title: 'Diagnostic Lab Envelope',
      problem: 'A lipid panel conducted three months ago remains in an unfiled physical envelope, lost to the new specialist.',
      banglaTitle: 'ল্যাব পরীক্ষার রিপোর্ট',
      banglaProblem: 'তিন মাস আগের ল্যাব টেস্ট ফাইলবন্দী হয়ে থাকে, নতুন চিকিৎসকের কাছে পৌঁছায় না।'
    },
    {
      id: 3,
      x: '45%',
      y: '78%',
      title: 'Scattered Messaging Threads',
      problem: 'Crucial physician instructions and family updates are lost inside endless WhatsApp chat histories.',
      banglaTitle: 'মেসেঞ্জার ও হোয়াটসঅ্যাপ চ্যাট',
      banglaProblem: 'জরুরি প্রেসক্রিপশন ছবি ও পরামর্শ ব্যক্তিগত চ্যাটের ভিড়ে হারিয়ে যায়।'
    }
  ];

  return (
    <section id="problem" className="thy-section bg-ivory-50 border-b border-forest-900/10 relative">
      <div className="thy-container">
        {/* Section Header */}
        <div className="max-w-3xl mb-16">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ochre-600 font-semibold mb-4">
            <span>01 — {lang === 'en' ? 'The Disconnect' : 'বিদ্যমান সমস্যা'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-5xl text-forest-950 font-normal leading-[1.12] mb-6">
            {lang === 'en' ? (
              <>
                Healthcare happens in many places. <br className="hidden sm:inline" />
                <span className="italic text-forest-800">Your story should stay connected.</span>
              </>
            ) : (
              <>
                চিকিৎসা ঘটে নানা জায়গায় ও নানা সময়ে। <br className="hidden sm:inline" />
                <span className="italic text-forest-800">কিন্তু আপনার স্বাস্থ্যতথ্য থাকা উচিত এক সূত্রে।</span>
              </>
            )}
          </h2>
          <p className="text-base sm:text-lg text-forest-900/80 leading-relaxed font-normal">
            {lang === 'en'
              ? 'When health information is divided between paper slips, hospital portals, phone messages, and memory, the person managing care carries an unnecessary burden. Crucial details slip through the cracks—especially when families are caring across borders.'
              : 'যখন স্বাস্থ্যতথ্য ছড়িয়ে থাকে প্রেসক্রিপশন কাগজ, ল্যাব খাম, আর ফোনের মেসেজে, তখন সঠিক সময়ে সঠিক সিদ্ধান্ত নেওয়া কঠিন হয়ে পড়ে। বিশেষ করে প্রবাসী সন্তানদের জন্য বাবা-মায়ের দূরবর্তী চিকিৎসা সমন্বয় করা এক নীরব উদ্বেগ।'}
          </p>
        </div>

        {/* Visual Composition: The Reality of Fragmentation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left: Photographic Evidence of Paper Chaos with Interactive Hotspots (7 cols) */}
          <div className="lg:col-span-7 relative group">
            <div className="relative rounded-lg overflow-hidden border border-forest-900/15 shadow-editorial bg-ivory-200">
              <Picture
                src="/images/fragmented-records.jpg"
                alt="Scattered paper prescriptions, lab slips and diagnostic envelopes spread across a table"
                width={1200}
                height={896}
                sizes="(min-width: 1024px) 58vw, 92vw"
                className="w-full h-[320px] sm:h-[480px] object-cover object-center filter saturate-[0.95]"
              />

              {/* Hotspots overlay */}
              {hotspots.map((spot) => (
                <div
                  key={spot.id}
                  style={{ top: spot.y, left: spot.x }}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                  onClick={() => setActiveHotspot(activeHotspot === spot.id ? null : spot.id)}
                  onMouseEnter={() => setActiveHotspot(spot.id)}
                >
                  <div className="relative flex items-center justify-center">
                    <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-ochre-400 opacity-60" />
                    <button
                      className="relative w-7 h-7 rounded-full bg-forest-900 text-ivory-50 flex items-center justify-center text-xs font-semibold shadow-soft hover:bg-ochre-600 transition-colors"
                      aria-label={spot.title}
                    >
                      {spot.id}
                    </button>
                  </div>

                  {/* Tooltip Card */}
                  {activeHotspot === spot.id && (
                    <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-64 p-3.5 bg-ivory-50 text-forest-950 rounded border border-forest-900/20 shadow-soft-lg z-20 animate-fade-in-up">
                      <div className="text-[11px] font-sans font-bold uppercase tracking-wider text-ochre-600 mb-1">
                        {lang === 'en' ? spot.title : spot.banglaTitle}
                      </div>
                      <p className="text-xs leading-relaxed text-forest-900/85">
                        {lang === 'en' ? spot.problem : spot.banglaProblem}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Bottom bar indicator */}
              <div className="absolute bottom-0 inset-x-0 bg-forest-950/80 backdrop-blur-sm px-4 py-2 text-ivory-200 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 text-ochre-400" />
                  <span>The reality of scattered paper records</span>
                </span>
                <span className="text-[11px] text-ivory-200/60 hidden sm:inline">Tap numbers to inspect friction points</span>
              </div>
            </div>
          </div>

          {/* Right: Editorial Narrative Breakdown (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <Reveal className="thy-card-interactive p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-ochre-50 border border-ochre-200/70 flex items-center justify-center text-ochre-700 shrink-0">
                  <FileText className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="font-editorial text-xl text-forest-950 font-normal">
                  {lang === 'en' ? 'Missing Source Provenance' : 'তথ্যের উৎস ও নির্ভরযোগ্যতার অভাব'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                {lang === 'en'
                  ? 'A lab PDF without provenance is just an image. Clinicians cannot quickly verify who signed it, when the blood draw occurred, or which medications were active at that exact date.'
                  : 'একটি ল্যাব রিপোর্ট ছবি আকারে থাকলে চিকিৎসক জানতে পারেন না রক্ত কবে নেওয়া হয়েছিল বা তখন রোগী কোন ওষুধ খাচ্ছিলেন।'}
              </p>
            </Reveal>

            <Reveal delay={80} className="thy-card-interactive p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-ochre-50 border border-ochre-200/70 flex items-center justify-center text-ochre-700 shrink-0">
                  <PhoneCall className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="font-editorial text-xl text-forest-950 font-normal">
                  {lang === 'en' ? 'The Distance Penalty' : 'দূরত্বের উদ্বেগ ও অনিশ্চয়তা'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                {lang === 'en'
                  ? 'Family members funding care from abroad rely on second-hand phone calls. They want to verify their parents took the right dose this morning without turning every call into an interrogation.'
                  : 'প্রবাস থেকে সন্তানেরা চিকিৎসার খরচ পাঠান ঠিকই, কিন্তু নিয়মিত ওষুধ খাওয়ার খবর বা ডাক্তারের পরামর্শ জানা সবসময় সহজ হয় না।'}
              </p>
            </Reveal>

            <Reveal delay={160} className="thy-card-interactive p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-ochre-50 border border-ochre-200/70 flex items-center justify-center text-ochre-700 shrink-0">
                  <History className="w-4 h-4" aria-hidden="true" />
                </div>
                <h3 className="font-editorial text-xl text-forest-950 font-normal">
                  {lang === 'en' ? 'Forgotten Longitudinal Context' : 'দীর্ঘমেয়াদী ইতিহাসের অনুপস্থিতি'}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-forest-900/75 leading-relaxed">
                {lang === 'en'
                  ? 'Chronic conditions like diabetes, hypertension, and thyroid disorders are journeys spanning decades. Discarded paper files erase trends that could guide better decisions.'
                  : 'ডায়াবেটিস বা প্রেশারের মতো রোগগুলো বহু বছরের ধারাবাহিক চিকিৎসার বিষয়। পুরনো কাগজ হারিয়ে গেলে দীর্ঘমেয়াদী স্বাস্থ্যধারাও মুছে যায়।'}
              </p>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
};
