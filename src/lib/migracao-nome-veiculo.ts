/**
 * Script de migração para preencher o campo nome_veiculo em serviços antigos
 * Este script deve ser executado uma única vez para atualizar os dados existentes
 */

import { storage } from './storage';

export function migrarNomeVeiculo() {
  const servicos = storage.getServicos();
  let servicosAtualizados = 0;

  servicos.forEach(servico => {
    // Se o serviço não tem nome_veiculo ou está vazio
    if (!servico.nome_veiculo || servico.nome_veiculo.trim() === '') {
      // Gerar nome baseado em marca e modelo
      const nomeGerado = `${servico.carro_marca || 'Veículo'} ${servico.carro_modelo || ''}`.trim();
      
      // Atualizar o serviço
      storage.updateServico(servico.id, {
        nome_veiculo: nomeGerado || 'Veículo não informado'
      });
      
      servicosAtualizados++;
    }
  });

  return {
    total: servicos.length,
    atualizados: servicosAtualizados,
    mensagem: `Migração concluída! ${servicosAtualizados} de ${servicos.length} serviços foram atualizados.`
  };
}
