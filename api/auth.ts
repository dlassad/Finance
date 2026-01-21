
import clientPromise from '../lib/mongodb';

export default async function handler(req, res) {
  const client = await clientPromise;
  const db = client.db("financeview");
  const { action, email, password, name } = req.body;

  if (req.method === 'POST') {
    if (action === 'register') {
      const existingUser = await db.collection("users").findOne({ email });
      if (existingUser) return res.status(400).json({ error: "E-mail já cadastrado." });

      const newUser = {
        email,
        password, // Em produção, use bcrypt.hash
        name,
        createdAt: new Date()
      };

      const result = await db.collection("users").insertOne(newUser);
      return res.status(201).json({ id: result.insertedId, email, name });
    }

    if (action === 'login') {
      const user = await db.collection("users").findOne({ email, password });
      if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos." });
      
      return res.status(200).json({ id: user._id, email: user.email, name: user.name });
    }
  }

  return res.status(405).end();
}
