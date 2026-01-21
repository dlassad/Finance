
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const options = {};

if (!uri) {
  throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Use globalThis instead of global to ensure cross-platform compatibility and fix TypeScript errors
  let globalWithMongo = globalThis as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
