import { useState, type ReactNode } from 'react';
import type { DiagramSpec, NodeKindT } from '../../content/schema';
import { NODE_H, VIEW_W, layout } from '../lib/diagram';

/** How a node is drawn in an exercise: tapped, graded, or the empty slot. */
export type NodeMark = 'picked' | 'right' | 'wrong' | 'slot';

/** A 16 × 16 glyph for each kind of building block. */
function Glyph({ kind }: { kind: NodeKindT }): ReactNode {
  switch (kind) {
    case 'client':
      return <path d="M2 3h12v8H2z M6 14h4 M8 11v3" />;
    case 'dns':
      return <path d="M8 2a6 6 0 1 0 0.01 0z M2 8h12 M8 2c-3 3-3 9 0 12 M8 2c3 3 3 9 0 12" />;
    case 'cdn':
      return <path d="M4 12a3 3 0 0 1 0-6 4 4 0 0 1 8 0 3 3 0 0 1 0 6z" />;
    case 'lb':
      return <path d="M8 2v5 M8 7L3 13 M8 7v6 M8 7l5 6" />;
    case 'service':
      return <path d="M3 3h10v10H3z M6 6h4 M6 9h4" />;
    case 'cache':
      return <path d="M9 1L3 9h5l-1 6 6-9H8z" />;
    case 'db':
      return <path d="M3 4c0-2 10-2 10 0v8c0 2-10 2-10 0z M3 4c0 2 10 2 10 0" />;
    case 'replica':
      return <path d="M2 6c0-1.5 7-1.5 7 0v7c0 1.5-7 1.5-7 0z M7 3c0-1.5 7-1.5 7 0v7c0 1-2 1.4-4 1.5" />;
    case 'queue':
      return <path d="M2 5h12v6H2z M5 5v6 M8 5v6 M11 5v6" />;
    case 'worker':
      return <path d="M8 5a3 3 0 1 0 0.01 0z M8 1v3 M8 12v3 M1 8h3 M12 8h3 M3 3l2 2 M11 11l2 2 M13 3l-2 2 M3 13l2-2" />;
    case 'store':
      return <path d="M2 4h12l-2 10H4z M2 4c0-1 12-1 12 0" />;
    case 'search':
      return <path d="M7 2a5 5 0 1 0 0.01 0z M10.5 10.5L15 15" />;
    case 'model':
      return <path d="M4 4h8v8H4z M6 1v3 M10 1v3 M6 12v3 M10 12v3 M1 6h3 M1 10h3 M12 6h3 M12 10h3" />;
    case 'vector':
      return <path d="M8 9L14 3 M8 9L2 5 M8 9l2 6 M12 3h2v2" />;
    case 'api':
      return <path d="M5 1v4 M11 1v4 M3 5h10v3a5 5 0 0 1-10 0z M8 13v3" />;
  }
}

type Shape = 'pill' | 'cyl' | 'rect' | 'queue';
const shapeOf = (k: NodeKindT): Shape =>
  ['client', 'dns', 'cdn', 'api'].includes(k) ? 'pill' : ['db', 'replica', 'vector', 'search', 'store'].includes(k) ? 'cyl' : k === 'queue' ? 'queue' : 'rect';

function NodeShape({ w, kind }: { w: number; kind: NodeKindT }) {
  const h = NODE_H;
  const s = shapeOf(kind);
  if (s === 'cyl')
    return (
      <>
        <path className="dg-shape" d={`M0,7 C0,-2 ${w},-2 ${w},7 V${h - 7} C${w},${h + 2} 0,${h + 2} 0,${h - 7} Z`} />
        <path className="dg-rim" d={`M0,7 C0,15 ${w},15 ${w},7`} />
      </>
    );
  return <rect className="dg-shape" width={w} height={h} rx={s === 'pill' ? h / 2 : s === 'queue' ? 3 : 10} />;
}

