import { useEffect, useState } from 'react';
import '../styles/league-table.css';

interface Team {
  position: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

type Tab = 'tabla' | 'calendario';

interface LeagueTableProps {
  currentTab: Tab;
  onTabChange: (tab: Tab) => void;
  tabStyle: (active: boolean) => React.CSSProperties;
}

export default function LeagueTable({ currentTab, onTabChange, tabStyle }: LeagueTableProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [leagueName, setLeagueName] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('position');

  useEffect(() => {
    fetch('/api/data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setTeams(data.league?.teams ?? []);
        const currentId = data.currentLeagueId ?? 'default';
        const currentLeague = Array.isArray(data.leagues) ? data.leagues.find((l: { id: string; name?: string }) => l.id === currentId) : null;
        setLeagueName(currentLeague?.name ?? currentId ?? '');
      })
      .catch(err => console.error('Error loading league:', err));
  }, []);

  const handleSort = (column: string) => {
    setSortBy(column);
  };

  const sortedTeams = [...teams].sort((a, b) => {
    if (sortBy === 'position') return a.position - b.position;
    if (sortBy === 'points') return b.points - a.points;
    if (sortBy === 'goalsFor') return b.goalsFor - a.goalsFor;
    if (sortBy === 'goalDifference') return b.goalDifference - a.goalDifference;
    return 0;
  });

  return (
    <section className="league-table-section" id="league">
      <div className="container">
        <h2 className="section-title">TABLA GENERAL</h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button type="button" style={tabStyle(currentTab === 'tabla')} onClick={() => onTabChange('tabla')}>
            📊 Tabla General
          </button>
          <button type="button" style={tabStyle(currentTab === 'calendario')} onClick={() => onTabChange('calendario')}>
            📅 Calendario
          </button>
        </div>
        {leagueName && (
          <p className="league-table-league-name" style={{ textAlign: 'center', color: '#94a3b8', fontSize: '1.1rem', marginTop: '0', marginBottom: '1rem', fontWeight: 600 }}>
            LIGA {leagueName}
          </p>
        )}
        <div className="table-wrapper">
          <table className="league-table">
            <thead>
              <tr>
                <th className="sortable" onClick={() => handleSort('position')}>
                  # {sortBy === 'position' && '↑'}
                </th>
                <th>N</th>
                <th>J</th>
                <th>V</th>
                <th>E</th>
                <th>D</th>
                <th className="sortable" onClick={() => handleSort('goalsFor')}>
                  GF {sortBy === 'goalsFor' && '↑'}
                </th>
                <th>GC</th>
                <th className="sortable" onClick={() => handleSort('goalDifference')}>
                  DG {sortBy === 'goalDifference' && '↑'}
                </th>
                <th className="sortable" onClick={() => handleSort('points')}>
                  PTS {sortBy === 'points' && '↑'}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTeams.map((team) => (
                <tr key={team.position}>
                  <td className="position">{team.position}</td>
                  <td className="team-name">{team.name}</td>
                  <td>{team.played}</td>
                  <td>{team.wins}</td>
                  <td>{team.draws}</td>
                  <td>{team.losses}</td>
                  <td>{team.goalsFor}</td>
                  <td>{team.goalsAgainst}</td>
                  <td className={team.goalDifference >= 0 ? 'positive' : 'negative'}>
                    {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                  </td>
                  <td className="points">{team.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
