import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Auto-advancing tabs, shared by the landing sections that cycle through
 * views (personas, capabilities, care stages, demo steps).
 *
 * It only runs while the block is on screen and the page is visible.
 * Pointer hover or keyboard focus inside the block holds it, and so does
 * the visitor picking a tab. Reduced
 * motion starts it paused. Progress is a CSS animation, and the next view
 * is chosen when that animation ends, so a hold resumes where it stopped.
 */
export function useAutoRotate(count: number, initial = 0, intervalMs = 7000) {
  const [index, setIndex] = useState(initial);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [stopped, setStopped] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) setStopped(true);
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.3 });
    io.observe(node);
    const onVis = () => setPageVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  /** Autoplay is on (not stopped by the visitor); `running` is whether time is passing right now. */
  const autoplay = !stopped;
  const running = autoplay && inView && pageVisible && !hovering && !focusWithin;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  /** A visitor's pick: show it and stop cycling so it does not move away under them. */
  const select = useCallback((i: number) => {
    setIndex(i);
    setStopped(true);
  }, []);

  const toggle = useCallback(() => setStopped((s) => !s), []);

  const bind = {
    ref: rootRef,
    onPointerEnter: (e: React.PointerEvent) => {
      if (e.pointerType === 'mouse') setHovering(true);
    },
    onPointerLeave: () => setHovering(false),
    onFocus: (e: React.FocusEvent) => {
      // Only keyboard focus holds the rotation; a mouse click focuses too.
      if ((e.target as HTMLElement).matches?.(':focus-visible')) setFocusWithin(true);
    },
    onBlur: (e: React.FocusEvent<HTMLDivElement>) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
    }
  };

  return { index, setIndex, select, next, toggle, autoplay, running, intervalMs, bind };
}

/** Thin progress line for the active tab. Fires `onDone` when the interval completes. */
export const RotateProgress: React.FC<{
  active: boolean;
  autoplay: boolean;
  running: boolean;
  intervalMs: number;
  onDone: () => void;
  /** Changes whenever the active view changes, so the line restarts. */
  cycleKey: string | number;
  tone?: 'light' | 'dark';
  className?: string;
}> = ({ active, autoplay, running, intervalMs, onDone, cycleKey, tone = 'light', className = '' }) => {
  const ref = useRef<HTMLSpanElement>(null);

  // On narrow screens the tab strip scrolls sideways: keep the active tab in view
  // (scrolling the strip only, never the page).
  useEffect(() => {
    const tab = ref.current?.parentElement;
    const track = tab?.closest('.thy-seg') as HTMLElement | null;
    if (!tab || !track || track.scrollWidth <= track.clientWidth) return;
    track.scrollTo({ left: tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
  }, [cycleKey, active]);

  if (!active) return null;
  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden ${tone === 'dark' ? 'bg-white/15' : 'bg-forest-900/10'} ${className}`}
    >
      <span
        key={`${cycleKey}-${autoplay}`}
        className="block h-full origin-left bg-ochre-500"
        style={{
          transform: autoplay ? undefined : 'scaleX(1)',
          animation: autoplay ? `stageProgress ${intervalMs}ms linear forwards` : undefined,
          animationPlayState: running ? 'running' : 'paused'
        }}
        onAnimationEnd={() => {
          if (autoplay) onDone();
        }}
      />
    </span>
  );
};