export interface DiagramProps {
  spec: DiagramSpec;
  /** Node ids to show (all when absent). */
  visible?: Set<string>;
  onTap?: (id: string) => void;
  marks?: Record<string, NodeMark>;
  /** Small numbers on nodes, for a tapped path. */
  badges?: Record<string, string>;
  /** What to draw in the empty slot, once chosen. */
  slotFill?: { kind: NodeKindT; label: string };
  label?: string;
}

export function Diagram({ spec, visible, onTap, marks = {}, badges = {}, slotFill, label }: DiagramProps) {
  const { nodes, edges, height } = layout(spec, visible);
  return (
    <svg className="diagram" viewBox={`0 0 ${VIEW_W} ${height}`} role="img" aria-label={label ?? 'Architecture diagram'}>
      <defs>
        <marker id="dg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" className="dg-head" />
        </marker>
      </defs>
      {edges.map((e, i) => (
        <g key={i}>
          <path d={e.path} className={`dg-edge${e.dashed ? ' dashed' : ''}`} markerEnd="url(#dg-arrow)" />
          {e.label && (
            <g transform={`translate(${e.lx},${e.ly})`}>
              <rect className="dg-elabel-bg" x={-e.label.length * 3.4 - 4} y={-8} width={e.label.length * 6.8 + 8} height={16} rx={4} />
              <text className="dg-elabel" textAnchor="middle" dy="4">
                {e.label}
              </text>
            </g>
          )}
        </g>
      ))}
      {nodes.map((n) => {
        const mark = marks[n.id];
        const isSlot = mark === 'slot';
        const kind = isSlot && slotFill ? slotFill.kind : n.kind;
        const text = isSlot ? (slotFill ? slotFill.label : '?') : n.label;
        const tappable = !!onTap && !isSlot;
        return (
          <g
            key={n.id}
            transform={`translate(${n.x},${n.y})`}
            className={`dg-node${mark ? ' ' + mark : ''}${tappable ? ' tappable' : ''}${isSlot && !slotFill ? ' empty' : ''}`}
            role={tappable ? 'button' : undefined}
            tabIndex={tappable ? 0 : undefined}
            aria-label={tappable ? text : undefined}
            onClick={tappable ? () => onTap(n.id) : undefined}
            onKeyDown={
              tappable
                ? (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      onTap(n.id);
                    }
                  }
                : undefined
            }
          >
            <NodeShape w={n.w} kind={kind} />
            {!(isSlot && !slotFill) && (
              <g className="dg-glyph" transform={`translate(${n.w / 2 - 8},${shapeOf(kind) === 'cyl' ? 13 : 8})`}>
                <Glyph kind={kind} />
              </g>
            )}
            <text className="dg-label" x={n.w / 2} y={isSlot && !slotFill ? NODE_H / 2 + 6 : NODE_H - 10} textAnchor="middle">
              {text}
            </text>
            {badges[n.id] && (
              <g transform={`translate(${n.w - 4},4)`}>
                <circle r="9" className="dg-badge" />
                <text className="dg-badge-text" textAnchor="middle" dy="4">
                  {badges[n.id]}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A diagram on a card or Library page; with stages, the design grows step by step. */
export function DiagramView({ spec }: { spec: DiagramSpec }) {
  const [k, setK] = useState(0);
  if (!spec.stages) return <Diagram spec={spec} />;
  const st = spec.stages[k];
  return (
    <div className="dg-stages">
      <Diagram spec={spec} visible={new Set(st.nodes)} label={st.caption} />
      <p className="dg-caption">{st.caption}</p>
      <div className="dg-step-row">
        <button type="button" className="btn btn-small" disabled={k === 0} onClick={() => setK(k - 1)}>
          Back
        </button>
        <span className="dg-step-count">
          {k + 1} / {spec.stages.length}
        </span>
        <button type="button" className="btn btn-small" disabled={k === spec.stages.length - 1} onClick={() => setK(k + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
