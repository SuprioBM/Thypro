/**
 * Approved plan-template library.
 *
 * Plans are assembled ONLY from this file. A language layer may rephrase or
 * translate wording but cannot add, remove or change an item.
 *
 * Translations (bn/hi/ur) were written by the engineering team and MUST be
 * reviewed by native speakers. Every template is `pending_clinician_review`:
 * the UI says so and never claims clinical validation.
 */

import type { DietaryPractice, GoalType, Lang, Plan, PlanItem } from '../domain/types';

export interface LocalText {
  /** May contain {minutes} and {time} placeholders. */
  title: string;
  reason: string;
}

export interface TemplateVariant {
  id: string;
  /** Allergy tags that rule this variant out. */
  avoidAllergyTags?: string[];
  /** True when the wording suggests animal foods (excluded for vegetarian). */
  animalBased?: boolean;
  text: Record<Lang, LocalText>;
}

export interface TemplateItem {
  id: string;
  variants: TemplateVariant[];
}

export interface PlanTemplate {
  id: string;
  version: string;
  goalType: GoalType;
  guidanceSource: { name: string; url?: string };
  reviewStatus: 'pending_clinician_review';
  items: TemplateItem[];
  /** Items kept in the smaller "restart" version. */
  restartKeep: string[];
}

const one = (id: string, text: Record<Lang, LocalText>): TemplateItem => ({
  id,
  variants: [{ id: 'default', text }]
});

const WALK: PlanTemplate = {
  id: 'tpl-activity-walk',
  version: '1.0.0',
  goalType: 'walk',
  guidanceSource: {
    name: 'WHO — Guidelines on physical activity and sedentary behaviour (2020)',
    url: 'https://www.who.int/publications/i/item/9789240015128'
  },
  reviewStatus: 'pending_clinician_review',
  restartKeep: ['walk', 'listen'],
  items: [
    one('walk', {
      en: {
        title: 'Walk for {minutes} minutes around {time}, at an easy pace where you can still talk.',
        reason:
          'Regular, easy walking is a gentle way to start. Small steps you can repeat are easier to keep than big ones.'
      },
      bn: {
        title: 'প্রতিদিন প্রায় {time}-এ {minutes} মিনিট হাঁটুন—এমন ধীর গতিতে, যাতে কথা বলতে পারেন।',
        reason:
          'নিয়মিত ধীর গতির হাঁটা শুরু করার একটি নরম উপায়। যা বারবার করা যায়, এমন ছোট পদক্ষেপ বড় লক্ষ্যের চেয়ে ধরে রাখা সহজ।'
      },
      hi: {
        title: 'रोज़ लगभग {time} बजे {minutes} मिनट टहलें—इतनी धीमी चाल से कि बात कर सकें।',
        reason:
          'नियमित, धीमी सैर शुरू करने का नरम तरीका है। जो छोटे कदम बार-बार दोहराए जा सकें, उन्हें निभाना बड़े लक्ष्य से आसान होता है।'
      },
      ur: {
        title: 'روزانہ تقریباً {time} بجے {minutes} منٹ چہل قدمی کریں—اتنی آہستہ رفتار سے کہ بات کر سکیں۔',
        reason:
          'باقاعدہ، آہستہ چہل قدمی شروع کرنے کا نرم طریقہ ہے۔ چھوٹے قدم جو بار بار دہرائے جا سکیں، بڑے ہدف کے مقابلے میں نبھانا آسان ہوتے ہیں۔'
      }
    }),
    one('cool', {
      en: {
        title:
          'On hot days, choose a shaded, cool or indoor route (for example a mall or a corridor) and carry water.',
        reason: 'Abu Dhabi heat can make walking outside hard, so a cooler place helps you keep going.'
      },
      bn: {
        title:
          'গরমের দিনে ছায়াযুক্ত, ঠান্ডা বা ঘরের ভেতরের পথ বেছে নিন (যেমন মল বা করিডর) এবং সঙ্গে পানি রাখুন।',
        reason: 'আবুধাবির গরমে বাইরে হাঁটা কষ্টকর হতে পারে, তাই ঠান্ডা জায়গা চালিয়ে যেতে সাহায্য করে।'
      },
      hi: {
        title:
          'गर्मी के दिनों में छायादार, ठंडा या घर के अंदर का रास्ता चुनें (जैसे मॉल या गलियारा) और साथ में पानी रखें।',
        reason: 'अबू धाबी की गर्मी में बाहर चलना मुश्किल हो सकता है, इसलिए ठंडी जगह आदत बनाए रखने में मदद करती है।'
      },
      ur: {
        title:
          'گرمی کے دنوں میں سایہ دار، ٹھنڈا یا اندرونی راستہ چنیں (مثلاً مال یا راہداری) اور پانی ساتھ رکھیں۔',
        reason: 'ابوظہبی کی گرمی میں باہر چلنا مشکل ہو سکتا ہے، اس لیے ٹھنڈی جگہ عادت برقرار رکھنے میں مدد دیتی ہے۔'
      }
    }),
    one('listen', {
      en: {
        title: 'If you feel unwell, dizzy or in pain, stop and rest. Do not push through.',
        reason: 'This plan is a gentle habit, not a test. Stopping early is always fine.'
      },
      bn: {
        title: 'অসুস্থ, মাথা ঘোরা বা ব্যথা অনুভব করলে থামুন ও বিশ্রাম নিন। জোর করে চালিয়ে যাবেন না।',
        reason: 'এই পরিকল্পনা একটি নরম অভ্যাস, কোনো পরীক্ষা নয়। আগে থেমে যাওয়া সবসময়ই ঠিক।'
      },
      hi: {
        title: 'अगर बीमार, चक्कर या दर्द महसूस हो तो रुकें और आराम करें। ज़ोर लगाकर जारी न रखें।',
        reason: 'यह योजना एक नरम आदत है, कोई परीक्षा नहीं। जल्दी रुक जाना हमेशा ठीक है।'
      },
      ur: {
        title: 'اگر طبیعت خراب ہو، چکر آئے یا درد ہو تو رک جائیں اور آرام کریں۔ زور لگا کر جاری نہ رکھیں۔',
        reason: 'یہ منصوبہ ایک نرم عادت ہے، کوئی امتحان نہیں۔ جلدی رک جانا ہمیشہ ٹھیک ہے۔'
      }
    })
  ]
};

