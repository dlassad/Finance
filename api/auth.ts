import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserModel, UserDataModel } from '../lib/models';
import { INITIAL_TRANSACTIONS, CARD_SUFFIXES, CATEGORY_STRUCTURE } from '../constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await connectToDatabase();
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

      // Inicializa os dados padrão para o novo usuário
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

      return res.status(201).json({ 
        id: newUser._id.toString(), 
        name: newUser.name, 
        email: newUser.email 
      });
    }

    return res.status(400).json({ message: 'Ação inválida' });

  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: 'Erro interno do servidor', error: error.message });
  }
}