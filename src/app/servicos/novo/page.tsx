"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useServicos } from '@/hooks/useServicos';
import { StatusServico, CategoriaServico } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Calculator, Camera, X, Trash2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { formatarMoeda } from '@/lib/storage';
import { Button } from '@/components/ui/button';

export default function NovoServicoPage() {
  const router = useRouter();
  const { adicionarServico } = useServicos();
  
  const [formData, setFormData] = useState({
    data_servico: new Date().toISOString().split('T')[0],
    status: 'Orçamento' as StatusServico,
    valor_cobrado: '',
    nome_veiculo: '',
    cliente_nome: '',
    telefone_cliente: '',
    carro_marca: '',
    carro_modelo: '',
    carro_ano: '',
    carro_placa: '',
    cor_original: '',
    servico_realizado: '',
    categoria_servico: 'Pintura geral' as CategoriaServico,
    custo_materiais: '',
    custo_terceiros: '',
    outras_despesas: '',
    observacoes: '',
  });

  // Estados para fotos
  const [fotos, setFotos] = useState<string[]>([]);
  const [mostrarOpcoesFoto, setMostrarOpcoesFoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Calcular lucro líquido
  const calcularLucro = () => {
    const valor = parseFloat(formData.valor_cobrado) || 0;
    const materiais = parseFloat(formData.custo_materiais) || 0;
    const terceiros = parseFloat(formData.custo_terceiros) || 0;
    const outras = parseFloat(formData.outras_despesas) || 0;
    return valor - materiais - terceiros - outras;
  };

  const lucroLiquido = calcularLucro();

  // Funções para gerenciar fotos
  const handleAdicionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const novaFoto = reader.result as string;
      setFotos([...fotos, novaFoto]);
    };

    reader.readAsDataURL(file);
    setMostrarOpcoesFoto(false);
    
    // Limpar o input para permitir selecionar a mesma foto novamente
    e.target.value = '';
  };

  const handleRemoverFoto = (index: number) => {
    const novasFotos = fotos.filter((_, i) => i !== index);
    setFotos(novasFotos);
  };

  const abrirGaleria = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    setMostrarOpcoesFoto(false);
  };

  const abrirCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
    setMostrarOpcoesFoto(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome_veiculo || !formData.valor_cobrado) {
      alert('Preencha os campos obrigatórios: Valor da Receita e Nome do Veículo');
      return;
    }

    adicionarServico({
      data_servico: formData.data_servico,
      status: formData.status,
      nome_veiculo: formData.nome_veiculo,
      cliente_nome: formData.cliente_nome,
      telefone_cliente: formData.telefone_cliente,
      carro_marca: formData.carro_marca,
      carro_modelo: formData.carro_modelo,
      carro_ano: parseInt(formData.carro_ano) || 0,
      carro_placa: formData.carro_placa,
      cor_original: formData.cor_original,
      servico_descricao: formData.servico_realizado,
      forma_pagamento: 'Dinheiro', // Valor padrão
      valor_cobrado: parseFloat(formData.valor_cobrado),
      custo_materiais: parseFloat(formData.custo_materiais) || 0,
      custo_terceiros: parseFloat(formData.custo_terceiros) || 0,
      outras_despesas_vinculadas: parseFloat(formData.outras_despesas) || 0,
      observacoes: formData.observacoes,
      fotos: fotos,
      foto_perfil_url: fotos.length > 0 ? fotos[0] : undefined,
    });

    router.push('/servicos');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/servicos"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Serviços
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Novo Serviço</h1>
          <p className="text-gray-600 mt-1">Registre um novo trabalho de pintura</p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Valor da Receita - Destaque no topo */}
          <div className="bg-emerald-500 rounded-2xl p-6 shadow-lg text-white">
            <label className="block text-sm font-medium mb-2 text-emerald-50">
              Valor da Receita (R$) *
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={formData.valor_cobrado}
              onChange={(e) => setFormData({ ...formData, valor_cobrado: e.target.value })}
              required
              className="bg-white text-gray-900 border-0 text-2xl font-bold h-14"
            />
            <p className="text-xs text-emerald-100 mt-2">
              Clique para editar o valor
            </p>
          </div>

          {/* Nome do Veículo - Logo abaixo do valor */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Veículo *
            </label>
            <Input
              type="text"
              placeholder="Digite o nome do veículo..."
              value={formData.nome_veiculo}
              onChange={(e) => setFormData({ ...formData, nome_veiculo: e.target.value })}
              required
              className="bg-white border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-2">
              Este será o título principal do serviço na lista
            </p>
          </div>

          {/* Informações Básicas - Fundo azul transparente leve */}
          <div className="bg-blue-500/10 rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Informações Básicas</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data do Serviço *
                </label>
                <Input
                  type="date"
                  value={formData.data_servico}
                  onChange={(e) => setFormData({ ...formData, data_servico: e.target.value })}
                  required
                  className="bg-white border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as StatusServico })}
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
                  Nome do Cliente
                </label>
                <Input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={formData.cliente_nome}
                  onChange={(e) => setFormData({ ...formData, cliente_nome: e.target.value })}
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
                  value={formData.telefone_cliente}
                  onChange={(e) => setFormData({ ...formData, telefone_cliente: e.target.value })}
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
                  Marca
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Chevrolet"
                  value={formData.carro_marca}
                  onChange={(e) => setFormData({ ...formData, carro_marca: e.target.value })}
                  className="bg-white border-gray-300"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo
                </label>
                <Input
                  type="text"
                  placeholder="Ex: Onix"
                  value={formData.carro_modelo}
                  onChange={(e) => setFormData({ ...formData, carro_modelo: e.target.value })}
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
                  value={formData.carro_ano}
                  onChange={(e) => setFormData({ ...formData, carro_ano: e.target.value })}
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
                  value={formData.carro_placa}
                  onChange={(e) => setFormData({ ...formData, carro_placa: e.target.value.toUpperCase() })}
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
                  value={formData.cor_original}
                  onChange={(e) => setFormData({ ...formData, cor_original: e.target.value })}
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
                value={formData.categoria_servico}
                onValueChange={(value) => setFormData({ ...formData, categoria_servico: value as CategoriaServico })}
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
                value={formData.servico_realizado}
                onChange={(e) => setFormData({ ...formData, servico_realizado: e.target.value })}
                rows={3}
                className="bg-white border-gray-300"
              />
            </div>
          </div>

          {/* Valores Financeiros */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-semibold text-gray-800">Custos e Despesas</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custo de Materiais (R$)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.custo_materiais}
                  onChange={(e) => setFormData({ ...formData, custo_materiais: e.target.value })}
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
                  value={formData.custo_terceiros}
                  onChange={(e) => setFormData({ ...formData, custo_terceiros: e.target.value })}
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
                  value={formData.outras_despesas}
                  onChange={(e) => setFormData({ ...formData, outras_despesas: e.target.value })}
                  className="bg-white border-gray-300"
                />
              </div>
            </div>

            {/* Cálculo do Lucro */}
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Lucro Líquido Estimado</span>
                <span className={`text-2xl font-bold ${lucroLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatarMoeda(lucroLiquido)}
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Valor cobrado - (Materiais + Terceiros + Outras despesas)
              </p>
            </div>
          </div>

          {/* Seção de Fotos */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">Fotos do Serviço</h2>
              <Button
                type="button"
                onClick={() => setMostrarOpcoesFoto(!mostrarOpcoesFoto)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Anexar Fotos
              </Button>
            </div>

            {/* Opções de adicionar foto */}
            {mostrarOpcoesFoto && (
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                <Button
                  type="button"
                  onClick={abrirCamera}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg min-h-[52px]"
                >
                  <Camera className="w-5 h-5" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Tirar foto</p>
                    <p className="text-xs text-emerald-100">Abrir câmera do celular</p>
                  </div>
                </Button>

                <Button
                  type="button"
                  onClick={abrirGaleria}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg min-h-[52px]"
                >
                  <ImageIcon className="w-5 h-5" />
                  <div className="text-left flex-1">
                    <p className="font-medium">Escolher da galeria</p>
                    <p className="text-xs text-blue-100">Selecionar foto existente</p>
                  </div>
                </Button>
              </div>
            )}

            {/* Inputs ocultos mas acessíveis */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdicionarFoto}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              aria-hidden="true"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleAdicionarFoto}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              aria-hidden="true"
            />

            {fotos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {fotos.map((foto, index) => (
                  <div key={index} className="relative aspect-square group">
                    <img
                      src={foto}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="destructive"
                      className="absolute top-1 right-1 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoverFoto(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {fotos.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhuma foto adicionada ainda
              </p>
            )}
          </div>

          {/* Observações - Fundo roxo transparente leve */}
          <div className="bg-purple-500/5 rounded-2xl p-6 shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-lg font-semibold text-gray-800">Observações</h2>
            
            <div>
              <Textarea
                placeholder="Anotações gerais sobre este serviço..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
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
              Salvar Serviço
            </button>
            <Link
              href="/servicos"
              className="px-6 py-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
