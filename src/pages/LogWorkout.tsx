import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, eachDayOfInterval, endOfISOWeek, format, parseISO, startOfISOWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppData, Exercise, Workout } from '../types';
import { newId } from '../store';
import { GROUP_ORDER, groupColor } from '../exercises';
import { formatKg, lastSetsFor } from '../stats';
import { exerciseName, shortDate } from '../format';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconDown,
  IconMinus,
  IconPlus,
  IconSearch,
  IconTrash,
  IconUp,
} from '../icons';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  data: AppData;
  upsertWorkout: (w: Workout) => void;
  addExercise: (name: string, muscleGroup?: string) => Exercise;
}

interface DraftSet {
  kg: string;
  reps: string;
}
interface DraftExercise {
  key: string;
  exerciseId: string;
  sets: DraftSet[];
}

const toNum = (s: string) => {
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const NEW_EXERCISE = '__new__';

/** Türkçe karakterleri sadeleştirir: "Şınav" ve "sinav" eşleşsin. */
const normalize = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[-()]/g, ' ');

export default function LogWorkout({ date, onDateChange, data, upsertWorkout, addExercise }: Props) {
  const existing = data.workouts.find((w) => w.date === date);
  const [workoutId] = useState(() => existing?.id ?? newId());
  const [note, setNote] = useState(existing?.note ?? '');
  const [items, setItems] = useState<DraftExercise[]>(() =>
    (existing?.exercises ?? []).map((we) => ({
      key: newId(),
      exerciseId: we.exerciseId,
      sets: we.sets.map((s) => ({ kg: String(s.kg), reps: String(s.reps) })),
    })),
  );
  const [picker, setPicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [query, setQuery] = useState('');
  const focusRef = useRef<string | null>(null);

  // Her değişiklik otomatik kaydedilir.
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    upsertWorkout({
      id: workoutId,
      date,
      note: note.trim() || undefined,
      exercises: items.map((it) => ({
        exerciseId: it.exerciseId,
        sets: it.sets.map((s) => ({ kg: toNum(s.kg), reps: Math.round(toNum(s.reps)) })),
      })),
    });
  }, [items, note, date, workoutId, upsertWorkout]);

  useEffect(() => {
    if (!focusRef.current) return;
    const el = document.querySelector<HTMLInputElement>(`[data-focus="${focusRef.current}"]`);
    el?.focus();
    focusRef.current = null;
  });

  const exById = useMemo(() => new Map(data.exercises.map((e) => [e.id, e])), [data.exercises]);
  const datesWithWorkout = useMemo(() => new Set(data.workouts.map((w) => w.date)), [data.workouts]);

  const groups = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of [...data.exercises].sort((a, b) => a.name.localeCompare(b.name, 'tr'))) {
      const g = e.muscleGroup || 'Diğer';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(e);
    }
    const rank = (g: string) => {
      const i = GROUP_ORDER.indexOf(g);
      return i === -1 ? GROUP_ORDER.length : i;
    };
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0], 'tr'));
  }, [data.exercises]);

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const words = q.split(/\s+/);
    // Sıralama: adı aramayla başlayanlar, sonra en çok kullandıkların,
    // sonra listedeki sıra (varsayılan liste en yaygından aza doğru dizili).
    const usage = new Map<string, number>();
    for (const w of data.workouts)
      for (const we of w.exercises) usage.set(we.exerciseId, (usage.get(we.exerciseId) ?? 0) + 1);
    const order = new Map(data.exercises.map((e, i) => [e.id, i]));
    return data.exercises
      .filter((e) => {
        const hay = normalize(`${e.name} ${e.muscleGroup ?? ''}`);
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => {
        const sa = normalize(a.name).startsWith(q) ? 0 : 1;
        const sb = normalize(b.name).startsWith(q) ? 0 : 1;
        return (
          sa - sb ||
          (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) ||
          order.get(a.id)! - order.get(b.id)!
        );
      })
      .slice(0, 12);
  }, [query, data.exercises, data.workouts]);

  const knownGroups = useMemo(
    () => [...new Set(data.exercises.map((e) => e.muscleGroup).filter(Boolean))] as string[],
    [data.exercises],
  );

  const addItem = (exerciseId: string) => {
    const last = lastSetsFor(data.workouts, exerciseId, date);
    const first = last?.sets[0];
    const key = newId();
    focusRef.current = `${key}-0-kg`;
    setItems((xs) => [
      ...xs,
      { key, exerciseId, sets: [{ kg: first ? String(first.kg) : '', reps: first ? String(first.reps) : '' }] },
    ]);
    setPicker('');
    setQuery('');
  };

  const onPick = (value: string) => {
    if (value === NEW_EXERCISE) setPicker(NEW_EXERCISE);
    else if (value) addItem(value);
  };

  const createExercise = () => {
    const name = newName.trim();
    if (!name) return;
    const dup = data.exercises.find((e) => e.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
    const ex = dup ?? addExercise(name, newGroup.trim() || undefined);
    setNewName('');
    setNewGroup('');
    addItem(ex.id);
  };

  const updateSet = (key: string, i: number, field: keyof DraftSet, value: string) =>
    setItems((xs) =>
      xs.map((it) =>
        it.key === key ? { ...it, sets: it.sets.map((s, j) => (j === i ? { ...s, [field]: value } : s)) } : it,
      ),
    );

  const addSet = (key: string) =>
    setItems((xs) =>
      xs.map((it) => {
        if (it.key !== key) return it;
        const prev = it.sets[it.sets.length - 1] ?? { kg: '', reps: '' };
        focusRef.current = `${key}-${it.sets.length}-reps`;
        return { ...it, sets: [...it.sets, { ...prev }] };
      }),
    );

  const removeSet = (key: string, i: number) =>
    setItems((xs) => xs.map((it) => (it.key === key ? { ...it, sets: it.sets.filter((_, j) => j !== i) } : it)));

  const removeItem = (key: string) => {
    const it = items.find((x) => x.key === key);
    if (it && it.sets.some((s) => s.kg || s.reps) && !confirm(`${exerciseName(data, it.exerciseId)} silinsin mi?`)) return;
    setItems((xs) => xs.filter((x) => x.key !== key));
  };

  const move = (key: string, dir: -1 | 1) =>
    setItems((xs) => {
      const i = xs.findIndex((x) => x.key === key);
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });

  const d = parseISO(date);
  const shift = (days: number) => onDateChange(format(addDays(d, days), 'yyyy-MM-dd'));
  const today = format(new Date(), 'yyyy-MM-dd');
  const week = eachDayOfInterval({ start: startOfISOWeek(d), end: endOfISOWeek(d) });

  const totalSets = items.reduce((n, it) => n + it.sets.length, 0);
  const totalVolume = items.reduce(
    (n, it) => n + it.sets.reduce((m, s) => m + toNum(s.kg) * Math.round(toNum(s.reps)), 0),
    0,
  );

  return (
    <section className="page">
      <header className="day-hero">
        <div className="day-title">
          <span className="day-num">{format(d, 'd')}</span>
          <span className="day-meta">
            <span className="day-month">{format(d, 'MMMM yyyy', { locale: tr })}</span>
            <span className="day-weekday">
              {date === today ? 'Bugün' : format(d, 'EEEE', { locale: tr })}
            </span>
          </span>
          <label className="day-picker" title="Tarih seç">
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              aria-label="Tarih seç"
            />
          </label>
        </div>
        <div className="week-strip">
          <button className="ghost-icon" onClick={() => shift(-7)} aria-label="Önceki hafta">
            <IconChevronLeft />
          </button>
          {week.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const cls = ['wk-day', key === date ? 'sel' : '', key === today ? 'today' : '', datesWithWorkout.has(key) ? 'has' : '']
              .filter(Boolean)
              .join(' ');
            return (
              <button key={key} className={cls} onClick={() => onDateChange(key)} aria-label={key}>
                <span className="wk-name">{format(day, 'EEEEEE', { locale: tr })}</span>
                <span className="wk-num">{format(day, 'd')}</span>
              </button>
            );
          })}
          <button className="ghost-icon" onClick={() => shift(7)} aria-label="Sonraki hafta">
            <IconChevronRight />
          </button>
        </div>
      </header>

      {items.length > 0 && (
        <div className="totals">
          <div>
            <span className="num">{items.length}</span>
            <span className="unit">hareket</span>
          </div>
          <div>
            <span className="num">{totalSets}</span>
            <span className="unit">set</span>
          </div>
          <div>
            <span className="num">{formatKg(totalVolume)}</span>
            <span className="unit">kg</span>
          </div>
          <span className="saved" title="Değişiklikler otomatik kaydedilir">
            <IconCheck width={16} height={16} /> Kaydedildi
          </span>
        </div>
      )}

      {items.map((it, idx) => {
        const last = lastSetsFor(data.workouts, it.exerciseId, date);
        const ex = exById.get(it.exerciseId);
        return (
          <article className="lift" key={it.key} style={{ ['--plate' as string]: groupColor(ex?.muscleGroup) }}>
            <header className="lift-head">
              <div className="lift-name">
                <h3>{ex?.name ?? 'Silinmiş hareket'}</h3>
                {ex?.muscleGroup && <span className="lift-group">{ex.muscleGroup}</span>}
              </div>
              <div className="lift-tools">
                <button className="ghost-icon sm" onClick={() => move(it.key, -1)} disabled={idx === 0} aria-label="Yukarı taşı">
                  <IconUp width={18} height={18} />
                </button>
                <button
                  className="ghost-icon sm"
                  onClick={() => move(it.key, 1)}
                  disabled={idx === items.length - 1}
                  aria-label="Aşağı taşı"
                >
                  <IconDown width={18} height={18} />
                </button>
                <button className="ghost-icon sm danger" onClick={() => removeItem(it.key)} aria-label="Hareketi sil">
                  <IconTrash width={18} height={18} />
                </button>
              </div>
            </header>
            {last && (
              <p className="last-time">
                Son seferde, {shortDate(last.date)}:{' '}
                {last.sets.map((s, j) => (
                  <span key={j} className="last-set">
                    {formatKg(s.kg)}×{s.reps}
                  </span>
                ))}
              </p>
            )}
            <ol className="set-list">
              {it.sets.map((s, i) => (
                <li className="set" key={i}>
                  <span className="set-idx">{i + 1}</span>
                  <label className="set-field">
                    <input
                      inputMode="decimal"
                      placeholder="0"
                      value={s.kg}
                      data-focus={`${it.key}-${i}-kg`}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateSet(it.key, i, 'kg', e.target.value)}
                      aria-label={`Set ${i + 1} kg`}
                    />
                    <span className="set-unit">kg</span>
                  </label>
                  <span className="set-x" aria-hidden>
                    ×
                  </span>
                  <label className="set-field">
                    <input
                      inputMode="numeric"
                      placeholder="0"
                      value={s.reps}
                      data-focus={`${it.key}-${i}-reps`}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => updateSet(it.key, i, 'reps', e.target.value)}
                      aria-label={`Set ${i + 1} tekrar`}
                    />
                    <span className="set-unit">tekrar</span>
                  </label>
                  <button className="ghost-icon sm" onClick={() => removeSet(it.key, i)} aria-label={`Set ${i + 1} sil`}>
                    <IconMinus width={18} height={18} />
                  </button>
                </li>
              ))}
            </ol>
            <button className="add-set" onClick={() => addSet(it.key)}>
              <IconPlus width={18} height={18} /> Set ekle
            </button>
          </article>
        );
      })}

      {items.length === 0 && (
        <div className="empty">
          <p className="empty-title">Bugün ne çalıştın?</p>
          <p className="muted">İlk hareketi aşağıdan ara ya da listeden seç.</p>
        </div>
      )}

      <div className="adder">
        <label className="search">
          <IconSearch width={20} height={20} />
          <input
            type="search"
            placeholder="Hareket ekle: squat, curl, şınav…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && matches[0] && addItem(matches[0].id)}
            aria-label="Hareket ara"
          />
        </label>
        {query.trim() && (
          <div className="search-results">
            {matches.map((e) => (
              <button
                key={e.id}
                className="search-item"
                onClick={() => addItem(e.id)}
                style={{ ['--plate' as string]: groupColor(e.muscleGroup) }}
              >
                <span className="plate-dot" aria-hidden />
                <span className="search-name">{e.name}</span>
                <span className="muted small">{e.muscleGroup}</span>
              </button>
            ))}
            {matches.length === 0 && <p className="muted small">Eşleşen hareket yok.</p>}
            <button
              className="search-item create"
              onClick={() => {
                setNewName(query.trim());
                setQuery('');
                setPicker(NEW_EXERCISE);
              }}
            >
              <IconPlus width={18} height={18} /> “{query.trim()}” adında yeni hareket oluştur
            </button>
          </div>
        )}
        <select
          hidden={!!query.trim()}
          value={picker === NEW_EXERCISE ? NEW_EXERCISE : ''}
          onChange={(e) => onPick(e.target.value)}
          aria-label="Listeden hareket seç"
        >
          <option value="">Listeden seç</option>
          {groups.map(([g, exs]) => (
            <optgroup key={g} label={g}>
              {exs.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </optgroup>
          ))}
          <option value={NEW_EXERCISE}>+ Yeni hareket oluştur</option>
        </select>
        {picker === NEW_EXERCISE && (
          <div className="new-exercise">
            <input
              placeholder="Hareket adı (ör. Hip Thrust)"
              value={newName}
              autoFocus
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createExercise()}
            />
            <input
              placeholder="Kas grubu (isteğe bağlı)"
              list="muscle-groups"
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createExercise()}
            />
            <datalist id="muscle-groups">
              {knownGroups.map((g) => (
                <option key={g} value={g} />
              ))}
            </datalist>
            <div className="row">
              <button className="btn" onClick={createExercise} disabled={!newName.trim()}>
                Hareketi ekle
              </button>
              <button className="btn ghost" onClick={() => setPicker('')}>
                Vazgeç
              </button>
            </div>
          </div>
        )}
      </div>

      <label className="note-field">
        <span>Not</span>
        <textarea
          rows={2}
          placeholder="Uyku, enerji, ağrı…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
    </section>
  );
}
