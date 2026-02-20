import { useEffect, useState } from 'react';
import '../styles/bracket-tournament.css';

interface Team {
  name: string;
  score: number | null;
}

interface Match {
  id: string;
  team1: Team;
  team2: Team;
  completed: boolean;
  date: string;
}

interface GroupStanding {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  position: number;
}

interface Group {
  id: string;
  name: string;
  teams: string[];
  matches: any[];
  standings?: GroupStanding[];
  qualified?: string[];
}

interface TournamentData {
  type?: 'groups' | 'direct';
  groups: Group[];
  knockoutRounds: {
    roundOf16: Match[];
    quarterFinals: Match[];
    semiFinals: Match[];
    final: Match | null;
  };
}

interface BracketData {
  koPlayoffs: Match[];
  roundOf16: Match[];
  quarterFinals: Match[];
  semiFinals: Match[];
  final: Match;
}

export default function TournamentBracket() {
  const [tournamentData, setTournamentData] = useState<TournamentData | null>(null);
  const [bracketData, setBracketData] = useState<BracketData | null>(null);
  const [showGroups, setShowGroups] = useState(true);

  const [leagueTeams, setLeagueTeams] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/data.json')
      .then(res => res.json())
      .then(data => {
        if (data.league?.teams) {
          const colorMap: Record<string, string> = {};
          data.league.teams.forEach((t: { name: string; color?: string }) => {
            colorMap[t.name] = t.color || '#ff6b35';
          });
          setLeagueTeams(colorMap);
        }
        // Usar tournament si existe, sino usar bracket antiguo
        if (data.tournament) {
          const tournamentType = data.tournament.type || (data.tournament.groups && data.tournament.groups.length > 0 ? 'groups' : 'direct');
          const hasGroups = data.tournament.groups && data.tournament.groups.length > 0;
          setTournamentData(data.tournament);
          setShowGroups(tournamentType === 'groups' && hasGroups);
        } else if (data.bracket) {
          setBracketData(data.bracket);
          setShowGroups(false);
        }
      })
      .catch(err => console.error('Error loading bracket:', err));
  }, []);

  if (!tournamentData && !bracketData) {
    return <div className="bracket-loading">Cargando bracket...</div>;
  }

  const MatchBox = ({ match, isFinal = false }: { match: Match; isFinal?: boolean }) => {
    const team1Color = leagueTeams[match.team1.name] || '#94a3b8';
    const team2Color = leagueTeams[match.team2.name] || '#94a3b8';
    return (
      <div className={`match-box ${match.completed ? 'completed' : ''} ${isFinal ? 'final-match' : ''}`}>
        {match.completed && (
          <div className="match-status">Full time</div>
        )}
        <div className="match-teams">
          <div 
            className={`team ${match.team1.score !== null && match.team1.score > (match.team2.score || 0) ? 'winner' : ''}`}
            style={{ borderLeftColor: team1Color }}
          >
            <span className="team-name">{match.team1.name}</span>
            {match.team1.score !== null && <span className="team-score">{match.team1.score}</span>}
          </div>
          <div 
            className={`team ${match.team2.score !== null && match.team2.score > (match.team1.score || 0) ? 'winner' : ''}`}
            style={{ borderLeftColor: team2Color }}
          >
            <span className="team-name">{match.team2.name}</span>
            {match.team2.score !== null && <span className="team-score">{match.team2.score}</span>}
          </div>
        </div>
        <div className="match-date">{match.date}</div>
      </div>
    );
  };

  // Si hay datos de torneo con grupos, mostrar grupos y fases eliminatorias
  if (tournamentData && tournamentData.type === 'groups' && showGroups) {
    return (
      <section className="tournament-bracket-section" id="bracket">
        <div className="container">
          <h2 className="section-title">TORNEO</h2>
          
          {/* Grupos */}
          {tournamentData.groups && tournamentData.groups.length > 0 && (
            <div style={{ marginBottom: '60px' }}>
              <h3 style={{ color: '#ffd23f', marginBottom: '30px', textAlign: 'center' }}>FASE DE GRUPOS</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '40px' }}>
                {tournamentData.groups.map((group) => (
                  <div key={group.id} style={{ 
                    background: '#1a1a2e', 
                    padding: '20px', 
                    borderRadius: '10px',
                    border: '2px solid #ff6b35'
                  }}>
                    <h4 style={{ color: '#ffd23f', marginTop: 0, marginBottom: '15px', textAlign: 'center' }}>
                      {group.name}
                    </h4>
                    {group.standings && group.standings.length > 0 ? (
                      <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'rgba(255, 107, 53, 0.2)' }}>
                            <th style={{ padding: '6px', textAlign: 'left' }}>Pos</th>
                            <th style={{ padding: '6px', textAlign: 'left' }}>Equipo</th>
                            <th style={{ padding: '6px' }}>PTS</th>
                            <th style={{ padding: '6px' }}>DG</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map((standing, idx) => (
                            <tr 
                              key={standing.team}
                              style={{ 
                                background: group.qualified?.includes(standing.team) ? 'rgba(74, 222, 128, 0.2)' : 'transparent',
                                borderBottom: '1px solid rgba(255, 107, 53, 0.1)',
                                borderLeft: `4px solid ${leagueTeams[standing.team] || '#94a3b8'}`
                              }}
                            >
                              <td style={{ padding: '6px', fontWeight: group.qualified?.includes(standing.team) ? '700' : '400' }}>
                                {standing.position}
                                {group.qualified?.includes(standing.team) && ' ✅'}
                              </td>
                              <td style={{ padding: '6px', fontWeight: group.qualified?.includes(standing.team) ? '700' : '400' }}>
                                {standing.team}
                              </td>
                              <td style={{ padding: '6px', textAlign: 'center', color: '#ffd23f', fontWeight: '700' }}>
                                {standing.points}
                              </td>
                              <td style={{ 
                                padding: '6px', 
                                textAlign: 'center',
                                color: standing.goalDifference >= 0 ? '#4ade80' : '#f87171',
                                fontWeight: '600'
                              }}>
                                {standing.goalDifference > 0 ? '+' : ''}{standing.goalDifference}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p style={{ color: '#b0b0b0', textAlign: 'center' }}>Sin partidos jugados aún</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Fases Eliminatorias */}
          {tournamentData.knockoutRounds && (
            <div className="bracket-wrapper">
              {/* Round of 16 */}
              {tournamentData.knockoutRounds.roundOf16 && tournamentData.knockoutRounds.roundOf16.length > 0 && (
                <div className="bracket-stage">
                  <div className="stage-header">
                    <h3>OCTAVOS DE FINAL</h3>
                  </div>
                  <div className="stage-matches">
                    {tournamentData.knockoutRounds.roundOf16.map(match => (
                      <MatchBox key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Quarter-finals */}
              {tournamentData.knockoutRounds.quarterFinals && tournamentData.knockoutRounds.quarterFinals.length > 0 && (
                <div className="bracket-stage">
                  <div className="stage-header">
                    <h3>CUARTOS DE FINAL</h3>
                  </div>
                  <div className="stage-matches">
                    {tournamentData.knockoutRounds.quarterFinals.map(match => (
                      <MatchBox key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Semi-finals */}
              {tournamentData.knockoutRounds.semiFinals && tournamentData.knockoutRounds.semiFinals.length > 0 && (
                <div className="bracket-stage">
                  <div className="stage-header">
                    <h3>SEMIFINALES</h3>
                  </div>
                  <div className="stage-matches">
                    {tournamentData.knockoutRounds.semiFinals.map(match => (
                      <MatchBox key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              )}

              {/* Final */}
              {tournamentData.knockoutRounds.final && (
                <div className="bracket-stage final-stage">
                  <div className="stage-header">
                    <h3>FINAL</h3>
                  </div>
                  <div className="trophy-icon">🏆</div>
                  <div className="stage-matches">
                    <MatchBox match={tournamentData.knockoutRounds.final} isFinal={true} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    );
  }

  // Si es eliminación directa (sin grupos) o hay tournament pero sin grupos, mostrar solo fases eliminatorias
  if (tournamentData && (tournamentData.type === 'direct' || !showGroups)) {
    const ko = tournamentData.knockoutRounds || {};
    const hasR16 = ko.roundOf16 && ko.roundOf16.length > 0;
    const hasQuarters = ko.quarterFinals && ko.quarterFinals.length > 0;
    const hasSemis = ko.semiFinals && ko.semiFinals.length > 0;
    const hasFinal = ko.final && (ko.final.team1?.name !== 'Por Definir' || ko.final.team2?.name !== 'Por Definir');
    const hasAnyKnockout = hasR16 || hasQuarters || hasSemis || hasFinal;

    return (
      <section className="tournament-bracket-section" id="bracket">
        <div className="container">
          <h2 className="section-title">TORNEO - ELIMINACIÓN DIRECTA</h2>
          {!hasAnyKnockout ? (
            <div className="bracket-empty">
              <p>Aún no hay partidos del bracket configurados.</p>
              <p>Configura octavos, cuartos, semifinales y final en el <a href="/admin">panel de administración</a> (pestaña Torneo).</p>
            </div>
          ) : (
          <div className="bracket-wrapper">
            {/* Round of 16 */}
            {hasR16 && (
              <div className="bracket-stage">
                <div className="stage-header">
                  <h3>OCTAVOS DE FINAL</h3>
                </div>
                <div className="stage-matches">
                  {tournamentData.knockoutRounds.roundOf16.map(match => (
                    <MatchBox key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* Quarter-finals */}
            {hasQuarters && (
              <div className="bracket-stage">
                <div className="stage-header">
                  <h3>CUARTOS DE FINAL</h3>
                </div>
                <div className="stage-matches">
                  {tournamentData.knockoutRounds.quarterFinals.map(match => (
                    <MatchBox key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* Semi-finals */}
            {hasSemis && (
              <div className="bracket-stage">
                <div className="stage-header">
                  <h3>SEMIFINALES</h3>
                </div>
                <div className="stage-matches">
                  {tournamentData.knockoutRounds.semiFinals.map(match => (
                    <MatchBox key={match.id} match={match} />
                  ))}
                </div>
              </div>
            )}

            {/* Final */}
            {tournamentData.knockoutRounds.final && (
              <div className="bracket-stage final-stage">
                <div className="stage-header">
                  <h3>FINAL</h3>
                </div>
                <div className="trophy-icon">🏆</div>
                <div className="stage-matches">
                  <MatchBox match={tournamentData.knockoutRounds.final} isFinal={true} />
                </div>
              </div>
            )}
          </div>
          )}
        </div>
      </section>
    );
  }

  // Si no hay grupos, mostrar bracket antiguo
  if (bracketData) {
    return (
      <section className="tournament-bracket-section" id="bracket">
        <div className="container">
          <h2 className="section-title">TORNEO</h2>
          <div className="bracket-wrapper">
            {/* KO Play-offs */}
            <div className="bracket-stage">
              <div className="stage-header">
                <h3>KO PLAY-OFFS</h3>
                <div className="stage-dates">16/18 & 23/25 Feb</div>
              </div>
              <div className="stage-matches">
                {bracketData.koPlayoffs.map(match => (
                  <MatchBox key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Round of 16 */}
            <div className="bracket-stage">
              <div className="stage-header">
                <h3>ROUND OF 16</h3>
                <div className="stage-dates">9/11 & 16/18 Mar</div>
              </div>
              <div className="stage-matches">
                {bracketData.roundOf16.map(match => (
                  <MatchBox key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Quarter-finals */}
            <div className="bracket-stage">
              <div className="stage-header">
                <h3>QUARTER-FINALS</h3>
                <div className="stage-dates">6/8 & 13/15 Apr</div>
              </div>
              <div className="stage-matches">
                {bracketData.quarterFinals.map(match => (
                  <MatchBox key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Semi-finals */}
            <div className="bracket-stage">
              <div className="stage-header">
                <h3>SEMI-FINALS</h3>
                <div className="stage-dates">27/29 Apr & 4/6 May</div>
              </div>
              <div className="stage-matches">
                {bracketData.semiFinals.map(match => (
                  <MatchBox key={match.id} match={match} />
                ))}
              </div>
            </div>

            {/* Final */}
            <div className="bracket-stage final-stage">
              <div className="stage-header">
                <h3>FINAL</h3>
                <div className="stage-dates">29/30 May</div>
              </div>
              <div className="trophy-icon">🏆</div>
              <div className="stage-matches">
                <MatchBox match={bracketData.final} isFinal={true} />
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return <div className="bracket-loading">Cargando bracket...</div>;
}
