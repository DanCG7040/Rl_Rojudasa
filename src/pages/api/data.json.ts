import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Marcar esta ruta como dinámica (no prerenderizada)
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('tournament-data');
    
    // Buscar el documento más reciente o crear uno por defecto
    let data = await collection.findOne({}, { sort: { _id: -1 } });
    
    // Si no hay datos, usar los datos por defecto del archivo local
    if (!data) {
      // Importar datos por defecto
      const defaultData = {
        bracket: {
          koPlayoffs: [],
          roundOf16: [],
          quarterFinals: [],
          semiFinals: [],
          final: { id: 'final', team1: { name: 'Por Definir', score: null }, team2: { name: 'Por Definir', score: null }, completed: false, date: 'Por Definir' }
        },
        league: { teams: [] },
        allTeams: [],
        leagues: [],
        upcomingMatches: [],
        leagueMatches: [],
        currentLeagueId: null,
        tournament: {
          type: 'groups',
          groups: [],
          knockoutRounds: {
            roundOf16: [],
            quarterFinals: [],
            semiFinals: [],
            final: null
          }
        }
      };
      
      // Guardar datos por defecto
      await collection.insertOne({ ...defaultData, createdAt: new Date() });
      data = defaultData;
    }
    
    // Remover _id y otros campos de MongoDB antes de devolver
    const { _id, createdAt, ...tournamentData } = data;
    
    return new Response(JSON.stringify(tournamentData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // Siempre datos recientes (tabla actual, etc.)
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ 
        error: 'Error al obtener los datos',
        details: errorMessage 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
