import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format } from 'date-fns';
import type { AppData, Exercise, Level, Unit } from '../types';
import { entryUnit, formatW, toUnit } from '../units';
import { addDays, parseISO } from 'date-fns';
import { LEVELS, exerciseScore, programScore, recommend, repRange } from '../overload';
import BodyMap from '../BodyMap';
import { muscleTargetText, muscleWeeklyZone, workoutsLoad } from '../muscles';
import { exerciseProgress, formatKg, personalRecords, weeklyVolume } from '../stats';
import { midDate, shortDate } from '../format';
import { groupColor } from '../exercises';

const axisStyle = { fontSize: 12, fill: 'var(--muted)', fontFamily: 'var(--font-num)' };
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
};

interface Props {
  data: AppData;
  updateExercise: (id: string, patch: Partial<Exercise>) => void;
  setLevel: (l: Level) => void;
  setUnit: (u: Unit) => void;
}

const FAR_FUTURE = '9999-12-31';

function Meter({ value, max }: { value: number; max: number }) {
  return (
    <span className="meter" aria-hidden>
      <span style={{ width: `${Math.round((value / max) * 100)}%` }} />
    </span>
  );
}

function RangeEdit({ range, onSave }: { range: [number, number]; onSave: (lo: number, hi: number) => void }) {
  const [lo, setLo] = useState(String(range[0]));
  const [hi, setHi] = useState(String(range[1]));
  const commit = () => {
    const a = parseInt(lo, 10);
    const b = parseInt(hi, 10);
    if (!(a > 0 && b > 0 && a < 50 && b < 50)) {
      setLo(String(range[0]));
      setHi(String(range[1]));
      return;
    }
    const [x, y] = a <= b ? [a, b] : [b, a];
    if (x !== range[0] || y !== range[1]) onSave(x, y);
  };
  const field = (value: string, set: (v: string) => void, label: string) => (
    <input
      inputMode="numeric"
      value={value}
      onFocus={(e) => e.target.select()}
      onChange={(e) => set(e.target.value.replace(/\D/g, ''))}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
      aria-label={label}
    />
  );
  return (
    <div className="range-edit">
      <span>Hedef tekrar aralığı</span>
      {field(lo, setLo, 'En az tekrar')}
      <span aria-hidden>–</span>
      {field(hi, setHi, 'En çok tekrar')}
    </div>
  );
}

const scoreWord = (n: number) => (n >= 85 ? 'Çok iyi' : n >= 70 ? 'İyi' : n >= 50 ? 'Orta' : 'Geliştirilmeli');

