export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
  /** Çift ilerleme için hedef tekrar aralığı (boşsa hareket türüne göre varsayılan). */
  repMin?: number;
  repMax?: number;
}

export interface SetEntry {
  kg: number;
  reps: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
  note?: string;
  /** Son sette yedekte kalan tekrar (RIR). 4 = 4 ve üzeri. */
  rir?: number;
}

export interface Workout {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  exercises: WorkoutExercise[];
  note?: string;
}

/** Hazır program: hareketler ve her biri için hedef set/tekrar sayısı. */
export interface TemplateExercise {
  exerciseId: string;
  sets: number;
  reps?: number;
}

export interface Template {
  id: string;
  name: string;
  exercises: TemplateExercise[];
}

export interface AppData {
  version: 1;
  exercises: Exercise[];
  workouts: Workout[];
  templates: Template[];
  /** Antrenman deneyimi: haftalık hacim ve deload hedeflerini belirler. */
  level?: Level;
}

export type Level = 'beginner' | 'intermediate' | 'advanced';
