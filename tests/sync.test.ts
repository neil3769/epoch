import { describe, expect, it } from 'vitest';
import { emptyProgress, mergeProgress, type Activity, type Progress } from '../src/lib/progress';
import { SyncError, checkRepo, fromBase64, parseRepo, maskToken, syncOnce, toBase64, type FetchFn, type SyncConfig } from '../src/lib/sync';

/*
 * A fake GitHub contents API: one file with a sha that changes on every
 * write, the real status codes for missing files and stale shas, and a check
 * that every request carries the token. No real token or network is used.
 */
const TOKEN = 'fake_token_for_tests_only';
const cfg: SyncConfig = { token: TOKEN, owner: 'learner', repo: 'epoch-progress', path: 'progress.json' };
const FILE_URL = 'https://api.github.com/repos/learner/epoch-progress/contents/progress.json';
const REPO_URL = 'https://api.github.com/repos/learner/epoch-progress';

class FakeGitHub {
  content: string | null = null;
  sha = '';
  writes = 0;
  private version = 0;
  /** Runs before a PUT is applied: lets a test sneak in another device's write. */
  beforePut?: () => void;
  isPrivate = true;

  put(text: string) {
    this.content = text;
    this.sha = `sha${++this.version}`;
    this.writes++;
  }

  fetch: FetchFn = async (url, init) => {
    const auth = (init.headers as Record<string, string>).Authorization;
    if (auth !== `Bearer ${TOKEN}`) return new Response('{"message":"Bad credentials"}', { status: 401 });
    expect(init.cache).toBe('no-store');
    if (url === REPO_URL) return Response.json({ private: this.isPrivate });
    if (url !== FILE_URL) return new Response('{}', { status: 404 });
    if (!init.method || init.method === 'GET') {
      if (this.content === null) return new Response('{"message":"Not Found"}', { status: 404 });
      // GitHub wraps base64 at 60 characters.
      const b64 = toBase64(this.content).replace(/(.{60})/g, '$1\n');
      return Response.json({ type: 'file', encoding: 'base64', content: b64, sha: this.sha });
    }
    if (init.method === 'PUT') {
      this.beforePut?.();
      this.beforePut = undefined;
      const body = JSON.parse(init.body as string) as { content: string; sha?: string; message: string };
      expect(body.message).toBeTruthy();
      if (this.content !== null && body.sha !== this.sha) return new Response('{"message":"does not match"}', { status: 409 });
      if (this.content === null && body.sha) return new Response('{}', { status: 422 });
      const created = this.content === null;
      this.put(fromBase64(body.content));
      return Response.json({ content: { sha: this.sha } }, { status: created ? 201 : 200 });
    }
    return new Response('{}', { status: 405 });
  };

  progress(): Progress {
    return JSON.parse(this.content!) as Progress;
  }
}

/** A device: its own local progress, merged the way the app merges. */
class Device {
  constructor(public p: Progress) {}
  store = { get: () => this.p, merge: (o: Progress) => (this.p = mergeProgress(this.p, o)) };
  doLesson(id: string, day: string) {
    const a: Activity = { id: `${id}-${day}-${Math.random()}`, at: `${day}T12:00:00.000Z`, day, kind: 'lesson', ref: id, xp: 20, minutes: 5 };
    this.p = { ...this.p, completed: { ...this.p.completed, [id]: a.at }, activity: [...this.p.activity, a] };
  }
}

