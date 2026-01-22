import mongoose from 'mongoose';

// Interface para o cache global do Mongoose
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Inicializa o cache global
let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  // LER A VARIÁVEL DENTRO DA FUNÇÃO
  // Isso previne erros se a variável não estiver disponível no escopo global durante o build
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('A variável de ambiente MONGODB_URI não está definida. Verifique o painel do Vercel.');
  }

  // Se já houver uma conexão ativa, retorna ela
  if (cached.conn) {
    return cached.conn;
  }

  // Se não houver promessa de conexão, cria uma
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;