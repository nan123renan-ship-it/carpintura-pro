"use client";

import { useState, useEffect } from 'react';
import { X, Check, Calendar, DollarSign, FileText, Tag } from 'lucide-react';
import { Despesa, TipoDespesa, StatusPagamentoDespesa } from '@/lib/types';

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
  const [dataDespesa, setDataDespesa] = useState('');
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamentoDespesa>('pendente');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);

  // Carregar dados da despesa quando o modal abrir
  useEffect(() => {
    if (isOpen && despesa) {
      setValor(despesa.valor.toFixed(2).replace('.', ','));
      setNomeDespesa(despesa.descricao);
      setCategoriaDespesa(despesa.tipo_despesa);
      setDataDespesa(despesa.data_despesa);
      setStatusPagamento(despesa.status_pagamento || 'pendente');
      setDescricaoDespesa(despesa.observacoes || '');
    }
  }, [isOpen, despesa]);

  if (!isOpen) return null;

  const handleNumeroClick = (num: string) => {
    if (valor === '0,00') {
      setValor(`0,0${num}`);
    } else {
      const valorSemFormatacao = valor.replace(',', '').replace('.', '');
      const novoValor = valorSemFormatacao + num;
      const valorNumerico = parseInt(novoValor) / 100;
      setValor(valorNumerico.toFixed(2).replace('.', ','));
    }
  };

  const handleBackspace = () => {
    const valorSemFormatacao = valor.replace(',', '').replace('.', '');
    if (valorSemFormatacao.length <= 2) {
      setValor('0,00');
    } else {
      const novoValor = valorSemFormatacao.slice(0, -1);
      const valorNumerico = parseInt(novoValor) / 100;
      setValor(valorNumerico.toFixed(2).replace('.', ','));
    }
  };

  const handleLimpar = () => {
    setValor('0,00');
  };

  const handleSalvar = () => {
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    if (!nomeDespesa.trim() || valorNumerico === 0) {
      alert('Por favor, preencha o nome e o valor da despesa.');
      return;
    }

    const despesaAtualizada: Partial<Despesa> = {
      descricao: nomeDespesa,
      valor: valorNumerico,
      tipo_despesa: categoriaDespesa,
      data_despesa: dataDespesa,
      status_pagamento: statusPagamento,
      observacoes: descricaoDespesa,
    };

    onSave(despesa.id, despesaAtualizada);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
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

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto">
            {/* Teclado Numérico - CONDICIONAL */}
            {tecladoVisivel && (
              <div className="p-2 bg-gray-50 border-b-4 border-red-500">
                <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleNumeroClick(num.toString())}
                      className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    onClick={handleLimpar}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-red-600 transition-colors"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleNumeroClick('0')}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                  >
                    0
                  </button>
                  <button
                    onClick={handleBackspace}
                    className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-gray-600 transition-colors"
                  >
                    ←
                  </button>
                </div>
                <button
                  onClick={() => setTecladoVisivel(false)}
                  className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                >
                  Fechar teclado
                </button>
              </div>
            )}

            {/* Campos do Formulário */}
            <div className="p-6 space-y-4">
              {/* Nome da Despesa */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Despesa *
                </label>
                <input
                  type="text"
                  value={nomeDespesa}
                  onChange={(e) => setNomeDespesa(e.target.value)}
                  placeholder="Digite o nome da despesa..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={categoriaDespesa}
                  onChange={(e) => setCategoriaDespesa(e.target.value as TipoDespesa)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="Tinta">Tinta</option>
                  <option value="Massa">Massa</option>
                  <option value="Lixa">Lixa</option>
                  <option value="Verniz">Verniz</option>
                  <option value="Compressor/Equipamentos">Compressor/Equipamentos</option>
                  <option value="EPI (máscara, luva, etc.)">EPI (máscara, luva, etc.)</option>
                  <option value="Luz/Água">Luz/Água</option>
                  <option value="Aluguel">Aluguel</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Materiais">Materiais</option>
                  <option value="Terceiros">Terceiros</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              {/* Data */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Despesa *
                </label>
                <input
                  type="date"
                  value={dataDespesa}
                  onChange={(e) => setDataDespesa(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Status de Pagamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status de Pagamento
                </label>
                <select
                  value={statusPagamento}
                  onChange={(e) => setStatusPagamento(e.target.value as StatusPagamentoDespesa)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="pendente">Pendente</option>
                  <option value="pago">Pago</option>
                </select>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={descricaoDespesa}
                  onChange={(e) => setDescricaoDespesa(e.target.value)}
                  placeholder="Adicione observações sobre esta despesa..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Footer com Botões */}
          <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Salvar
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
