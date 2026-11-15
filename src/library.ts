/**
 * Hazır programlar (kullanıcının hipertrofi not defterlerindeki
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

const PLANS: LibraryPlan[] = [
  {
    id: 'novice-ab',
    name: 'Yeni başlayan A/B, 3 gün',
    short: 'Başlangıç',
    level: 'Yeni başlayan',
    frequency: 'Haftada 3 gün, ardışık olmayan (Pzt, Çar, Cum)',
    about:
      'A ve B antrenmanları sırayla dönüşümlü yapılır (A-B-A, sonraki hafta B-A-B). Temel hareketlerde her seans biraz ağırlık eklenir. Dinlenme: ağır hareketlerde 2–3 dk, diğerlerinde 60–90 sn.',
    days: [
      {
        name: 'A antrenmanı',
        exercises: [
          e('squat', 3, [8, 10], '3 dk dinlenme'),
          e('bench-press', 3, [8, 10], '2–3 dk dinlenme'),
          e('barbell-row', 3, [8, 10], '2 dk dinlenme'),
          e('db-shoulder-press', 2, [10, 12], 'ayakta'),
          e('back-extension', 2, [10, 12], 'ya da Plank'),
        ],
      },
      {
        name: 'B antrenmanı',
        exercises: [
          e('deadlift', 3, [6, 8], 'trap bar ya da klasik, 3 dk dinlenme'),
          e('overhead-press', 3, [8, 10]),
          e('lat-pulldown', 3, [8, 10], 'ya da destekli barfiks'),
          e('incline-db-press', 2, [10, 12]),
          e('leg-curl', 2, [10, 12], 'ya da Cable Woodchopper'),
        ],
      },
    ],
  },
  {
    id: 'phul',
    name: 'PHUL (Power Hypertrophy Upper Lower)',
    short: 'PHUL',
    level: 'Orta seviye',
    frequency: 'Haftada 4 gün: Pzt üst güç, Sal alt güç, Per üst hipertrofi, Cum alt hipertrofi',
    about:
      'Haftada 2 güç günü (3–5 tekrar, 2 dk dinlenme) ve 2 hipertrofi günü (8–12 tekrar, 60–90 sn dinlenme). Her kas haftada 2 kez çalışır.',
    days: [
      {
        name: 'Üst güç',
        exercises: [
          e('bench-press', [3, 4], [3, 5]),
          e('incline-db-press', [3, 4], [6, 10]),
          e('barbell-row', [3, 4], [3, 5]),
          e('lat-pulldown', [3, 4], [6, 10]),
          e('overhead-press', [2, 3], [5, 8]),
          e('biceps-curl', [2, 3], [6, 10]),
          e('skull-crusher', [2, 3], [6, 10]),
        ],
      },
      {
        name: 'Alt güç',
        exercises: [
          e('squat', [3, 4], [3, 5]),
          e('deadlift', [3, 4], [3, 5]),
          e('leg-press', [3, 5], [10, 15]),
          e('leg-curl', [3, 4], [6, 10]),
          e('standing-calf-raise', 4, [6, 10]),
        ],
      },
      {
        name: 'Üst hipertrofi',
        exercises: [
          e('incline-bench-press', [3, 4], [8, 12]),
          e('chest-fly', [3, 4], [8, 12]),
          e('seated-row', [3, 4], [8, 12]),
          e('db-row', [3, 4], [8, 12]),
          e('lateral-raise', [3, 4], [8, 12]),
          e('incline-db-curl', [3, 4], [8, 12]),
          e('triceps-pushdown', [3, 4], [8, 12]),
        ],
      },
      {
        name: 'Alt hipertrofi',
        exercises: [
          e('front-squat', [3, 4], [8, 12]),
          e('walking-lunge', [3, 4], [8, 12], 'barbell'),
          e('leg-extension', [3, 4], [10, 15]),
          e('seated-leg-curl', [3, 4], [10, 15]),
          e('seated-calf-raise', [3, 4], [8, 12]),
          e('leg-press-calf-raise', [3, 4], [8, 12]),
        ],
      },
    ],
  },
  {
    id: 'split-ab-4',
    name: 'İtiş / Çekiş+Bacak, 4 gün',
    short: 'Split A/B',
    level: 'Yeni başlayan ve orta',
    frequency: 'Haftada 4 gün: A (Pzt, Per), B (Sal, Cum)',
    about:
      'Araştırma protokolü. A günü göğüs, omuz, triceps; B günü sırt, biceps, bacak. Tüm setler 8–12 tekrar, 60 sn dinlenme.',
    days: [
      {
        name: 'A: Göğüs, omuz, triceps',
        exercises: [
          e('bench-press', 4, [8, 12]),
          e('incline-bench-press', 4, [8, 12]),
          e('triceps-pushdown', 4, [8, 12]),
          e('triceps-kickback', 4, [8, 12]),
          e('db-shoulder-press', 4, [8, 12]),
          e('front-raise', 4, [8, 12]),
        ],
      },
      {
        name: 'B: Sırt, biceps, bacak',
        exercises: [
          e('seated-row', 4, [8, 12]),
          e('lat-pulldown', 4, [8, 12]),
          e('biceps-curl', 4, [8, 12]),
          e('hammer-curl', 4, [8, 12]),
          e('squat', 8, [8, 12]),
          e('leg-curl', 8, [8, 12]),
        ],
      },
    ],
  },
  {
    id: 'full-body-4',
    name: 'Tam Vücut, 4 gün',
    short: 'Tam Vücut 4',
    level: 'Yeni başlayan ve orta',
    frequency: 'Haftada 4 gün (Pzt, Sal, Per, Cum)',
    about:
      'Araştırma protokolü: her gün aynı 7 hareket, tüm kaslar haftada 4 kez. Tüm setler 8–12 tekrar, 60 sn dinlenme.',
    days: [
      {
        name: 'Her gün',
        exercises: [
          e('bench-press', 4, [8, 12]),
          e('triceps-pushdown', 4, [8, 12]),
          e('db-shoulder-press', 4, [8, 12]),
          e('seated-row', 4, [8, 12]),
          e('biceps-curl', 4, [8, 12]),
          e('squat', 4, [8, 12]),
          e('leg-curl', 4, [8, 12]),
        ],
      },
    ],
  },
  {
    id: 'home-six',
    name: 'Evde başlangıç (ekipmansız)',
    short: 'Ev Başlangıç',
    level: 'Hiç antrenman yapmamış',
    frequency: 'Esnek, 12–18 dakika',
    about: 'Vücut ağırlığıyla 6 temel hareket. Setler arası 45–60 sn dinlenme.',
    days: [
      {
        name: 'Her seans',
        exercises: [
          e('chair-squat', 2, 10),
          e('incline-push-up', 2, [8, 10]),
          e('glute-bridge', 2, 12),
          e('dead-bug', 2, 8, 'taraf başı'),
          e('plank', 2, 20, 'saniye'),
          e('bird-dog', 2, 8, 'taraf başı'),
        ],
      },
    ],
  },
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

/** Kolaydan zora sıralı. */
const ORDER = ['home-six', 'novice-ab', 'full-body-3', 'med-2', 'med-template', 'full-body-4', 'split-ab-4', 'phul', 'gbr', 'near-failure-3'];
export const LIBRARY: LibraryPlan[] = [...PLANS].sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

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
