import React, { useEffect, useState } from 'react';
import { useI18n } from '../../i18n';

/** Staggered card enter. `index` spreads the delay; reduced-motion CSS flattens it. */
export const Card: React.FC<{
  children: React.ReactNode;
  index?: number;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
  tone?: 'default' | 'soft' | 'dark' | 'alert';
  labelledBy?: string;
}> = ({ children, index = 0, className = '', as: Tag = 'div', tone = 'default', labelledBy }) => {
  const tones = {
    default: 'bg-white border-forest-900/10 shadow-soft-sm',
    soft: 'bg-ivory-50 border-forest-900/10',
    dark: 'bg-forest-900 text-ivory-50 border-forest-800 shadow-lift',
    alert: 'bg-signal-amberSoft border-ochre-300'
  } as const;
  return (
    <Tag
      aria-labelledby={labelledBy}
      style={{ animationDelay: `${index * 70}ms` }}
      className={`stagger-in rounded-card border p-4 sm:p-5 ${tones[tone]} ${className}`}
    >
      {children}
    </Tag>
  );
};

export const ScreenHeader: React.FC<{ title: string; subtitle?: string; id?: string; right?: React.ReactNode }> = ({
  title,
  subtitle,
  id = 'screen-title',
  right
}) => (
  <div className="mb-5 flex items-start justify-between gap-3">
    <div className="min-w-0">
      <h1 id={id} className="font-editorial text-2xl sm:text-3xl text-forest-950 leading-tight">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-sm text-forest-900/70 leading-relaxed">{subtitle}</p>}
    </div>
    {right}
  </div>
);

export const Chip: React.FC<{
  children: React.ReactNode;
  tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'info';
  className?: string;
}> = ({ children, tone = 'neutral', className = '' }) => {
  const tones = {
    neutral: 'bg-ivory-200 text-forest-800 border-forest-900/10',
    good: 'bg-sage-100 text-forest-900 border-sage-300',
    warn: 'bg-ochre-100 text-ochre-800 border-ochre-300',
    bad: 'bg-signal-crimsonSoft text-signal-crimson border-signal-crimson/20',
    info: 'bg-forest-800 text-ivory-50 border-forest-800'
  } as const;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium leading-tight ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
};

export const Switch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}> = ({ checked, onChange, label, hint }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex min-h-[48px] w-full items-center justify-between gap-4 rounded-xl px-3 py-2 text-start hover:bg-forest-900/[0.04]"
  >
    <span className="min-w-0">
      <span className="block text-sm font-medium text-forest-950">{label}</span>
      {hint && <span className="block text-xs text-forest-800/65">{hint}</span>}
    </span>
    <span
      aria-hidden="true"
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 ${checked ? 'bg-forest-700' : 'bg-forest-900/20'}`}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all duration-300 ease-editorial ${
          checked ? 'start-[1.375rem]' : 'start-0.5'
        }`}
      />
    </span>
  </button>
);

/** Animated progress ring. `value` 0..1. */
export const Ring: React.FC<{ value: number; size?: number; label: string; children?: React.ReactNode }> = ({
  value,
  size = 120,
  label,
  children
}) => {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(Math.max(0, Math.min(1, value))));
    return () => cancelAnimationFrame(id);
  }, [value]);
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" strokeWidth="9" className="stroke-forest-900/10" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown)}
          className="stroke-ochre-500"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
};

/** Smooth open/close without measuring heights. */
export const Expandable: React.FC<{ open: boolean; id: string; children: React.ReactNode }> = ({ open, id, children }) => (
  <div
    id={id}
    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-editorial ${
      open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
    }`}
  >
    <div className="overflow-hidden" aria-hidden={!open}>
      {children}
    </div>
  </div>
);

export const SuccessCheck: React.FC<{ size?: number }> = ({ size = 72 }) => (
  <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }} aria-hidden="true">
    <span className="absolute inset-0 rounded-full bg-sage-200 animate-pop-ring" />
    <svg viewBox="0 0 52 52" className="relative" width={size * 0.7} height={size * 0.7}>
      <circle cx="26" cy="26" r="23" fill="none" strokeWidth="3" className="stroke-forest-700 animate-draw-circle" />
      <path
        d="M15 27l8 8 14-16"
        fill="none"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-forest-700 animate-draw-check"
      />
    </svg>
  </span>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse rounded-xl bg-forest-900/10 ${className}`} aria-hidden="true" />
);

export const ScreenSkeleton: React.FC = () => {
  const { t } = useI18n();
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{t('shell.loading')}</span>
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-28 w-full" />
    </div>
  );
};

export const EmptyState: React.FC<{ title: string; body?: string; action?: React.ReactNode }> = ({ title, body, action }) => (
  <div className="stagger-in rounded-card border border-dashed border-forest-900/20 bg-ivory-50 p-6 text-center">
    <p className="font-editorial text-lg text-forest-950">{title}</p>
    {body && <p className="mx-auto mt-1 max-w-sm text-sm text-forest-900/70">{body}</p>}
    {action && <div className="mt-4 flex justify-center">{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ title: string; body?: string; onRetry?: () => void; retryLabel?: string }> = ({
  title,
  body,
  onRetry,
  retryLabel
}) => (
  <div role="alert" className="rounded-card border border-signal-crimson/25 bg-signal-crimsonSoft p-5">
    <p className="font-editorial text-lg text-signal-crimson">{title}</p>
    {body && <p className="mt-1 text-sm text-forest-900/80">{body}</p>}
    {onRetry && retryLabel && (
      <button type="button" onClick={onRetry} className="thy-btn-ghost mt-3 min-h-[44px]">
        {retryLabel}
      </button>
    )}
  </div>
);

interface BoundaryProps {
  children: React.ReactNode;
  fallback: (reset: () => void) => React.ReactNode;
  resetKey?: string;
}

/** Keeps one broken screen from taking the whole app down. */
export class ErrorBoundary extends React.Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: BoundaryProps) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  render() {
    return this.state.failed ? this.props.fallback(() => this.setState({ failed: false })) : this.props.children;
  }
}
