import { describe, expect, it } from 'vitest';
import { consecutiveLoadedWeeks, exerciseScore, programScore, recommend, repRange } from './overload';
import type { Exercise, Workout } from './types';

const bench: Exercise = { id: 'bench-press', name: 'Bench Press', muscleGroup: 'Göğüs' };
const squat: Exercise = { id: 'squat', name: 'Back Squat', muscleGroup: 'Bacak (Ön)' };
const curl: Exercise = { id: 'db-curl', name: 'Dumbbell Curl', muscleGroup: 'Biceps' };
const pullup: Exercise = { id: 'pull-up', name: 'Barfiks (Pull-up)', muscleGroup: 'Sırt' };

const w = (date: string, exerciseId: string, sets: [number, number][], rir?: number): Workout => ({
  id: date + exerciseId,
  date,
  exercises: [{ exerciseId, sets: sets.map(([kg, reps]) => ({ kg, reps })), rir }],
});

describe('repRange', () => {
  it('temel hareket 6–10, izolasyon 8–12, özel aralık önceliklidir', () => {
    expect(repRange(bench)).toEqual([6, 10]);
    expect(repRange(curl)).toEqual([8, 12]);
    expect(repRange({ ...bench, repMin: 5, repMax: 8 })).toEqual([5, 8]);
  });
});

describe('recommend (çift ilerleme)', () => {
  it('geçmiş yoksa başlangıç önerisi', () => {
    expect(recommend(bench, [], '2026-11-15').kind).toBe('start');
  });

  it('aralık içinde: aynı ağırlık, +1 tekrar', () => {
    const r = recommend(bench, [w('2026-11-10', 'bench-press', [[80, 8], [80, 7], [80, 6]])], '2026-11-15');
    expect(r.kind).toBe('reps');
    expect(r.sets).toEqual([{ kg: 80, reps: 9 }, { kg: 80, reps: 8 }, { kg: 80, reps: 7 }]);
  });

  it('tüm setler üst sınırda: ağırlık %2,5 (en az 1 adım) artar, tekrar alt sınıra iner', () => {
    const r = recommend(bench, [w('2026-11-10', 'bench-press', [[80, 10], [80, 10], [80, 10]])], '2026-11-15');
    expect(r.kind).toBe('increase');
    expect(r.sets).toEqual([{ kg: 82.5, reps: 6 }, { kg: 82.5, reps: 6 }, { kg: 82.5, reps: 6 }]);
  });

  it('alt vücut temel harekette %5 artış', () => {
    const r = recommend(squat, [w('2026-11-10', 'squat', [[100, 10], [100, 10]])], '2026-11-15');
    expect(r.sets[0].kg).toBe(105);
  });

  it('dambılda 2 kg adım', () => {
    const r = recommend(curl, [w('2026-11-10', 'db-curl', [[14, 12], [14, 12]])], '2026-11-15');
    expect(r.sets[0]).toEqual({ kg: 16, reps: 8 });
  });

  it('temel harekette 0 RIR: ağırlık sabit kalır', () => {
    const r = recommend(bench, [w('2026-11-10', 'bench-press', [[80, 10], [80, 10]], 0)], '2026-11-15');
    expect(r.kind).toBe('hold');
    expect(r.sets[0].kg).toBe(80);
  });

  it('4+ RIR: 2 tekrar eklenir', () => {
    const r = recommend(bench, [w('2026-11-10', 'bench-press', [[80, 7], [80, 7]], 4)], '2026-11-15');
    expect(r.sets.map((s) => s.reps)).toEqual([9, 9]);
  });

  it('iki seans üst üste alt sınırın altında: ağırlık ~%5 düşer', () => {
    const r = recommend(
      bench,
      [w('2026-11-06', 'bench-press', [[90, 5], [90, 4]]), w('2026-11-10', 'bench-press', [[90, 5], [90, 4]])],
      '2026-11-15',
    );
    expect(r.kind).toBe('reduce');
    expect(r.sets[0]).toEqual({ kg: 85, reps: 6 });
  });

  it('3 seanstır ilerleme yoksa yeniden yükleme (reset)', () => {
    const hist = [
      w('2026-10-20', 'bench-press', [[80, 9], [80, 9]]),
      w('2026-10-27', 'bench-press', [[80, 8], [80, 8]]),
      w('2026-11-03', 'bench-press', [[80, 8], [80, 7]]),
      w('2026-11-10', 'bench-press', [[80, 8], [80, 8]]),
    ];
    const r = recommend(bench, hist, '2026-11-15');
    expect(r.kind).toBe('reset');
    expect(r.sets[0].kg).toBe(72.5);
  });

  it('vücut ağırlığı: üst sınırda ek ağırlık önerir', () => {
    const r = recommend(pullup, [w('2026-11-10', 'pull-up', [[0, 10], [0, 10]])], '2026-11-15');
    expect(r.kind).toBe('increase');
    expect(r.sets[0]).toEqual({ kg: 2.5, reps: 6 });
  });

  it('seçilen günün kendisi ve sonrası hesaba katılmaz', () => {
    const r = recommend(bench, [w('2026-11-15', 'bench-press', [[80, 10], [80, 10]])], '2026-11-15');
    expect(r.kind).toBe('start');
  });
});

