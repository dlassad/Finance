
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, MonthlySummary, EntryType } from '../types';
import { formatCurrency } from '../utils';
import { 
  Filter, 
  Search, 
  X, 
  Calendar, 
  ChevronRight, 
  Edit3, 
  CheckSquare, 
  Square, 
  PencilLine, 
  ChevronDown,
  ChevronUp,
  ListFilter,
  History,
  RotateCcw,
  Sparkles,
  Layers,
  LayoutList,
  CreditCard,
  Tag
} from 'lucide-react';

interface ProjectionGridProps {
  transactions: Transaction[];
  summaries: MonthlySummary[];
  projectionMonths: number;
  setProjectionMonths: (months: number) => void;
  projectionStartDate: Date;
  setProjectionStartDate: (date: Date) => void;
  categories: string[];
  cards: string[];
  onEditClick: (transaction: Transaction, monthKey: string, date: Date) => void;
}

// Interface auxiliar para os itens processados com valor de exibição
interface ProcessedTransaction extends Transaction {
  displayAmount: number;
  installmentInfo: string;
  hasOverride: boolean;
  monthKey: string;
  targetDate: Date;
}

interface GroupedData {
  id: string;
  label: string;
  type: 'CARD' | 'CATEGORY';
  items: ProcessedTransaction[];
  total: number;
}