const SLEEP: PlanTemplate = {
  id: 'tpl-sleep-routine',
  version: '1.0.0',
  goalType: 'sleep',
  guidanceSource: { name: 'General sleep-hygiene advice (clinician review pending)' },
  reviewStatus: 'pending_clinician_review',
  restartKeep: ['winddown', 'regular'],
  items: [
    one('winddown', {
      en: {
        title: 'Start winding down at {time}: dim the lights and put screens away.',
        reason: 'A repeated wind-down signal can help your body get ready for sleep.'
      },
      bn: {
        title: '{time}-এ শুরু করুন শান্ত হওয়া: আলো কমিয়ে দিন এবং স্ক্রিন সরিয়ে রাখুন।',
        reason: 'প্রতিদিন একই সংকেত শরীরকে ঘুমের জন্য তৈরি হতে সাহায্য করতে পারে।'
      },
      hi: {
        title: '{time} बजे शांत होना शुरू करें: रोशनी कम करें और स्क्रीन दूर रखें।',
        reason: 'रोज़ एक जैसा संकेत शरीर को नींद के लिए तैयार होने में मदद कर सकता है।'
      },
      ur: {
        title: '{time} بجے پرسکون ہونا شروع کریں: روشنی کم کریں اور اسکرین الگ رکھ دیں۔',
        reason: 'روزانہ ایک جیسا اشارہ جسم کو نیند کے لیے تیار ہونے میں مدد دے سکتا ہے۔'
      }
    }),
    one('regular', {
      en: {
        title: 'Go to bed and get up at about the same time every day, even on days off.',
        reason: 'A steady sleep and wake time supports a steady body clock.'
      },
      bn: {
        title: 'প্রতিদিন, ছুটির দিনেও, প্রায় একই সময়ে ঘুমাতে যান ও উঠুন।',
        reason: 'নিয়মিত ঘুম ও ওঠার সময় শরীরের ঘড়িকে স্থির রাখে।'
      },
      hi: {
        title: 'हर दिन, छुट्टी के दिन भी, लगभग एक ही समय पर सोएँ और उठें।',
        reason: 'सोने और उठने का नियमित समय शरीर की घड़ी को स्थिर रखता है।'
      },
      ur: {
        title: 'ہر روز، چھٹی کے دن بھی، تقریباً ایک ہی وقت پر سوئیں اور اٹھیں۔',
        reason: 'سونے اور جاگنے کا باقاعدہ وقت جسم کی گھڑی کو مستحکم رکھتا ہے۔'
      }
    }),
    one('caffeine', {
      en: {
        title: 'Avoid tea, coffee or energy drinks for several hours before bed.',
        reason: 'Caffeine can stay in the body for hours and make it harder to fall asleep.'
      },
      bn: {
        title: 'ঘুমের কয়েক ঘণ্টা আগে থেকে চা, কফি বা এনার্জি ড্রিংক এড়িয়ে চলুন।',
        reason: 'ক্যাফেইন কয়েক ঘণ্টা শরীরে থাকতে পারে এবং ঘুম আসা কঠিন করতে পারে।'
      },
      hi: {
        title: 'सोने से कई घंटे पहले चाय, कॉफ़ी या एनर्जी ड्रिंक से बचें।',
        reason: 'कैफ़ीन शरीर में कई घंटे रह सकता है और नींद आने में मुश्किल कर सकता है।'
      },
      ur: {
        title: 'سونے سے کئی گھنٹے پہلے چائے، کافی یا انرجی ڈرنک سے پرہیز کریں۔',
        reason: 'کیفین جسم میں کئی گھنٹے رہ سکتی ہے اور نیند آنا مشکل بنا سکتی ہے۔'
      }
    })
  ]
};

