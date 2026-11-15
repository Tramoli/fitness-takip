import { describe, expect, it } from 'vitest';
import { ACTIVATION, effectiveSets, muscleWeeklyZone, sessionZone, weeklyZone, workoutsLoad } from './muscles';
import { DEFAULT_EXERCISES } from './exercises';
import type { Exercise } from './types';

describe('aktivasyon verisi', () => {
  it('her varsayılan hareketin bir profili var', () => {
    const missing = DEFAULT_EXERCISES.filter((e) => !ACTIVATION[e.id]).map((e) => e.id);
    expect(missing).toEqual([]);
  });
  it('rapordaki değerler: bench orta göğüs 1, incline üst göğüs 1, concentration curl %97', () => {
    expect(ACTIVATION['bench-press'].m.chest).toBe(1);
    expect(ACTIVATION['incline-bench-press'].m.chest_upper).toBe(1);
    expect(ACTIVATION['concentration-curl'].m.biceps).toBe(0.97);
    expect(ACTIVATION['bench-press'].emg).toBe(true);
  });
});

describe('effectiveSets', () => {
  it('set × aktivasyon, kas başına toplanır', () => {
    const load = effectiveSets(
      [
        { exerciseId: 'bench-press', sets: 4 },
        { exerciseId: 'dips', sets: 3 },
      ],
      DEFAULT_EXERCISES,
    );
    expect(load.chest).toBe(5.5); // 4×1 + 3×0,5
    expect(load.triceps).toBe(4.6); // 4×0,5 + 3×0,87
  });
  it('listede olmayan hareket kas grubuna göre', () => {
    const custom: Exercise = { id: 'x', name: 'Hip Machine', muscleGroup: 'Biceps' };
    expect(effectiveSets([{ exerciseId: 'x', sets: 3 }], [custom])).toEqual({ biceps: 3 });
  });
  it('gerçek antrenmanda yalnızca tamamlanmış setler sayılır', () => {
    const load = workoutsLoad(
      [{ id: 'a', date: '2026-11-14', exercises: [{ exerciseId: 'leg-extension', sets: [{ kg: 50, reps: 10 }, { kg: 0, reps: 0 }] }] }],
      DEFAULT_EXERCISES,
      '2026-11-09',
      '2026-11-15',
    );
    expect(load).toEqual({ quads: 1 });
  });
});

describe('bölgeler', () => {
  it('seans: 10 set tavanı', () => {
    expect([0, 1, 3, 9, 11].map(sessionZone)).toEqual(['none', 'low', 'mid', 'good', 'over']);
  });
  it('haftalık: hedefe göre', () => {
    expect([0, 3, 8, 12, 17].map((n) => weeklyZone(n, [10, 16]))).toEqual(['none', 'low', 'mid', 'good', 'over']);
  });
});

describe('kas hacim işaretleri', () => {
  it('göğüs: MEV 4, MAV 6–16, MRV 16', () => {
    expect([0, 3, 5, 12, 18].map((n) => muscleWeeklyZone(n, 'chest', [10, 20]))).toEqual(['none', 'low', 'mid', 'good', 'over']);
  });
  it('verisi olmayan kas seviye hedefini kullanır', () => {
    expect(muscleWeeklyZone(12, 'forearms', [10, 20])).toBe('good');
  });
});

