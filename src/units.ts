/**
 * Ağırlık birimleri. Tüm ağırlıklar kg olarak saklanır; lb ile girilen setler
 * kayıtta kg'ye çevrilir, ekranda seçilen birime göre gösterilir.
 */
import type { Unit, Workout } from './types';
import { sortByDateAsc } from './stats';

export const LB_IN_KG = 0.45359237;

export const toUnit = (kg: number, u: Unit) => (u === 'lb' ? kg / LB_IN_KG : kg);
export const fromUnit = (v: number, u: Unit) => (u === 'lb' ? v * LB_IN_KG : v);
export const round2 = (n: number) => Math.round(n * 100) / 100;
/** Birimdeki yuvarlama: kg 0,01 (küçük plakalar), lb 0,1. */
export const roundIn = (v: number, u: Unit) => (u === 'lb' ? Math.round(v * 10) / 10 : round2(v));

/** Kutuya yazılacak değer (birimde yuvarlanmış). */
export const draftValue = (kg: number, u: Unit) => String(roundIn(toUnit(kg, u), u));

/** Ekranda gösterim: 1 ondalık, Türkçe ayraç. */
export const formatW = (kg: number, u: Unit) =>
  toUnit(kg, u).toLocaleString('tr-TR', { maximumFractionDigits: 1 });

/** Bir hareketin en son hangi birimle girildiği; hiç yoksa tercih edilen birim. */
export function entryUnit(workouts: Workout[], exerciseId: string, beforeDate: string, fallback: Unit): Unit {
  const prev = sortByDateAsc(workouts)
    .filter((w) => w.date < beforeDate)
    .reverse()
    .find((w) => w.exercises.some((we) => we.exerciseId === exerciseId && we.sets.length));
  if (!prev) return fallback;
  return prev.exercises.find((we) => we.exerciseId === exerciseId)?.unit ?? 'kg';
}
