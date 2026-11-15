/**
 * Progresif overload analizi.
 *
 * Kurallar, kullanıcının "Direnç Antrenmanlarında Hipertrofi ve Kas Gelişimi
 * Kılavuzu" not defterindeki "Progresif Overload Kuralları ve Uygulama
 * Protokolü" bölümünden alınmıştır:
 *  1. Çift ilerleme: tüm setler aralığın üst sınırına ulaşınca ağırlık
 *     %2,5–5 artırılır, tekrar alt sınıra çekilir; ikisi aynı anda artmaz.
 *  2. Temel hareketlerde setler 1–3 RIR'da biter; 0 RIR yalnızca izolasyonda.
 *  3. Seans başına kas grubu için 6–8 set tavanı; haftalık hedef seviyeye göre.
 *  4. Hareket açıklığı sabit tutulur (uygulama ölçemez, hatırlatılır).
 *  5. 4–6 haftalık bloktan sonra setlerin ~%50 azaltıldığı 1 haftalık deload.
 */
import { addDays, differenceInCalendarDays, format, parseISO, startOfISOWeek } from 'date-fns';
import type { Exercise, Level, SetEntry, Unit, Workout } from './types';
import { fromUnit, roundIn, toUnit } from './units';
import { estimate1RM, round1, sortByDateAsc } from './stats';

// ---------- Seviye hedefleri (kaynak tablosu) ----------

export const LEVELS: Record<
  Level,
  { label: string; weeklySets: [number, number]; rir: [number, number]; deloadEvery: [number, number] }
> = {
  beginner: { label: 'Başlangıç', weeklySets: [8, 10], rir: [2, 3], deloadEvery: [6, 8] },
  intermediate: { label: 'Orta', weeklySets: [10, 16], rir: [1, 2], deloadEvery: [5, 6] },
  advanced: { label: 'İleri', weeklySets: [16, 20], rir: [1, 2], deloadEvery: [4, 5] },
};

/** Seans başına aynı kas grubu için set tavanı (6–8). */
export const SESSION_SET_CAP = 8;

// ---------- Hareket sınıflandırması ----------

/** Çok eklemli temel hareketler: 1–3 RIR, daha düşük tekrar aralığı. */
const COMPOUND = new Set([
  'bench-press', 'incline-bench-press', 'decline-bench-press', 'db-bench-press', 'incline-db-press',
  'decline-db-press', 'close-grip-bench', 'smith-bench-press', 'smith-incline-press', 'machine-chest-press',
  'incline-machine-press', 'push-up', 'weighted-push-up', 'chest-dips', 'dips', 'machine-dips',
  'deadlift', 'sumo-deadlift', 'rack-pull', 'pull-up', 'chin-up', 'weighted-pull-up', 'assisted-pull-up',
  'lat-pulldown', 'close-grip-pulldown', 'reverse-grip-pulldown', 'barbell-row', 'pendlay-row', 'yates-row',
  'db-row', 'chest-supported-row', 't-bar-row', 'seated-row', 'wide-cable-row', 'machine-row', 'meadows-row',
  'seal-row', 'inverted-row', 'good-morning',
  'overhead-press', 'seated-barbell-press', 'db-shoulder-press', 'arnold-press', 'machine-shoulder-press',
  'smith-shoulder-press', 'push-press', 'landmine-press',
  'squat', 'front-squat', 'high-bar-squat', 'pause-squat', 'box-squat', 'goblet-squat', 'hack-squat',
  'smith-squat', 'pendulum-squat', 'belt-squat', 'leg-press', 'single-leg-press', 'bulgarian-split-squat',
  'split-squat', 'walking-lunge', 'reverse-lunge', 'step-up',
  'romanian-deadlift', 'db-romanian-deadlift', 'stiff-leg-deadlift', 'single-leg-rdl', 'hip-thrust',
  'machine-hip-thrust', 'power-clean', 'clean-and-jerk', 'snatch', 'thruster',
]);

export const isCompound = (ex: Pick<Exercise, 'id'>) => COMPOUND.has(ex.id);

const LOWER_BODY = new Set(['Bacak (Ön)', 'Bacak (Arka) & Kalça', 'Baldır']);

