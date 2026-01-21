import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("financeview");
    const { action, email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (action === 'register') {
      const existingUser = await db.collection("users").findOne({ email: cleanEmail });
      if (existingUser) return res.status(400).json({ error: "E-mail já cadastrado." });

      const result = await db.collection("users").insertOne({
        email: cleanEmail,
        password, // Nota: Em sistemas reais, use bcrypt para hash de senhas
        name: name?.trim() || 'Usuário',
        createdAt: new Date()
      });

      return res.status(201).json({ 
        id: result.insertedId.toString(), 
        email: cleanEmail, 
        name: name?.trim() || 'Usuário' 
      });
    }

    if (action === 'login') {
      const user = await db.collection("users").findOne({ email: cleanEmail, password });
      if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos." });
      
      return res.status(200).json({ 
        id: user._id.toString(), 
        email: user.email, 
        name: user.name 
      });
    }

    return res.status(400).json({ error: "Ação inválida" });
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return res.status(500).json({ error: "Erro interno no servidor de autenticação" });
  }
}