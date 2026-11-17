import { Suspense, lazy, useEffect, useSyncExternalStore } from 'react';
import { Home } from './screens/Home';
import { LessonPlayer } from './screens/LessonPlayer';
import { ReviewPlayer } from './screens/ReviewPlayer';
import { LibraryPageView } from './screens/Library';
import { Settings } from './screens/Settings';

// The lab player carries the code editor, so it loads separately (still precached for offline use).
const LabPlayer = lazy(() => import('./screens/LabPlayer').then((m) => ({ default: m.LabPlayer })));

// Hash routing: works under any GitHub Pages sub-path with no server rewrites.
const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const useHashPath = () => useSyncExternalStore(subscribe, () => window.location.hash.replace(/^#/, '') || '/');

export function App() {
  const path = useHashPath();
  useEffect(() => {
    // Braces matter: newer browsers return a Promise from scrollTo, which
    // React would otherwise treat as the effect's cleanup function.
    window.scrollTo(0, 0);
  }, [path]);
  // #/lesson/<id> plays a lesson. #/lesson/<id>/<n> previews it from exercise n
  // (for authors checking content; a preview does not count as progress).
  const lesson = path.match(/^\/lesson\/([a-z0-9-]+)(?:\/(\d+))?$/);
  if (lesson) {
    const start = lesson[2] === undefined ? undefined : Number(lesson[2]);
    return <LessonPlayer key={path} lessonId={lesson[1]} previewFrom={start} />;
  }
  if (path === '/review' || path === '/review/quick') return <ReviewPlayer key={path} quick={path === '/review/quick'} />;
  if (path === '/settings') return <Settings />;
  const lib = path.match(/^\/library\/([A-Z0-9]+|numbers)$/);
  if (lib) return <LibraryPageView unitId={lib[1]} />;
  // #/lab/<id> continues a lab, #/lab/<id>/again writes it again, #/lab/<id>/<n> rewrites step n.
  const lab = path.match(/^\/lab\/([a-z0-9-]+)(?:\/(again|\d+))?$/);
  if (lab) {
    const mode = lab[2] === undefined ? 'normal' : lab[2] === 'again' ? 'again' : 'single';
    return (
      <Suspense fallback={<main className="screen center">Opening the lab…</main>}>
        <LabPlayer key={path} labId={lab[1]} mode={mode} step={mode === 'single' ? Number(lab[2]) : undefined} />
      </Suspense>
    );
  }
  return <Home />;
}
