import { useState } from 'react';
import LeagueTable from './LeagueTable';
import LeagueCalendar from './LeagueCalendar';
import '../styles/league-table.css';
import '../styles/league-calendar.css';

type Tab = 'tabla' | 'calendario';

const tabStyle = (active: boolean) => ({
  padding: '12px 24px',
  border: active ? '2px solid #ff6b35' : '2px solid #444',
  background: active ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.05)',
  color: active ? '#ffd23f' : '#b0b0b0',
  fontFamily: 'Orbitron, sans-serif',
  fontWeight: 600,
  fontSize: '0.95rem',
  cursor: 'pointer',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
});

export default function LeaguePage() {
  const [tab, setTab] = useState<Tab>('tabla');

  return (
    <>
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            style={tabStyle(tab === 'tabla')}
            onClick={() => setTab('tabla')}
          >
            📊 Tabla
          </button>
          <button
            type="button"
            style={tabStyle(tab === 'calendario')}
            onClick={() => setTab('calendario')}
          >
            📅 Calendario
          </button>
        </div>
      </div>
      {tab === 'tabla' && <LeagueTable />}
      {tab === 'calendario' && <LeagueCalendar />}
    </>
  );
}
