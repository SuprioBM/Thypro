import { useCallback, useEffect, useRef, useState } from 'react';
import type { Lang } from '../../domain/types';

/** Minimal shape of the (vendor-prefixed) Web Speech recognition API. */
interface RecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

const BCP47: Record<Lang, string> = { en: 'en-GB', bn: 'bn-BD', hi: 'hi-IN', ur: 'ur-PK' };

function getCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export interface Speech {
  supported: boolean;
  listening: boolean;
  failed: boolean;
  start: (onText: (text: string) => void) => void;
  stop: () => void;
}

/** Voice input that degrades gracefully: `supported` is false where the API does not exist. */
export function useSpeech(lang: Lang): Speech {
  const Ctor = getCtor();
  const [listening, setListening] = useState(false);
  const [failed, setFailed] = useState(false);
  const rec = useRef<RecognitionLike | null>(null);

  const stop = useCallback(() => {
    rec.current?.stop();
  }, []);

  const start = useCallback(
    (onText: (text: string) => void) => {
      if (!Ctor) return;
      try {
        const r = new Ctor();
        r.lang = BCP47[lang];
        r.interimResults = false;
        r.continuous = false;
        r.onresult = (e) => {
          const text = Array.from(e.results)
            .map((res) => res[0]?.transcript ?? '')
            .join(' ')
            .trim();
          if (text) onText(text);
        };
        r.onerror = () => setFailed(true);
        r.onend = () => setListening(false);
        rec.current = r;
        setFailed(false);
        setListening(true);
        r.start();
      } catch {
        setFailed(true);
        setListening(false);
      }
    },
    [Ctor, lang]
  );

  useEffect(() => () => rec.current?.abort(), []);

  return { supported: Boolean(Ctor), listening, failed, start, stop };
}
