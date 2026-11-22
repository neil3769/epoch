import { describe, expect, it } from 'vitest';
import type { DiagramSpec } from '../content/schema';
import { NUMBER_ROWS, NUMBERS_PY } from '../content/numbers';
import { diagramProblems, isPath, layersOf, layout } from '../src/lib/diagram';
import { formatNumber, parseAmount, withinFactor } from '../src/lib/estimate';

const chain: DiagramSpec = {
  nodes: [
    { id: 'c', kind: 'client', label: 'Browser' },
    { id: 'l', kind: 'lb', label: 'Balancer' },
    { id: 'a', kind: 'service', label: 'App 1' },
    { id: 'b', kind: 'service', label: 'App 2' },
    { id: 'd', kind: 'db', label: 'Database' },
  ],
  edges: [
    { from: 'c', to: 'l' },
    { from: 'l', to: 'a' },
    { from: 'l', to: 'b' },
    { from: 'a', to: 'd' },
    { from: 'b', to: 'd' },
    { from: 'd', to: 'c', label: 'reply' },
  ],
};

describe('estimate helpers', () => {
  it('parses numbers with commas and suffixes', () => {
    expect(parseAmount('1,200')).toBe(1200);
    expect(parseAmount('1.2k')).toBe(1200);
    expect(parseAmount(' 3 M ')).toBe(3e6);
    expect(parseAmount('2e6')).toBe(2e6);
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
  });
  it('accepts answers within the factor either way', () => {
    expect(withinFactor(100, 200, 2)).toBe(true);
    expect(withinFactor(400, 200, 2)).toBe(true);
    expect(withinFactor(401, 200, 2)).toBe(false);
    expect(withinFactor(99, 200, 2)).toBe(false);
  });
  it('formats large and small numbers for people', () => {
    expect(formatNumber(1500)).toBe('1,500');
    expect(formatNumber(2_500_000)).toBe('2.5 million');
    expect(formatNumber(83.33)).toBe('83.3');
  });
});

describe('numbers page', () => {
  it('exposes every value to Python by name', () => {
    for (const r of NUMBER_ROWS) expect(NUMBERS_PY).toContain(`${r.name} = ${r.value}`);
    expect(NUMBER_ROWS.find((r) => r.name === 'DAY')!.value).toBe(86_400);
  });
});

describe('diagram layout', () => {
  it('puts nodes in layers along forward edges, ignoring return edges', () => {
    const l = layersOf(chain);
    expect([l.get('c'), l.get('l'), l.get('a'), l.get('b'), l.get('d')]).toEqual([0, 1, 2, 2, 3]);
  });
  it('places side-by-side nodes without overlap', () => {
    const { nodes, height } = layout(chain);
    const a = nodes.find((n) => n.id === 'a')!;
    const b = nodes.find((n) => n.id === 'b')!;
    expect(a.x + a.w).toBeLessThanOrEqual(b.x);
    expect(a.y).toBe(b.y);
    expect(height).toBeGreaterThan(4 * 50);
  });
  it('lays out only the visible nodes of a stage', () => {
    const { nodes } = layout(chain, new Set(['c', 'l']));
    expect(nodes.map((n) => n.id)).toEqual(['c', 'l']);
  });
  it('checks paths against the edges', () => {
    expect(isPath(chain, ['c', 'l', 'a', 'd'])).toBe(true);
    expect(isPath(chain, ['c', 'a'])).toBe(false);
    expect(isPath(chain, ['a', 'l'])).toBe(false);
  });
  it('reports structural problems', () => {
    expect(diagramProblems(chain)).toEqual([]);
    const bad: DiagramSpec = {
      nodes: [
        { id: 'x', kind: 'service', label: 'A' },
        { id: 'y', kind: 'service', label: 'B' },
        { id: 'z', kind: 'service', label: 'C' },
        { id: 'w', kind: 'service', label: 'D' },
      ],
      edges: [{ from: 'x', to: 'q' }],
    };
    const probs = diagramProblems(bad);
    expect(probs.some((p) => p.includes('missing node'))).toBe(true);
    expect(probs.some((p) => p.includes('layer 0 has 4 nodes'))).toBe(true);
  });
});

import { layout as diagramLayout } from '../src/lib/diagram';

describe('diagram layout routing', () => {
  it('routes a long edge round the margin when a straight line would cross a box', () => {
    const spec = {
      nodes: [
        { id: 'c', kind: 'client' as const, label: 'App' },
        { id: 'a', kind: 'service' as const, label: 'Post API' },
        { id: 'f', kind: 'service' as const, label: 'Feed API' },
        { id: 'q', kind: 'queue' as const, label: 'Queue' },
        { id: 'w', kind: 'worker' as const, label: 'Fan-out' },
        { id: 'k', kind: 'cache' as const, label: 'Cache' },
      ],
      edges: [
        { from: 'c', to: 'a' },
        { from: 'c', to: 'f' },
        { from: 'a', to: 'q' },
        { from: 'q', to: 'w' },
        { from: 'w', to: 'k' },
        { from: 'f', to: 'k' },
      ],
    };
    const edges = diagramLayout(spec).edges;
    expect(edges.find((e) => e.from === 'f' && e.to === 'k')!.path).toContain('C');
    expect(edges.find((e) => e.from === 'q' && e.to === 'w')!.path).not.toContain('C');
  });
});
