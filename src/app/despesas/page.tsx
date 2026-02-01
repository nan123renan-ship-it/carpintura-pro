"use client";

import { useState, useMemo, useEffect } from 'react';
import { useDespesas } from '@/hooks/useDespesas';
import { useServicos } from '@/hooks/useServicos';
import { formatarMoeda, migrarServicosExistentes } from '@/lib/storage';
import { ChevronLeft, ChevronRight, TrendingDown, Filter, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeableExpenseItem } from '@/components/custom/SwipeableExpenseItem';
import { EditDespesaModal } from '@/components/custom/edit-despesa-modal';
import { ExpenseFilterBottomSheet, ExpenseFilterPeriod, ExpenseFilterOrigin } from '@/components/custom/ExpenseFilterBottomSheet';
import { Despesa } from '@/lib/types';
import Link from 'next/link';

export default function DespesasPage() {
  const { despesas, deleteDespesa, updateDespesa } = useDespesas();
  const { servicos, updateServico, deleteServico } = useServicos();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<ExpenseFilterPeriod>('mes_atual');
  const [filterOrigin, setFilterOrigin] = useState<ExpenseFilterOrigin>('todas');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);

  // Executar migração automática ao carregar a página
  useEffect(() => {
    migrarServicosExistentes();
  }, []);

  // Tipos únicos de despesas
  const tiposUnicos = useMemo(() => {
    const tipos = new Set(despesas.map(d => d.tipo_despesa));
    return Array.from(tipos);
  }, [despesas]);

  // Filtrar despesas baseado no mês atual e filtros
  const despesasFiltradas = useMemo(() => {
    let resultado = despesas.filter(d => {
      const dataDespesa = new Date(d.data_despesa);
      
      // Filtro por período
      const hoje = new Date();
      let dataInicio: Date;
      
      switch (filterPeriod) {
        case 'mes_atual':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
          break;
        case 'mes_anterior':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          const dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
          return dataDespesa >= dataInicio && dataDespesa <= dataFim;
        case 'ultimos_3_meses':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
          break;
        case 'ultimos_6_meses':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
          break;
        case 'ano_atual':
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }
      
      // Para mês atual, filtrar pelo mês selecionado no navegador
      if (filterPeriod === 'mes_atual') {
        return dataDespesa.getMonth() === mesAtual.getMonth() &&
               dataDespesa.getFullYear() === mesAtual.getFullYear();
      }
      
      return dataDespesa >= dataInicio;
    });

    // Filtro por origem
    if (filterOrigin === 'servicos') {
      resultado = resultado.filter(d => d.origem === 'servico');
    } else if (filterOrigin === 'manuais') {
      resultado = resultado.filter(d => d.origem === 'manual');
    }

    // Filtro por tipo
    if (filterType !== 'Todos') {
      resultado = resultado.filter(d => d.tipo_despesa === filterType);
    }

    return resultado.sort((a, b) => 
      new Date(b.data_despesa).getTime() - new Date(a.data_despesa).getTime()
    );
  }, [despesas, mesAtual, filterPeriod, filterOrigin, filterType]);

  // Agrupar despesas por data
  const despesasAgrupadas = useMemo(() => {
    const grupos: { [key: string]: { despesas: typeof despesasFiltradas; dataOrdenacao: Date } } = {};
    
    despesasFiltradas.forEach(despesa => {
      const dataDespesa = new Date(despesa.data_despesa);
      const dataFormatada = dataDespesa.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long'
      });
      
      if (!grupos[dataFormatada]) {
        grupos[dataFormatada] = {
          despesas: [],
          dataOrdenacao: dataDespesa
        };
      }
      grupos[dataFormatada].despesas.push(despesa);
    });

    // Ordenar despesas dentro de cada grupo
    Object.keys(grupos).forEach(data => {
      grupos[data].despesas.sort((a, b) => {
        const dataA = new Date(a.data_despesa).getTime();
        const dataB = new Date(b.data_despesa).getTime();
        
        if (dataA === dataB && a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        
        return dataA - dataB;
      });
    });

    // Converter para array e ordenar as datas do mais antigo para o mais novo
    const gruposOrdenados = Object.entries(grupos)
      .sort(([, a], [, b]) => a.dataOrdenacao.getTime() - b.dataOrdenacao.getTime())
      .reduce((acc, [data, grupo]) => {
        acc[data] = grupo.despesas;
        return acc;
      }, {} as { [key: string]: typeof despesasFiltradas });

    return gruposOrdenados;
  }, [despesasFiltradas]);

  // Calcular totais
  const totais = useMemo(() => {
    const despesasServico = despesasFiltradas.filter(d => d.origem === 'servico');
    const despesasManuais = despesasFiltradas.filter(d => d.origem === 'manual');

    const totalServicos = despesasServico.reduce((acc, d) => acc + d.valor, 0);
    const totalManuais = despesasManuais.reduce((acc, d) => acc + d.valor, 0);
    const total = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0);

    return {
      servicos: totalServicos,
      manuais: totalManuais,
      total
    };
  }, [despesasFiltradas]);

  const mudarMes = (direcao: number) => {
    setMesAtual(prev => {
      const nova = new Date(prev);
      nova.setMonth(nova.getMonth() + direcao);
      return nova;
    });
  };

  const handleEdit = (despesa: Despesa) => {
    setEditingDespesa(despesa);
  };

  const handleSaveEdit = (id: string, despesaAtualizada: Partial<Despesa>) => {
    updateDespesa(id, despesaAtualizada);
    setEditingDespesa(null);
  };

  const handleTogglePaymentStatus = (despesaId: string, currentStatus: 'pago' | 'pendente') => {
    const newStatus = currentStatus === 'pago' ? 'pendente' : 'pago';
    updateDespesa(despesaId, { status_pagamento: newStatus });
  };

  const handleDelete = (despesaId: string, servicoId?: string) => {
    if (servicoId) {
      // Remover despesas vinculadas ao serviço
      const despesasVinculadas = despesas.filter(d => d.servico_id === servicoId);
      despesasVinculadas.forEach(d => deleteDespesa(d.id));
      
      // Remover o serviço
      deleteServico(servicoId);
    } else {
      deleteDespesa(despesaId);
    }
  };

  const handleApplyFilter = (period: ExpenseFilterPeriod, origin: ExpenseFilterOrigin, type: string) => {
    setFilterPeriod(period);
    setFilterOrigin(origin);
    setFilterType(type);
  };

  const handleClearFilter = () => {
    setFilterPeriod('mes_atual');
    setFilterOrigin('todas');
    setFilterType('Todos');
  };

  const hasActiveFilter = filterPeriod !== 'mes_atual' || filterOrigin !== 'todas' || filterType !== 'Todos';

  const getFilterLabel = () => {
    const labels: string[] = [];
    
    if (filterPeriod === 'mes_anterior') labels.push('Mês anterior');
    if (filterPeriod === 'ultimos_3_meses') labels.push('Últimos 3 meses');
    if (filterPeriod === 'ultimos_6_meses') labels.push('Últimos 6 meses');
    if (filterPeriod === 'ano_atual') labels.push('Ano atual');
    
    if (filterOrigin === 'servicos') labels.push('Só de serviços');
    if (filterOrigin === 'manuais') labels.push('Só manuais');
    
    if (filterType !== 'Todos') labels.push(filterType);
    
    return labels.length > 0 ? labels.join(', ') : '';
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header com navegação de mês */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => mudarMes(-1)}
              className="text-gray-600 hover:text-gray-900"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            
            <h2 className="text-lg font-semibold text-gray-900 capitalize">
              {mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h2>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(true)}
                className="text-gray-600 hover:text-gray-900"
              >
                <Filter className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => mudarMes(1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Faixa de filtro ativo */}
          {hasActiveFilter && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center justify-between mb-3">
              <span className="text-sm text-red-800">
                <span className="font-semibold">Filtrando por:</span> {getFilterLabel()}
              </span>
              <button
                onClick={handleClearFilter}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de despesas agrupadas por data */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {Object.keys(despesasAgrupadas).length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {hasActiveFilter 
                  ? 'Nenhuma despesa encontrada com os filtros aplicados'
                  : 'Nenhuma despesa neste mês'}
              </p>
              <Link
                href="/despesas/nova"
                className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Nova Despesa
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(despesasAgrupadas).map(([data, despesasData]) => (
                <div key={data}>
                  {/* Cabeçalho da data */}
                  <h3 className="text-sm font-medium text-gray-500 mb-3 capitalize">
                    {data}
                  </h3>
                  
                  {/* Lista de despesas do dia */}
                  <div className="space-y-2">
                    {despesasData.map((despesa) => {
                      const servico = despesa.servico_id ? servicos.find(s => s.id === despesa.servico_id) : null;
                      
                      return (
                        <SwipeableExpenseItem
                          key={despesa.id}
                          despesa={despesa}
                          servico={servico ? { id: servico.id, status: servico.status } : null}
                          onEdit={handleEdit}
                          onTogglePaymentStatus={handleTogglePaymentStatus}
                          onDelete={handleDelete}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rodapé fixo com totais filtrados */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="grid grid-cols-3 gap-2">
            {/* Despesas de Serviços */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Despesas de serviços</p>
              <p className={`font-semibold text-blue-600 break-words w-full ${
                totais.servicos >= 1000000 ? 'text-sm' : 
                totais.servicos >= 100000 ? 'text-base' : 
                'text-lg'
              }`}>
                {formatarMoeda(totais.servicos)}
              </p>
            </div>
            
            {/* Despesas Manuais */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Despesas manuais</p>
              <p className={`font-semibold text-orange-600 break-words w-full ${
                totais.manuais >= 1000000 ? 'text-sm' : 
                totais.manuais >= 100000 ? 'text-base' : 
                'text-lg'
              }`}>
                {formatarMoeda(totais.manuais)}
              </p>
            </div>
            
            {/* Total Filtrado */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Total filtrado</p>
              <p className={`font-semibold text-red-600 break-words w-full ${
                totais.total >= 1000000 ? 'text-sm' : 
                totais.total >= 100000 ? 'text-base' : 
                'text-lg'
              }`}>
                {formatarMoeda(totais.total)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edição de Despesa */}
      {editingDespesa && (
        <EditDespesaModal
          isOpen={!!editingDespesa}
          onClose={() => setEditingDespesa(null)}
          despesa={editingDespesa}
          onSave={handleSaveEdit}
        />
      )}

      {/* Bottom Sheet de Filtros */}
      <ExpenseFilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentPeriod={filterPeriod}
        currentOrigin={filterOrigin}
        currentType={filterType}
        availableTypes={tiposUnicos}
      />
    </div>
  );
}
