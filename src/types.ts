export interface Exercise {
  id: string;
  name: string;
  muscleGroup?: string;
}

export interface SetEntry {
  kg: number;
  reps: number;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: SetEntry[];
  note?: string;
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
}
