import clientPromise from '../lib/mongodb';

export default async function handler(req: any, res: any) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: "Não autorizado" });

  try {
    const client = await clientPromise;
    const db = client.db("financeview");

    if (req.method === 'GET') {
      const transactions = await db.collection("transactions").find({ userId }).toArray();
      const settings = await db.collection("settings").findOne({ userId });
      return res.status(200).json({ 
        transactions: transactions.map(({ _id, ...rest }) => ({ ...rest, id: rest.id || _id.toString() })), 
        settings 
      });
    }

    if (req.method === 'POST') {
      const { transactions, settings } = req.body;
      
      if (transactions) {
        // Estratégia de sincronização: limpa e reinsere para manter paridade com a planilha
        await db.collection("transactions").deleteMany({ userId });
        if (transactions.length > 0) {
          const docs = transactions.map((t: any) => {
            const { _id, ...cleanT } = t;
            return { ...cleanT, userId };
          });
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

      return res.status(200).json({ message: "Dados sincronizados com sucesso" });
    }

    return res.status(405).json({ error: "Método não permitido" });
  } catch (error: any) {
    console.error("Transactions API Error:", error);
    return res.status(500).json({ error: "Erro ao processar dados no MongoDB" });
  }
}