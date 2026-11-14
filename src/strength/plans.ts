/**
 * Starter plans. They load as ordinary, editable-by-swap routines and carry
 * no clinical claim: they are conservative defaults pending review by a
 * physiotherapist (owner: see strength/safety.ts).
 */

import type { Lang } from '../domain/types';
import type { Prescription, Routine, StarterPlan } from './types';

const rx = (exerciseId: string, sets: number, min: number, max: number, restSec: number): Prescription => ({
  exerciseId,
  sets,
  min,
  max,
  restSec
});

const nm = (en: string, bn: string, hi: string, ur: string): Record<Lang, string> => ({ en, bn, hi, ur });

const BASICS_A: Routine = {
  id: 'basics-a',
  name: nm('Session A', 'সেশন এ', 'सत्र ए', 'سیشن اے'),
  items: [
    rx('sit-to-stand', 2, 8, 12, 60),
    rx('wall-push-up', 2, 8, 12, 60),
    rx('band-row', 2, 10, 15, 60),
    rx('glute-bridge', 2, 10, 15, 45),
    rx('dead-bug', 2, 6, 10, 45)
  ]
};
const BASICS_B: Routine = {
  id: 'basics-b',
  name: nm('Session B', 'সেশন বি', 'सत्र बी', 'سیشن بی'),
  items: [
    rx('step-up', 2, 8, 12, 60),
    rx('incline-push-up', 2, 6, 10, 60),
    rx('band-pull-apart', 2, 12, 15, 45),
    rx('calf-raise', 2, 10, 15, 45),
    rx('bird-dog', 2, 6, 10, 45),
    rx('single-leg-stand', 2, 15, 30, 30)
  ]
};

const FULL_A: Routine = {
  id: 'full-a',
  name: nm('Full body A', 'পুরো শরীর এ', 'पूरा शरीर ए', 'پورا جسم اے'),
  items: [
    rx('goblet-squat', 3, 8, 12, 90),
    rx('floor-press', 3, 8, 12, 90),
    rx('dumbbell-row', 3, 8, 12, 90),
    rx('hip-hinge', 2, 8, 12, 90),
    rx('knee-plank', 2, 20, 40, 45)
  ]
};
const FULL_B: Routine = {
  id: 'full-b',
  name: nm('Full body B', 'পুরো শরীর বি', 'पूरा शरीर बी', 'پورا جسم بی'),
  items: [
    rx('step-up', 3, 8, 12, 90),
    rx('shoulder-press', 3, 8, 12, 90),
    rx('band-row', 3, 10, 15, 60),
    rx('biceps-curl', 2, 8, 12, 60),
    rx('calf-raise', 2, 10, 15, 45),
    rx('side-plank-knee', 2, 15, 30, 45)
  ]
};

const MOVE_A: Routine = {
  id: 'move-a',
  name: nm('Loosen up', 'শরীর আলগা করা', 'शरीर ढीला करना', 'جسم ڈھیلا کرنا'),
  items: [
    rx('cat-cow', 2, 8, 12, 20),
    rx('shoulder-circles', 2, 8, 12, 20),
    rx('open-book', 2, 6, 10, 20),
    rx('hip-flexor-stretch', 2, 20, 40, 20),
    rx('hamstring-stretch', 2, 20, 40, 20)
  ]
};
const MOVE_B: Routine = {
  id: 'move-b',
  name: nm('Steady on your feet', 'পায়ে স্থির থাকা', 'पैरों पर स्थिर रहना', 'پاؤں پر مستحکم رہنا'),
  items: [
    rx('seated-march', 2, 10, 20, 30),
    rx('single-leg-stand', 3, 15, 30, 30),
    rx('heel-to-toe', 2, 8, 14, 30),
    rx('calf-raise', 2, 10, 15, 30),
    rx('band-press-out', 2, 8, 12, 30)
  ]
};

export const STARTER_PLANS: StarterPlan[] = [
  {
    id: 'basics',
    name: nm('Chair and wall basics', 'চেয়ার ও দেয়াল দিয়ে শুরু', 'कुर्सी और दीवार से शुरुआत', 'کرسی اور دیوار سے آغاز'),
    blurb: nm(
      'No weights. Two short sessions that take turns. A good first step.',
      'কোনো ওজন লাগে না। পালা করে দুটি ছোট সেশন। শুরুর জন্য ভালো।',
      'कोई वज़न नहीं। बारी-बारी से दो छोटे सत्र। शुरुआत के लिए अच्छा।',
      'کوئی وزن نہیں۔ باری باری دو مختصر سیشن۔ آغاز کے لیے اچھا۔'
    ),
    mode: 'rotation',
    routines: [BASICS_A, BASICS_B],
    weekdays: [null, null, null, null, null, null, null],
    minutes: 20,
    needs: ['chair', 'wall', 'band']
  },
  {
    id: 'full-body',
    name: nm('Full body, three days', 'পুরো শরীর, সপ্তাহে তিন দিন', 'पूरा शरीर, हफ़्ते में तीन दिन', 'پورا جسم، ہفتے میں تین دن'),
    blurb: nm(
      'Monday, Wednesday, Friday with light dumbbells. Weights go up slowly.',
      'সোম, বুধ, শুক্র; হালকা ডাম্বেল দিয়ে। ওজন ধীরে বাড়ে।',
      'सोमवार, बुधवार, शुक्रवार; हल्के डम्बल के साथ। वज़न धीरे-धीरे बढ़ता है।',
      'پیر، بدھ، جمعہ؛ ہلکے ڈمبل کے ساتھ۔ وزن آہستہ آہستہ بڑھتا ہے۔'
    ),
    mode: 'weekly',
    routines: [FULL_A, FULL_B],
    weekdays: ['full-a', null, 'full-b', null, 'full-a', null, null],
    minutes: 35,
    needs: ['dumbbell', 'chair', 'band']
  },
  {
    id: 'balance-mobility',
    name: nm('Balance and mobility', 'ভারসাম্য ও নমনীয়তা', 'संतुलन और लचीलापन', 'توازن اور لچک'),
    blurb: nm(
      'Gentle stretching and balance work you can do most days.',
      'হালকা স্ট্রেচিং ও ভারসাম্যের কাজ, প্রায় প্রতিদিন করা যায়।',
      'हल्की स्ट्रेचिंग और संतुलन का अभ्यास, लगभग रोज़ किया जा सकता है।',
      'ہلکی اسٹریچنگ اور توازن کی مشق، تقریباً روز کی جا سکتی ہے۔'
    ),
    mode: 'rotation',
    routines: [MOVE_A, MOVE_B],
    weekdays: [null, null, null, null, null, null, null],
    minutes: 15,
    needs: ['chair', 'wall']
  }
];

export function getStarter(id: string): StarterPlan | undefined {
  return STARTER_PLANS.find((p) => p.id === id);
}
