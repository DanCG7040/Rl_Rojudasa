// Script de prueba para verificar conexión a MongoDB
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '.env') });

async function testConnection() {
  console.log('🔍 Probando conexión a MongoDB...\n');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ Error: MONGODB_URI no está definida en .env');
    console.log('💡 Asegúrate de tener un archivo .env con MONGODB_URI');
    process.exit(1);
  }

  console.log('✅ MONGODB_URI encontrada');
  console.log(`📝 URI: ${process.env.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}\n`);

  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    console.log('🔄 Conectando a MongoDB Atlas...');
    
    await client.connect();
    console.log('✅ ¡Conexión exitosa!\n');

    const dbName = process.env.MONGODB_DB_NAME || 'rl-rojudasa';
    const db = client.db(dbName);
    console.log(`📊 Base de datos: ${dbName}`);

    // Probar escribir y leer datos
    const collection = db.collection('tournament-data');
    console.log('📝 Colección: tournament-data\n');

    // Verificar si hay datos existentes
    const count = await collection.countDocuments();
    console.log(`📈 Documentos existentes: ${count}`);

    if (count === 0) {
      console.log('💡 No hay datos aún. Esto es normal si es la primera vez.');
      console.log('   Los datos se crearán automáticamente cuando uses el panel de admin.\n');
    } else {
      const latest = await collection.findOne({}, { sort: { _id: -1 } });
      console.log('📄 Último documento:', JSON.stringify(latest, null, 2).substring(0, 200) + '...\n');
    }

    // Probar inserción de prueba
    console.log('🧪 Probando escritura...');
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Prueba de conexión'
    };
    
    const result = await collection.insertOne(testDoc);
    console.log(`✅ Escritura exitosa! ID: ${result.insertedId}`);

    // Eliminar documento de prueba
    await collection.deleteOne({ _id: result.insertedId });
    console.log('🧹 Documento de prueba eliminado\n');

    console.log('🎉 ¡Todo funciona correctamente!');
    console.log('✅ Puedes iniciar el servidor con: npm run dev');

  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(error.message);
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   1. Verifica que el usuario y contraseña en MONGODB_URI sean correctos');
      console.log('   2. Asegúrate de que el usuario tenga permisos en MongoDB Atlas');
    } else if (error.message.includes('timeout') || error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Posibles soluciones:');
      console.log('   1. Verifica tu conexión a internet');
      console.log('   2. Asegúrate de que tu IP está permitida en MongoDB Atlas Network Access');
      console.log('   3. Verifica que la URL de conexión es correcta');
    }
    
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

testConnection();
