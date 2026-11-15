import { useState } from 'react';
import { format } from 'date-fns';
import { useAppData } from './store';
import LogWorkout from './pages/LogWorkout';
import History from './pages/History';
import Progress from './pages/Progress';
import CalendarView from './pages/CalendarView';
import { IconCalendar, IconHistory, IconLog, IconProgress } from './icons';

type Tab = 'log' | 'history' | 'progress' | 'calendar';

const TABS: { id: Tab; label: string; Icon: typeof IconLog }[] = [
  { id: 'log', label: 'Kaydet', Icon: IconLog },
  { id: 'history', label: 'Geçmiş', Icon: IconHistory },
  { id: 'progress', label: 'İlerleme', Icon: IconProgress },
  { id: 'calendar', label: 'Takvim', Icon: IconCalendar },
];

const todayStr = () => format(new Date(), 'yyyy-MM-dd');

export default function App() {
  const store = useAppData();
  const [tab, setTab] = useState<Tab>('log');
  const [date, setDate] = useState(todayStr);

  const openDate = (d: string) => {
    setDate(d);
    setTab('log');
  };

  return (
    <div className="app">
      <main className="content">
        {tab === 'log' && (
          <LogWorkout
            key={date}
            date={date}
            onDateChange={setDate}
            data={store.data}
            upsertWorkout={store.upsertWorkout}
            addExercise={store.addExercise}
          />
        )}
        {tab === 'history' && (
          <History
            data={store.data}
            onEdit={openDate}
            onDelete={store.deleteWorkout}
            onReplaceAll={store.replaceAll}
          />
        )}
        {tab === 'progress' && <Progress data={store.data} />}
        {tab === 'calendar' && <CalendarView data={store.data} selected={date} onPick={openDate} />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
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
