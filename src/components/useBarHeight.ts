import { useCallback, useRef } from 'react';

/**
 * Keeps --bar-h on <html> equal to the fixed bottom bar's height, so page
 * content can always scroll clear of it (the feedback panel grows the bar).
 */
export function useBarHeight() {
  const obs = useRef<ResizeObserver | null>(null);
  return useCallback((el: HTMLElement | null) => {
    obs.current?.disconnect();
    if (!el) return;
    const set = () => document.documentElement.style.setProperty('--bar-h', `${el.offsetHeight}px`);
    set();
    obs.current = new ResizeObserver(set);
    obs.current.observe(el);
  }, []);
}
