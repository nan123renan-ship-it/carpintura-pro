"use client";

import { useState, useMemo, useEffect } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { formatarMoeda } from '@/lib/storage';
import { carregarListasStorage, ListaCategoria } from '@/components/custom/CategorySelectorModal';
import {
  TrendingUp, TrendingDown, DollarSign, Car, Target,
  Calendar, ChevronDown, BarChart3, PieChart, Activity,
  Users, Building2, Tag, Layers, Filter, X, ChevronUp, SlidersHorizontal,
  ChevronLeft, ChevronRight, UserCircle2,
} from 'lucide-react';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type Periodo = 'hoje' | 'semana' | 'mes' | 'ano' | 'personalizado';
type AgrupamentoCat = 'prestadores' | 'oficinas' | 'categorias';

// Textos placeholder que NÃO devem ser considerados como dados reais do usuário
const PLACEHOLDERS_INVALIDOS = [
  'cliente não informado', 'nao informado', 'não informado',
  'marca não informada', 'sem nome', 'sem cliente',
];
function nomeReal(valor: string | undefined | null): string | null {
  if (!valor || !valor.trim()) return null;
  if (PLACEHOLDERS_INVALIDOS.includes(valor.trim().toLowerCase())) return null;
  return valor.trim();
}

function calcularIntervalo(periodo: Periodo, dataInicio: string, dataFim: string, offset = 0): { inicio: Date; fim: Date } {
  const hoje = new Date();
  switch (periodo) {
    case 'hoje': {
      const d = new Date(hoje); d.setDate(d.getDate() + offset);
      return {
        inicio: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
        fim: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59),
      };
    }
    case 'semana': {
      // semana = 7 dias terminando em "hoje + offset*7"
      const fimSem = new Date(hoje); fimSem.setDate(fimSem.getDate() + offset * 7);
      const iniSem = new Date(fimSem); iniSem.setDate(iniSem.getDate() - 6);
      iniSem.setHours(0, 0, 0, 0); fimSem.setHours(23, 59, 59, 999);
      return { inicio: iniSem, fim: fimSem };
    }
    case 'mes': {
      const year = hoje.getFullYear(); const month = hoje.getMonth() + offset;
      const d = new Date(year, month, 1);
      return {
        inicio: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0),
        fim: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59),
      };
    }
    case 'ano': {
      const y = hoje.getFullYear() + offset;
      return {
        inicio: new Date(y, 0, 1, 0, 0, 0),
        fim: new Date(y, 11, 31, 23, 59, 59),
      };
    }
    case 'personalizado':
      return {
        inicio: dataInicio ? new Date(dataInicio + 'T00:00:00') : new Date(hoje.getFullYear(), 0, 1),
        fim: dataFim ? new Date(dataFim + 'T23:59:59') : new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate(), 23, 59, 59),
      };
    default:
      return {
        inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1),
        fim: new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59),
      };
  }
}

function labelPeriodo(periodo: Periodo, offset: number): string {
  const hoje = new Date();
  if (periodo === 'hoje') {
    const d = new Date(hoje); d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
  }
  if (periodo === 'semana') {
    const fim = new Date(hoje); fim.setDate(fim.getDate() + offset * 7);
    const ini = new Date(fim); ini.setDate(ini.getDate() - 6);
    const fmtShort = (d: Date) => d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    return `${fmtShort(ini)} – ${fmtShort(fim)}`;
  }
  if (periodo === 'mes') {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + offset, 1);
    return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  if (periodo === 'ano') {
    return String(hoje.getFullYear() + offset);
  }
  return 'Personalizado';
}

// ─── Mini gráfico de barras SVG ───────────────────────────────────────────────
function MiniBarChart({ dados, cor = '#22c55e' }: { dados: number[]; cor?: string }) {
  if (!dados.length) return null;
  const max = Math.max(...dados, 1);
  const w = 100 / dados.length;
  return (
    <svg viewBox="0 0 100 40" className="w-full h-10" preserveAspectRatio="none">
      {dados.map((v, i) => {
        const h = (v / max) * 36;
        return <rect key={i} x={i * w + 1} y={40 - h} width={w - 2} height={h} rx={2} fill={cor} opacity={0.85} />;
      })}
    </svg>
  );
}

