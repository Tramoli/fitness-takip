import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppData } from '../types';
import { formatKg, workoutVolume } from '../stats';
import { exerciseName } from '../format';
import { groupColor } from '../exercises';
import { IconChevronLeft, IconChevronRight } from '../icons';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

interface Props {
  data: AppData;
  selected: string;
  onPick: (date: string) => void;
}

export default function CalendarView({ data, selected, onPick }: Props) {
  const [month, setMonth] = useState(() => startOfMonth(parseISO(selected)));
  const byDate = useMemo(() => new Map(data.workouts.map((w) => [w.date, w])), [data.workouts]);
  /** Günün en çok set yapılan kas grubu → plaka rengi. */
  const plateFor = useMemo(() => {
    const groupOf = new Map(data.exercises.map((e) => [e.id, e.muscleGroup]));
    return (date: string) => {
      const w = byDate.get(date);
      if (!w) return undefined;
      const count = new Map<string, number>();
      for (const we of w.exercises) {
        const g = groupOf.get(we.exerciseId) ?? '';
        count.set(g, (count.get(g) ?? 0) + we.sets.length);
      }
      const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
      return groupColor(top);
    };
  }, [data.exercises, byDate]);
  const today = format(new Date(), 'yyyy-MM-dd');

  const days = eachDayOfInterval({
    start: startOfWeek(month, { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });

  const monthWorkouts = data.workouts.filter((w) => isSameMonth(parseISO(w.date), month));
  const monthVolume = monthWorkouts.reduce((n, w) => n + workoutVolume(w), 0);

  return (
    <section className="page">
      <div className="cal-head">
        <h1 className="page-title">{format(month, 'MMMM', { locale: tr })} <span className="muted">{format(month, 'yyyy')}</span></h1>
        <div className="lift-tools">
          <button className="ghost-icon" onClick={() => setMonth((m) => addMonths(m, -1))} aria-label="Önceki ay">
            <IconChevronLeft />
          </button>
          <button className="ghost-icon" onClick={() => setMonth((m) => addMonths(m, 1))} aria-label="Sonraki ay">
            <IconChevronRight />
          </button>
        </div>
      </div>
      <div className="panel">
        <div className="cal-grid">
          {WEEKDAYS.map((d) => (
            <div className="cal-wd" key={d}>
              {d}
            </div>
          ))}
          {days.map((d) => {
            const key = format(d, 'yyyy-MM-dd');
            const w = byDate.get(key);
            const cls = [
              'cal-day',
              isSameMonth(d, month) ? '' : 'other',
              w ? 'has' : '',
              key === today ? 'today' : '',
            ].join(' ');
            const title = w
              ? w.exercises.map((e) => exerciseName(data, e.exerciseId)).join(', ')
              : 'Antrenman ekle';
            return (
              <button
                key={key}
                className={cls}
                onClick={() => onPick(key)}
                title={title}
                style={w ? { ['--plate' as string]: plateFor(key) } : undefined}
              >
                <span>{format(d, 'd')}</span>
              </button>
            );
          })}
        </div>
        <dl className="records">
          <div>
            <dt>Bu ay antrenman</dt>
            <dd>{monthWorkouts.length}</dd>
          </div>
          <div>
            <dt>Bu ay hacim</dt>
            <dd>{formatKg(monthVolume)} kg</dd>
          </div>
        </dl>
        <ul className="legend">
          <li style={{ ['--plate' as string]: 'var(--plate-red)' }}>Göğüs</li>
          <li style={{ ['--plate' as string]: 'var(--plate-blue)' }}>Sırt</li>
          <li style={{ ['--plate' as string]: 'var(--plate-yellow)' }}>Bacak</li>
          <li style={{ ['--plate' as string]: 'var(--plate-green)' }}>Omuz</li>
          <li style={{ ['--plate' as string]: 'var(--plate-grey)' }}>Kol</li>
          <li style={{ ['--plate' as string]: 'var(--plate-black)' }}>Karın, diğer</li>
        </ul>
      </div>
    </section>
  );
}
