import type { APIRoute } from 'astro';
import { getDatabase } from '../../lib/mongodb';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Marcar esta ruta como dinámica (no prerenderizada)
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('📥 RECIBIENDO PETICIÓN DE GUARDADO');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🌐 URL:', request.url);
    console.log('📋 Método:', request.method);
    console.log('📦 Content-Type:', request.headers.get('content-type'));
    console.log('📏 Content-Length:', request.headers.get('content-length'));
    
    // Leer el cuerpo del request
    let data;
    try {
      console.log('📖 Leyendo cuerpo de la petición...');
      console.log('🔍 Request body disponible:', !!request.body);
      console.log('🔍 Request bodyUsed:', (request as any).bodyUsed);
      
      // Intentar leer como texto primero para debug
      const bodyText = await request.text();
      console.log('📏 Longitud del cuerpo leído:', bodyText.length, 'caracteres');
      console.log('📄 Primeros 200 caracteres:', bodyText.substring(0, 200));
      
      if (!bodyText || bodyText.trim().length === 0) {
        console.error('❌ ERROR: El cuerpo está vacío');
        return new Response(
          JSON.stringify({ 
            error: 'Error al procesar los datos',
            details: 'El cuerpo de la petición está vacío',
            contentType: request.headers.get('content-type'),
            contentLength: request.headers.get('content-length')
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      
      // Parsear el JSON desde el texto
      console.log('🔄 Parseando JSON desde texto...');
      data = JSON.parse(bodyText);
      console.log('✅ JSON parseado correctamente');
      console.log('📊 Estructura de datos recibida:', {
        hasBracket: !!data.bracket,
        hasLeague: !!data.league,
        hasUpcomingMatches: !!data.upcomingMatches,
        bracketKeys: data.bracket ? Object.keys(data.bracket) : [],
        leagueTeams: data.league?.teams?.length || 0,
        upcomingMatches: data.upcomingMatches?.length || 0
      });
    } catch (error) {
      console.error('❌ ERROR al procesar el cuerpo');
      console.error('🔍 Error:', error);
      console.error('🔍 Tipo:', error?.constructor?.name);
      console.error('🔍 Mensaje:', error instanceof Error ? error.message : String(error));
      console.error('🔍 Stack:', error instanceof Error ? error.stack : 'N/A');
      
      return new Response(
        JSON.stringify({ 
          error: 'Error al procesar los datos',
          details: `Error al leer el cuerpo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
          contentType: request.headers.get('content-type'),
          contentLength: request.headers.get('content-length')
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validar que los datos tengan la estructura correcta
    console.log('🔍 Validando estructura de datos...');
    if (!data.bracket || !data.league || !data.upcomingMatches) {
      console.error('❌ ERROR: Estructura de datos inválida');
      console.error('📋 Campos presentes:', {
        bracket: !!data.bracket,
        league: !!data.league,
        upcomingMatches: !!data.upcomingMatches,
        allKeys: Object.keys(data)
      });
      return new Response(
        JSON.stringify({ 
          error: 'Estructura de datos inválida',
          details: 'Faltan campos requeridos: bracket, league o upcomingMatches'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    console.log('✅ Estructura de datos válida');
    console.log('🔌 Conectando a MongoDB...');
    
    const db = await getDatabase();
    const collection = db.collection('tournament-data');
    console.log('✅ Conexión a MongoDB exitosa');
    console.log('💾 Guardando datos en la colección...');
    
    // Guardar los nuevos datos
    const result = await collection.insertOne({
      ...data,
      createdAt: new Date()
    });
    
    console.log('✅ Datos guardados exitosamente');
    console.log('🆔 ID del documento:', result.insertedId);
    console.log('═══════════════════════════════════════════════════════');
    
    if (result.insertedId) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Datos guardados correctamente',
          id: result.insertedId.toString()
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      console.error('No se obtuvo ID de inserción');
      return new Response(
        JSON.stringify({ error: 'Error al guardar los datos', details: 'No se obtuvo ID de inserción' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('═══════════════════════════════════════════════════════');
    console.error('❌ ERROR GENERAL AL GUARDAR');
    console.error('═══════════════════════════════════════════════════════');
    console.error('🔍 Tipo de error:', error?.constructor?.name || 'Desconocido');
    console.error('📝 Mensaje:', error instanceof Error ? error.message : String(error));
    console.error('📚 Stack:', error instanceof Error ? error.stack : 'N/A');
    console.error('🔍 Error completo:', error);
    console.error('═══════════════════════════════════════════════════════');
    
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return new Response(
      JSON.stringify({ 
        error: 'Error al guardar los datos',
        details: errorMessage,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
