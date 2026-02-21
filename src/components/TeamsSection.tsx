import { useEffect, useState } from 'react';
import '../styles/teams-section.css';

interface Team {
  position: number;
  name: string;
  color?: string;
  colorSecondary?: string;
  stadiumName?: string;
  stadiumImage?: string;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
}

export default function TeamsSection() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data.json', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        const list = data?.league?.teams;
        setTeams(Array.isArray(list) ? list : []);
      })
      .catch(() => setTeams([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="teams-section" id="equipos">
        <div className="container">
          <h2 className="section-title">Equipos</h2>
          <p style={{ textAlign: 'center', color: '#b0b0b0' }}>Cargando equipos...</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="teams-section" id="equipos">
        <div className="container">
          <h2 className="section-title">Equipos</h2>
          <p style={{ textAlign: 'center', color: '#b0b0b0' }}>Aún no hay equipos registrados.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="teams-section" id="equipos">
      <div className="container">
        <h2 className="section-title">Equipos</h2>
        <p style={{ textAlign: 'center', color: '#b0b0b0', marginBottom: '32px' }}>
          Equipos participantes con su color y estadio
        </p>
        <div className="teams-grid">
          {teams.map((team, index) => (
            <div
              key={team.name + index}
              className="team-card"
              style={{ borderColor: team.color || '#ff6b35' }}
            >
              <div className="team-card-color-bar" style={{ display: 'flex' }}>
                <span style={{ flex: 1, background: team.color || '#ff6b35', height: '100%' }} />
                {team.colorSecondary && <span style={{ width: '28%', background: team.colorSecondary, height: '100%' }} />}
              </div>
              <div className="team-card-body">
                <h3 className="team-card-name">
                  <span
                    className="team-card-dot"
                    style={{ background: team.color || '#ff6b35' }}
                  />
                  {team.colorSecondary && <span className="team-card-dot" style={{ width: '10px', height: '10px', background: team.colorSecondary }} />}
                  {team.name}
                </h3>
                {(team.stadiumName || team.stadiumImage) ? (
                  <div className="team-card-stadium">
                    {team.stadiumImage && (
                      <img
                        src={team.stadiumImage}
                        alt={team.stadiumName || 'Estadio'}
                        className="team-card-stadium-img"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    )}
                    {team.stadiumName && (
                      <span className="team-card-stadium-name">🏟️ {team.stadiumName}</span>
                    )}
                  </div>
                ) : (
                  <div className="team-card-no-stadium">Sin estadio asignado</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
