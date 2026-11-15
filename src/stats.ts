import { addWeeks, format, parseISO, startOfISOWeek } from 'date-fns';
import type { SetEntry, Workout, WorkoutExercise } from './types';

export const setVolume = (s: SetEntry) => s.kg * s.reps;

/** Epley formülüyle tahmini tek tekrar maksimumu. */
export function estimate1RM(s: SetEntry): number {
  if (s.reps <= 0) return 0;
  if (s.reps === 1) return s.kg;
  return s.kg * (1 + s.reps / 30);
}

export const exerciseVolume = (we: WorkoutExercise) =>
  we.sets.reduce((sum, s) => sum + setVolume(s), 0);

export const workoutVolume = (w: Workout) =>
  w.exercises.reduce((sum, we) => sum + exerciseVolume(we), 0);

export const round1 = (n: number) => Math.round(n * 10) / 10;

export const sortByDateAsc = (ws: Workout[]) => [...ws].sort((a, b) => a.date.localeCompare(b.date));

export interface ProgressPoint {
  date: string;
  maxKg: number;
  est1RM: number;
  volume: number;
}

/** Bir hareket için her antrenman gününe ait max kg, tahmini 1RM ve hacim. */
export function exerciseProgress(workouts: Workout[], exerciseId: string): ProgressPoint[] {
  const points: ProgressPoint[] = [];
  for (const w of sortByDateAsc(workouts)) {
    const sets = w.exercises
      .filter((we) => we.exerciseId === exerciseId)
      .flatMap((we) => we.sets)
      .filter((s) => s.reps > 0);
    if (!sets.length) continue;
    points.push({
      date: w.date,
      maxKg: Math.max(...sets.map((s) => s.kg)),
      est1RM: round1(Math.max(...sets.map(estimate1RM))),
      volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
    });
  }
  return points;
}

export interface PersonalRecords {
  heaviest?: { kg: number; reps: number; date: string };
  best1RM?: { value: number; kg: number; reps: number; date: string };
  bestVolume?: { value: number; date: string };
  sessions: number;
}

export function personalRecords(workouts: Workout[], exerciseId: string): PersonalRecords {
  const pr: PersonalRecords = { sessions: 0 };
  for (const w of sortByDateAsc(workouts)) {
    const sets = w.exercises.filter((we) => we.exerciseId === exerciseId).flatMap((we) => we.sets);
    const valid = sets.filter((s) => s.reps > 0);
    if (!valid.length) continue;
    pr.sessions++;
    for (const s of valid) {
      if (!pr.heaviest || s.kg > pr.heaviest.kg || (s.kg === pr.heaviest.kg && s.reps > pr.heaviest.reps)) {
        pr.heaviest = { kg: s.kg, reps: s.reps, date: w.date };
      }
      const e = round1(estimate1RM(s));
      if (!pr.best1RM || e > pr.best1RM.value) {
        pr.best1RM = { value: e, kg: s.kg, reps: s.reps, date: w.date };
      }
    }
    const vol = valid.reduce((sum, s) => sum + setVolume(s), 0);
    if (!pr.bestVolume || vol > pr.bestVolume.value) pr.bestVolume = { value: vol, date: w.date };
  }
  return pr;
}

export interface WeekStat {
  weekStart: string;
  label: string;
  volume: number;
  workouts: number;
}

/** `today`e kadar olan son `weeks` haftanın (Pazartesi başlangıç) toplam hacmi. */
export function weeklyVolume(workouts: Workout[], weeks: number, today: Date = new Date()): WeekStat[] {
  const current = startOfISOWeek(today);
  const result: WeekStat[] = [];
  const index = new Map<string, WeekStat>();
  for (let i = weeks - 1; i >= 0; i--) {
    const start = addWeeks(current, -i);
    const key = format(start, 'yyyy-MM-dd');
    const stat = { weekStart: key, label: format(start, 'dd.MM'), volume: 0, workouts: 0 };
    result.push(stat);
    index.set(key, stat);
  }
  for (const w of workouts) {
    const key = format(startOfISOWeek(parseISO(w.date)), 'yyyy-MM-dd');
    const stat = index.get(key);
    if (!stat) continue;
    stat.volume += workoutVolume(w);
    stat.workouts += 1;
  }
  return result;
}

/** Verilen tarihten önceki en son antrenmandaki setler ("son seferde" ipucu). */
export function lastSetsFor(workouts: Workout[], exerciseId: string, beforeDate: string) {
  const prev = sortByDateAsc(workouts)
    .filter((w) => w.date < beforeDate)
    .reverse()
    .find((w) => w.exercises.some((we) => we.exerciseId === exerciseId && we.sets.length));
  if (!prev) return undefined;
  const sets = prev.exercises.filter((we) => we.exerciseId === exerciseId).flatMap((we) => we.sets);
  return { date: prev.date, sets };
}

export const formatKg = (n: number) =>
  n.toLocaleString('tr-TR', { maximumFractionDigits: 1 });
