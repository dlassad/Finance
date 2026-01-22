import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserDataModel } from '../lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração CORS (Crucial para permitir requisições do navegador)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Resposta imediata para preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    // GET: Recuperar dados
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) return res.status(400).json({ message: 'UserId required' });

      const data = await UserDataModel.findOne({ userId });
      
      if (!data) {
        // Se não achar dados, retorna 404 mas com corpo vazio para o front tratar
        return res.status(404).json({ message: 'Dados não encontrados' });
      }

      return res.status(200).json(data);
    }

    // POST: Salvar dados
    if (req.method === 'POST') {
      const { userId, transactions, categories, paymentMethods } = req.body;

      if (!userId) return res.status(400).json({ message: 'UserId required' });

      await UserDataModel.findOneAndUpdate(
        { userId },
        { 
          transactions, 
          categories, 
          paymentMethods,
          updatedAt: new Date()
        },
        { upsert: true, new: true } // Cria se não existir
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error("Erro na API de Dados:", error);
    return res.status(500).json({ message: 'Erro interno', error: error.message });
  }
}