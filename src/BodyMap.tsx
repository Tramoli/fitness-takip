import { useState } from 'react';
import { MUSCLES, muscleName, type MuscleId, type MuscleLoad, type Zone } from './muscles';

/**
 * Ön ve arka vücut haritası. Kaslar sol yarıda çizilir, sağ yarı aynalanır.
 * viewBox: her figür 200 × 400.
 */

type Shape = { m: MuscleId; d: string; center?: boolean };

const FRONT: Shape[] = [
  // Göğüs
  { m: 'chest_upper', d: 'M99,74 C88,72 76,74 68,80 C66,83 66,86 67,88 C78,90 90,89 99,87 Z' },
  { m: 'chest', d: 'M99,90 C90,92 78,93 67,91 C65,99 67,107 72,112 C80,117 92,117 99,114 Z' },
  // Omuz: ön ve yan
  { m: 'delt_front', d: 'M66,78 C60,77 56,80 55,85 C56,92 58,99 61,104 C63,98 64,91 66,86 Z' },
  { m: 'delt_side', d: 'M64,73 C56,72 50,76 48,84 C47,92 49,100 53,106 L58,104 C55,96 53,88 55,82 C57,78 60,75 64,73 Z' },
  // Kollar
  { m: 'biceps', d: 'M53,110 C48,120 47,134 50,148 C53,151 58,151 61,148 C63,136 63,121 60,108 Z' },
  { m: 'forearms', d: 'M49,154 C44,168 42,184 43,198 C46,201 50,201 53,198 C57,184 60,168 61,154 Z' },
  // Gövde
  { m: 'abs', d: 'M90,120 L110,120 C111,140 111,166 109,190 C104,196 96,196 91,190 C89,166 89,140 90,120 Z', center: true },
  { m: 'obliques', d: 'M73,117 C79,120 84,121 88,121 C87,142 87,166 89,188 C82,184 76,176 74,164 C72,148 71,130 73,117 Z' },
  // Bacaklar
  { m: 'quads', d: 'M76,206 C70,226 69,252 73,276 C76,288 82,294 90,294 C95,286 97,268 97,246 C97,232 95,219 92,210 C86,206 80,204 76,206 Z' },
  { m: 'adductors', d: 'M93,212 C96,224 98,238 98,252 C98,262 97,270 95,276 C98,268 99.5,250 99.5,214 Z' },
  { m: 'calves', d: 'M77,316 C73,332 73,350 77,366 C80,372 86,372 89,366 C91,350 91,332 88,316 C85,312 80,312 77,316 Z' },
];

const BACK: Shape[] = [
  { m: 'traps', d: 'M99,58 C93,62 84,68 72,74 C68,76 66,79 67,82 C76,86 84,94 90,106 C94,116 97,128 99,140 Z' },
  { m: 'delt_rear', d: 'M66,82 C61,80 57,82 55,87 C56,94 58,100 61,104 C64,97 66,90 67,85 Z' },
  { m: 'delt_side', d: 'M64,74 C56,73 50,77 48,85 C47,93 49,100 53,106 L58,104 C55,96 53,89 55,83 C57,79 60,76 64,74 Z' },
  { m: 'lats', d: 'M67,88 C72,92 80,98 87,108 C92,118 96,132 98,146 L98,170 C90,168 82,160 77,148 C72,134 69,118 68,104 C67,98 66,93 67,88 Z' },
  { m: 'lower_back', d: 'M90,150 C93,160 96,168 99.5,172 L100.5,172 C104,168 107,160 110,150 L110,196 L90,196 Z', center: true },
  { m: 'triceps', d: 'M53,110 C48,120 47,134 50,148 C53,151 58,151 61,148 C63,136 63,121 60,108 Z' },
  { m: 'forearms', d: 'M49,154 C44,168 42,184 43,198 C46,201 50,201 53,198 C57,184 60,168 61,154 Z' },
  { m: 'glutes', d: 'M99,200 C90,198 80,201 75,210 C71,220 73,232 80,238 C87,243 95,243 99,240 Z' },
  { m: 'hamstrings', d: 'M76,246 C71,262 71,280 75,296 C79,302 86,303 91,299 C95,286 97,268 97,250 C90,246 82,244 76,246 Z' },
  { m: 'calves', d: 'M77,314 C71,326 71,344 76,360 C79,368 86,368 89,360 C92,344 92,328 88,314 C85,309 80,309 77,314 Z' },
];

/** Gövde silüeti (gri taban), sol yarı; sağ yarı aynalanır. */
const SILHOUETTE =
  'M100,8 C89,8 82,16 82,30 C82,42 87,51 92,55 L92,62 C84,66 74,70 64,72 C54,74 47,80 46,90 ' +
  'C45,106 44,128 46,150 C43,170 40,188 40,200 C40,208 42,214 46,214 C50,214 52,208 53,200 ' +
  'C57,186 61,170 62,156 C64,140 66,126 68,118 C69,140 70,170 72,196 C68,224 66,256 68,284 ' +
  'C70,298 72,306 73,314 C69,334 70,354 74,372 C74,384 72,392 76,396 L92,396 C93,384 92,374 92,366 ' +
  'C95,348 95,330 92,312 C95,300 97,288 98,276 C99,250 99.5,230 100,214 Z';

