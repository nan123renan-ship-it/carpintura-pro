"use client";

import { useState, useMemo } from 'react';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { FiltrosPeriodo } from '@/lib/types';
import { formatarMoeda } from '@/lib/storage';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Car,
  Target,
  Calendar,
  PieChart,
  BarChart3
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RelatoriosPage() {
  const { servicos, filtrarServicos, calcularResumo } = useServicos();
  const { despesas, filtrarDespesas, calcularTotalDespesas } = useDespesas();
  
  const [periodoSelecionado, setPeriodoSelecionado] = useState<FiltrosPeriodo>({ tipo: 'mes_atual' });

  // Calcular dados do período
  const dadosPeriodo = useMemo(() => {
    const servicosFiltrados = filtrarServicos({
      periodo: periodoSelecionado,
      status: "Todos",
    });
    
    const despesasFiltradas = filtrarDespesas({
      periodo: periodoSelecionado,
    });
    
    const totalDespesas = calcularTotalDespesas(despesasFiltradas);
    const resumo = calcularResumo(servicosFiltrados, totalDespesas);
    
    return {
      ...resumo,
      servicosFiltrados,
      despesasFiltradas,
    };
  }, [servicos, despesas, periodoSelecionado]);

  // Dados por mês (últimos 6 meses)
  const dadosPorMes = useMemo(() => {
    const meses: Record<string, { receitas: number; despesas: number; lucro: number; carros: number }> = {};
    
    // Últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const data = new Date();
      data.setMonth(data.getMonth() - i);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      const mesNome = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
      
      meses[mesNome] = { receitas: 0, despesas: 0, lucro: 0, carros: 0 };
      
      // Receitas
      servicos
        .filter(s => {
          const servicoMes = s.data_servico.substring(0, 7);
          return servicoMes === mesAno && (s.status === 'Finalizado' || s.status === 'Pago');
        })
        .forEach(s => {
          meses[mesNome].receitas += s.valor_cobrado;
          meses[mesNome].carros += 1;
        });
      
      // Despesas
      despesas
        .filter(d => d.data_despesa.substring(0, 7) === mesAno)
        .forEach(d => {
          meses[mesNome].despesas += d.valor;
        });
      
      // Custos dos serviços
      servicos
        .filter(s => s.data_servico.substring(0, 7) === mesAno)
        .forEach(s => {
          meses[mesNome].despesas += s.custo_materiais + s.custo_terceiros + s.outras_despesas;
        });
      
      meses[mesNome].lucro = meses[mesNome].receitas - meses[mesNome].despesas;
    }
    
    return Object.entries(meses).map(([mes, dados]) => ({ mes, ...dados }));
  }, [servicos, despesas]);

  // Dados por categoria de serviço
  const dadosPorCategoria = useMemo(() => {
    const categorias: Record<string, { quantidade: number; faturamento: number; lucro: number }> = {};
    
    dadosPeriodo.servicosFiltrados.forEach(s => {
      if (!categorias[s.categoria_servico]) {
        categorias[s.categoria_servico] = { quantidade: 0, faturamento: 0, lucro: 0 };
      }
      categorias[s.categoria_servico].quantidade += 1;
      categorias[s.categoria_servico].faturamento += s.valor_cobrado;
      categorias[s.categoria_servico].lucro += s.lucro_liquido;
    });
    
    return Object.entries(categorias)
      .map(([categoria, dados]) => ({ categoria, ...dados }))
      .sort((a, b) => b.faturamento - a.faturamento);
  }, [dadosPeriodo.servicosFiltrados]);

  const cards = [
    {
      titulo: 'Faturamento',
      valor: dadosPeriodo.faturamento,
      icon: DollarSign,
      cor: 'from-emerald-500 to-emerald-600',
      textoCor: 'text-emerald-600',
    },
    {
      titulo: 'Despesas',
      valor: dadosPeriodo.despesas,
      icon: TrendingDown,
      cor: 'from-red-500 to-red-600',
      textoCor: 'text-red-600',
    },
    {
      titulo: 'Lucro Líquido',
      valor: dadosPeriodo.lucro_liquido,
      icon: TrendingUp,
      cor: dadosPeriodo.lucro_liquido >= 0 ? 'from-blue-500 to-blue-600' : 'from-red-500 to-red-600',
      textoCor: dadosPeriodo.lucro_liquido >= 0 ? 'text-blue-600' : 'text-red-600',
    },
    {
      titulo: 'Carros Pintados',
      valor: dadosPeriodo.numero_servicos,
      icon: Car,
      cor: 'from-orange-500 to-orange-600',
      textoCor: 'text-orange-600',
      isCurrency: false,
    },
    {
      titulo: 'Ticket Médio',
      valor: dadosPeriodo.ticket_medio,
      icon: Target,
      cor: 'from-purple-500 to-purple-600',
      textoCor: 'text-purple-600',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise completa do seu desempenho</p>
        </div>

        {/* Filtro de Período */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-800">Período de Análise</h3>
          </div>
          <Select
            value={periodoSelecionado.tipo}
            onValueChange={(value) => setPeriodoSelecionado({ tipo: value as any })}
          >
            <SelectTrigger className="bg-white border-gray-300 max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mes_atual">Mês atual</SelectItem>
              <SelectItem value="mes_anterior">Mês anterior</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
              <SelectItem value="ultimos_6_meses">Últimos 6 meses</SelectItem>
              <SelectItem value="ano_atual">Ano atual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.titulo}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${card.cor}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">{card.titulo}</h3>
                <p className={`text-2xl font-bold ${card.textoCor}`}>
                  {card.isCurrency === false ? card.valor : formatarMoeda(card.valor)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Gráfico de Evolução Mensal */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h3 className="font-semibold text-gray-800">Evolução Mensal (Últimos 6 meses)</h3>
          </div>
          
          <div className="space-y-6">
            {dadosPorMes.map((mes) => {
              const maxValor = Math.max(
                ...dadosPorMes.map(m => Math.max(m.receitas, m.despesas))
              );
              
              return (
                <div key={mes.mes} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 capitalize">{mes.mes}</span>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-emerald-600 font-semibold">
                        {formatarMoeda(mes.receitas)}
                      </span>
                      <span className="text-red-600 font-semibold">
                        {formatarMoeda(mes.despesas)}
                      </span>
                      <span className={`font-semibold ${mes.lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatarMoeda(mes.lucro)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${(mes.receitas / maxValor) * 100}%` }}
                      >
                        {mes.receitas > 0 && (
                          <span className="text-xs text-white font-medium">Receitas</span>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                      <div
                        className="bg-red-500 h-full flex items-center justify-end pr-2"
                        style={{ width: `${(mes.despesas / maxValor) * 100}%` }}
                      >
                        {mes.despesas > 0 && (
                          <span className="text-xs text-white font-medium">Despesas</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-500 text-right">
                    {mes.carros} {mes.carros === 1 ? 'carro' : 'carros'} pintado{mes.carros !== 1 ? 's' : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Análise por Categoria */}
        {dadosPorCategoria.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-800">Desempenho por Categoria de Serviço</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Categoria</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Quantidade</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Faturamento</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Lucro</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Ticket Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dadosPorCategoria.map((cat) => (
                    <tr key={cat.categoria} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{cat.categoria}</td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">{cat.quantidade}</td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-emerald-600">
                        {formatarMoeda(cat.faturamento)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${cat.lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {formatarMoeda(cat.lucro)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatarMoeda(cat.faturamento / cat.quantidade)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Indicadores de Performance */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-6">Indicadores de Performance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Margem de Lucro</span>
                <span className="text-lg font-semibold text-gray-900">
                  {dadosPeriodo.faturamento > 0
                    ? `${((dadosPeriodo.lucro_liquido / dadosPeriodo.faturamento) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Custo por Serviço</span>
                <span className="text-lg font-semibold text-gray-900">
                  {dadosPeriodo.numero_servicos > 0
                    ? formatarMoeda(dadosPeriodo.despesas / dadosPeriodo.numero_servicos)
                    : formatarMoeda(0)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Lucro por Carro</span>
                <span className="text-lg font-semibold text-gray-900">
                  {dadosPeriodo.numero_servicos > 0
                    ? formatarMoeda(dadosPeriodo.lucro_liquido / dadosPeriodo.numero_servicos)
                    : formatarMoeda(0)}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Taxa de Despesas</span>
                <span className="text-lg font-semibold text-gray-900">
                  {dadosPeriodo.faturamento > 0
                    ? `${((dadosPeriodo.despesas / dadosPeriodo.faturamento) * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Média de Carros/Mês</span>
                <span className="text-lg font-semibold text-gray-900">
                  {(dadosPorMes.reduce((acc, m) => acc + m.carros, 0) / 6).toFixed(1)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-600">Status do Período</span>
                <span className={`text-lg font-semibold ${dadosPeriodo.lucro_liquido >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {dadosPeriodo.lucro_liquido >= 0 ? 'Positivo ✓' : 'Negativo ✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
