import { useState } from 'react';
import type { AppData, Exercise, Template, TemplateExercise } from '../types';
import { newId } from '../store';
import { groupColor } from '../exercises';
import ExerciseSearch from '../ExerciseSearch';
import BodyMap from '../BodyMap';
import { emgCoverage, effectiveSets, sessionZone, templateLoad, type MuscleLoad } from '../muscles';

const SESSION_LEGEND = [
  { zone: 'low' as const, text: '2 setten az' },
  { zone: 'mid' as const, text: '2–4' },
  { zone: 'good' as const, text: '4–8 (etkili)' },
  { zone: 'over' as const, text: '8 üstü (fazla)' },
];

/** Programın kas aktivasyonu: harita + ölçüm kapsamı notu. */
function ProgramMap({ load, ids, compact }: { load: MuscleLoad; ids: string[]; compact?: boolean }) {
  const cov = emgCoverage(ids);
  return (
    <div className="program-map">
      <BodyMap load={load} zoneOf={sessionZone} legend={SESSION_LEGEND} scaleMax={10} compact={compact} />
      {!compact && (
        <p className="bm-note">
          Renk, bir seansta o kasa düşen etkili set sayısını gösterir (set × kas aktivasyonu). Seans başına 6–8 set
          tavanı aşılırsa kas taranır. {cov.total > 0 && `${cov.total} hareketin ${cov.emg} tanesi sEMG ölçümlerine dayanıyor, diğerleri benzer hareketlerden tahmin.`}
        </p>
      )}
    </div>
  );
}
import { IconDown, IconEdit, IconMinus, IconPlay, IconPlus, IconTrash, IconUp } from '../icons';

interface Props {
  data: AppData;
  saveTemplate: (t: Template) => void;
  deleteTemplate: (id: string) => void;
  addExercise: (name: string, muscleGroup?: string) => Exercise;
  onStart: (t: Template) => void;
}