// ─── Gráfico de barras SVG ─────────────────────────────────────────────────────
function BarGroupChart({ dados }: { dados: { label: string; receita: number; despesa: number; lucro: number }[] }) {
  if (!dados.length) return null;
  const max = Math.max(...dados.flatMap(d => [d.receita, d.despesa, Math.max(d.lucro, 0)]), 1);
  const H = 130;
  const barW = dados.length === 1 ? 40 : 10;
  const gap = dados.length === 1 ? 10 : 4;
  const groupW = barW * 3 + gap * 2;
  const groupGap = dados.length === 1 ? 0 : Math.max(10, Math.floor(280 / dados.length) - groupW);
  const totalW = dados.length === 1 ? groupW : dados.length * (groupW + groupGap) - groupGap;

  return (
    <svg viewBox={`0 0 ${totalW} ${H}`} className="w-full" style={{ height: H }} preserveAspectRatio="xMidYMax meet">
      {dados.map((d, i) => {
        const x = dados.length === 1 ? 0 : i * (groupW + groupGap);
        const rH = Math.max((d.receita / max) * (H - 12), d.receita > 0 ? 3 : 0);
        const dH = Math.max((d.despesa / max) * (H - 12), d.despesa > 0 ? 3 : 0);
        const lH = Math.max((Math.max(d.lucro, 0) / max) * (H - 12), d.lucro > 0 ? 3 : 0);
        return (
          <g key={i}>
            {/* Receita — azul */}
            <rect x={x} y={H - rH} width={barW} height={rH} rx="3" fill="#3b82f6" opacity="0.95" />
            {/* Despesa — vermelho */}
            <rect x={x + barW + gap} y={H - dH} width={barW} height={dH} rx="3" fill="#ef4444" opacity="0.95" />
            {/* Lucro — verde escuro */}
            <rect x={x + (barW + gap) * 2} y={H - lH} width={barW} height={lH} rx="3" fill="#15803d" opacity="0.95" />
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gráfico de linha SVG (mantido para uso no card de visão geral) ───────────
function LineChart({ pontos, cor = '#22c55e', height = 80 }: { pontos: number[]; cor?: string; height?: number }) {
  if (pontos.length < 2) return (
    <div className="flex items-center justify-center text-white/20 text-xs" style={{ height }}>Dados insuficientes</div>
  );
  const max = Math.max(...pontos, 1);
  const W = 300; const H = height;
  const pts = pontos.map((v, i) => {
    const x = (i / (pontos.length - 1)) * W;
    const y = H - (v / max) * (H - 8);
    return `${x},${y}`;
  });
  const path = `M ${pts.join(' L ')}`;
  const area = `M ${pts[0]} L ${pts.join(' L ')} L ${W},${H} L 0,${H} Z`;
  const gradId = `lg${cor.replace(/[^a-z0-9]/gi, '')}${height}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={cor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={cor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={path} fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pontos.map((v, i) => {
        const x = (i / (pontos.length - 1)) * W;
        const y = H - (v / max) * (H - 8);
        return <circle key={i} cx={x} cy={y} r="3" fill={cor} />;
      })}
    </svg>
  );
}

// ─── Gráfico de pizza SVG ─────────────────────────────────────────────────────
const PIZZA_COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

function PizzaChart({ fatias }: { fatias: { nome: string; valor: number }[] }) {
  const total = fatias.reduce((s, f) => s + f.valor, 0);
  if (total === 0 || !fatias.length) return (
    <div className="flex items-center justify-center h-20 text-white/20 text-xs">Sem dados</div>
  );
  let angulo = -Math.PI / 2;
  const R = 50; const cx = 60; const cy = 60;
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg viewBox="0 0 120 120" className="w-28 h-28 shrink-0">
        {fatias.map((f, i) => {
          const pct = f.valor / total;
          if (pct < 0.001) return null;
          const a1 = angulo; const a2 = angulo + pct * 2 * Math.PI; angulo = a2;
          const x1 = cx + R * Math.cos(a1); const y1 = cy + R * Math.sin(a1);
          const x2 = cx + R * Math.cos(a2); const y2 = cy + R * Math.sin(a2);
          return (
            <path key={i}
              d={`M ${cx} ${cy} L ${x1} ${y1} A ${R} ${R} 0 ${pct > 0.5 ? 1 : 0} 1 ${x2} ${y2} Z`}
              fill={PIZZA_COLORS[i % PIZZA_COLORS.length]} stroke="#0d2818" strokeWidth="1.5" />
          );
        })}
        <circle cx={cx} cy={cy} r={R * 0.52} fill="#0d2818" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700">{fatias.length}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6b7280" fontSize="7">grupos</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {fatias.slice(0, 6).map((f, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIZZA_COLORS[i % PIZZA_COLORS.length] }} />
            <span className="text-white/60 truncate flex-1">{f.nome}</span>
            <span className="text-white font-semibold shrink-0">{((f.valor / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barras horizontais ───────────────────────────────────────────────────────
function BarrasHorizontais({ items, cor = '#22c55e' }: { items: { nome: string; valor: number; extra?: string }[]; cor?: string }) {
  const max = Math.max(...items.map(i => i.valor), 1);
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-white/60 truncate max-w-[60%]">{item.nome}</span>
            <span className="text-white font-semibold shrink-0">{item.extra || formatarMoeda(item.valor)}</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(item.valor / max) * 100}%`, background: cor }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function RelatoriosPage() {
  const { servicos, loading: loadingS } = useServicos();
  const { despesas, loading: loadingD } = useDespesas();

  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [agrupamento, setAgrupamento] = useState<AgrupamentoCat>('categorias');
  const [catsFiltro, setCatsFiltro] = useState<string[]>([]);
  const [mostrarCustom, setMostrarCustom] = useState(false);
  const [mostrarFiltroCateg, setMostrarFiltroCateg] = useState(false);
  const [secaoAberta, setSecaoAberta] = useState<string | null>(null);
  const [listasCateg, setListasCateg] = useState<ListaCategoria[]>([]);
  const [incluirDespesasPessoais, setIncluirDespesasPessoais] = useState(false);
  const [somenteDespesasPessoais, setSomenteDespesasPessoais] = useState(false);
  const [painelControleAberto, setPainelControleAberto] = useState(false);
  const [somentePendentes, setSomentePendentes] = useState(false);
  const [somenteConcluidos, setSomenteConcluidos] = useState(false);
  // offset de navegação: 0 = atual, -1 = anterior, +1 = próximo, etc.
  const [navOffset, setNavOffset] = useState(0);

  useEffect(() => { setListasCateg(carregarListasStorage()); }, []);

  // Ouvir evento do botão Controle na navbar
  useEffect(() => {
    const handler = () => setPainelControleAberto(v => !v);
    window.addEventListener('abrirPainelControle', handler);
    return () => window.removeEventListener('abrirPainelControle', handler);
  }, []);


  const todasCatsDespesas = useMemo(() => {
    const set = new Set<string>();
    despesas.forEach(d => (d.categorias || []).forEach(c => set.add(c)));
    return Array.from(set).sort();
  }, [despesas]);

  const catsOficina = useMemo(() => {
    const l = listasCateg.find(l => l.id === 'oficina');
    return l ? l.categorias.map(c => c.nome) : [];
  }, [listasCateg]);

  const catsPrestador = useMemo(() => {
    const l = listasCateg.find(l => l.id === 'prestador-servico');
    return l ? l.categorias.map(c => c.nome) : [];
  }, [listasCateg]);

  const { inicio, fim } = useMemo(() => calcularIntervalo(periodo, dataInicio, dataFim, navOffset), [periodo, dataInicio, dataFim, navOffset]);

  // IDs dos serviços que passam no filtro de status (pendente/concluído)
  const idsServicosFiltrados = useMemo(() => {
    return new Set(
      servicos
        .filter(s => {
          const d = new Date(s.data_servico + 'T12:00:00');
          if (d < inicio || d > fim) return false;
          const status = s.status_pagamento || (s.status === 'Pago' || s.status === 'Finalizado' ? 'resolvido' : 'pendente');
          if (somentePendentes && status !== 'pendente') return false;
          if (somenteConcluidos && status !== 'resolvido') return false;
          return true;
        })
        .map(s => s.id)
    );
  }, [servicos, inicio, fim, somentePendentes, somenteConcluidos]);

  const servicosFiltrados = useMemo(() => {
    return servicos.filter(s => idsServicosFiltrados.has(s.id));
  }, [servicos, idsServicosFiltrados]);

  const despesasFiltradas = useMemo(() => {
    let res = despesas.filter(d => {
      const dt = new Date(d.data_despesa + 'T12:00:00');
      if (dt < inicio || dt > fim) return false;
      // Modo Interruptor: mostrar SOMENTE despesas pessoais
      if (somenteDespesasPessoais) {
        if (d.tipo_gasto !== 'pessoal') return false;
      } else {
        // Excluir despesas pessoais quando o toggle estiver desligado
        if (!incluirDespesasPessoais && d.tipo_gasto === 'pessoal') return false;
      }
      // Filtro de pendentes/concluídos: para despesas vinculadas a serviço, segue o status do serviço
      if (somentePendentes || somenteConcluidos) {
        if (d.servico_id) {
          // Despesa vinculada a serviço — inclui só se o serviço passou no filtro
          if (!idsServicosFiltrados.has(d.servico_id)) return false;
        } else {
          // Despesa manual — usa seu próprio status_pagamento
          // "pago" = concluído, "pendente" = pendente
          const statusDesp = d.status_pagamento || 'pendente';
          if (somentePendentes && statusDesp !== 'pendente') return false;
          if (somenteConcluidos && statusDesp !== 'pago') return false;
        }
      }
      return true;
    });
    if (catsFiltro.length > 0) res = res.filter(d => (d.categorias || []).some(c => catsFiltro.includes(c)));
    return res;
  }, [despesas, inicio, fim, catsFiltro, incluirDespesasPessoais, somenteDespesasPessoais, somentePendentes, somenteConcluidos, idsServicosFiltrados]);

  const kpis = useMemo(() => {
    const faturamento = servicosFiltrados.reduce((s, sv) => s + sv.valor_cobrado, 0);
    const totalDespesas = despesasFiltradas.reduce((s, d) => s + d.valor, 0);
    const lucro = faturamento - totalDespesas;
    const qtd = servicosFiltrados.length;
    const ticket = qtd > 0 ? faturamento / qtd : 0;
    const margem = faturamento > 0 ? (lucro / faturamento) * 100 : 0;
    return { faturamento, totalDespesas, lucro, qtd, ticket, margem };
  }, [servicosFiltrados, despesasFiltradas]);

  const evolucao = useMemo(() => {
    const pontos: { label: string; receita: number; despesa: number; lucro: number }[] = [];
    if (periodo === 'hoje') {
      // Divide o dia em faixas horárias usando inicio (que já tem o offset aplicado)
      const diaBase = new Date(inicio);
      [6, 10, 14, 18, 22].forEach(h => {
        const ini2 = new Date(diaBase.getFullYear(), diaBase.getMonth(), diaBase.getDate(), h, 0, 0);
        const fim2 = new Date(diaBase.getFullYear(), diaBase.getMonth(), diaBase.getDate(), h + 3, 59, 59);
        const key = diaBase.toISOString().slice(0, 10);
        const receita = servicosFiltrados.filter(s => s.data_servico === key).reduce((s, sv) => s + sv.valor_cobrado, 0);
        const despesa = despesasFiltradas.filter(d2 => d2.data_despesa === key).reduce((s, d2) => s + d2.valor, 0);
        // Para hoje só há um ponto real, distribuímos igualmente para visualização
        pontos.push({ label: `${h}h`, receita: h === 6 ? receita : 0, despesa: h === 6 ? despesa : 0, lucro: 0 });
      });
      // Ajusta para colocar tudo no horário correto
      const key = diaBase.toISOString().slice(0, 10);
      const totalReceita = servicosFiltrados.filter(s => s.data_servico === key).reduce((s, sv) => s + sv.valor_cobrado, 0);
      const totalDespesa = despesasFiltradas.filter(d2 => d2.data_despesa === key).reduce((s, d2) => s + d2.valor, 0);
      return [{ label: diaBase.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }), receita: totalReceita, despesa: totalDespesa, lucro: totalReceita - totalDespesa }];
    } else if (periodo === 'semana') {
      // Usa inicio (já tem offset) como base da semana
      for (let i = 0; i < 7; i++) {
        const d = new Date(inicio); d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString('pt-BR', { weekday: 'short' });
        const receita = servicosFiltrados.filter(s => s.data_servico === key).reduce((s, sv) => s + sv.valor_cobrado, 0);
        const despesa = despesasFiltradas.filter(d2 => d2.data_despesa === key).reduce((s, d2) => s + d2.valor, 0);
        pontos.push({ label, receita, despesa, lucro: receita - despesa });
      }
    } else if (periodo === 'mes') {
      // Total do mês inteiro — 1 único ponto
      const receita = servicosFiltrados.reduce((s, sv) => s + sv.valor_cobrado, 0);
      const despesa = despesasFiltradas.reduce((s, d2) => s + d2.valor, 0);
      const label = inicio.toLocaleDateString('pt-BR', { month: 'long' });
      pontos.push({ label, receita, despesa, lucro: receita - despesa });
    } else {
      const meses: Record<string, { label: string; receita: number; despesa: number }> = {};
      const cur = new Date(inicio);
      while (cur <= fim) {
        const key = cur.toISOString().slice(0, 7);
        if (!meses[key]) meses[key] = { label: cur.toLocaleDateString('pt-BR', { month: 'short' }), receita: 0, despesa: 0 };
        cur.setMonth(cur.getMonth() + 1);
      }
      servicosFiltrados.forEach(s => { const k = s.data_servico.slice(0, 7); if (meses[k]) meses[k].receita += s.valor_cobrado; });
      despesasFiltradas.forEach(d => { const k = d.data_despesa.slice(0, 7); if (meses[k]) meses[k].despesa += d.valor; });
      Object.values(meses).forEach(m => pontos.push({ label: m.label, receita: m.receita, despesa: m.despesa, lucro: m.receita - m.despesa }));
    }
    return pontos;
  }, [servicosFiltrados, despesasFiltradas, periodo, inicio, fim]);

  const dadosAgrupados = useMemo(() => {
    const map: Record<string, { nome: string; qtd: number; valor: number }> = {};
    if (agrupamento === 'categorias') {
      despesasFiltradas.forEach(d => {
        const cats = (d.categorias && d.categorias.length > 0) ? d.categorias : [d.tipo_despesa];
        cats.forEach(cat => {
          if (!map[cat]) map[cat] = { nome: cat, qtd: 0, valor: 0 };
          map[cat].qtd++; map[cat].valor += d.valor;
        });
      });
    } else if (agrupamento === 'prestadores') {
      despesasFiltradas.forEach(d => {
        const cats = (d.categorias || []).filter(c => catsPrestador.includes(c));
        cats.forEach(cat => { if (!map[cat]) map[cat] = { nome: cat, qtd: 0, valor: 0 }; map[cat].qtd++; map[cat].valor += d.valor; });
      });
      if (!Object.keys(map).length) {
        servicosFiltrados.forEach(s => {
          const nome = nomeReal(s.cliente_nome);
          if (!nome) return; // ignora registros sem cliente real
          if (!map[nome]) map[nome] = { nome, qtd: 0, valor: 0 }; map[nome].qtd++; map[nome].valor += s.valor_cobrado;
        });
      }
    } else {
      despesasFiltradas.forEach(d => {
        const cats = (d.categorias || []).filter(c => catsOficina.includes(c));
        cats.forEach(cat => { if (!map[cat]) map[cat] = { nome: cat, qtd: 0, valor: 0 }; map[cat].qtd++; map[cat].valor += d.valor; });
      });
      if (!Object.keys(map).length) {
        servicosFiltrados.forEach(s => {
          const nome = nomeReal(s.carro_marca) || 'Outros';
          if (!map[nome]) map[nome] = { nome, qtd: 0, valor: 0 }; map[nome].qtd++; map[nome].valor += s.valor_cobrado;
        });
      }
    }
    return Object.values(map).sort((a, b) => b.valor - a.valor).slice(0, 8);
  }, [despesasFiltradas, servicosFiltrados, agrupamento, catsPrestador, catsOficina]);

  const rankingCats = useMemo(() => {
    const map: Record<string, { total: number; freq: number }> = {};
    despesasFiltradas.forEach(d => {
      const cats = (d.categorias && d.categorias.length > 0) ? d.categorias : [d.tipo_despesa];
      cats.forEach(cat => {
        if (!map[cat]) map[cat] = { total: 0, freq: 0 }; map[cat].total += d.valor; map[cat].freq++;
      });
    });
    return Object.entries(map).map(([nome, v]) => ({ nome, ...v })).sort((a, b) => b.total - a.total);
  }, [despesasFiltradas]);

  const topClientes = useMemo(() => {
    const map: Record<string, { nome: string; qtd: number; valor: number }> = {};
    servicosFiltrados.forEach(s => {
      const nome = nomeReal(s.cliente_nome);
      if (!nome) return; // ignora registros sem cliente real
      if (!map[nome]) map[nome] = { nome, qtd: 0, valor: 0 }; map[nome].qtd++; map[nome].valor += s.valor_cobrado;
    });
    return Object.values(map).sort((a, b) => b.valor - a.valor).slice(0, 5);
  }, [servicosFiltrados]);

  const formasPagamento = useMemo(() => {
    const map: Record<string, number> = {};
    servicosFiltrados.forEach(s => { const fp = s.forma_pagamento || 'Outro'; map[fp] = (map[fp] || 0) + s.valor_cobrado; });
    return Object.entries(map).map(([nome, valor]) => ({ nome, valor })).sort((a, b) => b.valor - a.valor);
  }, [servicosFiltrados]);

  const loading = loadingS || loadingD;
  const semDados = !loading && servicos.length === 0 && despesas.length === 0;
  const toggleSecao = (id: string) => setSecaoAberta(s => s === id ? null : id);


  const agrupamentos: { value: AgrupamentoCat; label: string; icon: any }[] = [
    { value: 'categorias', label: 'Categorias', icon: Tag },
  ];

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(160deg, #071a0f 0%, #0d2818 50%, #081510 100%)' }}>
      <div className="max-w-2xl mx-auto px-4 pb-28 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Relatórios</h1>
            <p className="text-white/40 text-sm mt-0.5">
              {somenteDespesasPessoais ? 'Anotações Pessoais' : 'Dashboard de performance'}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: somenteDespesasPessoais ? 'rgba(139,92,246,0.2)' : 'rgba(34,197,94,0.15)' }}>
            {somenteDespesasPessoais
              ? <UserCircle2 className="w-5 h-5 text-purple-400" />
              : <BarChart3 className="w-5 h-5 text-green-400" />
            }
          </div>
        </div>

        {/* Banner: modo Apenas Pessoais ativo */}
        {somenteDespesasPessoais && (
          <div
            className="rounded-2xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)' }}
          >
            <UserCircle2 className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <p className="text-purple-300 text-sm font-semibold leading-none">Modo: Apenas Despesas Pessoais</p>
              <p className="text-purple-400/60 text-xs mt-1">Exibindo somente anotações pessoais. Toque em "Pessoais" na barra inferior para desativar.</p>
            </div>
          </div>
        )}

        {/* Filtro de Período */}
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          {/* Tabs de tipo de período */}
          <div className="flex gap-1.5">
            {(['hoje', 'semana', 'mes', 'ano'] as Periodo[]).map(p => (
              <button key={p}
                onClick={() => { setPeriodo(p); setNavOffset(0); setMostrarCustom(false); }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${periodo === p ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-white/45 hover:text-white/70'}`}
                style={periodo !== p ? { background: 'rgba(255,255,255,0.07)' } : {}}>
                {p === 'hoje' ? 'Hoje' : p === 'semana' ? 'Semana' : p === 'mes' ? 'Mês' : 'Ano'}
              </button>
            ))}
            {/* Botão Personalizado */}
            <button
              onClick={() => { setPeriodo('personalizado'); setNavOffset(0); setMostrarCustom(true); }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${periodo === 'personalizado' ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-white/45 hover:text-white/70'}`}
              style={periodo !== 'personalizado' ? { background: 'rgba(255,255,255,0.07)' } : {}}>
              <Calendar className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navegação com setas — só para períodos não personalizados */}
          {periodo !== 'personalizado' && (
            <div className="flex items-center justify-between gap-2 py-0.5">
              <button
                onClick={() => setNavOffset(v => v - 1)}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronLeft className="w-4 h-4 text-white/60" />
              </button>

              <span className="flex-1 text-center text-white font-semibold text-sm capitalize truncate">
                {labelPeriodo(periodo, navOffset)}
              </span>

              <button
                onClick={() => setNavOffset(v => v + 1)}
                disabled={navOffset >= 0}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <ChevronRight className="w-4 h-4 text-white/60" />
              </button>
            </div>
          )}

          {/* Campos de data para personalizado */}
          {mostrarCustom && (
            <div className="flex gap-3 pt-1">
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1">De</label>
                <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-white/40 mb-1">Até</label>
                <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-white focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
          )}
        </div>

        {/* Estado vazio */}
        {loading && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-white/30 text-sm">Carregando dados...</p>
          </div>
        )}

        {semDados && (
          <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <BarChart3 className="w-12 h-12 text-white/15 mx-auto mb-3" />
            <p className="text-white/40 font-medium">Nenhum dado ainda</p>
            <p className="text-white/25 text-sm mt-1">Adicione serviços e despesas para ver seus relatórios aqui</p>
          </div>
        )}

        {!loading && !semDados && (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 gap-3">

              {/* Modo normal: mostra faturamento, lucro, ticket, serviços */}
              {!somenteDespesasPessoais && (
                <>
                  {/* Faturamento — destaque full width */}
                  <div className="col-span-2 rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.06) 100%)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-green-400/70 text-xs font-semibold uppercase tracking-wide">Faturamento</p>
                        <p className="text-3xl font-bold text-white mt-0.5">{formatarMoeda(kpis.faturamento)}</p>
                        <p className="text-white/35 text-xs mt-1">{kpis.qtd} serviço{kpis.qtd !== 1 ? 's' : ''} no período</p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                    </div>
                    {evolucao.length > 1 && evolucao.some(e => e.receita > 0) && (
                      <div className="mt-3">
                        <LineChart pontos={evolucao.map(e => e.receita)} cor="#22c55e" height={55} />
                        <div className="flex justify-between text-[10px] text-white/25 mt-1">
                          {evolucao.map((e, i) => <span key={i}>{e.label}</span>)}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lucro */}
                  <div className="rounded-2xl p-4" style={{
                    background: kpis.lucro >= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    border: `1px solid ${kpis.lucro >= 0 ? 'rgba(34,197,94,0.18)' : 'rgba(239,68,68,0.18)'}`,
                  }}>
                    <p className={`text-xs font-semibold uppercase tracking-wide ${kpis.lucro >= 0 ? 'text-green-400/70' : 'text-red-400/70'}`}>Lucro</p>
                    <p className="text-xl font-bold text-white mt-1">{formatarMoeda(kpis.lucro)}</p>
                    <p className={`text-xs mt-1 font-semibold ${kpis.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {kpis.margem >= 0 ? '+' : ''}{kpis.margem.toFixed(1)}% margem
                    </p>
                  </div>

                  {/* Ticket médio */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-purple-400/70 text-xs font-semibold uppercase tracking-wide">Ticket Médio</p>
                      <Target className="w-4 h-4 text-purple-400/60" />
                    </div>
                    <p className="text-xl font-bold text-white">{formatarMoeda(kpis.ticket)}</p>
                    <p className="text-white/30 text-xs mt-1">por serviço</p>
                  </div>

                  {/* Serviços */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.18)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-blue-400/70 text-xs font-semibold uppercase tracking-wide">Serviços</p>
                      <Car className="w-4 h-4 text-blue-400/60" />
                    </div>
                    <p className="text-xl font-bold text-white">{kpis.qtd}</p>
                    <p className="text-white/30 text-xs mt-1">no período</p>
                  </div>
                </>
              )}

              {/* Despesas — sempre visível */}
              <div className={somenteDespesasPessoais ? 'col-span-2 rounded-2xl p-4' : 'rounded-2xl p-4'} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.18)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-red-400/70 text-xs font-semibold uppercase tracking-wide">
                    {somenteDespesasPessoais ? 'Total Despesas Pessoais' : 'Despesas'}
                  </p>
                  <TrendingDown className="w-4 h-4 text-red-400/60" />
                </div>
                <p className="text-xl font-bold text-white">{formatarMoeda(kpis.totalDespesas)}</p>
                <div className="mt-2"><MiniBarChart dados={evolucao.map(e => e.despesa)} cor="#f87171" /></div>
              </div>

              {/* Modo pessoal: qtd de lançamentos */}
              {somenteDespesasPessoais && (
                <div className="col-span-2 rounded-2xl p-4" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-purple-400/70 text-xs font-semibold uppercase tracking-wide">Lançamentos</p>
                    <UserCircle2 className="w-4 h-4 text-purple-400/60" />
                  </div>
                  <p className="text-xl font-bold text-white">{despesasFiltradas.length}</p>
                  <p className="text-white/30 text-xs mt-1">despesas pessoais no período</p>
                </div>
              )}
            </div>

            {/* Filtro multi-categoria */}
            {todasCatsDespesas.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => setMostrarFiltroCateg(v => !v)} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-green-400" />
                    <span className="text-white font-semibold text-sm">Filtrar por categoria</span>
                    {catsFiltro.length > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-green-500 text-white font-medium">{catsFiltro.length}</span>}
                  </div>
                  {mostrarFiltroCateg ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {mostrarFiltroCateg && (
                  <div className="px-4 pb-4 flex flex-wrap gap-2">
                    {todasCatsDespesas.map(cat => (
                      <button key={cat}
                        onClick={() => setCatsFiltro(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat])}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${catsFiltro.includes(cat) ? 'bg-green-500 text-white' : 'text-white/50 hover:text-white/80'}`}
                        style={!catsFiltro.includes(cat) ? { background: 'rgba(255,255,255,0.08)' } : {}}>
                        {catsFiltro.includes(cat) && <X className="w-3 h-3" />}{cat}
                      </button>
                    ))}
                    {catsFiltro.length > 0 && (
                      <button onClick={() => setCatsFiltro([])} className="px-3 py-1.5 rounded-full text-xs font-medium text-red-400" style={{ background: 'rgba(239,68,68,0.12)' }}>Limpar</button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Barras comparativas — movido para cima */}
            {dadosAgrupados.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold text-sm">Comparação por grupo</span>
                </div>
                <BarrasHorizontais items={dadosAgrupados.map(d => ({ nome: d.nome, valor: d.valor }))} />
              </div>
            )}

            {/* Distribuição por categoria */}
            <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold text-sm">Distribuição</span>
              </div>
              {/* Seletor de agrupamento */}
              <div className="flex gap-2 mb-4">
                {agrupamentos.map(ag => {
                  const Icon = ag.icon;
                  return (
                    <button key={ag.value} onClick={() => setAgrupamento(ag.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex-1 justify-center ${agrupamento === ag.value ? 'bg-green-500 text-white' : 'text-white/40 hover:text-white/70'}`}
                      style={agrupamento !== ag.value ? { background: 'rgba(255,255,255,0.07)' } : {}}>
                      <Icon className="w-3.5 h-3.5" />{ag.label}
                    </button>
                  );
                })}
              </div>
              {dadosAgrupados.length > 0 ? (
                <PizzaChart fatias={dadosAgrupados.map(d => ({ nome: d.nome, valor: d.valor }))} />
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <Layers className="w-8 h-8 text-white/15 mb-2" />
                  <p className="text-white/30 text-sm">
                    {agrupamento === 'prestadores' && 'Adicione categorias de Prestador às despesas para ver aqui'}
                    {agrupamento === 'oficinas' && 'Adicione categorias de Oficina às despesas para ver aqui'}
                    {agrupamento === 'categorias' && 'Adicione categorias às despesas para ver a distribuição'}
                  </p>
                </div>
              )}
            </div>

            {/* Gráfico de evolução */}
            {evolucao.length >= 1 && (evolucao.some(e => e.receita > 0) || evolucao.some(e => e.despesa > 0)) && (
              <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold text-sm">Evolução no período</span>
                </div>
                <div className="flex gap-4 mb-4 flex-wrap">
                  {[{ cor: '#3b82f6', label: 'Receita' }, { cor: '#ef4444', label: 'Despesa' }, { cor: '#15803d', label: 'Lucro' }].map(l => (
                    <div key={l.label} className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: l.cor }} />
                      <span className="text-xs text-white/40">{l.label}</span>
                    </div>
                  ))}
                </div>
                <BarGroupChart dados={evolucao} />
                <div className="flex justify-between text-[10px] text-white/20 mt-2">
                  {evolucao.map((e, i) => <span key={i}>{e.label}</span>)}
                </div>
              </div>
            )}

            {/* Seções colapsáveis */}

            {/* Categorias de despesa */}
            {rankingCats.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => toggleSecao('cats')} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-yellow-400" />
                    <span className="text-white font-semibold text-sm">Categorias de Despesa</span>
                    <span className="text-white/30 text-xs">({rankingCats.length})</span>
                  </div>
                  {secaoAberta === 'cats' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {secaoAberta === 'cats' && (
                  <div className="px-4 pb-4 space-y-1">
                    {rankingCats.map((c, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{ background: `${PIZZA_COLORS[i % PIZZA_COLORS.length]}25`, color: PIZZA_COLORS[i % PIZZA_COLORS.length] }}>
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{c.nome}</p>
                          <p className="text-white/35 text-xs">{c.freq} ocorrência{c.freq !== 1 ? 's' : ''}</p>
                        </div>
                        <p className="text-red-400 font-semibold text-sm shrink-0">{formatarMoeda(c.total)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Top Clientes — oculto no modo pessoal */}
            {!somenteDespesasPessoais && topClientes.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => toggleSecao('clientes')} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-400" />
                    <span className="text-white font-semibold text-sm">Top Clientes</span>
                    <span className="text-white/30 text-xs">({topClientes.length})</span>
                  </div>
                  {secaoAberta === 'clientes' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {secaoAberta === 'clientes' && (
                  <div className="px-4 pb-4">
                    <BarrasHorizontais
                      items={topClientes.map(c => ({ nome: c.nome, valor: c.valor, extra: `${formatarMoeda(c.valor)} · ${c.qtd}x` }))}
                      cor="#3b82f6"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Formas de pagamento — oculto no modo pessoal */}
            {!somenteDespesasPessoais && formasPagamento.length > 0 && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => toggleSecao('pagto')} className="w-full flex items-center justify-between p-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-purple-400" />
                    <span className="text-white font-semibold text-sm">Formas de Pagamento</span>
                  </div>
                  {secaoAberta === 'pagto' ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
                </button>
                {secaoAberta === 'pagto' && (
                  <div className="px-4 pb-4">
                    <PizzaChart fatias={formasPagamento} />
                  </div>
                )}
              </div>
            )}

            {/* Indicadores — oculto no modo pessoal */}
            {!somenteDespesasPessoais && <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-green-400" />
                <span className="text-white font-semibold text-sm">Indicadores</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Margem de lucro', value: `${kpis.margem.toFixed(1)}%`, ok: kpis.margem >= 0 },
                  { label: 'Custo/serviço', value: kpis.qtd > 0 ? formatarMoeda(kpis.totalDespesas / kpis.qtd) : '—', ok: true },
                  { label: 'Taxa de despesas', value: kpis.faturamento > 0 ? `${((kpis.totalDespesas / kpis.faturamento) * 100).toFixed(1)}%` : '—', ok: true },
                  { label: 'Status geral', value: kpis.lucro >= 0 ? 'Positivo' : 'Negativo', ok: kpis.lucro >= 0 },
                ].map((ind, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <p className="text-white/35 text-xs mb-1">{ind.label}</p>
                    <p className={`font-bold text-base ${ind.ok ? 'text-green-400' : 'text-red-400'}`}>{ind.value}</p>
                  </div>
                ))}
              </div>
            </div>}
          </>
        )}
      </div>

      {/* Painel Controle — abre ao clicar no botão da navbar */}
      {painelControleAberto && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setPainelControleAberto(false)}
        />
      )}
      <div
        className="fixed bottom-20 left-1/2 z-50 w-80 transition-all duration-300"
        style={{
          opacity: painelControleAberto ? 1 : 0,
          transform: `translateX(-50%) translateY(${painelControleAberto ? '0' : '16px'})`,
          pointerEvents: painelControleAberto ? 'auto' : 'none',
        }}
      >
        <div
          className="rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(160deg, #0a2016 0%, #112b1c 100%)',
            border: '1px solid rgba(34,197,94,0.25)',
            boxShadow: '0 0 40px rgba(34,197,94,0.15), 0 20px 60px rgba(0,0,0,0.6)',
          }}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between px-5 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <SlidersHorizontal className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-white font-semibold text-sm tracking-wide">Controle</span>
            </div>
            <button
              onClick={() => setPainelControleAberto(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              <X className="w-3.5 h-3.5 text-white/50" />
            </button>
          </div>

          {/* Opções — toggles */}
          <div className="px-4 py-3 space-y-2">
            {/* Toggle: Somar despesas pessoais */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(168,85,247,0.18)' }}>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-none">Somar despesas pessoais</p>
                  <p className="text-white/35 text-xs mt-1">
                    {incluirDespesasPessoais ? 'Incluídas nos cálculos' : 'Não incluídas nos cálculos'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIncluirDespesasPessoais(v => !v)}
                className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ml-3"
                style={{ background: incluirDespesasPessoais ? '#a855f7' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
                  style={{ transform: incluirDespesasPessoais ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* Toggle: Somar apenas pendentes */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(251,191,36,0.18)' }}>
                  <TrendingDown className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-none">Somar apenas pendentes</p>
                  <p className="text-white/35 text-xs mt-1">
                    {somentePendentes ? 'Só serviços pendentes' : 'Todos os serviços'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSomentePendentes(v => !v); if (!somentePendentes) setSomenteConcluidos(false); }}
                className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ml-3"
                style={{ background: somentePendentes ? '#f59e0b' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
                  style={{ transform: somentePendentes ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* Toggle: Somar apenas concluídos/pagos */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.18)' }}>
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-none">Somar apenas concluídos</p>
                  <p className="text-white/35 text-xs mt-1">
                    {somenteConcluidos ? 'Só serviços pagos/finalizados' : 'Todos os serviços'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setSomenteConcluidos(v => !v); if (!somenteConcluidos) setSomentePendentes(false); }}
                className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ml-3"
                style={{ background: somenteConcluidos ? '#22c55e' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
                  style={{ transform: somenteConcluidos ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </button>
            </div>

            {/* Toggle: Apenas Despesas Pessoais (Interruptor) */}
            <div
              className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all"
              style={{
                background: somenteDespesasPessoais ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.05)',
                border: somenteDespesasPessoais ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: somenteDespesasPessoais ? 'rgba(139,92,246,0.25)' : 'rgba(139,92,246,0.15)' }}>
                  <UserCircle2 className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium leading-none">Apenas despesas pessoais</p>
                  <p className="text-white/35 text-xs mt-1">
                    {somenteDespesasPessoais ? 'Exibindo só anotações pessoais' : 'Inclui todos os tipos'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSomenteDespesasPessoais(v => !v)}
                className="relative w-12 h-6 rounded-full transition-all duration-300 focus:outline-none shrink-0 ml-3"
                style={{ background: somenteDespesasPessoais ? '#8b5cf6' : 'rgba(255,255,255,0.12)' }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300"
                  style={{ transform: somenteDespesasPessoais ? 'translateX(24px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          </div>

          {/* Rodapé decorativo */}
          <div className="h-1 mx-4 mb-4 rounded-full" style={{ background: 'rgba(34,197,94,0.15)' }} />
        </div>
      </div>
    </div>
  );
}
