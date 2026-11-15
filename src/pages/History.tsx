import { useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { AppData } from '../types';
import { exportData, parseData } from '../store';
import { groupColor } from '../exercises';
import { exerciseVolume, formatKg, sortByDateAsc, workoutVolume } from '../stats';
import { exerciseName, longDate } from '../format';
import { IconEdit, IconTrash } from '../icons';

interface Props {
  data: AppData;
  onEdit: (date: string) => void;
  onDelete: (id: string) => void;
  onReplaceAll: (d: AppData) => void;
}

export default function History({ data, onEdit, onDelete, onReplaceAll }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const workouts = sortByDateAsc(data.workouts).reverse();
  const groupOf = (id: string) => data.exercises.find((e) => e.id === id)?.muscleGroup;

  const onImport = async (file: File) => {
    try {
      const parsed = parseData(JSON.parse(await file.text()));
      if (
        !confirm(
          `${parsed.workouts.length} antrenman içe aktarılacak. Mevcut ${data.workouts.length} antrenmanın yerine geçecek. Devam edilsin mi?`,
        )
      )
        return;
      onReplaceAll(parsed);
    } catch (e) {
      alert(`Dosya okunamadı: ${(e as Error).message}`);
    }
  };

  return (
    <section className="page">
      <h1 className="page-title">Geçmiş</h1>
      {workouts.length === 0 && (
        <div className="empty">
          <p className="empty-title">Henüz kayıt yok</p>
          <p className="muted">Kaydet sekmesinden ilk antrenmanını gir; burada listelenecek.</p>
        </div>
      )}
      <div className="log-list">
        {workouts.map((w) => {
          const d = parseISO(w.date);
          const sets = w.exercises.reduce((n, e) => n + e.sets.length, 0);
          return (
            <article className="entry" key={w.id}>
              <div className="entry-date" aria-label={longDate(w.date)}>
                <span className="entry-day">{format(d, 'd')}</span>
                <span className="entry-mon">{format(d, 'MMM', { locale: tr })}</span>
                <span className="entry-wd">{format(d, 'EEE', { locale: tr })}</span>
              </div>
              <div className="entry-body">
                <header className="entry-head">
                  <p className="entry-stats">
                    <span>
                      <b>{formatKg(workoutVolume(w))}</b> kg
                    </span>
                    <span>
                      <b>{sets}</b> set
                    </span>
                  </p>
                  <div className="lift-tools">
                    <button className="ghost-icon sm" onClick={() => onEdit(w.date)} aria-label="Düzenle">
                      <IconEdit width={18} height={18} />
                    </button>
                    <button
                      className="ghost-icon sm danger"
                      aria-label="Antrenmanı sil"
                      onClick={() => confirm(`${longDate(w.date)} antrenmanı silinsin mi?`) && onDelete(w.id)}
                    >
                      <IconTrash width={18} height={18} />
                    </button>
                  </div>
                </header>
                <ul className="entry-lifts">
                  {w.exercises.map((we, i) => (
                    <li key={i} style={{ ['--plate' as string]: groupColor(groupOf(we.exerciseId)) }}>
                      <div className="entry-lift-head">
                        <span className="ex-name">{exerciseName(data, we.exerciseId)}</span>
                        <span className="muted small">{formatKg(exerciseVolume(we))} kg</span>
                      </div>
                      <span className="ex-sets">
                        {we.sets.map((s, j) => (
                          <span className="chip" key={j}>
                            {formatKg(s.kg)}×{s.reps}
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
                </ul>
                {w.note && <p className="note">{w.note}</p>}
              </div>
            </article>
          );
        })}
      </div>

      <section className="backup">
        <h2>Yedek</h2>
        <p className="muted">
          Kayıtların yalnızca bu tarayıcıda duruyor. Telefon değiştirmeden ya da tarayıcı verisini silmeden önce yedek al.
        </p>
        <div className="row">
          <button className="btn secondary" onClick={() => exportData(data)}>
            Yedeği indir
          </button>
          <button className="btn ghost" onClick={() => fileRef.current?.click()}>
            Yedekten geri yükle
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>
    </section>
  );
}
