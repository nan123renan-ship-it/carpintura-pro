"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  X,
  Check,
  Trash2,
  Car,
  Calendar,
  Edit2,
} from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { useServicos } from '@/hooks/useServicos';
import { Cliente } from '@/lib/clientes';
import { formatarMoeda } from '@/lib/storage';

type Tela = 'lista' | 'cadastro' | 'detalhe' | 'editar';

const CAMPO_VAZIO = { nome: '', telefone: '', email: '', endereco: '' };

export default function ClientesPage() {
  const router = useRouter();
  const { clientes, adicionar, atualizar, deletar } = useClientes();
  const { servicos } = useServicos();

  const [tela, setTela] = useState<Tela>('lista');
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(CAMPO_VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState(false);

  // Filtra clientes pela busca
  const clientesFiltrados = useMemo(() => {
    if (!busca.trim()) return clientes;
    const norm = busca.toLowerCase();
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(norm) ||
      c.telefone.includes(norm) ||
      c.email.toLowerCase().includes(norm)
    );
  }, [clientes, busca]);

  // Serviços vinculados ao cliente selecionado
  const servicosDoCliente = useMemo(() => {
    if (!clienteSelecionado) return [];
    const nomeNorm = clienteSelecionado.nome.trim().toLowerCase();
    return servicos.filter(s =>
      s.cliente_nome?.trim().toLowerCase() === nomeNorm
    ).sort((a, b) => b.data_servico.localeCompare(a.data_servico));
  }, [clienteSelecionado, servicos]);

  function abrirCadastro() {
    setForm(CAMPO_VAZIO);
    setTela('cadastro');
  }

  function abrirDetalhe(c: Cliente) {
    setClienteSelecionado(c);
    setConfirmandoExcluir(false);
    setTela('detalhe');
  }

  function abrirEditar(c: Cliente) {
    setClienteSelecionado(c);
    setForm({ nome: c.nome, telefone: c.telefone, email: c.email, endereco: c.endereco });
    setTela('editar');
  }

  async function handleSalvar() {
    if (!form.nome.trim()) return;
    setSalvando(true);
    if (tela === 'cadastro') {
      adicionar({ nome: form.nome.trim(), telefone: form.telefone.trim(), email: form.email.trim(), endereco: form.endereco.trim() });
    } else if (tela === 'editar' && clienteSelecionado) {
      atualizar(clienteSelecionado.id, { nome: form.nome.trim(), telefone: form.telefone.trim(), email: form.email.trim(), endereco: form.endereco.trim() });
    }
    setSalvando(false);
    setTela('lista');
    setBusca('');
  }

  function handleExcluir() {
    if (!clienteSelecionado) return;
    deletar(clienteSelecionado.id);
    setTela('lista');
  }

  // ─── TELA: CADASTRO / EDITAR ───────────────────────────────────────────────
  if (tela === 'cadastro' || tela === 'editar') {
    const titulo = tela === 'cadastro' ? 'Novo Cliente' : 'Editar Cliente';
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
            <button onClick={() => setTela(tela === 'editar' && clienteSelecionado ? 'detalhe' : 'lista')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">{titulo}</h1>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
            <input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              placeholder="Nome completo do cliente"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone / WhatsApp</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.telefone}
                onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                placeholder="(11) 99999-9999"
                type="tel"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="email@exemplo.com"
                type="email"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Endereço */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <textarea
                value={form.endereco}
                onChange={e => setForm(f => ({ ...f, endereco: e.target.value }))}
                placeholder="Rua, número, bairro, cidade"
                rows={2}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>
          </div>

          <button
            onClick={handleSalvar}
            disabled={!form.nome.trim() || salvando}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            {salvando ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    );
  }

  // ─── TELA: DETALHE DO CLIENTE ──────────────────────────────────────────────
  if (tela === 'detalhe' && clienteSelecionado) {
    const c = clienteSelecionado;
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setTela('lista')} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h1 className="text-lg font-bold text-gray-900 truncate">{c.nome}</h1>
            </div>
            <button onClick={() => abrirEditar(c)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <Edit2 className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
          {/* Card de dados */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-blue-600">{c.nome.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">{c.nome}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Cliente desde {new Date(c.criadoEm).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-50">
              {c.telefone ? (
                <a href={`tel:${c.telefone}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Phone className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Telefone / WhatsApp</p>
                    <p className="text-sm font-medium text-gray-900">{c.telefone}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Phone className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <p className="text-sm text-gray-300 italic">Telefone não informado</p>
                </div>
              )}

              {c.email ? (
                <a href={`mailto:${c.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                  <Mail className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">E-mail</p>
                    <p className="text-sm font-medium text-gray-900">{c.email}</p>
                  </div>
                </a>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <Mail className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <p className="text-sm text-gray-300 italic">E-mail não informado</p>
                </div>
              )}

              {c.endereco ? (
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="w-4 h-4 text-orange-500 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">Endereço</p>
                    <p className="text-sm font-medium text-gray-900">{c.endereco}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3">
                  <MapPin className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <p className="text-sm text-gray-300 italic">Endereço não informado</p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de serviços */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-bold text-gray-700">Histórico de Serviços</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">{servicosDoCliente.length}</span>
            </div>

            {servicosDoCliente.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <Car className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Nenhum serviço vinculado ainda</p>
              </div>
            ) : (
              <div className="space-y-2">
                {servicosDoCliente.map(s => (
                  <button
                    key={s.id}
                    onClick={() => router.push(`/servicos/${s.id}`)}
                    className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                      <Car className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {s.nome_veiculo || `${s.carro_marca} ${s.carro_modelo}`}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">
                          {new Date(s.data_servico + 'T12:00:00').toLocaleDateString('pt-BR')}
                        </p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          s.status === 'Pago' || s.status === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' :
                          s.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                        }`}>{s.status}</span>
                      </div>
                    </div>
                    <p className="text-emerald-600 font-bold text-sm shrink-0">{formatarMoeda(s.valor_cobrado)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Excluir */}
          <div className="pt-2">
            {confirmandoExcluir ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <p className="text-sm text-red-700 font-medium text-center">Excluir este cliente?</p>
                <p className="text-xs text-red-500 text-center">Os serviços vinculados não serão apagados.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmandoExcluir(false)} className="flex-1 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 text-sm font-medium">Cancelar</button>
                  <button onClick={handleExcluir} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium">Excluir</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmandoExcluir(true)} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-medium hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
                Excluir Cliente
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── TELA: LISTA ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-none">Clientes</h1>
              <p className="text-xs text-gray-400 mt-0.5">{clientes.length} cadastrado{clientes.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={abrirCadastro}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo
          </button>
        </div>

        {/* Busca */}
        {clientes.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por nome ou telefone..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-4">
        {/* Estado vazio */}
        {clientes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Nenhum cliente ainda</h2>
            <p className="text-gray-400 text-sm max-w-xs mb-6">
              Cadastre clientes para acessar rapidamente nas próximas vezes
            </p>
            <button
              onClick={abrirCadastro}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Cadastrar primeiro cliente
            </button>
          </div>
        )}

        {/* Lista */}
        {clientesFiltrados.length > 0 && (
          <div className="space-y-2">
            {clientesFiltrados.map(c => {
              const qtdServicos = servicos.filter(s =>
                s.cliente_nome?.trim().toLowerCase() === c.nome.trim().toLowerCase()
              ).length;
              return (
                <button
                  key={c.id}
                  onClick={() => abrirDetalhe(c)}
                  className="w-full bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-blue-600">{c.nome.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.nome}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {c.telefone || c.email || 'Sem contato'}
                    </p>
                    {qtdServicos > 0 && (
                      <p className="text-xs text-blue-500 font-medium mt-0.5">
                        {qtdServicos} serviço{qtdServicos !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}

        {/* Sem resultado na busca */}
        {clientes.length > 0 && clientesFiltrados.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhum cliente encontrado para "{busca}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
