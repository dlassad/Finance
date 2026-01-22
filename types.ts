
export enum EntryType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface PaymentMethod {
  name: string;
  isCreditCard: boolean;
  dueDay?: number;
  bestDay?: number;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: EntryType;
  category: string;
  subcategory: string;
  cardSuffix?: string; 
  date: string;
  endDate?: string; // Novo campo para definir fim da recorrência
  billingDate?: string;
  installments?: {
    current: number;
    total: number;
  };
  isRecurring: boolean;
  overrides?: Record<string, number>;
  color?: string;
  fontColor?: string;
  reconciled?: boolean;
}

export interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
  balance: number;
  prevBalance: number;
  [key: string]: string | number | undefined;
}

export interface CardGroup {
  suffix: string;
  total: number;
  transactions: Transaction[];
  paymentMethod?: PaymentMethod;
}

export interface CategorySummary {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number | undefined;
}

export type CategoryStructure = Record<string, string[]>;