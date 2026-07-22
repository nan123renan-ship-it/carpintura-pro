"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDespesas } from '@/hooks/useDespesas';
import { TipoDespesa } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Tag, CheckCircle, Clock } from 'lucide-react';
import { StatusPagamentoDespesa } from '@/lib/types';
import Link from 'next/link';
import { CategorySelectorModal, CategoryFieldButton } from '@/components/custom/CategorySelectorModal';

export default function NovaDespesaPage() {
  const router = useRouter();
  const { addDespesa } = useDespesas();

  const [categoriasSelecionadas, setCategoriasSelecionadas] = useState<string[]>([]);
  const [modalCategorias, setModalCategorias] = useState(false);
  const [formData, setFormData] = useState({
    data_despesa: new Date().toISOString().split('T')[0],
    descricao: '',
    valor: '',
    observacoes: '',
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamentoDespesa>('pendente'); // padrão: pendente

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (!formData.valor || parseFloat(formData.valor) <= 0) newErrors.valor = 'Valor deve ser maior que zero';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      addDespesa({
        data_despesa: formData.data_despesa,
        tipo_despesa: (categoriasSelecionadas[0] as TipoDespesa) || 'Outros',
        categorias: categoriasSelecionadas,
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        observacoes: formData.observacoes.trim(),
        relacionado_a_servico: false,
        origem: 'manual',
        servico_id: null,
        status_pagamento: statusPagamento,
      });
      router.push('/despesas');
    } catch (error) {
      console.error('Erro ao salvar despesa:', error);
      alert('Erro ao salvar despesa. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1f18]">
      <div className="max-w-3xl mx-auto px-4 py-6">

        <div className="mb-6">
          <Link href="/despesas" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Voltar para Despesas
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Nova Despesa</h1>
          <p className="text-gray-600 mt-1">Registre um novo gasto</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data da Despesa *</label>
            <Input
              type="date"
              value={formData.data_despesa}
              onChange={e => setFormData({ ...formData, data_despesa: e.target.value })}
              required
              className="bg-white border-gray-300"
            />
          </div>

          {/* Categorias */}
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
            <Input
              type="text"
              placeholder="Ex: 1 galão de tinta prata"
              value={formData.descricao}
              onChange={e => {
                setFormData({ ...formData, descricao: e.target.value });
                if (errors.descricao) setErrors({ ...errors, descricao: '' });
              }}
              required
              className={`bg-white border-gray-300 ${errors.descricao ? 'border-red-500' : ''}`}
            />
            {errors.descricao && <p className="text-red-500 text-sm mt-1">{errors.descricao}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Valor (R$) *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatusPagamento(s => s === 'pago' ? 'pendente' : 'pago')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-medium text-sm transition-colors whitespace-nowrap ${
                  statusPagamento === 'pago'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                    : 'bg-orange-50 border-orange-300 text-orange-600'
                }`}
              >
                {statusPagamento === 'pago'
                  ? <><CheckCircle className="w-4 h-4" /> Pago</>
                  : <><Clock className="w-4 h-4" /> Pendente</>
                }
              </button>
              <div className="flex-1">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={e => {
                    setFormData({ ...formData, valor: e.target.value });
                    if (errors.valor) setErrors({ ...errors, valor: '' });
                  }}
                  required
                  className={`bg-white border-gray-300 ${errors.valor ? 'border-red-500' : ''}`}
                />
              </div>
            </div>
            {errors.valor && <p className="text-red-500 text-sm mt-1">{errors.valor}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Observações</label>
            <Textarea
              placeholder="Informações adicionais sobre esta despesa..."
              value={formData.observacoes}
              onChange={e => setFormData({ ...formData, observacoes: e.target.value })}
              rows={4}
              className="bg-white border-gray-300"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors active:scale-95 min-h-[48px]"
            >
              <Save className="w-5 h-5" />
              Salvar Despesa
            </button>
            <Link
              href="/despesas"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center min-h-[48px]"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>

      <CategorySelectorModal
        isOpen={modalCategorias}
        onClose={() => setModalCategorias(false)}
        selecionadas={categoriasSelecionadas}
        onChange={setCategoriasSelecionadas}
        accent="red"
      />
    </div>
  );
}
