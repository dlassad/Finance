
import React, { useState, useEffect } from 'react';
import { EntryType, Transaction, CategoryStructure, PaymentMethod } from '../types';
import { X, Palette, Type as FontIcon, CreditCard, Tag, Calendar, Check } from 'lucide-react';

interface AddTransactionModalProps {
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id'> | Transaction) => void;
  initialData?: Transaction | null;
  paymentOptions: PaymentMethod[];
  categoryStructure: CategoryStructure;
}

const BG_COLORS = [
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

const TEXT_COLORS = [
  { name: 'Escuro', class: 'text-gray-900' },
  { name: 'Branco', class: 'text-white' },
  { name: 'Amarelo', class: 'text-yellow-300' },
  { name: 'Vermelho', class: 'text-red-400' },
  { name: 'Ciano', class: 'text-cyan-300' },
];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ 
  onClose, onSave, initialData, paymentOptions, categoryStructure 
}) => {
  const categoriesList = Object.keys(categoryStructure);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<EntryType>(EntryType.EXPENSE);
  const [category, setCategory] = useState(categoriesList[0] || '');
  const [subcategory, setSubcategory] = useState('');
  const [cardSuffix, setCardSuffix] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [installmentsTotal, setInstallmentsTotal] = useState('');
  const [color, setColor] = useState('bg-white border-gray-200');
  const [fontColor, setFontColor] = useState('text-gray-900');
  
  const [billingMonth, setBillingMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const selectedMethodIsCard = paymentOptions.find(m => m.name === cardSuffix)?.isCreditCard || false;

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(Math.abs(initialData.amount).toString());
      setType(initialData.type);
      setCategory(initialData.category);
      setSubcategory(initialData.subcategory);
      setCardSuffix(initialData.cardSuffix || '');
      setIsRecurring(initialData.isRecurring);
      setInstallmentsTotal(initialData.installments?.total.toString() || '');
      setColor(initialData.color || 'bg-white border-gray-200');
      setFontColor(initialData.fontColor || 'text-gray-900');
      if (initialData.billingDate) setBillingMonth(initialData.billingDate);
    }
  }, [initialData]);

  useEffect(() => {
    const subs = categoryStructure[category] || [];
    if (!subs.includes(subcategory)) {
        setSubcategory(subs[0] || '');
    }
  }, [category, categoryStructure]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const evaluatedValue = Number(evaluateExpression(amount));
    if (isNaN(evaluatedValue)) return;

    const transactionData = {
      description: description.toUpperCase(),
      amount: type === EntryType.EXPENSE ? -Math.abs(evaluatedValue) : Math.abs(evaluatedValue),
      type,
      category,
      subcategory,
      cardSuffix: cardSuffix || undefined,
      billingDate: (cardSuffix && selectedMethodIsCard) ? billingMonth : undefined,
      date: initialData?.date || new Date().toISOString(),
      isRecurring,
      color,
      fontColor,
      installments: installmentsTotal ? { 
        current: initialData?.installments?.current || 1, 
        total: Number(installmentsTotal) 
      } : undefined,
      reconciled: initialData?.reconciled || false
    };

    if (initialData) {
      onSave({ ...transactionData, id: initialData.id });
    } else {
      onSave(transactionData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col max-h-[95vh]">
        
        <div className="px-8 py-5 border-b flex justify-between items-center bg-gray-50/50">
          <h2 className="text-xl font-black text-gray-800 tracking-tighter uppercase">
            {initialData ? 'Editar Lançamento' : 'Novo Lançamento'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="w-full sm:w-1/3">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tipo</label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl">
                  <button type="button" onClick={() => setType(EntryType.EXPENSE)} className={`py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${type === EntryType.EXPENSE ? 'bg-white shadow-sm text-red-600' : 'text-gray-500'}`}>Saída</button>
                  <button type="button" onClick={() => setType(EntryType.INCOME)} className={`py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest ${type === EntryType.INCOME ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}>Entrada</button>
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Descrição</label>
                <input autoFocus className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-gray-800" placeholder="EX: SUPERMERCADO" value={description} onChange={(e) => setDescription(e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Valor (R$)</label>
                <input type="text" inputMode="decimal" className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-black text-lg" placeholder="0,00 ou 10*20" value={amount} onChange={(e) => setAmount(e.target.value)} onBlur={handleBlurAmount} required />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <CreditCard size={12} /> Pagamento
                </label>
                <select className="w-full px-5 py-3 bg-gray-50 border-2 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all font-bold cursor-pointer" value={cardSuffix} onChange={(e) => setCardSuffix(e.target.value)}>
                  <option value="">Não Especificado</option>
                  {paymentOptions.map(m => <option key={m.name} value={m.name}>{m.name} {m.isCreditCard ? '(Cartão)' : '(Imediato)'}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Tag size={12} /> Categoria</label>
                <select className="w-full px-5 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer" value={category} onChange={(e) => setCategory(e.target.value)}>{categoriesList.map(c => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subcategoria</label>
                <select className="w-full px-5 py-3 bg-gray-50 rounded-xl font-bold border-2 border-transparent outline-none focus:bg-white focus:border-blue-500 transition-all cursor-pointer" value={subcategory} onChange={(e) => setSubcategory(e.target.value)}>{categoryStructure[category]?.map(s => <option key={s} value={s}>{s}</option>)}</select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer" />
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight group-hover:text-blue-600">Fixo Mensal</span>
              </label>

              {!isRecurring && (
                <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-xl border border-gray-200">
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Parcelas:</span>
                  <input type="number" min="1" className="w-12 bg-transparent border-none outline-none font-black text-blue-600" value={installmentsTotal} onChange={(e) => setInstallmentsTotal(e.target.value)} placeholder="1" />
                </div>
              )}

              {cardSuffix && selectedMethodIsCard && (
                  <div className="flex items-center gap-3 bg-white px-4 py-1.5 rounded-xl border border-gray-200">
                      <Calendar size={14} className="text-gray-400" />
                      <input type="month" className="bg-transparent text-[11px] font-black text-gray-700 outline-none cursor-pointer" value={billingMonth} onChange={(e) => setBillingMonth(e.target.value)} />
                  </div>
              )}
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Palette size={14} /> Cor de Fundo</label>
                <div className="flex flex-wrap gap-2.5">{BG_COLORS.map((c) => (<button key={c.name} type="button" onClick={() => setColor(c.class)} className={`h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center ${c.class} ${color === c.class ? 'border-gray-900 scale-125 shadow-md' : 'border-transparent hover:scale-110 hover:border-gray-300'}`}>{color === c.class && <Check size={12} className={c.class.includes('white') ? 'text-gray-900' : 'text-white'} />}</button>))}</div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2"><FontIcon size={14} /> Cor da Letra</label>
                <div className="flex flex-wrap gap-2">{TEXT_COLORS.map((tc) => (<button key={tc.name} type="button" onClick={() => setFontColor(tc.class)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border-2 transition-all ${tc.class} bg-gray-800 ${fontColor === tc.class ? 'border-blue-500 scale-105' : 'border-transparent opacity-70'}`}>{tc.name}</button>))}</div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button type="submit" className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-[2rem] transition-all shadow-xl hover:shadow-gray-200 active:scale-[0.98] text-lg uppercase tracking-tighter">
              {initialData ? 'Atualizar Lançamento' : 'Confirmar Lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
