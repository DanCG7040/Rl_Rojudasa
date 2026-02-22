import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();
export const prerender = false;

const HISTORICO_ID = 'data';

const defaultTournamentData = {
  bracket: {
    koPlayoffs: [],
    roundOf16: [],
    quarterFinals: [],
    semiFinals: [],
    final: {
      id: 'final',
      team1: { name: 'Por Definir', score: null },
      team2: { name: 'Por Definir', score: null },
      completed: false,
      date: 'Por Definir'
    }
  },
  league: { teams: [] },
  upcomingMatches: [],
  leagueMatches: [],
  currentLeagueId: 'default',
  tournament: {
    type: 'groups' as const,
    groups: [],
    knockoutRounds: {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: null
    }
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('tournament-data');
    const historicoColl = db.collection('historico');

    let snapshot: Record<string, unknown> | null = null;
    let teams: any[] = [];

    try {
      const body = await request.json();
      if (body && body.league && Array.isArray(body.league.teams)) {
        snapshot = body;
        teams = body.league.teams;
      }
    } catch {
      // body vacío o no JSON: usar documento actual de la BD
    }

    if (!snapshot) {
      const current = await collection.findOne({}, { sort: { _id: -1 } });
      if (current) {
        const { _id, createdAt, ...rest } = current;
        snapshot = rest;
        teams = current.league?.teams ?? [];
      }
    }

    if (snapshot) {
      await historicoColl.updateOne(
        { _id: HISTORICO_ID },
        { $set: { copa: snapshot, copaUpdatedAt: new Date() } },
        { upsert: true }
      );
    }

    const keptTeams = Array.isArray(teams) && teams.length > 0
      ? teams.map((t: any) => ({
          position: t.position ?? 0,
          name: t.name ?? '',
          color: t.color,
          colorSecondary: t.colorSecondary,
          stadiumName: t.stadiumName,
          stadiumImage: t.stadiumImage,
          leaguesWon: t.leaguesWon,
          cupsWon: t.cupsWon,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0
        }))
      : [];

    await collection.insertOne({
      ...defaultTournamentData,
      league: { teams: keptTeams },
      createdAt: new Date()
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Copa guardada en Histórico y datos de copa eliminados. Los equipos se mantienen.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error resetting tournament:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al reiniciar el torneo', details: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
