"use client";

import { useState, useMemo, useEffect } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { formatarMoeda } from '@/lib/storage';
import { ChevronLeft, ChevronRight, Car, Filter, X, RefreshCw, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeableServiceItem } from '@/components/custom/SwipeableServiceItem';
import { FilterBottomSheet, FilterStatus, FilterType, FilterPeriod, CategoriaLista } from '@/components/custom/FilterBottomSheet';
import { Servico } from '@/lib/types';
import { migrarNomeVeiculo } from '@/lib/migracao-nome-veiculo';
import { getAllProfileNotes } from '@/lib/profile-notes';
import { carregarListasStorage } from '@/components/custom/CategorySelectorModal';
import { ShareServicosModal } from '@/components/custom/ShareServicosModal';
import { NovaReceitaModal } from '@/components/custom/nova-receita-modal';

export default function ServicosPage() {
  const { servicos, updateServico, deleteServico } = useServicos();
  const [mesAtual, setMesAtual] = useState(new Date());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('todos');
  const [filterType, setFilterType] = useState<FilterType>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('todos');
  const [filterDataInicio, setFilterDataInicio] = useState<string>('');
  const [filterDataFim, setFilterDataFim] = useState<string>('');
  const [mostrarBotaoMigracao, setMostrarBotaoMigracao] = useState(false);
  const [shareModalAberto, setShareModalAberto] = useState(false);
  const [modalNovoServicoAberto, setModalNovoServicoAberto] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchText, setSearchText] = useState('');

  // Escutar evento do botão FAB da Navbar (mobile e desktop)
  useEffect(() => {
    const handler = () => setModalNovoServicoAberto(true);
    window.addEventListener('abrirModalNovoServico', handler);
    // Auto-abrir se veio de outra página via sessionStorage
    if (sessionStorage.getItem('autoAbrir') === 'novoServico') {
      sessionStorage.removeItem('autoAbrir');
      setTimeout(() => setModalNovoServicoAberto(true), 200);
    }
    return () => window.removeEventListener('abrirModalNovoServico', handler);
  }, []);

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

  // Listas de categorias com apenas as categorias que foram atribuídas a algum serviço
  const categoriasListas = useMemo((): CategoriaLista[] => {
    // Coleta todos os nomes de categorias atribuídas via profile-notes
    const notas = getAllProfileNotes();
    const catUsadas = new Set<string>();
    notas.forEach(n => n.categorias?.forEach(c => catUsadas.add(c)));

    // Carrega todas as listas definidas
    const todasListas = carregarListasStorage();

    // Filtra: mantém apenas as categorias que foram de fato usadas
    const listasComUsadas = todasListas
      .map(lista => ({
        id: lista.id,
        nome: lista.nome,
        categorias: lista.categorias
          .filter(cat => catUsadas.has(cat.nome))
          .map(cat => cat.nome),
      }))
      .filter(lista => lista.categorias.length > 0);

    return listasComUsadas;
  }, [servicos]); // re-calcula quando a lista de serviços muda (sesão aberta)

  // Filtrar serviços
  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => {
      const dataServico = new Date(s.data_servico);
      const hoje = new Date();

      // Filtro por período
      if (filterPeriod === 'todos' || !filterPeriod) {
        // Sem filtro de período — usa navegação por mês
        const mesMatch = dataServico.getMonth() === mesAtual.getMonth() &&
                         dataServico.getFullYear() === mesAtual.getFullYear();
        if (!mesMatch) return false;
      } else if (filterPeriod === 'mes_atual') {
        const mesMatch = dataServico.getMonth() === mesAtual.getMonth() &&
                         dataServico.getFullYear() === mesAtual.getFullYear();
        if (!mesMatch) return false;
      } else if (filterPeriod === 'mes_anterior') {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
        const fim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
        if (dataServico < inicio || dataServico > fim) return false;
      } else if (filterPeriod === 'ultimos_3_meses') {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 2, 1);
        if (dataServico < inicio) return false;
      } else if (filterPeriod === 'ultimos_6_meses') {
        const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 5, 1);
        if (dataServico < inicio) return false;
      } else if (filterPeriod === 'ano_atual') {
        const inicio = new Date(hoje.getFullYear(), 0, 1);
        if (dataServico < inicio) return false;
      } else if (filterPeriod === 'customizado') {
        const inicio = filterDataInicio ? new Date(filterDataInicio + 'T00:00:00') : null;
        const fim = filterDataFim ? new Date(filterDataFim + 'T23:59:59') : null;
        if (inicio && dataServico < inicio) return false;
        if (fim && dataServico > fim) return false;
      }

      // Filtro por status de pagamento
      if (filterStatus !== 'todos') {
        const statusPagamento = getStatusPagamento(s);
        if (statusPagamento !== filterStatus) return false;
      }

      // Filtro por tipo de lançamento
      if (filterType !== 'todos') {
        const tipoLancamento = getTipoLancamento(s);
        const tipoFiltroNormalizado = filterType === 'receitas' ? 'receita' : 'despesa';
        if (tipoLancamento !== tipoFiltroNormalizado) return false;
      }

      // Filtro por categoria (usa profile-notes)
      if (filterCategoria) {
        const notas = getAllProfileNotes();
        const nota = notas.find(n => n.servicoId === s.id);
        if (!nota?.categorias?.includes(filterCategoria)) return false;
      }

      return true;
    });
  }, [servicos, mesAtual, filterStatus, filterType, filterCategoria, filterPeriod, filterDataInicio, filterDataFim]);

  // Função para normalizar texto (remove acentos e coloca em minúsculas)
  const normalizar = (texto: string) =>
    texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Serviços com busca aplicada sobre os filtrados
  const servicosComBusca = useMemo(() => {
    if (!searchText.trim()) return servicosFiltrados;
    const busca = normalizar(searchText.trim());
    return servicosFiltrados.filter(s =>
      normalizar(s.nome_veiculo || '').startsWith(busca)
    );
  }, [servicosFiltrados, searchText]);

  // Agrupar serviços por data E ordenar cronologicamente
  const servicosAgrupados = useMemo(() => {
    const grupos: { [key: string]: { servicos: typeof servicos; dataOrdenacao: Date } } = {};

    // Primeiro, agrupar os serviços por data
    servicosComBusca.forEach(servico => {
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

    // Ordenar os serviços dentro de cada grupo por data_servico (horário)
    Object.keys(grupos).forEach(data => {
      grupos[data].servicos.sort((a, b) => {
        const dataA = new Date(a.data_servico).getTime();
        const dataB = new Date(b.data_servico).getTime();

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
  }, [servicosComBusca]);

  // Calcular totais baseados nos serviços com busca
  const totais = useMemo(() => {
    const resolvidos = servicosComBusca
      .filter(s => getStatusPagamento(s) === 'resolvido')
      .reduce((acc, s) => acc + (s.valor_servico || s.valor_cobrado), 0);

    const pendentes = servicosComBusca
      .filter(s => getStatusPagamento(s) === 'pendente')
      .reduce((acc, s) => acc + (s.valor_servico || s.valor_cobrado), 0);

    const total = servicosComBusca.reduce(
      (acc, s) => acc + (s.valor_servico || s.valor_cobrado),
      0
    );

    return {
      resolvidos,
      pendentes,
      total
    };
  }, [servicosComBusca]);

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

  const handleApplyFilter = (status: FilterStatus, type: FilterType, categoria: string, period?: FilterPeriod, dataInicio?: string, dataFim?: string) => {
    setFilterStatus(status);
    setFilterType(type);
    setFilterPeriod(period || 'todos');
    setFilterDataInicio(dataInicio || '');
    setFilterDataFim(dataFim || '');
    setFilterCategoria(categoria);
  };

  const handleClearFilter = () => {
    setFilterStatus('todos');
    setFilterType('todos');
    setFilterCategoria('');
  };

  const handleMigrarNomes = () => {
    const resultado = migrarNomeVeiculo();
    alert(resultado.mensagem);
    window.location.reload(); // Recarregar para mostrar os dados atualizados
  };

  const hasActiveFilter = filterStatus !== 'todos' || filterType !== 'todos' || filterCategoria !== '';

  const getFilterLabel = () => {
    const labels: string[] = [];
    
    if (filterStatus === 'pendente') labels.push('Pendentes');
    if (filterStatus === 'resolvido') labels.push('Resolvidos');
    if (filterType === 'receitas') labels.push('Receitas');
    if (filterType === 'despesas') labels.push('Despesas');
    if (filterCategoria) labels.push(filterCategoria);
    
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
                className={searchOpen ? "text-emerald-600 bg-emerald-50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}
                title="Pesquisar por nome"
              >
                <Search className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShareModalAberto(true)}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                title="Compartilhar serviços"
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
            /* Sem filtro: resolvidos e pendentes */
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col items-start">
                <p className="text-xs text-gray-500 whitespace-nowrap">Serviços resolvidos</p>
                <p className={`font-semibold text-emerald-600 break-words w-full ${
                  totais.resolvidos >= 1000000 ? 'text-sm' :
                  totais.resolvidos >= 100000 ? 'text-base' :
                  'text-lg'
                }`}>
                  {formatarMoeda(totais.resolvidos)}
                </p>
              </div>
              <div className="flex flex-col items-end">
                <p className="text-xs text-gray-500 whitespace-nowrap">Serviços pendentes</p>
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

      {/* Modal de Compartilhamento */}
      <ShareServicosModal
        isOpen={shareModalAberto}
        onClose={() => setShareModalAberto(false)}
        servicos={servicosComBusca}
        periodo={mesAtual.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        filtroLabel={hasActiveFilter ? getFilterLabel() : undefined}
        totais={totais}
      />

      {/* Bottom Sheet de Filtros */}
      <FilterBottomSheet
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApplyFilter={handleApplyFilter}
        currentStatus={filterStatus}
        currentType={filterType}
        currentCategoria={filterCategoria}
        categoriasListas={categoriasListas}
        currentPeriod={filterPeriod}
        currentDataInicio={filterDataInicio}
        currentDataFim={filterDataFim}
      />

      {/* Modal Nova Receita/Despesa (abre pelo FAB da navbar) */}
      <NovaReceitaModal
        isOpen={modalNovoServicoAberto}
        onClose={() => setModalNovoServicoAberto(false)}
        tipoInicial="receita"
      />
    </div>
  );
}
