"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { StatusServico, TipoDespesa, FormaPagamento } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { formatarMoeda } from '@/lib/storage';

type TipoCadastro = 'receita' | 'despesa';

export default function CadastroPage() {
  const router = useRouter();
  const { adicionarServico } = useServicos();
  const { adicionarDespesa } = useDespesas();
  
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>('receita');
  
  // Form data para Receita (Serviço)
  const [formReceita, setFormReceita] = useState({
    data_servico: new Date().toISOString().split('T')[0],
    status: 'Orçamento' as StatusServico,
    cliente_nome: '',
    telefone_cliente: '',
    carro_marca: '',
    carro_modelo: '',
    carro_ano: '',
    carro_placa: '',
    cor_original: '',
    servico_descricao: '',
    categoria_servico: 'Pintura geral',
    valor_cobrado: '',
    custo_materiais: '',
    custo_terceiros: '',
    outras_despesas_vinculadas: '',
    forma_pagamento: 'Dinheiro' as FormaPagamento,
    observacoes: '',
  });

  // Form data para Despesa
  const [formDespesa, setFormDespesa] = useState({
    data_despesa: new Date().toISOString().split('T')[0],
    tipo_despesa: 'Tinta' as TipoDespesa,
    descricao: '',
    valor: '',
    relacionado_a_servico: false,
    observacoes: '',
  });

  // Calcular lucro líquido para receita
  const calcularLucro = () => {
    const valor = parseFloat(formReceita.valor_cobrado) || 0;
    const materiais = parseFloat(formReceita.custo_materiais) || 0;
    const terceiros = parseFloat(formReceita.custo_terceiros) || 0;
    const outras = parseFloat(formReceita.outras_despesas_vinculadas) || 0;
    return valor - materiais - terceiros - outras;
  };

  const lucroLiquido = calcularLucro();

  const handleSubmitReceita = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formReceita.cliente_nome || !formReceita.carro_marca || !formReceita.carro_modelo || !formReceita.valor_cobrado) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    adicionarServico({
      data_servico: formReceita.data_servico,
      status: formReceita.status,
      cliente_nome: formReceita.cliente_nome,
      telefone_cliente: formReceita.telefone_cliente,
      carro_marca: formReceita.carro_marca,
      carro_modelo: formReceita.carro_modelo,
      carro_ano: parseInt(formReceita.carro_ano) || 0,
      carro_placa: formReceita.carro_placa,
      cor_original: formReceita.cor_original,
      servico_descricao: formReceita.servico_descricao,
      categoria_id: formReceita.categoria_servico,
      valor_cobrado: parseFloat(formReceita.valor_cobrado),
      custo_materiais: parseFloat(formReceita.custo_materiais) || 0,
      custo_terceiros: parseFloat(formReceita.custo_terceiros) || 0,
      outras_despesas_vinculadas: parseFloat(formReceita.outras_despesas_vinculadas) || 0,
      forma_pagamento: formReceita.forma_pagamento,
      observacoes: formReceita.observacoes,
    });

    router.push('/');
  };

  const handleSubmitDespesa = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formDespesa.descricao || !formDespesa.valor) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    adicionarDespesa({
      data_despesa: formDespesa.data_despesa,
      tipo_despesa: formDespesa.tipo_despesa,
      descricao: formDespesa.descricao,
      valor: parseFloat(formDespesa.valor),
      relacionado_a_servico: formDespesa.relacionado_a_servico,
      observacoes: formDespesa.observacoes,
    });

    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Novo Registro</h1>
          <p className="text-gray-600 mt-1">Adicione uma receita ou despesa</p>
        </div>

        {/* Abas - Estilo Organize */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setTipoCadastro('receita')}
              className={`flex items-center justify-center gap-3 py-5 px-6 font-semibold transition-all ${
                tipoCadastro === 'receita'
                  ? 'bg-emerald-50 text-emerald-700 border-b-4 border-emerald-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span>Receita</span>
            </button>
            
            <button
              onClick={() => setTipoCadastro('despesa')}
              className={`flex items-center justify-center gap-3 py-5 px-6 font-semibold transition-all ${
                tipoCadastro === 'despesa'
                  ? 'bg-red-50 text-red-700 border-b-4 border-red-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <TrendingDown className="w-5 h-5" />
              <span>Despesa</span>
            </button>
          </div>
        </div>

        {/* Formulário de Receita */}
        {tipoCadastro === 'receita' && (
          <form onSubmit={handleSubmitReceita} className="space-y-6">
            
            {/* Informações Básicas */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Informações Básicas</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Serviço *
                  </label>
                  <Input
                    type="date"
                    value={formReceita.data_servico}
                    onChange={(e) => setFormReceita({ ...formReceita, data_servico: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <Select
                    value={formReceita.status}
                    onValueChange={(value) => setFormReceita({ ...formReceita, status: value as StatusServico })}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Orçamento">Orçamento</SelectItem>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Dados do Cliente */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Dados do Cliente</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Cliente *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={formReceita.cliente_nome}
                    onChange={(e) => setFormReceita({ ...formReceita, cliente_nome: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone
                  </label>
                  <Input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={formReceita.telefone_cliente}
                    onChange={(e) => setFormReceita({ ...formReceita, telefone_cliente: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Dados do Veículo */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Dados do Veículo</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Chevrolet"
                    value={formReceita.carro_marca}
                    onChange={(e) => setFormReceita({ ...formReceita, carro_marca: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo *
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Onix"
                    value={formReceita.carro_modelo}
                    onChange={(e) => setFormReceita({ ...formReceita, carro_modelo: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ano
                  </label>
                  <Input
                    type="number"
                    placeholder="2020"
                    value={formReceita.carro_ano}
                    onChange={(e) => setFormReceita({ ...formReceita, carro_ano: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placa
                  </label>
                  <Input
                    type="text"
                    placeholder="ABC-1234"
                    value={formReceita.carro_placa}
                    onChange={(e) => setFormReceita({ ...formReceita, carro_placa: e.target.value.toUpperCase() })}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Original
                  </label>
                  <Input
                    type="text"
                    placeholder="Ex: Prata"
                    value={formReceita.cor_original}
                    onChange={(e) => setFormReceita({ ...formReceita, cor_original: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>
            </div>

            {/* Detalhes do Serviço */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Detalhes do Serviço</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria do Serviço *
                </label>
                <Select
                  value={formReceita.categoria_servico}
                  onValueChange={(value) => setFormReceita({ ...formReceita, categoria_servico: value })}
                >
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pintura geral">Pintura geral</SelectItem>
                    <SelectItem value="Parachoque">Parachoque</SelectItem>
                    <SelectItem value="Porta">Porta</SelectItem>
                    <SelectItem value="Capô">Capô</SelectItem>
                    <SelectItem value="Teto">Teto</SelectItem>
                    <SelectItem value="Lateral">Lateral</SelectItem>
                    <SelectItem value="Retoque">Retoque</SelectItem>
                    <SelectItem value="Polimento">Polimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição do Serviço
                </label>
                <Textarea
                  placeholder="Ex: Pintura completa do para-choque dianteiro com correção de riscos"
                  value={formReceita.servico_descricao}
                  onChange={(e) => setFormReceita({ ...formReceita, servico_descricao: e.target.value })}
                  rows={3}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Valores Financeiros */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-800">Valores Financeiros</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Cobrado (R$) *
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formReceita.valor_cobrado}
                    onChange={(e) => setFormReceita({ ...formReceita, valor_cobrado: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Forma de Pagamento *
                  </label>
                  <Select
                    value={formReceita.forma_pagamento}
                    onValueChange={(value) => setFormReceita({ ...formReceita, forma_pagamento: value as FormaPagamento })}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Pix">Pix</SelectItem>
                      <SelectItem value="Cartão crédito">Cartão crédito</SelectItem>
                      <SelectItem value="Cartão débito">Cartão débito</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo de Materiais (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formReceita.custo_materiais}
                    onChange={(e) => setFormReceita({ ...formReceita, custo_materiais: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custo de Terceiros (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formReceita.custo_terceiros}
                    onChange={(e) => setFormReceita({ ...formReceita, custo_terceiros: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Outras Despesas (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={formReceita.outras_despesas_vinculadas}
                    onChange={(e) => setFormReceita({ ...formReceita, outras_despesas_vinculadas: e.target.value })}
                    className="bg-white border-gray-300"
                  />
                </div>
              </div>

              {/* Cálculo do Lucro */}
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-emerald-900">Lucro Líquido Estimado</span>
                  <span className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatarMoeda(lucroLiquido)}
                  </span>
                </div>
                <p className="text-xs text-emerald-700 mt-2">
                  Valor cobrado - (Materiais + Terceiros + Outras despesas)
                </p>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Observações</h2>
              
              <div>
                <Textarea
                  placeholder="Anotações gerais sobre este serviço..."
                  value={formReceita.observacoes}
                  onChange={(e) => setFormReceita({ ...formReceita, observacoes: e.target.value })}
                  rows={4}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-colors shadow-lg"
              >
                <Save className="w-5 h-5" />
                Salvar Receita
              </button>
              <Link
                href="/"
                className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        )}

        {/* Formulário de Despesa */}
        {tipoCadastro === 'despesa' && (
          <form onSubmit={handleSubmitDespesa} className="space-y-6">
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
              <h2 className="text-lg font-semibold text-gray-800">Informações da Despesa</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Despesa *
                  </label>
                  <Input
                    type="date"
                    value={formDespesa.data_despesa}
                    onChange={(e) => setFormDespesa({ ...formDespesa, data_despesa: e.target.value })}
                    required
                    className="bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Despesa *
                  </label>
                  <Select
                    value={formDespesa.tipo_despesa}
                    onValueChange={(value) => setFormDespesa({ ...formDespesa, tipo_despesa: value as TipoDespesa })}
                  >
                    <SelectTrigger className="bg-white border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tinta">Tinta</SelectItem>
                      <SelectItem value="Massa">Massa</SelectItem>
                      <SelectItem value="Lixa">Lixa</SelectItem>
                      <SelectItem value="Verniz">Verniz</SelectItem>
                      <SelectItem value="Compressor/Equipamentos">Compressor/Equipamentos</SelectItem>
                      <SelectItem value="EPI (máscara, luva, etc.)">EPI (máscara, luva, etc.)</SelectItem>
                      <SelectItem value="Luz/Água">Luz/Água</SelectItem>
                      <SelectItem value="Aluguel">Aluguel</SelectItem>
                      <SelectItem value="Transporte">Transporte</SelectItem>
                      <SelectItem value="Outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição *
                </label>
                <Input
                  type="text"
                  placeholder="Ex: 1 galão de tinta prata"
                  value={formDespesa.descricao}
                  onChange={(e) => setFormDespesa({ ...formDespesa, descricao: e.target.value })}
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formDespesa.valor}
                  onChange={(e) => setFormDespesa({ ...formDespesa, valor: e.target.value })}
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <Textarea
                  placeholder="Informações adicionais sobre esta despesa..."
                  value={formDespesa.observacoes}
                  onChange={(e) => setFormDespesa({ ...formDespesa, observacoes: e.target.value })}
                  rows={4}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg"
              >
                <Save className="w-5 h-5" />
                Salvar Despesa
              </button>
              <Link
                href="/"
                className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
