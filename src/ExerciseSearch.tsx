import { useMemo, useState } from 'react';
import type { Exercise, Workout } from './types';
import { GROUP_ORDER, groupColor } from './exercises';
import { IconPlus, IconSearch } from './icons';

/** Türkçe karakterleri sadeleştirir: "Şınav" ve "sinav" eşleşsin. */
export const normalize = (s: string) =>
  s
    .toLocaleLowerCase('tr')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[-()]/g, ' ');

const NEW_EXERCISE = '__new__';

interface Props {
  exercises: Exercise[];
  workouts: Workout[];
  onPick: (exerciseId: string) => void;
  addExercise: (name: string, muscleGroup?: string) => Exercise;
  placeholder?: string;
}

/**
 * Hareket ekleme: yazarak arama ya da kas grubuna göre gruplanmış listeden seçme.
 * Listede olmayan hareket buradan oluşturulup eklenir.
 */
export default function ExerciseSearch({ exercises, workouts, onPick, addExercise, placeholder }: Props) {
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState('');

  const matches = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    const words = q.split(/\s+/);
    // Sıralama: adı aramayla başlayanlar, sonra en çok kullandıkların,
    // sonra listedeki sıra (varsayılan liste en yaygından aza doğru dizili).
    const usage = new Map<string, number>();
    for (const w of workouts)
      for (const we of w.exercises) usage.set(we.exerciseId, (usage.get(we.exerciseId) ?? 0) + 1);
    const order = new Map(exercises.map((e, i) => [e.id, i]));
    return exercises
      .filter((e) => {
        const hay = normalize(`${e.name} ${e.muscleGroup ?? ''}`);
        return words.every((w) => hay.includes(w));
      })
      .sort((a, b) => {
        const sa = normalize(a.name).startsWith(q) ? 0 : 1;
        const sb = normalize(b.name).startsWith(q) ? 0 : 1;
        return sa - sb || (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || order.get(a.id)! - order.get(b.id)!;
      })
      .slice(0, 12);
  }, [query, exercises, workouts]);

  const groups = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of [...exercises].sort((a, b) => a.name.localeCompare(b.name, 'tr'))) {
      const g = e.muscleGroup || 'Diğer';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(e);
    }
    const rank = (g: string) => {
      const i = GROUP_ORDER.indexOf(g);
      return i === -1 ? GROUP_ORDER.length : i;
    };
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0], 'tr'));
  }, [exercises]);

  const knownGroups = useMemo(
    () => [...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean))] as string[],
    [exercises],
  );

  const pick = (id: string) => {
    setQuery('');
    setCreating(false);
    onPick(id);
  };

  const startCreate = (name = '') => {
    setNewName(name);
    setNewGroup('');
    setQuery('');
    setCreating(true);
  };

  const create = () => {
    const name = newName.trim();
    if (!name) return;
    const dup = exercises.find((e) => e.name.toLocaleLowerCase('tr') === name.toLocaleLowerCase('tr'));
    const ex = dup ?? addExercise(name, newGroup.trim() || undefined);
    pick(ex.id);
  };

  return (
    <div className="adder">
      <label className="search">
        <IconSearch width={20} height={20} />
        <input
          type="search"
          placeholder={placeholder ?? 'Hareket ekle: squat, curl, şınav…'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && matches[0] && pick(matches[0].id)}
          aria-label="Hareket ara"
        />
      </label>

      {query.trim() ? (
        <div className="search-results">
          {matches.map((e) => (
            <button
              key={e.id}
              className="search-item"
              onClick={() => pick(e.id)}
              style={{ ['--plate' as string]: groupColor(e.muscleGroup) }}
            >
              <span className="plate-dot" aria-hidden />
              <span className="search-name">{e.name}</span>
              <span className="muted small">{e.muscleGroup}</span>
            </button>
          ))}
          {matches.length === 0 && <p className="muted small">Eşleşen hareket yok.</p>}
          <button className="search-item create" onClick={() => startCreate(query.trim())}>
            <IconPlus width={18} height={18} /> “{query.trim()}” adında yeni hareket oluştur
          </button>
        </div>
      ) : (
        <select
          value={creating ? NEW_EXERCISE : ''}
          onChange={(e) => {
            const v = e.target.value;
            if (v === NEW_EXERCISE) startCreate();
            else if (v) pick(v);
          }}
          aria-label="Listeden hareket seç"
        >
          <option value="">…ya da listeden seç</option>
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
      )}

      {creating && (
        <div className="new-exercise">
          <input
            placeholder="Hareket adı (ör. Hip Thrust)"
            value={newName}
            autoFocus
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            aria-label="Yeni hareket adı"
          />
          <input
            placeholder="Kas grubu (isteğe bağlı)"
            list="muscle-groups"
            value={newGroup}
            onChange={(e) => setNewGroup(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create()}
            aria-label="Kas grubu"
          />
          <datalist id="muscle-groups">
            {knownGroups.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
          <div className="row">
            <button className="btn" onClick={create} disabled={!newName.trim()}>
              Hareketi ekle
            </button>
            <button className="btn ghost" onClick={() => setCreating(false)}>
              Vazgeç
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
