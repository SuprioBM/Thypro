import React from 'react';
import { Reveal } from './Reveal';

interface SectionHeadingProps {
  /** Two-digit step marker, e.g. "05" */
  index: string;
  eyebrow: string;
  /** First line of the headline, set in roman. */
  title: string;
  /** Second line, set in italic for the editorial accent. */
  titleAccent?: string;
  lede?: string;
  align?: 'left' | 'center';
  className?: string;
}

/**
 * Shared section header so every section keeps the same eyebrow → headline →
 * lede rhythm and type scale.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  index,
  eyebrow,
  title,
  titleAccent,
  lede,
  align = 'left',
  className = ''
}) => (
  <Reveal
    className={`max-w-3xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}
  >
    <div className={`thy-eyebrow mb-4 ${align === 'center' ? 'justify-center' : ''}`}>
      <span className="w-6 h-px bg-ochre-500/60" aria-hidden="true" />
      <span>
        {index} — {eyebrow}
      </span>
    </div>
    <h2 className="thy-h2 mb-5">
      {title}
      {titleAccent && (
        <>
          {' '}
          <br className="hidden sm:inline" />
          <span className="italic text-forest-800">{titleAccent}</span>
        </>
      )}
    </h2>
    {lede && <p className="thy-lede">{lede}</p>}
  </Reveal>
);
