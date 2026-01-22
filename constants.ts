
import { EntryType, Transaction } from './types';

// E-mail do Usuário Master (Admin)
export const MASTER_EMAIL = 'daniel.assad@finance.com';

// Removidos cartões específicos do usuário Master. Novos usuários devem cadastrar os seus.
export const CARD_SUFFIXES: string[] = [];

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

// Inicia sem transações para novos usuários.
export const INITIAL_TRANSACTIONS: Transaction[] = [];
