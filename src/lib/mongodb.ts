import { MongoClient, Db } from 'mongodb';

// Cargar variables de entorno en desarrollo si no están disponibles
if (typeof process !== 'undefined' && process.env && !process.env.MONGODB_URI) {
  try {
    // Intentar cargar dotenv solo si MONGODB_URI no está disponible
    const dotenv = require('dotenv');
    dotenv.config();
  } catch (e) {
    // dotenv no disponible o ya cargado
  }
}

const options = {};

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  if (typeof process === 'undefined' || !process.env) {
    throw new Error('MongoDB solo puede usarse en el servidor. Las variables de entorno no están disponibles en el navegador.');
  }
  
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI no encontrada. Variables disponibles:', Object.keys(process.env).filter(k => k.includes('MONGO')).join(', ') || 'ninguna');
    throw new Error('Por favor, añade MONGODB_URI a tus variables de entorno (archivo .env en la raíz del proyecto). Reinicia el servidor después de crear el archivo .env');
  }

  const uri = process.env.MONGODB_URI;

  if (process.env.NODE_ENV === 'development') {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };
    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = new MongoClient(uri, options).connect();
    }
    return globalWithMongo._mongoClientPromise;
  }

  if (!clientPromise) {
    clientPromise = new MongoClient(uri, options).connect();
  }
  return clientPromise;
}

export async function getDatabase(): Promise<Db> {
  const client = await getClientPromise();
  const dbName = process.env.MONGODB_DB_NAME || 'rl-rojudasa';
  return client.db(dbName);
}

export default getClientPromise;
