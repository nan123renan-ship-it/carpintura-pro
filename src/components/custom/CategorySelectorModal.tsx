"use client";

/**
 * CategorySelectorModal — componente compartilhado de seleção de categorias
 * usado em toda a app para despesas.
 *
 * Storage key: "listas_categorias_despesa" (listas + categorias dentro)
 */

import { useState, useEffect } from 'react';
import {
  X, Check, Tag, Search, Plus, FolderOpen, Trash2, ChevronDown,
  Car as CarIcon, Droplet, Lightbulb, Package, Utensils, Home,
  Wifi, Phone, Wrench, ShoppingCart, Briefcase, FileCheck,
  HardHat, UserCog,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
export interface CategoriaItem {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

export interface ListaCategoria {
  id: string;
  nome: string;
  categorias: CategoriaItem[];
  /** Se true, a lista não pode ser deletada (mas suas categorias sim) */
  fixa?: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
export const STORAGE_KEY_LISTAS = 'listas_categorias_despesa';

export const LISTA_COMUNS_DEFAULT: ListaCategoria = {
  id: 'comuns',
  nome: 'Comuns',
  categorias: [
    { id: 'transporte', nome: 'Transporte',   icone: 'Car',          cor: 'bg-blue-500'    },
    { id: 'agua',       nome: 'Água',          icone: 'Droplet',      cor: 'bg-cyan-500'    },
    { id: 'luz',        nome: 'Luz',           icone: 'Lightbulb',    cor: 'bg-yellow-500'  },
    { id: 'material',   nome: 'Material',      icone: 'Package',      cor: 'bg-orange-500'  },
    { id: 'aliment',    nome: 'Alimentação',   icone: 'Utensils',     cor: 'bg-green-500'   },
    { id: 'aluguel',    nome: 'Aluguel',       icone: 'Home',         cor: 'bg-purple-500'  },
    { id: 'internet',   nome: 'Internet',      icone: 'Wifi',         cor: 'bg-indigo-500'  },
    { id: 'telefone',   nome: 'Telefone',      icone: 'Phone',        cor: 'bg-pink-500'    },
    { id: 'manut',      nome: 'Manutenção',    icone: 'Wrench',       cor: 'bg-red-500'     },
    { id: 'equip',      nome: 'Equipamentos',  icone: 'ShoppingCart', cor: 'bg-teal-500'    },
    { id: 'salarios',   nome: 'Salários',      icone: 'Briefcase',    cor: 'bg-emerald-500' },
    { id: 'impostos',   nome: 'Impostos',      icone: 'FileCheck',    cor: 'bg-amber-500'   },
  ],
};

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Car: CarIcon, Droplet, Lightbulb, Package, Utensils, Home,
  Wifi, Phone, Wrench, ShoppingCart, Briefcase, FileCheck, Tag,
};

const CORES = [
  'bg-rose-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500',
  'bg-lime-500', 'bg-amber-500', 'bg-orange-400', 'bg-teal-400',
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500',
];

// ─── Mapa de ícones para listas fixas ────────────────────────────────────────
export const ICONES_LISTAS_FIXAS: Record<string, React.ComponentType<{ className?: string }>> = {
  'oficina': Wrench,
  'prestador-servico': HardHat,
};

// ─── Categoria permanente "Minha Oficina" ─────────────────────────────────────
export const CATEGORIA_MINHA_OFICINA: CategoriaItem = {
  id: 'minha-oficina',
  nome: 'Minha Oficina',
  icone: 'Wrench',
  cor: 'bg-emerald-600',
};

// ─── Listas fixas padrão (não deletáveis, mas categorias editáveis) ────────────
export const LISTAS_FIXAS_IDS = ['oficina', 'prestador-servico'];

export const LISTAS_FIXAS_DEFAULT: ListaCategoria[] = [
  {
    id: 'oficina',
    nome: 'Oficina',
    // "Minha Oficina" sempre aparece como primeira categoria da lista
    categorias: [CATEGORIA_MINHA_OFICINA],
    fixa: true,
  },
  { id: 'prestador-servico', nome: 'Prestador de Serviço', categorias: [], fixa: true },
];

// ─── Helpers de storage ───────────────────────────────────────────────────────
export function carregarListasStorage(): ListaCategoria[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LISTAS);
    const salvas: ListaCategoria[] = raw ? JSON.parse(raw) : [];

    // Garante que as listas fixas sempre existem (mesclando categorias salvas)
    const comFixas = LISTAS_FIXAS_DEFAULT.map(fixa => {
      const salva = salvas.find(l => l.id === fixa.id);
      if (!salva) return fixa;

      // Para a lista "Oficina", garante que "Minha Oficina" está sempre como primeira categoria
      if (fixa.id === 'oficina') {
        const semMinhaOficina = salva.categorias.filter(c => c.id !== CATEGORIA_MINHA_OFICINA.id);
        return {
          ...salva,
          nome: fixa.nome,
          fixa: true,
          categorias: [CATEGORIA_MINHA_OFICINA, ...semMinhaOficina],
        };
      }

      return { ...salva, nome: fixa.nome, fixa: true };
    });

    // Listas customizadas (não fixas e não comuns)
    const TODOS_IDS_RESERVADOS = [...LISTAS_FIXAS_IDS, LISTA_COMUNS_DEFAULT.id];
    const customizadas = salvas.filter(l => !TODOS_IDS_RESERVADOS.includes(l.id));

    // Inclui sempre a lista de categorias comuns
    return [...customizadas, ...comFixas, LISTA_COMUNS_DEFAULT];
  } catch { return [...LISTAS_FIXAS_DEFAULT, LISTA_COMUNS_DEFAULT]; }
}

