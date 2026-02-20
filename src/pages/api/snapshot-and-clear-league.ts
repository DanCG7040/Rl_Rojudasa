import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();
export const prerender = false;

const HISTORICO_ID = 'data';

/**
 * Guarda el torneo actual en Histórico (liga) y luego inserta el mismo torneo
 * con la tabla de liga a cero. Así "Limpiar tabla" guarda los datos en Histórico
 * hasta que vuelvas a pulsar el botón (entonces se actualiza con los nuevos datos).
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

    const { _id, createdAt, ...snapshot } = current;

    // 1) Guardar en Histórico de liga (se reemplaza cada vez que se pulsa "Limpiar tabla")
    await historicoColl.updateOne(
      { _id: HISTORICO_ID },
      { $set: { liga: snapshot, ligaUpdatedAt: new Date() } },
      { upsert: true }
    );

    // 2) Insertar torneo actual con tabla a cero (mismos equipos, estadísticas en 0)
    const clearedTeams = (current.league.teams as any[]).map((t: any) => ({
      position: t.position ?? 0,
      name: t.name ?? '',
      color: t.color,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    }));
    const cleared = {
      bracket: snapshot.bracket,
      league: { teams: clearedTeams },
      upcomingMatches: snapshot.upcomingMatches ?? [],
      tournament: snapshot.tournament ?? {
        type: 'groups',
        groups: [],
        knockoutRounds: { roundOf16: [], quarterFinals: [], semiFinals: [], final: null }
      }
    };
    await collection.insertOne({ ...cleared, createdAt: new Date() });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabla General guardada en Tabla de histórico y limpiada.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error snapshot-and-clear-league:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al guardar histórico y limpiar tabla', details: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
