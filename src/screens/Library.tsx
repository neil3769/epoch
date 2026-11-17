import { Fragment, useMemo, useState, type ReactNode } from 'react';
import type { LibraryPage, Unit } from '../../content/schema';
import { BookIcon, CheckIcon, CodeIcon, LockIcon, TopBar, go } from '../components/Bits';
import { CodeBlock, Inline, OutputBlock } from '../components/Text';
import { unitDone } from '../lib/curriculum';
import { catalog } from '../../content/index';
import { NUMBER_SECTIONS, NUMBER_SOURCES } from '../../content/numbers';
import { DiagramView } from '../figures/Diagram';
import { useProgress, type Progress } from '../lib/progress';

/** Units that have a Library page, in curriculum order. */
const pages = (): { unit: Unit; page: LibraryPage }[] =>
  catalog.flatMap((e) => (e.unit?.library ? [{ unit: e.unit, page: e.unit.library }] : []));

/** Every searchable passage on a page, with a label saying where it is. */
function passages(page: LibraryPage): { where: string; text: string }[] {
  return [
    ...page.ideas.map((i) => ({ where: i.title, text: i.text })),
    ...page.rules.map((r) => ({ where: 'Rule', text: r })),
    { where: 'Example', text: page.example.code },
    ...page.example.notes.map((n) => ({ where: 'Example', text: n })),
    ...page.mistakes.map((m) => ({ where: 'Common mistake', text: `${m.mistake} ${m.fix}` })),
    ...(page.forReal ? [{ where: 'For real', text: page.forReal }] : []),
  ];
}

/** Text with each match of `q` marked. */
function Marked({ text, q }: { text: string; q: string }) {
  if (!q) return <Inline text={text} />;
  const plain = text.replace(/`|\*\*/g, '');
  const out: ReactNode[] = [];
  const lower = plain.toLowerCase();
  let i = 0;
  let k = 0;
  for (let at = lower.indexOf(q); at !== -1; at = lower.indexOf(q, i)) {
    out.push(<Fragment key={k++}>{plain.slice(i, at)}</Fragment>, <mark key={k++}>{plain.slice(at, at + q.length)}</mark>);
    i = at + q.length;
  }
  out.push(<Fragment key={k++}>{plain.slice(i)}</Fragment>);
  return <>{out}</>;
}

const isOpen = (unit: Unit, p: Progress) => unitDone(unit, p);

/** The Library tab on the home screen: search, then one row per unit page. */
export function LibraryList() {
  const p = useProgress();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const all = pages();
  const hits = useMemo(
    () =>
      q.length < 2
        ? []
        : all
            .filter(({ unit }) => isOpen(unit, p))
            .flatMap(({ unit, page }) => passages(page).filter((x) => x.text.toLowerCase().includes(q)).map((x) => ({ unit, ...x }))),
    [q, all, p],
  );

  return (
    <div className="library">
      <input
        className="text-input search"
        type="search"
        placeholder="Search the Library"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search the Library"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
      />
      {q.length >= 2 ? (
        <div className="search-results" role="list">
          {hits.length === 0 && <p className="muted">Nothing found in the pages you have unlocked.</p>}
          {hits.slice(0, 30).map((h, i) => (
            <button key={i} role="listitem" className="hit" onClick={() => go(`#/library/${h.unit.id}`)}>
              <span className="hit-where">
                {h.unit.id} · {h.where}
              </span>
              <span className="hit-text">
                <Marked text={h.text} q={q} />
              </span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <p className="muted small">Finishing a unit opens its one-page summary here: the ideas, the rules, an example and the common mistakes.</p>
          <button className="lib-row" onClick={() => go('#/library/numbers')}>
            <span className="unit-id">#</span>
            <span className="lib-title">
              Numbers for estimates
              <span className="unit-meta">Powers of two, time, latency, availability, sizes · always open</span>
            </span>
            <BookIcon />
          </button>
          {all.map(({ unit }) => {
            const open = isOpen(unit, p);
            const done = unit.lessons.filter((l) => p.completed[l.id]).length;
            return (
              <button key={unit.id} className={`lib-row${open ? '' : ' locked'}`} onClick={() => go(`#/library/${unit.id}`)}>
                <span className="unit-id">{unit.id}</span>
                <span className="lib-title">
                  {unit.title}
                  <span className="unit-meta">{open ? 'Summary' : `Finish the unit to open it · ${done}/${unit.lessons.length} lessons`}</span>
                </span>
                {open ? <BookIcon /> : <LockIcon />}
              </button>
            );
          })}
        </>
      )}
    </div>
  );
}

