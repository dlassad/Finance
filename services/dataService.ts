import { Transaction, User, PaymentMethod, CategoryStructure } from '../types';
import { INITIAL_TRANSACTIONS, CARD_SUFFIXES, CATEGORY_STRUCTURE } from '../constants';

const LOCAL_STORAGE_KEY = 'financeview_db';

// Simula delay de rede para feedback visual quando usando modo offline
const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

export interface AppData {
  transactions: Transaction[];
  settings: {
    paymentMethods: PaymentMethod[];
    categories: CategoryStructure;
  };
}

export const dataService = {
  async login(email: string, password: string): Promise<User> {
    // Tenta autenticar na API
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password })
      });
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn("API Auth indisponível, usando modo offline simulado.");
    }

    // Fallback Local (Simulação para demonstração)
    await delay(1000);
    // Em um app real offline, validaríamos contra um hash local ou apenas liberaríamos o acesso aos dados locais
    return { 
      id: 'local-user-' + email, 
      email: email, 
      name: email.split('@')[0].toUpperCase() 
    };
  },

  async register(email: string, password: string, name: string): Promise<User> {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', email, password, name })
      });
      if (response.ok) return await response.json();
    } catch (e) {
      console.warn("API Auth indisponível, registrando localmente.");
    }

    await delay(1000);
    return { 
      id: 'local-user-' + email, 
      email: email, 
      name: name 
    };
  },

  async fetchData(userId: string): Promise<AppData> {
    // Tenta buscar da Nuvem
    try {
      const response = await fetch('/api/transactions', {
        headers: { 'x-user-id': userId }
      });
      if (response.ok) {
        const data = await response.json();
        // Salva cópia local ao receber da nuvem com sucesso
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        
        // Normaliza retorno
        return {
            transactions: data.transactions || [],
            settings: data.settings || { 
                paymentMethods: [
                    { name: 'DINHEIRO', isCreditCard: false },
                    { name: 'PIX', isCreditCard: false },
                    ...CARD_SUFFIXES.map(c => ({ name: c, isCreditCard: true }))
                ],
                categories: CATEGORY_STRUCTURE
            }
        };
      }
    } catch (e) {
      console.warn("API indisponível, carregando dados locais.");
    }

    // Fallback: Carrega do LocalStorage
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      return JSON.parse(local);
    }

    // Fallback Final: Dados Iniciais (Primeiro acesso offline)
    return {
      transactions: INITIAL_TRANSACTIONS,
      settings: {
        paymentMethods: [
          { name: 'DINHEIRO', isCreditCard: false },
          { name: 'PIX', isCreditCard: false },
          ...CARD_SUFFIXES.map(c => ({ name: c, isCreditCard: true }))
        ],
        categories: CATEGORY_STRUCTURE
      }
    };
  },

  async syncData(userId: string, data: AppData): Promise<void> {
    // 1. Salva Localmente (Garante persistência imediata)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));

    // 2. Tenta Sincronizar com a Nuvem (Background)
    try {
      await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': userId 
        },
        body: JSON.stringify(data)
      });
    } catch (e) {
      console.warn("Sincronização com nuvem falhou, dados salvos localmente.");
      // Aqui poderíamos implementar uma fila de sync para quando a internet voltar
    }
  }
};
