
import React from 'react';
import { Transaction, EntryType } from '../types';
import { formatCurrency } from '../utils';
import { Trash2, CreditCard, Repeat, Tag, Edit3 } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete, onEdit }) => {
  const isDarkBg = (colorClass?: string) => {
    const darkBgs = ['bg-red-600', 'bg-blue-700', 'bg-purple-800', 'bg-gray-900', 'bg-amber-900', 'bg-indigo-600', 'bg-emerald-600', 'bg-orange-500', 'bg-pink-500', 'bg-slate-500'];
    return colorClass && darkBgs.includes(colorClass);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria / Sub</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cartão</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((t) => {
            const dark = isDarkBg(t.color);
            return (
              <tr key={t.id} className={`${t.color || ''} ${t.fontColor || (dark ? 'text-white' : 'text-gray-900')} hover:opacity-95 transition-all border-b border-gray-100`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold">{t.description}</span>
                    {t.isRecurring && <Repeat size={14} className="opacity-70" />}
                    {t.installments && (
                      <span className={`text-[10px] ${dark ? 'bg-white/20' : 'bg-black/10'} px-1.5 py-0.5 rounded font-bold`}>
                        {t.installments.current}/{t.installments.total}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{t.category}</span>
                    <div className="flex items-center text-[10px] opacity-70">
                      <Tag size={10} className="mr-1" />
                      <span>{t.subcategory}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {t.cardSuffix ? (
                    <div className={`flex items-center space-x-1 text-xs ${dark ? 'bg-white/20 border-white/20' : 'bg-black/5 border-black/10'} w-fit px-2 py-1 rounded-full border`}>
                      <CreditCard size={12} />
                      <span className="font-bold">{t.cardSuffix}</span>
                    </div>
                  ) : (
                    <span className={`text-xs ${dark ? 'text-white/30' : 'text-gray-300'}`}>N/A</span>
                  )}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-black ${t.type === EntryType.INCOME ? (dark ? 'text-white' : 'text-green-600') : (dark ? 'text-white' : 'text-red-600')}`}>
                  {formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                  <div className="flex items-center justify-center space-x-2">
                    <button 
                      onClick={() => onEdit(t)} 
                      className={`p-2 rounded-lg ${dark ? 'hover:bg-white/10' : 'hover:bg-black/10'} transition-colors`}
                      title="Editar"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => onDelete(t.id)} 
                      className="p-2 rounded-lg hover:bg-red-500 hover:text-white transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-gray-400 italic">
                Nenhum lançamento encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
