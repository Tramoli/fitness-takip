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

export interface AppData {
  version: 1;
  exercises: Exercise[];
  workouts: Workout[];
}
