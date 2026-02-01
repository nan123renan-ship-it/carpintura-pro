// Sistema de armazenamento local para Car Pintura Pro

import { Servico, Despesa, CategoriaServico } from './types';

const STORAGE_KEYS = {
  SERVICOS: 'car_pintura_servicos',
  DESPESAS: 'car_pintura_despesas',
  CATEGORIAS: 'car_pintura_categorias',
  MIGRATED: 'car_pintura_migrated_v1', // Flag para controlar migração
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

// Helpers de localStorage
export const storage = {
  // Serviços
  getServicos: (): Servico[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.SERVICOS);
    return data ? JSON.parse(data) : [];
  },
  
  setServicos: (servicos: Servico[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SERVICOS, JSON.stringify(servicos));
  },
  
  addServico: (servico: Servico) => {
    const servicos = storage.getServicos();
    servicos.push(servico);
    storage.setServicos(servicos);
  },
  
  updateServico: (id: string, servico: Partial<Servico>) => {
    const servicos = storage.getServicos();
    const index = servicos.findIndex(s => s.id === id);
    if (index !== -1) {
      servicos[index] = { ...servicos[index], ...servico };
      storage.setServicos(servicos);
    }
  },
  
  deleteServico: (id: string) => {
    const servicos = storage.getServicos().filter(s => s.id !== id);
    storage.setServicos(servicos);
  },
  
  // Despesas
  getDespesas: (): Despesa[] => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(STORAGE_KEYS.DESPESAS);
    return data ? JSON.parse(data) : [];
  },
  
  setDespesas: (despesas: Despesa[]) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.DESPESAS, JSON.stringify(despesas));
  },
  
  addDespesa: (despesa: Despesa) => {
    const despesas = storage.getDespesas();
    despesas.push(despesa);
    storage.setDespesas(despesas);
  },
  
  updateDespesa: (id: string, despesa: Partial<Despesa>) => {
    const despesas = storage.getDespesas();
    const index = despesas.findIndex(d => d.id === id);
    if (index !== -1) {
      despesas[index] = { ...despesas[index], ...despesa };
      storage.setDespesas(despesas);
    }
  },
  
  deleteDespesa: (id: string) => {
    const despesas = storage.getDespesas().filter(d => d.id !== id);
    storage.setDespesas(despesas);
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
  
  const despesas = storage.getDespesas();
  
  // Remover despesas antigas deste serviço
  const despesasSemServico = despesas.filter(d => d.servico_id !== servico.id);
  
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
    });
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
    });
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
    });
  }
  
  // Salvar despesas atualizadas
  storage.setDespesas([...despesasSemServico, ...novasDespesas]);
};

export const removerDespesasServico = (servicoId: string) => {
  if (typeof window === 'undefined') return;
  
  const despesas = storage.getDespesas();
  const despesasSemServico = despesas.filter(d => d.servico_id !== servicoId);
  storage.setDespesas(despesasSemServico);
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