/** One unit's summary page. */
export function LibraryPageView({ unitId }: { unitId: string }) {
  const p = useProgress();
  if (unitId === 'numbers') return <NumbersPage />;
  const entry = pages().find((x) => x.unit.id === unitId);
  if (!entry)
    return (
      <main className="screen">
        <TopBar title="Library" />
        <p>There is no Library page for {unitId} yet.</p>
      </main>
    );
  const { unit, page } = entry;
  if (!isOpen(unit, p))
    return (
      <main className="screen">
        <TopBar title={`${unit.id} · Library`} />
        <p>
          This page opens when you finish {unit.id}: every lesson done, or its checkpoint passed to test out. It is the summary to come back to
          afterwards.
        </p>
      </main>
    );
  const labs = unit.labs ?? [];
  return (
    <main className="screen lib-page">
      <TopBar title={`${unit.id} · ${unit.title}`} />

      <section className="panel">
        <h2>Key ideas</h2>
        {page.ideas.map((i) => (
          <div key={i.title} className="idea">
            <h3>
              <Inline text={i.title} />
            </h3>
            <p>
              <Inline text={i.text} />
            </p>
          </div>
        ))}
      </section>

      <section className="panel">
        <h2>Rules</h2>
        <ul className="rules">
          {page.rules.map((r) => (
            <li key={r}>
              <Inline text={r} />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Example</h2>
        <CodeBlock code={page.example.code} />
        <OutputBlock text={page.example.output} />
        <ul className="notes">
          {page.example.notes.map((n) => (
            <li key={n}>
              <Inline text={n} />
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <h2>Common mistakes</h2>
        {page.mistakes.map((m) => (
          <div key={m.mistake} className="mistake">
            <p className="mistake-what">
              <Inline text={m.mistake} />
            </p>
            <p className="mistake-fix">
              <CheckIcon size={14} /> <Inline text={m.fix} />
            </p>
          </div>
        ))}
      </section>

      {page.diagram && (
        <section className="panel">
          <h2>Reference design</h2>
          <DiagramView spec={page.diagram} />
        </section>
      )}

      {page.forReal && (
        <section className="panel">
          <h2>Doing it for real</h2>
          <p>
            <Inline text={page.forReal} />
          </p>
        </section>
      )}

      {page.sources && (
        <section className="panel">
          <h2>Sources</h2>
          <ul className="sources">
            {page.sources.map((src) => (
              <li key={src.url}>
                <a href={src.url} target="_blank" rel="noreferrer">
                  {src.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {labs.length > 0 && (
        <section className="panel">
          <h2>Your programs</h2>
          {labs.map((lab) => (
            <button key={lab.id} className="lib-row" onClick={() => go(`#/lab/${lab.id}`)}>
              <CodeIcon />
              <span className="lib-title">
                {lab.title}
                <span className="unit-meta">{p.completed[lab.id] ? 'Open and copy your code' : 'Not built yet'}</span>
              </span>
            </button>
          ))}
        </section>
      )}
    </main>
  );
}

/** The Numbers page: open from the start; every estimate exercise uses these values. */
function NumbersPage() {
  return (
    <main className="screen lib-page">
      <TopBar title="Numbers for estimates" />
      <p className="muted small">
        Rough orders of magnitude for back-of-envelope sizing. Every estimate in the System Design track uses exactly these values.
      </p>
      {NUMBER_SECTIONS.map((sec) => (
        <section key={sec.title} className="panel">
          <h2>{sec.title}</h2>
          {sec.note && <p className="muted small">{sec.note}</p>}
          <dl className="numbers">
            {sec.rows.map((r) => (
              <div key={r.name} className="num-row">
                <dt>{r.shown}</dt>
                <dd>{r.what}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
      <section className="panel">
        <h2>Sources</h2>
        <ul className="sources">
          {NUMBER_SOURCES.map((src) => (
            <li key={src.url}>
              <a href={src.url} target="_blank" rel="noreferrer">
                {src.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
