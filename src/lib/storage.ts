// Sistema de armazenamento local para Car Pintura Pro

import { Servico, Despesa, CategoriaServico } from './types';

const STORAGE_KEYS = {
  SERVICOS: 'car_pintura_servicos',
  DESPESAS: 'car_pintura_despesas',
  CATEGORIAS: 'car_pintura_categorias',
  MIGRATED: 'car_pintura_migrated_v1', // Flag para controlar migração
  OBSERVACOES_POR_PERFIL: 'car_pintura_observacoes_perfil', // Observações específicas de cada perfil
};

// Categorias padrão
const CATEGORIAS_PADRAO: CategoriaServico[] = [
  { id: '1', nome_categoria: 'Pintura geral' },
  { id: '2', nome_categoria: 'Para-choque' },
  { id: '3', nome_categoria: 'Capô' },
  { id: '4', nome_categoria: 'Lateral' },
  { id: '5', nome_categoria: 'Retoque' },
  { id: '6', nome_categoria: 'Polimento' },
];

// Helper para obter perfil atual
const getPerfilAtual = (): string => {
  if (typeof window === 'undefined') return '';
  const profileData = localStorage.getItem('userProfile');
  if (profileData) {
    const profile = JSON.parse(profileData);
    return profile.tipoPerfil || '';
  }
  return '';
};

// Helpers de localStorage
export const storage = {
  // Serviços - FILTRADOS POR PERFIL
  getServicos: (): Servico[] => {
    if (typeof window === 'undefined') return [];
    const perfilAtual = getPerfilAtual();
    const data = localStorage.getItem(STORAGE_KEYS.SERVICOS);
    const todosServicos: Servico[] = data ? JSON.parse(data) : [];

    // Filtrar apenas serviços do perfil atual
    return todosServicos.filter(s => (s as any).perfil === perfilAtual);
  },

  // Obter TODOS os serviços (para operações internas)
  _getAllServicos: (): Servico[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.SERVICOS);
    return data ? JSON.parse(data) : [];
  },
  
  setServicos: (servicos: Servico[]) => {
    if (typeof window === 'undefined') return;
    const perfilAtual = getPerfilAtual();
    const todosServicos = storage._getAllServicos();

    // Remover serviços antigos do perfil atual
    const servicosOutrosPerfis = todosServicos.filter(s => (s as any).perfil !== perfilAtual);

    // Adicionar novos serviços do perfil atual
    const novosServicos = [...servicosOutrosPerfis, ...servicos];

    localStorage.setItem(STORAGE_KEYS.SERVICOS, JSON.stringify(novosServicos));
  },

  addServico: (servico: Servico) => {
    const perfilAtual = getPerfilAtual();
    const todosServicos = storage._getAllServicos();

    // Adicionar perfil ao serviço
    const servicoComPerfil = { ...servico, perfil: perfilAtual } as any;

    todosServicos.push(servicoComPerfil);
    localStorage.setItem(STORAGE_KEYS.SERVICOS, JSON.stringify(todosServicos));
  },
  
  updateServico: (id: string, servico: Partial<Servico>) => {
    const todosServicos = storage._getAllServicos();
    const index = todosServicos.findIndex(s => s.id === id);
    if (index !== -1) {
      todosServicos[index] = { ...todosServicos[index], ...servico };
      localStorage.setItem(STORAGE_KEYS.SERVICOS, JSON.stringify(todosServicos));
    }
  },

  deleteServico: (id: string) => {
    const todosServicos = storage._getAllServicos().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SERVICOS, JSON.stringify(todosServicos));
  },
  
  // Despesas - FILTRADAS POR PERFIL
  getDespesas: (): Despesa[] => {
    if (typeof window === 'undefined') return [];
    const perfilAtual = getPerfilAtual();
    const data = localStorage.getItem(STORAGE_KEYS.DESPESAS);
    const todasDespesas: Despesa[] = data ? JSON.parse(data) : [];

    // Filtrar apenas despesas do perfil atual
    return todasDespesas.filter(d => (d as any).perfil === perfilAtual);
  },

  // Obter TODAS as despesas (para operações internas)
  _getAllDespesas: (): Despesa[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DESPESAS);
    return data ? JSON.parse(data) : [];
  },
  
  setDespesas: (despesas: Despesa[]) => {
    if (typeof window === 'undefined') return;
    const perfilAtual = getPerfilAtual();
    const todasDespesas = storage._getAllDespesas();

    // Remover despesas antigas do perfil atual
    const despesasOutrosPerfis = todasDespesas.filter(d => (d as any).perfil !== perfilAtual);

    // Adicionar novas despesas do perfil atual
    const novasDespesas = [...despesasOutrosPerfis, ...despesas];

    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(novasDespesas));
  },

  addDespesa: (despesa: Despesa) => {
    const perfilAtual = getPerfilAtual();
    const todasDespesas = storage._getAllDespesas();

    // Adicionar perfil à despesa
    const despesaComPerfil = { ...despesa, perfil: perfilAtual } as any;

    todasDespesas.push(despesaComPerfil);
    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(todasDespesas));
  },
  
  updateDespesa: (id: string, despesa: Partial<Despesa>) => {
    const todasDespesas = storage._getAllDespesas();
    const index = todasDespesas.findIndex(d => d.id === id);
    if (index !== -1) {
      todasDespesas[index] = { ...todasDespesas[index], ...despesa };
      localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(todasDespesas));
    }
  },

  deleteDespesa: (id: string) => {
    const todasDespesas = storage._getAllDespesas().filter(d => d.id !== id);
    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(todasDespesas));
  },
  
  // Categorias
  getCategorias: (): CategoriaServico[] => {
    if (typeof window === 'undefined') return CATEGORIAS_PADRAO;
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIAS);
    return data ? JSON.parse(data) : CATEGORIAS_PADRAO;
  },
  
  setCategorias: (categorias: CategoriaServico[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CATEGORIAS, JSON.stringify(categorias));
  },
};

