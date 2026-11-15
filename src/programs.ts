import type { SetEntry, Template, TemplateExercise, Workout, WorkoutExercise } from './types';
import { lastSetsFor, sortByDateAsc } from './stats';

/** Kayıt ekranındaki taslak set: kutulara yazılan metin. */
export interface DraftSet {
  kg: string;
  reps: string;
}

const str = (n: number | undefined) => (n === undefined ? '' : String(n));

/** Kayıtlı bir hareketin setlerini kopyalar. */
export function draftFromSets(sets: SetEntry[]): DraftSet[] {
  return sets.map((s) => ({ kg: str(s.kg), reps: str(s.reps) }));
}

/**
 * Programdaki bir hareket için setleri hazırlar. O hareketi daha önce yaptıysan
 * son seferki ağırlık ve tekrarlarla doldurulur; yoksa hedef tekrar yazılır, kg boş kalır.
 */
export function draftFromTemplateExercise(
  te: TemplateExercise,
  workouts: Workout[],
  date: string,
): DraftSet[] {
  const last = lastSetsFor(workouts, te.exerciseId, date)?.sets ?? [];
  return Array.from({ length: Math.max(1, te.sets) }, (_, i) => {
    const prev = last[i] ?? last[last.length - 1];
    if (prev) return { kg: str(prev.kg), reps: str(te.reps ?? prev.reps) };
    return { kg: '', reps: str(te.reps) };
  });
}

/** Seçilen günden önceki en son antrenmanlar (en yeni önce). */
export function recentWorkouts(workouts: Workout[], beforeDate: string, limit = 3): Workout[] {
  return sortByDateAsc(workouts)
    .filter((w) => w.date < beforeDate && w.exercises.length)
    .reverse()
    .slice(0, limit);
}

/** Bir günün antrenmanından program oluşturur (set sayısı ve en sık tekrar). */
export function templateFromWorkout(name: string, id: string, exercises: WorkoutExercise[]): Template {
  return {
    id,
    name,
    exercises: exercises.map((we) => {
      const counts = new Map<number, number>();
      for (const s of we.sets) if (s.reps > 0) counts.set(s.reps, (counts.get(s.reps) ?? 0) + 1);
      const reps = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0]?.[0];
      return { exerciseId: we.exerciseId, sets: Math.max(1, we.sets.length), reps };
    }),
  };
}
