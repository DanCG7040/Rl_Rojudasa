import { useState, useEffect } from 'react';
import LeagueTable from './LeagueTable';
import LeagueCalendar from './LeagueCalendar';
import '../styles/hero.css';
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
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <>
      <section className="hero hero-league" id="league-hero">
        <div className="hero-content">
          <h1 className={`hero-title ${isVisible ? 'animate-fade-in' : ''}`}>
            LIGA
          </h1>
          <p className={`hero-subtitle ${isVisible ? 'animate-fade-in-delay' : ''}`}>
            TABLA Y CALENDARIO
          </p>
        </div>
      </section>
      {tab === 'tabla' && <LeagueTable currentTab={tab} onTabChange={setTab} tabStyle={tabStyle} />}
      {tab === 'calendario' && <LeagueCalendar currentTab={tab} onTabChange={setTab} tabStyle={tabStyle} />}
    </>
  );
}
