
import { Transaction, EntryType, MonthlySummary } from './types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const getMonthYear = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date + (date.length === 7 ? '-01' : '')) : date;
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
};

export const calculateBusinessDueDate = (targetMonthDate: Date, dueDay: number): Date => {
  // Cria a data base no ano/mês selecionado com o dia de vencimento configurado
  const date = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth(), dueDay);
  
  const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

  // Se for Domingo (0), adiciona 1 dia (Segunda)
  if (dayOfWeek === 0) {
    date.setDate(date.getDate() + 1);
  }
  // Se for Sábado (6), adiciona 2 dias (Segunda)
  else if (dayOfWeek === 6) {
    date.setDate(date.getDate() + 2);
  }
  
  return date;
};

export const calculateDefaultBillingDate = (referenceDate: Date, bestDay?: number): string => {
  // Padrão: Compra no mês X, paga no mês X+1 (Fatura seguinte)
  // Ajuste o objeto Date para o mês seguinte
  let targetDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);

  // Regra do Melhor Dia: Se o dia da compra for >= melhor dia, a fatura só vem no outro mês (X+2)
  if (bestDay && referenceDate.getDate() >= bestDay) {
    targetDate.setMonth(targetDate.getMonth() + 1);
  }

  return `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
};

export const calculateProjections = (
  transactions: Transaction[],
  startBalance: number,
  monthsCount: number = 12,
  baseDate: Date = new Date()
): MonthlySummary[] => {
  const summaries: MonthlySummary[] = [];
  const startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);

  for (let i = 0; i < monthsCount; i++) {
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + i);
    const monthKey = getMonthYear(monthDate);

    // Definir o último dia do mês atual para comparação com endDate
    const lastDayOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

    const monthlyTransactions = transactions.filter(t => {
      // Verifica endDate: Se a transação tem data de fim e ela é anterior ao início deste mês, ignora.
      if (t.endDate) {
        const endD = new Date(t.endDate);
        // Ajusta para ignorar hora, compara apenas datas
        if (endD < new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)) {
            return false;
        }
      }

      let tDate: Date;
      if (t.billingDate) {
        tDate = new Date(t.billingDate + '-01T12:00:00');
      } else {
        tDate = new Date(t.date);
      }
      
      // Se a data de início da transação for no futuro em relação ao mês atual da projeção, ignora
      if (tDate > lastDayOfMonth) return false;

      if (t.isRecurring) return true;
      
      const isSameMonth = tDate.getMonth() === monthDate.getMonth() && tDate.getFullYear() === monthDate.getFullYear();
      if (isSameMonth) return true;
      
      if (t.installments) {
        const monthsDiff = (monthDate.getFullYear() - tDate.getFullYear()) * 12 + (monthDate.getMonth() - tDate.getMonth());
        const installmentInMonth = (t.installments.current + monthsDiff);
        return installmentInMonth >= 1 && installmentInMonth <= t.installments.total;
      }

      return false;
    });

    const calculateItemAmount = (t: Transaction) => {
      if (t.overrides && t.overrides[monthKey] !== undefined) {
        return t.overrides[monthKey];
      }
      return t.installments ? t.amount / t.installments.total : t.amount;
    };

    const income = monthlyTransactions
      .filter(t => t.type === EntryType.INCOME)
      .reduce((sum, t) => sum + calculateItemAmount(t), 0);
    
    const expense = monthlyTransactions
      .filter(t => t.type === EntryType.EXPENSE)
      .reduce((sum, t) => sum + calculateItemAmount(t), 0);

    const prevBalance = i === 0 ? startBalance : summaries[i - 1].balance;
    const balance = prevBalance + income + expense;

    summaries.push({
      month: monthKey,
      income,
      expense,
      balance,
      prevBalance
    });
  }

  return summaries;
};