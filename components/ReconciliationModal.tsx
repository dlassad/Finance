
import React from 'react';
import { Transaction } from '../types';
import { formatCurrency, getMonthYear } from '../utils';
import { X, CheckCircle2, Circle, CreditCard } from 'lucide-react';

interface ReconciliationModalProps {
  cardSuffix: string;
  transactions: Transaction[];
  selectedMonthDate: Date;
  onClose: () => void;
  onToggleReconcile: (id: string) => void;
}

export const ReconciliationModal: React.FC<ReconciliationModalProps> = ({ 
  cardSuffix, 
  transactions,
  selectedMonthDate,
  onClose, 
  onToggleReconcile 
}) => {
  const monthKey = getMonthYear(selectedMonthDate);
  
  // Filtrar apenas transações que pertencem a este mês
  const monthlyTransactions = transactions.filter(t => {
    let baseDate: Date;
    if (t.billingDate) {
      baseDate = new Date(t.billingDate + '-01T12:00:00');
    } else {
      baseDate = new Date(t.date);
    }

    if (t.isRecurring) return true;
    
    const isSameMonth = baseDate.getMonth() === selectedMonthDate.getMonth() && baseDate.getFullYear() === selectedMonthDate.getFullYear();
    if (isSameMonth) return true;

    if (t.installments) {
      // Fix: Removed erroneous reference to 'selectedCardDate' and consolidated logic using 'selectedMonthDate'
      const monthsDiff = (selectedMonthDate.getFullYear() - baseDate.getFullYear()) * 12 + (selectedMonthDate.getMonth() - baseDate.getMonth());
      const currentInstallment = t.installments.current + monthsDiff;
      return currentInstallment >= 1 && currentInstallment <= t.installments.total;
    }
    return false;
  });

  const getAmountForMonth = (t: Transaction) => {
    if (t.overrides && t.overrides[monthKey] !== undefined) {
      return Math.abs(t.overrides[monthKey]);
    }
    return t.installments ? Math.abs(t.amount / t.installments.total) : Math.abs(t.amount);
  };

  const totalAmount = monthlyTransactions.reduce((sum, t) => sum + getAmountForMonth(t), 0);
  const reconciledAmount = monthlyTransactions
    .filter(t => t.reconciled)
    .reduce((sum, t) => sum + getAmountForMonth(t), 0);
  
  const progressPercent = totalAmount > 0 ? (reconciledAmount / totalAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gray-900 p-8 text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-white/20 p-3 rounded-2xl">
              <CreditCard size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter">Confronto: {cardSuffix}</h2>
              <p className="text-gray-400 text-sm font-medium">Competência: <span className="text-white">{monthKey}</span></p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Progresso da Conferência</span>
              <span className="text-sm font-black">{formatCurrency(reconciledAmount)} / {formatCurrency(totalAmount)}</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50 custom-scrollbar">
          {monthlyTransactions.map((t) => {
            const amount = getAmountForMonth(t);
            let installmentText = "";
            
            if (t.installments) {
              let baseDate = t.billingDate ? new Date(t.billingDate + '-01T12:00:00') : new Date(t.date);
              const monthsDiff = (selectedMonthDate.getFullYear() - baseDate.getFullYear()) * 12 + (selectedMonthDate.getMonth() - baseDate.getMonth());
              const currentInstallment = t.installments.current + monthsDiff;
              installmentText = ` (${currentInstallment}/${t.installments.total})`;
            }

            return (
              <button
                key={t.id}
                onClick={() => onToggleReconcile(t.id)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  t.reconciled 
                  ? 'bg-green-50 border-green-200 shadow-sm' 
                  : 'bg-white border-gray-100 hover:border-blue-200'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={t.reconciled ? 'text-green-600' : 'text-gray-300'}>
                    {t.reconciled ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </div>
                  <div className="text-left">
                    <p className={`font-bold transition-all flex items-center gap-1.5 ${t.reconciled ? 'text-green-800 line-through opacity-50' : 'text-gray-800'}`}>
                      {t.description}
                      {installmentText && <span className="text-blue-600 text-[10px] font-black">{installmentText}</span>}
                    </p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.category} • {t.subcategory}</p>
                  </div>
                </div>
                <span className={`font-black text-lg ${t.reconciled ? 'text-green-600 opacity-50' : 'text-gray-900'}`}>
                  {formatCurrency(amount)}
                </span>
              </button>
            );
          })}
          {monthlyTransactions.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center opacity-30">
               <CreditCard size={48} className="mb-4" />
               <p className="font-black uppercase text-xs tracking-widest">Nenhum item nesta fatura</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-black hover:bg-gray-800 transition-all active:scale-95"
          >
            Concluir Conferência
          </button>
        </div>
      </div>
    </div>
  );
};
