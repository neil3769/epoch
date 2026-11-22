import type { DiagramSpec, NodeKindT } from '../../content/schema';

/*
 * Automatic layout for architecture diagrams, shared by the component and
 * the content verifier. Nodes are listed in the order a request meets them;
 * an edge from an earlier node to a later one pushes the later node down a
 * layer. Edges to earlier nodes are return arrows, drawn on the right.
 */

export const VIEW_W = 340;
export const NODE_H = 50;
const LAYER_GAP = 34;
const PAD = 4;
const RIGHT = 28; // room on the right for return arrows
const GAP_X = 10;
export const MAX_PER_LAYER = 3;
export const MAX_LAYERS = 6;

export interface PlacedNode {
  id: string;
  kind: NodeKindT;
  label: string;
  layer: number;
  x: number;
  y: number;
  w: number;
}

export interface PlacedEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  path: string;
  lx: number;
  ly: number;
}

export interface Layout {
  nodes: PlacedNode[];
  edges: PlacedEdge[];
  height: number;
}

const visibleNodes = (spec: DiagramSpec, visible?: Set<string>) => spec.nodes.filter((n) => !visible || visible.has(n.id));

/** Layer of each node: the longest chain of forward edges leading to it. */
export function layersOf(spec: DiagramSpec, visible?: Set<string>): Map<string, number> {
  const nodes = visibleNodes(spec, visible);
  const pos = new Map(nodes.map((n, i) => [n.id, i]));
  const layer = new Map(nodes.map((n) => [n.id, 0]));
  for (let k = 0; k < nodes.length; k++)
    for (const e of spec.edges) {
      const a = pos.get(e.from);
      const b = pos.get(e.to);
      if (a === undefined || b === undefined || a >= b) continue;
      layer.set(e.to, Math.max(layer.get(e.to)!, layer.get(e.from)! + 1));
    }
  return layer;
}

export function layout(spec: DiagramSpec, visible?: Set<string>): Layout {
  const nodes = visibleNodes(spec, visible);
  const layer = layersOf(spec, visible);
  const rows: string[][] = [];
  for (const n of nodes) (rows[layer.get(n.id)!] ??= []).push(n.id);
  const placed = new Map<string, PlacedNode>();
  const usable = VIEW_W - PAD - RIGHT;
  rows.forEach((ids, li) => {
    if (!ids) return;
    const w = Math.min(130, (usable - PAD - GAP_X * (ids.length - 1)) / ids.length);
    const total = w * ids.length + GAP_X * (ids.length - 1);
    const x0 = PAD + (usable - PAD - total) / 2;
    ids.forEach((id, i) => {
      const n = nodes.find((m) => m.id === id)!;
      placed.set(id, { id, kind: n.kind, label: n.label, layer: li, x: x0 + i * (w + GAP_X), y: PAD + li * (NODE_H + LAYER_GAP), w });
    });
  });
  const edges: PlacedEdge[] = [];
  for (const e of spec.edges) {
    const a = placed.get(e.from);
    const b = placed.get(e.to);
    if (!a || !b) continue;
    let path: string;
    let lx: number;
    let ly: number;
    if (b.layer > a.layer && !crossesBox(a, b, placed)) {
      const x1 = a.x + a.w / 2;
      const y1 = a.y + NODE_H;
      const x2 = b.x + b.w / 2;
      const y2 = b.y;
      path = `M${x1},${y1} L${x2},${y2}`;
      lx = (x1 + x2) / 2;
      ly = (y1 + y2) / 2;
    } else if (b.layer === a.layer) {
      const left = a.x < b.x;
      const x1 = left ? a.x + a.w : a.x;
      const x2 = left ? b.x : b.x + b.w;
      const y = a.y + NODE_H / 2;
      path = `M${x1},${y} L${x2},${y}`;
      lx = (x1 + x2) / 2;
      ly = y - 9;
    } else {
      const x1 = a.x + a.w;
      const y1 = a.y + NODE_H / 2;
      const x2 = b.x + b.w;
      const y2 = b.y + NODE_H / 2;
      const cx = VIEW_W - 6;
      path = `M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`;
      lx = cx - 10;
      ly = (y1 + y2) / 2;
    }
    edges.push({ from: e.from, to: e.to, label: e.label, dashed: e.dashed, path, lx, ly });
  }
  const height = PAD * 2 + rows.length * NODE_H + Math.max(0, rows.length - 1) * LAYER_GAP;
  return { nodes: [...placed.values()], edges, height };
}

/**
 * True when the straight line from a's bottom to b's top would pass through
 * a box in a layer between them; such edges go round the right-hand margin.
 */
function crossesBox(a: PlacedNode, b: PlacedNode, placed: Map<string, PlacedNode>): boolean {
  if (b.layer - a.layer < 2) return false;
  const x1 = a.x + a.w / 2;
  const y1 = a.y + NODE_H;
  const x2 = b.x + b.w / 2;
  const y2 = b.y;
  const xAt = (y: number) => x1 + ((x2 - x1) * (y - y1)) / (y2 - y1);
  for (const n of placed.values()) {
    if (n.layer <= a.layer || n.layer >= b.layer) continue;
    const xs = [xAt(n.y), xAt(n.y + NODE_H)];
    const lo = Math.min(...xs);
    const hi = Math.max(...xs);
    if (hi > n.x - 4 && lo < n.x + n.w + 4) return true;
  }
  return false;
}

/** True when each consecutive pair of `ids` is joined by an edge in that direction. */
export function isPath(spec: DiagramSpec, ids: string[]): boolean {
  return ids.every((id, i) => i === 0 || spec.edges.some((e) => e.from === ids[i - 1] && e.to === id));
}

/** Structural problems in a diagram (empty when it is fine). */
export function diagramProblems(spec: DiagramSpec): string[] {
  const out: string[] = [];
  const ids = spec.nodes.map((n) => n.id);
  if (new Set(ids).size !== ids.length) out.push('node ids are not unique');
  const has = new Set(ids);
  for (const e of spec.edges) {
    if (!has.has(e.from) || !has.has(e.to)) out.push(`edge ${e.from} -> ${e.to} refers to a missing node`);
    if (e.from === e.to) out.push(`edge ${e.from} -> ${e.to} is a loop`);
  }
  const check = (visible: Set<string> | undefined, what: string) => {
    const layer = layersOf(spec, visible);
    const counts = new Map<number, number>();
    for (const l of layer.values()) counts.set(l, (counts.get(l) ?? 0) + 1);
    if (counts.size > MAX_LAYERS) out.push(`${what}: ${counts.size} layers (max ${MAX_LAYERS})`);
    for (const [l, c] of counts) if (c > MAX_PER_LAYER) out.push(`${what}: layer ${l} has ${c} nodes (max ${MAX_PER_LAYER})`);
  };
  check(undefined, 'diagram');
  spec.stages?.forEach((st, i) => {
    for (const id of st.nodes) if (!has.has(id)) out.push(`stage ${i + 1} refers to missing node ${id}`);
    check(new Set(st.nodes), `stage ${i + 1}`);
  });
  return out;
}
