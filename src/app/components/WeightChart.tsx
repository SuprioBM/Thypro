import React from 'react';

/** Small line chart of body weight over time. Numbers only; never interpreted. */
export const WeightChart: React.FC<{ points: { date: string; kg: number }[]; label: string }> = ({ points, label }) => {
  if (points.length < 2) return null;
  const w = 300;
  const h = 110;
  const pad = 14;
  const kgs = points.map((p) => p.kg);
  const lo = Math.min(...kgs) - 0.5;
  const hi = Math.max(...kgs) + 0.5;
  const x = (i: number) => pad + (i * (w - pad * 2)) / (points.length - 1);
  const y = (kg: number) => h - pad - ((kg - lo) / (hi - lo || 1)) * (h - pad * 2);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.kg).toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full" role="img" aria-label={`${label}: ${points.map((p) => p.kg).join(', ')} kg`}>
      <path d={`${path} L${x(points.length - 1)},${h - pad} L${x(0)},${h - pad} Z`} className="fill-ochre-500/10" />
      <path d={path} fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="stroke-ochre-500" />
      {points.map((p, i) => (
        <g key={p.date}>
          <circle cx={x(i)} cy={y(p.kg)} r="3.5" className="fill-white stroke-forest-800" strokeWidth="2" />
          {(i === 0 || i === points.length - 1) && (
            <text x={x(i)} y={y(p.kg) - 8} textAnchor={i === 0 ? 'start' : 'end'} className="fill-forest-900 text-[10px] font-semibold">
              {p.kg}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
};
