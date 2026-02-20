import type { APIRoute } from 'astro';
import { getDatabase } from '../../../lib/mongodb';
import crypto from 'node:crypto';
import dotenv from 'dotenv';

dotenv.config();

export const prerender = false;

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password, 'utf8').digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Usuario y contraseña son requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('admin');

    let admin = await collection.findOne({});

    if (!admin) {
      const defaultUsername = 'takercup';
      const defaultPasswordHash = hashPassword('danielito101');
      await collection.insertOne({
        username: defaultUsername,
        passwordHash: defaultPasswordHash,
        createdAt: new Date()
      });
      admin = { username: defaultUsername, passwordHash: defaultPasswordHash };
    }

    const passwordHash = hashPassword(password);
    if (admin.username === username && admin.passwordHash === passwordHash) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Usuario o contraseña incorrectos' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en login admin:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al validar credenciales',
        details: error instanceof Error ? error.message : 'Error desconocido'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
