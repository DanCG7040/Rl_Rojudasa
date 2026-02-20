import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

dotenv.config();
export const prerender = false;

const HISTORICO_ID = 'data';

/**
 * Devuelve el histórico guardado: liga (último snapshot al "Limpiar tabla")
 * y copa (último snapshot al "Eliminar datos de la copa").
 */
export const GET: APIRoute = async () => {
  try {
    const db = await getDatabase();
    const doc = await db.collection('historico').findOne({ _id: HISTORICO_ID });
    const liga = doc?.liga ?? null;
    const copa = doc?.copa ?? null;
    return new Response(
      JSON.stringify({ liga, copa }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
      }
    );
  } catch (error) {
    console.error('Error fetching history:', error);
    const msg = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(
      JSON.stringify({ error: 'Error al obtener histórico', details: msg, liga: null, copa: null }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