export const ProjectionGrid: React.FC<ProjectionGridProps> = ({ 
  transactions, 
  summaries, 
  projectionMonths, 
  setProjectionMonths,
  projectionStartDate,
  setProjectionStartDate,
  categories,
  cards,
  onEditClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedCard, setSelectedCard] = useState('');
  const [hiddenMonths, setHiddenMonths] = useState<Set<number>>(new Set());
  const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(false);
  const [monthFilterSearch, setMonthFilterSearch] = useState('');
  
  // Novo estado para controlar o modo de visualização: 'list' ou 'grouped'
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('grouped');
  
  // Estado para controlar quais grupos estão expandidos (chave: "mesIdx-groupId")
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMonthSelectorOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleMonthVisibility = (idx: number) => {
    const newHidden = new Set(hiddenMonths);
    if (newHidden.has(idx)) {
      newHidden.delete(idx);
    } else {
      newHidden.add(idx);
    }
    setHiddenMonths(newHidden);
  };

  const toggleGroupExpansion = (groupId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId);
    } else {
      newExpanded.add(groupId);
    }
    setExpandedGroups(newExpanded);
  };

  const showAllMonths = () => {
    setHiddenMonths(new Set());
    setIsMonthSelectorOpen(false);
  };
  
  const hideAllMonths = () => {
    setHiddenMonths(new Set(summaries.map((_, i) => i)));
    setIsMonthSelectorOpen(false);
  };

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [year, month] = e.target.value.split('-');
    const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    setProjectionStartDate(newDate);
    setHiddenMonths(new Set());
  };

  const resetToToday = () => {
    setProjectionStartDate(new Date());
    setHiddenMonths(new Set());
  };

  const visibleCount = summaries.length - hiddenMonths.size;

  const isDarkBg = (colorClass?: string) => {
    const darkBgs = ['bg-red-600', 'bg-blue-700', 'bg-purple-800', 'bg-gray-900', 'bg-amber-900', 'bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-pink-500', 'bg-slate-500'];
    return colorClass && darkBgs.includes(colorClass);
  };

  const getFilteredTransactionsForMonth = (monthIdx: number) => {
    const targetDate = new Date(projectionStartDate.getFullYear(), projectionStartDate.getMonth() + monthIdx, 1);
    const monthKey = summaries[monthIdx].month;

    const filtered = transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || t.category === selectedCategory;
      const matchesCard = !selectedCard || t.cardSuffix === selectedCard;
      
      if (!matchesSearch || !matchesCategory || !matchesCard) return false;

      // Check endDate inside filter to be safe
      if (t.endDate) {
         const endD = new Date(t.endDate);
         if (endD < new Date(targetDate.getFullYear(), targetDate.getMonth(), 1)) return false;
      }

      let baseDate: Date;
      if (t.billingDate) {
        baseDate = new Date(t.billingDate + '-01T12:00:00');
      } else {
        baseDate = new Date(t.date);
      }
      
      // If transaction starts in future relative to this month, skip
      if (baseDate > new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)) return false;
      
      if (t.isRecurring) return true;
      const isSameMonth = baseDate.getMonth() === targetDate.getMonth() && baseDate.getFullYear() === targetDate.getFullYear();
      if (isSameMonth) return true;

      if (t.installments) {
        const monthsDiff = (targetDate.getFullYear() - baseDate.getFullYear()) * 12 + (targetDate.getMonth() - baseDate.getMonth());
        const currentInstallment = t.installments.current + monthsDiff;
        return currentInstallment >= 1 && currentInstallment <= t.installments.total;
      }
      return false;
    }).map(t => {
      let displayAmount = t.amount;
      let hasOverride = false;
      let installmentInfo = "";

      if (t.overrides && t.overrides[monthKey] !== undefined) {
        displayAmount = t.overrides[monthKey];
        hasOverride = true;
      } else if (t.installments) {
        let baseDate = t.billingDate ? new Date(t.billingDate + '-01T12:00:00') : new Date(t.date);
        displayAmount = t.amount / t.installments.total;
        const monthsDiff = (targetDate.getFullYear() - baseDate.getFullYear()) * 12 + (targetDate.getMonth() - baseDate.getMonth());
        const currentInstallment = t.installments.current + monthsDiff;
        installmentInfo = ` (${currentInstallment}/${t.installments.total})`;
      }

      // Verifica overrides de cor
      const finalColor = t.colorOverrides?.[monthKey] || t.color;
      const finalFontColor = t.fontColorOverrides?.[monthKey] || t.fontColor;

      return { 
          ...t, 
          displayAmount, 
          installmentInfo, 
          hasOverride, 
          monthKey, 
          targetDate,
          color: finalColor, // Substitui pela cor específica do mês se houver
          fontColor: finalFontColor 
      };
    });

    return { items: filtered, targetDate };
  };

  // Função para agrupar itens
  const groupTransactions = (items: ProcessedTransaction[]): GroupedData[] => {
    const groups: Record<string, GroupedData> = {};

    items.forEach(item => {
      let key = '';
      let label = '';
      let type: 'CARD' | 'CATEGORY' = 'CATEGORY';

      if (item.cardSuffix) {
        key = `CARD_${item.cardSuffix}`;
        label = `Cartão ${item.cardSuffix}`;
        type = 'CARD';
      } else {
        key = `CAT_${item.category}`;
        label = item.category;
        type = 'CATEGORY';
      }

      if (!groups[key]) {
        groups[key] = {
          id: key,
          label,
          type,
          items: [],
          total: 0
        };
      }

      groups[key].items.push(item);
      groups[key].total += item.displayAmount;
    });

    // Ordena: Cartões primeiro (pelo maior total), depois Categorias (pelo maior total)
    return Object.values(groups).sort((a, b) => {
      if (a.type !== b.type) return a.type === 'CARD' ? -1 : 1;
      return Math.abs(b.total) - Math.abs(a.total); // Ordena por valor absoluto (mais caro primeiro)
    });
  };

  const formattedStartMonth = `${projectionStartDate.getFullYear()}-${String(projectionStartDate.getMonth() + 1).padStart(2, '0')}`;
  const isRollingToday = formattedStartMonth === `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  const renderTransactionItem = (t: ProcessedTransaction, tIdx: number) => {
    const dark = isDarkBg(t.color);
    return (
       <div 
         key={t.id + tIdx} 
         onClick={(e) => { e.stopPropagation(); onEditClick(t, t.monthKey, t.targetDate); }}
         className={`mx-2 my-2 p-3 rounded-2xl border transition-all group/item relative cursor-pointer ${
           t.hasOverride ? 'bg-amber-50 border-amber-200 shadow-sm' : 'border-transparent hover:border-blue-200 hover:bg-white hover:shadow-md'
         } ${t.color || ''} ${t.fontColor || (dark ? 'text-white' : 'text-gray-900')}`}
       >
          <div className="flex justify-between items-start gap-2 mb-1">
            <span className="text-[10px] font-black uppercase leading-tight flex-1">
              {t.description}
              {t.installmentInfo && <span className={`${dark ? 'text-white/80' : 'text-blue-500'} ml-1 font-bold`}>{t.installmentInfo}</span>}
              {t.hasOverride && (
                <span className={`inline-flex items-center ml-1 ${dark ? 'text-white/60' : 'text-amber-600'}`} title="Ajuste individual">
                  <PencilLine size={10} />
                </span>
              )}
            </span>
            <span className={`text-[11px] font-black ${t.type === EntryType.INCOME ? (dark ? 'text-white' : 'text-green-600') : (dark ? 'text-white' : 'text-red-600')}`}>
              {formatCurrency(t.displayAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[8px] opacity-70 font-bold uppercase tracking-widest">{t.category}</span>
            <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
              <Edit3 size={10} className={dark ? 'text-white' : 'text-blue-500'} />
              {t.cardSuffix && (
                <span className={`text-[8px] font-black ${dark ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'} px-1.5 py-0.5 rounded-lg uppercase border ${dark ? 'border-white/20' : 'border-gray-200'}`}>{t.cardSuffix}</span>
              )}
            </div>
          </div>
       </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-2xl font-black flex items-center gap-2">
              <History size={24} />
              Projeção Dinâmica
            </h2>
            {isRollingToday && (
              <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
                <Sparkles size={10} /> Janela Rolante
              </span>
            )}
          </div>
          <p className="text-blue-100 text-sm font-medium opacity-90">
            {isRollingToday 
              ? `Visão automática de 5 anos a partir de hoje.` 
              : `Visualizando projeção iniciada em ${projectionStartDate.toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})}.`}
          </p>
        </div>
        
        <div className="z-10 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 px-3 text-sm font-bold">
              <Calendar size={16} />
              <span>Início:</span>
            </div>
            <input 
              type="month"
              className="bg-white text-blue-700 px-3 py-2 rounded-xl text-sm font-black border-none outline-none cursor-pointer appearance-none shadow-sm"
              value={formattedStartMonth}
              onChange={handleStartDateChange}
            />
            {!isRollingToday && (
              <button 
                onClick={resetToToday}
                className="p-2 bg-blue-400 hover:bg-blue-300 rounded-xl transition-colors text-white"
                title="Voltar para Hoje (Modo Rolante)"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <div className="flex items-center gap-2 px-3 text-sm font-bold">
              <ChevronRight size={16} />
              <span>Horizonte:</span>
            </div>
            <select 
              className="bg-white text-blue-700 px-4 py-2 rounded-xl text-sm font-black border-none outline-none cursor-pointer appearance-none shadow-sm"
              value={projectionMonths}
              onChange={(e) => {
                setProjectionMonths(Number(e.target.value));
                setHiddenMonths(new Set());
              }}
            >
              <option value={6}>6 Meses</option>
              <option value={12}>1 Ano</option>
              <option value={24}>2 Anos</option>
              <option value={36}>3 Anos</option>
              <option value={60}>5 Anos (Ideal)</option>
              <option value={120}>10 Anos</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[250px] relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar lançamento..." 
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex gap-2 relative" ref={dropdownRef}>
            {/* Toggle View Mode Button */}
            <div className="bg-gray-50 p-1 rounded-2xl border border-gray-100 flex items-center">
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Lista Detalhada"
               >
                 <LayoutList size={18} />
               </button>
               <button 
                 onClick={() => setViewMode('grouped')}
                 className={`p-2 rounded-xl transition-all ${viewMode === 'grouped' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                 title="Agrupado por Cartão/Categoria"
               >
                 <Layers size={18} />
               </button>
            </div>

            <button 
              onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-black transition-all border ${
                isMonthSelectorOpen 
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                : 'bg-white text-gray-700 border-gray-100 hover:border-gray-200 shadow-sm'
              }`}
            >
              <ListFilter size={18} />
              <span>MESES ({visibleCount})</span>
              <ChevronDown size={16} className={`transition-transform ${isMonthSelectorOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMonthSelectorOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-[2rem] shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Exibir Meses</span>
                    <div className="flex gap-3">
                      <button onClick={showAllMonths} className="text-[10px] font-black text-blue-600 hover:underline">TODOS</button>
                      <button onClick={hideAllMonths} className="text-[10px] font-black text-red-500 hover:underline">LIMPAR</button>
                    </div>
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Pesquisar mês..."
                      className="w-full pl-9 pr-3 py-2 bg-white border border-gray-100 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      value={monthFilterSearch}
                      onChange={(e) => setMonthFilterSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
                  {summaries
                    .filter(s => s.month.toLowerCase().includes(monthFilterSearch.toLowerCase()))
                    .map((s, idx) => (
                    <button 
                      key={idx}
                      onClick={() => toggleMonthVisibility(idx)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-sm transition-all mb-1 ${
                        !hiddenMonths.has(idx) 
                        ? 'bg-blue-50 text-blue-700 font-bold' 
                        : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <span>{s.month}</span>
                      {!hiddenMonths.has(idx) ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} className="text-gray-300" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <select 
              className="px-4 py-3 bg-gray-50 border border-transparent rounded-2xl text-sm text-gray-700 font-bold focus:bg-white outline-none cursor-pointer hover:border-gray-200"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">Categorias</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {(searchTerm || selectedCategory || selectedCard || hiddenMonths.size > 0 || !isRollingToday) && (
              <button 
                onClick={() => {
                  setSearchTerm(''); 
                  setSelectedCategory(''); 
                  setSelectedCard('');
                  setHiddenMonths(new Set());
                  resetToToday();
                }} 
                className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-2xl transition-colors"
                title="Resetar tudo"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <div className="flex min-w-max">
            {summaries.map((summary, idx) => {
              if (hiddenMonths.has(idx)) return null;
              
              const { items: monthlyItems } = getFilteredTransactionsForMonth(idx);
              const monthlyResult = summary.income + summary.expense;
              const accumulatedBalance = summary.balance;
              
              // Se estiver no modo Agrupado, processa os itens
              let contentToRender;
              
              if (viewMode === 'list') {
                  contentToRender = monthlyItems.map((t, tIdx) => renderTransactionItem(t, tIdx));
              } else {
                  // Modo Agrupado
                  const groups = groupTransactions(monthlyItems);
                  
                  contentToRender = groups.map(group => {
                      // SE O GRUPO TIVER APENAS 1 ITEM, RENDERIZA DIRETO (SEM COLAPSÁVEL)
                      if (group.items.length === 1) {
                          return renderTransactionItem(group.items[0], 0);
                      }

                      const groupKey = `${idx}-${group.id}`;
                      const isExpanded = expandedGroups.has(groupKey);
                      
                      return (
                        <div key={group.id} className="mx-2 my-2 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50/30">
                           <div 
                             onClick={() => toggleGroupExpansion(groupKey)}
                             className={`p-3 flex items-center justify-between cursor-pointer hover:bg-white transition-colors ${isExpanded ? 'bg-white shadow-sm' : ''}`}
                           >
                             <div className="flex items-center gap-2 overflow-hidden">
                                {group.type === 'CARD' ? (
                                    <div className="bg-gray-900 text-white p-1 rounded-md min-w-[20px] h-[20px] flex items-center justify-center">
                                        <CreditCard size={10} />
                                    </div>
                                ) : (
                                    <div className="bg-blue-100 text-blue-600 p-1 rounded-md min-w-[20px] h-[20px] flex items-center justify-center">
                                        <Tag size={10} />
                                    </div>
                                )}
                                <div className="flex flex-col truncate">
                                    <span className="text-[10px] font-black uppercase text-gray-700 truncate">{group.label}</span>
                                    <span className="text-[9px] text-gray-400 font-bold">{group.items.length} itens</span>
                                </div>
                             </div>
                             <div className="flex items-center gap-1">
                                <span className={`text-[11px] font-black ${group.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(group.total)}
                                </span>
                                {isExpanded ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
                             </div>
                           </div>
                           
                           {isExpanded && (
                               <div className="border-t border-gray-100 bg-white pl-2">
                                   {group.items.map((t, tIdx) => renderTransactionItem(t, tIdx))}
                               </div>
                           )}
                        </div>
                      );
                  });
              }

              return (
                <div key={idx} className="w-[260px] border-r border-gray-50 last:border-r-0 flex flex-col group animate-in fade-in slide-in-from-right-2 duration-300">
                  <div className="bg-gray-900/95 text-white p-5 flex justify-between items-center">
                    <span className="font-black text-xs uppercase tracking-widest">{summary.month}</span>
                    <ChevronRight size={14} className="text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </div>
                  
                  <div className="bg-blue-50/50 p-4 border-b border-blue-50">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Resultado Mensal</p>
                        <p className={`text-base font-black ${monthlyResult < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(monthlyResult)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1 h-[450px] overflow-y-auto bg-white/50 custom-scrollbar p-1">
                     {monthlyItems.length > 0 ? (
                        contentToRender
                     ) : (
                       <div className="flex flex-col items-center justify-center h-full p-8 text-center opacity-20">
                          <Filter size={24} className="mb-2" />
                          <p className="text-[9px] font-black uppercase">Vazio</p>
                       </div>
                     )}
                  </div>

                  <div className="p-4 bg-gray-50/80 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Saldo Acumulado</span>
                       <span className={`text-xs font-black ${accumulatedBalance < 0 ? 'text-red-500' : 'text-gray-900'}`}>{formatCurrency(accumulatedBalance)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
