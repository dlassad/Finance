import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserDataModel } from '../lib/models';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    await connectToDatabase();
    
    // GET: Recuperar dados
    if (req.method === 'GET') {
      const { userId } = req.query;
      
      if (!userId) return res.status(400).json({ message: 'UserId required' });

      const data = await UserDataModel.findOne({ userId });
      
      if (!data) {
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
        { upsert: true, new: true }
      );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ message: 'Method not allowed' });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno', error: error.message });
  }
}