export function salvarListasStorage(listas: ListaCategoria[]) {
  localStorage.setItem(STORAGE_KEY_LISTAS, JSON.stringify(listas));
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface CategorySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selecionadas: string[];
  onChange: (novas: string[]) => void;
  /** Cor do badge e seleção. Padrão: red */
  accent?: 'red' | 'green';
  /** z-index do overlay. Padrão: 60 */
  zIndex?: number;
}

// ─── Componente ───────────────────────────────────────────────────────────────
export function CategorySelectorModal({
  isOpen,
  onClose,
  selecionadas,
  onChange,
  accent = 'red',
  zIndex = 60,
}: CategorySelectorModalProps) {
  const [busca, setBusca] = useState('');
  const [listasCustom, setListasCustom] = useState<ListaCategoria[]>([]);
  const [listaAberta, setListaAberta] = useState<string | null>(null);
  const [modoExclusao, setModoExclusao] = useState(false);

  // Modal criar lista
  const [modalNovaLista, setModalNovaLista] = useState(false);
  const [novaListaNome, setNovaListaNome] = useState('');

  // Modal criar categoria
  const [modalNovaCat, setModalNovaCat] = useState(false);
  const [novaCatNome, setNovaCatNome] = useState('');
  const [listaAlvoId, setListaAlvoId] = useState('');

  const ring   = accent === 'green' ? 'ring-[#00A859]'  : 'ring-red-500';
  const bg     = accent === 'green' ? 'bg-[#00A859]/10' : 'bg-red-50';
  const dot    = accent === 'green' ? 'bg-[#00A859]'    : 'bg-red-500';
  const btnBg  = accent === 'green' ? 'bg-[#00A859] hover:bg-[#009048]' : 'bg-red-500 hover:bg-red-600';
  const btnTxt = accent === 'green' ? 'text-[#00A859] hover:text-[#009048]' : 'text-red-500 hover:text-red-600';
  const borderHover = accent === 'green' ? 'hover:border-[#00A859]' : 'hover:border-red-400';

  useEffect(() => {
    if (isOpen) {
      setListasCustom(carregarListasStorage());
      setBusca('');
      setModoExclusao(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const salvar = (listas: ListaCategoria[]) => {
    salvarListasStorage(listas);
    setListasCustom(listas);
  };

  const toggle = (nome: string) => {
    onChange(selecionadas.includes(nome)
      ? selecionadas.filter(c => c !== nome)
      : [...selecionadas, nome]
    );
  };

  // Criar lista — vai para o topo (índice 0)
  const criarLista = () => {
    if (!novaListaNome.trim()) return;
    const nova: ListaCategoria = { id: `lista-${Date.now()}`, nome: novaListaNome.trim(), categorias: [] };
    const novas = [nova, ...listasCustom]; // nova lista no topo
    salvar(novas);
    setListaAberta(nova.id);
    setNovaListaNome('');
    setModalNovaLista(false);
  };

  // Apagar lista
  const apagarLista = (listaId: string) => {
    const lista = listasCustom.find(l => l.id === listaId);
    if (lista) {
      const removidos = lista.categorias.map(c => c.nome);
      onChange(selecionadas.filter(c => !removidos.includes(c)));
    }
    salvar(listasCustom.filter(l => l.id !== listaId));
    if (listaAberta === listaId) setListaAberta(null);
  };

  // Criar categoria
  const abrirNovaCat = (listaId: string) => {
    setListaAlvoId(listaId);
    setNovaCatNome('');
    setModalNovaCat(true);
  };

  const criarCategoria = () => {
    if (!novaCatNome.trim() || !listaAlvoId) return;
    const cor = CORES[Math.floor(Math.random() * CORES.length)];
    const nova: CategoriaItem = { id: `cat-${Date.now()}`, nome: novaCatNome.trim(), icone: 'Tag', cor };
    const novas = listasCustom.map(l =>
      l.id === listaAlvoId ? { ...l, categorias: [...l.categorias, nova] } : l
    );
    salvar(novas);
    onChange([...selecionadas, nova.nome]);
    setNovaCatNome('');
    setModalNovaCat(false);
  };

  // Apagar categoria (protege "Minha Oficina" de exclusão)
  const apagarCategoria = (listaId: string, catId: string, catNome: string) => {
    if (catId === CATEGORIA_MINHA_OFICINA.id) return; // imutável
    const novas = listasCustom.map(l =>
      l.id === listaId ? { ...l, categorias: l.categorias.filter(c => c.id !== catId) } : l
    );
    salvar(novas);
    onChange(selecionadas.filter(c => c !== catNome));
  };

  // Listas para exibir: customizadas primeiro, fixas no meio, "Comuns" sempre por último
  const TODOS_IDS_RESERVADOS_MODAL = [...LISTAS_FIXAS_IDS, LISTA_COMUNS_DEFAULT.id];
  const listasNaoFixas = listasCustom.filter(l => !TODOS_IDS_RESERVADOS_MODAL.includes(l.id));
  const listasFixas = listasCustom.filter(l => LISTAS_FIXAS_IDS.includes(l.id));
  const todasAsListas: ListaCategoria[] = [...listasNaoFixas, ...listasFixas, LISTA_COMUNS_DEFAULT];
  const listasFiltradas = busca
    ? todasAsListas
        .map(l => ({ ...l, categorias: l.categorias.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase())) }))
        .filter(l => l.categorias.length > 0)
    : todasAsListas;

  // Grid de categorias
  const renderGrid = (lista: ListaCategoria, isCustom: boolean) => (
    <div className="px-4 pb-4">
      <div className="grid grid-cols-4 gap-2">
        {lista.categorias.map(cat => {
          const Icon = ICON_MAP[cat.icone] || Tag;
          const sel = selecionadas.includes(cat.nome);
          return (
            <div key={cat.id} className="relative group/item">
              <button
                onClick={() => !modoExclusao && toggle(cat.nome)}
                className={`relative w-full flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors group ${modoExclusao ? 'opacity-80' : sel ? `${bg} ring-2 ${ring}` : 'hover:bg-gray-50'}`}
              >
                {sel && !modoExclusao && (
                  <div className={`absolute top-1 right-1 w-4 h-4 ${dot} rounded-full flex items-center justify-center z-10`}>
                    <Check className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div className={`w-10 h-10 ${cat.cor} rounded-full flex items-center justify-center transition-transform ${!modoExclusao ? 'group-hover:scale-110' : ''}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center line-clamp-2 leading-tight">{cat.nome}</span>
              </button>
              {isCustom && modoExclusao && cat.id !== CATEGORIA_MINHA_OFICINA.id && (
                <button
                  onClick={e => { e.stopPropagation(); apagarCategoria(lista.id, cat.id, cat.nome); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md z-20 animate-in zoom-in-75 duration-150"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
              {isCustom && !modoExclusao && cat.id !== CATEGORIA_MINHA_OFICINA.id && (
                <button
                  onClick={e => { e.stopPropagation(); apagarCategoria(lista.id, cat.id, cat.nome); }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover/item:flex shadow-md z-20"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        {isCustom && !modoExclusao && (
          <button
            onClick={() => abrirNovaCat(lista.id)}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5 text-gray-500" />
            </div>
            <span className="text-xs font-medium text-gray-400 text-center">Nova</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ── Modal principal ─────────────────────────────────────── */}
      <div
        className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ zIndex }}
        onClick={onClose}
      >
        <div
          className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">Categorias</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Busca */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar categoria..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
              />
              {busca && (
                <button onClick={() => setBusca('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Listas com accordion */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {listasFiltradas.map(lista => {
              const isCustom = lista.id !== 'comuns';
              const isFixa = !!lista.fixa;
              const aberta = listaAberta === lista.id || !!busca;
              const qtdSel = lista.categorias.filter(c => selecionadas.includes(c.nome)).length;

              return (
                <div key={lista.id}>
                  <div className="flex items-center hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => setListaAberta(aberta && !busca ? null : lista.id)}
                      className="flex-1 flex items-center gap-3 px-5 py-3.5 text-left"
                    >
                      {(() => {
                        if (isFixa) {
                          const IconeFixa = ICONES_LISTAS_FIXAS[lista.id];
                          return IconeFixa
                            ? <IconeFixa className="w-4 h-4 shrink-0 text-blue-400" />
                            : <FolderOpen className="w-4 h-4 shrink-0 text-blue-400" />;
                        }
                        if (lista.id === 'comuns') return <Tag className="w-4 h-4 shrink-0 text-gray-400" />;
                        return <FolderOpen className="w-4 h-4 shrink-0 text-red-400" />;
                      })()}
                      <span className="text-sm font-semibold text-gray-700 flex-1">{lista.nome}</span>
                      {qtdSel > 0 && (
                        <span className={`text-xs font-bold text-white ${dot} rounded-full w-5 h-5 flex items-center justify-center`}>
                          {qtdSel}
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`} />
                    </button>
                    {isCustom && !isFixa && (
                      <button
                        onClick={() => apagarLista(lista.id)}
                        className="px-3 py-3.5 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {aberta && (
                    <div className="bg-gray-50/50">
                      {lista.categorias.length === 0 ? (
                        <div className="px-4 pb-4">
                          <button
                            onClick={() => abrirNovaCat(lista.id)}
                            className={`w-full flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 ${borderHover} hover:bg-red-50 transition-colors group`}
                          >
                            <div className="w-8 h-8 bg-gray-100 group-hover:bg-red-100 rounded-full flex items-center justify-center transition-colors">
                              <Plus className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
                            </div>
                            <span className="text-xs text-gray-400 group-hover:text-red-500 font-medium transition-colors">Adicionar primeira categoria</span>
                          </button>
                        </div>
                      ) : renderGrid(lista, isCustom)}
                    </div>
                  )}
                </div>
              );
            })}

            {listasFiltradas.length === 0 && (
              <div className="flex flex-col items-center py-10 text-gray-400">
                <Search className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">Nenhuma categoria encontrada</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => setModalNovaLista(true)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 ${borderHover} ${btnTxt} font-semibold text-sm transition-colors text-gray-500`}
            >
              <Plus className="w-4 h-4" />
              Nova lista
            </button>
            <button
              onClick={() => setModoExclusao(v => !v)}
              className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 transition-colors ${
                modoExclusao
                  ? 'border-red-500 bg-red-500 text-white'
                  : 'border-dashed border-gray-300 text-gray-400 hover:border-red-400 hover:text-red-400'
              }`}
              title={modoExclusao ? 'Sair do modo exclusão' : 'Excluir categorias'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {modoExclusao ? (
              <button
                onClick={() => setModoExclusao(false)}
                className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Concluir
              </button>
            ) : (
              <button
                onClick={onClose}
                className={`flex-1 py-3 ${btnBg} text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2`}
              >
                <Check className="w-4 h-4" />
                Confirmar {selecionadas.length > 0 ? `(${selecionadas.length})` : ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal criar lista ──────────────────────────────────── */}
      {modalNovaLista && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" style={{ zIndex: zIndex + 10 }} onClick={() => { setModalNovaLista(false); setNovaListaNome(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nova Lista</h3>
                <p className="text-xs text-gray-500">Grupo para organizar categorias</p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Lista *</label>
            <input
              type="text"
              value={novaListaNome}
              onChange={e => setNovaListaNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && criarLista()}
              placeholder="Ex: Obras, Escritório, Casa..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalNovaLista(false); setNovaListaNome(''); }}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-gray-800 transition-colors">Cancelar</button>
              <button onClick={criarLista} disabled={!novaListaNome.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors">Criar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal criar categoria ──────────────────────────────── */}
      {modalNovaCat && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" style={{ zIndex: zIndex + 10 }} onClick={() => { setModalNovaCat(false); setNovaCatNome(''); }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Tag className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Nova Categoria</h3>
                <p className="text-xs text-gray-500">Em: <strong>{listasCustom.find(l => l.id === listaAlvoId)?.nome}</strong></p>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Categoria *</label>
            <input
              type="text"
              value={novaCatNome}
              onChange={e => setNovaCatNome(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && criarCategoria()}
              placeholder="Ex: Combustível, Cimento..."
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 text-black"
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button onClick={() => { setModalNovaCat(false); setNovaCatNome(''); }}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-gray-800 transition-colors">Cancelar</button>
              <button onClick={criarCategoria} disabled={!novaCatNome.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors">Criar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Botão trigger (campo do formulário) ──────────────────────────────────────
interface CategoryFieldButtonProps {
  selecionadas: string[];
  onClick: () => void;
  accent?: 'red' | 'green';
}

export function CategoryFieldButton({ selecionadas, onClick, accent = 'red' }: CategoryFieldButtonProps) {
  const tagBg  = accent === 'green' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
  const icon   = accent === 'green' ? 'text-[#00A859]' : 'text-red-500';

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors text-left flex items-center justify-between"
    >
      <div className="flex items-center gap-3 min-w-0">
        <Tag className={`w-5 h-5 shrink-0 ${icon}`} />
        <div className="min-w-0">
          {selecionadas.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selecionadas.map(cat => (
                <span key={cat} className={`inline-flex items-center px-2 py-0.5 ${tagBg} text-xs rounded-full font-medium`}>{cat}</span>
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">Selecione as categorias</span>
          )}
        </div>
      </div>
      <svg className="w-5 h-5 text-gray-400 shrink-0 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
