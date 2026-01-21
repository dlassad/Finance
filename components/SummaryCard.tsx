
import React from 'react';
import { formatCurrency } from '../utils';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isUp: boolean;
  };
  colorClass?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, amount, icon, colorClass = "text-blue-600" }) => {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <span className="text-gray-500 font-medium text-sm">{title}</span>
        <div className={`p-2 rounded-lg bg-gray-50 ${colorClass}`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className={`text-2xl font-bold ${amount < 0 ? 'text-red-600' : 'text-gray-900'}`}>
          {formatCurrency(amount)}
        </h3>
      </div>
    </div>
  );
};
