"use client";

import { useState, useEffect } from 'react';
import { Servico, StatusServico, FiltrosPeriodo, ResumoFinanceiro } from '@/lib/types';
import { storage, calcularLucroLiquido, sincronizarDespesasServico, removerDespesasServico } from '@/lib/storage';

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setServicos(storage.getServicos());
    setLoading(false);
  }, []);

  const adicionarServico = (servico: Omit<Servico, 'id' | 'lucro_liquido'>) => {
    const novoServico: Servico = {
      ...servico,
      id: `srv-${Date.now()}`,
      lucro_liquido: calcularLucroLiquido(
        servico.valor_cobrado,
        servico.custo_materiais,
        servico.custo_terceiros,
        servico.outras_despesas_vinculadas
      ),
      // Definir status_pagamento baseado no status
      status_pagamento: servico.status === 'Pago' || servico.status === 'Finalizado' ? 'resolvido' : 'pendente',
      // Por padrão, serviços são receitas
      tipo_lancamento: servico.tipo_lancamento || 'receita',
    };
    storage.addServico(novoServico);
    
    // SINCRONIZAR DESPESAS AUTOMATICAMENTE
    sincronizarDespesasServico(novoServico);
    
    setServicos(storage.getServicos());
  };

  const updateServico = (id: string, servico: Partial<Servico>) => {
    if (servico.valor_cobrado !== undefined || 
        servico.custo_materiais !== undefined || 
        servico.custo_terceiros !== undefined || 
        servico.outras_despesas_vinculadas !== undefined) {
      const servicoAtual = servicos.find(s => s.id === id);
      if (servicoAtual) {
        servico.lucro_liquido = calcularLucroLiquido(
          servico.valor_cobrado ?? servicoAtual.valor_cobrado,
          servico.custo_materiais ?? servicoAtual.custo_materiais,
          servico.custo_terceiros ?? servicoAtual.custo_terceiros,
          servico.outras_despesas_vinculadas ?? servicoAtual.outras_despesas_vinculadas
        );
      }
    }
    
    // Atualizar status_pagamento automaticamente quando status mudar
    if (servico.status && !servico.status_pagamento) {
      servico.status_pagamento = servico.status === 'Pago' || servico.status === 'Finalizado' ? 'resolvido' : 'pendente';
    }
    
    storage.updateServico(id, servico);
    
    // SINCRONIZAR DESPESAS AUTOMATICAMENTE APÓS ATUALIZAÇÃO
    const servicoAtualizado = storage.getServicos().find(s => s.id === id);
    if (servicoAtualizado) {
      sincronizarDespesasServico(servicoAtualizado);
    }
    
    setServicos(storage.getServicos());
  };

  const deleteServico = (id: string) => {
    // REMOVER DESPESAS VINCULADAS ANTES DE EXCLUIR O SERVIÇO
    removerDespesasServico(id);
    
    storage.deleteServico(id);
    setServicos(storage.getServicos());
  };

  const filtrarServicos = (
    filtros: {
      periodo?: FiltrosPeriodo;
      status?: StatusServico | "Todos";
      categoria?: string;
      cliente?: string;
      placa?: string;
    }
  ): Servico[] => {
    let resultado = [...servicos];

    // Filtro por período
    if (filtros.periodo) {
      const { dataInicio, dataFim } = calcularPeriodo(filtros.periodo);
      resultado = resultado.filter(s => {
        const data = new Date(s.data_servico);
        return data >= dataInicio && data <= dataFim;
      });
    }

    // Filtro por status
    if (filtros.status && filtros.status !== "Todos") {
      resultado = resultado.filter(s => s.status === filtros.status);
    }

    // Filtro por categoria
    if (filtros.categoria) {
      resultado = resultado.filter(s => s.categoria_id === filtros.categoria);
    }

    // Filtro por cliente
    if (filtros.cliente) {
      resultado = resultado.filter(s => 
        s.cliente_nome.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

    // Filtro por placa
    if (filtros.placa) {
      resultado = resultado.filter(s => 
        s.carro_placa.toLowerCase().includes(filtros.placa!.toLowerCase())
      );
    }

    return resultado;
  };

  const calcularResumo = (
    servicosFiltrados: Servico[],
    despesasPeriodo: number
  ): ResumoFinanceiro => {
    const servicosValidos = servicosFiltrados.filter(
      s => s.status === "Finalizado" || s.status === "Pago"
    );

    const faturamento = servicosValidos.reduce((acc, s) => acc + s.valor_cobrado, 0);
    const numero_servicos = servicosValidos.length;
    const ticket_medio = numero_servicos > 0 ? faturamento / numero_servicos : 0;
    const lucro_liquido = faturamento - despesasPeriodo;

    return {
      faturamento,
      despesas: despesasPeriodo,
      lucro_liquido,
      numero_servicos,
      ticket_medio,
    };
  };

  return {
    servicos,
    loading,
    adicionarServico,
    updateServico,
    deleteServico,
    filtrarServicos,
    calcularResumo,
  };
}

// Função auxiliar para calcular período
function calcularPeriodo(filtro: FiltrosPeriodo): { dataInicio: Date; dataFim: Date } {
  const hoje = new Date();
  let dataInicio: Date;
  let dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59);

  switch (filtro.tipo) {
    case "mes_atual":
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      break;
    case "mes_anterior":
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0, 23, 59, 59);
      break;
    case "ultimos_3_meses":
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 3, hoje.getDate());
      break;
    case "ultimos_6_meses":
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 6, hoje.getDate());
      break;
    case "ano_atual":
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      break;
    case "personalizado":
      dataInicio = filtro.dataInicio ? new Date(filtro.dataInicio) : new Date(hoje.getFullYear(), 0, 1);
      dataFim = filtro.dataFim ? new Date(filtro.dataFim) : hoje;
      break;
    default:
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  }

  return { dataInicio, dataFim };
}
