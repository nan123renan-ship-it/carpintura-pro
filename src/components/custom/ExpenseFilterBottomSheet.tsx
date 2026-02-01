"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type ExpenseFilterPeriod = 'mes_atual' | 'mes_anterior' | 'ultimos_3_meses' | 'ultimos_6_meses' | 'ano_atual';
export type ExpenseFilterOrigin = 'todas' | 'servicos' | 'manuais';

interface ExpenseFilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (period: ExpenseFilterPeriod, origin: ExpenseFilterOrigin, type: string) => void;
  currentPeriod: ExpenseFilterPeriod;
  currentOrigin: ExpenseFilterOrigin;
  currentType: string;
  availableTypes: string[];
}

export function ExpenseFilterBottomSheet({
  isOpen,
  onClose,
  onApplyFilter,
  currentPeriod,
  currentOrigin,
  currentType,
  availableTypes,
}: ExpenseFilterBottomSheetProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ExpenseFilterPeriod>(currentPeriod);
  const [selectedOrigin, setSelectedOrigin] = useState<ExpenseFilterOrigin>(currentOrigin);
  const [selectedType, setSelectedType] = useState<string>(currentType);

  const handleApply = () => {
    onApplyFilter(selectedPeriod, selectedOrigin, selectedType);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-red-600 rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Filtro de despesas</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApply}
                className="bg-white text-red-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-lg"
              >
                Filtrar
              </Button>
              <button
                onClick={onClose}
                className="text-white hover:bg-red-700 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Período */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Período
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedPeriod('mes_atual')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedPeriod === 'mes_atual'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Mês atual
              </button>
              <button
                onClick={() => setSelectedPeriod('mes_anterior')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedPeriod === 'mes_anterior'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Mês anterior
              </button>
              <button
                onClick={() => setSelectedPeriod('ultimos_3_meses')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedPeriod === 'ultimos_3_meses'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Últimos 3 meses
              </button>
              <button
                onClick={() => setSelectedPeriod('ultimos_6_meses')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedPeriod === 'ultimos_6_meses'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Últimos 6 meses
              </button>
              <button
                onClick={() => setSelectedPeriod('ano_atual')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedPeriod === 'ano_atual'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Ano atual
              </button>
            </div>
          </div>

          {/* Origem */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Origem
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedOrigin('todas')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedOrigin === 'todas'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSelectedOrigin('servicos')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedOrigin === 'servicos'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Só de serviços
              </button>
              <button
                onClick={() => setSelectedOrigin('manuais')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedOrigin === 'manuais'
                    ? 'bg-white text-red-600 shadow-md'
                    : 'bg-red-700 text-white border-2 border-white/30'
                }`}
              >
                Só manuais
              </button>
            </div>
          </div>

          {/* Tipo de Despesa */}
          {availableTypes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                Tipo de Despesa
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedType('Todos')}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedType === 'Todos'
                      ? 'bg-white text-red-600 shadow-md'
                      : 'bg-red-700 text-white border-2 border-white/30'
                  }`}
                >
                  Todos
                </button>
                {availableTypes.map(tipo => (
                  <button
                    key={tipo}
                    onClick={() => setSelectedType(tipo)}
                    className={`px-4 py-2 rounded-full font-medium transition-all ${
                      selectedType === tipo
                        ? 'bg-white text-red-600 shadow-md'
                        : 'bg-red-700 text-white border-2 border-white/30'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
