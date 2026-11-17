import type { Unit } from './schema';
import { f1 } from './units/f1';
import { f2 } from './units/f2';
import { f3 } from './units/f3';
import { f4 } from './units/f4';
import { f5 } from './units/f5';
import { f6 } from './units/f6';
import { f7 } from './units/f7';
import { f8 } from './units/f8';
import { f9 } from './units/f9';
import { f10 } from './units/f10';
import { f11 } from './units/f11';
import { e1 } from './units/e1';
import { e2 } from './units/e2';
import { e3 } from './units/e3';
import { e4 } from './units/e4';
import { e5 } from './units/e5';
import { e6 } from './units/e6';
import { e7 } from './units/e7';
import { e8 } from './units/e8';
import { e9 } from './units/e9';
import { e10 } from './units/e10';
import { e11 } from './units/e11';
import { s1 } from './units/s1';
import { s2 } from './units/s2';
import { s3 } from './units/s3';
import { s4 } from './units/s4';
import { s5 } from './units/s5';

export type Track = 'foundations' | 'engineering' | 'system-design';

export interface UnitEntry {
  id: string;
  track: Track;
  title: string;
  /** Number of lessons the unit will have when complete. */
  planned: number;
  /** Lessons written so far (absent: not written yet). */
  unit?: Unit;
}

const written: Record<string, Unit> = { F1: f1, F2: f2, F3: f3, F4: f4, F5: f5, F6: f6, F7: f7, F8: f8, F9: f9, F10: f10, F11: f11, E1: e1, E2: e2, E3: e3, E4: e4, E5: e5, E6: e6, E7: e7, E8: e8, E9: e9, E10: e10, E11: e11, S1: s1, S2: s2, S3: s3, S4: s4, S5: s5 };

const plan: Omit<UnitEntry, 'unit'>[] = [
  { id: 'F1', track: 'foundations', title: 'Python you will see in ML code', planned: 12 },
  { id: 'F2', track: 'foundations', title: 'Vectors', planned: 8 },
  { id: 'F3', track: 'foundations', title: 'Matrices and matrix multiplication', planned: 12 },
  { id: 'F4', track: 'foundations', title: 'NumPy', planned: 14 },
  { id: 'F5', track: 'foundations', title: 'Change and gradients', planned: 9 },
  { id: 'F6', track: 'foundations', title: 'Probability and loss', planned: 9 },
  { id: 'F7', track: 'foundations', title: 'Machine learning from scratch', planned: 10 },
  { id: 'F8', track: 'foundations', title: 'Neural networks', planned: 12 },
  { id: 'F9', track: 'foundations', title: 'PyTorch', planned: 14 },
  { id: 'F10', track: 'foundations', title: 'Text as numbers', planned: 7 },
  { id: 'F11', track: 'foundations', title: 'Attention and transformers', planned: 12 },
  { id: 'E1', track: 'engineering', title: 'A real Python project', planned: 8 },
  { id: 'E2', track: 'engineering', title: 'Async and HTTP', planned: 8 },
  { id: 'E3', track: 'engineering', title: 'Calling an LLM', planned: 10 },
  { id: 'E4', track: 'engineering', title: 'Prompts and context', planned: 7 },
  { id: 'E5', track: 'engineering', title: 'Evaluation', planned: 11 },
  { id: 'E6', track: 'engineering', title: 'Retrieval (RAG)', planned: 10 },
  { id: 'E7', track: 'engineering', title: 'Agents', planned: 10 },
  { id: 'E8', track: 'engineering', title: 'Shipping a service', planned: 12 },
  { id: 'E9', track: 'engineering', title: 'Cost, latency, observability', planned: 8 },
  { id: 'E10', track: 'engineering', title: 'Safety', planned: 7 },
  { id: 'E11', track: 'engineering', title: 'Interview practice', planned: 12 },
  { id: 'S1', track: 'system-design', title: 'How a request travels', planned: 9 },
  { id: 'S2', track: 'system-design', title: 'Back-of-envelope estimation', planned: 8 },
  { id: 'S3', track: 'system-design', title: 'Scaling out', planned: 8 },
  { id: 'S4', track: 'system-design', title: 'Caching and CDNs', planned: 10 },
  { id: 'S5', track: 'system-design', title: 'Databases: modelling and queries', planned: 11 },
  { id: 'S6', track: 'system-design', title: 'Databases: replication and partitioning', planned: 11 },
  { id: 'S7', track: 'system-design', title: 'Consistency and coordination', planned: 10 },
  { id: 'S8', track: 'system-design', title: 'Queues, streams and async work', planned: 10 },
  { id: 'S9', track: 'system-design', title: 'APIs and service boundaries', planned: 10 },
  { id: 'S10', track: 'system-design', title: 'Reliability and operations', planned: 10 },
  { id: 'S11', track: 'system-design', title: 'Specialised building blocks', planned: 11 },
  { id: 'S12', track: 'system-design', title: 'Designing AI systems', planned: 9 },
  { id: 'S13', track: 'system-design', title: 'Low-level design in Python', planned: 10 },
  { id: 'S14', track: 'system-design', title: 'The design interview', planned: 6 },
];

export const catalog: UnitEntry[] = plan.map((u) => ({ ...u, unit: written[u.id] }));

export const writtenUnits: Unit[] = Object.values(written);
