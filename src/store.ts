import { useCallback, useEffect, useState } from 'react';
import type { AppData, Exercise, Workout } from './types';
import { DEFAULT_EXERCISES, mergeDefaultExercises } from './exercises';

export { DEFAULT_EXERCISES };

const STORAGE_KEY = 'fitness-takip:v1';


export function emptyData(): AppData {
  return { version: 1, exercises: [...DEFAULT_EXERCISES], workouts: [] };
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function parseData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('Geçersiz veri');
  const d = raw as Partial<AppData>;
  if (!Array.isArray(d.exercises) || !Array.isArray(d.workouts)) {
    throw new Error('Dosyada "exercises" ve "workouts" alanları bulunmalı');
  }
  return { version: 1, exercises: mergeDefaultExercises(d.exercises), workouts: d.workouts };
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    return parseData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

function save(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* depolama dolu ya da kapalı */
  }
}

export function useAppData() {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => save(data), [data]);

  const upsertWorkout = useCallback((w: Workout) => {
    setData((d) => {
      const others = d.workouts.filter((x) => x.id !== w.id && x.date !== w.date);
      // Boş antrenman kaydedilmez — o güne ait kaydı siler.
      const workouts = w.exercises.length ? [...others, w] : others;
      return { ...d, workouts };
    });
  }, []);

  const deleteWorkout = useCallback((id: string) => {
    setData((d) => ({ ...d, workouts: d.workouts.filter((w) => w.id !== id) }));
  }, []);

  const addExercise = useCallback((name: string, muscleGroup?: string): Exercise => {
    const ex: Exercise = { id: newId(), name: name.trim(), muscleGroup };
    setData((d) => ({ ...d, exercises: [...d.exercises, ex] }));
    return ex;
  }, []);

  const replaceAll = useCallback((next: AppData) => setData(next), []);

  return { data, upsertWorkout, deleteWorkout, addExercise, replaceAll };
}

export function exportData(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `fitness-takip-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
