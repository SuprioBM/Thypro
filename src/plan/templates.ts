/**
 * Approved plan-template library.
 *
 * Plans are assembled ONLY from this file. A language layer may rephrase or
 * translate wording but cannot add, remove or change an item.
 *
 * Phase 2 adds: a tobacco template that is referral-only, context-aware
 * variants (shift work, Ramadan, heat, food budget, mobility), a small-step
 * ladder per goal, and a behaviour-change technique tag on every action.
 *
 * Translations (bn/hi/ur) were written by the engineering team and MUST be
 * reviewed by native speakers. Every template is `pending_clinician_review`.
 */

import type {
  AccessNeed,
  ContextProfile,
  DietaryPractice,
  Fasting,
  FoodBudget,
  GoalType,
  Heat,
  Lang,
  Plan,
  PlanItem,
  ShiftWork
} from '../domain/types';
import type { TechniqueId } from '../techniques/techniques';

export interface LocalText {
  /** May contain {minutes} and {time} placeholders. */
  title: string;
  reason: string;
}

/** A context condition. Every key given must match; `access` matches on any overlap. */
export interface ContextMatch {
  shiftWork?: ShiftWork[];
  fasting?: Fasting[];
  heat?: Heat[];
  foodBudget?: FoodBudget[];
  access?: AccessNeed[];
}

export interface TemplateVariant {
  id: string;
  /** Allergy tags that rule this variant out. */
  avoidAllergyTags?: string[];
  /** True when the wording suggests animal foods (excluded for vegetarian). */
  animalBased?: boolean;
  /** Variant applies only when the person's context matches. */
  when?: ContextMatch;
  /** Upper bound on {minutes} when this variant is used (e.g. shorter walk on shift days). */
  capMinutes?: number;
  text: Record<Lang, LocalText>;
}

export interface TemplateItem {
  id: string;
  technique: TechniqueId;
  /** Item appears only when one of its variants matches the context (level 2 and up). */
  conditional?: boolean;
  /** Item is dropped when the context matches this. */
  skipWhen?: ContextMatch;
  variants: TemplateVariant[];
}

export interface LadderLevel {
  level: number;
  itemIds: string[];
}

export interface PlanTemplate {
  id: string;
  version: string;
  goalType: GoalType;
  guidanceSource: { name: string; url?: string };
  reviewStatus: 'pending_clinician_review';
  /** Referral-only templates never contain coaching content (tobacco). */
  referralOnly?: boolean;
  items: TemplateItem[];
  /** Small-step ladder: level 1 is the smallest. */
  ladder: LadderLevel[];
}

const one = (id: string, technique: TechniqueId, text: Record<Lang, LocalText>): TemplateItem => ({
  id,
  technique,
  variants: [{ id: 'default', text }]
});

/* ------------------------------------------------------------------ */
/* Movement                                                            */
/* ------------------------------------------------------------------ */

