/**
 * Behaviour-change technique cards.
 *
 * DATA ONLY. Used by the plan cards, the in-app transparency screen and the
 * public "How suggestions work" page, so all three always say the same thing.
 *
 * The technique names follow the Behaviour Change Technique Taxonomy (v1).
 * Which Thypro action is tagged with which technique is the Thypro team's own
 * mapping: it has not been clinically validated, and the UI says so.
 * Translations need native-speaker review.
 */

import type { Lang } from '../domain/types';

export const TECHNIQUE_IDS = [
  'actionPlanning',
  'selfMonitoring',
  'promptsCues',
  'gradedTasks',
  'socialSupport',
  'incentives'
] as const;

export type TechniqueId = (typeof TECHNIQUE_IDS)[number];

export interface TechniqueText {
  name: string;
  rationale: string;
  limits: string;
}

export interface Technique {
  id: TechniqueId;
  source: { label: string; url: string };
  /** Where the app uses it, as feature ids the UI translates. */
  features: TechniqueFeature[];
  text: Record<Lang, TechniqueText>;
}

export type TechniqueFeature = 'plan' | 'checkin' | 'reminders' | 'ladder' | 'family' | 'totals';

const BCTT = {
  label: 'Behaviour Change Technique Taxonomy v1 (Michie et al., Annals of Behavioral Medicine, 2013)',
  url: 'https://doi.org/10.1007/s12160-013-9486-6'
};