/** Varsayılan tekrar aralığı: temel hareketler 6–10, diğerleri 8–12. */
export function repRange(ex: Exercise): [number, number] {
  const def: [number, number] = isCompound(ex) ? [6, 10] : [8, 12];
  const lo = ex.repMin ?? def[0];
  const hi = Math.max(lo, ex.repMax ?? def[1]);
  return [lo, hi];
}

/** Ağırlık artış adımı: dambıl ile 2 kg, diğerlerinde 2,5 kg. */
export function weightStep(ex: Exercise): number {
  return /dumbbell|dambıl/i.test(ex.name) || ex.id.startsWith('db-') ? 2 : 2.5;
}

/** Artış oranı: alt vücut temel hareketlerde %5, diğerlerinde %2,5. */
export function increasePct(ex: Exercise): number {
  return isCompound(ex) && LOWER_BODY.has(ex.muscleGroup ?? '') ? 0.05 : 0.025;
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

// ---------- Seans geçmişi ----------

export interface Session {
  date: string;
  /** Tamamlanmış (tekrar > 0) setler. */
  sets: SetEntry[];
  rir?: number;
  /** Seanstaki en yüksek ağırlık. */
  topKg: number;
  /** En yüksek ağırlıkla yapılan setler (çalışma setleri). */
  working: SetEntry[];
  best1RM: number;
}

export function sessionsFor(workouts: Workout[], exerciseId: string, beforeDate?: string): Session[] {
  const out: Session[] = [];
  for (const w of sortByDateAsc(workouts)) {
    if (beforeDate && w.date >= beforeDate) continue;
    const wes = w.exercises.filter((e) => e.exerciseId === exerciseId);
    const sets = wes.flatMap((e) => e.sets).filter((s) => s.reps > 0);
    if (!sets.length) continue;
    const topKg = Math.max(...sets.map((s) => s.kg));
    out.push({
      date: w.date,
      sets,
      rir: wes.find((e) => e.rir !== undefined)?.rir,
      topKg,
      working: sets.filter((s) => s.kg === topKg),
      best1RM: Math.max(...sets.map(estimate1RM)),
    });
  }
  return out;
}

// ---------- Sonraki antrenman önerisi ----------

export type RecKind = 'start' | 'increase' | 'reps' | 'hold' | 'reduce' | 'reset';

export interface Recommendation {
  kind: RecKind;
  /** Önerilen setler; 'start' için boş. */
  sets: SetEntry[];
  /** Kısa başlık, ör. "82,5 kg × 6, 6, 6". */
  title: string;
  /** Neden bu öneri. */
  reason: string;
  range: [number, number];
  /** Başlıktaki birim. */
  unit: Unit;
}

const fmt = (n: number) => n.toLocaleString('tr-TR', { maximumFractionDigits: 2 });

/** Setler seçilen birimdeki değerlerle gelir. */
function title(sets: SetEntry[], unit: Unit) {
  if (!sets.length) return '';
  const kgs = new Set(sets.map((s) => s.kg));
  if (kgs.size === 1) {
    const kg = sets[0].kg;
    return `${kg ? `${fmt(kg)} ${unit}` : 'Vücut ağırlığı'} × ${sets.map((s) => s.reps).join(', ')}`;
  }
  return `${sets.map((s) => `${fmt(s.kg)}×${s.reps}`).join(', ')} ${unit}`;
}

/** Seansı seçilen birime çevirir (lb'de hesaplar 5 lb adımlarla yapılır). */
function sessionIn(s: Session, unit: Unit): Session {
  if (unit === 'kg') return s;
  const c = (e: SetEntry) => ({ kg: roundIn(toUnit(e.kg, unit), unit), reps: e.reps });
  return { ...s, sets: s.sets.map(c), working: s.working.map(c), topKg: roundIn(toUnit(s.topKg, unit), unit), best1RM: toUnit(s.best1RM, unit) };
}

/**
 * Sonraki antrenman önerisi. unit: hareketin girildiği birim; adımlar ve başlık
 * bu birimde, dönen setler her zaman kg'dir.
 */
export function recommend(ex: Exercise, workouts: Workout[], date: string, unit: Unit = 'kg'): Recommendation {
  const range = repRange(ex);
  const [lo, hi] = range;
  const hist = sessionsFor(workouts, ex.id, date).map((s) => sessionIn(s, unit));
  const compound = isCompound(ex);

  if (!hist.length) {
    return {
      kind: 'start',
      sets: [],
      title: 'İlk seferin',
      unit,
      reason: `${lo}–${hi} tekrar yapabileceğin, son sette ${compound ? '1–3' : '0–2'} tekrar yedekte kalacak bir ağırlıkla başla.`,
      range,
    };
  }

  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  const setCount = Math.max(1, Math.min(last.sets.length, Math.max(last.working.length, 2)));
  const kg = last.topKg;
  const step = unit === 'lb' ? 5 : weightStep(ex);
  const working = last.working;
  const make = (k: number, reps: number[]): SetEntry[] => reps.map((r) => ({ kg: k, reps: r }));
  const pad = (reps: number[]) => {
    const r = [...reps];
    while (r.length < setCount) r.push(r[r.length - 1] ?? lo);
    return r.slice(0, setCount);
  };
  const done = (k: RecKind, sets: SetEntry[], reason: string): Recommendation => ({
    kind: k,
    sets: sets.map((x) => ({ kg: fromUnit(x.kg, unit), reps: x.reps })),
    title: title(sets, unit),
    unit,
    reason,
    range,
  });

  // Kural 2: temel harekette tam tükeniş (0 RIR) → yükü artırma, kaliteyi koru.
  if (compound && last.rir === 0) {
    return done(
      'hold',
      make(kg, pad(working.map((s) => clamp(s.reps, lo, hi)))),
      'Son sette tükenişe gittin (0 RIR). Temel hareketlerde setleri 1–3 tekrar yedekte bitir; aynı ağırlıkta kaliteli tekrarlarla devam et.',
    );
  }

  // Durgunluk: son 3 seansta en iyi tahmini 1RM, öncekini geçemediyse.
  if (hist.length >= 4) {
    const before = Math.max(...hist.slice(0, -3).map((h) => h.best1RM));
    const recent = Math.max(...hist.slice(-3).map((h) => h.best1RM));
    if (recent <= before) {
      const newKg = Math.max(step, roundTo(kg * 0.9, step));
      return done(
        'reset',
        make(kg ? newKg : 0, Array(setCount).fill(hi - 1 > lo ? hi - 2 : lo)),
        `Son 3 antrenmanda tahmini 1RM ilerlemedi. Ağırlığı yaklaşık %10 düşürüp aralığın üstünden yeniden tırman; yorgunluk birikmişse deload haftası düşün.`,
      );
    }
  }

  const easy = last.rir !== undefined && last.rir >= 4;

  // Kural 1: tüm çalışma setleri üst sınırda → ağırlığı artır, tekrarı alt sınıra çek.
  if (working.length && working.every((s) => s.reps >= hi)) {
    if (kg === 0) {
      return done(
        'increase',
        make(step, Array(setCount).fill(lo)),
        `Tüm setlerde ${hi} tekrara ulaştın. Ek ağırlık (≈${fmt(step)} ${unit}) takıp ${lo} tekrardan yeniden başla.`,
      );
    }
    const pct = increasePct(ex) * (easy ? 2 : 1);
    const newKg = Math.max(kg + step, roundTo(kg * (1 + pct), step));
    return done(
      'increase',
      make(newKg, Array(setCount).fill(lo)),
      `Tüm setlerde aralığın üst sınırına (${hi}) ulaştın. Ağırlığı %${fmt(round1(((newKg - kg) / kg) * 100))} artır, tekrarı ${lo}'a çek (çift ilerleme).`,
    );
  }

  // Aralığın altında: iki seans üst üste altta kaldıysa ağırlığı biraz düşür.
  const below = working.some((s) => s.reps < lo);
  if (below) {
    const prevBelow = prev && prev.topKg === kg && prev.working.some((s) => s.reps < lo);
    if (prevBelow && kg > 0) {
      const newKg = Math.max(step, roundTo(kg * 0.95, step));
      return done(
        'reduce',
        make(newKg, Array(setCount).fill(lo)),
        `İki antrenmandır ${lo} tekrarın altında kalıyorsun. Ağırlığı ~%5 düşür ve tüm setlerde ${lo}+ tekrar yap.`,
      );
    }
    return done(
      'hold',
      make(kg, pad(working.map((s) => Math.max(lo, s.reps)))),
      `Bazı setler hedef aralığın (${lo}–${hi}) altında. Aynı ağırlıkta her sette en az ${lo} tekrara ulaşmayı hedefle.`,
    );
  }

  // Aralık içinde: aynı ağırlık, tekrar ekle (önce en düşük setlere).
  const add = easy ? 2 : 1;
  const reps = pad(working.map((s) => Math.min(hi, s.reps + add)));
  return done(
    'reps',
    make(kg, reps),
    easy
      ? `Son set çok kolaydı (4+ RIR). Aynı ağırlıkta 2 tekrar ekle; ${hi} tekrara ulaşınca ağırlık artacak.`
      : `Aynı ağırlıkta setlere 1 tekrar ekle. Tüm setler ${hi} tekrara ulaşınca ağırlığı artıracağız.`,
  );
}

// ---------- Hareket skoru ----------

export interface ExerciseScore {
  score: number;
  /** 0–50: tahmini 1RM eğilimi. */
  progression: number;
  /** 0–25: düzenlilik. */
  consistency: number;
  /** 0–25: setlerin hedef tekrar aralığında olma oranı. */
  inRange: number;
  /** Penceredeki tahmini 1RM değişimi (%). */
  change: number;
  sessions: number;
}

const WINDOW_DAYS = 42;

export function exerciseScore(ex: Exercise, workouts: Workout[], today: string): ExerciseScore | null {
  const from = format(addDays(parseISO(today), -WINDOW_DAYS), 'yyyy-MM-dd');
  const hist = sessionsFor(workouts, ex.id).filter((h) => h.date > from && h.date <= today);
  if (hist.length < 2) return null;
  const k = hist.length >= 4 ? 2 : 1;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const first = avg(hist.slice(0, k).map((h) => h.best1RM));
  const last = avg(hist.slice(-k).map((h) => h.best1RM));
  const change = first > 0 ? (last - first) / first : 0;
  // Vücut ağırlığı hareketlerinde (1RM = 0) toplam tekrara bak.
  const repsChange =
    first === 0
      ? (avg(hist.slice(-k).map((h) => h.sets.reduce((n, s) => n + s.reps, 0))) /
          Math.max(1, avg(hist.slice(0, k).map((h) => h.sets.reduce((n, s) => n + s.reps, 0))))) -
        1
      : change;
  const progression = clamp(25 + repsChange * 500, 0, 50);
  const consistency = clamp(hist.length / 6, 0, 1) * 25;
  const [lo, hi] = repRange(ex);
  const work = hist.flatMap((h) => h.working);
  const inRange = (work.filter((s) => s.reps >= lo && s.reps <= hi).length / Math.max(1, work.length)) * 25;
  return {
    score: Math.round(progression + consistency + inRange),
    progression: Math.round(progression),
    consistency: Math.round(consistency),
    inRange: Math.round(inRange),
    change: round1(repsChange * 100),
    sessions: hist.length,
  };
}

// ---------- Program skoru ----------

export interface Insight {
  tone: 'good' | 'warn' | 'info';
  text: string;
}

export interface ProgramScore {
  score: number;
  parts: { key: string; label: string; value: number; max: number }[];
  insights: Insight[];
  /** Kas grubu başına haftalık ortalama set. */
  weekly: { group: string; sets: number; target: [number, number]; sessionsPerWeek: number }[];
  weeksSinceDeload: number;
}

export function programScore(
  exercises: Exercise[],
  workouts: Workout[],
  today: string,
  level: Level = 'intermediate',
): ProgramScore | null {
  const L = LEVELS[level];
  const byId = new Map(exercises.map((e) => [e.id, e]));
  const groupOf = (id: string) => byId.get(id)?.muscleGroup ?? 'Diğer';
  const WEEKS = 4;
  const from = format(addDays(parseISO(today), -WEEKS * 7), 'yyyy-MM-dd');
  const recent = workouts.filter((w) => w.date > from && w.date <= today);
  if (recent.length < 2) return null;

  const insights: Insight[] = [];

  // 1) İlerleme (35): hareket skorlarının ilerleme bileşeni.
  const scored = exercises
    .map((e) => ({ e, s: exerciseScore(e, workouts, today) }))
    .filter((x): x is { e: Exercise; s: ExerciseScore } => !!x.s);
  const progression = scored.length ? (scored.reduce((n, x) => n + x.s.progression, 0) / scored.length / 50) * 35 : 17.5;
  const improving = scored.filter((x) => x.s.change > 0).length;
  if (scored.length) {
    const stalled = scored.filter((x) => x.s.change <= 0).map((x) => x.e.name);
    if (improving === scored.length) insights.push({ tone: 'good', text: `Takip edilen ${scored.length} hareketin hepsi ilerliyor.` });
    else if (stalled.length)
      insights.push({
        tone: 'warn',
        text: `Son 6 haftada ilerlemeyen hareketler: ${stalled.slice(0, 4).join(', ')}${
          stalled.length > 4 ? ` ve ${stalled.length - 4} hareket daha` : ''
        }.`,
      });
  }

  // 2) Haftalık hacim (25) ve sıklık (15), kas grubu başına.
  const groups = new Map<string, { sets: number; days: Set<string> }>();
  // Seans tavanı (15): (seans, kas grubu) çiftlerinin 8 set altında kalma oranı.
  let pairs = 0;
  let pairsOk = 0;
  const overCap: string[] = [];
  for (const w of recent) {
    const perGroup = new Map<string, number>();
    for (const we of w.exercises) {
      const n = we.sets.filter((s) => s.reps > 0).length;
      if (!n) continue;
      const g = groupOf(we.exerciseId);
      perGroup.set(g, (perGroup.get(g) ?? 0) + n);
    }
    for (const [g, n] of perGroup) {
      const entry = groups.get(g) ?? { sets: 0, days: new Set<string>() };
      entry.sets += n;
      entry.days.add(w.date);
      groups.set(g, entry);
      pairs++;
      if (n <= SESSION_SET_CAP) pairsOk++;
      else overCap.push(`${g} (${n} set)`);
    }
  }
  const weekly = [...groups.entries()]
    .map(([group, v]) => ({
      group,
      sets: round1(v.sets / WEEKS),
      target: L.weeklySets,
      sessionsPerWeek: round1(v.days.size / WEEKS),
    }))
    .sort((a, b) => b.sets - a.sets);
  const [wLo, wHi] = L.weeklySets;
  const volFit = weekly.map((g) => (g.sets < wLo ? g.sets / wLo : g.sets > wHi ? clamp(1 - (g.sets - wHi) / wHi, 0, 1) : 1));
  const volume = (volFit.reduce((a, b) => a + b, 0) / Math.max(1, volFit.length)) * 25;
  const low = weekly.filter((g) => g.sets < wLo).map((g) => `${g.group} ${fmt(g.sets)} set`);
  const high = weekly.filter((g) => g.sets > wHi).map((g) => `${g.group} ${fmt(g.sets)} set`);
  if (low.length) insights.push({ tone: 'warn', text: `Haftalık hacmi ${wLo} setin altında kalan gruplar: ${low.join(', ')}.` });
  if (high.length) insights.push({ tone: 'warn', text: `Haftalık ${wHi} seti aşan gruplar: ${high.join(', ')}. Fazlası toparlanmayı zorlar.` });

  const freqOk = weekly.filter((g) => g.sessionsPerWeek >= 1.75).length;
  const frequency = (freqOk / Math.max(1, weekly.length)) * 15;
  const rare = weekly.filter((g) => g.sessionsPerWeek < 1.75).map((g) => g.group);
  if (rare.length)
    insights.push({ tone: 'info', text: `Haftada 2 kez çalışılmayan gruplar: ${rare.join(', ')}. Hacmi 2–3 seansa bölmek daha verimli.` });

  const sessionCap = (pairsOk / Math.max(1, pairs)) * 15;
  if (overCap.length)
    insights.push({
      tone: 'warn',
      text: `Tek seansta ${SESSION_SET_CAP} seti aşan kas grubu: ${[...new Set(overCap)].slice(0, 3).join(', ')}. Fazla setler "çöp hacim" olur.`,
    });

  // 3) Toparlanma / deload (10).
  const weeksSinceDeload = consecutiveLoadedWeeks(workouts, today);
  const [, dHi] = L.deloadEvery;
  const recovery = weeksSinceDeload <= dHi ? 10 : clamp(10 - (weeksSinceDeload - dHi) * 3, 0, 10);
  if (weeksSinceDeload >= L.deloadEvery[0])
    insights.push({
      tone: 'warn',
      text: `${weeksSinceDeload} haftadır ara vermeden yükleniyorsun. Önümüzdeki hafta set sayısını ~%50 azaltarak deload yap.`,
    });

  // Kural 2: temel hareketlerde 0 RIR.
  const failures = recent.flatMap((w) =>
    w.exercises.filter((we) => we.rir === 0 && byId.get(we.exerciseId) && isCompound(byId.get(we.exerciseId)!)),
  );
  if (failures.length)
    insights.push({
      tone: 'info',
      text: `Temel hareketlerde ${failures.length} kez tükenişe gittin. Bunlarda 1–3 RIR yeterli; 0 RIR'ı izolasyon hareketlerine bırak.`,
    });

  const parts = [
    { key: 'progression', label: 'İlerleme', value: Math.round(progression), max: 35 },
    { key: 'volume', label: 'Haftalık hacim', value: Math.round(volume), max: 25 },
    { key: 'frequency', label: 'Sıklık', value: Math.round(frequency), max: 15 },
    { key: 'cap', label: 'Seans hacmi', value: Math.round(sessionCap), max: 15 },
    { key: 'recovery', label: 'Toparlanma', value: Math.round(recovery), max: 10 },
  ];
  const score = parts.reduce((n, p) => n + p.value, 0);
  if (!insights.length) insights.push({ tone: 'good', text: 'Program kurallara uygun ilerliyor. Böyle devam.' });
  return { score, parts, insights, weekly, weeksSinceDeload };
}

/**
 * Son hafif haftadan (hiç antrenman yok ya da set sayısı önceki haftaların
 * medyanının %60'ının altında) bu yana geçen yüklenme haftası sayısı.
 */
export function consecutiveLoadedWeeks(workouts: Workout[], today: string): number {
  const weekKey = (d: string) => format(startOfISOWeek(parseISO(d)), 'yyyy-MM-dd');
  const sets = new Map<string, number>();
  for (const w of workouts) {
    if (w.date > today) continue;
    const n = w.exercises.reduce((m, we) => m + we.sets.filter((s) => s.reps > 0).length, 0);
    sets.set(weekKey(w.date), (sets.get(weekKey(w.date)) ?? 0) + n);
  }
  if (!sets.size) return 0;
  const first = [...sets.keys()].sort()[0];
  const weeks: number[] = [];
  for (let d = parseISO(weekKey(today)); format(d, 'yyyy-MM-dd') >= first; d = addDays(d, -7))
    weeks.push(sets.get(format(d, 'yyyy-MM-dd')) ?? 0);
  // weeks[0] = bu hafta (henüz bitmemiş olabilir).
  let count = 0;
  for (let i = 0; i < weeks.length; i++) {
    const prior = weeks.slice(i + 1, i + 5).filter((n) => n > 0).sort((a, b) => a - b);
    const median = prior.length ? prior[Math.floor(prior.length / 2)] : weeks[i];
    const light = weeks[i] === 0 || weeks[i] < median * 0.6;
    if (light) {
      if (i === 0) continue; // bu hafta henüz yarım olabilir
      break;
    }
    count++;
  }
  return count;
}

export const daysBetween = (a: string, b: string) => differenceInCalendarDays(parseISO(b), parseISO(a));
