
import React, { useState } from 'react';
import { CreditCard, Tag, Plus, Trash2, ChevronDown, ChevronRight, RotateCcw, CheckCircle2, Circle } from 'lucide-react';
import { CategoryStructure, PaymentMethod } from '../types';
import { CARD_SUFFIXES as DEFAULT_CARDS, CATEGORY_STRUCTURE as DEFAULT_CATEGORIES } from '../constants';

interface SettingsScreenProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  categories: CategoryStructure;
  setCategories: (categories: CategoryStructure) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  paymentMethods, setPaymentMethods, categories, setCategories 
}) => {
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIsCard, setNewMethodIsCard] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState('');

  const handleAddMethod = () => {
    if (newMethodName && !paymentMethods.find(m => m.name.toUpperCase() === newMethodName.toUpperCase())) {
      setPaymentMethods([...paymentMethods, { name: newMethodName.toUpperCase(), isCreditCard: newMethodIsCard }]);
      setNewMethodName('');
      setNewMethodIsCard(false);
    }
  };

  const handleRemoveMethod = (name: string) => {
    setPaymentMethods(paymentMethods.filter(m => m.name !== name));
  };

  const handleToggleCardType = (name: string) => {
    setPaymentMethods(paymentMethods.map(m => m.name === name ? { ...m, isCreditCard: !m.isCreditCard } : m));
  };

  const handleAddCategory = () => {
    if (newCategory && !categories[newCategory]) {
      setCategories({ ...categories, [newCategory]: [] });
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    const { [cat]: _, ...rest } = categories;
    setCategories(rest);
  };

  const handleAddSubCategory = (cat: string) => {
    if (newSubCategory && !categories[cat].includes(newSubCategory)) {
      setCategories({
        ...categories,
        [cat]: [...categories[cat], newSubCategory]
      });
      setNewSubCategory('');
    }
  };

  const handleRemoveSubCategory = (cat: string, sub: string) => {
    setCategories({
      ...categories,
      [cat]: categories[cat].filter(s => s !== sub)
    });
  };

  const handleReset = () => {
    if (confirm('Deseja restaurar as categorias e formas de pagamento para o padrão inicial?')) {
      const initialMethods: PaymentMethod[] = [
        { name: 'DINHEIRO', isCreditCard: false },
        { name: 'PIX', isCreditCard: false },
        ...DEFAULT_CARDS.map(c => ({ name: c, isCreditCard: true }))
      ];
      setPaymentMethods(initialMethods);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Configurações</h2>
          <p className="text-gray-500 font-medium">Personalize suas formas de pagamento e categorias.</p>
        </div>
        <button 
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-black text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-red-100 uppercase tracking-widest"
        >
          <RotateCcw size={14} /> RESTAURAR PADRÕES
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Gestão de Formas de Pagamento */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gray-900 p-2.5 rounded-2xl text-white shadow-lg shadow-gray-200"><CreditCard size={20} /></div>
            <h3 className="font-black text-lg text-gray-800 uppercase tracking-tighter">Formas de Pagamento</h3>
          </div>
          
          <div className="space-y-4 bg-gray-50 p-5 rounded-[1.5rem] border border-gray-100">
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: NUBANK, PIX..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-transparent rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMethod()}
              />
              <button 
                onClick={handleAddMethod}
                className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
              >
                <Plus size={20} />
              </button>
            </div>
            <label className="flex items-center gap-3 cursor-pointer group">
                <button 
                    type="button"
                    onClick={() => setNewMethodIsCard(!newMethodIsCard)}
                    className={`w-10 h-5 rounded-full transition-all relative ${newMethodIsCard ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newMethodIsCard ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-600">Possui Fatura (Cartão de Crédito)</span>
            </label>
          </div>

          <div className="space-y-2">
            {paymentMethods.map(method => (
              <div key={method.name} className="flex items-center justify-between bg-white border border-gray-100 p-4 rounded-2xl hover:border-blue-200 transition-all group shadow-sm">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => handleToggleCardType(method.name)}
                        className={`p-2 rounded-xl transition-all ${method.isCreditCard ? 'bg-blue-600 text-white shadow-md shadow-blue-100' : 'bg-gray-100 text-gray-400'}`}
                        title={method.isCreditCard ? "Com Fatura" : "Pagamento Imediato"}
                    >
                        <CreditCard size={18} />
                    </button>
                    <div>
                        <p className="text-sm font-black text-gray-800 uppercase tracking-tighter">{method.name}</p>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {method.isCreditCard ? 'Cartão de Crédito' : 'Pagamento Imediato'}
                        </p>
                    </div>
                </div>
                <button 
                  onClick={() => handleRemoveMethod(method.name)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Gestão de Categorias */}
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-200"><Tag size={20} /></div>
            <h3 className="font-black text-lg text-gray-800 uppercase tracking-tighter">Categorias</h3>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              placeholder="Nova Categoria..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <button 
              onClick={handleAddCategory}
              className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={20} />
            </button>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {Object.keys(categories).map(cat => (
              <div key={cat} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div 
                  className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${expandedCategory === cat ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                >
                  <div className="flex items-center gap-2">
                    {expandedCategory === cat ? <ChevronDown size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-400" />}
                    <span className="text-sm font-bold text-gray-800">{cat}</span>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat); }} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                </div>
                {expandedCategory === cat && (
                  <div className="p-4 bg-white border-t border-gray-50 space-y-4">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Nova Subcategoria..." className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-lg text-xs outline-none" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(cat)} />
                      <button onClick={() => handleAddSubCategory(cat)} className="bg-gray-900 text-white p-2 rounded-lg"><Plus size={14} /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {categories[cat].map(sub => (
                        <div key={sub} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-2 py-1 rounded-md text-[10px] font-bold border border-blue-100">
                          {sub} <button onClick={() => handleRemoveSubCategory(cat, sub)} className="hover:text-red-500"><Trash2 size={10} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
