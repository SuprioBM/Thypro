import React from 'react';

interface LogoMarkProps {
  className?: string;
}

/** The TP monogram from the Thypro logo. Size it with a height class. */
export const LogoMark: React.FC<LogoMarkProps> = ({ className = 'h-9' }) => (
  <img
    src="/images/logo-mark.webp"
    alt=""
    width={489}
    height={320}
    decoding="async"
    className={`w-auto ${className}`}
  />
);

interface WordmarkProps {
  className?: string;
  /** Height class applied to the monogram; the wordmark scales from it. */
  markClassName?: string;
  showTagline?: boolean;
}

/** Monogram + "Thypro" wordmark, taken from the supplied logo artwork. */
export const Wordmark: React.FC<WordmarkProps> = ({
  className = '',
  markClassName = 'h-9',
  showTagline = false
}) => (
  <span className={`flex items-center gap-3 ${className}`}>
    <LogoMark className={markClassName} />
    <span className="flex flex-col">
      <img
        src="/images/logo-wordmark.webp"
        alt="Thypro"
        width={752}
        height={206}
        decoding="async"
        className="h-[1.6rem] sm:h-7 w-auto"
      />
      {showTagline && (
        <span className="mt-1 text-[9px] uppercase tracking-[0.22em] font-semibold text-forest-800/70">
          Your Health. Our Care.
        </span>
      )}
    </span>
  </span>
);

/** Full lockup with tagline (monogram, wordmark, tagline rules). */
export const FullLogo: React.FC<{ className?: string }> = ({ className = 'w-44' }) => (
  <img
    src="/images/logo-full.webp"
    alt="Thypro — Your Health. Our Care."
    width={900}
    height={580}
    loading="lazy"
    decoding="async"
    className={`h-auto ${className}`}
  />
);
