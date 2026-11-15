/**
 * Hazır programlar ("Direnç Antrenmanı ve Hipertrofi Bilimi" not defterindeki
 * kaynaklardan). Aralıklar kaynaktaki gibi tutulur; kopyalanınca programa
 * aralığın alt sınırı yazılır, kullanıcı düzenleyebilir.
 */
import type { Template } from './types';

type Range = [number, number];

export interface LibraryExercise {
  id: string;
  sets: Range;
  /** Yoksa "tükenişe yakın" (kaynakta tekrar verilmemiş). */
  reps?: Range;
  note?: string;
}

export interface LibraryDay {
  name: string;
  exercises: LibraryExercise[];
}

export interface LibraryPlan {
  id: string;
  name: string;
  /** Kopyalanan programların ad öneki. */
  short: string;
  level: string;
  frequency: string;
  about: string;
  days: LibraryDay[];
}

const e = (id: string, sets: number | Range, reps?: number | Range, note?: string): LibraryExercise => ({
  id,
  sets: typeof sets === 'number' ? [sets, sets] : sets,
  reps: reps === undefined ? undefined : typeof reps === 'number' ? [reps, reps] : reps,
  note,
});

export const LIBRARY: LibraryPlan[] = [
  {
    id: 'full-body-3',
    name: 'Tam Vücut, 3 gün',
    short: 'Tam Vücut',
    level: 'Yeni başlayan ya da uzun ara vermiş',
    frequency: 'Haftada 3 gün (Pzt, Çar, Cum)',
    about: 'Her kas haftada 3 kez çalışır. Her gün farklı hareketlerle tüm vücut.',
    days: [
      {
        name: '1. gün',
        exercises: [
          e('leg-press', 3, [8, 10], 'ya da Goblet Squat'),
          e('incline-db-press', 3, [8, 10]),
          e('lat-pulldown', 3, [10, 12], 'ya da göğüs destekli row'),
          e('db-shoulder-press', 2, [10, 12]),
          e('leg-curl', 3, [10, 12]),
          e('cable-crunch', 3, [12, 15], 'ya da 30–45 sn plank'),
        ],
      },
      {
        name: '2. gün',
        exercises: [
          e('db-romanian-deadlift', 3, [8, 10]),
          e('machine-chest-press', 3, [10, 12]),
          e('wide-cable-row', 3, [10, 12]),
          e('bulgarian-split-squat', 2, [10, 12], 'bacak başı'),
          e('standing-calf-raise', 3, [12, 15]),
          e('db-curl', 2, [12, 15], 'pushdown ile süperset'),
          e('triceps-pushdown', 2, [12, 15], 'curl ile süperset'),
        ],
      },
      {
        name: '3. gün',
        exercises: [
          e('hack-squat', 3, [8, 10], 'ya da Smith Machine Squat'),
          e('db-bench-press', 3, [8, 10]),
          e('close-grip-pulldown', 3, [10, 12], 'nötr tutuş'),
          e('machine-lateral-raise', 3, [12, 15]),
          e('seated-leg-curl', 3, [10, 12]),
          e('pallof-press', 3, [12, 15], 'ya da Hanging Knee Raise'),
        ],
      },
    ],
  },
  {
    id: 'gbr',
    name: 'Lyle McDonald Generic Bulking Routine',
    short: 'GBR',
    level: 'Orta ve ileri (1–3 yıl), kas kazanımı',
    frequency: 'Haftada 4 gün: Alt (Pzt, Per), Üst (Sal, Cum)',
    about: 'Üst/alt bölünmüş, her kas haftada 2 kez. Ağır temel hareketler 6–8, yardımcılar 10–15 tekrar.',
    days: [
      {
        name: 'Alt vücut',
        exercises: [
          e('squat', [3, 4], [6, 8], 'ya da Front Squat'),
          e('romanian-deadlift', [3, 4], [6, 8], 'ya da Stiff Leg Deadlift'),
          e('leg-press', [2, 3], [10, 12], 'ya da Hack Squat'),
          e('seated-leg-curl', [2, 3], [10, 12], 'ya da Lying Leg Curl'),
          e('standing-calf-raise', [3, 4], [6, 8]),
          e('seated-calf-raise', [2, 3], [10, 12], 'ya da Cable Crunch'),
        ],
      },
      {
        name: 'Üst vücut',
        exercises: [
          e('bench-press', [3, 4], [6, 8]),
          e('barbell-row', [3, 4], [6, 8]),
          e('incline-db-press', [2, 3], [10, 12], 'ya da Overhead Press'),
          e('lat-pulldown', [2, 3], [10, 12], 'ya da Chin-up'),
          e('skull-crusher', [1, 2], [12, 15], 'EZ bar'),
          e('hammer-curl', [1, 2], [12, 15]),
        ],
      },
    ],
  },
  {
    id: 'med-2',
    name: 'Zaman kısıtlı, 2 gün',
    short: 'Kısa 2 Gün',
    level: 'Yeni başlayan, yoğun programı olan',
    frequency: 'Haftada 2 gün (ör. Salı, Cumartesi)',
    about: 'Minimum etkili doz: az set, temel hareketler. Kısa seanslarla kas kazanmak ya da korumak için.',
    days: [
      {
        name: '1. seans',
        exercises: [
          e('leg-press', 3, [8, 10]),
          e('db-bench-press', 2, [8, 10]),
          e('chest-supported-row', 2, [8, 10]),
          e('romanian-deadlift', 3, [10, 12]),
        ],
      },
      {
        name: '2. seans',
        exercises: [
          e('goblet-squat', 3, [8, 10]),
          e('db-shoulder-press', 2, [8, 10], 'ayakta'),
          e('lat-pulldown', 2, [8, 10]),
          e('leg-curl', 2, [10, 12], 'face pull ile eşli set'),
          e('face-pull', 2, [10, 12], 'leg curl ile eşli set'),
        ],
      },
    ],
  },
  {
    id: 'med-template',
    name: 'Minimum doz şablonu',
    short: 'Minimum Doz',
    level: 'Zamanı kısıtlı, kas ve kuvveti korumak isteyen',
    frequency: 'Haftada 2–3 gün, her seans tam vücut',
    about: 'Bir alt vücut itiş, bir üst vücut itiş, bir çekiş. Hareket başına 1–2 set, 6–15 tekrar (haftada kas başına 4–6 set).',
    days: [
      {
        name: 'Her seans',
        exercises: [
          e('leg-press', [1, 2], [6, 15], 'ya da Squat'),
          e('bench-press', [1, 2], [6, 15]),
          e('seated-row', [1, 2], [6, 15], 'ya da Barfiks'),
        ],
      },
    ],
  },
  {
    id: 'near-failure-3',
    name: 'Tükenişe yakın, 3 gün',
    short: 'Tükenişe Yakın',
    level: 'Antrenman geçmişi olan',
    frequency: 'Haftada 3 gün',
    about: 'Araştırma protokolü. Ana hareketler 1RM\'in %65–70\'iyle tükenişe yakın, yardımcılar 15 tekrar.',
    days: [
      {
        name: '1. gün',
        exercises: [
          e('squat', 3, undefined, '1RM %70'),
          e('deadlift', 3, undefined, '1RM %65'),
          e('bulgarian-split-squat', 3, 15),
          e('romanian-deadlift', 3, 15),
          e('face-pull', 3, 15),
          e('skull-crusher', 3, 15),
        ],
      },
      {
        name: '2. gün',
        exercises: [
          e('bench-press', 3, undefined, '1RM %70'),
          e('squat', 3, undefined, '1RM %65'),
          e('incline-bench-press', 3, 15, 'düşük eğim'),
          e('lat-pulldown', 3, 15),
          e('goblet-squat', 3, 15),
        ],
      },
      {
        name: '3. gün',
        exercises: [
          e('deadlift', 3, undefined, '1RM %70'),
          e('bench-press', 3, undefined, '1RM %65'),
          e('overhead-press', 3, 15),
          e('barbell-row', 3, 15),
          e('biceps-curl', 3, 15),
          e('lateral-raise', 3, 15),
        ],
      },
    ],
  },
];

export const templateName = (plan: LibraryPlan, day: LibraryDay) =>
  plan.days.length === 1 ? plan.short : `${plan.short}: ${day.name}`;

/** Hazır programın günlerini kullanıcının programlarına dönüştürür. */
export function planToTemplates(plan: LibraryPlan, makeId: () => string): Template[] {
  return plan.days.map((day) => ({
    id: makeId(),
    name: templateName(plan, day),
    exercises: day.exercises.map((x) => ({ exerciseId: x.id, sets: x.sets[0], ...(x.reps ? { reps: x.reps[0] } : {}) })),
  }));
}

export const rangeText = (r?: Range) => (!r ? 'tükenişe yakın' : r[0] === r[1] ? String(r[0]) : `${r[0]}–${r[1]}`);
