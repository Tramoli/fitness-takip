import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, eachDayOfInterval, endOfISOWeek, format, parseISO, startOfISOWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppData, Exercise, Template, Workout } from '../types';
import { newId } from '../store';
import { GROUP_ORDER, groupColor } from '../exercises';
import { formatKg, lastSetsFor } from '../stats';
import { exerciseName, shortDate } from '../format';
import {
  draftFromSets,
  draftFromTemplateExercise,
  recentWorkouts,
  templateFromWorkout,
  type DraftSet,
} from '../programs';
import ExerciseSearch from '../ExerciseSearch';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconDown,
  IconMinus,
  IconPlay,
  IconPlus,
  IconTrash,
  IconUp,
} from '../icons';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  data: AppData;
  upsertWorkout: (w: Workout) => void;
  addExercise: (name: string, muscleGroup?: string) => Exercise;
  saveTemplate: (t: Template) => void;
  /** Programlar sayfasından "Başlat" ile gelindiyse uygulanacak program. */
  startTemplate?: Template;
  onOpenPrograms: () => void;
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

export default function LogWorkout({
  date,
  onDateChange,
  data,
  upsertWorkout,
  addExercise,
  saveTemplate,
  startTemplate,
  onOpenPrograms,
}: Props) {
  const existing = data.workouts.find((w) => w.date === date);
  const [workoutId] = useState(() => existing?.id ?? newId());
  const [note, setNote] = useState(existing?.note ?? '');
  const [items, setItems] = useState<DraftExercise[]>(() => {
    const base = (existing?.exercises ?? []).map((we) => ({
      key: newId(),
      exerciseId: we.exerciseId,
      sets: draftFromSets(we.sets),
    }));
    const extra = (startTemplate?.exercises ?? []).map((te) => ({
      key: newId(),
      exerciseId: te.exerciseId,
      sets: draftFromTemplateExercise(te, data.workouts, date),
    }));
    return [...base, ...extra];
  });
  const [picker, setPicker] = useState('');
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');
  const [templateName, setTemplateName] = useState<string | null>(null);
  const [savedTemplate, setSavedTemplate] = useState('');
  const focusRef = useRef<string | null>(null);

  // Her değişiklik otomatik kaydedilir. Program uygulanarak açıldıysa ilk hâli de kaydedilir.
  const firstRun = useRef(!startTemplate);
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
  const recent = useMemo(() => recentWorkouts(data.workouts, date, 3), [data.workouts, date]);

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
  };

  const copyWorkout = (w: Workout) =>
    setItems((xs) => [
      ...xs,
      ...w.exercises.map((we) => ({ key: newId(), exerciseId: we.exerciseId, sets: draftFromSets(we.sets) })),
    ]);

  const applyTemplate = (t: Template) =>
    setItems((xs) => [
      ...xs,
      ...t.exercises.map((te) => ({
        key: newId(),
        exerciseId: te.exerciseId,
        sets: draftFromTemplateExercise(te, data.workouts, date),
      })),
    ]);

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

  const saveAsTemplate = () => {
    const name = templateName?.trim();
    if (!name) return;
    const exercises = items.map((it) => ({
      exerciseId: it.exerciseId,
      sets: it.sets.map((s) => ({ kg: toNum(s.kg), reps: Math.round(toNum(s.reps)) })),
    }));
    saveTemplate(templateFromWorkout(name, newId(), exercises));
    setTemplateName(null);
    setSavedTemplate(name);
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

  const names = (ids: string[]) => {
    const list = ids.map((id) => exById.get(id)?.name ?? 'Silinmiş hareket');
    return list.length > 3 ? `${list.slice(0, 3).join(', ')} +${list.length - 3}` : list.join(', ');
  };

  const whenLabel = (w: Workout) => {
    const days = differenceInCalendarDays(d, parseISO(w.date));
    if (days === 7) return 'Geçen hafta bugün';
    if (days === 1) return 'Dün';
    return format(parseISO(w.date), 'd MMMM, EEEE', { locale: tr });
  };

  return (
    <section className="page">
      <header className="day-hero">
        <div className="day-title">
          <span className="day-num">{format(d, 'd')}</span>
          <span className="day-meta">
            <span className="day-month">{format(d, 'MMMM yyyy', { locale: tr })}</span>
            <span className="day-weekday">{date === today ? 'Bugün' : format(d, 'EEEE', { locale: tr })}</span>
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
            const cls = [
              'wk-day',
              key === date ? 'sel' : '',
              key === today ? 'today' : '',
              datesWithWorkout.has(key) ? 'has' : '',
            ]
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

      {items.length === 0 && (
        <div className="quick-start">
          {data.templates.length > 0 && (
            <section className="qs-block">
              <h2 className="qs-title">Programla başla</h2>
              <div className="qs-list">
                {data.templates.map((t) => (
                  <button key={t.id} className="qs-item" onClick={() => applyTemplate(t)}>
                    <span className="qs-icon">
                      <IconPlay width={18} height={18} />
                    </span>
                    <span className="qs-text">
                      <span className="qs-name">{t.name}</span>
                      <span className="qs-sub">{names(t.exercises.map((e) => e.exerciseId))}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {recent.length > 0 && (
            <section className="qs-block">
              <h2 className="qs-title">Önceki antrenmanı tekrarla</h2>
              <div className="qs-list">
                {recent.map((w) => (
                  <button key={w.id} className="qs-item" onClick={() => copyWorkout(w)}>
                    <span className="qs-icon">
                      <IconCopy width={18} height={18} />
                    </span>
                    <span className="qs-text">
                      <span className="qs-name">{whenLabel(w)}</span>
                      <span className="qs-sub">{names(w.exercises.map((e) => e.exerciseId))}</span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {data.templates.length === 0 && recent.length === 0 && (
            <div className="empty">
              <p className="empty-title">Bugün ne çalıştın?</p>
              <p className="muted">İlk hareketi aşağıdan ara ya da listeden seç.</p>
            </div>
          )}

          {data.templates.length === 0 && (
            <button className="link-btn" onClick={onOpenPrograms}>
              Sık yaptığın antrenmanları program olarak kaydet
            </button>
          )}
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

      <ExerciseSearch
        exercises={data.exercises}
        workouts={data.workouts}
        onPick={addItem}
        onCreate={(name) => {
          setNewName(name);
          setPicker(NEW_EXERCISE);
        }}
      >
        <select
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
      </ExerciseSearch>

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

      {items.length > 0 &&
        (templateName === null ? (
          <div className="save-template">
            <button className="link-btn" onClick={() => setTemplateName('')}>
              Bu antrenmanı program olarak kaydet
            </button>
            {savedTemplate && (
              <span className="saved">
                <IconCheck width={16} height={16} /> “{savedTemplate}” kaydedildi
              </span>
            )}
          </div>
        ) : (
          <div className="new-exercise">
            <input
              placeholder="Program adı (ör. İtiş günü)"
              value={templateName}
              autoFocus
              onChange={(e) => setTemplateName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveAsTemplate()}
              aria-label="Program adı"
            />
            <div className="row">
              <button className="btn" onClick={saveAsTemplate} disabled={!templateName.trim()}>
                Programı kaydet
              </button>
              <button className="btn ghost" onClick={() => setTemplateName(null)}>
                Vazgeç
              </button>
            </div>
          </div>
        ))}

      <label className="note-field">
        <span>Not</span>
        <textarea rows={2} placeholder="Uyku, enerji, ağrı…" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>
    </section>
  );
}
