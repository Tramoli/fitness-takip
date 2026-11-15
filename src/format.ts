import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppData } from './types';

export const longDate = (d: string) => format(parseISO(d), 'd MMMM yyyy, EEEE', { locale: tr });
export const shortDate = (d: string) => format(parseISO(d), 'd MMM', { locale: tr });
export const midDate = (d: string) => format(parseISO(d), 'd MMM yyyy', { locale: tr });

export function exerciseName(data: AppData, id: string) {
  return data.exercises.find((e) => e.id === id)?.name ?? 'Silinmiş hareket';
}
