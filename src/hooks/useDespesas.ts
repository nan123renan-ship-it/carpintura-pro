"use client";

import { useState, useEffect } from 'react';
import { Despesa, TipoDespesa, FiltrosPeriodo } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { storage, gerarId } from '@/lib/storage';
import {
  salvarCategoriasDespesa,
  getCategoriasDespesa,
  removerCategoriasDespesa,
  enriquecerDespesasComCategorias,
} from '@/lib/despesas-categorias-local';

const LOCAL_STORAGE_KEY = 'car_pintura_despesas';

function getDespesasLocal(): Despesa[] {
  if (typeof window === 'undefined') return [];
  const perfilAtual = (() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      try { return JSON.parse(profileData).tipoPerfil || ''; } catch { return ''; }
    }
    return '';
  })();
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  const todas: Despesa[] = data ? JSON.parse(data) : [];
  return todas.filter(d => (d as any).perfil === perfilAtual || (d as any).perfil === undefined);
}

function setDespesasLocal(despesas: Despesa[]) {
  if (typeof window === 'undefined') return;
  const perfilAtual = (() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      try { return JSON.parse(profileData).tipoPerfil || ''; } catch { return ''; }
    }
    return '';
  })();
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  const todas: any[] = data ? JSON.parse(data) : [];
  const outrosPerfis = todas.filter(d => d.perfil !== perfilAtual && d.perfil !== undefined);
  const comPerfil = despesas.map(d => ({ ...d, perfil: perfilAtual }));
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...outrosPerfis, ...comPerfil]));
}

function addDespesaLocal(despesa: Despesa): Despesa {
  const perfilAtual = (() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
      try { return JSON.parse(profileData).tipoPerfil || ''; } catch { return ''; }
    }
    return '';
  })();
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  const todas: any[] = data ? JSON.parse(data) : [];
  const comPerfil = { ...despesa, perfil: perfilAtual };
  todas.unshift(comPerfil);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todas));
  return despesa;
}

