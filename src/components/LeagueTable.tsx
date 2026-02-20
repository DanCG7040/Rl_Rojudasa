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

export default function LeagueTable() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sortBy, setSortBy] = useState<string>('position');

  useEffect(() => {
    fetch('/api/data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => setTeams(data.league.teams))
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
