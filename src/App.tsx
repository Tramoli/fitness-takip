import { useState } from 'react';
import { format } from 'date-fns';
import { useAppData } from './store';
import { useAuth } from './auth';
import Account from './pages/Account';
import { useTheme } from './theme';
import type { Template } from './types';
import LogWorkout from './pages/LogWorkout';
import History from './pages/History';
import Progress from './pages/Progress';
import CalendarView from './pages/CalendarView';
import Programs from './pages/Programs';
import ErrorBoundary from './ErrorBoundary';
import {
  IconCalendar,
  IconCloud,
  IconCloudOff,
  IconHistory,
  IconLog,
  IconMoon,
  IconPrograms,
  IconProgress,
  IconSun,
  IconUser,
} from './icons';

type Tab = 'log' | 'programs' | 'history' | 'progress' | 'calendar' | 'account';

const TABS: { id: Tab; label: string; Icon: typeof IconLog }[] = [
  { id: 'log', label: 'Kaydet', Icon: IconLog },
  { id: 'programs', label: 'Programlar', Icon: IconPrograms },
  { id: 'history', label: 'Geçmiş', Icon: IconHistory },
  { id: 'progress', label: 'İlerleme', Icon: IconProgress },
  { id: 'calendar', label: 'Takvim', Icon: IconCalendar },
];

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export default function App() {
  const user = useAuth();
  const store = useAppData(user?.uid ?? null);
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>('log');
  const [date, setDate] = useState(todayStr);
  // Programlar sayfasından başlatılan program: Kaydet sayfası açılırken bir kez uygulanır.
  const [start, setStart] = useState<{ template: Template; nonce: number } | null>(null);

  const openDate = (d: string) => {
    setStart(null);
    setDate(d);
    setTab('log');
  };

  const startTemplate = (t: Template) => {
    setDate(todayStr());
    setStart({ template: t, nonce: Date.now() });
    setTab('log');
  };

  return (
    <div className="app">
      <header className="appbar">
        <span className="brand">
          <span className="plate-dot" aria-hidden /> Fitness Takip
        </span>
        <span className="appbar-actions">
        <button
          className={`ghost-icon theme-toggle sync-btn sync-${store.status}`}
          onClick={() => setTab('account')}
          aria-label={
            store.status === 'local'
              ? 'Hesap: giriş yapılmadı'
              : store.status === 'offline'
                ? 'Hesap: çevrimdışı'
                : store.status === 'pending'
                  ? 'Hesap: eşitleniyor'
                  : 'Hesap: eşitlendi'
          }
          title={user?.email ?? 'Giriş yap'}
        >
          {store.status === 'local' ? (
            <IconUser width={20} height={20} />
          ) : store.status === 'offline' ? (
            <IconCloudOff width={20} height={20} />
          ) : (
            <IconCloud width={20} height={20} />
          )}
          {store.status !== 'local' && <span className="sync-badge" aria-hidden />}
        </button>
        <button
          className="ghost-icon theme-toggle"
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
          title={theme === 'dark' ? 'Açık tema' : 'Koyu tema'}
        >
          {theme === 'dark' ? <IconSun width={20} height={20} /> : <IconMoon width={20} height={20} />}
        </button>
        </span>
      </header>
      <main className="content">
        {user === undefined ? (
          <p className="muted">Yükleniyor…</p>
        ) : (
        <ErrorBoundary key={tab} onReset={() => setTab('log')}>
        {tab === 'account' && <Account user={user} status={store.status} onClose={() => setTab('log')} />}
        {tab === 'log' && (
          <LogWorkout
            key={`${date}-${start?.nonce ?? 0}`}
            date={date}
            onDateChange={(d) => {
              setStart(null);
              setDate(d);
            }}
            data={store.data}
            upsertWorkout={store.upsertWorkout}
            addExercise={store.addExercise}
            saveTemplate={store.saveTemplate}
            startTemplate={start?.template}
            onOpenPrograms={() => setTab('programs')}
          />
        )}
        {tab === 'programs' && (
          <Programs
            data={store.data}
            saveTemplate={store.saveTemplate}
            deleteTemplate={store.deleteTemplate}
            addExercise={store.addExercise}
            onStart={startTemplate}
          />
        )}
        {tab === 'history' && (
          <History data={store.data} onEdit={openDate} onDelete={store.deleteWorkout} onReplaceAll={store.replaceAll} />
        )}
        {tab === 'progress' && (
          <Progress data={store.data} updateExercise={store.updateExercise} setLevel={store.setLevel} />
        )}
        {tab === 'calendar' && <CalendarView data={store.data} selected={date} onPick={openDate} />}
        </ErrorBoundary>
        )}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              if (t.id !== 'log') setStart(null);
              setTab(t.id);
            }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <t.Icon />
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
