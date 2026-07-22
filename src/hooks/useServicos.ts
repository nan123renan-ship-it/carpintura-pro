"use client";

import { useState, useEffect } from 'react';
import { Servico, StatusServico, FiltrosPeriodo, ResumoFinanceiro } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { storage, sincronizarDespesasServico as syncDespesasLocal, removerDespesasServico, gerarId, calcularLucroLiquido } from '@/lib/storage';

const LOCAL_STORAGE_KEY = 'car_pintura_servicos_local';

function getServicosLocal(): Servico[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

function setServicosLocal(servicos: Servico[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(servicos));
}

export function useServicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarServicos = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // Sem usuário: usar localStorage
          const servicosLocal = getServicosLocal();
          setServicos(servicosLocal);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('servicos')
          .select('*')
          .eq('user_id', user.id)
          .order('data_servico', { ascending: false });

        if (error) {
          console.error('[useServicos] Erro ao carregar serviços:', error);
          setServicos([]);
        } else {
          const servicosFormatados = (data || []).map((s: Record<string, any>) => ({
            id: s.id,
            data_servico: s.data_servico,
            status: s.status,
            status_pagamento: s.status_pagamento,
            tipo_lancamento: s.tipo_lancamento,
            nome_veiculo: s.nome_veiculo,
            cliente_nome: s.cliente_nome,
            telefone_cliente: s.telefone_cliente,
            carro_marca: s.carro_marca,
            carro_modelo: s.carro_modelo,
            carro_ano: s.carro_ano,
            carro_placa: s.carro_placa,
            cor_original: s.cor_original,
            servico_descricao: s.servico_descricao,
            categoria_id: s.categoria_id,
            valor_cobrado: parseFloat(s.valor_cobrado as any),
            custo_materiais: parseFloat(s.custo_materiais as any),
            custo_terceiros: parseFloat(s.custo_terceiros as any),
            outras_despesas_vinculadas: parseFloat(s.outras_despesas_vinculadas as any),
            lucro_liquido: parseFloat(s.lucro_liquido as any),
            forma_pagamento: s.forma_pagamento,
            observacoes: s.observacoes || '',
            cliente_recorrente: s.cliente_recorrente,
            fotos: s.fotos || [],
            foto_perfil_url: s.foto_perfil_url
          }));
          setServicos(servicosFormatados);
        }
      } catch (err) {
        console.error('Erro ao carregar serviços:', err);
        // Fallback para localStorage em caso de erro
        const servicosLocal = getServicosLocal();
        setServicos(servicosLocal);
      } finally {
        setLoading(false);
      }
    };

    carregarServicos();

    // Subscrever a mudanças em tempo real (apenas se tiver usuário)
    let channel: any = null;
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: import('@supabase/supabase-js').User | null } }) => {
      if (user) {
        channel = supabase
          .channel('servicos-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'servicos' },
            () => {
              carregarServicos();
            }
          )
          .subscribe();
      }
    });

    return () => {
      if (channel) channel.unsubscribe();
    };
  }, []);

  const adicionarServico = async (servico: Omit<Servico, 'id' | 'lucro_liquido'>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: salvar no localStorage
        const id = gerarId();
        const lucro = calcularLucroLiquido(
          servico.valor_cobrado,
          servico.custo_materiais,
          servico.custo_terceiros,
          servico.outras_despesas_vinculadas
        );
        const novoServico: Servico = {
          ...servico,
          id,
          lucro_liquido: lucro,
          status_pagamento: servico.status === 'Pago' || servico.status === 'Finalizado' ? 'resolvido' : 'pendente',
          tipo_lancamento: servico.tipo_lancamento || 'receita',
        };
        const lista = getServicosLocal();
        lista.unshift(novoServico);
        setServicosLocal(lista);
        setServicos([...lista]);
        syncDespesasLocal(novoServico);
        return novoServico;
      }

      const servicoParaInserir = {
        user_id: user.id,
        data_servico: servico.data_servico,
        status: servico.status,
        status_pagamento: servico.status === 'Pago' || servico.status === 'Finalizado' ? 'resolvido' : 'pendente',
        tipo_lancamento: servico.tipo_lancamento || 'receita',
        nome_veiculo: servico.nome_veiculo,
        cliente_nome: servico.cliente_nome,
        telefone_cliente: servico.telefone_cliente,
        carro_marca: servico.carro_marca,
        carro_modelo: servico.carro_modelo,
        carro_ano: servico.carro_ano,
        carro_placa: servico.carro_placa,
        cor_original: servico.cor_original,
        servico_descricao: servico.servico_descricao,
        categoria_id: servico.categoria_id || null,
        valor_cobrado: servico.valor_cobrado,
        custo_materiais: servico.custo_materiais,
        custo_terceiros: servico.custo_terceiros,
        outras_despesas_vinculadas: servico.outras_despesas_vinculadas,
        forma_pagamento: servico.forma_pagamento,
        observacoes: servico.observacoes || '',
        cliente_recorrente: servico.cliente_recorrente || false,
        fotos: servico.fotos || [],
        foto_perfil_url: servico.foto_perfil_url || null
      };

      const { data, error } = await supabase
        .from('servicos')
        .insert([servicoParaInserir])
        .select()
        .single();

      if (error) {
        console.error('Erro ao adicionar serviço:', error);
        throw error;
      }

      await sincronizarDespesasSupabase(data);
      return data;
    } catch (error) {
      console.error('Erro ao adicionar serviço:', error);
      throw error;
    }
  };

  const updateServico = async (id: string, servico: Partial<Servico>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: atualizar no localStorage
        const lista = getServicosLocal();
        const index = lista.findIndex(s => s.id === id);
        if (index !== -1) {
          lista[index] = { ...lista[index], ...servico };
          setServicosLocal(lista);
          setServicos([...lista]);
          // Só sincroniza despesas automáticas se valores financeiros mudaram
          const camposFinanceiros: (keyof Servico)[] = ['custo_materiais', 'custo_terceiros', 'outras_despesas_vinculadas', 'data_servico', 'nome_veiculo', 'forma_pagamento'];
          const mudouFinanceiro = camposFinanceiros.some(campo => campo in servico);
          if (mudouFinanceiro) {
            syncDespesasLocal(lista[index]);
          }
        }
        return;
      }

      const servicoAtual = servicos.find(s => s.id === id);
      if (!servicoAtual) throw new Error('Serviço não encontrado');

      const { lucro_liquido, ...servicoParaAtualizar } = servico;

      if (servicoParaAtualizar.status && !servicoParaAtualizar.status_pagamento) {
        servicoParaAtualizar.status_pagamento = servicoParaAtualizar.status === 'Pago' || servicoParaAtualizar.status === 'Finalizado' ? 'resolvido' : 'pendente';
      }

      const { error } = await supabase
        .from('servicos')
        .update(servicoParaAtualizar)
        .eq('id', id);

      if (error) {
        console.error('Erro ao atualizar serviço:', error);
        throw error;
      }

      const servicoAtualizado = { ...servicoAtual, ...servico };

      // Só sincroniza despesas automáticas se valores financeiros do serviço foram alterados
      const camposFinanceiros: (keyof Servico)[] = ['custo_materiais', 'custo_terceiros', 'outras_despesas_vinculadas', 'data_servico', 'nome_veiculo', 'forma_pagamento'];
      const mudouFinanceiro = camposFinanceiros.some(campo => campo in servico);
      if (mudouFinanceiro) {
        await sincronizarDespesasSupabase(servicoAtualizado);
      }
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  };

  const deleteServico = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Sem usuário: deletar no localStorage
        const lista = getServicosLocal().filter(s => s.id !== id);
        setServicosLocal(lista);
        setServicos([...lista]);
        removerDespesasServico(id);
        return;
      }

      const { error } = await supabase
        .from('servicos')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erro ao deletar serviço:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
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

    if (filtros.periodo) {
      const { dataInicio, dataFim } = calcularPeriodo(filtros.periodo);
      resultado = resultado.filter(s => {
        const data = new Date(s.data_servico);
        return data >= dataInicio && data <= dataFim;
      });
    }

    if (filtros.status && filtros.status !== "Todos") {
      resultado = resultado.filter(s => s.status === filtros.status);
    }

    if (filtros.categoria) {
      resultado = resultado.filter(s => s.categoria_id === filtros.categoria);
    }

    if (filtros.cliente) {
      resultado = resultado.filter(s =>
        s.cliente_nome.toLowerCase().includes(filtros.cliente!.toLowerCase())
      );
    }

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

