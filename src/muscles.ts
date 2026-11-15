/**
 * Hareket → kas aktivasyonu verisi.
 *
 * "emg" işaretli hareketlerin değerleri, kullanıcının "Kinezyolojik ve
 * Nöromüsküler Egzersiz Analizi" not defterindeki Deep Research raporunun
 * (Kas Gruplarına Göre Egzersiz Seçimi ve sEMG Kas Aktivasyon Dereceleri)
 * tablolarından alınmıştır. Derece → katsayı: En yüksek 1, Yüksek 0,75,
 * Orta 0,5, Düşük 0,25 (ara değerler ortalama). Yüzde verilen yerlerde
 * (biceps, triceps) yüzde doğrudan kullanılmıştır.
 *
 * Raporda olmayan hareketler, aynı hareket kalıbındaki ölçümlere ve kas
 * grubuna göre tahmin edilmiştir (emg: false).
 */
import type { Exercise, SetEntry, Template, Workout } from './types';

export type MuscleId =
  | 'chest_upper'
  | 'chest'
  | 'delt_front'
  | 'delt_side'
  | 'delt_rear'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'traps'
  | 'lats'
  | 'lower_back'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'calves';

export const MUSCLES: { id: MuscleId; name: string }[] = [
  { id: 'chest_upper', name: 'Üst göğüs' },
  { id: 'chest', name: 'Orta/alt göğüs' },
  { id: 'delt_front', name: 'Ön omuz' },
  { id: 'delt_side', name: 'Yan omuz' },
  { id: 'delt_rear', name: 'Arka omuz' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Ön kol' },
  { id: 'abs', name: 'Karın' },
  { id: 'obliques', name: 'Yan karın' },
  { id: 'traps', name: 'Trapez ve orta sırt' },
  { id: 'lats', name: 'Latissimus (kanat)' },
  { id: 'lower_back', name: 'Bel' },
  { id: 'glutes', name: 'Kalça' },
  { id: 'quads', name: 'Ön bacak' },
  { id: 'hamstrings', name: 'Arka bacak' },
  { id: 'adductors', name: 'İç bacak' },
  { id: 'calves', name: 'Baldır' },
];

export const muscleName = (id: MuscleId) => MUSCLES.find((m) => m.id === id)?.name ?? id;

type Act = Partial<Record<MuscleId, number>>;
interface Profile {
  m: Act;
  emg?: boolean;
}

const E = (m: Act): Profile => ({ m, emg: true });
const T = (m: Act): Profile => ({ m });

// Rapor tablolarındaki profiller
const BENCH = { chest_upper: 0.75, chest: 1, delt_front: 0.75, triceps: 0.5 };
const INCLINE = { chest_upper: 1, chest: 0.5, delt_front: 0.75, triceps: 0.5 };
const FLY = { chest_upper: 0.75, chest: 0.75, delt_front: 0.37, triceps: 0.25 };

export const ACTIVATION: Record<string, Profile> = {
  // Göğüs (Tablo 1)
  'bench-press': E(BENCH),
  'incline-bench-press': E(INCLINE),
  'decline-bench-press': E({ chest_upper: 0.5, chest: 0.75, delt_front: 0.25, triceps: 0.5 }),
  'pec-deck': E(FLY),
  'cable-crossover': E(FLY),
  'db-pullover': E({ chest_upper: 0.37, chest: 0.25, delt_front: 0.25, triceps: 0.75, lats: 0.5 }),
  'db-bench-press': T(BENCH),
  'smith-bench-press': T(BENCH),
  'machine-chest-press': T(BENCH),
  'incline-db-press': T(INCLINE),
  'smith-incline-press': T(INCLINE),
  'incline-machine-press': T(INCLINE),
  'decline-db-press': T({ chest_upper: 0.5, chest: 0.75, delt_front: 0.25, triceps: 0.5 }),
  'chest-fly': T(FLY),
  'incline-db-fly': T({ chest_upper: 1, chest: 0.5, delt_front: 0.5, triceps: 0.25 }),
  'low-cable-fly': T({ chest_upper: 1, chest: 0.5, delt_front: 0.5 }),
  'high-cable-fly': T({ chest_upper: 0.5, chest: 1, delt_front: 0.25 }),
  'push-up': T({ chest_upper: 0.62, chest: 0.75, delt_front: 0.62, triceps: 0.62, abs: 0.37 }),
  'incline-push-up': T({ chest_upper: 0.37, chest: 0.62, delt_front: 0.5, triceps: 0.5, abs: 0.25 }),
  'chair-squat': T({ quads: 0.75, glutes: 0.5, adductors: 0.25 }),
  'dead-bug': T({ abs: 0.75, obliques: 0.5 }),
  'bird-dog': T({ lower_back: 0.75, glutes: 0.5, abs: 0.25 }),
  'weighted-push-up': T({ chest_upper: 0.62, chest: 0.87, delt_front: 0.62, triceps: 0.62, abs: 0.37 }),
  'chest-dips': T({ chest_upper: 0.37, chest: 1, delt_front: 0.62, triceps: 0.75 }),
  'svend-press': T({ chest_upper: 0.75, chest: 0.75, delt_front: 0.5 }),

  // Sırt (Tablo 2) — trapez bölgesi orta/alt trapez ve infraspinatusun ortalaması
  'pull-up': E({ lats: 1, traps: 0.87, lower_back: 0.5, biceps: 0.5, forearms: 0.5 }),
  'chin-up': E({ lats: 0.75, traps: 0.87, lower_back: 0.5, biceps: 0.8, forearms: 0.5 }),
  'barbell-row': E({ lats: 0.75, traps: 1, lower_back: 1, delt_rear: 0.5, biceps: 0.5 }),
  'inverted-row': E({ lats: 0.75, traps: 1, lower_back: 0.5, delt_rear: 0.5, biceps: 0.5 }),
  'seated-row': E({ lats: 0.62, traps: 0.87, lower_back: 0.37, delt_rear: 0.5, biceps: 0.5 }),
  'lat-pulldown': E({ lats: 0.75, traps: 0.5, lower_back: 0.25, biceps: 0.5 }),
  'weighted-pull-up': T({ lats: 1, traps: 0.87, lower_back: 0.5, biceps: 0.5, forearms: 0.62 }),
  'assisted-pull-up': T({ lats: 0.87, traps: 0.75, biceps: 0.5 }),
  'close-grip-pulldown': T({ lats: 0.75, traps: 0.62, biceps: 0.62 }),
  'reverse-grip-pulldown': T({ lats: 0.75, traps: 0.5, biceps: 0.75 }),
  'single-arm-pulldown': T({ lats: 0.87, traps: 0.5, biceps: 0.5 }),
  'straight-arm-pulldown': T({ lats: 1, triceps: 0.37, delt_rear: 0.25 }),
  'pendlay-row': T({ lats: 0.75, traps: 1, lower_back: 0.87, delt_rear: 0.5, biceps: 0.5 }),
  'yates-row': T({ lats: 0.87, traps: 0.87, lower_back: 0.75, biceps: 0.62 }),
  'db-row': T({ lats: 0.87, traps: 0.75, delt_rear: 0.5, biceps: 0.5 }),
  't-bar-row': T({ lats: 0.75, traps: 1, lower_back: 0.75, delt_rear: 0.5, biceps: 0.5 }),
  'wide-cable-row': T({ lats: 0.5, traps: 1, delt_rear: 0.75, biceps: 0.37 }),
  'machine-row': T({ lats: 0.62, traps: 0.87, delt_rear: 0.5, biceps: 0.5 }),
  'meadows-row': T({ lats: 0.87, traps: 0.75, delt_rear: 0.5, biceps: 0.5 }),
  'seal-row': T({ lats: 0.75, traps: 1, delt_rear: 0.62, biceps: 0.5 }),
  // Omuz tablosundaki 45° göğüs destekli dambıl row
  'chest-supported-row': E({ lats: 0.75, traps: 1, delt_rear: 1, delt_side: 1, delt_front: 0.25, biceps: 0.5 }),
  deadlift: T({ lower_back: 1, glutes: 0.75, hamstrings: 0.75, quads: 0.5, traps: 0.75, lats: 0.5, forearms: 0.62 }),
  'sumo-deadlift': T({ lower_back: 0.75, glutes: 0.87, hamstrings: 0.62, quads: 0.75, adductors: 0.75, traps: 0.62 }),
  'rack-pull': T({ lower_back: 1, traps: 1, glutes: 0.62, hamstrings: 0.5, forearms: 0.75 }),
  'back-extension': T({ lower_back: 1, glutes: 0.5, hamstrings: 0.5 }),
  'good-morning': T({ lower_back: 0.87, hamstrings: 0.75, glutes: 0.62 }),
  'barbell-shrug': T({ traps: 1, forearms: 0.37 }),
  'db-shrug': T({ traps: 1, forearms: 0.37 }),

  // Omuz (Tablo 3)
  'db-shoulder-press': E({ delt_front: 1, delt_side: 0.5, delt_rear: 0.1, triceps: 0.5 }),
  'lateral-raise': E({ delt_front: 0.25, delt_side: 1, delt_rear: 0.25 }),
  'rear-delt-fly': E({ delt_front: 0.25, delt_side: 0.75, delt_rear: 1 }),
  'upright-row': E({ delt_front: 0.37, delt_side: 0.75, delt_rear: 0.25, traps: 0.75 }),
  'overhead-press': T({ delt_front: 1, delt_side: 0.5, triceps: 0.62, chest_upper: 0.37, traps: 0.37 }),
  'seated-barbell-press': T({ delt_front: 1, delt_side: 0.5, triceps: 0.62, chest_upper: 0.37 }),
  'arnold-press': T({ delt_front: 1, delt_side: 0.62, triceps: 0.5 }),
  'machine-shoulder-press': T({ delt_front: 1, delt_side: 0.5, triceps: 0.5 }),
  'smith-shoulder-press': T({ delt_front: 1, delt_side: 0.5, triceps: 0.5 }),
  'push-press': T({ delt_front: 1, delt_side: 0.5, triceps: 0.62, quads: 0.37, glutes: 0.25 }),
  'landmine-press': T({ delt_front: 0.87, chest_upper: 0.5, triceps: 0.5, obliques: 0.25 }),
  'cable-lateral-raise': T({ delt_side: 1, delt_front: 0.25, delt_rear: 0.25 }),
  'machine-lateral-raise': T({ delt_side: 1, delt_front: 0.25, delt_rear: 0.25 }),
  'front-raise': T({ delt_front: 1, delt_side: 0.37, chest_upper: 0.25 }),
  'cable-front-raise': T({ delt_front: 1, delt_side: 0.37, chest_upper: 0.25 }),
  'reverse-pec-deck': T({ delt_rear: 1, delt_side: 0.5, traps: 0.62 }),
  'cable-rear-delt-fly': T({ delt_rear: 1, delt_side: 0.5, traps: 0.5 }),
  'face-pull': T({ delt_rear: 1, traps: 0.75, delt_side: 0.37 }),
  'y-raise': T({ traps: 0.87, delt_side: 0.62, delt_rear: 0.5 }),

  // Biceps (Tablo 4) — biceps yüzdesi doğrudan
  'concentration-curl': E({ biceps: 0.97, forearms: 0.25 }),
  'cable-curl': E({ biceps: 0.81, delt_front: 0.25, forearms: 0.25 }),
  'biceps-curl': E({ biceps: 0.76, delt_front: 0.5, forearms: 0.37 }),
  'ez-bar-curl': E({ biceps: 0.75, delt_front: 0.5, forearms: 0.37 }),
  'incline-db-curl': E({ biceps: 0.71, delt_front: 0.75 }),
  'preacher-curl': E({ biceps: 0.7, delt_front: 0.75 }),
  'machine-preacher-curl': T({ biceps: 0.7, delt_front: 0.5 }),
  'db-curl': T({ biceps: 0.76, delt_front: 0.37, forearms: 0.37 }),
  'alternating-db-curl': T({ biceps: 0.76, delt_front: 0.37, forearms: 0.37 }),
  'bayesian-curl': T({ biceps: 0.81, delt_front: 0.25 }),
  'spider-curl': T({ biceps: 0.85 }),
  'drag-curl': T({ biceps: 0.75, delt_rear: 0.25 }),
  'hammer-curl': T({ biceps: 0.62, forearms: 0.87 }),
  'cable-hammer-curl': T({ biceps: 0.62, forearms: 0.87 }),
  'reverse-curl': T({ forearms: 1, biceps: 0.5 }),

  // Triceps (Tablo 5) — toplam triceps yüzdesi doğrudan
  'diamond-push-up': E({ triceps: 1, chest: 0.5, delt_front: 0.5 }),
  'triceps-kickback': E({ triceps: 0.87 }),
  dips: E({ triceps: 0.87, chest: 0.5, delt_front: 0.5 }),
  'bench-dips': E({ triceps: 0.87, delt_front: 0.37 }),
  'machine-dips': T({ triceps: 0.87, chest: 0.37 }),
  'overhead-db-extension': E({ triceps: 0.76 }),
  'overhead-cable-extension': E({ triceps: 0.76 }),
  'rope-pushdown': E({ triceps: 0.74 }),
  'single-arm-pushdown': T({ triceps: 0.74 }),
  'triceps-pushdown': E({ triceps: 0.67 }),
  'skull-crusher': E({ triceps: 0.62 }),
  'db-skull-crusher': T({ triceps: 0.62 }),
  'jm-press': T({ triceps: 0.75, chest: 0.37 }),
  'close-grip-bench': E({ triceps: 0.62, chest: 0.75, delt_front: 0.5 }),

  // Ön kol
  'wrist-curl': T({ forearms: 1 }),
  'reverse-wrist-curl': T({ forearms: 1 }),
  'farmers-walk': T({ forearms: 1, traps: 0.75, abs: 0.25 }),
  'dead-hang': T({ forearms: 1, lats: 0.25 }),
  'plate-pinch': T({ forearms: 1 }),

  // Bacak ve kalça (Tablo 6)
  'hip-thrust': E({ glutes: 1, quads: 0.37, hamstrings: 0.5 }),
  squat: E({ quads: 1, glutes: 0.62, hamstrings: 0.25, adductors: 0.5, lower_back: 0.5 }),
  'romanian-deadlift': E({ hamstrings: 1, glutes: 0.75, quads: 0.25, lower_back: 0.75 }),
  'step-up': E({ glutes: 1, quads: 0.75, hamstrings: 0.5 }),
  'glute-bridge': E({ glutes: 0.25, quads: 0.25, hamstrings: 0.5 }),
  'machine-hip-thrust': T({ glutes: 1, quads: 0.37, hamstrings: 0.5 }),
  'front-squat': T({ quads: 1, glutes: 0.5, adductors: 0.37, abs: 0.37 }),
  'high-bar-squat': T({ quads: 1, glutes: 0.62, hamstrings: 0.25, adductors: 0.5 }),
  'pause-squat': T({ quads: 1, glutes: 0.62, hamstrings: 0.25, adductors: 0.5 }),
  'box-squat': T({ quads: 0.87, glutes: 0.75, hamstrings: 0.37 }),
  'goblet-squat': T({ quads: 1, glutes: 0.5, adductors: 0.37, abs: 0.25 }),
  'hack-squat': T({ quads: 1, glutes: 0.37 }),
  'smith-squat': T({ quads: 1, glutes: 0.5 }),
  'pendulum-squat': T({ quads: 1, glutes: 0.5 }),
  'belt-squat': T({ quads: 1, glutes: 0.62, adductors: 0.5 }),
  'leg-press': T({ quads: 1, glutes: 0.5, hamstrings: 0.25, adductors: 0.37 }),
  'single-leg-press': T({ quads: 1, glutes: 0.62 }),
  'leg-extension': T({ quads: 1 }),
  'bulgarian-split-squat': T({ quads: 0.75, glutes: 0.87, hamstrings: 0.37, adductors: 0.37 }),
  'split-squat': T({ quads: 0.75, glutes: 0.75, hamstrings: 0.37 }),
  'walking-lunge': T({ quads: 0.75, glutes: 0.87, hamstrings: 0.37, adductors: 0.37 }),
  'reverse-lunge': T({ quads: 0.62, glutes: 0.87, hamstrings: 0.5 }),
  'sissy-squat': T({ quads: 1 }),
  'db-romanian-deadlift': T({ hamstrings: 1, glutes: 0.75, lower_back: 0.62 }),
  'stiff-leg-deadlift': T({ hamstrings: 1, glutes: 0.62, lower_back: 0.75 }),
  'single-leg-rdl': T({ hamstrings: 0.87, glutes: 0.87 }),
  'leg-curl': T({ hamstrings: 1, calves: 0.25 }),
  'seated-leg-curl': T({ hamstrings: 1 }),
  'standing-leg-curl': T({ hamstrings: 1 }),
  'nordic-curl': T({ hamstrings: 1 }),
  'glute-ham-raise': T({ hamstrings: 1, glutes: 0.5 }),
  'cable-kickback': T({ glutes: 0.87, hamstrings: 0.37 }),
  'hip-abduction': T({ glutes: 0.75 }),
  'hip-adduction': T({ adductors: 1 }),
  'cable-pull-through': T({ glutes: 0.87, hamstrings: 0.62 }),
  'kettlebell-swing': T({ glutes: 0.87, hamstrings: 0.75, lower_back: 0.62 }),

  // Baldır
  'standing-calf-raise': T({ calves: 1 }),
  'seated-calf-raise': T({ calves: 1 }),
  'leg-press-calf-raise': T({ calves: 1 }),
  'smith-calf-raise': T({ calves: 1 }),
  'single-leg-calf-raise': T({ calves: 1 }),
  'tibialis-raise': T({ calves: 0.75 }),

  // Karın (Tablo 7) — en yüksek ölçüm (%212–248) 1, geleneksel mekik (%100) 0,75
  'bicycle-crunch': E({ abs: 1, obliques: 1 }),
  'captains-chair': E({ abs: 1, obliques: 1 }),
  'reverse-crunch': E({ abs: 0.87, obliques: 0.75 }),
  'ab-wheel': E({ abs: 0.87, obliques: 0.75 }),
  crunch: E({ abs: 0.75, obliques: 0.75 }),
  plank: E({ abs: 0.62, obliques: 0.75 }),
  'hanging-leg-raise': T({ abs: 1, obliques: 0.87 }),
  'hanging-knee-raise': T({ abs: 0.87, obliques: 0.75 }),
  'lying-leg-raise': T({ abs: 0.87, obliques: 0.5 }),
  'cable-crunch': T({ abs: 0.87, obliques: 0.5 }),
  'machine-crunch': T({ abs: 0.87, obliques: 0.5 }),
  'decline-sit-up': T({ abs: 0.87, obliques: 0.62 }),
  'russian-twist': T({ obliques: 1, abs: 0.5 }),
  woodchopper: T({ obliques: 1, abs: 0.37 }),
  'pallof-press': T({ obliques: 0.87, abs: 0.5 }),
  'side-plank': T({ obliques: 1, abs: 0.37 }),

  // Tüm vücut
  'power-clean': T({ traps: 1, glutes: 0.75, quads: 0.75, hamstrings: 0.5, lower_back: 0.75, delt_front: 0.5 }),
  'clean-and-jerk': T({ traps: 0.87, glutes: 0.75, quads: 0.75, delt_front: 0.87, triceps: 0.5, lower_back: 0.75 }),
  snatch: T({ traps: 1, glutes: 0.75, quads: 0.75, delt_side: 0.62, lower_back: 0.75 }),
  thruster: T({ quads: 1, delt_front: 0.87, glutes: 0.62, triceps: 0.5 }),
  burpee: T({ quads: 0.62, chest: 0.5, delt_front: 0.5, abs: 0.37, triceps: 0.37 }),
  'sled-push': T({ quads: 1, glutes: 0.75, calves: 0.62 }),
};

/** Raporda olmayan (ör. kendi eklediğin) hareketler için kas grubuna göre varsayılan. */
const BY_GROUP: Record<string, Act> = {
  Göğüs: { chest: 0.75, chest_upper: 0.5, delt_front: 0.37, triceps: 0.37 },
  Sırt: { lats: 0.75, traps: 0.75, biceps: 0.37 },
  Omuz: { delt_front: 0.5, delt_side: 0.75, delt_rear: 0.37 },
  Biceps: { biceps: 1 },
  Triceps: { triceps: 1 },
  'Ön Kol': { forearms: 1 },
  'Bacak (Ön)': { quads: 1, glutes: 0.5 },
  'Bacak (Arka) & Kalça': { hamstrings: 0.75, glutes: 0.75 },
  Baldır: { calves: 1 },
  'Karın & Core': { abs: 0.75, obliques: 0.5 },
  'Tüm Vücut': { quads: 0.5, glutes: 0.5, traps: 0.5, delt_front: 0.37 },
};

export function profileFor(ex: Exercise | undefined): Profile {
  if (!ex) return { m: {} };
  return ACTIVATION[ex.id] ?? { m: BY_GROUP[ex.muscleGroup ?? ''] ?? {} };
}

export type MuscleLoad = Partial<Record<MuscleId, number>>;

/** Etkili set: set sayısı × aktivasyon katsayısı, kas başına toplanır. */
export function effectiveSets(entries: { exerciseId: string; sets: number }[], exercises: Exercise[]): MuscleLoad {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const out: MuscleLoad = {};
  for (const { exerciseId, sets } of entries) {
    const p = profileFor(byId.get(exerciseId));
    for (const [m, a] of Object.entries(p.m) as [MuscleId, number][]) out[m] = (out[m] ?? 0) + sets * a;
  }
  for (const k of Object.keys(out) as MuscleId[]) out[k] = Math.round(out[k]! * 10) / 10;
  return out;
}

export const templateLoad = (t: Template, exercises: Exercise[]) =>
  effectiveSets(
    t.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: e.sets })),
    exercises,
  );

