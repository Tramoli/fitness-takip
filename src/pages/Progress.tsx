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
import type { AppData } from '../types';
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

export default function Progress({ data }: { data: AppData }) {
  // Kayıtlı hareketler, en çok yapılandan aza
  const used = useMemo(() => {
    const count = new Map<string, number>();
    for (const w of data.workouts)
      for (const id of new Set(w.exercises.filter((e) => e.sets.length).map((e) => e.exerciseId)))
        count.set(id, (count.get(id) ?? 0) + 1);
    return [...count.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id, n]) => ({ id, n, name: data.exercises.find((e) => e.id === id)?.name ?? 'Silinmiş hareket' }));
  }, [data]);

  const [selected, setSelected] = useState<string>('');
  const exId = used.some((u) => u.id === selected) ? selected : used[0]?.id;
  const exGroup = data.exercises.find((e) => e.id === exId)?.muscleGroup;

  const points = useMemo(() => (exId ? exerciseProgress(data.workouts, exId) : []), [data.workouts, exId]);
  const pr = useMemo(() => (exId ? personalRecords(data.workouts, exId) : undefined), [data.workouts, exId]);
  const weeks = useMemo(() => weeklyVolume(data.workouts, 12), [data.workouts]);
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

  const chartData = points.map((p) => ({ ...p, label: shortDate(p.date) }));

  return (
    <section className="page">
      <h1 className="page-title">İlerleme</h1>

      <div className="panel" style={{ ['--plate' as string]: groupColor(exGroup) }}>
        <select className="lift-select" value={exId} onChange={(e) => setSelected(e.target.value)} aria-label="Hareket">
          {used.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.n} antrenman)
            </option>
          ))}
        </select>

        {pr && (
          <>
            <div className="hero-stat">
              <span className="hero-num">{formatKg(pr.best1RM!.value)}</span>
              <span className="hero-unit">kg</span>
              <p className="hero-caption">
                Tahmini tek tekrar maksimumun ({formatKg(pr.best1RM!.kg)} kg × {pr.best1RM!.reps},{' '}
                {midDate(pr.best1RM!.date)})
              </p>
            </div>
            <dl className="records">
              <div>
                <dt>En ağır set</dt>
                <dd>
                  {formatKg(pr.heaviest!.kg)} kg × {pr.heaviest!.reps}
                </dd>
                <dd className="rec-date">{midDate(pr.heaviest!.date)}</dd>
              </div>
              <div>
                <dt>En yüksek hacim</dt>
                <dd>{formatKg(pr.bestVolume!.value)} kg</dd>
                <dd className="rec-date">{midDate(pr.bestVolume!.date)}</dd>
              </div>
            </dl>
          </>
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
                  formatter={(v: number, name: string) => [`${formatKg(v)} kg`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line isAnimationActive={false}
                  type="monotone"
                  dataKey="maxKg"
                  name="Max kg"
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
            <dd>{formatKg(thisWeek.volume)} kg</dd>
            <dd className="rec-date">{thisWeek.workouts} antrenman</dd>
          </div>
          <div>
            <dt>Geçen hafta</dt>
            <dd>{formatKg(lastWeek.volume)} kg</dd>
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
                formatter={(v: number, _n, item) => [`${formatKg(v)} kg · ${item.payload.workouts} antrenman`, 'Hacim']}
              />
              <Bar isAnimationActive={false} dataKey="volume" fill="var(--ink)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
