/**
 * Bulut senkronizasyonu (Firestore).
 *
 * Veri yapısı (her kullanıcı yalnızca kendi altını görür):
 *   users/{uid}/workouts/{YYYY-MM-DD}   — günlük antrenman (gün başına bir belge)
 *   users/{uid}/templates/{id}          — programlar
 *   users/{uid}/exercises/{id}          — eklenen hareketler ve tekrar aralığı ayarları
 *   users/{uid}/meta/settings           — seviye vb.
 *
 * Firestore'un çevrimdışı önbelleği sayesinde internet yokken yapılan değişiklikler
 * cihazda bekler ve bağlantı gelince gönderilir.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import type { AppData, Exercise, Level, Template, Unit, Workout } from './types';
import { DEFAULT_EXERCISES } from './exercises';

// ---------- Saf yardımcılar (test edilir) ----------

const DEFAULT_IDS = new Set(DEFAULT_EXERCISES.map((e) => e.id));

/** Buluta yalnızca eklenen hareketler ve ayar değiştirilmiş varsayılanlar yazılır. */
export function exerciseNeedsCloud(e: Exercise): boolean {
  return !DEFAULT_IDS.has(e.id) || e.repMin !== undefined || e.repMax !== undefined;
}

/** Varsayılan liste + buluttaki ayarlar/eklenen hareketler. */
export function buildExercises(cloud: Exercise[]): Exercise[] {
  const byId = new Map(cloud.map((e) => [e.id, e]));
  const base = DEFAULT_EXERCISES.map((d) => {
    const o = byId.get(d.id);
    return o ? { ...d, repMin: o.repMin, repMax: o.repMax } : d;
  });
  return [...base, ...cloud.filter((e) => !DEFAULT_IDS.has(e.id))];
}

/** Bulutta karşılığı olmayan yerel kayıtlar (ilk girişte yüklenecek). */
export function planUpload(local: AppData, cloud: { workoutDates: Set<string>; templateIds: Set<string>; exerciseIds: Set<string> }) {
  return {
    workouts: local.workouts.filter((w) => w.exercises.length && !cloud.workoutDates.has(w.date)),
    templates: local.templates.filter((t) => !cloud.templateIds.has(t.id)),
    exercises: local.exercises.filter((e) => exerciseNeedsCloud(e) && !cloud.exerciseIds.has(e.id)),
  };
}

const clean = <T extends object>(o: T): T => JSON.parse(JSON.stringify(o));

// ---------- Bulut bağlantısı ----------

export type SyncStatus = 'synced' | 'pending' | 'offline';

export interface CloudState {
  workouts: Workout[];
  templates: Template[];
  exercises: Exercise[];
  level?: Level;
  unit?: Unit;
}

export interface Cloud {
  upsertWorkout: (w: Workout) => void;
  deleteWorkoutByDate: (date: string) => void;
  saveExercise: (e: Exercise) => void;
  saveTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;
  setLevel: (l: Level) => void;
  setUnit: (u: Unit) => void;
  replaceAll: (d: AppData) => Promise<void>;
  flush: () => void;
  stop: () => void;
}

const WORKOUT_DEBOUNCE_MS = 800;

/**
 * Kullanıcının verisini dinler. İlk girişte bu cihazdaki kayıtlardan bulutta
 * olmayanları yükler. Her değişiklikte onChange güncel veriyle çağrılır.
 */