/** Tarih aralığındaki gerçek antrenmanlardan (tamamlanmış setler) kas yükü. */
export function workoutsLoad(workouts: Workout[], exercises: Exercise[], from: string, to: string): MuscleLoad {
  const done = (sets: SetEntry[]) => sets.filter((s) => s.reps > 0).length;
  return effectiveSets(
    workouts
      .filter((w) => w.date >= from && w.date <= to)
      .flatMap((w) => w.exercises.map((we) => ({ exerciseId: we.exerciseId, sets: done(we.sets) }))),
    exercises,
  );
}

export type Zone = 'none' | 'low' | 'mid' | 'good' | 'over';

/** Tek seans (program): ideal 6–8, 10'un üstü verimsiz. */
export function sessionZone(sets: number): Zone {
  if (sets <= 0.05) return 'none';
  if (sets < 2) return 'low';
  if (sets < 4) return 'mid';
  if (sets <= 10) return 'good';
  return 'over';
}

/**
 * Kas başına haftalık hacim işaretleri (haftalık set): MEV en az etkili,
 * MAV en verimli aralık, MRV toparlanılabilecek üst sınır (alt değerleri).
 * Kaynak: kullanıcının "Hipertrofi ve Direnç Antrenmanı Rehberi" not defteri.
 * MEV'i verilmeyen kaslarda (0) eşik MAV'ın yarısıdır.
 */
