import { describe, expect, it } from 'vitest';
import { buildExercises, exerciseNeedsCloud, planUpload } from './cloud';
import { DEFAULT_EXERCISES } from './exercises';
import type { AppData } from './types';

describe('hareketler', () => {
  it('yalnızca eklenen ve ayarı değiştirilmiş hareketler buluta yazılır', () => {
    expect(exerciseNeedsCloud(DEFAULT_EXERCISES[0])).toBe(false);
    expect(exerciseNeedsCloud({ ...DEFAULT_EXERCISES[0], repMin: 8, repMax: 12 })).toBe(true);
    expect(exerciseNeedsCloud({ id: 'x', name: 'Özel' })).toBe(true);
  });
  it('buluttan gelen ayarlar varsayılanlara uygulanır, özel hareketler sona eklenir', () => {
    const list = buildExercises([
      { id: 'bench-press', name: 'Bench Press', repMin: 8, repMax: 12 },
      { id: 'x', name: 'Özel', muscleGroup: 'Göğüs' },
    ]);
    expect(list.length).toBe(DEFAULT_EXERCISES.length + 1);
    expect(list.find((e) => e.id === 'bench-press')).toMatchObject({ repMin: 8, repMax: 12, muscleGroup: 'Göğüs' });
    expect(list[list.length - 1].id).toBe('x');
  });
});

describe('planUpload (ilk giriş)', () => {
  const local: AppData = {
    version: 1,
    exercises: [...DEFAULT_EXERCISES, { id: 'x', name: 'Özel' }],
    workouts: [
      { id: 'a', date: '2026-11-10', exercises: [{ exerciseId: 'bench-press', sets: [{ kg: 80, reps: 8 }] }] },
      { id: 'b', date: '2026-11-12', exercises: [{ exerciseId: 'squat', sets: [{ kg: 100, reps: 5 }] }] },
      { id: 'c', date: '2026-11-13', exercises: [] },
    ],
    templates: [
      { id: 't1', name: 'A', exercises: [] },
      { id: 't2', name: 'B', exercises: [] },
    ],
  };
  it('bulutta olmayan günler, programlar ve özel hareketler yüklenir; boş günler atlanır', () => {
    const plan = planUpload(local, {
      workoutDates: new Set(['2026-11-12']),
      templateIds: new Set(['t2']),
      exerciseIds: new Set(),
    });
    expect(plan.workouts.map((w) => w.date)).toEqual(['2026-11-10']);
    expect(plan.templates.map((t) => t.id)).toEqual(['t1']);
    expect(plan.exercises.map((e) => e.id)).toEqual(['x']);
  });
});
