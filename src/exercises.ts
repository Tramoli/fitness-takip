import type { Exercise } from './types';

/** Kas gruplarının listede görünme sırası. Bilinmeyen gruplar sona eklenir. */
export const GROUP_ORDER = [
  'Göğüs',
  'Sırt',
  'Omuz',
  'Biceps',
  'Triceps',
  'Ön Kol',
  'Bacak (Ön)',
  'Bacak (Arka) & Kalça',
  'Baldır',
  'Karın & Core',
  'Tüm Vücut',
];

type Def = [id: string, name: string];

const G = (group: string, defs: Def[]): Exercise[] =>
  defs.map(([id, name]) => ({ id, name, muscleGroup: group }));

export const DEFAULT_EXERCISES: Exercise[] = [
  ...G('Göğüs', [
    ['bench-press', 'Bench Press'],
    ['incline-bench-press', 'Incline Bench Press'],
    ['decline-bench-press', 'Decline Bench Press'],
    ['db-bench-press', 'Dumbbell Bench Press'],
    ['incline-db-press', 'Incline Dumbbell Press'],
    ['decline-db-press', 'Decline Dumbbell Press'],
    ['close-grip-bench', 'Close Grip Bench Press'],
    ['smith-bench-press', 'Smith Machine Bench Press'],
    ['smith-incline-press', 'Smith Machine Incline Press'],
    ['machine-chest-press', 'Chest Press (Makine)'],
    ['incline-machine-press', 'Incline Chest Press (Makine)'],
    ['chest-fly', 'Dumbbell Fly'],
    ['incline-db-fly', 'Incline Dumbbell Fly'],
    ['pec-deck', 'Pec Deck / Butterfly'],
    ['cable-crossover', 'Cable Crossover'],
    ['low-cable-fly', 'Low-to-High Cable Fly'],
    ['high-cable-fly', 'High-to-Low Cable Fly'],
    ['push-up', 'Şınav (Push-up)'],
    ['weighted-push-up', 'Ağırlıklı Şınav'],
    ['chest-dips', 'Göğüs Dips'],
    ['db-pullover', 'Dumbbell Pullover'],
    ['svend-press', 'Svend Press'],
  ]),
  ...G('Sırt', [
    ['deadlift', 'Deadlift'],
    ['sumo-deadlift', 'Sumo Deadlift'],
    ['rack-pull', 'Rack Pull'],
    ['pull-up', 'Barfiks (Pull-up)'],
    ['chin-up', 'Chin-up'],
    ['weighted-pull-up', 'Ağırlıklı Barfiks'],
    ['assisted-pull-up', 'Destekli Barfiks (Makine)'],
    ['lat-pulldown', 'Lat Pulldown'],
    ['close-grip-pulldown', 'Close Grip Lat Pulldown'],
    ['reverse-grip-pulldown', 'Reverse Grip Lat Pulldown'],
    ['single-arm-pulldown', 'Tek Kol Lat Pulldown'],
    ['straight-arm-pulldown', 'Straight Arm Pulldown'],
    ['barbell-row', 'Barbell Row'],
    ['pendlay-row', 'Pendlay Row'],
    ['yates-row', 'Yates Row'],
    ['db-row', 'Tek Kol Dumbbell Row'],
    ['chest-supported-row', 'Chest Supported Row'],
    ['t-bar-row', 'T-Bar Row'],
    ['seated-row', 'Seated Cable Row'],
    ['wide-cable-row', 'Wide Grip Cable Row'],
    ['machine-row', 'Seated Row (Makine)'],
    ['meadows-row', 'Meadows Row'],
    ['seal-row', 'Seal Row'],
    ['inverted-row', 'Inverted Row'],
    ['back-extension', 'Back Extension (Hiperekstansiyon)'],
    ['good-morning', 'Good Morning'],
    ['barbell-shrug', 'Barbell Shrug'],
    ['db-shrug', 'Dumbbell Shrug'],
  ]),
  ...G('Omuz', [
    ['overhead-press', 'Overhead Press (Barbell)'],
    ['seated-barbell-press', 'Seated Barbell Shoulder Press'],
    ['db-shoulder-press', 'Dumbbell Shoulder Press'],
    ['arnold-press', 'Arnold Press'],
    ['machine-shoulder-press', 'Shoulder Press (Makine)'],
    ['smith-shoulder-press', 'Smith Machine Shoulder Press'],
    ['push-press', 'Push Press'],
    ['landmine-press', 'Landmine Press'],
    ['lateral-raise', 'Lateral Raise (Dumbbell)'],
    ['cable-lateral-raise', 'Cable Lateral Raise'],
    ['machine-lateral-raise', 'Lateral Raise (Makine)'],
    ['front-raise', 'Front Raise'],
    ['cable-front-raise', 'Cable Front Raise'],
    ['rear-delt-fly', 'Rear Delt Fly (Dumbbell)'],
    ['reverse-pec-deck', 'Reverse Pec Deck'],
    ['cable-rear-delt-fly', 'Cable Rear Delt Fly'],
    ['face-pull', 'Face Pull'],
    ['upright-row', 'Upright Row'],
    ['y-raise', 'Y Raise'],
  ]),
  ...G('Biceps', [
    ['biceps-curl', 'Barbell Curl'],
    ['ez-bar-curl', 'EZ Bar Curl'],
    ['db-curl', 'Dumbbell Curl'],
    ['alternating-db-curl', 'Alternating Dumbbell Curl'],
    ['hammer-curl', 'Hammer Curl'],
    ['cable-hammer-curl', 'Rope Hammer Curl'],
    ['incline-db-curl', 'Incline Dumbbell Curl'],
    ['preacher-curl', 'Preacher Curl'],
    ['machine-preacher-curl', 'Preacher Curl (Makine)'],
    ['concentration-curl', 'Concentration Curl'],
    ['cable-curl', 'Cable Curl'],
    ['bayesian-curl', 'Bayesian Cable Curl'],
    ['spider-curl', 'Spider Curl'],
    ['drag-curl', 'Drag Curl'],
    ['reverse-curl', 'Reverse Curl'],
  ]),
  ...G('Triceps', [
    ['triceps-pushdown', 'Triceps Pushdown (Bar)'],
    ['rope-pushdown', 'Rope Pushdown'],
    ['single-arm-pushdown', 'Tek Kol Pushdown'],
    ['overhead-cable-extension', 'Overhead Cable Triceps Extension'],
    ['overhead-db-extension', 'Overhead Dumbbell Extension'],
    ['skull-crusher', 'Skull Crusher'],
    ['db-skull-crusher', 'Dumbbell Skull Crusher'],
    ['jm-press', 'JM Press'],
    ['dips', 'Triceps Dips'],
    ['bench-dips', 'Bench Dips'],
    ['machine-dips', 'Dips (Makine)'],
    ['triceps-kickback', 'Triceps Kickback'],
    ['diamond-push-up', 'Diamond Şınav'],
  ]),
  ...G('Ön Kol', [
    ['wrist-curl', 'Wrist Curl'],
    ['reverse-wrist-curl', 'Reverse Wrist Curl'],
    ['farmers-walk', "Farmer's Walk"],
    ['dead-hang', 'Dead Hang'],
    ['plate-pinch', 'Plate Pinch'],
  ]),
  ...G('Bacak (Ön)', [
    ['squat', 'Back Squat'],
    ['front-squat', 'Front Squat'],
    ['high-bar-squat', 'High Bar Squat'],
    ['pause-squat', 'Pause Squat'],
    ['box-squat', 'Box Squat'],
    ['goblet-squat', 'Goblet Squat'],
    ['hack-squat', 'Hack Squat'],
    ['smith-squat', 'Smith Machine Squat'],
    ['pendulum-squat', 'Pendulum Squat'],
    ['belt-squat', 'Belt Squat'],
    ['leg-press', 'Leg Press'],
    ['single-leg-press', 'Tek Bacak Leg Press'],
    ['leg-extension', 'Leg Extension'],
    ['bulgarian-split-squat', 'Bulgarian Split Squat'],
    ['split-squat', 'Split Squat'],
    ['walking-lunge', 'Walking Lunge'],
    ['reverse-lunge', 'Reverse Lunge'],
    ['step-up', 'Step-up'],
    ['sissy-squat', 'Sissy Squat'],
  ]),
  ...G('Bacak (Arka) & Kalça', [
    ['romanian-deadlift', 'Romanian Deadlift'],
    ['db-romanian-deadlift', 'Dumbbell Romanian Deadlift'],
    ['stiff-leg-deadlift', 'Stiff Leg Deadlift'],
    ['single-leg-rdl', 'Tek Bacak RDL'],
    ['leg-curl', 'Lying Leg Curl'],
    ['seated-leg-curl', 'Seated Leg Curl'],
    ['standing-leg-curl', 'Standing Leg Curl'],
    ['nordic-curl', 'Nordic Curl'],
    ['glute-ham-raise', 'Glute Ham Raise'],
    ['hip-thrust', 'Hip Thrust'],
    ['machine-hip-thrust', 'Hip Thrust (Makine)'],
    ['glute-bridge', 'Glute Bridge'],
    ['cable-kickback', 'Cable Glute Kickback'],
    ['hip-abduction', 'Hip Abduction (Makine)'],
    ['hip-adduction', 'Hip Adduction (Makine)'],
    ['cable-pull-through', 'Cable Pull-through'],
    ['kettlebell-swing', 'Kettlebell Swing'],
  ]),
  ...G('Baldır', [
    ['standing-calf-raise', 'Standing Calf Raise'],
    ['seated-calf-raise', 'Seated Calf Raise'],
    ['leg-press-calf-raise', 'Leg Press Calf Raise'],
    ['smith-calf-raise', 'Smith Machine Calf Raise'],
    ['single-leg-calf-raise', 'Tek Bacak Calf Raise'],
    ['tibialis-raise', 'Tibialis Raise'],
  ]),
  ...G('Karın & Core', [
    ['crunch', 'Crunch'],
    ['bicycle-crunch', 'Bicycle Crunch'],
    ['reverse-crunch', 'Reverse Crunch'],
    ['cable-crunch', 'Cable Crunch'],
    ['machine-crunch', 'Crunch (Makine)'],
    ['decline-sit-up', 'Decline Sit-up'],
    ['hanging-leg-raise', 'Hanging Leg Raise'],
    ['hanging-knee-raise', 'Hanging Knee Raise'],
    ['captains-chair', "Captain's Chair Leg Raise"],
    ['lying-leg-raise', 'Lying Leg Raise'],
    ['ab-wheel', 'Ab Wheel Rollout'],
    ['russian-twist', 'Russian Twist'],
    ['woodchopper', 'Cable Woodchopper'],
    ['pallof-press', 'Pallof Press'],
    ['plank', 'Plank (sn)'],
    ['side-plank', 'Side Plank (sn)'],
  ]),
  ...G('Tüm Vücut', [
    ['power-clean', 'Power Clean'],
    ['clean-and-jerk', 'Clean & Jerk'],
    ['snatch', 'Snatch'],
    ['thruster', 'Thruster'],
    ['burpee', 'Burpee'],
    ['sled-push', 'Sled Push'],
  ]),
];

