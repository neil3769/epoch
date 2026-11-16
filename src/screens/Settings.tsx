import { useRef, useState } from 'react';
import { TopBar } from '../components/Bits';
import { dayKey, shortDate } from '../lib/dates';
import {
  canonicalJson,
  examActive,
  getProgress,
  mergeIn,
  normalizeProgress,
  setDailyGoal,
  setExam,
  setSound,
  useProgress,
  type DailyGoal,
  type ExamMode,
} from '../lib/progress';
import { connect, disconnect, loadConfig, maskToken, syncNow, useSync } from '../lib/sync';
import { setThemeChoice, useThemeChoice, type ThemeChoice } from '../lib/theme';
import { SyncBadge } from './SyncBadge';

const GOALS: DailyGoal[] = [5, 15, 30];
const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Device' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

const NEW_REPO = 'https://github.com/new?name=epoch-progress&visibility=private';
const NEW_TOKEN =
  'https://github.com/settings/personal-access-tokens/new?name=Epoch+sync&description=Progress+sync+for+the+Epoch+app&expires_in=366&contents=write';

function Seg<T extends string | number>({ label, options, value, onPick }: { label: string; options: { value: T; label: string }[]; value: T; onPick: (v: T) => void }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} className={`seg-btn${value === o.value ? ' on' : ''}`} onClick={() => onPick(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SyncSection() {
  const sync = useSync();
  const [cfg, setCfg] = useState(loadConfig);
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doConnect = async () => {
    setBusy(true);
    setError(null);
    try {
      await connect(token, repo);
      setCfg(loadConfig());
      setToken('');
    } catch (e) {
      // Messages are fixed sentences that never contain the token.
      setError(e instanceof Error ? e.message : 'Could not connect.');
    } finally {
      setBusy(false);
    }
  };

  if (cfg)
    return (
      <>
        <dl className="kv">
          <dt>Repository</dt>
          <dd>
            {cfg.owner}/{cfg.repo}
          </dd>
          <dt>Token</dt>
          <dd className="mono">{maskToken(cfg.token)}</dd>
          <dt>Status</dt>
          <dd>
            <SyncBadge full />
          </dd>
        </dl>
        {sync.message && <p className={`note ${sync.status === 'error' ? 'note-bad' : ''}`}>{sync.message}</p>}
        <p className="muted small">Syncs by itself when the app opens and after each lesson, review or lab step.</p>
        <div className="row-btns">
          <button className="btn btn-small" onClick={() => void syncNow()} disabled={sync.status === 'syncing'}>
            Sync now
          </button>
          <button
            className="btn btn-small btn-ghost"
            onClick={() => {
              disconnect();
              setCfg(null);
            }}
          >
            Disconnect
          </button>
        </div>
        <p className="muted small">Disconnect deletes the token from this device. Your progress stays here and in the repository.</p>
      </>
    );

  return (
    <>
      <p>Keep your phone and computer in step through a private GitHub repository that only you can see. Optional: without it, everything stays on this device.</p>
      <ol className="steps">
        <li>
          <strong>Make the repository (once).</strong> Open{' '}
          <a href={NEW_REPO} target="_blank" rel="noreferrer">
            github.com/new
          </a>
          . Repository name: <code>epoch-progress</code>. Choose <strong>Private</strong>, then <strong>Create repository</strong>.
        </li>
        <li>
          <strong>Make a token (on each device).</strong> Open{' '}
          <a href={NEW_TOKEN} target="_blank" rel="noreferrer">
            this token page
          </a>{' '}
          (it fills in the name, a one-year expiry and <strong>Contents: Read and write</strong>). Under <strong>Repository access</strong> pick{' '}
          <strong>Only select repositories</strong> and choose <code>epoch-progress</code> in <strong>Selected repositories</strong>. Click{' '}
          <strong>Generate token</strong> and copy it.
          <span className="muted small block">
            The long way: profile picture → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.
          </span>
        </li>
        <li>
          <strong>Paste both here</strong> and press Connect. The token stays on this device only.
        </li>
      </ol>
      <label className="field">
        <span>Repository</span>
        <input
          className="text-input"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="yourname/epoch-progress"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      <label className="field">
        <span>Token</span>
        <input
          className="text-input"
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="github_pat_…"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </label>
      {error && <p className="note note-bad">{error}</p>}
      <button className="btn btn-primary btn-block" disabled={busy || !repo.trim() || !token.trim()} onClick={() => void doConnect()}>
        {busy ? 'Connecting…' : 'Connect'}
      </button>
    </>
  );
}

function ExamSection({ exam }: { exam: ExamMode }) {
  const today = dayKey();
  const valid = exam.start <= exam.end;
  let status = 'Off.';
  if (exam.on && !valid) status = 'The end date is before the start date.';
  else if (exam.on && examActive({ ...getProgress().settings, exam }, today)) status = `On now, until ${shortDate(exam.end)}.`;
  else if (exam.on && today < exam.start) status = `On from ${shortDate(exam.start)} to ${shortDate(exam.end)}.`;
  else if (exam.on) status = `Ended on ${shortDate(exam.end)}.`;
  return (
    <>
      <label className="switch-row">
        <span>
          Exam mode
          <span className="muted small block">
            For these dates the daily goal is one short review, which keeps your streak. Only review, F9 (PyTorch), E5 (Evaluation) and E11 (Interview
            practice) are offered.
          </span>
        </span>
        <input type="checkbox" className="switch" checked={exam.on} onChange={(e) => setExam({ on: e.target.checked })} />
      </label>
      <div className="date-row">
        <label className="field">
          <span>From</span>
          <input className="text-input" type="date" value={exam.start} onChange={(e) => e.target.value && setExam({ start: e.target.value })} />
        </label>
        <label className="field">
          <span>To</span>
          <input className="text-input" type="date" value={exam.end} onChange={(e) => e.target.value && setExam({ end: e.target.value })} />
        </label>
      </div>
      <p className={`note${exam.on && !valid ? ' note-bad' : ''}`} aria-live="polite">
        {status}
      </p>
    </>
  );
}

function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const exportFile = () => {
    // Progress only: the sync token is stored separately and never included.
    const blob = new Blob([canonicalJson(getProgress())], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epoch-progress-${dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const importFile = async (file: File) => {
    try {
      const p = normalizeProgress(JSON.parse(await file.text()));
      const changed = mergeIn(p, true);
      setMsg({ ok: true, text: changed ? 'Imported and merged with this device. Nothing here was removed.' : 'Nothing new in that file: this device already has all of it.' });
    } catch {
      setMsg({ ok: false, text: 'That file is not an Epoch progress file.' });
    }
  };

  return (
    <>
      <p>Save your progress as a file, or bring one in. Importing merges: it adds what the file has and never deletes anything here.</p>
      <div className="row-btns">
        <button className="btn btn-small" onClick={exportFile}>
          Export progress
        </button>
        <button className="btn btn-small" onClick={() => fileRef.current?.click()}>
          Import a file
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importFile(f);
          e.target.value = '';
        }}
      />
      {msg && <p className={`note ${msg.ok ? 'note-good' : 'note-bad'}`}>{msg.text}</p>}
    </>
  );
}

export function Settings() {
  const p = useProgress();
  const theme = useThemeChoice();
  return (
    <main className="screen settings">
      <TopBar title="Settings" />

      <section className="panel">
        <h2>Daily goal</h2>
        <Seg label="Daily goal in minutes" options={GOALS.map((g) => ({ value: g, label: `${g} min` }))} value={p.settings.dailyGoal} onPick={setDailyGoal} />
        <h2>Appearance</h2>
        <Seg label="Colour scheme" options={THEMES} value={theme} onPick={setThemeChoice} />
        <label className="switch-row">
          <span>
            Sounds for right and wrong answers
            <span className="muted small block">Off by default.</span>
          </span>
          <input type="checkbox" className="switch" checked={p.settings.sound} onChange={(e) => setSound(e.target.checked)} />
        </label>
      </section>

      <section className="panel">
        <h2>Exams</h2>
        <ExamSection exam={p.settings.exam} />
      </section>

      <section className="panel">
        <h2>Sync across devices</h2>
        <SyncSection />
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <BackupSection />
      </section>

      <section className="panel">
        <h2>A daily reminder</h2>
        <p>Web apps on iPhone cannot send notifications, so let your phone remind you:</p>
        <ol className="steps">
          <li>
            Open <strong>Reminders</strong> and add a reminder called “Epoch, one lesson”.
          </li>
          <li>
            Tap <strong>ⓘ</strong>, turn on <strong>Date</strong> and <strong>Time</strong>, pick a time you are usually free, and set <strong>Repeat</strong> to{' '}
            <strong>Daily</strong>.
          </li>
          <li>Keep Epoch on your first home screen page, so the reminder is one tap from a lesson.</li>
        </ol>
        <p className="muted small">On Android, a daily alarm or reminder in the Clock or Reminder app does the same.</p>
      </section>

      <section className="panel">
        <h2>Coding on a computer</h2>
        <p>Epoch works in any desktop browser too, which is nicer for the code labs. Use sync (or export and import) to carry your progress across.</p>
      </section>
    </main>
  );
}
