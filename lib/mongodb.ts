
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const options = {};

if (!uri) {
  console.error("ERRO: MONGODB_URI não definida nas variáveis de ambiente!");
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // Use globalThis instead of global to fix "Cannot find name 'global'" error
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
