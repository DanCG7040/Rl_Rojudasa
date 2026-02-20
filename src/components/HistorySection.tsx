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

interface MatchLike {
  id?: string;
  team1?: { name: string; score: number | null };
  team2?: { name: string; score: number | null };
  completed?: boolean;
  date?: string;
}

interface Snapshot {
  bracket?: {
    koPlayoffs?: MatchLike[];
    roundOf16?: MatchLike[];
    quarterFinals?: MatchLike[];
    semiFinals?: MatchLike[];
    final?: MatchLike;
  };
  tournament?: {
    knockoutRounds?: {
      roundOf16?: MatchLike[];
      quarterFinals?: MatchLike[];
      semiFinals?: MatchLike[];
      final?: MatchLike | null;
    };
  };
  league?: { teams: Team[] };
}

interface HistoryResponse {
  liga: Snapshot | null;
  copa: Snapshot | null;
  error?: string;
}

type ViewMode = 'copa' | 'liga';

export default function HistorySection() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('copa');

  useEffect(() => {
    fetch('/api/history.json', { cache: 'no-store' })
      .then(res => res.json())
      .then((json: HistoryResponse) => {
        if (!json.error) setData(json);
        else setData({ liga: null, copa: null });
      })
      .catch(() => setData({ liga: null, copa: null }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="league-table-section" id="historico" style={{ padding: '60px 20px' }}>
        <div className="container">
          <h2 className="section-title">📜 Histórico</h2>
          <p style={{ textAlign: 'center', color: '#aaa' }}>Cargando...</p>
        </div>
      </section>
    );
  }

  const copaSnapshot = data?.copa ?? null;
  const ligaSnapshot = data?.liga ?? null;

  // Agrupar partidos por ronda (bracket + tournament) con títulos
  const roundConfig: { key: string; title: string; fromBracket: () => (MatchLike | null)[]; fromKnockout: () => (MatchLike | null)[] }[] = [
    { key: 'koPlayoffs', title: 'Ronda previa', fromBracket: () => [...(copaSnapshot?.bracket?.koPlayoffs ?? [])], fromKnockout: () => [] },
    { key: 'roundOf16', title: 'Octavos de final', fromBracket: () => [...(copaSnapshot?.bracket?.roundOf16 ?? [])], fromKnockout: () => [...(copaSnapshot?.tournament?.knockoutRounds?.roundOf16 ?? [])] },
    { key: 'quarterFinals', title: 'Cuartos de final', fromBracket: () => [...(copaSnapshot?.bracket?.quarterFinals ?? [])], fromKnockout: () => [...(copaSnapshot?.tournament?.knockoutRounds?.quarterFinals ?? [])] },
    { key: 'semiFinals', title: 'Semifinales', fromBracket: () => [...(copaSnapshot?.bracket?.semiFinals ?? [])], fromKnockout: () => [...(copaSnapshot?.tournament?.knockoutRounds?.semiFinals ?? [])] },
    { key: 'final', title: 'Final', fromBracket: () => (copaSnapshot?.bracket?.final ? [copaSnapshot.bracket.final] : []), fromKnockout: () => (copaSnapshot?.tournament?.knockoutRounds?.final ? [copaSnapshot.tournament.knockoutRounds.final] : []) }
  ];
  const copaByRounds = roundConfig.map(({ title, fromBracket, fromKnockout }) => {
    const matches = [...fromBracket(), ...fromKnockout()].filter(
      (m): m is MatchLike => Boolean(m != null && (m.team1?.name || m.team2?.name) && !(m.team1?.name === 'Por Definir' && m.team2?.name === 'Por Definir'))
    );
    return { title, matches };
  }).filter(r => r.matches.length > 0);
  const hasCopaBracket = copaByRounds.length > 0;
  const hasLigaTable = (ligaSnapshot?.league?.teams?.length ?? 0) > 0;

  const noData = !hasCopaBracket && !hasLigaTable;

  if (noData) {
    return (
      <section className="league-table-section" id="historico" style={{ padding: '60px 20px' }}>
        <div className="container">
          <h2 className="section-title">📜 Histórico</h2>
          <p style={{ textAlign: 'center', color: '#888' }}>No hay datos en el histórico todavía.</p>
        </div>
      </section>
    );
  }

  const ligaTeams = (ligaSnapshot?.league?.teams ?? []) as Team[];

  return (
    <section className="league-table-section" id="historico" style={{ padding: '60px 20px' }}>
      <div className="container">
        <h2 className="section-title">📜 Histórico</h2>
        <p style={{ textAlign: 'center', color: '#aaa', marginBottom: '24px' }}>
          Últimos resultados guardados de copa y liga.
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setView('copa')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: view === 'copa' ? '2px solid #ff6b35' : '2px solid #444',
              background: view === 'copa' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.05)',
              color: view === 'copa' ? '#ffd23f' : '#b0b0b0',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            🏆 Mostrar Copa
          </button>
          <button
            type="button"
            onClick={() => setView('liga')}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: view === 'liga' ? '2px solid #ff6b35' : '2px solid #444',
              background: view === 'liga' ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255,255,255,0.05)',
              color: view === 'liga' ? '#ffd23f' : '#b0b0b0',
              fontFamily: 'Orbitron, sans-serif',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            📊 Mostrar Liga
          </button>
        </div>

        {view === 'copa' && hasCopaBracket && (
          <div style={{
            background: 'rgba(26, 26, 26, 0.8)',
            border: '1px solid rgba(255, 107, 53, 0.2)',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {copaByRounds.map(({ title, matches }) => (
              <div key={title}>
                <h3 style={{ color: '#ffd23f', fontFamily: 'Orbitron, sans-serif', fontSize: '1rem', marginBottom: '12px', marginTop: 0 }}>
                  {title}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {matches.map((m: MatchLike) => (
                    <div
                      key={m.id ?? `${m.team1?.name}-${m.team2?.name}`}
                      style={{
                        background: '#0a0a0a',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        minWidth: '220px',
                        border: '1px solid #333'
                      }}
                    >
                      <div style={{ color: '#fff', fontFamily: 'Orbitron, sans-serif', fontSize: '0.9rem' }}>
                        {m.team1?.name ?? 'TBD'} {m.team1?.score != null ? m.team1.score : '-'} – {m.team2?.score != null ? m.team2.score : '-'} {m.team2?.name ?? 'TBD'}
                      </div>
                      {m.date && <div style={{ color: '#888', fontSize: '0.8rem', marginTop: '4px' }}>{m.date}</div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'copa' && !hasCopaBracket && (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay datos de copa en el histórico.</p>
        )}

        {view === 'liga' && hasLigaTable && (
          <>
            <h3 className="section-title" style={{ fontSize: '1.25rem', marginBottom: '16px' }}>TABLA DE HISTÓRICO</h3>
            <p style={{ color: '#aaa', marginBottom: '16px', textAlign: 'center' }}>Última tabla de liga guardada.</p>
            <div className="table-wrapper">
            <table className="league-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Equipo</th>
                  <th>J</th>
                  <th>V</th>
                  <th>E</th>
                  <th>D</th>
                  <th>GF</th>
                  <th>GC</th>
                  <th>DG</th>
                  <th>PTS</th>
                </tr>
              </thead>
              <tbody>
                {ligaTeams.map((t) => (
                  <tr key={t.name}>
                    <td className="position">{t.position}</td>
                    <td className="team-name">{t.name}</td>
                    <td>{t.played}</td>
                    <td>{t.wins}</td>
                    <td>{t.draws}</td>
                    <td>{t.losses}</td>
                    <td>{t.goalsFor}</td>
                    <td>{t.goalsAgainst}</td>
                    <td className={t.goalDifference >= 0 ? 'positive' : 'negative'}>
                      {t.goalDifference > 0 ? '+' : ''}{t.goalDifference}
                    </td>
                    <td><strong>{t.points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {view === 'liga' && !hasLigaTable && (
          <p style={{ textAlign: 'center', color: '#888' }}>No hay tabla de liga en el histórico.</p>
        )}
      </div>
    </section>
  );
}
