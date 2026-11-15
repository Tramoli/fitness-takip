import { describe, expect, it } from 'vitest';
import { draftFromTemplateExercise, recentWorkouts, templateFromWorkout } from './programs';
import type { Exercise } from './types';
import type { Workout } from './types';

const workouts: Workout[] = [
  { id: 'a', date: '2026-11-02', exercises: [{ exerciseId: 'bench', sets: [{ kg: 60, reps: 8 }] }] },
  {
    id: 'b',
    date: '2026-11-09',
    exercises: [{ exerciseId: 'bench', sets: [{ kg: 70, reps: 8 }, { kg: 70, reps: 6 }] }],
  },
  { id: 'c', date: '2026-11-11', exercises: [{ exerciseId: 'squat', sets: [{ kg: 100, reps: 5 }] }] },
];

describe('draftFromTemplateExercise', () => {
  it('son seferki ağırlıkları ve hedef tekrarı kullanır', () => {
    expect(draftFromTemplateExercise({ exerciseId: 'bench', sets: 3, reps: 10 }, workouts, '2026-11-15')).toEqual([
      { kg: '70', reps: '10' },
      { kg: '70', reps: '10' },
      { kg: '70', reps: '10' },
    ]);
  });
  it('hedef tekrar yoksa son seferkini alır', () => {
    expect(draftFromTemplateExercise({ exerciseId: 'bench', sets: 2 }, workouts, '2026-11-15')).toEqual([
      { kg: '70', reps: '8' },
      { kg: '70', reps: '6' },
    ]);
  });
  it('hiç yapılmamış harekette kg boş kalır', () => {
    expect(draftFromTemplateExercise({ exerciseId: 'row', sets: 2, reps: 12 }, workouts, '2026-11-15')).toEqual([
      { kg: '', reps: '12' },
      { kg: '', reps: '12' },
    ]);
  });
});

describe('draftFromTemplateExercise + öneri', () => {
  it('geçmiş varsa progresif overload önerisini kullanır, set sayısı programdan', () => {
    const bench: Exercise = { id: 'bench', name: 'Bench', muscleGroup: 'Göğüs', repMin: 6, repMax: 8 };
    // Son seans: 70×8, 70×6 → aralık içinde, +1 tekrar: 70×8 (üst sınır), 70×7
    expect(draftFromTemplateExercise({ exerciseId: 'bench', sets: 3, reps: 12 }, workouts, '2026-11-15', bench)).toEqual([
      { kg: '70', reps: '8' },
      { kg: '70', reps: '7' },
      { kg: '70', reps: '7' },
    ]);
  });
});

describe('recentWorkouts', () => {
  it('seçilen günden önceki son antrenmanlar, yeniden eskiye', () => {
    expect(recentWorkouts(workouts, '2026-11-11').map((w) => w.id)).toEqual(['b', 'a']);
    expect(recentWorkouts(workouts, '2026-11-15', 2).map((w) => w.id)).toEqual(['c', 'b']);
  });
});

describe('templateFromWorkout', () => {
  it('set sayısı ve en sık tekrar', () => {
    const t = templateFromWorkout('İtiş', 't1', [
      { exerciseId: 'bench', sets: [{ kg: 70, reps: 8 }, { kg: 70, reps: 8 }, { kg: 70, reps: 6 }] },
    ]);
    expect(t).toEqual({ id: 't1', name: 'İtiş', exercises: [{ exerciseId: 'bench', sets: 3, reps: 8 }] });
  });
});