const WALK: PlanTemplate = {
  id: 'tpl-activity-walk',
  version: '1.1.0',
  goalType: 'walk',
  guidanceSource: {
    name: 'WHO — Guidelines on physical activity and sedentary behaviour (2020)',
    url: 'https://www.who.int/publications/i/item/9789240015128'
  },
  reviewStatus: 'pending_clinician_review',
  ladder: [
    { level: 1, itemIds: ['walk', 'listen'] },
    { level: 2, itemIds: ['walk', 'cool', 'listen'] },
    { level: 3, itemIds: ['walk', 'cool', 'listen'] },
    { level: 4, itemIds: ['walk', 'cool', 'listen'] }
  ],
  items: [
    {
      id: 'walk',
      technique: 'actionPlanning',
      variants: [
        {
          id: 'seated',
          when: { access: ['mobility'] },
          text: {
            en: {
              title: 'Do {minutes} minutes of gentle movement you can do seated or holding a support, around {time}.',
              reason: 'Movement counts in any form. A seated or supported version keeps the habit safe and possible.'
            },
            bn: {
              title: 'প্রায় {time}-এ {minutes} মিনিট হালকা নড়াচড়া করুন, যা বসে বা কিছু ধরে করা যায়।',
              reason: 'যেকোনো ধরনের নড়াচড়াই গুরুত্বপূর্ণ। বসে বা সহায়তা নিয়ে করলে অভ্যাসটি নিরাপদ ও সম্ভব থাকে।'
            },
            hi: {
              title: 'लगभग {time} बजे {minutes} मिनट हल्की हरकत करें, जो बैठकर या किसी सहारे को पकड़कर की जा सके।',
              reason: 'हर तरह की हरकत मायने रखती है। बैठकर या सहारे से करने पर आदत सुरक्षित और संभव रहती है।'
            },
            ur: {
              title: 'تقریباً {time} بجے {minutes} منٹ ہلکی حرکت کریں، جو بیٹھ کر یا کسی سہارے کو پکڑ کر کی جا سکے۔',
              reason: 'ہر طرح کی حرکت اہم ہے۔ بیٹھ کر یا سہارے سے کرنے پر عادت محفوظ اور ممکن رہتی ہے۔'
            }
          }
        },
        {
          id: 'afterIftar',
          when: { fasting: ['ramadan'] },
          text: {
            en: {
              title: 'During Ramadan, walk {minutes} minutes at an easy pace after iftar, once you have had water.',
              reason: 'Walking while fasting in the heat is harder. After iftar you have had water and it is cooler.'
            },
            bn: {
              title: 'রমজানে ইফতারের পর পানি পান করে ধীর গতিতে {minutes} মিনিট হাঁটুন।',
              reason: 'গরমে রোজা রেখে হাঁটা কঠিন। ইফতারের পর পানি পান করা হয় এবং আবহাওয়াও ঠান্ডা থাকে।'
            },
            hi: {
              title: 'रमज़ान में इफ़्तार के बाद पानी पीकर धीमी चाल से {minutes} मिनट टहलें।',
              reason: 'गर्मी में रोज़ा रखकर चलना कठिन है। इफ़्तार के बाद आपने पानी पी लिया होता है और मौसम ठंडा होता है।'
            },
            ur: {
              title: 'رمضان میں افطار کے بعد پانی پی کر آہستہ رفتار سے {minutes} منٹ چہل قدمی کریں۔',
              reason: 'گرمی میں روزے کی حالت میں چلنا مشکل ہے۔ افطار کے بعد آپ پانی پی چکے ہوتے ہیں اور موسم ٹھنڈا ہوتا ہے۔'
            }
          }
        },
        {
          id: 'shiftShort',
          when: { shiftWork: ['night', 'rotating'] },
          capMinutes: 10,
          text: {
            en: {
              title: 'On shift days, keep it short: walk {minutes} minutes around {time}, before or after your shift.',
              reason: 'A short walk that fits around a shift is easier to keep than a long one you end up skipping.'
            },
            bn: {
              title: 'শিফটের দিনে ছোট রাখুন: শিফটের আগে বা পরে প্রায় {time}-এ {minutes} মিনিট হাঁটুন।',
              reason: 'শিফটের সঙ্গে মানিয়ে নেওয়া ছোট হাঁটা, বাদ পড়ে যাওয়া লম্বা হাঁটার চেয়ে ধরে রাখা সহজ।'
            },
            hi: {
              title: 'शिफ़्ट वाले दिनों में इसे छोटा रखें: शिफ़्ट से पहले या बाद में लगभग {time} बजे {minutes} मिनट टहलें।',
              reason: 'शिफ़्ट के साथ फ़िट होने वाली छोटी सैर, छूट जाने वाली लंबी सैर से निभाना आसान है।'
            },
            ur: {
              title: 'شفٹ والے دنوں میں اسے مختصر رکھیں: شفٹ سے پہلے یا بعد تقریباً {time} بجے {minutes} منٹ چہل قدمی کریں۔',
              reason: 'شفٹ کے ساتھ فٹ ہونے والی مختصر چہل قدمی، چھوٹ جانے والی لمبی چہل قدمی سے نبھانا آسان ہے۔'
            }
          }
        },
        {
          id: 'default',
          text: {
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
          }
        }
      ]
    },
    {
      ...one('cool', 'promptsCues', {
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
      skipWhen: { heat: ['mild'] }
    },
    one('listen', 'selfMonitoring', {
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

/* ------------------------------------------------------------------ */
/* Sleep                                                               */
/* ------------------------------------------------------------------ */

const SLEEP: PlanTemplate = {
  id: 'tpl-sleep-routine',
  version: '1.1.0',
  goalType: 'sleep',
  guidanceSource: { name: 'General sleep-hygiene advice (clinician review pending)' },
  reviewStatus: 'pending_clinician_review',
  ladder: [
    { level: 1, itemIds: ['winddown'] },
    { level: 2, itemIds: ['winddown', 'regular'] },
    { level: 3, itemIds: ['winddown', 'regular', 'caffeine'] }
  ],
  items: [
    one('winddown', 'promptsCues', {
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
    one('regular', 'actionPlanning', {
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
    one('caffeine', 'actionPlanning', {
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
    }),
    {
      id: 'shiftSleep',
      technique: 'actionPlanning',
      conditional: true,
      variants: [
        {
          id: 'default',
          when: { shiftWork: ['night', 'rotating'] },
          text: {
            en: {
              title: 'After a night shift, sleep in a dark, quiet room, and keep the same sleep window on shift days.',
              reason: 'A steady, dark sleep window helps the body adjust to shift work.'
            },
            bn: {
              title: 'নাইট শিফটের পর অন্ধকার, শান্ত ঘরে ঘুমান এবং শিফটের দিনগুলোতে একই ঘুমের সময় রাখুন।',
              reason: 'নিয়মিত ও অন্ধকার ঘুমের সময় শরীরকে শিফটের কাজের সঙ্গে মানিয়ে নিতে সাহায্য করে।'
            },
            hi: {
              title: 'नाइट शिफ़्ट के बाद अँधेरे, शांत कमरे में सोएँ और शिफ़्ट वाले दिनों में सोने का एक ही समय रखें।',
              reason: 'नियमित और अँधेरी नींद का समय शरीर को शिफ़्ट के काम के अनुसार ढलने में मदद करता है।'
            },
            ur: {
              title: 'نائٹ شفٹ کے بعد اندھیرے، پرسکون کمرے میں سوئیں اور شفٹ والے دنوں میں سونے کا ایک ہی وقت رکھیں۔',
              reason: 'باقاعدہ اور اندھیرا نیند کا وقت جسم کو شفٹ کے کام کے مطابق ڈھلنے میں مدد دیتا ہے۔'
            }
          }
        }
      ]
    }
  ]
};

/* ------------------------------------------------------------------ */
/* Nutrition                                                           */
/* ------------------------------------------------------------------ */

const PROTEIN_REASON: Record<Lang, string> = {
  en: 'Protein foods help you feel full and are part of a balanced plate.',
  bn: 'প্রোটিন-খাবার পেট ভরা অনুভব করতে সাহায্য করে এবং সুষম থালার অংশ।',
  hi: 'प्रोटीन वाला खाना पेट भरा महसूस कराता है और संतुलित थाली का हिस्सा है।',
  ur: 'پروٹین والی غذا پیٹ بھرا محسوس کراتی ہے اور متوازن پلیٹ کا حصہ ہے۔'
};

const BUDGET_REASON: Record<Lang, string> = {
  en: 'A balanced plate does not need expensive food.',
  bn: 'সুষম থালার জন্য দামি খাবার লাগে না।',
  hi: 'संतुलित थाली के लिए महँगा खाना ज़रूरी नहीं।',
  ur: 'متوازن پلیٹ کے لیے مہنگا کھانا ضروری نہیں۔'
};

const EATING: PlanTemplate = {
  id: 'tpl-eating-balanced-local',
  version: '1.1.0',
  goalType: 'eating',
  guidanceSource: {
    name: 'WHO — Healthy diet (fact sheet)',
    url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet'
  },
  reviewStatus: 'pending_clinician_review',
  ladder: [
    { level: 1, itemIds: ['plate'] },
    { level: 2, itemIds: ['plate', 'protein'] },
    { level: 3, itemIds: ['plate', 'protein', 'regular'] }
  ],
  items: [
    one('plate', 'actionPlanning', {
      en: {
        title:
          'At lunch and dinner, fill about half your plate with vegetables (for example shak, bhaji or sabzi), with a smaller portion of rice or roti.',
        reason:
          'Vegetables add fibre and variety, and a slightly smaller portion of rice or roti is an easy change to repeat.'
      },
      bn: {
        title:
          'দুপুর ও রাতের খাবারে থালার প্রায় অর্ধেক সবজি (যেমন শাক, ভাজি বা সবজি) রাখুন, ভাত বা রুটি অল্প পরিমাণে।',
        reason: 'সবজিতে আঁশ ও বৈচিত্র্য থাকে, আর ভাত বা রুটির পরিমাণ একটু কমানো সহজে বারবার করা যায়।'
      },
      hi: {
        title:
          'दोपहर और रात के खाने में थाली का लगभग आधा हिस्सा सब्ज़ियों (जैसे साग, भाजी या सब्ज़ी) से भरें, चावल या रोटी कम मात्रा में।',
        reason: 'सब्ज़ियाँ रेशा और विविधता देती हैं, और चावल या रोटी थोड़ी कम करना आसानी से दोहराया जा सकता है।'
      },
      ur: {
        title:
          'دوپہر اور رات کے کھانے میں پلیٹ کا تقریباً آدھا حصہ سبزیوں (مثلاً ساگ، بھاجی یا سبزی) سے بھریں، چاول یا روٹی کم مقدار میں۔',
        reason: 'سبزیاں ریشہ اور ورائٹی دیتی ہیں، اور چاول یا روٹی ذرا کم کرنا آسانی سے دہرایا جا سکتا ہے۔'
      }
    }),
    {
      id: 'protein',
      technique: 'actionPlanning',
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
    one('regular', 'promptsCues', {
      en: {
        title: 'Eat at regular times and drink water through the day. Do not skip a meal to make up for a big one.',
        reason: 'Regular meals and water support steady energy. Skipping meals can lead to eating more later.'
      },
      bn: {
        title: 'নির্দিষ্ট সময়ে খান এবং সারা দিন পানি পান করুন। বড় খাবারের পর পূরণ করতে পরের বেলা বাদ দেবেন না।',
        reason: 'নিয়মিত খাবার ও পানি স্থির শক্তি দিতে সাহায্য করে। খাবার বাদ দিলে পরে বেশি খাওয়ার ঝোঁক হতে পারে।'
      },
      hi: {
        title: 'तय समय पर खाएँ और दिन भर पानी पिएँ। बड़े भोजन की भरपाई के लिए अगला भोजन न छोड़ें।',
        reason: 'नियमित भोजन और पानी स्थिर ऊर्जा देने में मदद करते हैं। भोजन छोड़ने से बाद में ज़्यादा खाने की प्रवृत्ति हो सकती है।'
      },
      ur: {
        title: 'مقررہ اوقات پر کھائیں اور دن بھر پانی پئیں۔ بڑے کھانے کی تلافی کے لیے اگلا کھانا نہ چھوڑیں۔',
        reason: 'باقاعدہ کھانا اور پانی مستحکم توانائی دینے میں مدد کرتے ہیں۔ کھانا چھوڑنے سے بعد میں زیادہ کھانے کا رجحان ہو سکتا ہے۔'
      }
    }),
    {
      id: 'budget',
      technique: 'actionPlanning',
      conditional: true,
      variants: [
        {
          id: 'default',
          when: { foodBudget: ['low'] },
          animalBased: true,
          avoidAllergyTags: ['egg'],
          text: {
            en: { title: 'Low-cost choices work well: dal, seasonal vegetables, eggs, and rice or roti.', reason: BUDGET_REASON.en },
            bn: { title: 'কম খরচের খাবারও ভালো: ডাল, মৌসুমি সবজি, ডিম এবং ভাত বা রুটি।', reason: BUDGET_REASON.bn },
            hi: { title: 'कम खर्च वाले विकल्प भी अच्छे हैं: दाल, मौसमी सब्ज़ियाँ, अंडे, और चावल या रोटी।', reason: BUDGET_REASON.hi },
            ur: { title: 'کم خرچ انتخاب بھی اچھے ہیں: دال، موسمی سبزیاں، انڈے، اور چاول یا روٹی۔', reason: BUDGET_REASON.ur }
          }
        },
        {
          id: 'plant',
          when: { foodBudget: ['low'] },
          avoidAllergyTags: ['legumes'],
          text: {
            en: { title: 'Low-cost choices work well: dal, chickpeas, seasonal vegetables, and rice or roti.', reason: BUDGET_REASON.en },
            bn: { title: 'কম খরচের খাবারও ভালো: ডাল, ছোলা, মৌসুমি সবজি এবং ভাত বা রুটি।', reason: BUDGET_REASON.bn },
            hi: { title: 'कम खर्च वाले विकल्प भी अच्छे हैं: दाल, चना, मौसमी सब्ज़ियाँ, और चावल या रोटी।', reason: BUDGET_REASON.hi },
            ur: { title: 'کم خرچ انتخاب بھی اچھے ہیں: دال، چنے، موسمی سبزیاں، اور چاول یا روٹی۔', reason: BUDGET_REASON.ur }
          }
        },
        {
          id: 'generic',
          when: { foodBudget: ['low'] },
          text: {
            en: { title: 'Choose low-cost foods that suit you.', reason: BUDGET_REASON.en },
            bn: { title: 'আপনার উপযোগী কম খরচের খাবার বেছে নিন।', reason: BUDGET_REASON.bn },
            hi: { title: 'अपने अनुकूल कम खर्च वाला खाना चुनें।', reason: BUDGET_REASON.hi },
            ur: { title: 'اپنے موافق کم خرچ کھانا چنیں۔', reason: BUDGET_REASON.ur }
          }
        }
      ]
    },
    {
      id: 'ramadanEat',
      technique: 'actionPlanning',
      conditional: true,
      variants: [
        {
          id: 'default',
          when: { fasting: ['ramadan'] },
          text: {
            en: {
              title: 'In Ramadan, include protein and water at suhoor, and start iftar with water, eating slowly.',
              reason: 'Steady meals around the fast support energy without extreme eating.'
            },
            bn: {
              title: 'রমজানে সেহরিতে প্রোটিন ও পানি রাখুন, আর ইফতার শুরু করুন পানি দিয়ে, ধীরে খান।',
              reason: 'রোজার আশেপাশে নিয়মিত খাবার অতিরিক্ত খাওয়া ছাড়াই শক্তি জোগায়।'
            },
            hi: {
              title: 'रमज़ान में सहरी में प्रोटीन और पानी लें, और इफ़्तार पानी से शुरू करके धीरे खाएँ।',
              reason: 'रोज़े के आसपास नियमित भोजन बिना अति के ऊर्जा देता है।'
            },
            ur: {
              title: 'رمضان میں سحری میں پروٹین اور پانی لیں، اور افطار پانی سے شروع کر کے آہستہ کھائیں۔',
              reason: 'روزے کے آس پاس باقاعدہ کھانا بغیر زیادتی کے توانائی دیتا ہے۔'
            }
          }
        }
      ]
    }
  ]
};

/* ------------------------------------------------------------------ */
/* Medicine routine                                                    */
/* ------------------------------------------------------------------ */

const MEDICINE: PlanTemplate = {
  id: 'tpl-medicine-routine',
  version: '1.1.0',
  goalType: 'medicine',
  guidanceSource: { name: 'Routine and reminder-based adherence support (clinician review pending)' },
  reviewStatus: 'pending_clinician_review',
  ladder: [
    { level: 1, itemIds: ['time', 'ask'] },
    { level: 2, itemIds: ['time', 'cue', 'ask'] }
  ],
  items: [
    one('time', 'promptsCues', {
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
    one('cue', 'promptsCues', {
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
    one('ask', 'socialSupport', {
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

/* ------------------------------------------------------------------ */
/* Tobacco: referral only                                              */
/* ------------------------------------------------------------------ */

const TOBACCO: PlanTemplate = {
  id: 'tpl-tobacco-referral',
  version: '1.0.0',
  goalType: 'tobacco',
  guidanceSource: { name: 'Referral only: licensed cessation services (clinician review pending)' },
  reviewStatus: 'pending_clinician_review',
  referralOnly: true,
  ladder: [
    { level: 1, itemIds: ['refer', 'noadvice'] },
    { level: 2, itemIds: ['refer', 'support', 'noadvice'] }
  ],
  items: [
    one('refer', 'socialSupport', {
      en: {
        title: 'Talk to a licensed tobacco-cessation service or your clinician about quitting or cutting down.',
        reason:
          'Licensed services can offer proven support safely. Thypro does not give advice on nicotine products or medicines.'
      },
      bn: {
        title: 'তামাক ছাড়া বা কমানোর বিষয়ে একটি লাইসেন্সপ্রাপ্ত তামাক-ত্যাগ সেবা বা আপনার চিকিৎসকের সঙ্গে কথা বলুন।',
        reason: 'লাইসেন্সপ্রাপ্ত সেবা নিরাপদে প্রমাণিত সহায়তা দিতে পারে। থাইপ্রো নিকোটিন পণ্য বা ওষুধ নিয়ে পরামর্শ দেয় না।'
      },
      hi: {
        title: 'तंबाकू छोड़ने या कम करने के बारे में किसी लाइसेंस प्राप्त तंबाकू-मुक्ति सेवा या अपने चिकित्सक से बात करें।',
        reason:
          'लाइसेंस प्राप्त सेवाएँ सुरक्षित रूप से प्रमाणित सहायता दे सकती हैं। थाइप्रो निकोटीन उत्पादों या दवाओं पर सलाह नहीं देता।'
      },
      ur: {
        title: 'تمباکو چھوڑنے یا کم کرنے کے بارے میں کسی لائسنس یافتہ ترکِ تمباکو سروس یا اپنے معالج سے بات کریں۔',
        reason: 'لائسنس یافتہ سروسز محفوظ طریقے سے ثابت شدہ مدد دے سکتی ہیں۔ تھائی پرو نکوٹین مصنوعات یا ادویات پر مشورہ نہیں دیتا۔'
      }
    }),
    one('support', 'socialSupport', {
      en: {
        title: 'Tell one person you trust that you are thinking about quitting.',
        reason: 'Support from people around you can make change easier.'
      },
      bn: {
        title: 'আপনি ছাড়ার কথা ভাবছেন—এটি একজন বিশ্বস্ত মানুষকে বলুন।',
        reason: 'আশেপাশের মানুষের সহায়তা পরিবর্তনকে সহজ করতে পারে।'
      },
      hi: {
        title: 'किसी एक भरोसेमंद व्यक्ति को बताएँ कि आप छोड़ने के बारे में सोच रहे हैं।',
        reason: 'आसपास के लोगों का साथ बदलाव को आसान बना सकता है।'
      },
      ur: {
        title: 'کسی ایک بھروسے مند شخص کو بتائیں کہ آپ چھوڑنے کا سوچ رہے ہیں۔',
        reason: 'آس پاس کے لوگوں کا ساتھ تبدیلی کو آسان بنا سکتا ہے۔'
      }
    }),
    one('noadvice', 'socialSupport', {
      en: {
        title:
          'Thypro will not suggest nicotine products, medicines or doses. Those decisions belong to a licensed professional.',
        reason: 'This keeps advice about medicines with the people qualified to give it.'
      },
      bn: {
        title: 'থাইপ্রো নিকোটিন পণ্য, ওষুধ বা ডোজের পরামর্শ দেবে না। এসব সিদ্ধান্ত লাইসেন্সপ্রাপ্ত পেশাদারের।',
        reason: 'এতে ওষুধ-সংক্রান্ত পরামর্শ যোগ্য মানুষের কাছেই থাকে।'
      },
      hi: {
        title: 'थाइप्रो निकोटीन उत्पाद, दवाएँ या खुराक नहीं सुझाएगा। ये निर्णय लाइसेंस प्राप्त विशेषज्ञ के हैं।',
        reason: 'इससे दवाओं की सलाह योग्य लोगों के पास ही रहती है।'
      },
      ur: {
        title: 'تھائی پرو نکوٹین مصنوعات، ادویات یا خوراک تجویز نہیں کرے گا۔ یہ فیصلے لائسنس یافتہ ماہر کے ہیں۔',
        reason: 'اس طرح ادویات کا مشورہ اہل لوگوں کے پاس ہی رہتا ہے۔'
      }
    })
  ]
};

export const TEMPLATE_LIBRARY: readonly PlanTemplate[] = [WALK, EATING, SLEEP, TOBACCO, MEDICINE];

export function getTemplate(goalType: GoalType): PlanTemplate {
  const t = TEMPLATE_LIBRARY.find((x) => x.goalType === goalType);
  if (!t) throw new Error(`No approved template for goal "${goalType}"`);
  return t;
}

export function getTemplateById(id: string): PlanTemplate | undefined {
  return TEMPLATE_LIBRARY.find((x) => x.id === id);
}

export function maxLevel(goalType: GoalType): number {
  return getTemplate(goalType).ladder.length;
}

export function matchesContext(when: ContextMatch | undefined, ctx: ContextProfile): boolean {
  if (!when) return true;
  if (when.shiftWork && !when.shiftWork.includes(ctx.shiftWork)) return false;
  if (when.fasting && !when.fasting.includes(ctx.fasting)) return false;
  if (when.heat && !when.heat.includes(ctx.heat)) return false;
  if (when.foodBudget && !when.foodBudget.includes(ctx.foodBudget)) return false;
  if (when.access && !when.access.some((a) => ctx.access.includes(a))) return false;
  return true;
}

/**
 * Picks the first variant whose context condition matches and which does not
 * conflict with dietary practice or allergies. Context-specific variants are
 * listed before the default, so they win when they apply.
 */
export function pickVariant(
  item: TemplateItem,
  dietary: readonly DietaryPractice[],
  allergyTags: readonly string[],
  ctx?: ContextProfile
): TemplateVariant | null {
  const vegetarian = dietary.includes('vegetarian');
  const candidates = item.variants.filter((v) => {
    if (v.when && (!ctx || !matchesContext(v.when, ctx))) return false;
    if (v.animalBased && vegetarian) return false;
    if (v.avoidAllergyTags?.some((tag) => allergyTags.includes(tag))) return false;
    return true;
  });
  if (candidates.length > 0) return candidates[0];
  // Nothing safe matched: a conditional item is simply left out; otherwise use the last (most generic) variant.
  return item.conditional ? null : item.variants[item.variants.length - 1];
}

function interpolate(text: string, params: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (_, k: string) => (k in params ? String(params[k]) : `{${k}}`));
}

export interface ResolvedPlanItem {
  id: string;
  title: string;
  reason: string;
  templateId: string;
  technique: TechniqueId;
  guidanceSource: { name: string; url?: string };
}

/** Resolves a stored plan item to display text. Falls back to English if a translation is missing. */
export function resolvePlanItem(plan: Pick<Plan, 'templateId'>, item: PlanItem, lang: Lang): ResolvedPlanItem | null {
  const template = getTemplateById(plan.templateId);
  const tItem = template?.items.find((i) => i.id === item.templateItemId);
  const variant = tItem?.variants.find((v) => v.id === item.variant) ?? tItem?.variants[tItem.variants.length - 1];
  if (!template || !tItem || !variant) return null;
  const text = variant.text[lang] ?? variant.text.en;
  return {
    id: item.id,
    title: interpolate(text.title, item.params),
    reason: interpolate(text.reason, item.params),
    templateId: template.id,
    technique: tItem.technique,
    guidanceSource: template.guidanceSource
  };
}