export default function Programs({ data, saveTemplate, deleteTemplate, addExercise, onStart }: Props) {
  const [editing, setEditing] = useState<Template | null>(null);
  const exById = new Map(data.exercises.map((e) => [e.id, e]));

  if (editing) {
    return (
      <Editor
        key={editing.id}
        initial={editing}
        data={data}
        addExercise={addExercise}
        onCancel={() => setEditing(null)}
        onSave={(t) => {
          saveTemplate(t);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <section className="page">
      <div className="cal-head">
        <h1 className="page-title">Programlar</h1>
        <button className="btn" onClick={() => setEditing({ id: newId(), name: '', exercises: [] })}>
          <IconPlus width={18} height={18} /> Yeni program
        </button>
      </div>

      {data.templates.length === 0 && (
        <div className="empty">
          <p className="empty-title">Henüz program yok</p>
          <p className="muted">
            Sık yaptığın antrenmanı bir kez program olarak kaydet; sonraki seferlerde tek dokunuşla başla. Hareketler son
            seferki ağırlıklarınla dolu gelir.
          </p>
        </div>
      )}

      {data.templates.map((t) => (
        <article className="program" key={t.id}>
          <header className="lift-head">
            <h2 className="program-name">{t.name}</h2>
            <div className="lift-tools">
              <button className="ghost-icon sm" onClick={() => setEditing(t)} aria-label={`${t.name} programını düzenle`}>
                <IconEdit width={18} height={18} />
              </button>
              <button
                className="ghost-icon sm danger"
                onClick={() => confirm(`“${t.name}” programı silinsin mi? Kayıtlı antrenmanların etkilenmez.`) && deleteTemplate(t.id)}
                aria-label={`${t.name} programını sil`}
              >
                <IconTrash width={18} height={18} />
              </button>
            </div>
          </header>
          <ul className="program-list">
            {t.exercises.map((te, i) => {
              const ex = exById.get(te.exerciseId);
              return (
                <li key={i} style={{ ['--plate' as string]: groupColor(ex?.muscleGroup) }}>
                  <span className="plate-dot" aria-hidden />
                  <span className="program-ex">{ex?.name ?? 'Silinmiş hareket'}</span>
                  <span className="program-target">
                    {te.sets}×{te.reps ?? '–'}
                  </span>
                </li>
              );
            })}
          </ul>
          <ProgramMap load={templateLoad(t, data.exercises)} ids={t.exercises.map((e) => e.exerciseId)} compact />
          <button className="btn full" onClick={() => onStart(t)}>
            <IconPlay width={18} height={18} /> Bugün başlat
          </button>
        </article>
      ))}
    </section>
  );
}

/** − [sayı] + : hem dokunarak hem yazarak değiştirilebilen sayı alanı. */
function Stepper({
  value,
  min,
  max,
  unit,
  label,
  allowEmpty,
  emptyStart = min,
  onChange,
}: {
  value?: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  allowEmpty?: boolean;
  emptyStart?: number;
  onChange: (v: number | undefined) => void;
}) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  // Dışarıdan (± ile) değişince kutuyu güncelle.
  const [last, setLast] = useState(value);
  if (value !== last) {
    setLast(value);
    setText(value === undefined ? '' : String(value));
  }
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const step = (d: number) => onChange(clamp(value === undefined ? emptyStart : value + d));

  return (
    <div className="stepper" role="group" aria-label={label}>
      <button
        className="ghost-icon sm"
        onClick={() => step(-1)}
        disabled={value !== undefined && value <= min}
        aria-label={`${label}: azalt`}
      >
        <IconMinus width={18} height={18} />
      </button>
      <label className="stepper-field">
        <input
          inputMode="numeric"
          value={text}
          placeholder="–"
          onFocus={(e) => e.target.select()}
          onChange={(e) => {
            const t = e.target.value.replace(/\D/g, '').slice(0, 2);
            setText(t);
            const n = parseInt(t, 10);
            if (n >= min && n <= max) onChange(n);
            else if (!t && allowEmpty) onChange(undefined);
          }}
          onBlur={() => setText(value === undefined ? '' : String(value))}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
          aria-label={label}
        />
        <span className="set-unit-inline">{unit}</span>
      </label>
      <button
        className="ghost-icon sm"
        onClick={() => step(1)}
        disabled={value !== undefined && value >= max}
        aria-label={`${label}: artır`}
      >
        <IconPlus width={18} height={18} />
      </button>
    </div>
  );
}

function Editor({
  initial,
  data,
  addExercise,
  onCancel,
  onSave,
}: {
  initial: Template;
  data: AppData;
  addExercise: (name: string, muscleGroup?: string) => Exercise;
  onCancel: () => void;
  onSave: (t: Template) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [rows, setRows] = useState<TemplateExercise[]>(initial.exercises);
  const exById = new Map(data.exercises.map((e) => [e.id, e]));
  const isNew = !data.templates.some((t) => t.id === initial.id);

  const update = (i: number, patch: Partial<TemplateExercise>) =>
    setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((rs) => {
      const j = i + dir;
      if (j < 0 || j >= rs.length) return rs;
      const copy = [...rs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  const add = (exerciseId: string) => setRows((rs) => [...rs, { exerciseId, sets: 3, reps: 10 }]);

  const canSave = name.trim() && rows.length > 0;

  return (
    <section className="page">
      <h1 className="page-title">{isNew ? 'Yeni program' : 'Programı düzenle'}</h1>

      <input
        className="program-title-input"
        placeholder="Program adı (ör. İtiş günü)"
        value={name}
        autoFocus={isNew}
        onChange={(e) => setName(e.target.value)}
        aria-label="Program adı"
      />

      {rows.length > 0 && (
        <ol className="editor-list">
          {rows.map((r, i) => {
            const ex = exById.get(r.exerciseId);
            return (
              <li key={`${r.exerciseId}-${i}`} className="lift" style={{ ['--plate' as string]: groupColor(ex?.muscleGroup) }}>
                <header className="lift-head">
                  <div className="lift-name">
                    <h3>{ex?.name ?? 'Silinmiş hareket'}</h3>
                    {ex?.muscleGroup && <span className="lift-group">{ex.muscleGroup}</span>}
                  </div>
                  <div className="lift-tools">
                    <button className="ghost-icon sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Yukarı taşı">
                      <IconUp width={18} height={18} />
                    </button>
                    <button
                      className="ghost-icon sm"
                      onClick={() => move(i, 1)}
                      disabled={i === rows.length - 1}
                      aria-label="Aşağı taşı"
                    >
                      <IconDown width={18} height={18} />
                    </button>
                    <button
                      className="ghost-icon sm danger"
                      onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                      aria-label="Hareketi çıkar"
                    >
                      <IconTrash width={18} height={18} />
                    </button>
                  </div>
                </header>
                <div className="target-row">
                  <Stepper
                    value={r.sets}
                    min={1}
                    max={20}
                    unit="set"
                    label="Set sayısı"
                    onChange={(v) => update(i, { sets: v ?? 1 })}
                  />
                  <span className="set-x" aria-hidden>
                    ×
                  </span>
                  <Stepper
                    value={r.reps}
                    min={1}
                    max={50}
                    unit="tekrar"
                    label="Hedef tekrar"
                    allowEmpty
                    emptyStart={10}
                    onChange={(v) => update(i, { reps: v })}
                  />
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <ExerciseSearch
        exercises={data.exercises}
        workouts={data.workouts}
        onPick={add}
        addExercise={addExercise}
        placeholder="Programa hareket ekle…"
      />

      {rows.length > 0 && (
        <section className="panel">
          <h2 className="chart-title">Kas aktivasyonu</h2>
          <ProgramMap
            load={effectiveSets(
              rows.map((r) => ({ exerciseId: r.exerciseId, sets: r.sets })),
              data.exercises,
            )}
            ids={rows.map((r) => r.exerciseId)}
          />
        </section>
      )}

      <p className="muted small">
        Programı başlattığında setler son seferki ağırlıklarınla dolar. Hedef tekrarı boş bırakırsan son seferki tekrarlar
        kullanılır.
      </p>

      <div className="row editor-actions">
        <button className="btn" disabled={!canSave} onClick={() => onSave({ id: initial.id, name: name.trim(), exercises: rows })}>
          Programı kaydet
        </button>
        <button className="btn ghost" onClick={onCancel}>
          Vazgeç
        </button>
      </div>
    </section>
  );
}
