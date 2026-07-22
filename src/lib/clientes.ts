export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  criadoEm: string;
  atualizadoEm: string;
}

const STORAGE_KEY = 'clientes_lista';

function gerarId(): string {
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function carregarClientes(): Cliente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function salvarClientes(clientes: Cliente[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

export function criarCliente(dados: Omit<Cliente, 'id' | 'criadoEm' | 'atualizadoEm'>): Cliente {
  const agora = new Date().toISOString();
  return { id: gerarId(), ...dados, criadoEm: agora, atualizadoEm: agora };
}

export function adicionarOuAtualizarCliente(dados: {
  nome: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}): Cliente {
  const clientes = carregarClientes();
  const nomeNorm = dados.nome.trim().toLowerCase();

  // Tenta encontrar pelo nome (normalizado)
  const idx = clientes.findIndex(c => c.nome.trim().toLowerCase() === nomeNorm);

  if (idx >= 0) {
    // Atualiza campos que vieram preenchidos
    const existente = clientes[idx];
    const atualizado: Cliente = {
      ...existente,
      telefone: dados.telefone?.trim() || existente.telefone,
      email: dados.email?.trim() || existente.email,
      endereco: dados.endereco?.trim() || existente.endereco,
      atualizadoEm: new Date().toISOString(),
    };
    clientes[idx] = atualizado;
    salvarClientes(clientes);
    return atualizado;
  }

  // Cria novo cliente
  const novo = criarCliente({
    nome: dados.nome.trim(),
    telefone: dados.telefone?.trim() || '',
    email: dados.email?.trim() || '',
    endereco: dados.endereco?.trim() || '',
  });
  clientes.push(novo);
  salvarClientes(clientes);
  return novo;
}

export function deletarCliente(id: string): void {
  const clientes = carregarClientes().filter(c => c.id !== id);
  salvarClientes(clientes);
}

export function atualizarCliente(id: string, dados: Partial<Omit<Cliente, 'id' | 'criadoEm'>>): Cliente | null {
  const clientes = carregarClientes();
  const idx = clientes.findIndex(c => c.id === id);
  if (idx < 0) return null;
  clientes[idx] = { ...clientes[idx], ...dados, atualizadoEm: new Date().toISOString() };
  salvarClientes(clientes);
  return clientes[idx];
}

export function buscarClientes(termo: string): Cliente[] {
  if (!termo.trim()) return [];
  const norm = termo.trim().toLowerCase();
  return carregarClientes().filter(c =>
    c.nome.toLowerCase().includes(norm) ||
    c.telefone.includes(norm)
  );
}