const PROTEIN_REASON: Record<Lang, string> = {
  en: 'Protein foods help you feel full and are part of a balanced plate.',
  bn: 'প্রোটিন-খাবার পেট ভরা অনুভব করতে সাহায্য করে এবং সুষম থালার অংশ।',
  hi: 'प्रोटीन वाला खाना पेट भरा महसूस कराता है और संतुलित थाली का हिस्सा है।',
  ur: 'پروٹین والی غذا پیٹ بھرا محسوس کراتی ہے اور متوازن پلیٹ کا حصہ ہے۔'
};

const EATING: PlanTemplate = {
  id: 'tpl-eating-balanced-local',
  version: '1.0.0',
  goalType: 'eating',
  guidanceSource: {
    name: 'WHO — Healthy diet (fact sheet)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'
  },
  reviewStatus: 'pending_clinician_review',
  restartKeep: ['plate', 'regular'],
  items: [
    one('plate', {
      en: {
        title:
          'At lunch and dinner, fill about half your plate with vegetables (for example shak, bhaji or sabzi), with a smaller portion of rice or roti.',
        reason:
          'Vegetables add fibre and variety, and a slightly smaller portion of rice or roti is an easy change to repeat.'
      },
      bn: {
        title:
          'দুপুর ও রাতের খাবারে থালার প্রায় অর্ধেক সবজি (যেমন শাক, ভাজি বা সবজি) রাখুন, ভাত বা রুটি অল্প পরিমাণে।',
        reason:
          'সবজিতে আঁশ ও বৈচিত্র্য থাকে, আর ভাত বা রুটির পরিমাণ একটু কমানো সহজে বারবার করা যায়।'
      },
      hi: {
        title:
          'दोपहर और रात के खाने में थाली का लगभग आधा हिस्सा सब्ज़ियों (जैसे साग, भाजी या सब्ज़ी) से भरें, चावल या रोटी कम मात्रा में।',
        reason:
          'सब्ज़ियाँ रेशा और विविधता देती हैं, और चावल या रोटी थोड़ी कम करना आसानी से दोहराया जा सकता है।'
      },
      ur: {
        title:
          'دوپہر اور رات کے کھانے میں پلیٹ کا تقریباً آدھا حصہ سبزیوں (مثلاً ساگ، بھاجی یا سبزی) سے بھریں، چاول یا روٹی کم مقدار میں۔',
        reason:
          'سبزیاں ریشہ اور ورائٹی دیتی ہیں، اور چاول یا روٹی ذرا کم کرنا آسانی سے دہرایا جا سکتا ہے۔'
      }
    }),
    {
      id: 'protein',
      variants: [
        {
          id: 'default',
          animalBased: true,
          avoidAllergyTags: ['fish', 'egg', 'shellfish'],
          text: {
            en: { title: 'Include a protein food each day, such as dal, fish, egg or chickpeas.', reason: PROTEIN_REASON.en },
            bn: { title: 'প্রতিদিন একটি প্রোটিন-খাবার রাখুন, যেমন ডাল, মাছ, ডিম বা ছোলা।', reason: PROTEIN_REASON.bn },
            hi: { title: 'रोज़ एक प्रोटीन वाला खाना रखें, जैसे दाल, मछली, अंडा या चना।', reason: PROTEIN_REASON.hi },
            ur: { title: 'روزانہ ایک پروٹین والی غذا رکھیں، جیسے دال، مچھلی، انڈا یا چنے۔', reason: PROTEIN_REASON.ur }
          }
        },
        {
          id: 'plant',
          avoidAllergyTags: ['legumes'],
          text: {
            en: { title: 'Include a protein food each day, such as dal, chickpeas or beans.', reason: PROTEIN_REASON.en },
            bn: { title: 'প্রতিদিন একটি প্রোটিন-খাবার রাখুন, যেমন ডাল, ছোলা বা বিন।', reason: PROTEIN_REASON.bn },
            hi: { title: 'रोज़ एक प्रोटीन वाला खाना रखें, जैसे दाल, चना या बीन्स।', reason: PROTEIN_REASON.hi },
            ur: { title: 'روزانہ ایک پروٹین والی غذا رکھیں، جیسے دال، چنے یا پھلیاں۔', reason: PROTEIN_REASON.ur }
          }
        },
        {
          id: 'generic',
          text: {
            en: {
              title: 'Include a protein food that suits you each day. A dietitian can help if you are unsure.',
              reason: PROTEIN_REASON.en
            },
            bn: {
              title: 'প্রতিদিন আপনার জন্য উপযুক্ত একটি প্রোটিন-খাবার রাখুন। নিশ্চিত না হলে একজন পুষ্টিবিদের পরামর্শ নিন।',
              reason: PROTEIN_REASON.bn
            },
            hi: {
              title: 'रोज़ अपने लिए उपयुक्त एक प्रोटीन वाला खाना रखें। यदि निश्चित न हों तो आहार विशेषज्ञ से पूछें।',
              reason: PROTEIN_REASON.hi
            },
            ur: {
              title: 'روزانہ اپنے لیے موزوں ایک پروٹین والی غذا رکھیں۔ یقین نہ ہو تو غذائی ماہر سے پوچھیں۔',
              reason: PROTEIN_REASON.ur
            }
          }
        }
      ]
    },
    one('regular', {
      en: {
        title: 'Eat at regular times and drink water through the day. Do not skip a meal to make up for a big one.',
        reason:
          'Regular meals and water support steady energy. Skipping meals can lead to eating more later.'
      },
      bn: {
        title:
          'নির্দিষ্ট সময়ে খান এবং সারা দিন পানি পান করুন। বড় খাবারের পর পূরণ করতে পরের বেলা বাদ দেবেন না।',
        reason:
          'নিয়মিত খাবার ও পানি স্থির শক্তি দিতে সাহায্য করে। খাবার বাদ দিলে পরে বেশি খাওয়ার ঝোঁক হতে পারে।'
      },
      hi: {
        title: 'तय समय पर खाएँ और दिन भर पानी पिएँ। बड़े भोजन की भरपाई के लिए अगला भोजन न छोड़ें।',
        reason:
          'नियमित भोजन और पानी स्थिर ऊर्जा देने में मदद करते हैं। भोजन छोड़ने से बाद में ज़्यादा खाने की प्रवृत्ति हो सकती है।'
      },
      ur: {
        title: 'مقررہ اوقات پر کھائیں اور دن بھر پانی پئیں۔ بڑے کھانے کی تلافی کے لیے اگلا کھانا نہ چھوڑیں۔',
        reason:
          'باقاعدہ کھانا اور پانی مستحکم توانائی دینے میں مدد کرتے ہیں۔ کھانا چھوڑنے سے بعد میں زیادہ کھانے کا رجحان ہو سکتا ہے۔'
      }
    })
  ]
};

