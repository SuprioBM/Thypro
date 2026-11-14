import React from 'react';
import type { Muscle } from '../../strength/types';

/**
 * A simple front-and-back body figure drawn for Thypro (plain shapes, no
 * borrowed artwork). Muscles are filled by `levels` (0 to 1). The figure is
 * decorative: every value is also given as text next to it.
 */

type Shape = { m: Muscle; kind: 'e'; cx: number; cy: number; rx: number; ry: number } | { m: Muscle; kind: 'r'; x: number; y: number; w: number; h: number; r: number };

const e = (m: Muscle, cx: number, cy: number, rx: number, ry: number): Shape => ({ m, kind: 'e', cx, cy, rx, ry });
const r = (m: Muscle, x: number, y: number, w: number, h: number, rr: number): Shape => ({ m, kind: 'r', x, y, w, h, r: rr });

const FRONT: Shape[] = [
  e('shoulders', 31, 43, 9, 7), e('shoulders', 69, 43, 9, 7),
  e('chest', 41, 54, 9.5, 8), e('chest', 59, 54, 9.5, 8),
  e('arms', 22, 62, 5, 13), e('arms', 78, 62, 5, 13), e('arms', 18, 91, 4.5, 13), e('arms', 82, 91, 4.5, 13),
  r('core', 41, 65, 18, 30, 7),
  e('quads', 41, 125, 8.5, 23), e('quads', 59, 125, 8.5, 23),
  e('calves', 39, 175, 6, 18), e('calves', 61, 175, 6, 18)
];

const BACK: Shape[] = [
  e('shoulders', 31, 43, 9, 7), e('shoulders', 69, 43, 9, 7),
  e('back', 50, 55, 17, 13), e('back', 50, 80, 11, 11),
  e('arms', 22, 62, 5, 13), e('arms', 78, 62, 5, 13), e('arms', 18, 91, 4.5, 13), e('arms', 82, 91, 4.5, 13),
  e('glutes', 42, 105, 9.5, 9), e('glutes', 58, 105, 9.5, 9),
  e('hamstrings', 41, 138, 8, 19), e('hamstrings', 59, 138, 8, 19),
  e('calves', 39, 175, 6, 18), e('calves', 61, 175, 6, 18)
];

const fill = (level: number): string => (level <= 0 ? 'rgba(10,51,44,0.07)' : `rgba(245,112,31,${(0.18 + 0.78 * Math.min(1, level)).toFixed(2)})`);

const Figure: React.FC<{ shapes: Shape[]; levels: Partial<Record<Muscle, number>> }> = ({ shapes, levels }) => (
  <svg viewBox="0 0 100 200" className="h-full w-full" aria-hidden="true" focusable="false">
    {/* Quiet silhouette so the muscles read as one body */}
    <g fill="rgba(10,51,44,0.05)">
      <rect x="30" y="33" width="40" height="70" rx="17" />
      <rect x="12" y="38" width="14" height="70" rx="7" />
      <rect x="74" y="38" width="14" height="70" rx="7" />
      <rect x="31" y="98" width="17" height="98" rx="8" />
      <rect x="52" y="98" width="17" height="98" rx="8" />
    </g>
    <circle cx="50" cy="15" r="9.5" fill="rgba(10,51,44,0.12)" />
    <rect x="45" y="24" width="10" height="8" rx="3" fill="rgba(10,51,44,0.1)" />
    {shapes.map((s, i) =>
      s.kind === 'e' ? (
        <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} style={{ fill: fill(levels[s.m] ?? 0), transition: 'fill 0.7s cubic-bezier(0.16,1,0.3,1)' }} />
      ) : (
        <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} style={{ fill: fill(levels[s.m] ?? 0), transition: 'fill 0.7s cubic-bezier(0.16,1,0.3,1)' }} />
      )
    )}
  </svg>
);

export const BodyMap: React.FC<{
  levels: Partial<Record<Muscle, number>>;
  /** 'front' or 'back' alone (small), or 'both'. */
  view?: 'front' | 'back' | 'both';
  frontLabel?: string;
  backLabel?: string;
  className?: string;
}> = ({ levels, view = 'both', frontLabel, backLabel, className = '' }) => (
  <div className={`flex items-end justify-center gap-4 ${className}`}>
    {view !== 'back' && (
      <figure className="m-0 flex h-full flex-col items-center">
        <div className="min-h-0 flex-1 aspect-[1/2]">
          <Figure shapes={FRONT} levels={levels} />
        </div>
        {frontLabel && <figcaption className="mt-1 text-[11px] text-forest-800/65">{frontLabel}</figcaption>}
      </figure>
    )}
    {view !== 'front' && (
      <figure className="m-0 flex h-full flex-col items-center">
        <div className="min-h-0 flex-1 aspect-[1/2]">
          <Figure shapes={BACK} levels={levels} />
        </div>
        {backLabel && <figcaption className="mt-1 text-[11px] text-forest-800/65">{backLabel}</figcaption>}
      </figure>
    )}
  </div>
);
