"use client";

import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (range: DateRange) => void;
  currentRange: DateRange;
}

export function DateRangePicker({ isOpen, onClose, onSelect, currentRange }: DateRangePickerProps) {
  const [tempRange, setTempRange] = useState<DateRange>(currentRange);
  const [selectingFrom, setSelectingFrom] = useState(true);

  if (!isOpen) return null;

  const handleQuickSelect = (type: 'current_month' | 'last_month' | 'current_year' | 'all') => {
    const now = new Date();
    let range: DateRange;

    switch (type) {
      case 'current_month':
        range = {
          from: startOfMonth(now),
          to: endOfMonth(now)
        };
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        range = {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth)
        };
        break;
      case 'current_year':
        range = {
          from: startOfYear(now),
          to: endOfYear(now)
        };
        break;
      case 'all':
        range = {
          from: new Date(2020, 0, 1),
          to: now
        };
        break;
    }

    onSelect(range);
    onClose();
  };

  const handleDateChange = (field: 'from' | 'to', value: string) => {
    const date = new Date(value);
    setTempRange(prev => ({
      ...prev,
      [field]: date
    }));
  };

  const handleApply = () => {
    onSelect(tempRange);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center md:justify-center">
      <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-gray-900">Selecionar Período</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Opções Rápidas */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Opções Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleQuickSelect('current_month')}
                className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors"
              >
                Mês Atual
              </button>
              <button
                onClick={() => handleQuickSelect('last_month')}
                className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors"
              >
                Mês Anterior
              </button>
              <button
                onClick={() => handleQuickSelect('current_year')}
                className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors"
              >
                Este Ano
              </button>
              <button
                onClick={() => handleQuickSelect('all')}
                className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-medium transition-colors"
              >
                Todo Período
              </button>
            </div>
          </div>

          {/* Seleção Manual */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Período Personalizado</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Inicial
                </label>
                <input
                  type="date"
                  value={format(tempRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('from', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data Final
                </label>
                <input
                  type="date"
                  value={format(tempRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => handleDateChange('to', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors"
            >
              Aplicar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
