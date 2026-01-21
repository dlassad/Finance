
import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Plus, 
  LayoutGrid, 
  CreditCard as CreditCardIcon,
  CalendarDays,
  Menu,
  Activity,
  Settings as SettingsIcon,
  Tag,
  ChevronLeft,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';

import { Transaction, EntryType, CategorySummary, CardGroup, CategoryStructure, PaymentMethod } from './types';
import { INITIAL_TRANSACTIONS, CATEGORY_COLORS, CARD_SUFFIXES as DEFAULT_CARDS, CATEGORY_STRUCTURE as DEFAULT_CATEGORIES } from './constants';
import { formatCurrency, calculateProjections, getMonthYear } from './utils';
import { SummaryCard } from './components/SummaryCard';
import { TransactionTable } from './components/TransactionTable';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ProjectionGrid } from './components/ProjectionGrid';
import { ReconciliationModal } from './components/ReconciliationModal';
import { SettingsScreen } from './components/SettingsScreen';
import { AdjustmentModal } from './components/AdjustmentModal';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('financeview_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  // Estado unificado para formas de pagamento com migração automática
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(() => {
    const saved = localStorage.getItem('financeview_payment_methods');
    if (saved) return JSON.parse(saved);

    // Migração de cartões legados (string[]) para novo formato (PaymentMethod[])
    const savedLegacyCards = localStorage.getItem('financeview_cards');
    const legacyCards: string[] = savedLegacyCards ? JSON.parse(savedLegacyCards) : DEFAULT_CARDS;
    
    const initialMethods: PaymentMethod[] = [
      { name: 'DINHEIRO', isCreditCard: false },
      { name: 'PIX', isCreditCard: false },
      ...legacyCards.map(c => ({ name: c, isCreditCard: true }))
    ];
    return initialMethods;
  });

  const [categories, setCategories] = useState<CategoryStructure>(() => {
    const saved = localStorage.getItem('financeview_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'projections' | 'cards' | 'settings'>('dashboard');
  const [projectionMonths, setProjectionMonths] = useState(60);
  const [projectionStartDate, setProjectionStartDate] = useState(new Date());
  
  const [selectedCardDate, setSelectedCardDate] = useState(new Date());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [adjustingTransaction, setAdjustingTransaction] = useState<{t: Transaction, month: string} | null>(null);
  const [reconcilingCard, setReconcilingCard] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('financeview_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('financeview_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  useEffect(() => {
    localStorage.setItem('financeview_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    setProjectionStartDate(new Date());
  }, []);

  const currentMonthProjections = useMemo(() => 
    calculateProjections(transactions, 0, 120, projectionStartDate), 
    [transactions, projectionStartDate]
  );
  
  const filteredProjections = useMemo(() => 
    currentMonthProjections.slice(0, projectionMonths),
    [currentMonthProjections, projectionMonths]
  );

  const currentSummary = currentMonthProjections[0];

  // Filtra apenas métodos de pagamento que são cartões (possuem fatura)
  const creditCardsOnly = useMemo(() => 
    paymentMethods.filter(pm => pm.isCreditCard).map(pm => pm.name),
    [paymentMethods]
  );

  const cardSummaries: CardGroup[] = useMemo(() => {
    const targetMonthKey = getMonthYear(selectedCardDate);
    const groups: Record<string, Transaction[]> = {};
    
    const monthlyCardTransactions = transactions.filter(t => {
      if (!t.cardSuffix || t.type !== EntryType.EXPENSE) return false;
      
      // Verifica se a forma de pagamento desse lançamento ainda é considerada um cartão de crédito
      const method = paymentMethods.find(pm => pm.name === t.cardSuffix);
      if (!method || !method.isCreditCard) return false;

      let baseDate: Date;
      if (t.billingDate) {
        baseDate = new Date(t.billingDate + '-01T12:00:00');
      } else {
        baseDate = new Date(t.date);
      }

      if (t.isRecurring) return true;
      
      const isSameMonth = baseDate.getMonth() === selectedCardDate.getMonth() && baseDate.getFullYear() === selectedCardDate.getFullYear();
      if (isSameMonth) return true;

      if (t.installments) {
        const monthsDiff = (selectedCardDate.getFullYear() - baseDate.getFullYear()) * 12 + (selectedCardDate.getMonth() - baseDate.getMonth());
        const currentInstallment = t.installments.current + monthsDiff;
        return currentInstallment >= 1 && currentInstallment <= t.installments.total;
      }

      return false;
    });

    monthlyCardTransactions.forEach(t => {
      const suffix = t.cardSuffix!;
      if (!groups[suffix]) groups[suffix] = [];
      groups[suffix].push(t);
    });
    
    return Object.entries(groups).map(([suffix, txs]) => ({
      suffix,
      transactions: txs,
      total: txs.reduce((sum, t) => {
        if (t.overrides && t.overrides[targetMonthKey] !== undefined) {
          return sum + Math.abs(t.overrides[targetMonthKey]);
        }
        const installmentAmount = t.installments ? Math.abs(t.amount / t.installments.total) : Math.abs(t.amount);
        return sum + installmentAmount;
      }, 0)
    })).sort((a, b) => b.total - a.total);
  }, [transactions, selectedCardDate, paymentMethods]);

  const handleSaveTransaction = (data: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in data) {
      setTransactions(prev => prev.map(t => t.id === data.id ? (data as Transaction) : t));
    } else {
      const tx: Transaction = {
        ...data,
        id: Math.random().toString(36).substr(2, 9)
      };
      setTransactions(prev => [...prev, tx]);
    }
    setEditingTransaction(null);
  };

  const handleSaveOverride = (id: string, month: string, amount: number | null) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const newOverrides = { ...(t.overrides || {}) };
        if (amount === null) {
          delete newOverrides[month];
        } else {
          newOverrides[month] = amount;
        }
        return { ...t, overrides: newOverrides };
      }
      return t;
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleProjectionItemClick = (transaction: Transaction, monthKey: string) => {
    setAdjustingTransaction({ t: transaction, month: monthKey });
  };

  const handleToggleReconcile = (id: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === id ? { ...t, reconciled: !t.reconciled } : t
    ));
  };

  const changeCardMonth = (increment: number) => {
    const newDate = new Date(selectedCardDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setSelectedCardDate(newDate);
  };

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-200">
              <Wallet size={24} />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              FinanceView
            </h1>
          </div>

          <nav className="space-y-1.5 flex-1">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutGrid size={20} /><span>Painel Geral</span></button>
            <button onClick={() => { setActiveTab('projections'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'projections' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><CalendarDays size={20} /><span>Projeção</span></button>
            <button onClick={() => { setActiveTab('cards'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'cards' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><CreditCardIcon size={20} /><span>Cartões</span></button>
            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><SettingsIcon size={20} /><span>Configurações</span></button>
          </nav>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 md:px-8 py-4 flex items-center justify-between z-40">
          <div className="flex items-center space-x-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-50 rounded-xl md:hidden text-gray-500"><Menu size={24} /></button>
            <div className="flex items-center space-x-2 text-sm font-medium">
                <span className="text-gray-400">Início</span>
                <span className="text-gray-300">/</span>
                <span className="text-gray-700 capitalize">{activeTab}</span>
            </div>
          </div>
          <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-blue-200 font-bold flex items-center gap-2"><Plus size={18} /><span>Novo</span></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard title="Saldo Previsto" amount={filteredProjections[projectionMonths - 1]?.balance || 0} icon={<Activity size={20} />} />
                <SummaryCard title="Receitas (Mês)" amount={currentSummary.income} icon={<TrendingUp size={20} />} colorClass="text-green-600" />
                <SummaryCard title="Despesas (Mês)" amount={currentSummary.expense} icon={<TrendingDown size={20} />} colorClass="text-red-600" />
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50"><h3 className="text-xl font-bold text-gray-800">Lançamentos</h3></div>
                <TransactionTable transactions={transactions} onDelete={handleDeleteTransaction} onEdit={handleEditClick} />
              </div>
            </>
          )}

          {activeTab === 'projections' && (
            <ProjectionGrid 
              transactions={transactions} 
              summaries={filteredProjections} 
              projectionMonths={projectionMonths}
              setProjectionMonths={setProjectionMonths}
              projectionStartDate={projectionStartDate}
              setProjectionStartDate={setProjectionStartDate}
              categories={Object.keys(categories)}
              cards={creditCardsOnly}
              onEditClick={handleProjectionItemClick}
            />
          )}

          {activeTab === 'cards' && (
            <div className="space-y-8">
              <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center gap-6">
                <button onClick={() => changeCardMonth(-1)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-blue-600"><ChevronLeft size={24} /></button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={12} /> Competência da Fatura</span>
                  <span className="text-xl font-black text-gray-800 uppercase tracking-tighter">{getMonthYear(selectedCardDate)}</span>
                </div>
                <button onClick={() => changeCardMonth(1)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-blue-600"><ChevronRight size={24} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardSummaries.map((group) => (
                  <div key={group.suffix} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-b-4 border-b-gray-900 flex flex-col min-h-[400px]">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="bg-gray-900 p-3 rounded-2xl text-white"><CreditCardIcon size={24} /></div>
                        <h3 className="font-black text-xl text-gray-800 uppercase tracking-tighter">FINANCE {group.suffix}</h3>
                    </div>
                    
                    <div className="mb-6 pb-6 border-b border-gray-50">
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Fatura {getMonthYear(selectedCardDate)}</span>
                        <span className="text-3xl font-black text-red-600">{formatCurrency(group.total)}</span>
                    </div>

                    <div className="flex-1 mb-8 overflow-hidden flex flex-col">
                      <div className="flex items-center gap-2 mb-4">
                        <Tag size={14} className="text-gray-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Itens na Fatura</span>
                      </div>
                      <div className="space-y-3 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                        {group.transactions.map((t, idx) => {
                          const targetMonthKey = getMonthYear(selectedCardDate);
                          let displayAmount = Math.abs(t.amount);
                          let installmentText = "";

                          if (t.overrides && t.overrides[targetMonthKey] !== undefined) {
                            displayAmount = Math.abs(t.overrides[targetMonthKey]);
                          } else if (t.installments) {
                            displayAmount = Math.abs(t.amount / t.installments.total);
                            let baseDate = t.billingDate ? new Date(t.billingDate + '-01T12:00:00') : new Date(t.date);
                            const monthsDiff = (selectedCardDate.getFullYear() - baseDate.getFullYear()) * 12 + (selectedCardDate.getMonth() - baseDate.getMonth());
                            const currentInstallment = t.installments.current + monthsDiff;
                            installmentText = `(${currentInstallment}/${t.installments.total})`;
                          }

                          return (
                            <div key={idx} className="flex justify-between items-center group/tx">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-gray-700 group-hover/tx:text-blue-600 transition-colors">
                                  {t.description} {installmentText && <span className="text-blue-500 ml-1.5 opacity-70">{installmentText}</span>}
                                </span>
                                <span className="text-[9px] text-gray-400 font-medium">{t.category}</span>
                              </div>
                              <span className="text-xs font-black text-gray-800">{formatCurrency(displayAmount)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-auto pt-6 border-t border-dashed border-gray-200">
                      <button onClick={() => setReconcilingCard(group.suffix)} className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-black text-gray-700 transition-colors border border-gray-100 flex items-center justify-center gap-2">
                        <Activity size={16} /> CONFRONTAR FATURA
                      </button>
                    </div>
                  </div>
                ))}
                {cardSummaries.length === 0 && (
                   <div className="col-span-full py-20 text-center text-gray-300 italic">Nenhum cartão de crédito cadastrado ou com gastos neste mês.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && <SettingsScreen paymentMethods={paymentMethods} setPaymentMethods={setPaymentMethods} categories={categories} setCategories={setCategories} />}
        </div>
      </main>

      {isModalOpen && <AddTransactionModal onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} initialData={editingTransaction} paymentOptions={paymentMethods} categoryStructure={categories} />}
      {adjustingTransaction && <AdjustmentModal transaction={adjustingTransaction.t} monthKey={adjustingTransaction.month} onClose={() => setAdjustingTransaction(null)} onSaveOverride={handleSaveOverride} onEditOriginal={handleEditClick} />}
      {reconcilingCard && (
        <ReconciliationModal 
          cardSuffix={reconcilingCard} 
          transactions={transactions.filter(t => t.cardSuffix === reconcilingCard)} 
          selectedMonthDate={selectedCardDate}
          onClose={() => setReconcilingCard(null)} 
          onToggleReconcile={handleToggleReconcile} 
        />
      )}
    </div>
  );
};

export default App;
