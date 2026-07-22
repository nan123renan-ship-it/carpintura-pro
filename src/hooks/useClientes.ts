import { useState, useEffect, useCallback } from 'react';
import {
  Cliente,
  carregarClientes,
  salvarClientes,
  criarCliente,
  atualizarCliente,
  deletarCliente,
  buscarClientes,
} from '@/lib/clientes';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);

  useEffect(() => {
    setClientes(carregarClientes());
  }, []);

  const adicionar = useCallback((dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>): Cliente => {
    const novo = criarCliente(dados);
    setClientes(prev => {
      const atualizado = [...prev, novo];
      salvarClientes(atualizado);
      return atualizado;
    });
    return novo;
  }, []);

  const atualizar = useCallback((id: string, dados: Partial<Omit<Cliente, 'id' | 'criadoEm'>>): void => {
    const atualizado = atualizarCliente(id, dados);
    if (atualizado) {
      setClientes(prev => prev.map(c => c.id === id ? atualizado : c));
    }
  }, []);

  const deletar = useCallback((id: string): void => {
    deletarCliente(id);
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  const buscar = useCallback((termo: string): Cliente[] => {
    return buscarClientes(termo);
  }, []);

  const recarregar = useCallback(() => {
    setClientes(carregarClientes());
  }, []);

  return { clientes, adicionar, atualizar, deletar, buscar, recarregar };
}