// Função para sincronizar despesas no Supabase
async function sincronizarDespesasSupabase(servico: any) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('despesas')
      .delete()
      .eq('servico_id', servico.id)
      .eq('origem', 'servico');

    const despesas = [];

    if (servico.custo_materiais > 0) {
      despesas.push({
        user_id: user.id,
        data_despesa: servico.data_servico,
        tipo_despesa: 'Materiais',
        descricao: `Materiais - ${servico.nome_veiculo}`,
        valor: servico.custo_materiais,
        relacionado_a_servico: true,
        origem: 'servico',
        servico_id: servico.id,
        forma_pagamento: servico.forma_pagamento,
        status_pagamento: servico.status === 'Pago' || servico.status === 'Finalizado' ? 'pago' : 'pendente',
        observacoes: `Despesa de materiais do serviço ${servico.nome_veiculo}`
      });
    }

    if (servico.custo_terceiros > 0) {
      despesas.push({
        user_id: user.id,
        data_despesa: servico.data_servico,
        tipo_despesa: 'Terceiros',
        descricao: `Terceiros - ${servico.nome_veiculo}`,
        valor: servico.custo_terceiros,
        relacionado_a_servico: true,
        origem: 'servico',
        servico_id: servico.id,
        forma_pagamento: servico.forma_pagamento,
        status_pagamento: servico.status === 'Pago' || servico.status === 'Finalizado' ? 'pago' : 'pendente',
        observacoes: `Despesa de terceiros do serviço ${servico.nome_veiculo}`
      });
    }

    if (despesas.length > 0) {
      const { error } = await supabase.from('despesas').insert(despesas);
      if (error) console.error('Erro ao sincronizar despesas:', error);
    }
  } catch (error) {
    console.error('Erro ao sincronizar despesas do serviço:', error);
  }
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
