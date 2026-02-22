import { useEffect, useState, useMemo } from 'react';
import LeagueMatchCard, { type LeagueMatch } from './LeagueMatchCard';
import '../styles/league-calendar.css';

type Tab = 'tabla' | 'calendario';

interface LeagueCalendarProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  tabStyle: (active: boolean) => React.CSSProperties;
}

export default function LeagueCalendar({ currentTab, onTabChange, tabStyle }: LeagueCalendarProps) {
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [leagueName, setLeagueName] = useState<string>('');
  const [teamColors, setTeamColors] = useState<Record<string, string>>({});
  const [teamColorsSecondary, setTeamColorsSecondary] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const all = Array.isArray(data.leagueMatches) ? data.leagueMatches : [];
        const currentId = data.currentLeagueId ?? 'default';
        const list = all.filter((m: LeagueMatch) => (m.leagueId ?? 'default') === currentId);
        setMatches(list);

        const currentLeague = Array.isArray(data.leagues) ? data.leagues.find((l: { id: string; name?: string }) => l.id === currentId) : null;
        setLeagueName(currentLeague?.name ?? currentId ?? '');

        const colors: Record<string, string> = {};
        const secondary: Record<string, string> = {};
        const teams = data?.league?.teams;
        if (Array.isArray(teams)) {
          teams.forEach((t: { name: string; color?: string; colorSecondary?: string }) => {
            colors[t.name] = t.color || '#ff6b35';
            if (t.colorSecondary) secondary[t.name] = t.colorSecondary;
          });
        }
        setTeamColors(colors);
        setTeamColorsSecondary(secondary);
      })
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  const matchesByMatchday = useMemo(() => {
    const byMatchday: Record<number, LeagueMatch[]> = {};
    matches.forEach((m) => {
      const j = m.matchday ?? 0;
      if (!byMatchday[j]) byMatchday[j] = [];
      byMatchday[j].push(m);
    });
    const keys = Object.keys(byMatchday)
      .map(Number)
      .filter((k) => k > 0)
      .sort((a, b) => a - b);
    const withZero = Object.keys(byMatchday)
      .map(Number)
      .filter((k) => k === 0);
    const result: { matchday: number; list: LeagueMatch[] }[] = [];
    keys.forEach((k) => result.push({ matchday: k, list: byMatchday[k] }));
    if (withZero.length && byMatchday[0]?.length) {
      result.push({ matchday: 0, list: byMatchday[0] });
    }
    return result;
  }, [matches]);

  if (loading) {
    return (
      <section className="league-calendar-section">
        <div className="container">
          <h2 className="section-title">CALENDARIO</h2>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '24px' }}>
            <button type="button" style={tabStyle(currentTab === 'tabla')} onClick={() => onTabChange('tabla')}>
              📊 Tabla General
            </button>
            <button type="button" style={tabStyle(currentTab === 'calendario')} onClick={() => onTabChange('calendario')}>
              📅 Calendario
            </button>
          </div>
          <p style={{ textAlign: 'center', color: '#b0b0b0' }}>Cargando partidos...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="league-calendar-section">
      <div className="container">
        <h2 className="section-title">CALENDARIO</h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button type="button" style={tabStyle(currentTab === 'tabla')} onClick={() => onTabChange('tabla')}>
            📊 Tabla General
          </button>
          <button type="button" style={tabStyle(currentTab === 'calendario')} onClick={() => onTabChange('calendario')}>
            📅 Calendario
          </button>
        </div>
        {leagueName && (
          <p className="league-calendar-league-name" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', marginTop: '0', marginBottom: '1rem', fontWeight: 600 }}>
            LIGA {leagueName}
          </p>
        )}
        <div className="league-calendar-grid">
          {matches.length === 0 ? (
            <p className="league-match-empty">Aún no hay partidos en el calendario.</p>
          ) : matchesByMatchday.length === 0 ? (
            <p className="league-match-empty">No hay partidos con jornada asignada.</p>
          ) : (
            matchesByMatchday.map(({ matchday, list }) => (
              <div key={matchday} className="league-calendar-matchday">
                <h3 className="league-calendar-matchday-title">
                  {matchday === 0 ? 'Sin jornada' : `JORNADA ${matchday}`}
                </h3>
                <div className="league-calendar-matchday-matches">
                  {list.map((match) => (
                    <LeagueMatchCard
                      key={match.id}
                      match={match}
                      teamColors={teamColors}
                      teamColorsSecondary={teamColorsSecondary}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
