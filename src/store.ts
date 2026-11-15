import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppData, Exercise, Level, Template, Workout } from './types';
import { DEFAULT_EXERCISES, mergeDefaultExercises } from './exercises';
import { buildExercises, connectCloud, type Cloud, type SyncStatus } from './cloud';
import { db } from './firebase';

export { DEFAULT_EXERCISES };

const STORAGE_KEY = 'fitness-takip:v1';


export function emptyData(): AppData {
  return { version: 1, exercises: [...DEFAULT_EXERCISES], workouts: [], templates: [] };
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
  return {
    version: 1,
    exercises: mergeDefaultExercises(d.exercises),
    workouts: d.workouts,
    templates: Array.isArray(d.templates) ? d.templates : [],
    level: d.level,
  };
}

export const DEVICE_KEY = STORAGE_KEY;
const userKey = (uid: string) => `fitness-takip:user:${uid}`;
const migratedKey = (uid: string) => `fitness-takip:migrated:${uid}`;

function load(key: string): AppData {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyData();
    return parseData(JSON.parse(raw));
  } catch {
    return emptyData();
  }
}

function save(key: string, data: AppData) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* depolama dolu ya da kapalı */
  }
}

/** Bu cihazda girişsiz tutulan kayıtlar (ilk girişte buluta taşınır). */
export const loadDeviceData = () => load(DEVICE_KEY);

/**
 * Uygulama verisi. Giriş yapılmamışsa veri yalnızca bu cihazda tutulur;
 * giriş yapılmışsa bulutla eşitlenir ve hızlı açılış için cihazda da önbelleklenir.
 */
export function useAppData(uid: string | null) {
  const key = uid ? userKey(uid) : DEVICE_KEY;
  const [store, setStore] = useState(() => ({ key, data: load(key) }));
  const [status, setStatus] = useState<SyncStatus | 'local'>(uid ? 'pending' : 'local');
  const cloudRef = useRef<Cloud | null>(null);

  // Hesap değişince doğru veriyi yükle.
  if (store.key !== key) setStore({ key, data: load(key) });
  const data = store.key === key ? store.data : load(key);

  useEffect(() => {
    if (store.key === key) save(key, store.data);
  }, [key, store]);

  const setData = useCallback(
    (f: (d: AppData) => AppData) => setStore((s) => (s.key === key ? { key, data: f(s.data) } : s)),
    [key],
  );

  useEffect(() => {
    if (!uid) {
      setStatus('local');
      return;
    }
    const firstTime = localStorage.getItem(migratedKey(uid)) !== '1';
    const cloud = connectCloud(
      db,
      uid,
      firstTime ? loadDeviceData() : null,
      (c) =>
        setStore((s) =>
          s.key === key
            ? { key, data: { version: 1, exercises: c.exercises.length ? c.exercises : buildExercises([]), workouts: c.workouts, templates: c.templates, level: c.level } }
            : s,
        ),
      setStatus,
      () => localStorage.setItem(migratedKey(uid), '1'),
    );
    cloudRef.current = cloud;
    return () => {
      cloud.stop();
      cloudRef.current = null;
    };
  }, [uid, key]);

  const upsertWorkout = useCallback(
    (w: Workout) => {
      setData((d) => {
        const others = d.workouts.filter((x) => x.id !== w.id && x.date !== w.date);
        // Boş antrenman kaydedilmez — o güne ait kaydı siler.
        const workouts = w.exercises.length ? [...others, w] : others;
        return { ...d, workouts };
      });
      cloudRef.current?.upsertWorkout(w);
    },
    [setData],
  );

  const deleteWorkout = useCallback(
    (id: string) => {
      setData((d) => {
        const w = d.workouts.find((x) => x.id === id);
        if (w) cloudRef.current?.deleteWorkoutByDate(w.date);
        return { ...d, workouts: d.workouts.filter((x) => x.id !== id) };
      });
    },
    [setData],
  );

  const addExercise = useCallback(
    (name: string, muscleGroup?: string): Exercise => {
      const ex: Exercise = { id: newId(), name: name.trim(), muscleGroup };
      setData((d) => ({ ...d, exercises: [...d.exercises, ex] }));
      cloudRef.current?.saveExercise(ex);
      return ex;
    },
    [setData],
  );

  const replaceAll = useCallback(
    async (next: AppData) => {
      setData(() => next);
      await cloudRef.current?.replaceAll(next);
    },
    [setData],
  );

  const saveTemplate = useCallback(
    (t: Template) => {
      setData((d) => {
        const exists = d.templates.some((x) => x.id === t.id);
        return { ...d, templates: exists ? d.templates.map((x) => (x.id === t.id ? t : x)) : [...d.templates, t] };
      });
      cloudRef.current?.saveTemplate(t);
    },
    [setData],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      setData((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== id) }));
      cloudRef.current?.deleteTemplate(id);
    },
    [setData],
  );

  const updateExercise = useCallback(
    (id: string, patch: Partial<Exercise>) => {
      setData((d) => {
        const exercises = d.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e));
        const ex = exercises.find((e) => e.id === id);
        if (ex) cloudRef.current?.saveExercise(ex);
        return { ...d, exercises };
      });
    },
    [setData],
  );

  const setLevel = useCallback(
    (level: Level) => {
      setData((d) => ({ ...d, level }));
      cloudRef.current?.setLevel(level);
    },
    [setData],
  );

  return {
    data,
    status,
    upsertWorkout,
    deleteWorkout,
    addExercise,
    replaceAll,
    saveTemplate,
    deleteTemplate,
    updateExercise,
    setLevel,
  };
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
