import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  LogOut,
  User as UserIcon,
  Loader2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

import { Transaction, EntryType, CardGroup, CategoryStructure, PaymentMethod, User } from './types';
import { calculateProjections, getMonthYear, formatCurrency, calculateBusinessDueDate } from './utils';
import { SummaryCard } from './components/SummaryCard';
import { TransactionTable } from './components/TransactionTable';
import { AddTransactionModal } from './components/AddTransactionModal';
import { ProjectionGrid } from './components/ProjectionGrid';
import { ReconciliationModal } from './components/ReconciliationModal';
import { SettingsScreen } from './components/SettingsScreen';
import { AdjustmentModal } from './components/AdjustmentModal';
import { AuthScreen } from './components/AuthScreen';
import { INITIAL_TRANSACTIONS, CARD_SUFFIXES, CATEGORY_STRUCTURE } from './constants';

const App: React.FC = () => {
  // Removido o uso de localStorage para iniciar o estado
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(false); // Novo estado para erro de salvamento
  const [dataLoaded, setDataLoaded] = useState(false);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<CategoryStructure>({});

  const [activeTab, setActiveTab] = useState<'dashboard' | 'projections' | 'cards' | 'settings'>('dashboard');
  const [projectionMonths, setProjectionMonths] = useState(60);
  const [projectionStartDate, setProjectionStartDate] = useState(new Date());
  const [selectedCardDate, setSelectedCardDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [adjustingTransaction, setAdjustingTransaction] = useState<{t: Transaction, month: string} | null>(null);
  const [reconcilingCard, setReconcilingCard] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Estado para seleção múltipla na tabela
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<Set<string>>(new Set());

  // Carregar dados da API
  useEffect(() => {
    async function loadData() {
      if (currentUser) {
        setIsLoading(true);
        try {
          console.log("Carregando dados para:", currentUser.id);
          const res = await fetch(`/api/data?userId=${currentUser.id}`);
          
          if (res.ok) {
            const data = await res.json();
            console.log("Dados carregados com sucesso:", data);
            setTransactions(data.transactions || []);
            setCategories(data.categories || CATEGORY_STRUCTURE);
            setPaymentMethods(data.paymentMethods || []);
            setDataLoaded(true);
          } else if (res.status === 404) {
            console.log("Dados não encontrados (404), inicializando novo perfil...");
            setTransactions(INITIAL_TRANSACTIONS);
            setCategories(CATEGORY_STRUCTURE);
            setPaymentMethods([
                { name: 'DINHEIRO', isCreditCard: false },
                { name: 'PIX', isCreditCard: false },
                ...CARD_SUFFIXES.map(c => ({ name: c, isCreditCard: true }))
            ]);
            setDataLoaded(true); // Permite salvar imediatamente
          } else {
            console.error("Erro ao carregar dados. Status:", res.status);
          }
        } catch (error) {
          console.error("Erro de rede ao carregar dados", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setDataLoaded(false);
        setTransactions([]);
      }
    }
    loadData();
  }, [currentUser]);

  // Salvar dados na API (Debounce manual)
  useEffect(() => {
    if (!currentUser || !dataLoaded) return;

    const timeoutId = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(false);
      try {
        console.log("Iniciando salvamento automático...");
        const res = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUser.id,
            transactions,
            categories,
            paymentMethods
          })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("Erro ao salvar dados:", errText);
            setSaveError(true);
        } else {
            console.log("Dados salvos com sucesso.");
        }
      } catch (error) {
        console.error("Erro de rede ao salvar dados", error);
        setSaveError(true);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [transactions, paymentMethods, categories, currentUser, dataLoaded]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // Removido salvamento em localStorage
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Removido remoção de localStorage pois não salvamos mais lá
    setDataLoaded(false);
  };

  const currentMonthProjections = useMemo(() => 
    calculateProjections(transactions, 0, 120, projectionStartDate), 
    [transactions, projectionStartDate]
  );
  
  const filteredProjections = useMemo(() => 
    currentMonthProjections.slice(0, projectionMonths),
    [currentMonthProjections, projectionMonths]
  );

  const currentSummary = currentMonthProjections[0] || { income: 0, expense: 0, balance: 0 };

  const creditCardsOnly = useMemo(() => 
    paymentMethods.filter(pm => pm.isCreditCard).map(pm => pm.name),
    [paymentMethods]
  );

  const cardSummaries: CardGroup[] = useMemo(() => {
    const targetMonthKey = getMonthYear(selectedCardDate);
    const groups: Record<string, Transaction[]> = {};
    const monthlyCardTransactions = transactions.filter(t => {
      if (!t.cardSuffix || t.type !== EntryType.EXPENSE) return false;
      const method = paymentMethods.find(pm => pm.name === t.cardSuffix);
      if (!method || !method.isCreditCard) return false;
      let baseDate = t.billingDate ? new Date(t.billingDate + '-01T12:00:00') : new Date(t.date);
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

    return Object.entries(groups).map(([suffix, txs]) => {
      // Encontrar o método de pagamento para obter os dados de vencimento
      const paymentMethod = paymentMethods.find(pm => pm.name === suffix);
      
      return {
        suffix,
        transactions: txs,
        paymentMethod,
        total: txs.reduce((sum, t) => {
          if (t.overrides && t.overrides[targetMonthKey] !== undefined) return sum + Math.abs(t.overrides[targetMonthKey]);
          const installmentAmount = t.installments ? Math.abs(t.amount / t.installments.total) : Math.abs(t.amount);
          return sum + installmentAmount;
        }, 0)
      };
    }).sort((a, b) => b.total - a.total);
  }, [transactions, selectedCardDate, paymentMethods]);

  const handleSaveTransaction = (data: Omit<Transaction, 'id'> | Transaction) => {
    if ('id' in data) {
      setTransactions(prev => prev.map(t => t.id === data.id ? (data as Transaction) : t));
    } else {
      const tx: Transaction = { ...data, id: Math.random().toString(36).substr(2, 9) };
      setTransactions(prev => [...prev, tx]);
    }
    setEditingTransaction(null);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleProjectionItemClick = (transaction: Transaction, monthKey: string) => {
    setAdjustingTransaction({ t: transaction, month: monthKey });
  };

  // Funções de Seleção Múltipla
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedTransactionIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactionIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactionIds.size === transactions.length) {
      setSelectedTransactionIds(new Set());
    } else {
      setSelectedTransactionIds(new Set(transactions.map(t => t.id)));
    }
  };

  const handleBulkDelete = () => {
    if (window.confirm(`Tem certeza que deseja excluir ${selectedTransactionIds.size} itens selecionados?`)) {
      setTransactions(prev => prev.filter(t => !selectedTransactionIds.has(t.id)));
      setSelectedTransactionIds(new Set());
    }
  };

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (isLoading && !dataLoaded) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 text-blue-600 gap-4">
        <Loader2 size={48} className="animate-spin" />
        <p className="font-black uppercase tracking-widest text-sm">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50 overflow-hidden">
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center space-x-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-200">
              <Wallet size={24} />
            </div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              Finance
            </h1>
          </div>

          <nav className="space-y-1.5 flex-1">
            <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><LayoutGrid size={20} /><span>Painel Geral</span></button>
            <button onClick={() => { setActiveTab('projections'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'projections' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><CalendarDays size={20} /><span>Projeção</span></button>
            <button onClick={() => { setActiveTab('cards'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'cards' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><CreditCardIcon size={20} /><span>Cartões</span></button>
            <button onClick={() => { setActiveTab('settings'); setIsSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-100'}`}><SettingsIcon size={20} /><span>Configurações</span></button>
          </nav>
          
          <div className="mt-auto space-y-4">
            <div className={`p-4 rounded-3xl border border-gray-100 transition-colors ${saveError ? 'bg-red-50 border-red-200' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 rounded-xl ${saveError ? 'bg-red-200 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {saveError ? <AlertTriangle size={16} /> : <UserIcon size={16} />}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="text-[11px] font-black text-gray-800 truncate">{currentUser.name}</p>
                  <p className="text-[9px] text-gray-400 font-bold truncate">{currentUser.email}</p>
                </div>
                {isSaving && <RefreshCw size={14} className="animate-spin text-blue-500" />}
              </div>
              
              {saveError && (
                <p className="text-[9px] font-bold text-red-500 mb-2 text-center">
                  Erro ao salvar dados. Verifique sua conexão.
                </p>
              )}

              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 bg-white text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl border border-red-100 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} /> Sair do App
              </button>
            </div>
          </div>
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
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingTransaction(null); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-2xl transition-all shadow-lg shadow-blue-200 font-bold flex items-center gap-2"><Plus size={18} /><span>Novo</span></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
          {activeTab === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <SummaryCard title="Saldo Previsto" amount={filteredProjections[projectionMonths - 1]?.balance || 0} icon={<Activity size={20} />} />
                <SummaryCard title="Receitas (Mês)" amount={currentSummary.income} icon={<TrendingUp size={20} />} colorClass="text-green-600" />
                <SummaryCard title="Despesas (Mês)" amount={currentSummary.expense} icon={<TrendingDown size={20} />} colorClass="text-red-600" />
              </div>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-8 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-gray-800">Seus Lançamentos</h3>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Base de Dados de {currentUser.name.split(' ')[0]}</div>
                </div>
                <TransactionTable 
                  transactions={transactions} 
                  onDelete={(id) => { 
                    setTransactions(prev => prev.filter(t => t.id !== id));
                    // Remover da seleção se estiver selecionado
                    if (selectedTransactionIds.has(id)) {
                      const newSet = new Set(selectedTransactionIds);
                      newSet.delete(id);
                      setSelectedTransactionIds(newSet);
                    }
                  }} 
                  onEdit={handleEditClick}
                  selectedIds={selectedTransactionIds}
                  onToggleSelect={handleToggleSelect}
                  onSelectAll={handleSelectAll}
                  onBulkDelete={handleBulkDelete}
                />
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
                <button onClick={() => {setSelectedCardDate(new Date(selectedCardDate.setMonth(selectedCardDate.getMonth() - 1))); setSelectedCardDate(new Date(selectedCardDate))}} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-blue-600"><ChevronLeft size={24} /></button>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar size={12} /> Competência da Fatura</span>
                  <span className="text-xl font-black text-gray-800 uppercase tracking-tighter">{getMonthYear(selectedCardDate)}</span>
                </div>
                <button onClick={() => {setSelectedCardDate(new Date(selectedCardDate.setMonth(selectedCardDate.getMonth() + 1))); setSelectedCardDate(new Date(selectedCardDate))}} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-blue-600"><ChevronRight size={24} /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {cardSummaries.map((group) => {
                  let dueDateDisplay = "N/A";
                  if (group.paymentMethod?.dueDay) {
                    const businessDate = calculateBusinessDueDate(selectedCardDate, group.paymentMethod.dueDay);
                    dueDateDisplay = businessDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                  }

                  return (
                    <div key={group.suffix} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm border-b-4 border-b-gray-900 flex flex-col min-h-[400px]">
                      <div className="flex items-center space-x-4 mb-8">
                          <div className="bg-gray-900 p-3 rounded-2xl text-white"><CreditCardIcon size={24} /></div>
                          <div>
                            <h3 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{group.suffix}</h3>
                            {group.paymentMethod?.dueDay && (
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                    Vence: {dueDateDisplay}
                                </span>
                            )}
                          </div>
                      </div>
                      <div className="mb-6 pb-6 border-b border-gray-50">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Fatura {getMonthYear(selectedCardDate)}</span>
                          <span className="text-3xl font-black text-red-600">{formatCurrency(group.total)}</span>
                      </div>
                      <div className="flex-1 mb-8 overflow-hidden flex flex-col">
                        <div className="space-y-3 overflow-y-auto max-h-64 pr-2 custom-scrollbar">
                          {group.transactions.map((t, idx) => (
                            <div key={idx} className="flex justify-between items-center group/tx">
                              <div className="flex flex-col">
                                <span className="text-[11px] font-bold text-gray-700">{t.description}</span>
                                <span className="text-[9px] text-gray-400 font-medium">{t.category}</span>
                              </div>
                              <span className="text-xs font-black text-gray-800">{formatCurrency(t.amount / (t.installments?.total || 1))}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-auto pt-6 border-t border-dashed border-gray-200">
                        <button onClick={() => setReconcilingCard(group.suffix)} className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-black text-gray-700 border border-gray-100 flex items-center justify-center gap-2">
                          <Activity size={16} /> CONFRONTAR FATURA
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsScreen 
              paymentMethods={paymentMethods} 
              setPaymentMethods={setPaymentMethods} 
              categories={categories} 
              setCategories={setCategories}
            />
          )}
        </div>
      </main>

      {isModalOpen && <AddTransactionModal onClose={() => { setIsModalOpen(false); setEditingTransaction(null); }} onSave={handleSaveTransaction} initialData={editingTransaction} paymentOptions={paymentMethods} categoryStructure={categories} />}
      {adjustingTransaction && <AdjustmentModal transaction={adjustingTransaction.t} monthKey={adjustingTransaction.month} onClose={() => setAdjustingTransaction(null)} onSaveOverride={(id, mk, amt) => {
        setTransactions(prev => prev.map(t => {
          if (t.id === id) {
            const newOverrides = { ...(t.overrides || {}) };
            if (amt === null) delete newOverrides[mk];
            else newOverrides[mk] = amt;
            return { ...t, overrides: newOverrides };
          }
          return t;
        }));
      }} onEditOriginal={handleEditClick} />}
      {reconcilingCard && (
        <ReconciliationModal 
          cardSuffix={reconcilingCard} 
          transactions={transactions.filter(t => t.cardSuffix === reconcilingCard)} 
          selectedMonthDate={selectedCardDate}
          onClose={() => setReconcilingCard(null)} 
          onToggleReconcile={(id) => {
            setTransactions(prev => prev.map(t => t.id === id ? { ...t, reconciled: !t.reconciled } : t));
          }} 
        />
      )}
    </div>
  );
};

export default App;