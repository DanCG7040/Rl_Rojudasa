import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();
export const prerender = false;

const HISTORICO_ID = 'data';

/**
 * Marca la liga actual como Finalizada (con ganador), guarda en Histórico,
 * y deja la vista lista para crear una nueva liga (league/leagueMatches vacíos, currentLeagueId null).
 * Las ligas quedan almacenadas en el documento como entidades (leagues[]) con estado y ganador.
 */
export const POST: APIRoute = async () => {
  try {
    const db = await getDatabase();
    const collection = db.collection('tournament-data');
    const historicoColl = db.collection('historico');
    const current = await collection.findOne({}, { sort: { _id: -1 } });
    if (!current || !current.league?.teams?.length) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No hay datos de liga para guardar en histórico.',
          message: 'No hay tabla de liga o está vacía.'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const currentLeagueId = current.currentLeagueId ?? 'default';
    const leagues = Array.isArray(current.leagues) ? current.leagues.map((L: any) => ({ ...L })) : [];
    const idx = leagues.findIndex((L: any) => L.id === currentLeagueId);

    // Ganador = primero de la tabla general
    const winner = (current.league.teams as any[])[0]?.name ?? null;

    if (idx >= 0) {
      leagues[idx].status = 'Finalizada';
      leagues[idx].winner = winner;
      leagues[idx].standings = (current.league.teams as any[]).map((t: any) => ({ ...t }));
      leagues[idx].matches = Array.isArray(current.leagueMatches)
        ? (current.leagueMatches as any[]).filter((m: any) => (m.leagueId ?? 'default') === currentLeagueId).map((m: any) => ({ ...m }))
        : [];
    } else {
      // Si la liga actual no estaba en leagues (datos antiguos), añadirla como finalizada
      leagues.push({
        id: currentLeagueId,
        name: 'Liga finalizada',
        standings: (current.league.teams as any[]).map((t: any) => ({ ...t })),
        matches: Array.isArray(current.leagueMatches)
          ? (current.leagueMatches as any[]).filter((m: any) => (m.leagueId ?? 'default') === currentLeagueId).map((m: any) => ({ ...m }))
          : [],
        status: 'Finalizada',
        winner,
        createdAt: new Date().toISOString()
      });
    }

    // 1) Guardar en Histórico (snapshot con liga actual finalizada para "Mostrar Liga")
    const snapshotForHistory = {
      ...current,
      _id: undefined,
      createdAt: undefined,
      league: current.league,
      leagueMatches: current.leagueMatches,
      leagues,
      currentLeagueId
    };
    await historicoColl.updateOne(
      { _id: HISTORICO_ID },
      { $set: { liga: snapshotForHistory, ligaUpdatedAt: new Date() } },
      { upsert: true }
    );

    // 2) Nuevo documento: misma copa/torneo, liga vista vacía, currentLeagueId null, leagues con la liga finalizada
    const { _id, createdAt, ...rest } = current;
    const cleared = {
      ...rest,
      leagues,
      league: { teams: [] },
      leagueMatches: [],
      currentLeagueId: null,
      createdAt: new Date()
    };
    await collection.insertOne(cleared);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Liga finalizada. Tabla guardada en Histórico. Puedes crear una nueva liga cuando quieras.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error snapshot-and-clear-league:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al guardar histórico y finalizar liga', details: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
