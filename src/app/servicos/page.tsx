"use client";

import { useState, useMemo, useEffect } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { formatarMoeda } from '@/lib/storage';
import { ChevronLeft, ChevronRight, Car, Filter, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeableServiceItem } from '@/components/custom/SwipeableServiceItem';
import { FilterBottomSheet, FilterStatus, FilterType } from '@/components/custom/FilterBottomSheet';
import { Servico } from '@/lib/types';
import { migrarNomeVeiculo } from '@/lib/migracao-nome-veiculo';

export default function ServicosPage() {
  const { servicos, updateServico, deleteServico } = useServicos();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [mostrarBotaoMigracao, setMostrarBotaoMigracao] = useState(false);

  // Verificar se há serviços sem nome_veiculo
  useEffect(() => {
    const servicosSemNome = servicos.filter(s => !s.nome_veiculo || s.nome_veiculo.trim() === '');
    setMostrarBotaoMigracao(servicosSemNome.length > 0);
  }, [servicos]);

  // Função auxiliar para determinar status_pagamento baseado no status atual
  const getStatusPagamento = (servico: Servico): 'pendente' | 'resolvido' => {
    if (servico.status_pagamento) {
      return servico.status_pagamento;
    }
    // Fallback: considerar Pago e Finalizado como resolvido
    return servico.status === 'Pago' || servico.status === 'Finalizado' ? 'resolvido' : 'pendente';
  };

  // Função auxiliar para determinar tipo_lancamento
  const getTipoLancamento = (servico: Servico): 'receita' | 'despesa' => {
    if (servico.tipo_lancamento) {
      return servico.tipo_lancamento;
    }
    // Por padrão, serviços são receitas
    return 'receita';
  };

  // Filtrar serviços
  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      const dataServico = new Date(s.data_servico);
      const mesMatch = dataServico.getMonth() === mesAtual.getMonth() &&
                       dataServico.getFullYear() === mesAtual.getFullYear();
      
      if (!mesMatch) return false;

      // Filtro por status de pagamento
      if (filterStatus !== 'todos') {
        const statusPagamento = getStatusPagamento(s);
        if (statusPagamento !== filterStatus) return false;
      }

      // Filtro por tipo de lançamento
      if (filterType !== 'todos') {
        const tipoLancamento = getTipoLancamento(s);
        if (tipoLancamento !== filterType) return false;
      }

      return true;
    });
  }, [servicos, mesAtual, filterStatus, filterType]);

  // Agrupar serviços por data E ordenar cronologicamente
  const servicosAgrupados = useMemo(() => {
    const grupos: { [key: string]: { servicos: typeof servicos; dataOrdenacao: Date } } = {};
    
    // Primeiro, agrupar os serviços por data
    servicosFiltrados.forEach(servico => {
      const dataServico = new Date(servico.data_servico);
      const dataFormatada = dataServico.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long'
      });
      
      if (!grupos[dataFormatada]) {
        grupos[dataFormatada] = {
          servicos: [],
          dataOrdenacao: dataServico
        };
      }
      grupos[dataFormatada].servicos.push(servico);
    });

    // Ordenar os serviços dentro de cada grupo por data_servico (horário) ou created_at
    Object.keys(grupos).forEach(data => {
      grupos[data].servicos.sort((a, b) => {
        const dataA = new Date(a.data_servico).getTime();
        const dataB = new Date(b.data_servico).getTime();
        
        // Se as datas forem iguais, ordenar por created_at (se existir)
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
        acc[data] = grupo.servicos;
        return acc;
      }, {} as { [key: string]: typeof servicos });

    return gruposOrdenados;
  }, [servicosFiltrados]);

  // Calcular totais baseados nos serviços filtrados
  const totais = useMemo(() => {
    const resolvidos = servicosFiltrados
      .filter(s => getStatusPagamento(s) === 'resolvido')
      .reduce((acc, s) => acc + (s.valor_servico || s.valor_cobrado), 0);

    const pendentes = servicosFiltrados
      .filter(s => getStatusPagamento(s) === 'pendente')
      .reduce((acc, s) => acc + (s.valor_servico || s.valor_cobrado), 0);

    const total = servicosFiltrados.reduce(
      (acc, s) => acc + (s.valor_servico || s.valor_cobrado),
      0
    );

    return {
      resolvidos,
      pendentes,
      total
    };
  }, [servicosFiltrados]);

  const mudarMes = (direcao: number) => {
    setMesAtual(prev => {
      const nova = new Date(prev);
      nova.setMonth(nova.getMonth() + direcao);
      return nova;
    });
  };

  const handleMarkAsPaid = (id: string) => {
    updateServico(id, { 
      status: 'Pago',
      status_pagamento: 'resolvido'
    });
  };

  const handleMarkAsPending = (id: string) => {
    updateServico(id, { 
      status: 'Orçamento',
      status_pagamento: 'pendente'
    });
  };

  const handleDelete = (id: string) => {
    deleteServico(id);
  };

  const handleApplyFilter = (status: FilterStatus, type: FilterType) => {
    setFilterStatus(status);
    setFilterType(type);
  };

  const handleClearFilter = () => {
    setFilterStatus('todos');
    setFilterType('todos');
  };

  const handleMigrarNomes = () => {
    const resultado = migrarNomeVeiculo();
    alert(resultado.mensagem);
    window.location.reload(); // Recarregar para mostrar os dados atualizados
  };

  const hasActiveFilter = filterStatus !== 'todos' || filterType !== 'todos';

  const getFilterLabel = () => {
    const labels: string[] = [];
    
    if (filterStatus === 'pendente') labels.push('Pendentes');
    if (filterStatus === 'resolvido') labels.push('Resolvidos');
    if (filterType === 'receitas') labels.push('Receitas');
    if (filterType === 'despesas') labels.push('Despesas');
    
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

          {/* Botão de migração (aparece apenas se houver serviços sem nome) */}
          {mostrarBotaoMigracao && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-3">
              <div className="flex items-start gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Atualização disponível
                  </p>
                  <p className="text-xs text-blue-700 mb-2">
                    Alguns serviços antigos não têm o nome do veículo. Clique para atualizar automaticamente.
                  </p>
                  <Button
                    onClick={handleMigrarNomes}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                  >
                    Atualizar agora
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Faixa de filtro ativo */}
          {hasActiveFilter && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 flex items-center justify-between mb-3">
              <span className="text-sm text-emerald-800">
                <span className="font-semibold">Filtrando por:</span> {getFilterLabel()}
              </span>
              <button
                onClick={handleClearFilter}
                className="text-emerald-600 hover:text-emerald-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de transações agrupadas por data */}
      <div className="flex-1 overflow-y-auto pb-32">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {Object.keys(servicosAgrupados).length === 0 ? (
            <div className="text-center py-12">
              <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {hasActiveFilter 
                  ? 'Nenhum serviço encontrado com os filtros aplicados'
                  : 'Nenhum serviço neste mês'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(servicosAgrupados).map(([data, servicosData]) => (
                <div key={data}>
                  {/* Cabeçalho da data */}
                  <h3 className="text-sm font-medium text-gray-500 mb-3 capitalize">
                    {data}
                  </h3>
                  
                  {/* Lista de serviços do dia */}
                  <div className="space-y-2">
                    {servicosData.map((servico) => (
                      <SwipeableServiceItem
                        key={servico.id}
                        servico={servico}
                        onMarkAsPaid={handleMarkAsPaid}
                        onMarkAsPending={handleMarkAsPending}
                        onDelete={handleDelete}
                      />
                    ))}
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
            {/* Serviços Resolvidos */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Serviços resolvidos</p>
              <p className={`font-semibold text-emerald-600 break-words w-full ${
                totais.resolvidos >= 1000000 ? 'text-sm' : 
                totais.resolvidos >= 100000 ? 'text-base' : 
                'text-lg'
              }`}>
                {formatarMoeda(totais.resolvidos)}
              </p>
            </div>
            
            {/* Serviços Pendentes */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Serviços pendentes</p>
              <p className={`font-semibold text-red-600 break-words w-full ${
                totais.pendentes >= 1000000 ? 'text-sm' : 
                totais.pendentes >= 100000 ? 'text-base' : 
                'text-lg'
              }`}>
                {formatarMoeda(totais.pendentes)}
              </p>
            </div>
            
            {/* Total Filtrado */}
            <div className="flex flex-col items-start">
              <p className="text-xs text-gray-500 mb-1 whitespace-nowrap">Total filtrado</p>
              <p className={`font-semibold text-blue-600 break-words w-full ${
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

      {/* Bottom Sheet de Filtros */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentStatus={filterStatus}
        currentType={filterType}
      />
    </div>
  );
}
