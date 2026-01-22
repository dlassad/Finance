
import type { VercelRequest, VercelResponse } from '@vercel/node';
import connectToDatabase from '../lib/mongodb';
import { UserModel, UserDataModel } from '../lib/models';
import { INITIAL_TRANSACTIONS, CATEGORY_STRUCTURE, MASTER_EMAIL } from '../constants';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configuração CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Resposta rápida para preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Método não permitido' });
    }

    if (!process.env.MONGODB_URI) {
      console.error("ERRO: MONGODB_URI não definida.");
      return res.status(500).json({ message: 'Erro de configuração do servidor (DB Missing)' });
    }

    try {
      await connectToDatabase();
    } catch (dbError: any) {
      console.error("Erro de Conexão MongoDB:", dbError);
      return res.status(500).json({ 
        message: 'Falha ao conectar no Banco de Dados', 
        error: dbError.message 
      });
    }

    const { action, email, password, name } = req.body;

    // --- LOGIN ---
    if (action === 'login') {
      const user = await UserModel.findOne({ email, password });
      if (!user) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }
      
      // Verifica se é admin: por email (case insensitive) OU pelo nome "Daniel Assad"
      const isAdmin = (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) || 
                      (user.name === 'Daniel Assad');

      return res.status(200).json({ 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email,
        isAdmin: isAdmin
      });
    } 
    
    // --- ADMIN CREATE USER (Chamado via SettingsScreen pelo Master) ---
    else if (action === 'admin_create_user') {
      const existing = await UserModel.findOne({ email });
      if (existing) {
        return res.status(400).json({ message: 'Este e-mail já possui cadastro.' });
      }

      const newUser = await UserModel.create({
        name,
        email,
        password
      });

      // Criação dos dados iniciais padrão (LIMPO para novos usuários)
      try {
        await UserDataModel.create({
          userId: newUser._id.toString(),
          transactions: [], // Começa vazio
          categories: CATEGORY_STRUCTURE, // Mantém categorias padrão
          paymentMethods: [
            { name: 'DINHEIRO', isCreditCard: false },
            { name: 'PIX', isCreditCard: false }
            // Removido CARD_SUFFIXES para não injetar cartões do Master
          ]
        });
      } catch (dataError) {
        console.error("Erro ao criar dados iniciais:", dataError);
      }

      // Retorna sucesso mas NÃO faz login (não retorna ID de sessão para o master virar esse user)
      return res.status(201).json({ 
        message: 'Usuário criado com sucesso!',
        createdUser: { name: newUser.name, email: newUser.email }
      });
    }
    
    // --- LEGACY REGISTER (Mantido apenas para permitir que o Master se cadastre se o banco estiver vazio) ---
    else if (action === 'register') {
      // Bloqueia auto-cadastro público, exceto se for o Master Email tentando se registrar
      if (email.toLowerCase() !== MASTER_EMAIL.toLowerCase()) {
         return res.status(403).json({ message: 'Auto-cadastro desabilitado. Contate o Administrador.' });
      }

      const existing = await UserModel.findOne({ email });
      
      if (existing) {
        // Verifica usuário zumbi (sem dados)
        const hasData = await UserDataModel.findOne({ userId: existing._id.toString() });
        if (!hasData) {
          await UserModel.deleteOne({ _id: existing._id });
        } else {
          return res.status(400).json({ message: 'Master já cadastrado. Faça login.' });
        }
      }

      const newUser = await UserModel.create({ name, email, password });

      try {
        await UserDataModel.create({
          userId: newUser._id.toString(),
          transactions: [], 
          categories: CATEGORY_STRUCTURE,
          paymentMethods: [
            { name: 'DINHEIRO', isCreditCard: false },
            { name: 'PIX', isCreditCard: false }
          ]
        });
      } catch (dataError) {
        console.error("Erro ao criar dados iniciais:", dataError);
      }

      return res.status(201).json({ 
        id: newUser._id.toString(), 
        name: newUser.name, 
        email: newUser.email,
        isAdmin: true 
      });
    }

    return res.status(400).json({ message: 'Ação inválida' });

  } catch (error: any) {
    console.error("Erro Geral na API:", error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor', 
      error: error.message || 'Erro desconhecido' 
    });
  }
}
