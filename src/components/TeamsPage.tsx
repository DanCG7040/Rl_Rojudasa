import { useEffect, useState } from 'react';
import '../styles/teams-section.css';
import '../styles/teams-page.css';

interface Team {
  position: number;
  name: string;
  color?: string;
  colorSecondary?: string;
  stadiumName?: string;
  stadiumImage?: string;
  leaguesWon?: number;
  cupsWon?: number;
  played?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  points?: number;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

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
      <section className="teams-page-section">
        <div className="container">
          <h1 className="teams-page-title">Equipos</h1>
          <p style={{ textAlign: 'center', color: '#b0b0b0' }}>Cargando equipos...</p>
        </div>
      </section>
    );
  }

  if (teams.length === 0) {
    return (
      <section className="teams-page-section">
        <div className="container">
          <h1 className="teams-page-title">Equipos</h1>
          <p style={{ textAlign: 'center', color: '#b0b0b0' }}>Aún no hay equipos registrados.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="teams-page-section">
      <div className="container">
        <h1 className="teams-page-title">Equipos</h1>
        <p style={{ textAlign: 'center', color: '#b0b0b0', marginBottom: '32px' }}>
          Haz clic en un equipo para ver ligas ganadas, copas ganadas y foto del estadio
        </p>
        <div className="teams-page-grid">
          {teams.map((team, index) => (
            <button
              key={team.name + index}
              type="button"
              className="teams-page-card"
              style={{ borderColor: team.color || '#ff6b35' }}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="teams-page-card-bar" style={{ display: 'flex' }}>
                <span style={{ flex: 1, background: team.color || '#ff6b35', height: '100%' }} />
                {team.colorSecondary && <span style={{ width: '28%', background: team.colorSecondary, height: '100%' }} />}
              </div>
              <div className="teams-page-card-body">
                <span className="teams-page-card-dot" style={{ background: team.color || '#ff6b35' }} />
                {team.colorSecondary && <span className="teams-page-card-dot teams-page-card-dot-sec" style={{ background: team.colorSecondary }} />}
                <span className="teams-page-card-name">{team.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedTeam && (
        <div
          className="teams-page-modal-overlay"
          onClick={() => setSelectedTeam(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="team-modal-title"
        >
          <div className="teams-page-modal" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="teams-page-modal-close"
              onClick={() => setSelectedTeam(null)}
              aria-label="Cerrar"
            >
              ×
            </button>
            <h2 id="team-modal-title" className="teams-page-modal-title" style={{ borderBottomColor: selectedTeam.color || '#ff6b35' }}>
              <span style={{ background: selectedTeam.color || '#ff6b35' }} />
              {selectedTeam.name}
            </h2>
            <div className="teams-page-modal-stats">
              <div className="teams-page-modal-stat">
                <span className="teams-page-modal-stat-value">{selectedTeam.leaguesWon ?? 0}</span>
                <span className="teams-page-modal-stat-label">Ligas ganadas</span>
              </div>
              <div className="teams-page-modal-stat">
                <span className="teams-page-modal-stat-value">{selectedTeam.cupsWon ?? 0}</span>
                <span className="teams-page-modal-stat-label">Copas ganadas</span>
              </div>
            </div>
            <div className="teams-page-modal-stadium">
              <h3 className="teams-page-modal-stadium-title">Estadio</h3>
              {selectedTeam.stadiumName && (
                <p className="teams-page-modal-stadium-name">🏟️ {selectedTeam.stadiumName}</p>
              )}
              {selectedTeam.stadiumImage ? (
                <div className="teams-page-modal-stadium-img-wrap">
                  <img
                    src={selectedTeam.stadiumImage}
                    alt={selectedTeam.stadiumName || 'Estadio'}
                    className="teams-page-modal-stadium-img"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              ) : (
                <p className="teams-page-modal-no-photo">Sin foto de estadio</p>
              )}
            </div>
            <button type="button" className="teams-page-modal-btn" onClick={() => setSelectedTeam(null)}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