/**
 * Kayıtlı veriye sonradan eklenen varsayılan hareketleri ekler ve
 * varsayılan hareketlerin adını/grubunu günceller. Kullanıcının kendi
 * eklediği hareketlere dokunmaz.
 */
export function mergeDefaultExercises(stored: Exercise[]): Exercise[] {
  const defaults = new Map(DEFAULT_EXERCISES.map((e) => [e.id, e]));
  const seen = new Set<string>();
  const merged = stored.map((e) => {
    seen.add(e.id);
    const d = defaults.get(e.id);
    return d ? { ...d, repMin: e.repMin, repMax: e.repMax } : e;
  });
  for (const d of DEFAULT_EXERCISES) if (!seen.has(d.id)) merged.push(d);
  return merged;
}

/** Kas grubunu olimpik plaka renklerinden birine eşler (CSS değişkeni adı). */
export function groupColor(group?: string): string {
  switch (group) {
    case 'Göğüs':
      return 'var(--plate-red)';
    case 'Sırt':
      return 'var(--plate-blue)';
    case 'Bacak (Ön)':
    case 'Bacak (Arka) & Kalça':
    case 'Baldır':
      return 'var(--plate-yellow)';
    case 'Omuz':
      return 'var(--plate-green)';
    case 'Biceps':
    case 'Triceps':
    case 'Ön Kol':
      return 'var(--plate-grey)';
    default:
      return 'var(--plate-black)';
  }
}
