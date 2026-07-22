"use client";

import { useState, useEffect } from 'react';
import { X, Check, DollarSign, Tag, ChevronRight } from 'lucide-react';
import { Despesa, TipoDespesa, StatusPagamentoDespesa, TipoGastoDespesa } from '@/lib/types';
import { CategorySelectorModal, CategoryFieldButton } from './CategorySelectorModal';

interface EditDespesaModalProps {
  isOpen: boolean;
  onClose: () => void;
  despesa: Despesa;
  onSave: (id: string, despesaAtualizada: Partial<Despesa>) => void;
}

export function EditDespesaModal({ isOpen, onClose, despesa, onSave }: EditDespesaModalProps) {
  const [valor, setValor] = useState('0,00');
  const [nomeDespesa, setNomeDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState<TipoDespesa>('Outros');
  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [dataDespesa, setDataDespesa] = useState('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamentoDespesa>('pendente');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [tipoGasto, setTipoGasto] = useState<TipoGastoDespesa>('empresarial');

  useEffect(() => {
    if (isOpen && despesa) {
      setValor(despesa.valor.toFixed(2).replace('.', ','));
      setNomeDespesa(despesa.descricao);
      setCategoriaDespesa(despesa.tipo_despesa);
      setCategoriasSelecionadas(despesa.categorias || [despesa.tipo_despesa]);
      setDataDespesa(despesa.data_despesa);
      setStatusPagamento(despesa.status_pagamento || 'pendente');
      setDescricaoDespesa(despesa.observacoes || '');
      setTipoGasto(despesa.tipo_gasto || 'empresarial');
    }
  }, [isOpen, despesa]);

  if (!isOpen) return null;

  const handleNumeroClick = (num: string) => {
    if (valor === '0,00') { setValor(`0,0${num}`); return; }
    const raw = valor.replace(',', '').replace('.', '');
    const n = parseInt(raw + num) / 100;
    setValor(n.toFixed(2).replace('.', ','));
  };

  const handleBackspace = () => {
    const raw = valor.replace(',', '').replace('.', '');
    if (raw.length <= 2) { setValor('0,00'); return; }
    const n = parseInt(raw.slice(0, -1)) / 100;
    setValor(n.toFixed(2).replace('.', ','));
  };

  const handleSalvar = () => {
    const v = parseFloat(valor.replace(',', '.'));
    if (!nomeDespesa.trim() || v === 0) {
      alert('Preencha o nome e o valor da despesa.');
      return;
    }
    onSave(despesa.id, {
      descricao: nomeDespesa,
      valor: v,
      tipo_despesa: (categoriasSelecionadas[0] as TipoDespesa) || categoriaDespesa,
      categorias: categoriasSelecionadas,
      data_despesa: dataDespesa,
      status_pagamento: statusPagamento,
      observacoes: descricaoDespesa,
      tipo_gasto: tipoGasto,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={e => e.stopPropagation()}
        >
          {/* Header valor */}
          <div className="bg-red-500">
            <button
              onClick={() => setTecladoVisivel(!tecladoVisivel)}
              className="w-full p-6 text-center hover:bg-white/10 transition-colors text-white"
            >
              <div className="flex items-center justify-center gap-3">
                <DollarSign className="w-8 h-8" />
                <span className="text-5xl font-bold">R$ {valor}</span>
              </div>
              <p className="text-sm text-white/70 mt-2">Clique para editar</p>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Teclado numérico */}
            {tecladoVisivel && (
              <div className="p-2 bg-gray-50 border-b-4 border-red-500">
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                  {[1,2,3,4,5,6,7,8,9].map(n => (
                    <button key={n} onClick={() => handleNumeroClick(n.toString())}
                      className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 shadow-sm text-lg font-semibold text-gray-800 transition-colors">{n}</button>
                  ))}
                  <button onClick={() => setValor('0,00')}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 shadow-sm text-sm font-semibold text-red-600 transition-colors">C</button>
                  <button onClick={() => handleNumeroClick('0')}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 shadow-sm text-lg font-semibold text-gray-800 transition-colors">0</button>
                  <button onClick={handleBackspace}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 shadow-sm text-sm font-semibold text-gray-600 transition-colors">←</button>
                </div>
                <button onClick={() => setTecladoVisivel(false)}
                  className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium">Fechar teclado</button>
              </div>
            )}

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Despesa *</label>
                <input type="text" value={nomeDespesa} onChange={e => setNomeDespesa(e.target.value)}
                  placeholder="Digite o nome da despesa..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black" />
              </div>

              {/* Toggle Empresarial / Pessoal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Essa despesa é?</label>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100">
                  <button
                    type="button"
                    onClick={() => setTipoGasto('empresarial')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${tipoGasto === 'empresarial' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tipoGasto === 'empresarial' ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    Empresarial
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoGasto('pessoal')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition-all duration-200 ${tipoGasto === 'pessoal' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <span className={`w-2 h-2 rounded-full ${tipoGasto === 'pessoal' ? 'bg-purple-500' : 'bg-gray-300'}`} />
                    Pessoal
                  </button>
                </div>
                {tipoGasto === 'pessoal' && (
                  <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                    <span className="w-3.5 h-3.5 rounded-full bg-purple-100 flex items-center justify-center shrink-0">!</span>
                    Não entra nos cálculos automaticamente para não misturar com despesas da empresa. Mas você pode somá-la quando quiser usando os botões "Subtrair" ou "Incluir".
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Categorias
                </label>
                <CategoryFieldButton
                  selecionadas={categoriasSelecionadas}
                  onClick={() => setModalCategorias(true)}
                  accent="red"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Despesa *</label>
                <input type="date" value={dataDespesa} onChange={e => setDataDespesa(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status de Pagamento</label>
                <select value={statusPagamento} onChange={e => setStatusPagamento(e.target.value as StatusPagamentoDespesa)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-black">
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição (opcional)</label>
                <textarea value={descricaoDespesa} onChange={e => setDescricaoDespesa(e.target.value)}
                  placeholder="Adicione observações sobre esta despesa..." rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-black" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors flex items-center justify-center gap-2">
              <X className="w-5 h-5" /> Cancelar
            </button>
            <button onClick={handleSalvar}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center gap-2">
              <Check className="w-5 h-5" /> Salvar
            </button>
          </div>
        </div>
      </div>

      <CategorySelectorModal
        isOpen={modalCategorias}
        onClose={() => setModalCategorias(false)}
        selecionadas={categoriasSelecionadas}
        onChange={setCategoriasSelecionadas}
        accent="red"
      />
    </>
  );
}
