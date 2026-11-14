/**
 * A small hand-picked library of gentle strength, balance and mobility
 * movements. Each has a short "how" in four languages. The wording is the
 * engineering team's own and needs native-speaker and physiotherapist review
 * before any public pilot.
 */

import type { Exercise } from './types';

type T = Exercise['t'];

const ex = (e: Omit<Exercise, 't'> & { t: T }): Exercise => e;

export const EXERCISES: Exercise[] = [
  ex({
    id: 'sit-to-stand', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: 'chair', load: 'bodyweight',
    t: {
      en: ['Sit-to-stand', 'Sit on a sturdy chair. Lean forward, stand up fully, then sit back down slowly.'],
      bn: ['চেয়ার থেকে উঠা-বসা', 'শক্ত চেয়ারে বসুন। সামনে ঝুঁকে পুরো দাঁড়ান, তারপর ধীরে বসুন।'],
      hi: ['कुर्सी से उठना-बैठना', 'मज़बूत कुर्सी पर बैठें। आगे झुकें, पूरे खड़े हों, फिर धीरे से बैठें।'],
      ur: ['کرسی سے اٹھنا بیٹھنا', 'مضبوط کرسی پر بیٹھیں۔ آگے جھکیں، پورے کھڑے ہوں، پھر آہستہ بیٹھ جائیں۔']
    }
  }),
  ex({
    id: 'goblet-squat', pattern: 'squat', muscles: ['quads', 'glutes', 'core'], equipment: 'dumbbell', load: 'weight', startKg: 4, stepKg: 1,
    t: {
      en: ['Dumbbell squat', 'Hold one dumbbell at your chest. Bend your knees and hips, keep your chest up, then stand.'],
      bn: ['ডাম্বেল স্কোয়াট', 'বুকের কাছে একটি ডাম্বেল ধরুন। হাঁটু ও কোমর বাঁকান, বুক সোজা রাখুন, তারপর দাঁড়ান।'],
      hi: ['डम्बल स्क्वाट', 'छाती के पास एक डम्बल पकड़ें। घुटने और कमर मोड़ें, छाती सीधी रखें, फिर खड़े हों।'],
      ur: ['ڈمبل اسکوائٹ', 'سینے کے پاس ایک ڈمبل پکڑیں۔ گھٹنے اور کولہے موڑیں، سینہ سیدھا رکھیں، پھر کھڑے ہوں۔']
    }
  }),
  ex({
    id: 'wall-sit', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: 'wall', load: 'hold',
    t: {
      en: ['Wall sit', 'Lean your back on a wall and slide down a little. Hold, breathing normally.'],
      bn: ['দেয়ালে বসা', 'দেয়ালে পিঠ ঠেকিয়ে একটু নিচে নামুন। স্বাভাবিক শ্বাসে ধরে রাখুন।'],
      hi: ['दीवार के सहारे बैठना', 'दीवार से पीठ टिकाकर थोड़ा नीचे खिसकें। सामान्य साँस के साथ रुकें।'],
      ur: ['دیوار کے سہارے بیٹھنا', 'دیوار سے کمر لگا کر تھوڑا نیچے کھسکیں۔ عام سانس کے ساتھ رکے رہیں۔']
    }
  }),
  ex({
    id: 'step-up', pattern: 'squat', muscles: ['quads', 'glutes'], equipment: 'chair', load: 'bodyweight',
    t: {
      en: ['Step-up', 'Step onto a low, stable step with one foot, stand tall, then step down. Hold a rail if needed.'],
      bn: ['স্টেপ-আপ', 'নিচু শক্ত ধাপে এক পা তুলে সোজা দাঁড়ান, তারপর নামুন। দরকারে রেলিং ধরুন।'],
      hi: ['स्टेप-अप', 'नीची, मज़बूत सीढ़ी पर एक पैर रखकर सीधे खड़े हों, फिर उतरें। ज़रूरत हो तो रेलिंग पकड़ें।'],
      ur: ['اسٹیپ اپ', 'نیچی مضبوط سیڑھی پر ایک پاؤں رکھ کر سیدھے کھڑے ہوں، پھر اتریں۔ ضرورت ہو تو ریلنگ پکڑیں۔']
    }
  }),
  ex({
    id: 'calf-raise', pattern: 'squat', muscles: ['calves'], equipment: 'wall', load: 'bodyweight',
    t: {
      en: ['Calf raise', 'Stand with a hand on a wall. Rise onto your toes, pause, then lower slowly.'],
      bn: ['পায়ের গোড়ালি তোলা', 'দেয়ালে হাত রেখে দাঁড়ান। পায়ের আঙুলে উঠুন, থামুন, ধীরে নামুন।'],
      hi: ['पिंडली उठाना', 'दीवार पर हाथ रखकर खड़े हों। पंजों पर उठें, रुकें, फिर धीरे से नीचे आएँ।'],
      ur: ['پنڈلی اٹھانا', 'دیوار پر ہاتھ رکھ کر کھڑے ہوں۔ پنجوں پر اٹھیں، رکیں، پھر آہستہ نیچے آئیں۔']
    }
  }),
  ex({
    id: 'glute-bridge', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Glute bridge', 'Lie on your back, knees bent. Press your feet down and lift your hips, then lower slowly.'],
      bn: ['গ্লুট ব্রিজ', 'হাঁটু বাঁকিয়ে চিত হয়ে শুয়ে পড়ুন। পা চেপে কোমর তুলুন, তারপর ধীরে নামান।'],
      hi: ['ग्लूट ब्रिज', 'घुटने मोड़कर पीठ के बल लेटें। पैर दबाकर कूल्हे उठाएँ, फिर धीरे से नीचे लाएँ।'],
      ur: ['گلوٹ برج', 'گھٹنے موڑ کر کمر کے بل لیٹیں۔ پاؤں دبا کر کولہے اٹھائیں، پھر آہستہ نیچے لائیں۔']
    }
  }),
  ex({
    id: 'hip-hinge', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back'], equipment: 'dumbbell', load: 'weight', startKg: 4, stepKg: 1,
    t: {
      en: ['Dumbbell hip hinge', 'Hold dumbbells in front. Push your hips back with a flat back, feel the back of your legs, then stand.'],
      bn: ['ডাম্বেল হিপ হিঞ্জ', 'সামনে ডাম্বেল ধরুন। পিঠ সোজা রেখে কোমর পিছনে ঠেলুন, পায়ের পিছনে টান অনুভব করুন, তারপর দাঁড়ান।'],
      hi: ['डम्बल हिप हिंज', 'सामने डम्बल पकड़ें। पीठ सीधी रखकर कूल्हे पीछे धकेलें, पैरों के पीछे खिंचाव महसूस करें, फिर खड़े हों।'],
      ur: ['ڈمبل ہپ ہنج', 'سامنے ڈمبل پکڑیں۔ کمر سیدھی رکھ کر کولہے پیچھے دھکیلیں، ٹانگوں کے پیچھے کھنچاؤ محسوس کریں، پھر کھڑے ہوں۔']
    }
  }),
  ex({
    id: 'wall-push-up', pattern: 'push', muscles: ['chest', 'shoulders', 'arms'], equipment: 'wall', load: 'bodyweight',
    t: {
      en: ['Wall push-up', 'Hands on a wall, arms straight. Bend your elbows to bring your chest to the wall, then push back.'],
      bn: ['দেয়ালে পুশ-আপ', 'দেয়ালে হাত রেখে হাত সোজা করুন। কনুই বাঁকিয়ে বুক দেয়ালের কাছে আনুন, তারপর ঠেলে ফিরুন।'],
      hi: ['दीवार पर पुश-अप', 'दीवार पर हाथ रखें, बाँहें सीधी। कोहनियाँ मोड़कर छाती दीवार के पास लाएँ, फिर धकेलें।'],
      ur: ['دیوار پر پش اپ', 'دیوار پر ہاتھ رکھیں، بازو سیدھے۔ کہنیاں موڑ کر سینہ دیوار کے پاس لائیں، پھر دھکیلیں۔']
    }
  }),
  ex({
    id: 'incline-push-up', pattern: 'push', muscles: ['chest', 'shoulders', 'arms'], equipment: 'chair', load: 'bodyweight',
    t: {
      en: ['Incline push-up', 'Hands on a steady counter or chair seat, body in a line. Lower your chest, then press up.'],
      bn: ['ঢালু পুশ-আপ', 'স্থির কাউন্টার বা চেয়ারে হাত রাখুন, শরীর সোজা। বুক নামান, তারপর ঠেলে উঠুন।'],
      hi: ['झुका हुआ पुश-अप', 'स्थिर काउंटर या कुर्सी पर हाथ रखें, शरीर सीधी रेखा में। छाती नीचे लाएँ, फिर ऊपर धकेलें।'],
      ur: ['ڈھلوانی پش اپ', 'مستحکم کاؤنٹر یا کرسی پر ہاتھ رکھیں، جسم سیدھا۔ سینہ نیچے لائیں، پھر اوپر دھکیلیں۔']
    }
  }),
  ex({
    id: 'floor-press', pattern: 'push', muscles: ['chest', 'arms', 'shoulders'], equipment: 'dumbbell', load: 'weight', startKg: 3, stepKg: 1,
    t: {
      en: ['Dumbbell floor press', 'Lie on the floor, knees bent. Press the dumbbells up, then lower until your arms touch the floor.'],
      bn: ['ডাম্বেল ফ্লোর প্রেস', 'হাঁটু বাঁকিয়ে মেঝেতে শুয়ে পড়ুন। ডাম্বেল ওপরে ঠেলুন, হাত মেঝে ছোঁয়া পর্যন্ত নামান।'],
      hi: ['डम्बल फ़्लोर प्रेस', 'घुटने मोड़कर फ़र्श पर लेटें। डम्बल ऊपर धकेलें, बाँहें फ़र्श छूने तक नीचे लाएँ।'],
      ur: ['ڈمبل فلور پریس', 'گھٹنے موڑ کر فرش پر لیٹیں۔ ڈمبل اوپر دھکیلیں، بازو فرش کو چھونے تک نیچے لائیں۔']
    }
  }),
  ex({
    id: 'shoulder-press', pattern: 'push', muscles: ['shoulders', 'arms'], equipment: 'dumbbell', load: 'weight', startKg: 2, stepKg: 1,
    t: {
      en: ['Seated shoulder press', 'Sit tall with dumbbells at shoulder height. Press up without arching your back, then lower.'],
      bn: ['বসে কাঁধের প্রেস', 'সোজা হয়ে বসে কাঁধের উচ্চতায় ডাম্বেল ধরুন। পিঠ না বাঁকিয়ে ওপরে ঠেলুন, তারপর নামান।'],
      hi: ['बैठकर शोल्डर प्रेस', 'सीधे बैठकर कंधे की ऊँचाई पर डम्बल पकड़ें। पीठ मोड़े बिना ऊपर धकेलें, फिर नीचे लाएँ।'],
      ur: ['بیٹھ کر کندھے کا پریس', 'سیدھے بیٹھ کر کندھے کی اونچائی پر ڈمبل پکڑیں۔ کمر موڑے بغیر اوپر دھکیلیں، پھر نیچے لائیں۔']
    }
  }),
  ex({
    id: 'band-triceps', pattern: 'push', muscles: ['arms'], equipment: 'band', load: 'bodyweight',
    t: {
      en: ['Band triceps press-down', 'Anchor a band overhead. Elbows at your sides, straighten your arms down, then return slowly.'],
      bn: ['ব্যান্ড ট্রাইসেপস', 'মাথার ওপরে ব্যান্ড আটকান। কনুই পাশে রেখে হাত নিচে সোজা করুন, ধীরে ফিরুন।'],
      hi: ['बैंड ट्राइसेप्स', 'ऊपर बैंड बाँधें। कोहनियाँ बगल में रखकर बाँहें नीचे सीधी करें, धीरे से लौटें।'],
      ur: ['بینڈ ٹرائسیپس', 'اوپر بینڈ باندھیں۔ کہنیاں پہلو میں رکھ کر بازو نیچے سیدھے کریں، آہستہ لوٹیں۔']
    }
  }),
  ex({
    id: 'band-row', pattern: 'pull', muscles: ['back', 'arms'], equipment: 'band', load: 'bodyweight',
    t: {
      en: ['Band row', 'Sit with a band around your feet. Pull your elbows back, squeeze your shoulder blades, then release.'],
      bn: ['ব্যান্ড রো', 'পায়ে ব্যান্ড জড়িয়ে বসুন। কনুই পিছনে টানুন, কাঁধের হাড় চেপে ধরুন, তারপর ছাড়ুন।'],
      hi: ['बैंड रो', 'पैरों में बैंड लगाकर बैठें। कोहनियाँ पीछे खींचें, कंधे की हड्डियाँ भींचें, फिर छोड़ें।'],
      ur: ['بینڈ رو', 'پاؤں میں بینڈ ڈال کر بیٹھیں۔ کہنیاں پیچھے کھینچیں، کندھے کی ہڈیاں بھینچیں، پھر چھوڑیں۔']
    }
  }),
  ex({
    id: 'dumbbell-row', pattern: 'pull', muscles: ['back', 'arms'], equipment: 'dumbbell', load: 'weight', startKg: 4, stepKg: 1,
    t: {
      en: ['One-arm dumbbell row', 'One hand on a chair, back flat. Pull the dumbbell to your hip, then lower with control.'],
      bn: ['এক হাতে ডাম্বেল রো', 'এক হাত চেয়ারে রাখুন, পিঠ সোজা। ডাম্বেল কোমরের দিকে টানুন, নিয়ন্ত্রণে নামান।'],
      hi: ['एक हाथ से डम्बल रो', 'एक हाथ कुर्सी पर रखें, पीठ सीधी। डम्बल कमर की ओर खींचें, नियंत्रण से नीचे लाएँ।'],
      ur: ['ایک ہاتھ سے ڈمبل رو', 'ایک ہاتھ کرسی پر رکھیں، کمر سیدھی۔ ڈمبل کولہے کی طرف کھینچیں، قابو سے نیچے لائیں۔']
    }
  }),
  ex({
    id: 'band-pull-apart', pattern: 'pull', muscles: ['back', 'shoulders'], equipment: 'band', load: 'bodyweight',
    t: {
      en: ['Band pull-apart', 'Hold a band in front at shoulder height. Pull it apart to your sides, then return slowly.'],
      bn: ['ব্যান্ড পুল-অ্যাপার্ট', 'কাঁধের উচ্চতায় সামনে ব্যান্ড ধরুন। দু পাশে টেনে ছড়ান, ধীরে ফিরুন।'],
      hi: ['बैंड पुल-अपार्ट', 'कंधे की ऊँचाई पर सामने बैंड पकड़ें। दोनों ओर खींचकर फैलाएँ, धीरे से लौटें।'],
      ur: ['بینڈ پل اپارٹ', 'کندھے کی اونچائی پر سامنے بینڈ پکڑیں۔ دونوں طرف کھینچ کر پھیلائیں، آہستہ لوٹیں۔']
    }
  }),
  ex({
    id: 'biceps-curl', pattern: 'pull', muscles: ['arms'], equipment: 'dumbbell', load: 'weight', startKg: 2, stepKg: 1,
    t: {
      en: ['Dumbbell curl', 'Elbows at your sides. Curl the dumbbells up, then lower slowly. Do not swing.'],
      bn: ['ডাম্বেল কার্ল', 'কনুই পাশে রাখুন। ডাম্বেল ওপরে তুলুন, ধীরে নামান। দোলাবেন না।'],
      hi: ['डम्बल कर्ल', 'कोहनियाँ बगल में रखें। डम्बल ऊपर उठाएँ, धीरे से नीचे लाएँ। झटका न दें।'],
      ur: ['ڈمبل کرل', 'کہنیاں پہلو میں رکھیں۔ ڈمبل اوپر اٹھائیں، آہستہ نیچے لائیں۔ جھٹکا نہ دیں۔']
    }
  }),
  ex({
    id: 'dead-bug', pattern: 'core', muscles: ['core'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Dead bug', 'Lie on your back, knees over hips. Lower the opposite arm and leg, keep your back flat, then switch.'],
      bn: ['ডেড বাগ', 'চিত হয়ে শুয়ে হাঁটু কোমরের ওপরে রাখুন। উল্টো হাত-পা নামান, পিঠ সমতল রাখুন, তারপর বদলান।'],
      hi: ['डेड बग', 'पीठ के बल लेटकर घुटने कूल्हों के ऊपर रखें। उलटे हाथ-पैर नीचे लाएँ, पीठ सपाट रखें, फिर बदलें।'],
      ur: ['ڈیڈ بگ', 'کمر کے بل لیٹ کر گھٹنے کولہوں کے اوپر رکھیں۔ الٹے ہاتھ پاؤں نیچے لائیں، کمر سیدھی رکھیں، پھر بدلیں۔']
    }
  }),
  ex({
    id: 'bird-dog', pattern: 'core', muscles: ['core', 'back', 'glutes'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Bird-dog', 'On hands and knees. Reach one arm and the opposite leg out, hold a moment, then switch.'],
      bn: ['বার্ড-ডগ', 'হাত ও হাঁটুর ওপর ভর দিন। এক হাত ও উল্টো পা সামনে-পিছনে বাড়ান, একটু থামুন, তারপর বদলান।'],
      hi: ['बर्ड-डॉग', 'हाथों और घुटनों के बल आएँ। एक हाथ और उलटा पैर फैलाएँ, थोड़ा रुकें, फिर बदलें।'],
      ur: ['برڈ ڈاگ', 'ہاتھوں اور گھٹنوں کے بل آئیں۔ ایک ہاتھ اور الٹا پاؤں پھیلائیں، ذرا رکیں، پھر بدلیں۔']
    }
  }),
  ex({
    id: 'knee-plank', pattern: 'core', muscles: ['core', 'shoulders'], equipment: 'none', load: 'hold',
    t: {
      en: ['Knee plank', 'On forearms and knees, body in a line from head to knees. Hold and keep breathing.'],
      bn: ['হাঁটু প্ল্যাঙ্ক', 'বাহু ও হাঁটুর ওপর ভর দিন, মাথা থেকে হাঁটু পর্যন্ত সোজা। ধরে রাখুন, শ্বাস চালু রাখুন।'],
      hi: ['घुटने वाला प्लैंक', 'कोहनियों और घुटनों के बल, सिर से घुटनों तक सीधी रेखा। रुकें और साँस चलती रखें।'],
      ur: ['گھٹنوں والا پلینک', 'کہنیوں اور گھٹنوں کے بل، سر سے گھٹنوں تک سیدھی لکیر۔ رکیں اور سانس جاری رکھیں۔']
    }
  }),
  ex({
    id: 'side-plank-knee', pattern: 'core', muscles: ['core', 'shoulders'], equipment: 'none', load: 'hold',
    t: {
      en: ['Side plank on knees', 'Lie on your side, forearm under your shoulder, knees bent. Lift your hips and hold.'],
      bn: ['হাঁটুতে সাইড প্ল্যাঙ্ক', 'কাত হয়ে শুয়ে কাঁধের নিচে বাহু রাখুন, হাঁটু বাঁকান। কোমর তুলে ধরে রাখুন।'],
      hi: ['घुटनों पर साइड प्लैंक', 'करवट लेटें, कंधे के नीचे कोहनी, घुटने मुड़े। कूल्हे उठाकर रुकें।'],
      ur: ['گھٹنوں پر سائیڈ پلینک', 'کروٹ لیٹیں، کندھے کے نیچے کہنی، گھٹنے مڑے ہوئے۔ کولہے اٹھا کر رکیں۔']
    }
  }),
  ex({
    id: 'seated-march', pattern: 'core', muscles: ['core', 'quads'], equipment: 'chair', load: 'bodyweight',
    t: {
      en: ['Seated march', 'Sit tall near the front of a chair. Lift one knee, lower it, and switch, as if marching.'],
      bn: ['বসে মার্চ', 'চেয়ারের সামনের দিকে সোজা বসুন। এক হাঁটু তুলুন, নামান, তারপর বদলান, যেন হাঁটছেন।'],
      hi: ['बैठकर मार्च', 'कुर्सी के आगे की ओर सीधे बैठें। एक घुटना उठाएँ, नीचे करें, फिर बदलें, जैसे चल रहे हों।'],
      ur: ['بیٹھ کر مارچ', 'کرسی کے اگلے حصے پر سیدھے بیٹھیں۔ ایک گھٹنا اٹھائیں، نیچے کریں، پھر بدلیں، جیسے چل رہے ہوں۔']
    }
  }),
  ex({
    id: 'band-press-out', pattern: 'core', muscles: ['core', 'shoulders'], equipment: 'band', load: 'bodyweight',
    t: {
      en: ['Band press-out', 'Stand side-on to an anchored band, hold it at your chest. Press out, resist the pull, then return.'],
      bn: ['ব্যান্ড প্রেস-আউট', 'আটকানো ব্যান্ডের পাশে দাঁড়ান, বুকের কাছে ধরুন। সামনে ঠেলুন, টান প্রতিরোধ করুন, তারপর ফিরুন।'],
      hi: ['बैंड प्रेस-आउट', 'बँधे बैंड के बगल में खड़े हों, छाती के पास पकड़ें। आगे धकेलें, खिंचाव रोकें, फिर लौटें।'],
      ur: ['بینڈ پریس آؤٹ', 'بندھے بینڈ کے پہلو میں کھڑے ہوں، سینے کے پاس پکڑیں۔ آگے دھکیلیں، کھنچاؤ روکیں، پھر لوٹیں۔']
    }
  }),
  ex({
    id: 'single-leg-stand', pattern: 'balance', muscles: ['calves', 'glutes', 'core'], equipment: 'wall', load: 'hold',
    t: {
      en: ['Single-leg stand', 'Stand next to a wall or counter for support. Lift one foot and balance, then switch legs.'],
      bn: ['এক পায়ে দাঁড়ানো', 'সাহায্যের জন্য দেয়াল বা কাউন্টারের পাশে দাঁড়ান। এক পা তুলে ভারসাম্য রাখুন, তারপর পা বদলান।'],
      hi: ['एक पैर पर खड़े होना', 'सहारे के लिए दीवार या काउंटर के पास खड़े हों। एक पैर उठाकर संतुलन रखें, फिर पैर बदलें।'],
      ur: ['ایک پاؤں پر کھڑے ہونا', 'سہارے کے لیے دیوار یا کاؤنٹر کے پاس کھڑے ہوں۔ ایک پاؤں اٹھا کر توازن رکھیں، پھر پاؤں بدلیں۔']
    }
  }),
  ex({
    id: 'heel-to-toe', pattern: 'balance', muscles: ['calves', 'core'], equipment: 'wall', load: 'bodyweight',
    t: {
      en: ['Heel-to-toe walk', 'Walk in a straight line, placing one heel right in front of the other toes. Keep a wall within reach.'],
      bn: ['গোড়ালি-থেকে-আঙুল হাঁটা', 'সোজা লাইনে হাঁটুন, এক পায়ের গোড়ালি অন্য পায়ের আঙুলের ঠিক সামনে রাখুন। হাতের কাছে দেয়াল রাখুন।'],
      hi: ['एड़ी-से-पंजा चाल', 'सीधी रेखा में चलें, एक एड़ी दूसरे पंजे के ठीक आगे रखें। दीवार पास रखें।'],
      ur: ['ایڑی سے پنجے کی چال', 'سیدھی لکیر میں چلیں، ایک ایڑی دوسرے پنجے کے عین آگے رکھیں۔ دیوار پاس رکھیں۔']
    }
  }),
  ex({
    id: 'cat-cow', pattern: 'mobility', muscles: ['back', 'core'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Cat-cow', 'On hands and knees. Round your back up, then let it dip down, moving slowly with your breath.'],
      bn: ['ক্যাট-কাউ', 'হাত ও হাঁটুর ওপর ভর দিন। পিঠ ওপরে গোল করুন, তারপর নিচে নামতে দিন, শ্বাসের সঙ্গে ধীরে।'],
      hi: ['कैट-काउ', 'हाथों और घुटनों के बल आएँ। पीठ ऊपर गोल करें, फिर नीचे झुकने दें, साँस के साथ धीरे।'],
      ur: ['کیٹ کاؤ', 'ہاتھوں اور گھٹنوں کے بل آئیں۔ کمر اوپر گول کریں، پھر نیچے جھکنے دیں، سانس کے ساتھ آہستہ۔']
    }
  }),
  ex({
    id: 'shoulder-circles', pattern: 'mobility', muscles: ['shoulders'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Shoulder circles', 'Stand or sit tall. Roll your shoulders in slow, big circles, forwards then backwards.'],
      bn: ['কাঁধ ঘোরানো', 'সোজা দাঁড়ান বা বসুন। কাঁধ ধীরে বড় বৃত্তে ঘোরান, আগে সামনে, পরে পিছনে।'],
      hi: ['कंधे घुमाना', 'सीधे खड़े हों या बैठें। कंधों को धीरे-धीरे बड़े गोले में घुमाएँ, पहले आगे फिर पीछे।'],
      ur: ['کندھے گھمانا', 'سیدھے کھڑے ہوں یا بیٹھیں۔ کندھوں کو آہستہ بڑے دائروں میں گھمائیں، پہلے آگے پھر پیچھے۔']
    }
  }),
  ex({
    id: 'open-book', pattern: 'mobility', muscles: ['back', 'shoulders'], equipment: 'none', load: 'bodyweight',
    t: {
      en: ['Open book', 'Lie on your side, knees bent, arms together. Open the top arm across your chest, then return.'],
      bn: ['ওপেন বুক', 'কাত হয়ে হাঁটু বাঁকিয়ে হাত জোড়া রাখুন। ওপরের হাত বুক পেরিয়ে খুলুন, তারপর ফিরুন।'],
      hi: ['ओपन बुक', 'करवट लेटकर घुटने मोड़ें, हाथ जोड़ें। ऊपर वाला हाथ छाती के पार खोलें, फिर लौटें।'],
      ur: ['اوپن بک', 'کروٹ لیٹ کر گھٹنے موڑیں، ہاتھ جوڑیں۔ اوپر والا ہاتھ سینے کے پار کھولیں، پھر لوٹیں۔']
    }
  }),
  ex({
    id: 'hip-flexor-stretch', pattern: 'mobility', muscles: ['quads', 'glutes'], equipment: 'none', load: 'hold',
    t: {
      en: ['Hip flexor stretch', 'Kneel on one knee with the other foot forward. Tuck your hips under and feel the front of your hip stretch.'],
      bn: ['হিপ ফ্লেক্সর স্ট্রেচ', 'এক হাঁটুতে ভর দিয়ে অন্য পা সামনে রাখুন। কোমর ভেতরে টানুন, কোমরের সামনের অংশে টান অনুভব করুন।'],
      hi: ['हिप फ़्लेक्सर स्ट्रेच', 'एक घुटने पर बैठकर दूसरा पैर आगे रखें। कूल्हे अंदर खींचें, कूल्हे के आगे खिंचाव महसूस करें।'],
      ur: ['ہپ فلیکسر اسٹریچ', 'ایک گھٹنے پر ٹیک لگا کر دوسرا پاؤں آگے رکھیں۔ کولہے اندر کھینچیں، کولہے کے اگلے حصے میں کھنچاؤ محسوس کریں۔']
    }
  }),
  ex({
    id: 'hamstring-stretch', pattern: 'mobility', muscles: ['hamstrings'], equipment: 'chair', load: 'hold',
    t: {
      en: ['Seated hamstring stretch', 'Sit at the edge of a chair, one leg straight. Lean forward from the hips until you feel a gentle stretch.'],
      bn: ['বসে হ্যামস্ট্রিং স্ট্রেচ', 'চেয়ারের কিনারায় বসে এক পা সোজা করুন। কোমর থেকে সামনে ঝুঁকুন যতক্ষণ হালকা টান অনুভব করেন।'],
      hi: ['बैठकर हैमस्ट्रिंग स्ट्रेच', 'कुर्सी के किनारे बैठकर एक पैर सीधा करें। कूल्हों से आगे झुकें जब तक हल्का खिंचाव न लगे।'],
      ur: ['بیٹھ کر ہیمسٹرنگ اسٹریچ', 'کرسی کے کنارے بیٹھ کر ایک ٹانگ سیدھی کریں۔ کولہوں سے آگے جھکیں جب تک ہلکا کھنچاؤ محسوس ہو۔']
    }
  })
];

const BY_ID = new Map(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise | undefined {
  return BY_ID.get(id);
}
