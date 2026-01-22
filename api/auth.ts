import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserModel, UserDataModel } from '../lib/models';
import { INITIAL_TRANSACTIONS, CARD_SUFFIXES, CATEGORY_STRUCTURE } from '../constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS para evitar problemas de requisição
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log("API Auth: Iniciando processamento...");
    
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    if (!process.env.MONGODB_URI) {
      console.error("ERRO: MONGODB_URI não definida no ambiente.");
      return res.status(500).json({ message: 'Erro de configuração do servidor (DB)' });
    }

    console.log("API Auth: Conectando ao Banco de Dados...");
    await connectToDatabase();
    console.log("API Auth: Conectado com sucesso.");

    const { action, email, password, name } = req.body;

    if (action === 'login') {
      const user = await UserModel.findOne({ email, password });
      if (!user) {
        return res.status(401).json({ message: 'E-mail ou senha inválidos' });
      }
      return res.status(200).json({ 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email 
      });
    } 
    
    else if (action === 'register') {
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'E-mail já cadastrado' });
      }

      const newUser = await UserModel.create({
        name,
        email,
        password
      });

      // Cria dados iniciais
      try {
        await UserDataModel.create({
          userId: newUser._id.toString(),
          transactions: INITIAL_TRANSACTIONS,
          categories: CATEGORY_STRUCTURE,
          paymentMethods: [
            { name: 'DINHEIRO', isCreditCard: false },
            { name: 'PIX', isCreditCard: false },
            ...CARD_SUFFIXES.map(c => ({ name: c, isCreditCard: true }))
          ]
        });
      } catch (dataError) {
        console.error("Erro ao criar dados iniciais:", dataError);
      }

      return res.status(201).json({ 
        id: newUser._id.toString(), 
        name: newUser.name, 
        email: newUser.email 
      });
    }

    return res.status(400).json({ message: 'Ação inválida' });

  } catch (error: any) {
    console.error("Erro CRÍTICO na API:", error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message || 'Falha desconhecida' 
    });
  }
}