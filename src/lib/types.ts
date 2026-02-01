// Tipos do Car Pintura Pro

export type StatusServico = "Orçamento" | "Em andamento" | "Finalizado" | "Pago";
export type StatusPagamento = "pendente" | "resolvido";
export type TipoLancamento = "receita" | "despesa";
export type FormaPagamento = "Dinheiro" | "Pix" | "Cartão crédito" | "Cartão débito" | "Transferência" | "Outro";
export type TipoDespesa = "Tinta" | "Massa" | "Lixa" | "Verniz" | "Compressor/Equipamentos" | "EPI (máscara, luva, etc.)" | "Luz/Água" | "Aluguel" | "Transporte" | "Outros" | "Materiais" | "Terceiros";
export type OrigemDespesa = "servico" | "manual";
export type StatusPagamentoDespesa = "pago" | "pendente";

export interface CategoriaServico {
  id: string;
  nome_categoria: string;
}

export interface Servico {
  id: string;
  data_servico: string; // ISO date string
  status: StatusServico;
  status_pagamento?: StatusPagamento; // "pendente" ou "resolvido"
  tipo_lancamento?: TipoLancamento; // "receita" ou "despesa"
  nome_veiculo: string; // Nome do veículo (título principal do serviço)
  cliente_nome: string;
  telefone_cliente: string;
  carro_marca: string;
  carro_modelo: string;
  carro_ano: number;
  carro_placa: string;
  cor_original: string;
  servico_descricao: string;
  categoria_id?: string; // Relacionamento com CategoriaServico
  valor_cobrado: number;
  valor_servico?: number; // Alias para valor_cobrado (compatibilidade)
  custo_materiais: number;
  custo_terceiros: number;
  outras_despesas_vinculadas: number;
  lucro_liquido: number; // Calculado automaticamente
  forma_pagamento: FormaPagamento;
  observacoes: string;
  // Campos futuros
  cliente_recorrente?: boolean;
  fotos?: string[]; // URLs/Base64 das fotos do serviço
  foto_perfil_url?: string; // URL da foto de perfil do serviço (primeira foto por padrão)
  outras_despesas?: number; // Alias para outras_despesas_vinculadas
}

export interface Despesa {
  id: string;
  data_despesa: string; // ISO date string
  tipo_despesa: TipoDespesa;
  descricao: string;
  valor: number;
  relacionado_a_servico: boolean;
  servico_relacionado?: string; // ID do serviço (deprecated - usar servico_id)
  observacoes: string;
  // Novos campos para integração
  origem: OrigemDespesa; // "servico" ou "manual"
  servico_id?: string | null; // ID do serviço vinculado (null se manual)
  forma_pagamento?: FormaPagamento; // Forma de pagamento (herdada do serviço)
  status_pagamento?: StatusPagamentoDespesa; // Status de pagamento da despesa
  created_at?: string; // Data de criação
}

export interface FiltrosPeriodo {
  tipo: "mes_atual" | "mes_anterior" | "ultimos_3_meses" | "ultimos_6_meses" | "ano_atual" | "personalizado";
  dataInicio?: string;
  dataFim?: string;
}

export interface ResumoFinanceiro {
  faturamento: number;
  despesas: number;
  lucro_liquido: number;
  numero_servicos: number;
  ticket_medio: number;
}