describe('sync against a mocked GitHub API', () => {
  it('creates the file on first sync, then pulls it on another device', async () => {
    const gh = new FakeGitHub();
    const phone = new Device(emptyProgress());
    phone.doLesson('f3-01', '2026-11-14');
    expect(await syncOnce(cfg, gh.fetch, phone.store)).toBe('pushed');
    expect(Object.keys(gh.progress().completed)).toEqual(['f3-01']);

    const pc = new Device(emptyProgress());
    expect(await syncOnce(cfg, gh.fetch, pc.store)).toBe('pulled');
    expect(pc.p.completed['f3-01']).toBeTruthy();
    expect(gh.writes).toBe(1);
  });

  it('keeps lessons done on both devices while offline', async () => {
    const gh = new FakeGitHub();
    const phone = new Device(emptyProgress());
    const pc = new Device(emptyProgress());
    phone.doLesson('f3-01', '2026-11-14');
    await syncOnce(cfg, gh.fetch, phone.store);
    await syncOnce(cfg, gh.fetch, pc.store);

    // Both offline: one lesson each.
    phone.doLesson('f3-02', '2026-11-15');
    pc.doLesson('e2-01', '2026-11-15');

    await syncOnce(cfg, gh.fetch, phone.store);
    await syncOnce(cfg, gh.fetch, pc.store); // pulls phone's, merges, pushes both
    await syncOnce(cfg, gh.fetch, phone.store); // pulls pc's

    const want = ['e2-01', 'f3-01', 'f3-02'];
    expect(Object.keys(gh.progress().completed).sort()).toEqual(want);
    expect(Object.keys(phone.p.completed).sort()).toEqual(want);
    expect(Object.keys(pc.p.completed).sort()).toEqual(want);
    expect(phone.p.activity).toHaveLength(3);
  });

  it('on a conflict, pulls, merges and retries without losing either write', async () => {
    const gh = new FakeGitHub();
    const phone = new Device(emptyProgress());
    const pc = new Device(emptyProgress());
    phone.doLesson('f3-01', '2026-11-14');
    await syncOnce(cfg, gh.fetch, phone.store);
    await syncOnce(cfg, gh.fetch, pc.store);

    phone.doLesson('f3-02', '2026-11-15');
    pc.doLesson('e2-01', '2026-11-15');
    // The PC's write lands between the phone's read and its write.
    gh.beforePut = () => {
      const merged = mergeProgress(JSON.parse(gh.content!) as Progress, pc.p);
      gh.put(JSON.stringify(merged));
    };
    expect(await syncOnce(cfg, gh.fetch, phone.store)).toBe('pushed');
    expect(Object.keys(gh.progress().completed).sort()).toEqual(['e2-01', 'f3-01', 'f3-02']);
  });

  it('does not write when nothing changed', async () => {
    const gh = new FakeGitHub();
    const phone = new Device(emptyProgress());
    phone.doLesson('f3-01', '2026-11-14');
    await syncOnce(cfg, gh.fetch, phone.store);
    expect(await syncOnce(cfg, gh.fetch, phone.store)).toBe('unchanged');
    expect(gh.writes).toBe(1);
  });

  it('reports a rejected token without ever including it', async () => {
    const gh = new FakeGitHub();
    const bad = { ...cfg, token: 'wrong_token_value' };
    const err = await syncOnce(bad, gh.fetch, new Device(emptyProgress()).store).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SyncError);
    expect((err as SyncError).kind).toBe('auth');
    expect((err as Error).message).not.toContain('wrong_token_value');
  });

  it('reports no connection as offline, keeping local progress', async () => {
    const offline: FetchFn = () => Promise.reject(new TypeError('Failed to fetch'));
    const phone = new Device(emptyProgress());
    phone.doLesson('f3-01', '2026-11-14');
    const err = (await syncOnce(cfg, offline, phone.store).catch((e: unknown) => e)) as SyncError;
    expect(err.kind).toBe('network');
    expect(phone.p.completed['f3-01']).toBeTruthy();
  });

  it('refuses a public repository', async () => {
    const gh = new FakeGitHub();
    gh.isPrivate = false;
    await expect(checkRepo(cfg, gh.fetch)).rejects.toMatchObject({ kind: 'public' });
    gh.isPrivate = true;
    await expect(checkRepo(cfg, gh.fetch)).resolves.toBeUndefined();
  });

  it('round-trips non-ASCII text through base64', () => {
    const s = 'naïve → café “quotes” 你好';
    expect(fromBase64(toBase64(s))).toBe(s);
  });
});

describe('connection details', () => {
  it('parses owner/repo and GitHub URLs', () => {
    expect(parseRepo('learner/epoch-progress')).toEqual({ owner: 'learner', repo: 'epoch-progress' });
    expect(parseRepo('https://github.com/learner/epoch-progress.git')).toEqual({ owner: 'learner', repo: 'epoch-progress' });
    expect(parseRepo('epoch-progress')).toBeNull();
  });
  it('masks the token', () => {
    const m = maskToken('github_pat_ABCDEFGHIJKLMNOP1234');
    expect(m).toBe('github_pat_••••••••1234');
    expect(m).not.toContain('ABCDEF');
  });
});