const HEAD_BACK_HAIR = 'M100,8 C89,8 82,16 82,30 C82,34 83,37 84,40 C88,34 94,32 100,32 Z';

function Figure({
  shapes,
  load,
  zoneOf,
  selected,
  onSelect,
  back,
  label,
}: {
  shapes: Shape[];
  load: MuscleLoad;
  zoneOf: (sets: number, m: MuscleId) => Zone;
  selected: MuscleId | null;
  onSelect: (m: MuscleId) => void;
  back?: boolean;
  label: string;
}) {
  const mirror = 'translate(200,0) scale(-1,1)';
  const muscle = (s: Shape, k: string, transform?: string) => {
    const sets = load[s.m] ?? 0;
    const zone = zoneOf(sets, s.m);
    return (
      <path
        key={k}
        d={s.d}
        transform={transform}
        className={`mz mz-${zone}${selected === s.m ? ' sel' : ''}`}
        onClick={() => onSelect(s.m)}
      >
        <title>
          {muscleName(s.m)}: {sets.toLocaleString('tr-TR')} etkili set
        </title>
      </path>
    );
  };
  return (
    <figure className="figure">
      <svg viewBox="0 0 200 400" role="img" aria-label={label}>
        <defs>
          <pattern id="bm-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="5" height="5" fill="var(--zone-over)" />
            <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,.45)" strokeWidth="2" />
          </pattern>
        </defs>
        <path className="silhouette" d={SILHOUETTE} />
        <path className="silhouette" d={SILHOUETTE} transform={mirror} />
        {back && <path className="hair" d={HEAD_BACK_HAIR} />}
        {back && <path className="hair" d={HEAD_BACK_HAIR} transform={mirror} />}
        {shapes.map((s, i) => (
          <g key={i}>
            {muscle(s, 'l')}
            {!s.center && muscle(s, 'r', mirror)}
          </g>
        ))}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
}

export interface BodyMapProps {
  load: MuscleLoad;
  zoneOf: (sets: number, m: MuscleId) => Zone;
  legend: { zone: Zone; text: string }[];
  /** Seçilen kas için hedef açıklaması (ör. haftalık MEV–MRV). */
  targetOf?: (m: MuscleId) => string | undefined;
  /** Kas listesindeki çubuğun ölçeği (ör. haftalık hedefin üst sınırı). */
  scaleMax: number;
  unit?: string;
  compact?: boolean;
}

export default function BodyMap({ load, zoneOf, legend, scaleMax, unit = 'etkili set', compact, targetOf }: BodyMapProps) {
  const [selected, setSelected] = useState<MuscleId | null>(null);
  const toggle = (m: MuscleId) => setSelected((s) => (s === m ? null : m));
  const rows = MUSCLES.map((m) => ({ ...m, sets: load[m.id] ?? 0 }))
    .filter((m) => m.sets > 0)
    .sort((a, b) => b.sets - a.sets);
  const sel = selected ? { name: muscleName(selected), sets: load[selected] ?? 0, target: targetOf?.(selected) } : null;

  return (
    <div className={`bodymap${compact ? ' compact' : ''}`}>
      <div className="figures">
        <Figure shapes={FRONT} load={load} zoneOf={zoneOf} selected={selected} onSelect={toggle} label="Ön" />
        <Figure shapes={BACK} load={load} zoneOf={zoneOf} selected={selected} onSelect={toggle} back label="Arka" />
      </div>

      {sel && (
        <p className="bm-selected">
          <b>{sel.name}</b>: {sel.sets.toLocaleString('tr-TR')} {unit}
          {sel.target && <span className="muted"> · {sel.target}</span>}
        </p>
      )}

      <ul className="bm-legend">
        {legend.map((l) => (
          <li key={l.zone}>
            <span className={`swatch mz-${l.zone}`} aria-hidden />
            {l.text}
          </li>
        ))}
      </ul>

      {!compact && rows.length > 0 && (
        <ul className="bm-list">
          {rows.map((r) => (
            <li key={r.id} className={selected === r.id ? 'sel' : ''} onClick={() => toggle(r.id)}>
              <span className="bm-name">{r.name}</span>
              <span className="bm-bar">
                <span
                  className={`mz-${zoneOf(r.sets, r.id)}`}
                  style={{ width: `${Math.min(100, (r.sets / scaleMax) * 100)}%` }}
                />
              </span>
              <span className="bm-val">{r.sets.toLocaleString('tr-TR')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
