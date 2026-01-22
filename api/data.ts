import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserDataModel } from '../lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    await connectToDatabase();
    
    // --- GET: RECUPERAR DADOS ---
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ message: 'UserId is required' });
      }

      console.log(`[API] Buscando dados para userId: ${userId}`);
      const data = await UserDataModel.findOne({ userId });
      
      if (!data) {
        console.log(`[API] Dados não encontrados para userId: ${userId}`);
        return res.status(404).json({ message: 'Dados não encontrados' });
      }

      return res.status(200).json(data);
    }

    // --- POST: SALVAR DADOS ---
    if (req.method === 'POST') {
      // Parsing seguro do body (caso venha como string)
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          console.error('[API] Erro ao fazer parse do body:', e);
          return res.status(400).json({ message: 'Invalid JSON body' });
        }
      }

      const { userId, transactions, categories, paymentMethods } = body;

      if (!userId) {
        console.error('[API] Tentativa de salvar sem userId');
        return res.status(400).json({ message: 'UserId required for saving' });
      }

      console.log(`[API] Salvando dados para userId: ${userId} | Transações: ${transactions?.length}`);

      // upsert: true -> cria se não existir, atualiza se existir
      const result = await UserDataModel.findOneAndUpdate(
        { userId },
        { 
          $set: {
            transactions: transactions || [],
            categories: categories || {},
            paymentMethods: paymentMethods || [],
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true, runValidators: false } // runValidators: false ajuda a evitar erros de schema estritos
      );

      console.log('[API] Dados salvos com sucesso.');
      return res.status(200).json({ success: true, id: result._id });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error("Erro CRÍTICO na API de Dados:", error);
    return res.status(500).json({ 
      message: 'Erro interno ao processar dados', 
      error: error.message 
    });
  }
}