export default function Progress({ data, updateExercise, setLevel, setUnit }: Props) {
  const unit: Unit = data.unit ?? 'kg';
  const w = (kg: number) => formatW(kg, unit);
  const today = format(new Date(), 'yyyy-MM-dd');
  const level: Level = data.level ?? 'intermediate';
  const weekFrom = format(addDays(parseISO(today), -6), 'yyyy-MM-dd');
  const weekLoad = useMemo(
    () => workoutsLoad(data.workouts, data.exercises, weekFrom, today),
    [data.workouts, data.exercises, weekFrom, today],
  );
  const target = LEVELS[level].weeklySets;
  const program = useMemo(
    () => programScore(data.exercises, data.workouts, today, level),
    [data.exercises, data.workouts, today, level],
  );
  // Kayıtlı hareketler, en çok yapılandan aza
  const used = useMemo(() => {
    const count = new Map<string, number>();
    for (const w of data.workouts)
      // Yalnızca en az bir seti tamamlanmış (tekrar > 0) hareketler grafiğe girer.
      for (const id of new Set(w.exercises.filter((e) => e.sets.some((s) => s.reps > 0)).map((e) => e.exerciseId)))
        count.set(id, (count.get(id) ?? 0) + 1);
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ id, n, name: data.exercises.find((e) => e.id === id)?.name ?? 'Silinmiş hareket' }));
  }, [data]);

  const [selected, setSelected] = useState<string>('');
  const exId = used.some((u) => u.id === selected) ? selected : used[0]?.id;
  const ex = data.exercises.find((e) => e.id === exId);
  const exGroup = ex?.muscleGroup;
  const exScore = useMemo(() => (ex ? exerciseScore(ex, data.workouts, today) : null), [ex, data.workouts, today]);
  const next = useMemo(
    () => (ex ? recommend(ex, data.workouts, FAR_FUTURE, entryUnit(data.workouts, ex.id, FAR_FUTURE, unit)) : null),
    [ex, data.workouts, unit],
  );
  const range = ex ? repRange(ex) : ([8, 12] as [number, number]);

  const points = useMemo(() => (exId ? exerciseProgress(data.workouts, exId) : []), [data.workouts, exId]);
  const pr = useMemo(() => (exId ? personalRecords(data.workouts, exId) : undefined), [data.workouts, exId]);
  const weeks = useMemo(
    () => weeklyVolume(data.workouts, 12).map((x) => ({ ...x, volume: Math.round(toUnit(x.volume, unit)) })),
    [data.workouts, unit],
  );
  const thisWeek = weeks[weeks.length - 1];
  const lastWeek = weeks[weeks.length - 2];

  if (!used.length) {
    return (
      <section className="page">
        <h1 className="page-title">İlerleme</h1>
        <div className="empty">
          <p className="empty-title">Grafikler burada belirecek</p>
          <p className="muted">Birkaç antrenman kaydettikten sonra rekorlarını ve gelişimini burada görürsün.</p>
        </div>
      </section>
    );
  }

  const chartData = points.map((p) => ({
    ...p,
    maxKg: Math.round(toUnit(p.maxKg, unit) * 10) / 10,
    est1RM: Math.round(toUnit(p.est1RM, unit) * 10) / 10,
    label: shortDate(p.date),
  }));
  const unitToggle = (
    <div className="unit-seg" role="group" aria-label="Ağırlık birimi">
      {(['kg', 'lb'] as Unit[]).map((u) => (
        <button key={u} className={unit === u ? 'on' : ''} aria-pressed={unit === u} onClick={() => setUnit(u)}>
          {u}
        </button>
      ))}
    </div>
  );

  return (
    <section className="page">
      <div className="cal-head">
        <h1 className="page-title">İlerleme</h1>
        {unitToggle}
      </div>

      <div className="panel score-panel">
        <div className="score-head">
          <div>
            <h2 className="chart-title">Program skoru</h2>
            <p className="muted small">Son 4 hafta, progresif overload kurallarına göre</p>
          </div>
          <select
            className="level-select"
            value={level}
            onChange={(e) => setLevel(e.target.value as Level)}
            aria-label="Deneyim seviyesi"
          >
            {(Object.keys(LEVELS) as Level[]).map((l) => (
              <option key={l} value={l}>
                {LEVELS[l].label} seviye
              </option>
            ))}
          </select>
        </div>
        {program ? (
          <>
            <div className="hero-stat">
              <span className="hero-num">{program.score}</span>
              <span className="hero-unit">/ 100</span>
              <p className="hero-caption">{scoreWord(program.score)}</p>
            </div>
            <ul className="parts">
              {program.parts.map((p) => (
                <li key={p.key}>
                  <span className="part-label">{p.label}</span>
                  <Meter value={p.value} max={p.max} />
                  <span className="part-val">
                    {p.value}/{p.max}
                  </span>
                </li>
              ))}
            </ul>
            <ul className="insights">
              {program.insights.map((i, k) => (
                <li key={k} className={`insight ${i.tone}`}>
                  {i.text}
                </li>
              ))}
            </ul>
            {program.weekly.length > 0 && (
              <details className="weekly-sets">
                <summary>
                  Kas grubu başına haftalık set (hedef {program.weekly[0].target[0]}–{program.weekly[0].target[1]})
                </summary>
                <ul>
                  {program.weekly.map((g) => (
                    <li key={g.group} style={{ ['--plate' as string]: groupColor(g.group) }}>
                      <span className="plate-dot" aria-hidden />
                      <span className="wk-group">{g.group}</span>
                      <span className="muted small">{formatKg(g.sessionsPerWeek)}×/hafta</span>
                      <b>{formatKg(g.sets)} set</b>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </>
        ) : (
          <p className="muted">Skor için son 4 haftada en az 2 antrenman gerekiyor.</p>
        )}
      </div>

      <div className="panel">
        <h2 className="chart-title">Son 7 gün kas aktivasyonu</h2>
        <BodyMap
          load={weekLoad}
          zoneOf={(n, m) => muscleWeeklyZone(n, m, target)}
          targetOf={(m) => muscleTargetText(m, target)}
          scaleMax={25}
          legend={[
            { zone: 'low', text: 'Etkili dozun altında (MEV)' },
            { zone: 'mid', text: 'Etkili, verimli aralığa yaklaşıyor' },
            { zone: 'good', text: 'Verimli aralık (MAV)' },
            { zone: 'over', text: 'Toparlanma sınırı üstü (MRV)' },
          ]}
        />
        <p className="bm-note">
          Etkili set = set × o hareketin kası çalıştırma oranı; yardımcı kaslar yarım set sayılır. Her kas kendi haftalık
          hacim işaretlerine göre renklenir. {LEVELS[level].label} seviye için kas başına genel hedef {target[0]}–
          {target[1]} set. Bir kasa dokunarak değerini ve hedefini görebilirsin.
        </p>
      </div>

      <div className="panel" style={{ ['--plate' as string]: groupColor(exGroup) }}>
        <select className="lift-select" value={exId} onChange={(e) => setSelected(e.target.value)} aria-label="Hareket">
          {used.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.n} antrenman)
            </option>
          ))}
        </select>

        {pr?.heaviest && pr.best1RM && pr.bestVolume && (
          <>
            <div className="hero-stat">
              <span className="hero-num">{w(pr.best1RM.value)}</span>
              <span className="hero-unit">{unit}</span>
              <p className="hero-caption">
                Tahmini tek tekrar maksimumun ({w(pr.best1RM.kg)} {unit} × {pr.best1RM.reps},{' '}
                {midDate(pr.best1RM.date)})
              </p>
            </div>
            <dl className="records">
              <div>
                <dt>En ağır set</dt>
                <dd>
                  {w(pr.heaviest.kg)} {unit} × {pr.heaviest.reps}
                </dd>
                <dd className="rec-date">{midDate(pr.heaviest.date)}</dd>
              </div>
              <div>
                <dt>En yüksek hacim</dt>
                <dd>
                  {w(pr.bestVolume.value)} {unit}
                </dd>
                <dd className="rec-date">{midDate(pr.bestVolume.date)}</dd>
              </div>
            </dl>
          </>
        )}

        {next && (
          <div className={`rec rec-${next.kind} next-rec`}>
            <div className="rec-head">
              <span className="rec-label">Sonraki antrenman</span>
              {next.sets.length > 0 && <span className="rec-title">{next.title}</span>}
            </div>
            <p className="rec-reason">{next.reason}</p>
          </div>
        )}

        {exScore ? (
          <div className="ex-score">
            <div className="ex-score-num">
              <span className="num">{exScore.score}</span>
              <span className="muted small">hareket skoru</span>
            </div>
            <ul className="parts compact">
              <li>
                <span className="part-label">İlerleme ({exScore.change > 0 ? '+' : ''}{formatKg(exScore.change)}%)</span>
                <Meter value={exScore.progression} max={50} />
              </li>
              <li>
                <span className="part-label">Düzenlilik ({exScore.sessions} seans)</span>
                <Meter value={exScore.consistency} max={25} />
              </li>
              <li>
                <span className="part-label">Aralıkta kalma</span>
                <Meter value={exScore.inRange} max={25} />
              </li>
            </ul>
          </div>
        ) : (
          <p className="muted small">Hareket skoru için son 6 haftada en az 2 seans gerekiyor.</p>
        )}

        {ex && (
          <RangeEdit
            key={ex.id}
            range={range}
            onSave={(lo, hi) => updateExercise(ex.id, { repMin: lo, repMax: hi })}
          />
        )}

        <h3 className="chart-title">Ağırlık gelişimi</h3>
        {chartData.length < 2 ? (
          <p className="muted">Grafik için bu hareketi en az iki farklı günde kaydetmelisin.</p>
        ) : (
          <div className="chart">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={16} />
                <YAxis tick={axisStyle} tickLine={false} axisLine={false} domain={['auto', 'auto']} width={44} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number, name: string) => [`${formatKg(v)} ${unit}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line isAnimationActive={false}
                  type="monotone"
                  dataKey="maxKg"
                  name={`Max ${unit}`}
                  stroke="var(--plate)"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
                <Line isAnimationActive={false}
                  type="monotone"
                  dataKey="est1RM"
                  name="Tahmini 1RM"
                  stroke="var(--muted)"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="panel">
        <h3 className="chart-title">Haftalık hacim (son 12 hafta)</h3>
        <dl className="records">
          <div>
            <dt>Bu hafta</dt>
            <dd>
              {formatKg(thisWeek.volume)} {unit}
            </dd>
            <dd className="rec-date">{thisWeek.workouts} antrenman</dd>
          </div>
          <div>
            <dt>Geçen hafta</dt>
            <dd>
              {formatKg(lastWeek.volume)} {unit}
            </dd>
            <dd className="rec-date">{lastWeek.workouts} antrenman</dd>
          </div>
        </dl>
        <div className="chart">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeks} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={8} />
              <YAxis
                tick={axisStyle}
                tickLine={false}
                axisLine={false}
                width={48}
                tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v))}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'var(--hover)' }}
                labelFormatter={(l) => `${l} haftası`}
                formatter={(v: number, _n, item) => [`${formatKg(v)} ${unit} · ${item.payload.workouts} antrenman`, 'Hacim']}
              />
              <Bar isAnimationActive={false} dataKey="volume" fill="var(--ink)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