// Funções para sincronizar despesas de serviços
export const sincronizarDespesasServico = (servico: Servico) => {
  if (typeof window === 'undefined') return;

  const perfilAtual = getPerfilAtual();
  const todasDespesas = storage._getAllDespesas();

  // Remover apenas despesas automáticas (origem='servico') deste serviço
  // As despesas manuais vinculadas (origem='manual') devem ser preservadas
  const despesasSemServico = todasDespesas.filter(
    d => !(d.servico_id === servico.id && (d as any).origem === 'servico')
  );
  
  // Criar novas despesas baseadas nos custos do serviço
  const novasDespesas: Despesa[] = [];
  
  // Custo de Materiais
  if (servico.custo_materiais > 0) {
    novasDespesas.push({
      id: `dsp-mat-${servico.id}`,
      data_despesa: servico.data_servico,
      tipo_despesa: 'Materiais',
      descricao: `Materiais - ${servico.cliente_nome} (${servico.carro_marca} ${servico.carro_modelo})`,
      valor: servico.custo_materiais,
      relacionado_a_servico: true,
      servico_relacionado: servico.id,
      observacoes: `Custo de materiais do serviço: ${servico.servico_descricao}`,
      origem: 'servico',
      servico_id: servico.id,
      forma_pagamento: servico.forma_pagamento,
      perfil: perfilAtual,
    } as any);
  }
  
  // Custo de Terceiros
  if (servico.custo_terceiros > 0) {
    novasDespesas.push({
      id: `dsp-ter-${servico.id}`,
      data_despesa: servico.data_servico,
      tipo_despesa: 'Terceiros',
      descricao: `Terceiros - ${servico.cliente_nome} (${servico.carro_marca} ${servico.carro_modelo})`,
      valor: servico.custo_terceiros,
      relacionado_a_servico: true,
      servico_relacionado: servico.id,
      observacoes: `Custo de terceiros do serviço: ${servico.servico_descricao}`,
      origem: 'servico',
      servico_id: servico.id,
      forma_pagamento: servico.forma_pagamento,
      perfil: perfilAtual,
    } as any);
  }
  
  // Outras Despesas
  if (servico.outras_despesas_vinculadas > 0) {
    novasDespesas.push({
      id: `dsp-out-${servico.id}`,
      data_despesa: servico.data_servico,
      tipo_despesa: 'Outros',
      descricao: `Outras despesas - ${servico.cliente_nome} (${servico.carro_marca} ${servico.carro_modelo})`,
      valor: servico.outras_despesas_vinculadas,
      relacionado_a_servico: true,
      servico_relacionado: servico.id,
      observacoes: `Outras despesas do serviço: ${servico.servico_descricao}`,
      origem: 'servico',
      servico_id: servico.id,
      forma_pagamento: servico.forma_pagamento,
      perfil: perfilAtual,
    } as any);
  }

  // Salvar despesas atualizadas
  localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify([...despesasSemServico, ...novasDespesas]));
  // Notificar hook de despesas para recarregar
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('despesasUpdated'));
  }
};

