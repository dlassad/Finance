import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const options = {};

if (!uri) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Por favor, defina a variável de ambiente MONGODB_URI');
  }
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === 'development') {
  if (!globalThis._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalThis._mongoClientPromise = client.connect();
  }
  clientPromise = globalThis._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;