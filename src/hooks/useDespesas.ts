"use client";

import { useState, useEffect } from 'react';
import { Despesa, TipoDespesa, FiltrosPeriodo } from '@/lib/types';
import { storage } from '@/lib/storage';

export function useDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar despesas do localStorage ao montar o componente
  useEffect(() => {
    const carregarDespesas = () => {
      const despesasCarregadas = storage.getDespesas();
      setDespesas(despesasCarregadas);
      setLoading(false);
    };

    carregarDespesas();

    // Recarregar despesas quando a janela receber foco (usuário volta para a aba)
    const handleFocus = () => {
      carregarDespesas();
    };

    window.addEventListener('focus', handleFocus);

    // Recarregar despesas periodicamente para garantir sincronização
    const interval = setInterval(() => {
      const despesasAtualizadas = storage.getDespesas();
      setDespesas(despesasAtualizadas);
    }, 1000); // Verifica a cada 1 segundo

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, []);

  const addDespesa = (despesa: Omit<Despesa, 'id'>) => {
    const novaDespesa: Despesa = {
      ...despesa,
      id: `dsp-${Date.now()}`,
    };
    
    // Salvar no localStorage
    storage.addDespesa(novaDespesa);
    
    // Atualizar estado local
    setDespesas(storage.getDespesas());
    
    return novaDespesa;
  };

  const updateDespesa = (id: string, despesa: Partial<Despesa>) => {
    // Atualizar no localStorage
    storage.updateDespesa(id, despesa);
    
    // Atualizar estado local
    setDespesas(storage.getDespesas());
  };

  const deleteDespesa = (id: string) => {
    // Deletar do localStorage
    storage.deleteDespesa(id);
    
    // Atualizar estado local
    setDespesas(storage.getDespesas());
  };

  const filtrarDespesas = (
    filtros: {
      periodo?: FiltrosPeriodo;
      tipo?: TipoDespesa;
      valorMin?: number;
      valorMax?: number;
    }
  ): Despesa[] => {
    let resultado = [...despesas];

    // Filtro por período
    if (filtros.periodo) {
      const { dataInicio, dataFim } = calcularPeriodo(filtros.periodo);
      resultado = resultado.filter(d => {
        const data = new Date(d.data_despesa);
        return data >= dataInicio && data <= dataFim;
      });
    }

    // Filtro por tipo
    if (filtros.tipo) {
      resultado = resultado.filter(d => d.tipo_despesa === filtros.tipo);
    }

    // Filtro por valor mínimo
    if (filtros.valorMin !== undefined) {
      resultado = resultado.filter(d => d.valor >= filtros.valorMin!);
    }

    // Filtro por valor máximo
    if (filtros.valorMax !== undefined) {
      resultado = resultado.filter(d => d.valor <= filtros.valorMax!);
    }

    return resultado;
  };

  const calcularTotalDespesas = (despesasFiltradas: Despesa[]): number => {
    return despesasFiltradas.reduce((acc, d) => acc + d.valor, 0);
  };

  return {
    despesas,
    loading,
    addDespesa,
    updateDespesa,
    deleteDespesa,
    filtrarDespesas,
    calcularTotalDespesas,
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