const MEDICINE: PlanTemplate = {
  id: 'tpl-medicine-routine',
  version: '1.0.0',
  goalType: 'medicine',
  guidanceSource: { name: 'Routine and reminder-based adherence support (clinician review pending)' },
  reviewStatus: 'pending_clinician_review',
  restartKeep: ['time', 'ask'],
  items: [
    one('time', {
      en: {
        title: 'Take your medicine at about {time} each day, exactly as your clinician prescribed.',
        reason: 'Linking your medicine to the same time each day makes it easier to remember.'
      },
      bn: {
        title: 'প্রতিদিন প্রায় {time}-এ আপনার ওষুধ খান, ঠিক যেভাবে আপনার চিকিৎসক দিয়েছেন।',
        reason: 'প্রতিদিন একই সময়ের সঙ্গে ওষুধ যুক্ত করলে মনে রাখা সহজ হয়।'
      },
      hi: {
        title: 'रोज़ लगभग {time} बजे अपनी दवा लें, ठीक वैसे जैसे आपके चिकित्सक ने बताया है।',
        reason: 'दवा को रोज़ एक ही समय से जोड़ने पर याद रखना आसान होता है।'
      },
      ur: {
        title: 'روزانہ تقریباً {time} بجے اپنی دوا لیں، بالکل ویسے جیسے آپ کے معالج نے بتایا ہے۔',
        reason: 'دوا کو روزانہ ایک ہی وقت سے جوڑنے سے یاد رکھنا آسان ہوتا ہے۔'
      }
    }),
    one('cue', {
      en: {
        title: 'Keep your medicine where you will see it at that time, or use a weekly pill box.',
        reason: 'A visible cue is a simple memory aid.'
      },
      bn: {
        title: 'ওষুধটি এমন জায়গায় রাখুন যেখানে ওই সময়ে চোখে পড়বে, অথবা সাপ্তাহিক পিল-বক্স ব্যবহার করুন।',
        reason: 'চোখে পড়ার মতো সংকেত মনে রাখার একটি সহজ উপায়।'
      },
      hi: {
        title: 'दवा ऐसी जगह रखें जहाँ उस समय नज़र पड़े, या साप्ताहिक पिल-बॉक्स इस्तेमाल करें।',
        reason: 'नज़र आने वाला संकेत याद रखने का आसान तरीका है।'
      },
      ur: {
        title: 'دوا ایسی جگہ رکھیں جہاں اس وقت نظر پڑے، یا ہفتہ وار پل باکس استعمال کریں۔',
        reason: 'نظر آنے والا اشارہ یاد رکھنے کا آسان طریقہ ہے۔'
      }
    }),
    one('ask', {
      en: {
        title: 'Never change, stop or add a medicine on your own. Ask your clinician or pharmacist first.',
        reason: 'Only your clinician can change your treatment. Thypro only helps you remember.'
      },
      bn: {
        title:
          'নিজে থেকে কোনো ওষুধ বদলাবেন না, বন্ধ করবেন না বা যোগ করবেন না। আগে চিকিৎসক বা ফার্মাসিস্টকে জিজ্ঞাসা করুন।',
        reason: 'শুধু আপনার চিকিৎসকই আপনার চিকিৎসা বদলাতে পারেন। থাইপ্রো শুধু মনে করিয়ে দিতে সাহায্য করে।'
      },
      hi: {
        title: 'अपने आप कोई दवा न बदलें, न बंद करें, न जोड़ें। पहले अपने चिकित्सक या फ़ार्मासिस्ट से पूछें।',
        reason: 'केवल आपके चिकित्सक ही आपका इलाज बदल सकते हैं। थाइप्रो सिर्फ़ याद दिलाने में मदद करता है।'
      },
      ur: {
        title: 'اپنے طور پر کوئی دوا نہ بدلیں، نہ بند کریں، نہ شامل کریں۔ پہلے اپنے معالج یا فارماسسٹ سے پوچھیں۔',
        reason: 'صرف آپ کے معالج ہی آپ کا علاج بدل سکتے ہیں۔ تھائی پرو صرف یاد دلانے میں مدد کرتا ہے۔'
      }
    })
  ]
};

