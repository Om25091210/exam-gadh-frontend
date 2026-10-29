import { describe, expect, it } from 'vitest';
import { ENTITIES, workflowMoves } from './content-config';

const refs = { exams: [['cgpsc', 'CGPSC']] as Array<[string, string]>, subjects: [], topics: [] };

describe('content config', () => {
  it('every entity names its API path, columns and at least one required field', () => {
    for (const [key, e] of Object.entries(ENTITIES)) {
      expect(e.path, key).toBe(key);
      expect(e.columns.length, key).toBeGreaterThan(0);
      expect(e.fields(refs).some((f) => f.required), key).toBe(true);
    }
  });
  it('field keys are unique within an entity', () => {
    for (const e of Object.values(ENTITIES)) {
      const keys = e.fields(refs).map((f) => f.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });
  it('a PDF needs a file and other kinds need a link, never both', () => {
    const f = ENTITIES.materials.fields(refs);
    const file = f.find((x) => x.key === 'fileKey')!;
    const url = f.find((x) => x.key === 'url')!;
    expect(file.when!({ kind: 'pdf' })).toBe(true);
    expect(file.when!({ kind: 'video' })).toBe(false);
    expect(url.when!({ kind: 'video' })).toBe(true);
    expect(url.when!({ kind: 'pdf' })).toBe(false);
  });
  it('only publishers see the publish / unpublish moves as publisher-only', () => {
    expect(workflowMoves('draft', 'status').find((m) => m.to === 'published')!.publisher).toBe(true);
    expect(workflowMoves('draft', 'status').find((m) => m.to === 'in_review')!.publisher).toBe(false);
    expect(workflowMoves('live', 'status').every((m) => m.publisher)).toBe(true);
    expect(workflowMoves('live', 'published').map((m) => m.to)).toEqual(['draft']);
    expect(workflowMoves('draft', 'published').map((m) => m.to)).toEqual(['published']);
  });
});
