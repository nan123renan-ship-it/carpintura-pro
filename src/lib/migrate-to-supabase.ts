/**
 * Script de migração de dados do localStorage para o Supabase
 *
 * Este script permite transferir dados existentes do localStorage
 * para o banco de dados Supabase, vinculando-os ao usuário autenticado.
 */

import { supabase } from './supabase';
import { Servico, Despesa } from './types';

export async function migrarDadosParaSupabase(): Promise<{
  success: boolean;
  message: string;
  servicos?: number;
  despesas?: number;
}> {
  try {
    // Verificar se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: 'Usuário não autenticado. Faça login para migrar os dados.'
      };
    }

    // Carregar dados do localStorage
    const servicosLocal = JSON.parse(localStorage.getItem('servicos') || '[]') as Servico[];
    const despesasLocal = JSON.parse(localStorage.getItem('despesas') || '[]') as Despesa[];

    if (servicosLocal.length === 0 && despesasLocal.length === 0) {
      return {
        success: true,
        message: 'Não há dados no localStorage para migrar.',
        servicos: 0,
        despesas: 0
      };
    }

    let servicosMigrados = 0;
    let despesasMigradas = 0;

    // Migrar serviços
    if (servicosLocal.length > 0) {
      const servicosParaMigrar = servicosLocal.map(s => ({
        user_id: user.id,
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
        valor_cobrado: s.valor_cobrado,
        custo_materiais: s.custo_materiais,
        custo_terceiros: s.custo_terceiros,
        outras_despesas_vinculadas: s.outras_despesas_vinculadas,
        lucro_liquido: s.lucro_liquido,
        forma_pagamento: s.forma_pagamento,
        observacoes: s.observacoes,
        cliente_recorrente: s.cliente_recorrente,
        fotos: s.fotos,
        foto_perfil_url: s.foto_perfil_url
      }));

      const { error: servicosError } = await supabase
        .from('servicos')
        .insert(servicosParaMigrar);

      if (servicosError) {
        console.error('Erro ao migrar serviços:', servicosError);
      } else {
        servicosMigrados = servicosLocal.length;
      }
    }

    // Migrar despesas
    if (despesasLocal.length > 0) {
      const despesasParaMigrar = despesasLocal.map(d => ({
        user_id: user.id,
        data_despesa: d.data_despesa,
        tipo_despesa: d.tipo_despesa,
        descricao: d.descricao,
        valor: d.valor,
        relacionado_a_servico: d.relacionado_a_servico,
        observacoes: d.observacoes,
        origem: d.origem,
        servico_id: d.servico_id,
        forma_pagamento: d.forma_pagamento,
        status_pagamento: d.status_pagamento || 'pago'
      }));

      const { error: despesasError } = await supabase
        .from('despesas')
        .insert(despesasParaMigrar);

      if (despesasError) {
        console.error('Erro ao migrar despesas:', despesasError);
      } else {
        despesasMigradas = despesasLocal.length;
      }
    }

    // Limpar localStorage após migração bem-sucedida
    if (servicosMigrados > 0 || despesasMigradas > 0) {
      localStorage.removeItem('servicos');
      localStorage.removeItem('despesas');
    }

    return {
      success: true,
      message: `Migração concluída! ${servicosMigrados} serviços e ${despesasMigradas} despesas foram transferidos para o Supabase.`,
      servicos: servicosMigrados,
      despesas: despesasMigradas
    };
  } catch (error) {
    console.error('Erro durante a migração:', error);
    return {
      success: false,
      message: 'Erro ao migrar dados. Verifique o console para mais detalhes.'
    };
  }
}

/**
 * Verifica se há dados no localStorage que precisam ser migrados
 */
export function temDadosParaMigrar(): boolean {
  const servicosLocal = JSON.parse(localStorage.getItem('servicos') || '[]');
  const despesasLocal = JSON.parse(localStorage.getItem('despesas') || '[]');

  return servicosLocal.length > 0 || despesasLocal.length > 0;
}