export const LANDMARKS: Partial<Record<MuscleId, { mev: number; mav: [number, number]; mrv: number }>> = {
  chest_upper: { mev: 4, mav: [6, 16], mrv: 16 },
  chest: { mev: 4, mav: [6, 16], mrv: 16 },
  lats: { mev: 0, mav: [14, 22], mrv: 25 },
  traps: { mev: 0, mav: [14, 22], mrv: 25 },
  delt_front: { mev: 0, mav: [6, 8], mrv: 12 },
  delt_side: { mev: 6, mav: [8, 22], mrv: 22 },
  delt_rear: { mev: 0, mav: [4, 12], mrv: 12 },
  biceps: { mev: 8, mav: [14, 20], mrv: 20 },
  triceps: { mev: 0, mav: [10, 14], mrv: 18 },
  quads: { mev: 4, mav: [6, 14], mrv: 14 },
  hamstrings: { mev: 2, mav: [2, 8], mrv: 8 },
  glutes: { mev: 0, mav: [4, 12], mrv: 16 },
  calves: { mev: 0, mav: [12, 16], mrv: 20 },
  abs: { mev: 0, mav: [16, 20], mrv: 25 },
  obliques: { mev: 0, mav: [16, 20], mrv: 25 },
};

/** Haftalık bölge: kasın kendi hacim işaretlerine göre; verisi yoksa seviye hedefine göre. */
export function muscleWeeklyZone(sets: number, m: MuscleId, levelTarget: [number, number]): Zone {
  const L = LANDMARKS[m];
  if (!L) return weeklyZone(sets, levelTarget);
  if (sets <= 0.05) return 'none';
  if (sets < (L.mev > 0 ? L.mev : L.mav[0] / 2)) return 'low';
  if (sets < L.mav[0]) return 'mid';
  if (sets <= L.mrv) return 'good';
  return 'over';
}

export function muscleTargetText(m: MuscleId, levelTarget: [number, number]): string {
  const L = LANDMARKS[m];
  if (!L) return `hedef ${levelTarget[0]}–${levelTarget[1]}`;
  return `verimli ${L.mav[0]}–${L.mav[1]}, üst sınır ${L.mrv}`;
}

/** Haftalık: seviyenin haftalık set hedefine göre. */
export function weeklyZone(sets: number, [lo, hi]: [number, number]): Zone {
  if (sets <= 0.05) return 'none';
  if (sets < lo / 2) return 'low';
  if (sets < lo) return 'mid';
  if (sets <= hi) return 'good';
  return 'over';
}

/** Programdaki hareketlerden kaçının ölçüm (EMG) verisine dayandığı. */
export function emgCoverage(ids: string[]): { emg: number; total: number } {
  const uniq = [...new Set(ids)];
  return { emg: uniq.filter((id) => ACTIVATION[id]?.emg).length, total: uniq.length };
}
