
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

    const monthlyTransactions = transactions.filter(t => {
      let tDate: Date;
      if (t.billingDate) {
        tDate = new Date(t.billingDate + '-01T12:00:00');
      } else {
        tDate = new Date(t.date);
      }
      
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
