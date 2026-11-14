import { useSyncExternalStore } from 'react';

/*
 * Light / dark mode. Until the learner picks one, the app follows the
 * device setting. The choice is per device (stored locally), applied as
 * data-theme on <html>; index.html applies it before first paint.
 */
export type Theme = 'light' | 'dark';

const KEY = 'epoch.theme';
const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

function stored(): Theme | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
}

let choice: Theme | null = typeof localStorage === 'undefined' ? null : stored();

const effective = (): Theme => choice ?? (media?.matches ? 'dark' : 'light');

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
media?.addEventListener('change', () => {
  apply();
  notify();
});

export function apply() {
  const t = choice;
  const root = document.documentElement;
  if (t) root.dataset.theme = t;
  else delete root.dataset.theme;
  const color = effective() === 'dark' ? '#14141b' : '#f6f4ef';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute('content', color));
}

export function toggleTheme() {
  choice = effective() === 'dark' ? 'light' : 'dark';
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    /* still applies for this session */
  }
  apply();
  notify();
}

export const useTheme = (): Theme =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    effective,
  );
