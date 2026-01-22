
import { EntryType, Transaction } from './types';

// E-mail do Usuário Master (Admin)
export const MASTER_EMAIL = 'daniel.assad@finance.com';

export const CARD_SUFFIXES = ['MLI', 'SSG', 'AMZ', 'NUB', 'TINA'];

export const CATEGORY_STRUCTURE: Record<string, string[]> = {
  'Alimentação': ['Supermercado', 'Restaurantes', 'Delivery', 'Lanches'],
  'Moradia': ['Aluguel', 'Condomínio', 'Energia', 'Água', 'Internet', 'Manutenção'],
  'Transporte': ['Combustível', 'Uber/99', 'Estacionamento', 'Seguro Auto', 'Manutenção'],
  'Saúde': ['Farmácia', 'Consulta', 'Exames', 'Plano de Saúde'],
  'Lazer': ['Cinema', 'Viagens', 'Hobbies', 'Assinaturas (Streaming)'],
  'Investimentos': ['Ações', 'Tesouro Direto', 'Cripto', 'Reserva Emergência'],
  'Educação': ['Faculdade', 'Cursos', 'Livros', 'Mensalidade Escolar'],
  'Salário': ['Principal', 'Bônus', 'Freelance'],
  'Outros': ['Diversos', 'Presentes', 'Impostos']
};

export const CATEGORIES = Object.keys(CATEGORY_STRUCTURE);

export const CATEGORY_COLORS: Record<string, string> = {
  'Alimentação': '#ef4444',
  'Moradia': '#6366f1',
  'Transporte': '#10b981',
  'Saúde': '#3b82f6',
  'Lazer': '#f59e0b',
  'Investimentos': '#8b5cf6',
  'Educação': '#ec4899',
  'Salário': '#22c55e',
  'Outros': '#94a3b8'
};

export const BG_COLORS = [
  { name: 'Padrão', class: 'bg-white border-gray-200' },
  { name: 'Vermelho Vivo', class: 'bg-red-600' },
  { name: 'Vermelho Suave', class: 'bg-red-100' },
  { name: 'Verde Vivo', class: 'bg-emerald-600' },
  { name: 'Verde Suave', class: 'bg-green-100' },
  { name: 'Azul Real', class: 'bg-blue-700' },
  { name: 'Azul Suave', class: 'bg-blue-100' },
  { name: 'Amarelo Ouro', class: 'bg-yellow-400' },
  { name: 'Amarelo Suave', class: 'bg-yellow-100' },
  { name: 'Laranja Forte', class: 'bg-orange-500' },
  { name: 'Laranja Suave', class: 'bg-orange-100' },
  { name: 'Roxo Profundo', class: 'bg-purple-800' },
  { name: 'Roxo Suave', class: 'bg-purple-100' },
  { name: 'Rosa Vibrante', class: 'bg-pink-500' },
  { name: 'Rosa Suave', class: 'bg-pink-100' },
  { name: 'Ciano', class: 'bg-cyan-200' },
  { name: 'Preto Noite', class: 'bg-gray-900' },
  { name: 'Cinza Metal', class: 'bg-slate-500' },
  { name: 'Marrom Terra', class: 'bg-amber-900' },
  { name: 'Índigo', class: 'bg-indigo-600' },
];

export const TEXT_COLORS = [
  { name: 'Escuro', class: 'text-gray-900' },
  { name: 'Branco', class: 'text-white' },
  { name: 'Amarelo', class: 'text-yellow-300' },
  { name: 'Vermelho', class: 'text-red-400' },
  { name: 'Ciano', class: 'text-cyan-300' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'JAMILLY', amount: 4804.71, type: EntryType.INCOME, category: 'Salário', subcategory: 'Principal', date: '2026-01-01', isRecurring: true },
  { id: '2', description: 'PRONAMPE - 30/37', amount: -387.28, type: EntryType.EXPENSE, category: 'Outros', subcategory: 'Diversos', date: '2026-01-01', isRecurring: false, installments: { current: 30, total: 37 }, color: 'bg-orange-200' },
  { id: '3', description: 'PLANO DE SAÚDE', amount: -140.18, type: EntryType.EXPENSE, category: 'Saúde', subcategory: 'Plano de Saúde', date: '2026-01-01', isRecurring: true },
  { id: '4', description: 'GASOLINA AMZ', amount: -293.89, type: EntryType.EXPENSE, category: 'Transporte', subcategory: 'Combustível', date: '2026-01-01', isRecurring: false, cardSuffix: 'AMZ' },
  { id: '5', description: 'EBR + RADIOWAVE', amount: -71.92, type: EntryType.EXPENSE, category: 'Lazer', subcategory: 'Assinaturas (Streaming)', date: '2026-01-01', isRecurring: true },
  { id: '6', description: 'PRATOS - 3/10 - MLI', amount: -22.92, type: EntryType.EXPENSE, category: 'Outros', subcategory: 'Diversos', date: '2026-01-01', isRecurring: false, installments: { current: 3, total: 10 }, cardSuffix: 'MLI' },
  { id: '7', description: 'NETFLIX - AMZ', amount: -23.96, type: EntryType.EXPENSE, category: 'Lazer', subcategory: 'Assinaturas (Streaming)', date: '2026-01-01', isRecurring: true, cardSuffix: 'AMZ' },
  { id: '8', description: 'MERCADO', amount: -233.24, type: EntryType.EXPENSE, category: 'Alimentação', subcategory: 'Supermercado', date: '2026-01-01', isRecurring: false },
  { id: '9', description: 'BEBÊ - 14/18 - MLI', amount: -227.10, type: EntryType.EXPENSE, category: 'Educação', subcategory: 'Cursos', date: '2026-01-01', isRecurring: false, installments: { current: 14, total: 18 }, cardSuffix: 'MLI' },
  { id: '10', description: 'SMART TV - 7/12 - NUB', amount: -91.51, type: EntryType.EXPENSE, category: 'Lazer', subcategory: 'Hobbies', date: '2026-01-01', isRecurring: false, installments: { current: 7, total: 12 }, cardSuffix: 'NUB' },
  { id: '11', description: 'CARRO - 18/48', amount: -1000.09, type: EntryType.EXPENSE, category: 'Transporte', subcategory: 'Manutenção', date: '2026-01-01', isRecurring: false, installments: { current: 18, total: 48 }, color: 'bg-purple-200' },
  { id: '12', description: 'IPVA 01/06', amount: -129.62, type: EntryType.EXPENSE, category: 'Outros', subcategory: 'Impostos', date: '2026-04-01', isRecurring: false, installments: { current: 1, total: 6 }, color: 'bg-red-500' },
];
