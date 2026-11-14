import { useSync } from '../lib/sync';

const LABEL = { synced: 'Synced', syncing: 'Syncing', offline: 'Offline', error: 'Sync problem', off: '' } as const;

/** Small sync indicator. Hidden when sync is not set up. */
export function SyncBadge({ full = false }: { full?: boolean }) {
  const s = useSync();
  if (s.status === 'off') return full ? <span className="sync-badge">Not connected</span> : null;
  return (
    <span className={`sync-badge sync-${s.status}`} title={s.message ?? LABEL[s.status]} role="status">
      <span className="sync-dot" aria-hidden="true" />
      {full || s.status !== 'synced' ? LABEL[s.status] : <span className="sr-only">{LABEL[s.status]}</span>}
    </span>
  );
}