describe('exerciseScore', () => {
  it('ilerleyen harekette yüksek skor', () => {
    const hist = [
      w('2026-10-06', 'bench-press', [[70, 8], [70, 8]]),
      w('2026-10-13', 'bench-press', [[72.5, 8], [72.5, 8]]),
      w('2026-10-20', 'bench-press', [[75, 8], [75, 8]]),
      w('2026-10-27', 'bench-press', [[77.5, 8], [77.5, 8]]),
      w('2026-11-03', 'bench-press', [[80, 8], [80, 8]]),
      w('2026-11-10', 'bench-press', [[82.5, 8], [82.5, 8]]),
    ];
    const s = exerciseScore(bench, hist, '2026-11-15')!;
    expect(s.change).toBeGreaterThan(5);
    expect(s.progression).toBe(50);
    expect(s.inRange).toBe(25);
    expect(s.score).toBe(100);
  });
  it('tek seans yeterli değil', () => {
    expect(exerciseScore(bench, [w('2026-11-10', 'bench-press', [[80, 8]])], '2026-11-15')).toBeNull();
  });
});

describe('programScore', () => {
  it('seans tavanını aşan grubu ve düşük hacmi raporlar', () => {
    const ws: Workout[] = [
      w('2026-11-03', 'bench-press', Array(10).fill([80, 8])),
      w('2026-11-10', 'bench-press', Array(10).fill([80, 8])),
    ];
    const p = programScore([bench], ws, '2026-11-15')!;
    expect(p.parts.find((x) => x.key === 'cap')!.value).toBe(0);
    expect(p.insights.some((i) => i.text.includes('8 seti aşan'))).toBe(true);
    expect(p.weekly[0]).toMatchObject({ group: 'Göğüs', sets: 5 });
  });
});

describe('consecutiveLoadedWeeks', () => {
  it('hafif haftadan sonra sayar', () => {
    const ws: Workout[] = [];
    // 6 hafta normal, 1 hafta hafif (2 set), sonra 3 hafta normal
    const weeks = ['2026-09-07', '2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05', '2026-10-12'];
    for (const d of weeks) ws.push(w(d, 'bench-press', Array(10).fill([80, 8])));
    ws.push(w('2026-10-19', 'bench-press', [[60, 8], [60, 8]]));
    for (const d of ['2026-10-26', '2026-11-02', '2026-11-09']) ws.push(w(d, 'bench-press', Array(10).fill([80, 8])));
    expect(consecutiveLoadedWeeks(ws, '2026-11-15')).toBe(3);
    expect(consecutiveLoadedWeeks(ws.slice(0, 6), '2026-10-18')).toBe(6);
  });
});
