"use client";

import { useState } from 'react';
import { X, Tag, Calendar, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type FilterStatus = 'todos' | 'pendente' | 'resolvido';
export type FilterType = 'todos' | 'receitas' | 'despesas';
export type FilterPeriod = 'todos' | 'mes_atual' | 'mes_anterior' | 'ultimos_3_meses' | 'ultimos_6_meses' | 'ano_atual' | 'customizado';

export interface CategoriaLista {
  id: string;
  nome: string;
  categorias: string[];
}

interface FilterBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilter: (status: FilterStatus, type: FilterType, categoria: string, period?: FilterPeriod, dataInicio?: string, dataFim?: string) => void;
  currentStatus: FilterStatus;
  currentType: FilterType;
  currentCategoria?: string;
  /** @deprecated use categoriasListas */
  availableCategories?: string[];
  categoriasListas?: CategoriaLista[];
  currentPeriod?: FilterPeriod;
  currentDataInicio?: string;
  currentDataFim?: string;
}

export function FilterBottomSheet({
  isOpen,
  onClose,
  onApplyFilter,
  currentStatus,
  currentType,
  currentCategoria = '',
  availableCategories = [],
  categoriasListas = [],
  currentPeriod = 'todos',
  currentDataInicio = '',
  currentDataFim = '',
}: FilterBottomSheetProps) {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>(currentStatus);
  const [selectedType, setSelectedType] = useState<FilterType>(currentType);
  const [selectedCategoria, setSelectedCategoria] = useState<string>(currentCategoria);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>(currentPeriod);
  const [dataInicio, setDataInicio] = useState<string>(currentDataInicio);
  const [dataFim, setDataFim] = useState<string>(currentDataFim);
  const [modoCustom, setModoCustom] = useState<'data' | 'ano'>('data');
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());

  const anoAtual = new Date().getFullYear();

  const handleApply = () => {
    let inicio = dataInicio;
    let fim = dataFim;
    if (selectedPeriod === 'customizado' && modoCustom === 'ano') {
      inicio = `${anoSelecionado}-01-01`;
      fim = `${anoSelecionado}-12-31`;
    }
    onApplyFilter(selectedStatus, selectedType, selectedCategoria, selectedPeriod, inicio, fim);
    onClose();
  };

  if (!isOpen) return null;

  const periodos: { value: FilterPeriod; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'mes_atual', label: 'Mês atual' },
    { value: 'mes_anterior', label: 'Mês anterior' },
    { value: 'ultimos_3_meses', label: 'Últimos 3 meses' },
    { value: 'ultimos_6_meses', label: 'Últimos 6 meses' },
    { value: 'ano_atual', label: 'Ano atual' },
    { value: 'customizado', label: 'Personalizado' },
  ];

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

          {/* Período */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Período
            </h3>
            <div className="flex flex-wrap gap-2">
              {periodos.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setSelectedPeriod(value)}
                  className={`px-4 py-2 rounded-full font-medium transition-all flex items-center gap-1.5 ${
                    selectedPeriod === value
                      ? 'bg-white text-emerald-600 shadow-md'
                      : 'bg-emerald-700 text-white border-2 border-white/30'
                  }`}
                >
                  {value === 'customizado' && <Calendar className="w-3.5 h-3.5" />}
                  {label}
                </button>
              ))}
            </div>

            {/* Campos de data customizada */}
            {selectedPeriod === 'customizado' && (
              <div className="mt-3 space-y-3">
                {/* Toggle modo */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setModoCustom('data')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${modoCustom === 'data' ? 'bg-white text-emerald-600' : 'bg-emerald-700 text-white border border-white/30'}`}
                  >
                    Por data
                  </button>
                  <button
                    onClick={() => setModoCustom('ano')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${modoCustom === 'ano' ? 'bg-white text-emerald-600' : 'bg-emerald-700 text-white border border-white/30'}`}
                  >
                    Por ano
                  </button>
                </div>

                {modoCustom === 'data' ? (
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-white/80 mb-1">De</label>
                      <input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-700 border border-white/30 text-white text-sm focus:outline-none focus:border-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-white/80 mb-1">Até</label>
                      <input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-emerald-700 border border-white/30 text-white text-sm focus:outline-none focus:border-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-white/80 mb-2">Selecione o ano</label>
                    <div className="flex items-center justify-between bg-emerald-700 border border-white/30 rounded-xl px-2 py-1">
                      <button
                        onClick={() => setAnoSelecionado(a => a - 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 active:bg-emerald-500 transition-colors text-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <span className="text-white font-bold text-xl tracking-wide select-none">{anoSelecionado}</span>
                      <button
                        onClick={() => setAnoSelecionado(a => a + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-emerald-600 active:bg-emerald-500 transition-colors text-white"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Situação */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
              Situação
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['todos', 'pendente', 'resolvido'] as FilterStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`px-4 py-2 rounded-full font-medium transition-all ${
                    selectedStatus === s
                      ? 'bg-white text-emerald-600 shadow-md'
                      : 'bg-emerald-700 text-white border-2 border-white/30'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s === 'pendente' ? 'Pendente' : 'Resolvido (Pago)'}
                </button>
              ))}
            </div>
          </div>

          {/* Categoria */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white uppercase tracking-wide flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Categorias
            </h3>

            {/* Botão "Todas" sempre visível */}
            <button
              onClick={() => setSelectedCategoria('')}
              className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                selectedCategoria === ''
                  ? 'bg-white text-emerald-600 shadow-md'
                  : 'bg-emerald-700 text-white border-2 border-white/30'
              }`}
            >
              Todas
            </button>

            {categoriasListas.length > 0 ? (
              <div className="space-y-4">
                {categoriasListas.map(lista => (
                  <div key={lista.id}>
                    {/* Nome da lista */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <FolderOpen className="w-3.5 h-3.5 text-white/60" />
                      <span className="text-xs font-semibold text-white/60 uppercase tracking-wide">{lista.nome}</span>
                    </div>
                    {/* Categorias da lista */}
                    <div className="flex flex-wrap gap-2">
                      {lista.categorias.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategoria(selectedCategoria === cat ? '' : cat)}
                          className={`px-4 py-2 rounded-full font-medium transition-all text-sm ${
                            selectedCategoria === cat
                              ? 'bg-white text-emerald-600 shadow-md'
                              : 'bg-emerald-700 text-white border-2 border-white/30'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60 italic">Nenhuma categoria foi atribuída a serviços ainda</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
