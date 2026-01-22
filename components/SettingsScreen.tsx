import React, { useState } from 'react';
import { CreditCard, Tag, Plus, Trash2, ChevronDown, ChevronRight, RotateCcw, ArrowUp, ArrowDown, Calendar, Edit3, Save, X } from 'lucide-react';
import { CategoryStructure, PaymentMethod } from '../types';
import { CARD_SUFFIXES as DEFAULT_CARDS, CATEGORY_STRUCTURE as DEFAULT_CATEGORIES } from '../constants';

interface SettingsScreenProps {
  paymentMethods: PaymentMethod[];
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  onRenamePaymentMethod: (oldName: string, newMethod: PaymentMethod) => void;
  categories: CategoryStructure;
  setCategories: (categories: CategoryStructure) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  paymentMethods, 
  setPaymentMethods,
  onRenamePaymentMethod,
  categories, 
  setCategories
}) => {
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIsCard, setNewMethodIsCard] = useState(false);
  const [newMethodDueDay, setNewMethodDueDay] = useState('');
  const [newMethodBestDay, setNewMethodBestDay] = useState('');
  
  // Estado para controlar a edição
  const [editingOriginalName, setEditingOriginalName] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [newSubCategory, setNewSubCategory] = useState('');

  // --- Lógica de Formas de Pagamento ---

  const handleSaveMethod = () => {
    if (!newMethodName) return;

    // Verifica duplicidade (ignorando o próprio item se estiver editando)
    const nameExists = paymentMethods.some(
      m => m.name.toUpperCase() === newMethodName.toUpperCase() && m.name !== editingOriginalName
    );

    if (nameExists) {
      alert('Já existe uma forma de pagamento com este nome.');
      return;
    }

    const methodData: PaymentMethod = { 
      name: newMethodName.toUpperCase(), 
      isCreditCard: newMethodIsCard 
    };

    if (newMethodIsCard) {
      if (newMethodDueDay) methodData.dueDay = parseInt(newMethodDueDay);
      if (newMethodBestDay) methodData.bestDay = parseInt(newMethodBestDay);
    }

    if (editingOriginalName) {
      // Atualização segura que reflete nas transações
      onRenamePaymentMethod(editingOriginalName, methodData);
      setEditingOriginalName(null);
    } else {
      // Criar novo
      setPaymentMethods([...paymentMethods, methodData]);
    }

    // Resetar formulário
    setNewMethodName('');
    setNewMethodIsCard(false);
    setNewMethodDueDay('');
    setNewMethodBestDay('');
  };

  const handleEditMethod = (method: PaymentMethod) => {
    setNewMethodName(method.name);
    setNewMethodIsCard(method.isCreditCard);
    setNewMethodDueDay(method.dueDay ? method.dueDay.toString() : '');
    setNewMethodBestDay(method.bestDay ? method.bestDay.toString() : '');
    setEditingOriginalName(method.name);
    
    // Rola a página para o topo do formulário suavemente
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setNewMethodName('');
    setNewMethodIsCard(false);
    setNewMethodDueDay('');
    setNewMethodBestDay('');
    setEditingOriginalName(null);
  };

  const handleRemoveMethod = (name: string) => {
    if (confirm('Tem certeza que deseja excluir?')) {
        setPaymentMethods(paymentMethods.filter(m => m.name !== name));
        if (editingOriginalName === name) handleCancelEdit();
    }
  };

  const handleToggleCardType = (name: string) => {
    setPaymentMethods(paymentMethods.map(m => m.name === name ? { ...m, isCreditCard: !m.isCreditCard } : m));
  };

  const movePaymentMethod = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === paymentMethods.length - 1)) return;
    
    const newMethods = [...paymentMethods];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newMethods[index], newMethods[swapIndex]] = [newMethods[swapIndex], newMethods[index]];
    
    setPaymentMethods(newMethods);
  };

  // --- Lógica de Categorias ---

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

  const moveCategory = (cat: string, direction: 'up' | 'down') => {
    const keys = Object.keys(categories);
    const index = keys.indexOf(cat);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === keys.length - 1)) return;

    const newKeys = [...keys];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newKeys[index], newKeys[swapIndex]] = [newKeys[swapIndex], newKeys[index]];

    // Reconstrói o objeto na nova ordem
    const newCategories: CategoryStructure = {};
    newKeys.forEach(key => {
        newCategories[key] = categories[key];
    });
    setCategories(newCategories);
  };

  // --- Lógica de Subcategorias ---

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

  const moveSubCategory = (cat: string, subIndex: number, direction: 'up' | 'down') => {
    const currentSubs = categories[cat];
    if ((direction === 'up' && subIndex === 0) || (direction === 'down' && subIndex === currentSubs.length - 1)) return;

    const newSubs = [...currentSubs];
    const swapIndex = direction === 'up' ? subIndex - 1 : subIndex + 1;
    [newSubs[subIndex], newSubs[swapIndex]] = [newSubs[swapIndex], newSubs[subIndex]];

    setCategories({
        ...categories,
        [cat]: newSubs
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
          
          <div className={`space-y-4 p-5 rounded-[1.5rem] border transition-all ${editingOriginalName ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-100'}`}>
            {editingOriginalName && (
               <div className="flex items-center gap-2 mb-2 text-blue-600 text-xs font-black uppercase tracking-widest">
                  <Edit3 size={12} /> Editando: {editingOriginalName}
               </div>
            )}
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ex: NUBANK, PIX..."
                className="flex-1 px-4 py-2.5 bg-white border-2 border-transparent rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                value={newMethodName}
                onChange={(e) => setNewMethodName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSaveMethod()}
              />
              <button 
                onClick={handleSaveMethod}
                className={`${editingOriginalName ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white p-2.5 rounded-xl transition-all shadow-lg shadow-blue-100`}
                title={editingOriginalName ? "Salvar Alterações" : "Adicionar Novo"}
              >
                {editingOriginalName ? <Save size={20} /> : <Plus size={20} />}
              </button>
              {editingOriginalName && (
                <button 
                  onClick={handleCancelEdit}
                  className="bg-gray-200 text-gray-600 p-2.5 rounded-xl hover:bg-gray-300 transition-all"
                  title="Cancelar Edição"
                >
                  <X size={20} />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3 cursor-pointer group">
                <button 
                    type="button"
                    onClick={() => setNewMethodIsCard(!newMethodIsCard)}
                    className={`w-10 h-5 rounded-full transition-all relative ${newMethodIsCard ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${newMethodIsCard ? 'left-6' : 'left-1'}`} />
                </button>
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-blue-600">Possui Fatura (Cartão de Crédito)</span>
            </div>

            {newMethodIsCard && (
              <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Dia Vencimento</label>
                   <input 
                    type="number" 
                    min="1" max="31"
                    placeholder="Ex: 10"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                    value={newMethodDueDay}
                    onChange={(e) => setNewMethodDueDay(e.target.value)}
                   />
                </div>
                <div>
                   <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Melhor Dia</label>
                   <input 
                    type="number" 
                    min="1" max="31"
                    placeholder="Ex: 3"
                    className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                    value={newMethodBestDay}
                    onChange={(e) => setNewMethodBestDay(e.target.value)}
                   />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {paymentMethods.map((method, idx) => (
              <div 
                key={method.name} 
                className={`flex items-center justify-between bg-white border p-3 rounded-2xl transition-all group shadow-sm ${editingOriginalName === method.name ? 'border-blue-500 ring-2 ring-blue-100' : 'border-gray-100 hover:border-blue-200'}`}
              >
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
                        <div className="flex gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            <span>{method.isCreditCard ? 'Cartão de Crédito' : 'Pagamento Imediato'}</span>
                            {method.isCreditCard && method.dueDay && (
                              <span className="flex items-center gap-1 text-blue-500"><Calendar size={10} /> Vence dia {method.dueDay}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex flex-col gap-1 mr-2">
                    {idx > 0 && (
                        <button onClick={() => movePaymentMethod(idx, 'up')} className="p-1 text-gray-300 hover:text-blue-600 transition-colors">
                            <ArrowUp size={12} />
                        </button>
                    )}
                    {idx < paymentMethods.length - 1 && (
                        <button onClick={() => movePaymentMethod(idx, 'down')} className="p-1 text-gray-300 hover:text-blue-600 transition-colors">
                            <ArrowDown size={12} />
                        </button>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => handleEditMethod(method)}
                    className={`p-2 rounded-lg transition-all ${editingOriginalName === method.name ? 'text-blue-600 bg-blue-50' : 'text-gray-300 hover:text-blue-600 hover:bg-blue-50'}`}
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </button>

                  <button 
                    onClick={() => handleRemoveMethod(method.name)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
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
            {Object.keys(categories).map((cat, idx, arr) => (
              <div key={cat} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                <div 
                  className={`flex items-center justify-between p-3 cursor-pointer transition-colors ${expandedCategory === cat ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  onClick={() => setExpandedCategory(expandedCategory === cat ? null : cat)}
                >
                  <div className="flex items-center gap-2">
                    {expandedCategory === cat ? <ChevronDown size={16} className="text-blue-600" /> : <ChevronRight size={16} className="text-gray-400" />}
                    <span className="text-sm font-bold text-gray-800">{cat}</span>
                  </div>
                  <div className="flex items-center gap-1">
                      <div className="flex flex-col gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                        {idx > 0 && (
                            <button onClick={() => moveCategory(cat, 'up')} className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors">
                                <ArrowUp size={12} />
                            </button>
                        )}
                        {idx < arr.length - 1 && (
                            <button onClick={() => moveCategory(cat, 'down')} className="p-0.5 text-gray-300 hover:text-blue-600 transition-colors">
                                <ArrowDown size={12} />
                            </button>
                        )}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleRemoveCategory(cat); }} className="p-2 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                </div>
                {expandedCategory === cat && (
                  <div className="p-4 bg-white border-t border-gray-50 space-y-4">
                    <div className="flex gap-2">
                      <input type="text" placeholder="Nova Subcategoria..." className="flex-1 px-3 py-2 bg-gray-50 border-none rounded-lg text-xs outline-none" value={newSubCategory} onChange={(e) => setNewSubCategory(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleAddSubCategory(cat)} />
                      <button onClick={() => handleAddSubCategory(cat)} className="bg-gray-900 text-white p-2 rounded-lg"><Plus size={14} /></button>
                    </div>
                    <div className="space-y-2">
                      {categories[cat].map((sub, subIdx) => (
                        <div key={sub} className="flex items-center justify-between bg-blue-50 text-blue-700 px-3 py-2 rounded-xl text-[11px] font-bold border border-blue-100">
                          <span>{sub}</span>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                                {subIdx > 0 && (
                                    <button onClick={() => moveSubCategory(cat, subIdx, 'up')} className="text-blue-300 hover:text-blue-600"><ArrowUp size={12} /></button>
                                )}
                                {subIdx < categories[cat].length - 1 && (
                                    <button onClick={() => moveSubCategory(cat, subIdx, 'down')} className="text-blue-300 hover:text-blue-600"><ArrowDown size={12} /></button>
                                )}
                            </div>
                            <button onClick={() => handleRemoveSubCategory(cat, sub)} className="text-blue-300 hover:text-red-500 ml-1"><Trash2 size={12} /></button>
                          </div>
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