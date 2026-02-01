"use client";

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type FilterStatus = 'todos' | 'pendente' | 'resolvido';
export type FilterType = 'todos' | 'receitas' | 'despesas';

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (status: FilterStatus, type: FilterType) => void;
  currentStatus: FilterStatus;
  currentType: FilterType;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  onApplyFilter,
  currentStatus,
  currentType,
}: FilterBottomSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>(currentStatus);
  const [selectedType, setSelectedType] = useState<FilterType>(currentType);

  const handleApply = () => {
    onApplyFilter(selectedStatus, selectedType);
    onClose();
  };

  const toggleStatus = (status: FilterStatus) => {
    setSelectedStatus(status);
  };

  const toggleType = (type: FilterType) => {
    setSelectedType(type);
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
      <div className="fixed inset-x-0 bottom-0 z-50 bg-emerald-600 rounded-t-3xl shadow-2xl animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Filtro de serviços</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApply}
                className="bg-white text-emerald-600 hover:bg-gray-100 font-semibold px-6 py-2 rounded-lg"
              >
                Filtrar
              </Button>
              <button
                onClick={onClose}
                className="text-white hover:bg-emerald-700 p-2 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Situação */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Situação
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleStatus('todos')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedStatus === 'todos'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => toggleStatus('pendente')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedStatus === 'pendente'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Pendente
              </button>
              <button
                onClick={() => toggleStatus('resolvido')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedStatus === 'resolvido'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Resolvido (Pago)
              </button>
            </div>
          </div>

          {/* Tipo de Lançamento */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Tipo
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => toggleType('todos')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedType === 'todos'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => toggleType('receitas')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedType === 'receitas'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Somente receitas
              </button>
              <button
                onClick={() => toggleType('despesas')}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  selectedType === 'despesas'
                    ? 'bg-white text-emerald-600 shadow-md'
                    : 'bg-emerald-700 text-white border-2 border-white/30'
                }`}
              >
                Somente despesas
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
