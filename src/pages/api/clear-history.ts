import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();
export const prerender = false;

const HISTORICO_ID = 'data';

/** Elimina el histórico guardado (liga y copa). No toca tournament-data. */
export const POST: APIRoute = async () => {
  try {
    const db = await getDatabase();
    const result = await db.collection('historico').deleteOne({ _id: HISTORICO_ID });
    return new Response(
      JSON.stringify({
        success: true,
        deleted: result.deletedCount,
        message: result.deletedCount ? 'Histórico de liga y copa eliminado.' : 'No había histórico que limpiar.'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error clearing history:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al limpiar histórico', details: msg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
