import { describe, expect, it } from 'vitest';
import { estimate1RM, exerciseProgress, lastSetsFor, personalRecords, weeklyVolume } from './stats';
import type { Workout } from './types';

const workouts: Workout[] = [
  {
    id: 'a',
    date: '2026-11-03',
    exercises: [{ exerciseId: 'bench', sets: [{ kg: 60, reps: 10 }, { kg: 70, reps: 5 }] }],
  },
  {
    id: 'b',
    date: '2026-11-10',
    exercises: [
      { exerciseId: 'bench', sets: [{ kg: 72.5, reps: 3 }, { kg: 65, reps: 8 }] },
      { exerciseId: 'squat', sets: [{ kg: 100, reps: 5 }] },
    ],
  },
  {
    id: 'c',
    date: '2026-11-12',
    exercises: [{ exerciseId: 'squat', sets: [{ kg: 100, reps: 6 }] }],
  },
];

describe('estimate1RM', () => {
  it('Epley formülü', () => {
    expect(estimate1RM({ kg: 100, reps: 1 })).toBe(100);
    expect(estimate1RM({ kg: 60, reps: 10 })).toBeCloseTo(80);
    expect(estimate1RM({ kg: 50, reps: 0 })).toBe(0);
  });
});

describe('exerciseProgress', () => {
  it('her gün için max kg ve 1RM', () => {
    const p = exerciseProgress(workouts, 'bench');
    expect(p.map((x) => x.date)).toEqual(['2026-11-03', '2026-11-10']);
    expect(p[0].maxKg).toBe(70);
    expect(p[0].est1RM).toBe(81.7); // 70*(1+5/30)
    expect(p[1].maxKg).toBe(72.5);
    expect(p[1].volume).toBe(72.5 * 3 + 65 * 8);
  });
});

describe('personalRecords', () => {
  it('en ağır set, en iyi 1RM ve hacim', () => {
    const pr = personalRecords(workouts, 'bench');
    expect(pr.sessions).toBe(2);
    expect(pr.heaviest).toMatchObject({ kg: 72.5, reps: 3, date: '2026-11-10' });
    expect(pr.best1RM).toMatchObject({ value: 82.3, kg: 65, reps: 8 });
    expect(pr.bestVolume).toMatchObject({ value: 950, date: '2026-11-03' });
  });
  it('aynı kg için daha çok tekrar rekor sayılır', () => {
    expect(personalRecords(workouts, 'squat').heaviest).toMatchObject({ kg: 100, reps: 6 });
  });
});

describe('weeklyVolume', () => {
  it('Pazartesi başlangıçlı haftalara toplar', () => {
    const w = weeklyVolume(workouts, 3, new Date('2026-11-15T12:00:00'));
    // 2026-11-03 Salı -> haftası 2026-11-02 Pazartesi
    expect(w.map((x) => x.weekStart)).toEqual(['2026-10-26', '2026-11-02', '2026-11-09']);
    expect(w[0]).toMatchObject({ volume: 0, workouts: 0 });
    expect(w[1]).toMatchObject({ volume: 950, workouts: 1 });
    expect(w[2]).toMatchObject({ volume: 737.5 + 500 + 600, workouts: 2 });
  });
});

describe('lastSetsFor', () => {
  it('önceki en son antrenmanı bulur', () => {
    expect(lastSetsFor(workouts, 'bench', '2026-11-15')?.date).toBe('2026-11-10');
    expect(lastSetsFor(workouts, 'bench', '2026-11-10')?.date).toBe('2026-11-03');
    expect(lastSetsFor(workouts, 'bench', '2026-11-03')).toBeUndefined();
  });
});