export const TECHNIQUES: Record<TechniqueId, Technique> = {
  actionPlanning: {
    id: 'actionPlanning',
    source: BCTT,
    features: ['plan'],
    text: {
      en: {
        name: 'Action planning',
        rationale: 'Deciding exactly what, when and where makes a small step easier to start.',
        limits:
          'A plan helps you start; it does not make the step right for every health condition. Check with a clinician if you are unsure.'
      },
      bn: {
        name: 'কর্ম-পরিকল্পনা',
        rationale: 'কী, কখন ও কোথায় করবেন তা ঠিক করে নিলে ছোট পদক্ষেপ শুরু করা সহজ হয়।',
        limits:
          'পরিকল্পনা শুরু করতে সাহায্য করে; তবে তা সব স্বাস্থ্য অবস্থার জন্য সঠিক নাও হতে পারে। নিশ্চিত না হলে চিকিৎসককে জিজ্ঞাসা করুন।'
      },
      hi: {
        name: 'कार्य-योजना',
        rationale: 'क्या, कब और कहाँ करना है यह तय कर लेने से छोटा कदम शुरू करना आसान होता है।',
        limits:
          'योजना शुरू करने में मदद करती है; यह हर स्वास्थ्य स्थिति के लिए सही हो, यह ज़रूरी नहीं। संदेह हो तो चिकित्सक से पूछें।'
      },
      ur: {
        name: 'عملی منصوبہ بندی',
        rationale: 'کیا، کب اور کہاں کرنا ہے یہ طے کر لینے سے چھوٹا قدم شروع کرنا آسان ہو جاتا ہے۔',
        limits:
          'منصوبہ شروع کرنے میں مدد دیتا ہے؛ ضروری نہیں کہ یہ ہر صحت کی حالت کے لیے درست ہو۔ شک ہو تو معالج سے پوچھیں۔'
      }
    }
  },
  selfMonitoring: {
    id: 'selfMonitoring',
    source: BCTT,
    features: ['checkin', 'plan'],
    text: {
      en: {
        name: 'Self-monitoring',
        rationale: 'Noting what you did each day helps you see patterns, without judging them.',
        limits:
          'Your check-ins are your own record. They are not a medical measurement, and missing days are simply missing.'
      },
      bn: {
        name: 'নিজের পর্যবেক্ষণ',
        rationale: 'প্রতিদিন কী করলেন তা লিখে রাখলে বিচার না করেই ধরন বোঝা যায়।',
        limits: 'আপনার চেক-ইন আপনার নিজের রেকর্ড। এটি কোনো চিকিৎসা পরিমাপ নয়, আর বাদ পড়া দিন শুধু বাদ পড়া দিন।'
      },
      hi: {
        name: 'स्व-निगरानी',
        rationale: 'रोज़ क्या किया यह दर्ज करने से बिना आँके पैटर्न दिखते हैं।',
        limits: 'आपके चेक-इन आपका अपना रिकॉर्ड हैं। ये चिकित्सकीय माप नहीं हैं, और छूटे दिन बस छूटे दिन हैं।'
      },
      ur: {
        name: 'خود نگرانی',
        rationale: 'روزانہ کیا کیا یہ درج کرنے سے بغیر پرکھے پیٹرن نظر آتے ہیں۔',
        limits: 'آپ کے چیک اِن آپ کا اپنا ریکارڈ ہیں۔ یہ طبی پیمائش نہیں، اور چھوٹے ہوئے دن بس چھوٹے ہوئے دن ہیں۔'
      }
    }
  },
  promptsCues: {
    id: 'promptsCues',
    source: BCTT,
    features: ['reminders', 'plan'],
    text: {
      en: {
        name: 'Prompts and cues',
        rationale: 'A reminder or a visible cue at the right moment makes the habit easier to remember.',
        limits: 'You choose the channels and quiet hours. A reminder never means you are being watched.'
      },
      bn: {
        name: 'সংকেত ও রিমাইন্ডার',
        rationale: 'সঠিক সময়ে একটি রিমাইন্ডার বা চোখে পড়ার মতো সংকেত অভ্যাস মনে রাখতে সাহায্য করে।',
        limits: 'মাধ্যম ও নীরব সময় আপনিই ঠিক করেন। রিমাইন্ডার মানে কেউ আপনাকে নজরে রাখছে না।'
      },
      hi: {
        name: 'संकेत और रिमाइंडर',
        rationale: 'सही समय पर रिमाइंडर या दिखने वाला संकेत आदत याद रखना आसान बनाता है।',
        limits: 'माध्यम और शांत समय आप चुनते हैं। रिमाइंडर का मतलब यह नहीं कि आप पर नज़र रखी जा रही है।'
      },
      ur: {
        name: 'اشارے اور یاد دہانیاں',
        rationale: 'درست وقت پر یاد دہانی یا نظر آنے والا اشارہ عادت یاد رکھنا آسان بناتا ہے۔',
        limits: 'ذرائع اور خاموش اوقات آپ چنتے ہیں۔ یاد دہانی کا مطلب یہ نہیں کہ آپ کی نگرانی ہو رہی ہے۔'
      }
    }
  },
  gradedTasks: {
    id: 'gradedTasks',
    source: BCTT,
    features: ['ladder', 'plan'],
    text: {
      en: {
        name: 'Graded tasks',
        rationale:
          'Starting small and stepping up only when it feels easy keeps a habit going. Stepping down after a hard patch is part of the plan.',
        limits: 'Steps stay inside safety limits. A step down is not a failure, and you can always decline a step up.'
      },
      bn: {
        name: 'ধাপে ধাপে কাজ',
        rationale:
          'ছোট থেকে শুরু করে সহজ লাগলে তবেই একধাপ বাড়ানো অভ্যাস ধরে রাখে। কঠিন সময়ে একধাপ কমানোও পরিকল্পনার অংশ।',
        limits: 'ধাপগুলো নিরাপত্তা সীমার মধ্যে থাকে। একধাপ কমানো ব্যর্থতা নয়, আর ধাপ বাড়ানোর প্রস্তাবে আপনি সবসময় না বলতে পারেন।'
      },
      hi: {
        name: 'क्रमिक कदम',
        rationale:
          'छोटे से शुरू करके आसान लगने पर ही एक कदम बढ़ाने से आदत बनी रहती है। कठिन दौर में एक कदम घटाना भी योजना का हिस्सा है।',
        limits: 'कदम सुरक्षा सीमाओं के भीतर रहते हैं। एक कदम घटाना विफलता नहीं है, और आप कदम बढ़ाने का प्रस्ताव हमेशा ठुकरा सकते हैं।'
      },
      ur: {
        name: 'درجہ بدرجہ قدم',
        rationale:
          'چھوٹے سے شروع کر کے آسان لگنے پر ہی ایک قدم بڑھانے سے عادت قائم رہتی ہے۔ مشکل وقت میں ایک قدم کم کرنا بھی منصوبے کا حصہ ہے۔',
        limits: 'قدم حفاظتی حدود کے اندر رہتے ہیں۔ ایک قدم کم کرنا ناکامی نہیں، اور آپ قدم بڑھانے کی پیشکش ہمیشہ رد کر سکتے ہیں۔'
      }
    }
  },
  socialSupport: {
    id: 'socialSupport',
    source: BCTT,
    features: ['family', 'plan'],
    text: {
      en: {
        name: 'Social support',
        rationale: 'Sharing progress with someone you trust, or getting help from a professional, makes change easier.',
        limits: 'You decide who sees what, field by field. Professional decisions stay with licensed professionals.'
      },
      bn: {
        name: 'সামাজিক সহায়তা',
        rationale: 'বিশ্বস্ত কারও সঙ্গে অগ্রগতি ভাগ করা বা পেশাদারের সাহায্য নেওয়া পরিবর্তনকে সহজ করে।',
        limits: 'কে কী দেখবেন তা আপনি প্রতিটি ঘর ধরে ঠিক করেন। পেশাদার সিদ্ধান্ত লাইসেন্সপ্রাপ্ত পেশাদারের কাছেই থাকে।'
      },
      hi: {
        name: 'सामाजिक सहयोग',
        rationale: 'किसी भरोसेमंद व्यक्ति के साथ प्रगति साझा करना या किसी विशेषज्ञ की मदद लेना बदलाव को आसान बनाता है।',
        limits: 'कौन क्या देखे, यह आप हर विकल्प के लिए तय करते हैं। पेशेवर निर्णय लाइसेंस प्राप्त विशेषज्ञों के पास ही रहते हैं।'
      },
      ur: {
        name: 'سماجی تعاون',
        rationale: 'کسی بھروسے مند شخص کے ساتھ پیش رفت شیئر کرنا یا کسی ماہر کی مدد لینا تبدیلی کو آسان بناتا ہے۔',
        limits: 'کون کیا دیکھے، یہ آپ ہر خانے کے لیے طے کرتے ہیں۔ پیشہ ورانہ فیصلے لائسنس یافتہ ماہرین کے پاس ہی رہتے ہیں۔'
      }
    }
  },
  incentives: {
    id: 'incentives',
    source: BCTT,
    features: ['totals'],
    text: {
      en: {
        name: 'Non-financial incentives',
        rationale: 'Counting every day you have done, and marking milestones, can make the effort feel worthwhile.',
        limits: 'No money, prizes, rankings or leaderboards. Your total never resets, and nobody is compared with anyone else.'
      },
      bn: {
        name: 'আর্থিক নয় এমন উৎসাহ',
        rationale: 'যতদিন করেছেন সব গোনা ও মাইলফলক চিহ্নিত করা প্রচেষ্টাকে সার্থক মনে করাতে পারে।',
        limits: 'কোনো টাকা, পুরস্কার, র‍্যাংকিং বা লিডারবোর্ড নেই। আপনার মোট সংখ্যা কখনো শূন্য হয় না, কারও সঙ্গে তুলনাও হয় না।'
      },
      hi: {
        name: 'गैर-वित्तीय प्रोत्साहन',
        rationale: 'आपने जितने दिन किया, उन सबको गिनना और पड़ाव दर्ज करना मेहनत को सार्थक महसूस करा सकता है।',
        limits: 'कोई पैसा, इनाम, रैंकिंग या लीडरबोर्ड नहीं। आपका कुल कभी शून्य नहीं होता, और किसी की तुलना किसी से नहीं होती।'
      },
      ur: {
        name: 'غیر مالی حوصلہ افزائی',
        rationale: 'جتنے دن آپ نے کیا، ان سب کو گننا اور سنگِ میل درج کرنا محنت کو بامعنی محسوس کرا سکتا ہے۔',
        limits: 'کوئی رقم، انعام، درجہ بندی یا لیڈر بورڈ نہیں۔ آپ کا مجموعہ کبھی صفر نہیں ہوتا، اور کسی کا کسی سے موازنہ نہیں ہوتا۔'
      }
    }
  }
};

export function techniqueText(id: TechniqueId, lang: Lang): TechniqueText {
  return TECHNIQUES[id].text[lang] ?? TECHNIQUES[id].text.en;
}
