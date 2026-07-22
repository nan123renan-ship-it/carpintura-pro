"use client";

import { useState, useMemo, useEffect } from 'react';
import { useDespesas } from '@/hooks/useDespesas';
import { useServicos } from '@/hooks/useServicos';
import { formatarMoeda, migrarServicosExistentes } from '@/lib/storage';
import { ChevronLeft, ChevronRight, TrendingDown, Filter, X, Plus, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeableExpenseItem } from '@/components/custom/SwipeableExpenseItem';
import { EditDespesaModal } from '@/components/custom/edit-despesa-modal';
import { ExpenseFilterBottomSheet, ExpenseFilterPeriod, ExpenseFilterOrigin, ExpenseFilterStatus, ExpenseCategoriaLista } from '@/components/custom/ExpenseFilterBottomSheet';
import { Despesa } from '@/lib/types';
import Link from 'next/link';
import { NovaReceitaModal } from '@/components/custom/nova-receita-modal';
import { carregarListasStorage } from '@/components/custom/CategorySelectorModal';
import { ShareDespesasModal } from '@/components/custom/ShareDespesasModal';

export default function DespesasPage() {
  const { despesas, deleteDespesa, updateDespesa } = useDespesas();
  const { servicos, updateServico, deleteServico } = useServicos();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<ExpenseFilterPeriod>('mes_atual');
  const [filterOrigin, setFilterOrigin] = useState<ExpenseFilterOrigin>('todas');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [filterDataInicio, setFilterDataInicio] = useState<string>('');
  const [filterDataFim, setFilterDataFim] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<ExpenseFilterStatus>('todos');
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null);
  const [modalNovaDespesaAberto, setModalNovaDespesaAberto] = useState(false);
  const [shareModalAberto, setShareModalAberto] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Executar migração automática ao carregar a página
  useEffect(() => {
    migrarServicosExistentes();
  }, []);

  // Escutar evento do botão FAB do Navbar (mobile e desktop)
  useEffect(() => {
    const handler = () => setModalNovaDespesaAberto(true);
    window.addEventListener('abrirModalNovaDespesa', handler);
    // Auto-abrir se veio de outra página via sessionStorage
    if (sessionStorage.getItem('autoAbrir') === 'novaDespesa') {
      sessionStorage.removeItem('autoAbrir');
      setTimeout(() => setModalNovaDespesaAberto(true), 200);
    }
    return () => window.removeEventListener('abrirModalNovaDespesa', handler);
  }, []);

  // Listas de categorias com apenas as categorias atribuídas a alguma despesa
  const categoriasListas = useMemo((): ExpenseCategoriaLista[] => {
    // Coleta todos os nomes de categorias usados nas despesas
    const catUsadas = new Set<string>();
    despesas.forEach(d => {
      if (d.categorias && d.categorias.length > 0) {
        d.categorias.forEach(c => catUsadas.add(c));
      }
    });

    // Carrega todas as listas definidas e filtra apenas as categorias usadas
    const todasListas = carregarListasStorage();
    return todasListas
      .map(lista => ({
        id: lista.id,
        nome: lista.nome,
        categorias: lista.categorias
          .filter(cat => catUsadas.has(cat.nome))
          .map(cat => cat.nome),
      }))
      .filter(lista => lista.categorias.length > 0);
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
          return dataDespesa.getMonth() === mesAtual.getMonth() &&
                 dataDespesa.getFullYear() === mesAtual.getFullYear();
        case 'mes_anterior': {
          const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
          const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
          return dataDespesa >= inicio && dataDespesa <= fim;
        }
        case 'ultimos_3_meses':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
          break;
        case 'ultimos_6_meses':
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
          break;
        case 'ano_atual':
          dataInicio = new Date(hoje.getFullYear(), 0, 1);
          break;
        case 'customizado': {
          const inicio = filterDataInicio ? new Date(filterDataInicio + 'T00:00:00') : null;
          const fim = filterDataFim ? new Date(filterDataFim + 'T23:59:59') : null;
          if (inicio && dataDespesa < inicio) return false;
          if (fim && dataDespesa > fim) return false;
          return true;
        }
        default:
          dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      }

      return dataDespesa >= dataInicio;
    });

    // Filtro por origem
    if (filterOrigin === 'servicos') {
      resultado = resultado.filter(d => d.origem === 'servico');
    } else if (filterOrigin === 'manuais') {
      resultado = resultado.filter(d => d.origem === 'manual');
    }

    // Filtro por tipo/categoria
    if (filterType !== 'Todos') {
      resultado = resultado.filter(d =>
        (d.categorias && d.categorias.includes(filterType)) || d.tipo_despesa === filterType
      );
    }

    // Filtro por status de pagamento
    if (filterStatus === 'pago') {
      resultado = resultado.filter(d => d.status_pagamento === 'pago');
    } else if (filterStatus === 'pendente') {
      resultado = resultado.filter(d => d.status_pagamento !== 'pago');
    }

    return resultado.sort((a, b) =>
      new Date(b.data_despesa).getTime() - new Date(a.data_despesa).getTime()
    );
  }, [despesas, mesAtual, filterPeriod, filterOrigin, filterType, filterDataInicio, filterDataFim, filterStatus]);

  // Função para normalizar texto (remove acentos e coloca em minúsculas)
  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Despesas com busca aplicada sobre as filtradas
  const despesasComBusca = useMemo(() => {
    if (!searchText.trim()) return despesasFiltradas;
    const busca = normalizar(searchText.trim());
    return despesasFiltradas.filter(d =>
      normalizar(d.descricao || '').startsWith(busca)
    );
  }, [despesasFiltradas, searchText]);

  // Agrupar despesas por data
  const despesasAgrupadas = useMemo(() => {
    const grupos: { [key: string]: { despesas: typeof despesasFiltradas; dataOrdenacao: Date } } = {};

    despesasComBusca.forEach(despesa => {
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
  }, [despesasComBusca]);

  // Calcular totais baseados nas despesas com busca
  const totais = useMemo(() => {
    const despesasPagas = despesasComBusca.filter(d => d.status_pagamento === 'pago');
    const despesasPendentes = despesasComBusca.filter(d => d.status_pagamento !== 'pago');

    const totalPagas = despesasPagas.reduce((acc, d) => acc + d.valor, 0);
    const totalPendentes = despesasPendentes.reduce((acc, d) => acc + d.valor, 0);
    const total = despesasComBusca.reduce((acc, d) => acc + d.valor, 0);

    return {
      pagas: totalPagas,
      pendentes: totalPendentes,
      total
    };
  }, [despesasComBusca]);

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

  const handleDelete = (despesaId: string, _servicoId?: string) => {
    deleteDespesa(despesaId);
  };

  const handleApplyFilter = (period: ExpenseFilterPeriod, origin: ExpenseFilterOrigin, type: string, dataInicio?: string, dataFim?: string, status?: ExpenseFilterStatus) => {
    setFilterPeriod(period);
    setFilterOrigin(origin);
    setFilterType(type);
    setFilterDataInicio(dataInicio || '');
    setFilterDataFim(dataFim || '');
    setFilterStatus(status || 'todos');
  };

  const handleClearFilter = () => {
    setFilterPeriod('mes_atual');
    setFilterOrigin('todas');
    setFilterType('Todos');
  };

  const hasActiveFilter = filterPeriod !== 'mes_atual' || filterOrigin !== 'todas' || filterType !== 'Todos' || filterStatus !== 'todos';

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
    <div className="min-h-screen bg-[#0a1f18] flex flex-col">
      {/* Header com navegação de mês */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between mb-0">
            {/* Seta esquerda + data + seta direita */}
            <div className="flex items-center gap-1">
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

              <Button
                variant="ghost"
                size="icon"
                onClick={() => mudarMes(1)}
                className="text-gray-600 hover:text-gray-900"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(true)}
                className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
              >
                <Filter className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setSearchOpen(o => !o); setSearchText(''); }}
                className={searchOpen ? "text-red-500 bg-red-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
                title="Pesquisar por nome"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShareModalAberto(true)}
                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                title="Compartilhar despesas"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Campo de pesquisa por nome */}
          {searchOpen && (
            <div className="mt-2 mb-1">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Pesquisar pelo nome..."
                  className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
                />
                {searchText && (
                  <button onClick={() => setSearchText('')} className="text-gray-400 hover:text-gray-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

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
        <div className="max-w-4xl mx-auto px-4 py-2">
          {hasActiveFilter ? (
            /* Com filtro ativo: só o total filtrado centralizado */
            <div className="flex flex-col items-center">
              <p className="text-xs text-gray-500 whitespace-nowrap">Total filtrado</p>
              <p className={`font-bold text-blue-600 ${
                totais.total >= 1000000 ? 'text-sm' :
                totais.total >= 100000 ? 'text-base' :
                'text-lg'
              }`}>
                {formatarMoeda(totais.total)}
              </p>
            </div>
          ) : (
            /* Sem filtro: pagas e pendentes */
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-start">
                <p className="text-xs text-gray-500 whitespace-nowrap">Despesas pagas</p>
                <p className={`font-semibold text-emerald-600 break-words w-full ${
                  totais.pagas >= 1000000 ? 'text-sm' :
                  totais.pagas >= 100000 ? 'text-base' :
                  'text-lg'
                }`}>
                  {formatarMoeda(totais.pagas)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-xs text-gray-500 whitespace-nowrap">Despesas pendentes</p>
                <p className={`font-semibold text-red-600 break-words text-right w-full ${
                  totais.pendentes >= 1000000 ? 'text-sm' :
                  totais.pendentes >= 100000 ? 'text-base' :
                  'text-lg'
                }`}>
                  {formatarMoeda(totais.pendentes)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nova Despesa (abre pelo FAB do navbar) */}
      <NovaReceitaModal
        isOpen={modalNovaDespesaAberto}
        onClose={() => setModalNovaDespesaAberto(false)}
        tipoInicial="despesa"
      />

      {/* Modal de Edição de Despesa */}
      {editingDespesa && (
        <EditDespesaModal
          isOpen={!!editingDespesa}
          onClose={() => setEditingDespesa(null)}
          despesa={editingDespesa}
          onSave={handleSaveEdit}
        />
      )}

      {/* Modal de Compartilhamento */}
      <ShareDespesasModal
        isOpen={shareModalAberto}
        onClose={() => setShareModalAberto(false)}
        despesas={despesasComBusca}
        periodo={mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        filtroLabel={hasActiveFilter ? getFilterLabel() : undefined}
        totais={totais}
      />

      {/* Bottom Sheet de Filtros */}
      <ExpenseFilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentPeriod={filterPeriod}
        currentOrigin={filterOrigin}
        currentType={filterType}
        currentStatus={filterStatus}
        categoriasListas={categoriasListas}
        currentDataInicio={filterDataInicio}
        currentDataFim={filterDataFim}
      />
    </div>
  );
}
