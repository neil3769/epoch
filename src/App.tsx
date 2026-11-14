import { useEffect, useSyncExternalStore } from 'react';
import { Home } from './screens/Home';
import { LessonPlayer } from './screens/LessonPlayer';

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
  return <Home />;
}
