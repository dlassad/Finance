
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

    const { action, email, password, name, userId, currentPassword, newPassword, targetUserId, adminId } = req.body;

    // --- LOGIN ---
    if (action === 'login') {
      const user = await UserModel.findOne({ email, password });
      if (!user) {
        return res.status(401).json({ message: 'E-mail ou senha incorretos' });
      }
      
      const isAdmin = (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) || 
                      (user.name === 'Daniel Assad');

      return res.status(200).json({ 
        id: user._id.toString(), 
        name: user.name, 
        email: user.email,
        isAdmin: isAdmin,
        createdAt: user.createdAt
      });
    }

    // --- ALTERAR SENHA (PRÓPRIO USUÁRIO) ---
    else if (action === 'change_password') {
      if (!userId || !currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Dados incompletos.' });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      if (user.password !== currentPassword) {
        return res.status(401).json({ message: 'Senha atual incorreta.' });
      }

      user.password = newPassword;
      await user.save();

      return res.status(200).json({ message: 'Senha alterada com sucesso!' });
    }
    
    // --- ADMIN: LISTAR USUÁRIOS ---
    else if (action === 'get_users') {
      // Verifica se quem pede é admin
      const admin = await UserModel.findById(adminId);
      const isMaster = admin && ((admin.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) || (admin.name === 'Daniel Assad'));

      if (!isMaster) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      // Retorna todos os usuários, ocultando a senha
      const users = await UserModel.find({}, 'name email createdAt');
      return res.status(200).json({ users });
    }

    // --- ADMIN: ATUALIZAR USUÁRIO (RESET SENHA / EDITAR) ---
    else if (action === 'admin_update_user') {
      const admin = await UserModel.findById(adminId);
      const isMaster = admin && ((admin.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) || (admin.name === 'Daniel Assad'));

      if (!isMaster) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      const targetUser = await UserModel.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: 'Usuário alvo não encontrado.' });
      }

      if (name) targetUser.name = name;
      if (email) targetUser.email = email;
      if (newPassword) targetUser.password = newPassword; // Reset de senha pelo admin

      await targetUser.save();

      return res.status(200).json({ message: 'Usuário atualizado com sucesso.' });
    }

    // --- ADMIN: EXCLUIR USUÁRIO ---
    else if (action === 'admin_delete_user') {
      const admin = await UserModel.findById(adminId);
      const isMaster = admin && ((admin.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) || (admin.name === 'Daniel Assad'));

      if (!isMaster) {
        return res.status(403).json({ message: 'Acesso negado.' });
      }

      if (targetUserId === adminId) {
        return res.status(400).json({ message: 'Você não pode excluir a si mesmo.' });
      }

      await UserModel.findByIdAndDelete(targetUserId);
      await UserDataModel.deleteOne({ userId: targetUserId });

      return res.status(200).json({ message: 'Usuário excluído com sucesso.' });
    }
    
    // --- ADMIN CREATE USER ---
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
        message: 'Usuário criado com sucesso!',
        createdUser: { name: newUser.name, email: newUser.email }
      });
    }
    
    // --- LEGACY REGISTER ---
    else if (action === 'register') {
      if (email.toLowerCase() !== MASTER_EMAIL.toLowerCase()) {
         return res.status(403).json({ message: 'Auto-cadastro desabilitado. Contate o Administrador.' });
      }

      const existing = await UserModel.findOne({ email });
      
      if (existing) {
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
