import type { Exercise, SetEntry, Template, TemplateExercise, Unit, Workout, WorkoutExercise } from './types';
import { draftValue } from './units';
import { recommend } from './overload';
import { lastSetsFor, sortByDateAsc } from './stats';

/** Kayıt ekranındaki taslak set: kutulara yazılan metin. */
export interface DraftSet {
  kg: string;
  reps: string;
}

const str = (n: number | undefined) => (n === undefined ? '' : String(n));

/** Kayıtlı (kg) setleri, verilen birimde kutu değerlerine çevirir. */
export function draftFromSets(sets: SetEntry[], unit: Unit = 'kg'): DraftSet[] {
  return sets.map((s) => ({ kg: draftValue(s.kg, unit), reps: str(s.reps) }));
}

/**
 * Programdaki bir hareket için setleri hazırlar. Geçmiş varsa progresif overload
 * önerisi (ağırlık ve tekrar) kullanılır; set sayısı programdan gelir. Hiç
 * yapılmamış harekette hedef tekrar yazılır, kg boş kalır.
 */
export function draftFromTemplateExercise(
  te: TemplateExercise,
  workouts: Workout[],
  date: string,
  ex?: Exercise,
  unit: Unit = 'kg',
): DraftSet[] {
  const rec = ex ? recommend(ex, workouts, date, unit) : undefined;
  const base = rec?.sets.length ? rec.sets : lastSetsFor(workouts, te.exerciseId, date)?.sets ?? [];
  return Array.from({ length: Math.max(1, te.sets) }, (_, i) => {
    const prev = base[i] ?? base[base.length - 1];
    if (prev) return { kg: draftValue(prev.kg, unit), reps: str(rec?.sets.length ? prev.reps : te.reps ?? prev.reps) };
    return { kg: '', reps: str(te.reps) };
  });
}

/** Öneri setlerini taslağa çevirir. */
export const draftFromRecommendation = (sets: SetEntry[], unit: Unit = 'kg'): DraftSet[] => draftFromSets(sets, unit);

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
