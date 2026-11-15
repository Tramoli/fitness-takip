import { useMemo, useState } from 'react';
import type { Exercise, Workout } from './types';
import { groupColor } from './exercises';
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

interface Props {
  exercises: Exercise[];
  workouts: Workout[];
  onPick: (exerciseId: string) => void;
  /** Listede olmayan bir ad için "yeni hareket oluştur" seçildiğinde. */
  onCreate: (name: string) => void;
  placeholder?: string;
  /** Arama yazılırken gizlenecek ek içerik (ör. açılır liste). */
  children?: React.ReactNode;
}

export default function ExerciseSearch({ exercises, workouts, onPick, onCreate, placeholder, children }: Props) {
  const [query, setQuery] = useState('');

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

  const pick = (id: string) => {
    setQuery('');
    onPick(id);
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
          <button
            className="search-item create"
            onClick={() => {
              const name = query.trim();
              setQuery('');
              onCreate(name);
            }}
          >
            <IconPlus width={18} height={18} /> “{query.trim()}” adında yeni hareket oluştur
          </button>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