export function useDespesas() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDespesas = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: usar localStorage
        const despesasLocal = getDespesasLocal();
        setDespesas(enriquecerDespesasComCategorias(despesasLocal));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .order('data_despesa', { ascending: false });

      if (error) {
        console.error('[useDespesas] Erro ao carregar despesas:', error);
        // Fallback para localStorage
        const despesasLocal = getDespesasLocal();
        setDespesas(enriquecerDespesasComCategorias(despesasLocal));
      } else {
        const despesasFormatadas = (data || []).map((d: Record<string, any>) => ({
          id: d.id,
          data_despesa: d.data_despesa,
          tipo_despesa: d.tipo_despesa,
          categorias: (d.categorias && d.categorias.length > 0) ? d.categorias : undefined,
          descricao: d.descricao,
          valor: parseFloat(d.valor as any),
          relacionado_a_servico: d.relacionado_a_servico,
          observacoes: d.observacoes || '',
          origem: d.origem,
          servico_id: d.servico_id,
          forma_pagamento: d.forma_pagamento,
          status_pagamento: d.status_pagamento,
          tipo_gasto: d.tipo_gasto || 'empresarial',
          created_at: d.created_at
        }));
        const enriquecidas = enriquecerDespesasComCategorias(despesasFormatadas) as Despesa[];
        // Sincronizar categorias vindas do banco de volta pro localStorage (para outros hooks)
        enriquecidas.forEach(d => {
          if (d.categorias && d.categorias.length > 0) {
            salvarCategoriasDespesa(d.id, d.categorias);
          }
        });
        setDespesas(enriquecidas);
      }
    } catch (err) {
      console.error('Erro ao carregar despesas:', err);
      // Fallback para localStorage em caso de erro
      const despesasLocal = getDespesasLocal();
      setDespesas(despesasLocal);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDespesas();

    // Subscrever a mudanças em tempo real (apenas se tiver usuário)
    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user: u } }: { data: { user: import('@supabase/supabase-js').User | null } }) => {
      if (u) {
        channel = supabase
          .channel('despesas-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'despesas' },
            () => {
              carregarDespesas();
            }
          )
          .subscribe();
      }
    });

    // Ouvir evento customizado para recarregar despesas do localStorage
    const handleStorageChange = () => {
      supabase.auth.getUser().then(({ data: { user: u2 } }: { data: { user: import('@supabase/supabase-js').User | null } }) => {
        if (!u2) { // eslint-disable-line
          const despesasLocal = getDespesasLocal();
          setDespesas([...despesasLocal]);
        }
      });
    };
    window.addEventListener('despesasUpdated', handleStorageChange);

    return () => {
      if (channel) channel.unsubscribe();
      window.removeEventListener('despesasUpdated', handleStorageChange);
    };
  }, []);

  const addDespesa = async (despesa: Omit<Despesa, 'id'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: salvar no localStorage
        const novaDespesa: Despesa = {
          ...despesa,
          id: gerarId(),
          status_pagamento: despesa.status_pagamento || 'pago',
          created_at: new Date().toISOString(),
        };
        addDespesaLocal(novaDespesa);
        setDespesas(prev => [novaDespesa, ...prev]);
        return novaDespesa;
      }

      // Payload base sem categorias
      const payloadBase = {
        user_id: user.id,
        data_despesa: despesa.data_despesa,
        tipo_despesa: despesa.tipo_despesa,
        descricao: despesa.descricao,
        valor: despesa.valor,
        relacionado_a_servico: despesa.relacionado_a_servico,
        observacoes: despesa.observacoes,
        origem: despesa.origem,
        servico_id: despesa.servico_id,
        forma_pagamento: despesa.forma_pagamento,
        status_pagamento: despesa.status_pagamento || 'pago',
        tipo_gasto: despesa.tipo_gasto || 'empresarial'
      };

      // Tentar com categorias primeiro; se a coluna não existir, salvar sem ela
      let { data, error } = await supabase
        .from('despesas')
        .insert([{ ...payloadBase, categorias: despesa.categorias || null }])
        .select()
        .single();

      // Fallback: se a coluna categorias não existir ainda no banco
      if (error && (error.code === '42703' || error.message?.includes('categorias'))) {
        const res2 = await supabase
          .from('despesas')
          .insert([payloadBase])
          .select()
          .single();
        data = res2.data;
        error = res2.error;
      }

      if (error) {
        console.error('Erro ao adicionar despesa:', error);
        throw error;
      }

      // Preservar as categorias em memória mesmo se o banco ainda não tem a coluna
      const categoriasFinais = data.categorias || despesa.categorias || undefined;

      const novaDespesa: Despesa = {
        id: data.id,
        data_despesa: data.data_despesa,
        tipo_despesa: data.tipo_despesa,
        categorias: categoriasFinais,
        descricao: data.descricao,
        valor: parseFloat(data.valor as any),
        relacionado_a_servico: data.relacionado_a_servico,
        observacoes: data.observacoes || '',
        origem: data.origem,
        servico_id: data.servico_id,
        forma_pagamento: data.forma_pagamento,
        status_pagamento: data.status_pagamento,
        tipo_gasto: data.tipo_gasto || despesa.tipo_gasto || 'empresarial',
        created_at: data.created_at
      };

      // Salvar categorias no localStorage como fallback (caso banco não tenha a coluna ainda)
      if (categoriasFinais && categoriasFinais.length > 0) {
        salvarCategoriasDespesa(data.id, categoriasFinais);
      }

      setDespesas(prev => [novaDespesa, ...prev]);
      return novaDespesa;
    } catch (error) {
      console.error('Erro ao adicionar despesa:', error);
      throw error;
    }
  };

  const updateDespesa = async (id: string, despesa: Partial<Despesa>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: atualizar no localStorage
        const lista = getDespesasLocal();
        const index = lista.findIndex(d => d.id === id);
        if (index !== -1) {
          lista[index] = { ...lista[index], ...despesa };
          setDespesasLocal(lista);
          setDespesas([...lista]);
        }
        return;
      }

      let { error } = await supabase
        .from('despesas')
        .update(despesa)
        .eq('id', id);

      // Fallback: se falhar por coluna categorias inexistente, atualizar sem ela
      if (error && (error.code === '42703' || error.message?.includes('categorias'))) {
        const { categorias: _cats, ...semCategorias } = despesa as any;
        const res2 = await supabase
          .from('despesas')
          .update(semCategorias)
          .eq('id', id);
        error = res2.error;
      }

      if (error) {
        console.error('Erro ao atualizar despesa:', error);
        throw error;
      }

      // Sempre salvar categorias no localStorage (garante que relatórios e outros hooks as encontrem)
      if (despesa.categorias && despesa.categorias.length > 0) {
        salvarCategoriasDespesa(id, despesa.categorias);
      }

      setDespesas(prev =>
        prev.map(d => {
          if (d.id !== id) return d;
          const atualizada = { ...d, ...despesa };
          // Garantir que categorias do localStorage sejam preservadas se não vieram no update
          if (!atualizada.categorias || atualizada.categorias.length === 0) {
            const cats = despesa.categorias || d.categorias;
            if (cats && cats.length > 0) atualizada.categorias = cats;
          }
          return atualizada;
        })
      );
    } catch (error) {
      console.error('Erro ao atualizar despesa:', error);
      throw error;
    }
  };

  const deleteDespesa = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: deletar do localStorage
        const lista = getDespesasLocal().filter(d => d.id !== id);
        setDespesasLocal(lista);
        setDespesas(lista);
        return;
      }

      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar despesa:', error);
        throw error;
      }

      removerCategoriasDespesa(id);
      setDespesas(prev => prev.filter(d => d.id !== id));
    } catch (error) {
      console.error('Erro ao deletar despesa:', error);
      throw error;
    }
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

    if (filtros.periodo) {
      const { dataInicio, dataFim } = calcularPeriodo(filtros.periodo);
      resultado = resultado.filter(d => {
        const data = new Date(d.data_despesa);
        return data >= dataInicio && data <= dataFim;
      });
    }

    if (filtros.tipo) {
      resultado = resultado.filter(d => d.tipo_despesa === filtros.tipo);
    }

    if (filtros.valorMin !== undefined) {
      resultado = resultado.filter(d => d.valor >= filtros.valorMin!);
    }

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