export const TEMPLATE_LIBRARY: readonly PlanTemplate[] = [WALK, SLEEP, EATING, MEDICINE];

export function getTemplate(goalType: GoalType): PlanTemplate {
  const t = TEMPLATE_LIBRARY.find((x) => x.goalType === goalType);
  if (!t) throw new Error(`No approved template for goal "${goalType}"`);
  return t;
}

export function getTemplateById(id: string): PlanTemplate | undefined {
  return TEMPLATE_LIBRARY.find((x) => x.id === id);
}

/** Picks the first variant that does not conflict with dietary practice or allergies. */
export function pickVariant(
  item: TemplateItem,
  dietary: readonly DietaryPractice[],
  allergyTags: readonly string[]
): TemplateVariant {
  const vegetarian = dietary.includes('vegetarian');
  const ok = item.variants.find((v) => {
    if (v.animalBased && vegetarian) return false;
    if (v.avoidAllergyTags?.some((tag) => allergyTags.includes(tag))) return false;
    return true;
  });
  return ok ?? item.variants[item.variants.length - 1];
}

function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

export interface ResolvedPlanItem {
  id: string;
  title: string;
  reason: string;
  templateId: string;
  guidanceSource: { name: string; url?: string };
}

/** Resolves a stored plan item to display text. Falls back to English if a translation is missing. */
export function resolvePlanItem(plan: Pick<Plan, 'templateId'>, item: PlanItem, lang: Lang): ResolvedPlanItem | null {
  const template = getTemplateById(plan.templateId);
  const tItem = template?.items.find((i) => i.id === item.templateItemId);
  const variant = tItem?.variants.find((v) => v.id === item.variant) ?? tItem?.variants[0];
  if (!template || !tItem || !variant) return null;
  const text = variant.text[lang] ?? variant.text.en;
  return {
    id: item.id,
    title: interpolate(text.title, item.params),
    reason: interpolate(text.reason, item.params),
    templateId: template.id,
    guidanceSource: template.guidanceSource
  };
}
