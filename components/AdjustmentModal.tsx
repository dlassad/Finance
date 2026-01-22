
import React, { useState } from 'react';
import { Transaction, EntryType } from '../types';
import { formatCurrency } from '../utils';
import { X, Calendar, Edit3, Save, RotateCcw, Split, Palette, Type as FontIcon, Check } from 'lucide-react';
import { BG_COLORS, TEXT_COLORS } from '../constants';

interface AdjustmentModalProps {
  transaction: Transaction;
  monthKey: string;
  selectedDate: Date;
  onClose: () => void;
  onSaveOverride: (transactionId: string, monthKey: string, amount: number | null, color?: string, fontColor?: string) => void;
  onEditOriginal: (transaction: Transaction) => void;
  onSplitSeries: (transaction: Transaction, selectedDate: Date) => void;
}

export const AdjustmentModal: React.FC<AdjustmentModalProps> = ({ 
  transaction, 
  monthKey, 
  selectedDate,
  onClose, 
  onSaveOverride,
  onEditOriginal,
  onSplitSeries
}) => {
  const currentVal = transaction.overrides?.[monthKey] ?? (transaction.installments ? transaction.amount / transaction.installments.total : transaction.amount);
  const [amount, setAmount] = useState(Math.abs(currentVal).toString());
  
  // Estados para as cores, inicializados com os overrides existentes ou os padrões da transação
  const [color, setColor] = useState(transaction.colorOverrides?.[monthKey] || transaction.color || 'bg-white border-gray-200');
  const [fontColor, setFontColor] = useState(transaction.fontColorOverrides?.[monthKey] || transaction.fontColor || 'text-gray-900');

  const evaluateExpression = (val: string): string => {
    if (!val) return "";
    const sanitized = val.replace(/,/g, '.').replace(/[^0-9.+\-*/\s()]/g, '');
    try {
      if (/[+\-*/]/.test(sanitized)) {
        const result = new Function(`return (${sanitized})`)();
        if (typeof result === 'number' && isFinite(result)) {
          return Number(result.toFixed(2)).toString();
        }
      }
    } catch (e) {
      return val;
    }
    return val;
  };

  const handleBlurAmount = () => {
    setAmount(evaluateExpression(amount));
  };

  const handleSaveMonthOnly = (e: React.FormEvent) => {
    e.preventDefault();
    const evaluatedValue = Number(evaluateExpression(amount));
    if (isNaN(evaluatedValue)) return;
    
    const finalAmount = transaction.type === EntryType.EXPENSE ? -Math.abs(evaluatedValue) : Math.abs(evaluatedValue);
    
    // Passa as cores também
    onSaveOverride(transaction.id, monthKey, finalAmount, color, fontColor);
    onClose();
  };

  const handleResetOverride = () => {
    onSaveOverride(transaction.id, monthKey, null);
    onClose();
  };

  const showSplitOption = transaction.isRecurring;
  const hasAdjustments = transaction.overrides?.[monthKey] !== undefined || transaction.colorOverrides?.[monthKey] !== undefined || transaction.fontColorOverrides?.[monthKey] !== undefined;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-8 border-b bg-gray-50/50 flex-none">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-gray-800 uppercase tracking-tighter">Ajustar Valor</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3 bg-blue-600 text-white p-4 rounded-2xl shadow-lg shadow-blue-100">
             <Calendar size={24} />
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Mês Selecionado</p>
                <p className="font-black text-lg">{monthKey}</p>
             </div>
          </div>
        </div>

        <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
            <p className="font-bold text-gray-800">{transaction.description}</p>
          </div>

          <form onSubmit={handleSaveMonthOnly} className="space-y-6">
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Valor para este Mês (R$)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl text-xl font-black focus:border-blue-500 focus:bg-white transition-all outline-none"
                  placeholder="0,00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={handleBlurAmount}
                />
              </div>
            </div>

            {/* Seleção de Cores para o Mês */}
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Palette size={14} /> Cor de Fundo (Este Mês)</label>
                <div className="flex flex-wrap gap-2.5">{BG_COLORS.map((c) => (<button key={c.name} type="button" onClick={() => setColor(c.class)} className={`h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center ${c.class} ${color === c.class ? 'border-gray-900 scale-125 shadow-md' : 'border-transparent hover:scale-110 hover:border-gray-300'}`}>{color === c.class && <Check size={12} className={c.class.includes('white') ? 'text-gray-900' : 'text-white'} />}</button>))}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><FontIcon size={14} /> Cor da Letra (Este Mês)</label>
                <div className="flex flex-wrap gap-2">{TEXT_COLORS.map((tc) => (<button key={tc.name} type="button" onClick={() => setFontColor(tc.class)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${tc.class} bg-gray-800 ${fontColor === tc.class ? 'border-blue-500 scale-105' : 'border-transparent opacity-70'}`}>{tc.name}</button>))}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 mt-8">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-blue-100 transition-all active:scale-95"
              >
                <Save size={20} /> ALTERAR APENAS ESTE MÊS
              </button>
              
              {hasAdjustments && (
                <button
                  type="button"
                  onClick={handleResetOverride}
                  className="w-full bg-amber-50 text-amber-700 font-black py-3 rounded-2xl flex items-center justify-center gap-2 border border-amber-200 hover:bg-amber-100 transition-all"
                >
                  <RotateCcw size={18} /> REMOVER AJUSTE INDIVIDUAL
                </button>
              )}

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                <div className="relative flex justify-center text-[10px] font-black uppercase text-gray-300"><span className="bg-white px-2">Ou</span></div>
              </div>

              {showSplitOption && (
                <button
                  type="button"
                  onClick={() => { onSplitSeries(transaction, selectedDate); onClose(); }}
                  className="w-full bg-indigo-50 text-indigo-700 font-black py-4 rounded-2xl flex items-center justify-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all active:scale-95 mb-2"
                >
                  <Split size={20} /> ALTERAR SÉRIE DAQUI EM DIANTE
                </button>
              )}

              <button
                type="button"
                onClick={() => { onEditOriginal(transaction); onClose(); }}
                className="w-full bg-gray-900 hover:bg-black text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Edit3 size={20} /> EDITAR LANÇAMENTO COMPLETO
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
