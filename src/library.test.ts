import { describe, expect, it } from 'vitest';
import { LIBRARY, planToTemplates } from './library';
import { DEFAULT_EXERCISES } from './exercises';

describe('hazır programlar', () => {
  const ids = new Set(DEFAULT_EXERCISES.map((e) => e.id));
  it('tüm hareketler listede var', () => {
    for (const p of LIBRARY) for (const d of p.days) for (const x of d.exercises) expect(ids.has(x.id), `${p.id} ${x.id}`).toBe(true);
  });
  it('günleri ayrı programlara alt sınırla çevirir', () => {
    let n = 0;
    const ts = planToTemplates(LIBRARY.find((p) => p.id === 'gbr')!, () => String(++n));
    expect(ts.map((t) => t.name)).toEqual(['GBR: Alt vücut', 'GBR: Üst vücut']);
    expect(ts[0].exercises[0]).toEqual({ exerciseId: 'squat', sets: 3, reps: 6 });
  });
});
