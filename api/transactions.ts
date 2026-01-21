
import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  try {
    const client = await clientPromise;
    const db = client.db("financeview");
    const userId = req.headers['x-user-id'];

    if (!userId) return res.status(401).json({ error: "Não autorizado" });

    if (req.method === 'GET') {
      const transactions = await db.collection("transactions").find({ userId }).toArray();
      const settings = await db.collection("settings").findOne({ userId });
      return res.status(200).json({ transactions, settings });
    }

    if (req.method === 'POST') {
      const { transactions, settings } = req.body;
      
      if (transactions) {
        // Limpa e reinsere para garantir sincronia total (estilo planilha)
        await db.collection("transactions").deleteMany({ userId });
        if (transactions.length > 0) {
          const docs = transactions.map((t: any) => ({ ...t, userId }));
          await db.collection("transactions").insertMany(docs);
        }
      }

      if (settings) {
        await db.collection("settings").updateOne(
          { userId },
          { $set: { ...settings, userId, updatedAt: new Date() } },
          { upsert: true }
        );
      }

      return res.status(200).json({ message: "Sincronizado" });
    }

    return res.status(405).end();
  } catch (error: any) {
    console.error("Transactions API Error:", error);
    return res.status(500).json({ error: "Erro ao processar dados no MongoDB" });
  }
}