export const removerDespesasServico = (servicoId: string) => {
  if (typeof window === 'undefined') return;

  const todasDespesas = storage._getAllDespesas();
  const despesasSemServico = todasDespesas.filter(d => d.servico_id !== servicoId);
  localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesasSemServico));
  // Notificar hook de despesas para recarregar
  window.dispatchEvent(new Event('despesasUpdated'));
};

// Migração automática: sincronizar todos os serviços existentes
export const migrarServicosExistentes = () => {
  if (typeof window === 'undefined') return;
  
  // Verificar se já foi migrado
  const jaMigrado = localStorage.getItem(STORAGE_KEYS.MIGRATED);
  if (jaMigrado === 'true') return;
  
  console.log('🔄 Iniciando migração de serviços existentes...');
  
  const servicos = storage.getServicos();
  
  if (servicos.length > 0) {
    console.log(`📦 Encontrados ${servicos.length} serviços para sincronizar`);
    
    // Sincronizar cada serviço
    servicos.forEach(servico => {
      sincronizarDespesasServico(servico);
    });
    
    console.log('✅ Migração concluída!');
  }
  
  // Marcar como migrado
  localStorage.setItem(STORAGE_KEYS.MIGRATED, 'true');
};

// Funções utilitárias
export const calcularLucroLiquido = (
  valor_cobrado: number,
  custo_materiais: number,
  custo_terceiros: number,
  outras_despesas: number
): number => {
  return valor_cobrado - (custo_materiais + custo_terceiros + outras_despesas);
};

export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

export const formatarData = (data: string): string => {
  return new Date(data).toLocaleDateString('pt-BR');
};

export const gerarId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Sistema de observações por perfil
interface ObservacoesPorPerfil {
  [perfilTipo: string]: {
    [servicoId: string]: string; // Observação específica deste perfil para este serviço
  };
}

export const observacoesPerfil = {
  // Obter observação de um serviço para o perfil atual
  getObservacao: (servicoId: string, perfilTipo: string): string => {
    if (typeof window === 'undefined') return '';
    const data = localStorage.getItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL);
    const observacoes: ObservacoesPorPerfil = data ? JSON.parse(data) : {};
    return observacoes[perfilTipo]?.[servicoId] || '';
  },

  // Salvar observação de um serviço para o perfil atual
  setObservacao: (servicoId: string, perfilTipo: string, observacao: string) => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL);
    const observacoes: ObservacoesPorPerfil = data ? JSON.parse(data) : {};

    // Garantir que o perfil existe no objeto
    if (!observacoes[perfilTipo]) {
      observacoes[perfilTipo] = {};
    }

    // Salvar ou remover observação
    if (observacao.trim() === '') {
      delete observacoes[perfilTipo][servicoId];
    } else {
      observacoes[perfilTipo][servicoId] = observacao;
    }

    localStorage.setItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL, JSON.stringify(observacoes));
  },

  // Obter todas as observações de um perfil específico
  getTodasObservacoesPerfil: (perfilTipo: string): { [servicoId: string]: string } => {
    if (typeof window === 'undefined') return {};
    const data = localStorage.getItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL);
    const observacoes: ObservacoesPorPerfil = data ? JSON.parse(data) : {};
    return observacoes[perfilTipo] || {};
  },

  // Limpar todas as observações de um perfil específico
  limparObservacoesPerfil: (perfilTipo: string) => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL);
    const observacoes: ObservacoesPorPerfil = data ? JSON.parse(data) : {};
    delete observacoes[perfilTipo];
    localStorage.setItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL, JSON.stringify(observacoes));
  },

  // Remover observações de um serviço específico de todos os perfis
  removerObservacoesServico: (servicoId: string) => {
    if (typeof window === 'undefined') return;
    const data = localStorage.getItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL);
    const observacoes: ObservacoesPorPerfil = data ? JSON.parse(data) : {};

    // Remover o serviço de todos os perfis
    Object.keys(observacoes).forEach(perfil => {
      delete observacoes[perfil][servicoId];
    });

    localStorage.setItem(STORAGE_KEYS.OBSERVACOES_POR_PERFIL, JSON.stringify(observacoes));
  },
};
