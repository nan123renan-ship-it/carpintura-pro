"use client";

import { useState, useMemo, useEffect } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { FiltrosPeriodo } from '@/lib/types';
import { formatarMoeda } from '@/lib/storage';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car, 
  AlertCircle,
  PieChart,
  Plus,
  Home,
  FileText,
  Clock,
  CheckCircle2,
  Calendar,
  Filter,
  UserCircle,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NovaReceitaModal } from '@/components/custom/nova-receita-modal';
import { DateRangePicker } from '@/components/custom/date-range-picker';
import { Onboarding } from '@/components/custom/onboarding';
import { Servico } from '@/lib/types';
import { format, startOfMonth, endOfMonth, isSameMonth, isSameYear, addMonths, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DateRange {
  from: Date;
  to: Date;
}

interface UserProfile {
  nomeUsuario: string;
  tipoPerfil: string;
  onboardingConcluido: boolean;
}

type PeriodoTipo = 'mes' | 'personalizado';

export default function Dashboard() {
  const router = useRouter();
  const { servicos, filtrarServicos } = useServicos();
  const { despesas, filtrarDespesas, calcularTotalDespesas } = useDespesas();
  
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalReceitaAberto, setModalReceitaAberto] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [tipoModal, setTipoModal] = useState<'receita' | 'calculadora'>('receita');
  const [saudacao, setSaudacao] = useState('');
  const [mostrarOnboarding, setMostrarOnboarding] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  // Estado do período selecionado (padrão: mês atual)
  const [dateRange, setDateRange] = useState<DateRange>(() => {
    const now = new Date();
    return {
      from: startOfMonth(now),
      to: endOfMonth(now)
    };
  });

  // Estado para controlar o tipo de período ativo
  const [periodoAtivo, setPeriodoAtivo] = useState<PeriodoTipo>('mes');
  
  // Estado para o mês de referência (usado na navegação)
  const [mesReferencia, setMesReferencia] = useState<Date>(new Date());

  // Verificar onboarding e carregar perfil do usuário
  useEffect(() => {
    const profileData = localStorage.getItem('userProfile');
    
    if (profileData) {
      const profile: UserProfile = JSON.parse(profileData);
      if (profile.onboardingConcluido) {
        setUserProfile(profile);
        setMostrarOnboarding(false);
      } else {
        setMostrarOnboarding(true);
      }
    } else {
      setMostrarOnboarding(true);
    }
  }, []);

  // Obter saudação baseada no horário - apenas no cliente
  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setSaudacao('Bom dia');
    else if (hora < 18) setSaudacao('Boa tarde');
    else setSaudacao('Boa noite');
  }, []);

  // Handler para completar onboarding
  const handleOnboardingComplete = (nome: string, perfil: string) => {
    const profile: UserProfile = {
      nomeUsuario: nome,
      tipoPerfil: perfil,
      onboardingConcluido: true
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profile));
    setUserProfile(profile);
    setMostrarOnboarding(false);
  };

  // Função para ir para seleção de perfil
  const irParaSelecaoPerfil = () => {
    setMostrarOnboarding(true);
  };

  // Função para navegar entre meses
  const voltarMes = () => {
    const novoMes = subMonths(mesReferencia, 1);
    setMesReferencia(novoMes);
    setDateRange({
      from: startOfMonth(novoMes),
      to: endOfMonth(novoMes)
    });
    setPeriodoAtivo('mes');
  };

  const avancarMes = () => {
    const novoMes = addMonths(mesReferencia, 1);
    setMesReferencia(novoMes);
    setDateRange({
      from: startOfMonth(novoMes),
      to: endOfMonth(novoMes)
    });
    setPeriodoAtivo('mes');
  };

  // Função para abrir período personalizado
  const abrirPeriodoPersonalizado = () => {
    setDatePickerOpen(true);
  };

  // Formatar o texto do período selecionado
  const getPeriodText = () => {
    if (periodoAtivo === 'personalizado') {
      const { from, to } = dateRange;
      if (isSameMonth(from, to) && isSameYear(from, to)) {
        return `${format(from, 'dd', { locale: ptBR })}–${format(to, 'dd MMM yyyy', { locale: ptBR })}`;
      }
      return `${format(from, 'dd/MM/yy', { locale: ptBR })} – ${format(to, 'dd/MM/yy', { locale: ptBR })}`;
    }

    // Modo mês
    return format(mesReferencia, "MMMM 'de' yyyy", { locale: ptBR });
  };

  // Calcular dados do período selecionado
  const dadosPeriodo = useMemo(() => {
    // Filtrar serviços pelo período
    const servicosFiltrados = servicos.filter(s => {
      const dataServico = new Date(s.data_servico);
      return dataServico >= dateRange.from && dataServico <= dateRange.to;
    });
    
    // Filtrar despesas pelo período - CORRIGIDO: usar data_despesa
    const despesasFiltradas = despesas.filter(d => {
      const dataDespesa = new Date(d.data_despesa);
      return dataDespesa >= dateRange.from && dataDespesa <= dateRange.to;
    });
    
    // Receitas: apenas serviços Finalizados ou Pagos
    const receitaPeriodo = servicosFiltrados
      .filter(s => s.status === 'Finalizado' || s.status === 'Pago')
      .reduce((acc, s) => acc + s.valor_cobrado, 0);
    
    // Despesas: TODAS as despesas do período
    const despesaPeriodo = despesasFiltradas.reduce((acc, d) => acc + d.valor, 0);
    
    // Lucro líquido do período
    const lucroLiquido = receitaPeriodo - despesaPeriodo;
    
    return {
      receitaPeriodo,
      despesaPeriodo,
      lucroLiquido,
    };
  }, [servicos, despesas, dateRange]);

  // Filtrar serviços pendentes: qualquer status que NÃO seja "Pago"
  // Ordenar pela data de anotação (data_servico) do mais antigo para o mais recente
  const servicosPendentes = useMemo(() => {
    return servicos
      .filter(s => s.status !== 'Pago')
      .sort((a, b) => new Date(a.data_servico).getTime() - new Date(b.data_servico).getTime());
  }, [servicos]);

  // Calcular total em aberto (serviços que NÃO estão "Pago")
  const totalEmAberto = useMemo(() => {
    return servicos
      .filter(s => s.status !== 'Pago')
      .reduce((acc, s) => acc + (s.valor_cobrado || s.valor_servico || 0), 0);
  }, [servicos]);

  // Função para ajustar tamanho do texto baseado no comprimento do valor
  const getTextSizeClass = (valor: number) => {
    const texto = formatarMoeda(valor);
    const comprimento = texto.length;
    
    if (comprimento <= 10) return 'text-xl md:text-2xl';
    if (comprimento <= 13) return 'text-lg md:text-xl';
    if (comprimento <= 16) return 'text-base md:text-lg';
    if (comprimento <= 19) return 'text-sm md:text-base';
    return 'text-xs md:text-sm';
  };

  // Função para ajustar tamanho do texto do painel de total em aberto
  const getTotalAbertoTextSize = (valor: number) => {
    const texto = formatarMoeda(valor);
    const comprimento = texto.length;
    
    if (comprimento <= 10) return 'text-3xl md:text-4xl';
    if (comprimento <= 13) return 'text-2xl md:text-3xl';
    if (comprimento <= 16) return 'text-xl md:text-2xl';
    if (comprimento <= 19) return 'text-lg md:text-xl';
    return 'text-base md:text-lg';
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Agendado':
        return 'bg-blue-100 text-blue-700';
      case 'Em Andamento':
        return 'bg-yellow-100 text-yellow-700';
      case 'Finalizado':
        return 'bg-green-100 text-green-700';
      case 'Pago':
        return 'bg-emerald-100 text-emerald-700';
      case 'Cancelado':
        return 'bg-red-100 text-red-700';
      case 'Orçamento':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Função para determinar cor do valor (verde para receita, vermelho para despesa)
  const getValorColor = (servico: Servico) => {
    const tipo = servico.tipo_lancamento || 'receita';
    return tipo === 'receita' ? 'text-emerald-600' : 'text-red-600';
  };

  // Se onboarding não foi concluído, mostrar tela de onboarding
  if (mostrarOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 md:pb-8">
      {/* Container responsivo: mobile com padding menor, desktop centralizado e maior */}
      <div className="w-full max-w-md mx-auto px-4 py-6 space-y-4 md:max-w-6xl md:px-8 md:py-10 md:space-y-6">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-1 md:text-5xl md:mb-2">
              {saudacao || 'Olá'}, {userProfile?.nomeUsuario || 'Usuário'}
            </h1>
          </div>

          {/* Botão para ir à seleção de perfil */}
          <button
            onClick={irParaSelecaoPerfil}
            className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center shadow-lg md:w-14 md:h-14"
            title="Alterar perfil"
          >
            <UserCircle className="w-6 h-6 text-white md:w-7 md:h-7" />
          </button>
        </div>

        {/* Sistema de Filtro de Período - ULTRA COMPACTO (FAIXA) */}
        <div className="bg-white rounded-xl shadow-md px-3 py-1.5 md:rounded-2xl md:px-4 md:py-2">
          <div className="flex items-center justify-between gap-2">
            {/* Seta esquerda */}
            <button
              onClick={voltarMes}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0 md:w-8 md:h-8"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700 md:w-5 md:h-5" />
            </button>

            {/* Nome do mês */}
            <div className="flex-1 text-center">
              <h2 className="text-sm font-bold text-gray-900 md:text-base capitalize truncate">
                {getPeriodText()}
              </h2>
            </div>

            {/* Seta direita */}
            <button
              onClick={avancarMes}
              className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center flex-shrink-0 md:w-8 md:h-8"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-gray-700 md:w-5 md:h-5" />
            </button>

            {/* Botão Personalizado */}
            <button
              onClick={abrirPeriodoPersonalizado}
              className={`px-3 py-1 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-1.5 flex-shrink-0 md:px-4 md:text-sm ${
                periodoAtivo === 'personalizado'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="hidden sm:inline">Personalizado</span>
              <span className="sm:hidden">Custom</span>
            </button>
          </div>
        </div>

        {/* Cards de Indicadores - Mobile: vertical / Desktop: grid 3 colunas */}
        <div className="space-y-4 md:grid md:grid-cols-3 md:gap-8 md:space-y-0">
          {/* Card 1 - Faturamento (AZUL) com efeito neon animado */}
          <div className="neon-panel-wrapper">
            <div className="neon-border neon-border-blue"></div>
            <div className="bg-[#1D63E8] rounded-2xl p-5 shadow-lg md:rounded-3xl md:p-8 relative z-10">
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-6">
                <div className="flex items-center gap-4 md:w-full md:gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#1450C4] flex items-center justify-center md:w-16 md:h-16 md:rounded-2xl">
                    <DollarSign className="w-6 h-6 text-white md:w-9 md:h-9" />
                  </div>
                  <span className="text-white font-semibold text-lg md:text-2xl">Faturamento</span>
                </div>
                <div className={`${getTextSizeClass(dadosPeriodo.receitaPeriodo)} font-bold text-white whitespace-nowrap md:w-full md:text-right md:mt-4`}>
                  {formatarMoeda(dadosPeriodo.receitaPeriodo)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 - Despesas (VERMELHO) com efeito neon animado */}
          <div className="neon-panel-wrapper">
            <div className="neon-border neon-border-red"></div>
            <div className="bg-[#F44336] rounded-2xl p-5 shadow-lg md:rounded-3xl md:p-8 relative z-10">
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-6">
                <div className="flex items-center gap-4 md:w-full md:gap-5">
                  <div className="w-12 h-12 rounded-xl bg-[#D32F2F] flex items-center justify-center md:w-16 md:h-16 md:rounded-2xl">
                    <TrendingDown className="w-6 h-6 text-white md:w-9 md:h-9" />
                  </div>
                  <span className="text-white font-semibold text-lg md:text-2xl">Despesas</span>
                </div>
                <div className={`${getTextSizeClass(dadosPeriodo.despesaPeriodo)} font-bold text-white whitespace-nowrap md:w-full md:text-right md:mt-4`}>
                  {formatarMoeda(dadosPeriodo.despesaPeriodo)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 - Lucro Líquido (VERDE) com efeito neon animado - MAIOR */}
          <div className="neon-panel-wrapper">
            <div className="neon-border neon-border-green"></div>
            <div className="bg-[#00B050] rounded-2xl p-6 shadow-xl md:rounded-3xl md:p-10 relative z-10">
              <div className="flex items-center justify-between md:flex-col md:items-start md:gap-6">
                <div className="flex items-center gap-4 md:w-full md:gap-5">
                  <div className="w-14 h-14 rounded-xl bg-[#009640] flex items-center justify-center md:w-20 md:h-20 md:rounded-2xl">
                    <TrendingUp className="w-7 h-7 text-white md:w-11 md:h-11" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-xl leading-tight md:text-3xl">Lucro</span>
                    <span className="text-white font-bold text-xl leading-tight md:text-3xl">Líquido</span>
                  </div>
                </div>
                <div className={`${getTextSizeClass(dadosPeriodo.lucroLiquido)} font-bold text-white whitespace-nowrap md:w-full md:text-right md:mt-4 md:!text-3xl`}>
                  {formatarMoeda(dadosPeriodo.lucroLiquido)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões Centrais - Mobile: 2 colunas / Desktop: 4 colunas */}
        <div className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4 md:gap-8 md:pt-4">
          <button
            onClick={() => {
              setTipoModal('receita');
              setModalReceitaAberto(true);
            }}
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3 md:rounded-3xl md:p-8 md:gap-5"
          >
            <div className="w-14 h-14 rounded-full bg-green-500/30 flex items-center justify-center md:w-20 md:h-20">
              <Plus className="w-7 h-7 text-green-600 md:w-10 md:h-10" />
            </div>
            <span className="text-sm font-semibold text-gray-800 md:text-lg">Novo Registro</span>
          </button>

          <Link 
            href="/despesas"
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3 md:rounded-3xl md:p-8 md:gap-5"
          >
            <div className="w-14 h-14 rounded-full bg-red-500/30 flex items-center justify-center md:w-20 md:h-20">
              <TrendingDown className="w-7 h-7 text-red-600 md:w-10 md:h-10" />
            </div>
            <span className="text-sm font-semibold text-gray-800 md:text-lg">Despesas</span>
          </Link>

          <Link 
            href="/servicos"
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3 md:rounded-3xl md:p-8 md:gap-5"
          >
            <div className="w-14 h-14 rounded-full bg-blue-500/30 flex items-center justify-center md:w-20 md:h-20">
              <Car className="w-7 h-7 text-blue-600 md:w-10 md:h-10" />
            </div>
            <span className="text-sm font-semibold text-gray-800 md:text-lg">Serviços</span>
          </Link>

          <Link 
            href="/relatorios"
            className="bg-white rounded-2xl p-5 shadow-md hover:shadow-lg transition-all flex flex-col items-center gap-3 md:rounded-3xl md:p-8 md:gap-5"
          >
            <div className="w-14 h-14 rounded-full bg-purple-500/30 flex items-center justify-center md:w-20 md:h-20">
              <PieChart className="w-7 h-7 text-purple-600 md:w-10 md:h-10" />
            </div>
            <span className="text-sm font-semibold text-gray-800 md:text-lg">Relatórios</span>
          </Link>
        </div>

        {/* Seção de Serviços Pendentes */}
        <div className="pt-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 md:text-2xl">Total Pendente</h2>
            <Link 
              href="/servicos"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium md:text-base"
            >
              Ver todos
            </Link>
          </div>

          {/* Painel de Total Pendente - LUXUOSO - ALTURA REDUZIDA */}
          <div className="relative bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-[2rem] p-3 shadow-2xl mb-6 overflow-hidden md:rounded-[2.5rem] md:p-4 border-4 border-yellow-300/30">
            {/* Efeitos de brilho e luz */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-orange-300/30 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-yellow-200/20 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Padrão decorativo de fundo */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-4 left-4 w-20 h-20 border-4 border-white rounded-full"></div>
              <div className="absolute bottom-4 right-4 w-16 h-16 border-4 border-white rounded-full"></div>
              <div className="absolute top-1/3 right-1/4 w-12 h-12 border-4 border-white rounded-full"></div>
            </div>
            
            {/* Conteúdo */}
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-white drop-shadow-lg animate-pulse md:w-5 md:h-5" />
                <p className="text-white font-black text-sm uppercase tracking-widest drop-shadow-lg md:text-base">
                  Total Pendente
                </p>
                <Sparkles className="w-4 h-4 text-white drop-shadow-lg animate-pulse md:w-5 md:h-5" />
              </div>
              
              <div className="text-center mb-2">
                <p className={`${getTotalAbertoTextSize(totalEmAberto)} font-black text-white drop-shadow-2xl break-words leading-tight`} style={{ textShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.3)' }}>
                  {formatarMoeda(totalEmAberto)}
                </p>
              </div>

              {/* Barra decorativa animada */}
              <div className="relative h-1.5 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
                <div className="h-full bg-white/50 rounded-full w-3/4 shadow-lg"></div>
              </div>

              {/* Detalhes extras */}
              <div className="mt-3 flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>

          {servicosPendentes.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 shadow-md text-center md:rounded-3xl md:p-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 md:w-20 md:h-20">
                <CheckCircle2 className="w-8 h-8 text-gray-400 md:w-10 md:h-10" />
              </div>
              <p className="text-gray-600 font-medium md:text-lg">Nenhum serviço pendente</p>
              <p className="text-gray-400 text-sm mt-1 md:text-base">Todos os serviços estão pagos</p>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {servicosPendentes.map((servico) => (
                <Link
                  key={servico.id}
                  href={`/servicos/${servico.id}`}
                  className="block bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all md:rounded-3xl md:p-6"
                >
                  <div className="flex items-center gap-4">
                    {/* Foto do serviço ou ícone padrão */}
                    {servico.fotos && servico.fotos.length > 0 ? (
                      <img
                        src={servico.fotos[0]}
                        alt="Foto do serviço"
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0 md:w-14 md:h-14"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 md:w-14 md:h-14">
                        <Car className="w-6 h-6 text-gray-400 md:w-7 md:h-7" />
                      </div>
                    )}

                    {/* Informações do serviço */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-base truncate md:text-lg">
                            {servico.nome_veiculo || servico.veiculo}
                          </h3>
                          <p className="text-sm text-gray-600 truncate md:text-base">
                            {servico.cliente}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${getStatusColor(servico.status)} md:text-sm md:px-4`}>
                          {servico.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <span className={`font-bold text-base md:text-lg ${getValorColor(servico)}`}>
                          {formatarMoeda(servico.valor_servico || servico.valor_cobrado)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Barra Inferior - Apenas mobile e APENAS quando não está em onboarding */}
      {!mostrarOnboarding && (
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 md:hidden">
          <div className="max-w-md mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Início */}
              <button 
                onClick={() => router.push('/')}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <Home className="w-6 h-6 text-green-500" />
                <span className="text-xs text-green-500 font-medium">Início</span>
              </button>

              {/* Serviços */}
              <button 
                onClick={() => router.push('/servicos')}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <Car className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">Serviços</span>
              </button>

              {/* Botão Flutuante + Nova Receita - POSICIONADO MAIS ACIMA */}
              <div className="flex-1 flex justify-center">
                <button
                  onClick={() => {
                    setTipoModal('receita');
                    setModalReceitaAberto(true);
                  }}
                  className="w-14 h-14 bg-green-500 rounded-full shadow-xl flex items-center justify-center -mt-10 hover:bg-green-600 transition-all hover:scale-110"
                >
                  <Plus className="w-7 h-7 text-white" />
                </button>
              </div>

              {/* Despesas */}
              <button 
                onClick={() => router.push('/despesas')}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <TrendingDown className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">Despesas</span>
              </button>

              {/* Relatórios */}
              <button 
                onClick={() => router.push('/relatorios')}
                className="flex flex-col items-center gap-1 flex-1"
              >
                <PieChart className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-400">Relatórios</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Receita */}
      <NovaReceitaModal 
        isOpen={modalReceitaAberto}
        onClose={() => setModalReceitaAberto(false)}
        tipoInicial={tipoModal}
      />

      {/* Modal Seletor de Período */}
      <DateRangePicker
        isOpen={datePickerOpen}
        onClose={() => setDatePickerOpen(false)}
        onSelect={(range) => {
          setDateRange(range);
          setPeriodoAtivo('personalizado');
        }}
        currentRange={dateRange}
      />

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        /* Efeito de luz neon que se move ao redor dos painéis */
        .neon-panel-wrapper {
          position: relative;
          border-radius: 1rem;
        }

        @media (min-width: 768px) {
          .neon-panel-wrapper {
            border-radius: 1.5rem;
          }
        }

        .neon-border {
          position: absolute;
          inset: -1.2px;
          border-radius: inherit;
          padding: 1.2px;
          background: conic-gradient(
            from var(--angle),
            transparent 0deg 270deg,
            var(--neon-color) 270deg 360deg
          );
          animation: rotate-border 30s linear infinite;
          z-index: 0;
        }

        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotate-border {
          0% {
            --angle: 0deg;
          }
          100% {
            --angle: 360deg;
          }
        }

        .neon-border-blue {
          --neon-color: #1E90FF;
          filter: drop-shadow(0 0 8px rgba(30, 144, 255, 0.6)) 
                  drop-shadow(0 0 12px rgba(30, 144, 255, 0.4));
        }

        .neon-border-red {
          --neon-color: #FF3366;
          filter: drop-shadow(0 0 8px rgba(255, 51, 102, 0.6)) 
                  drop-shadow(0 0 12px rgba(255, 51, 102, 0.4));
        }

        .neon-border-green {
          --neon-color: #00E676;
          filter: drop-shadow(0 0 8px rgba(0, 230, 118, 0.6)) 
                  drop-shadow(0 0 12px rgba(0, 230, 118, 0.4));
        }

        /* Respeitar preferências de movimento reduzido */
        @media (prefers-reduced-motion: reduce) {
          .neon-border {
            animation: none;
            background: linear-gradient(
              to right,
              transparent,
              var(--neon-color)
            );
          }
        }
      `}</style>
    </div>
  );
}
