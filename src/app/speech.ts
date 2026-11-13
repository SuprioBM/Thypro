import type { Lang } from '../domain/types';

/**
 * Browser text-to-speech for simulated voice messages and voice-first mode.
 * There are no pre-recorded clips; if the browser has no speech synthesis (or
 * no voice for the language), callers fall back to showing the text.
 */

const BCP47: Record<Lang, string> = { en: 'en-GB', bn: 'bn-BD', hi: 'hi-IN', ur: 'ur-PK' };

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}

/** Speaks the text. Returns false when the browser cannot. Never throws. */
export function speak(text: string, lang: Lang): boolean {
  if (!canSpeak()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = BCP47[lang];
    const voice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith(lang));
    if (voice) u.voice = voice;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}
