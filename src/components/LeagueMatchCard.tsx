import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../styles/league-calendar.css';

export interface LeagueMatch {
  id: string;
  leagueId?: string;
  matchday?: number;
  localTeam: string;
  awayTeam: string;
  date: string;
  status: 'jugado' | 'por_jugar';
  stadium: string;
  homeScore: number | null;
  awayScore: number | null;
  repeticion?: string;
  historial?: { local: number[]; away: number[] };
}

interface LeagueMatchCardProps {
  match: LeagueMatch;
  teamColors: Record<string, string>;
  teamColorsSecondary?: Record<string, string>;
}

const defaultColor = '#ff6b35';

/** Formatea minuto guardado (0-359) como Y:XX (Y 0-5, XX 00-59) */
function formatMinute(m: number): string {
  const y = Math.floor(m / 60);
  const xx = m % 60;
  return `${y}:${String(xx).padStart(2, '0')}`;
}

export default function LeagueMatchCard({ match, teamColors, teamColorsSecondary = {} }: LeagueMatchCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const localColor = teamColors[match.localTeam] ?? defaultColor;
  const awayColor = teamColors[match.awayTeam] ?? defaultColor;
  const localSecondary = teamColorsSecondary[match.localTeam];
  const awaySecondary = teamColorsSecondary[match.awayTeam];
  const historial = match.historial ?? { local: [], away: [] };
  const homeScore = historial.local?.length ?? 0;
  const awayScore = historial.away?.length ?? 0;
  const isPlayed = match.status === 'jugado';
  const displayHome = isPlayed ? homeScore : null;
  const displayAway = isPlayed ? awayScore : null;
  const repeticionUrl = (match.repeticion || '').trim();
  const showRepeticion = isPlayed && repeticionUrl;
  const localGoalsSorted = [...historial.local].sort((a, b) => a - b);
  const awayGoalsSorted = [...historial.away].sort((a, b) => a - b);

  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  const modalContent = modalOpen && (
    <div
      className="league-match-modal-backdrop"
      onClick={() => setModalOpen(false)}
      role="presentation"
    >
      <div
        className="league-match-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="league-match-modal-title"
      >
        <div className="league-match-modal-header">
          <h2 id="league-match-modal-title" className="league-match-modal-title">Detalle del partido</h2>
          <button
            type="button"
            className="league-match-modal-close"
            onClick={() => setModalOpen(false)}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="league-match-modal-body">
          <div className="league-match-modal-row">
            <div className="league-match-modal-team-block" style={{ borderLeftColor: localColor }}>
              <div className="league-match-modal-team-bar" style={{ display: 'flex' }}>
                <span style={{ flex: 1, background: localColor, height: '100%' }} />
                {localSecondary && <span style={{ width: '28%', background: localSecondary, height: '100%' }} />}
              </div>
              <span className="league-match-modal-team-name">{match.localTeam}</span>
              <div className="league-match-modal-cronologia-col">
                {localGoalsSorted.map((min, i) => (
                  <span key={i} className="league-match-modal-gol-minuto">⚽ {formatMinute(min)}</span>
                ))}
              </div>
            </div>
            <div className="league-match-modal-score-block">
              <span className="league-match-modal-score-display">
                {isPlayed ? `${displayHome} - ${displayAway}` : '(  -  )'}
              </span>
            </div>
            <div className="league-match-modal-team-block league-match-modal-team-block--away" style={{ borderRightColor: awayColor }}>
              <div className="league-match-modal-team-bar league-match-modal-team-bar--away" style={{ display: 'flex' }}>
                <span style={{ flex: 1, background: awayColor, height: '100%' }} />
                {awaySecondary && <span style={{ width: '28%', background: awaySecondary, height: '100%' }} />}
              </div>
              <span className="league-match-modal-team-name">{match.awayTeam}</span>
              <div className="league-match-modal-cronologia-col">
                {awayGoalsSorted.map((min, i) => (
                  <span key={i} className="league-match-modal-gol-minuto">⚽ {formatMinute(min)}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="league-match-modal-meta">
            <span className="date">📅 Fecha: {match.date || '—'}</span>
            <span className="stadium">🏟️ Estadio: {match.stadium || '—'}</span>
          </div>
          <div className="league-match-modal-box">
            <span className="league-match-modal-box-label">Repetición:</span>
            {showRepeticion ? (
              <a href={repeticionUrl} target="_blank" rel="noopener noreferrer" className="league-match-modal-replay-link">
                Ver repetición
              </a>
            ) : (
              <span className="league-match-modal-no-replay">NO DISPONIBLE</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <article className="league-match-card">
        <button
          type="button"
          className="league-match-card-main"
          onClick={() => setModalOpen(true)}
          aria-label="Ver detalle del partido"
        >
          <div className="league-match-card-teams">
            <div
              className="league-match-card-team"
              style={{ borderLeftColor: localColor }}
            >
              <span className="league-match-card-team-name">{match.localTeam}</span>
              {isPlayed ? (
                <span className="league-match-card-score">{displayHome}</span>
              ) : (
                <span className="league-match-card-por-jugar">—</span>
              )}
            </div>
            <div
              className="league-match-card-team"
              style={{ borderLeftColor: awayColor }}
            >
              <span className="league-match-card-team-name">{match.awayTeam}</span>
              {isPlayed ? (
                <span className="league-match-card-score">{displayAway}</span>
              ) : (
                <span className="league-match-card-por-jugar">POR JUGAR</span>
              )}
            </div>
          </div>
          <div className="league-match-card-meta">
            <span className="date">📅 Fecha: {match.date || '—'}</span>
            <span className="stadium">🏟️ Estadio: {match.stadium || '—'}</span>
          </div>
        </button>
      </article>
      {typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