export function connectCloud(
  db: Firestore,
  uid: string,
  localToMigrate: AppData | null,
  onChange: (s: CloudState) => void,
  onStatus: (s: SyncStatus) => void,
  onMigrated: () => void,
): Cloud {
  const base = `users/${uid}`;
  const col = (name: string) => collection(db, base, name);
  const ref = (name: string, id: string) => doc(db, base, name, id);

  const state: CloudState = { workouts: [], templates: [], exercises: [] };
  const pending = new Map<string, Workout | null>(); // tarih → bekleyen antrenman (null = sil)
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const hasPending = { snap: false };
  let stopped = false;
  const unsubs: (() => void)[] = [];

  const emitStatus = () => {
    if (!navigator.onLine) onStatus('offline');
    else onStatus(hasPending.snap || pending.size ? 'pending' : 'synced');
  };

  const emit = () => {
    // Henüz gönderilmemiş (bekleyen) antrenmanları buluttaki halin üstüne koy.
    let workouts = state.workouts;
    if (pending.size) {
      const byDate = new Map(workouts.map((w) => [w.date, w]));
      for (const [date, w] of pending) {
        if (w) byDate.set(date, w);
        else byDate.delete(date);
      }
      workouts = [...byDate.values()];
    }
    onChange({ ...state, workouts });
  };

  const listen = (name: string, apply: (docs: DocumentData[]) => void) =>
    onSnapshot(col(name), { includeMetadataChanges: true }, (snap) => {
      apply(snap.docs.map((d) => d.data()));
      hasPending.snap = snap.metadata.hasPendingWrites;
      emit();
      emitStatus();
    });

  const start = async () => {
    // İlk giriş: bu cihazdaki kayıtları buluta taşı (bulutta aynı gün/program varsa bulut kazanır).
    if (localToMigrate) {
      try {
        const [ws, ts, es] = await Promise.all([getDocs(col('workouts')), getDocs(col('templates')), getDocs(col('exercises'))]);
        const plan = planUpload(localToMigrate, {
          workoutDates: new Set(ws.docs.map((d) => d.id)),
          templateIds: new Set(ts.docs.map((d) => d.id)),
          exerciseIds: new Set(es.docs.map((d) => d.id)),
        });
        const writes: [string, string, object][] = [
          ...plan.workouts.map((w): [string, string, object] => ['workouts', w.date, { ...clean(w), id: w.date }]),
          ...plan.templates.map((t): [string, string, object] => ['templates', t.id, clean(t)]),
          ...plan.exercises.map((e): [string, string, object] => ['exercises', e.id, clean(e)]),
        ];
        for (let i = 0; i < writes.length; i += 400) {
          const batch = writeBatch(db);
          for (const [c, id, data] of writes.slice(i, i + 400)) batch.set(ref(c, id), data);
          await batch.commit();
        }
        const settings = { level: localToMigrate.level, unit: localToMigrate.unit };
        if (settings.level || settings.unit) await setDoc(ref('meta', 'settings'), clean(settings), { merge: true });
        onMigrated();
      } catch (err) {
        console.error('Yerel kayıtlar buluta taşınamadı', err);
      }
    }
    if (stopped) return;
    unsubs.push(
      listen('workouts', (d) => (state.workouts = d as Workout[])),
      listen('templates', (d) => (state.templates = d as Template[])),
      listen('exercises', (d) => (state.exercises = buildExercises(d as Exercise[]))),
      onSnapshot(ref('meta', 'settings'), (s) => {
        state.level = (s.data()?.level as Level | undefined) ?? undefined;
        state.unit = (s.data()?.unit as Unit | undefined) ?? undefined;
        emit();
      }),
    );
  };

  const writeWorkout = (date: string) => {
    timers.delete(date);
    if (!pending.has(date)) return;
    const w = pending.get(date)!;
    pending.delete(date);
    const op = w ? setDoc(ref('workouts', date), { ...clean(w), id: date, updatedAt: Date.now() }) : deleteDoc(ref('workouts', date));
    op.catch((e) => console.error('Antrenman kaydedilemedi', e));
    emitStatus();
  };

  const flush = () => {
    for (const [date, t] of timers) {
      clearTimeout(t);
      writeWorkout(date);
    }
  };

  const onNet = () => emitStatus();
  const onHide = () => document.visibilityState === 'hidden' && flush();
  window.addEventListener('online', onNet);
  window.addEventListener('offline', onNet);
  document.addEventListener('visibilitychange', onHide);
  window.addEventListener('pagehide', flush);

  void start();

  return {
    upsertWorkout(w) {
      pending.set(w.date, w.exercises.length ? w : null);
      clearTimeout(timers.get(w.date));
      timers.set(w.date, setTimeout(() => writeWorkout(w.date), WORKOUT_DEBOUNCE_MS));
      emitStatus();
    },
    deleteWorkoutByDate(date) {
      pending.set(date, null);
      clearTimeout(timers.get(date));
      writeWorkout(date);
    },
    saveExercise(e) {
      if (exerciseNeedsCloud(e)) setDoc(ref('exercises', e.id), clean(e)).catch(console.error);
    },
    saveTemplate(t) {
      setDoc(ref('templates', t.id), clean(t)).catch(console.error);
    },
    deleteTemplate(id) {
      deleteDoc(ref('templates', id)).catch(console.error);
    },
    setLevel(level) {
      setDoc(ref('meta', 'settings'), { level }, { merge: true }).catch(console.error);
    },
    setUnit(unit) {
      setDoc(ref('meta', 'settings'), { unit }, { merge: true }).catch(console.error);
    },
    async replaceAll(d) {
      flush();
      const [ws, ts] = await Promise.all([getDocs(col('workouts')), getDocs(col('templates'))]);
      const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = [
        ...ws.docs.map((x) => (b: ReturnType<typeof writeBatch>) => b.delete(x.ref)),
        ...ts.docs.map((x) => (b: ReturnType<typeof writeBatch>) => b.delete(x.ref)),
        ...d.workouts
          .filter((w) => w.exercises.length)
          .map((w) => (b: ReturnType<typeof writeBatch>) => b.set(ref('workouts', w.date), { ...clean(w), id: w.date })),
        ...d.templates.map((t) => (b: ReturnType<typeof writeBatch>) => b.set(ref('templates', t.id), clean(t))),
        ...d.exercises
          .filter(exerciseNeedsCloud)
          .map((e) => (b: ReturnType<typeof writeBatch>) => b.set(ref('exercises', e.id), clean(e))),
      ];
      for (let i = 0; i < ops.length; i += 400) {
        const batch = writeBatch(db);
        ops.slice(i, i + 400).forEach((f) => f(batch));
        await batch.commit();
      }
      if (d.level || d.unit) await setDoc(ref('meta', 'settings'), clean({ level: d.level, unit: d.unit }), { merge: true });
    },
    flush,
    stop() {
      stopped = true;
      flush();
      unsubs.forEach((u) => u());
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flush);
    },
  };
}
