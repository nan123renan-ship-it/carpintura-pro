"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage, formatarMoeda, formatarData, sincronizarDespesasServico, removerDespesasServico } from '@/lib/storage';
import { Servico } from '@/lib/types';
import { 
  ArrowLeft, 
  Car, 
  Calendar, 
  Tag, 
  CreditCard, 
  FileText, 
  Camera,
  X,
  Trash2,
  ZoomIn,
  Edit2,
  Check,
  User,
  DollarSign,
  Copy,
  MoreVertical,
  Star,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DetalhesServicoPage() {
  const params = useParams();
  const router = useRouter();
  const [servico, setServico] = useState<Servico | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [mostrarOpcoesFoto, setMostrarOpcoesFoto] = useState(false);

  // Estados para edição inline
  const [editando, setEditando] = useState<string | null>(null);
  const [valorTemp, setValorTemp] = useState<any>('');

  // Estado para modal de edição mobile
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const [valorModal, setValorModal] = useState<any>('');

  useEffect(() => {
    const servicoEncontrado = storage.getServicos().find(s => s.id === params.id);
    if (servicoEncontrado) {
      setServico(servicoEncontrado);
      setFotos(servicoEncontrado.fotos || []);
    }
  }, [params.id]);

  const handleAdicionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onloadend = () => {
      const novaFoto = reader.result as string;
      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);

      // Se é a primeira foto, definir como foto de perfil automaticamente
      const atualizacao: Partial<Servico> = { fotos: novasFotos };
      if (fotos.length === 0) {
        atualizacao.foto_perfil_url = novaFoto;
      }

      // Atualizar no localStorage
      if (servico) {
        storage.updateServico(servico.id, atualizacao);
        setServico({ ...servico, ...atualizacao });
      }
    };

    reader.readAsDataURL(file);
    setMostrarOpcoesFoto(false);
    
    // Limpar o input para permitir selecionar a mesma foto novamente
    e.target.value = '';
  };

  const handleRemoverFoto = (index: number) => {
    const fotoRemovida = fotos[index];
    const novasFotos = fotos.filter((_, i) => i !== index);
    setFotos(novasFotos);

    // Atualizar no localStorage
    if (servico) {
      const atualizacao: Partial<Servico> = { fotos: novasFotos };
      
      // Se a foto removida era a foto de perfil
      if (servico.foto_perfil_url === fotoRemovida) {
        // Se ainda há fotos, a próxima mais antiga vira foto de perfil
        if (novasFotos.length > 0) {
          atualizacao.foto_perfil_url = novasFotos[0];
        } else {
          // Se não há mais fotos, remover foto de perfil
          atualizacao.foto_perfil_url = undefined;
        }
      }
      
      storage.updateServico(servico.id, atualizacao);
      setServico({ ...servico, ...atualizacao });
    }
  };

  const handleDefinirComoFotoPerfil = (foto: string) => {
    if (servico) {
      storage.updateServico(servico.id, { foto_perfil_url: foto });
      setServico({ ...servico, foto_perfil_url: foto });
    }
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

  // Função para abrir modal de edição (mobile-friendly)
  const abrirModalEdicao = (campo: string, valorAtual: any) => {
    setModalAberto(campo);
    setValorModal(valorAtual);
  };

  // Função para salvar edição do modal
  const salvarEdicaoModal = () => {
    if (!servico || !modalAberto) return;

    const atualizacao: Partial<Servico> = {};
    
    switch(modalAberto) {
      case 'nome_veiculo':
        atualizacao.nome_veiculo = valorModal;
        break;
      case 'cliente_nome':
        atualizacao.cliente_nome = valorModal;
        break;
      case 'carro_info':
        atualizacao.carro_marca = valorModal.marca;
        atualizacao.carro_modelo = valorModal.modelo;
        atualizacao.carro_ano = valorModal.ano;
        break;
      case 'carro_placa':
        atualizacao.carro_placa = valorModal;
        break;
      case 'valor_cobrado':
        atualizacao.valor_cobrado = parseFloat(valorModal) || 0;
        break;
      case 'status':
        atualizacao.status = valorModal;
        break;
      case 'data_servico':
        atualizacao.data_servico = valorModal;
        break;
      case 'servico_descricao':
        atualizacao.servico_descricao = valorModal;
        break;
      case 'forma_pagamento':
        atualizacao.forma_pagamento = valorModal;
        break;
      case 'observacoes':
        atualizacao.observacoes = valorModal;
        break;
      case 'custo_materiais':
        atualizacao.custo_materiais = parseFloat(valorModal) || 0;
        break;
      case 'custo_terceiros':
        atualizacao.custo_terceiros = parseFloat(valorModal) || 0;
        break;
      case 'outras_despesas_vinculadas':
        atualizacao.outras_despesas_vinculadas = parseFloat(valorModal) || 0;
        break;
    }

    // Atualizar serviço
    storage.updateServico(servico.id, atualizacao);
    const servicoAtualizado = { ...servico, ...atualizacao };
    setServico(servicoAtualizado);
    
    // Sincronizar despesas se algum custo foi alterado
    if (modalAberto === 'custo_materiais' || modalAberto === 'custo_terceiros' || modalAberto === 'outras_despesas_vinculadas') {
      sincronizarDespesasServico(servicoAtualizado);
    }
    
    setModalAberto(null);
    setValorModal('');
  };

  // Função para fechar modal
  const fecharModal = () => {
    setModalAberto(null);
    setValorModal('');
  };

  // Função para duplicar serviço
  const duplicarServico = () => {
    if (!servico) return;
    
    const novoServico = {
      ...servico,
      id: Date.now().toString(),
      nome_veiculo: `${servico.nome_veiculo} (Cópia)`,
      status: 'Orçamento'
    };
    
    storage.addServico(novoServico);
    router.push('/servicos');
  };

  // Função para excluir serviço
  const excluirServico = () => {
    if (!servico) return;
    
    if (confirm('Tem certeza que deseja excluir este serviço? As despesas vinculadas também serão removidas.')) {
      // Remover despesas vinculadas
      removerDespesasServico(servico.id);
      
      // Remover serviço
      storage.deleteServico(servico.id);
      router.push('/servicos');
    }
  };

  if (!servico) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Carregando...</p>
      </div>
    );
  }

  const custoTotal = servico.custo_materiais + servico.custo_terceiros + (servico.outras_despesas_vinculadas || 0);
  const lucro = servico.valor_cobrado - custoTotal;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header com ícone grande e valor */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={duplicarServico}
                className="text-gray-700 hover:bg-gray-100 min-h-[44px] min-w-[44px]"
              >
                <Copy className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={excluirServico}
                className="text-red-600 hover:bg-red-50 min-h-[44px] min-w-[44px]"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Ícone grande e valor */}
          <div className="flex items-center gap-4">
            {servico.foto_perfil_url ? (
              <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                <img 
                  src={servico.foto_perfil_url} 
                  alt="Foto do veículo" 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-xl font-semibold text-gray-900">
                {servico.nome_veiculo || `${servico.carro_marca} ${servico.carro_modelo}`}
              </h1>
              <p className="text-sm text-gray-500">
                {servico.cliente_nome}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${
                servico.status === 'Pago' || servico.status === 'Finalizado'
                  ? 'text-emerald-600'
                  : 'text-gray-400'
              }`}>
                {formatarMoeda(servico.valor_cobrado)}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                servico.status === 'Finalizado' || servico.status === 'Pago'
                  ? 'bg-emerald-100 text-emerald-700'
                  : servico.status === 'Em andamento'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {servico.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de informações editáveis */}
      <div className="max-w-4xl mx-auto">
        {/* Nome do Veículo */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('nome_veiculo', servico.nome_veiculo)}
        >
          <Car className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Nome do Veículo</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.nome_veiculo || 'Não informado'}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Cliente */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('cliente_nome', servico.cliente_nome)}
        >
          <User className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Cliente</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.cliente_nome}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Veículo */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('carro_info', {
            marca: servico.carro_marca,
            modelo: servico.carro_modelo,
            ano: servico.carro_ano
          })}
        >
          <Car className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Veículo</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.carro_marca} {servico.carro_modelo} {servico.carro_ano}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Placa */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('carro_placa', servico.carro_placa)}
        >
          <Tag className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Placa</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.carro_placa}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Valor */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('valor_cobrado', servico.valor_cobrado)}
        >
          <DollarSign className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Valor cobrado</p>
            <p className="text-base text-emerald-600 font-semibold">
              {formatarMoeda(servico.valor_cobrado)}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Data */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('data_servico', servico.data_servico)}
        >
          <Calendar className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Data do serviço</p>
            <p className="text-base text-gray-900 font-medium">
              {formatarData(servico.data_servico)}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Categoria */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('servico_descricao', servico.servico_descricao)}
        >
          <Tag className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Categoria</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.servico_descricao}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Forma de Pagamento */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('forma_pagamento', servico.forma_pagamento)}
        >
          <CreditCard className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Forma de pagamento</p>
            <p className="text-base text-gray-900 font-medium truncate">
              {servico.forma_pagamento}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Status */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('status', servico.status)}
        >
          <Tag className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Status</p>
            <p className="text-base text-gray-900 font-medium">
              {servico.status}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Observações */}
        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-start"
          onClick={() => abrirModalEdicao('observacoes', servico.observacoes)}
        >
          <FileText className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Observações</p>
            <p className="text-base text-gray-900 font-medium line-clamp-2">
              {servico.observacoes || 'Nenhuma observação'}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
        </div>

        {/* Custos */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <p className="text-sm font-semibold text-gray-700 mb-2">Custos</p>
        </div>

        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('custo_materiais', servico.custo_materiais)}
        >
          <DollarSign className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Materiais</p>
            <p className="text-base text-red-600 font-semibold">
              -{formatarMoeda(servico.custo_materiais)}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('custo_terceiros', servico.custo_terceiros)}
        >
          <DollarSign className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Terceiros</p>
            <p className="text-base text-red-600 font-semibold">
              -{formatarMoeda(servico.custo_terceiros)}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        <div 
          className="bg-white border-b border-gray-200 px-4 py-4 active:bg-gray-50 cursor-pointer min-h-[60px] flex items-center"
          onClick={() => abrirModalEdicao('outras_despesas_vinculadas', servico.outras_despesas_vinculadas || 0)}
        >
          <DollarSign className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-500 mb-0.5">Outras despesas</p>
            <p className="text-base text-red-600 font-semibold">
              -{formatarMoeda(servico.outras_despesas_vinculadas || 0)}
            </p>
          </div>
          <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>

        {/* Lucro */}
        <div className="bg-emerald-50 border-b border-gray-200 px-4 py-4 min-h-[60px] flex items-center">
          <DollarSign className="w-5 h-5 text-emerald-600 mr-3 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-0.5">Lucro líquido</p>
            <p className={`text-lg font-bold ${lucro >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatarMoeda(lucro)}
            </p>
          </div>
        </div>

        {/* Seção de Fotos */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Fotos do serviço</h3>
            <Button
              onClick={() => setMostrarOpcoesFoto(!mostrarOpcoesFoto)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-h-[44px]"
              size="sm"
            >
              <Camera className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>

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

          {/* Menu de opções de foto */}
          {mostrarOpcoesFoto && (
            <div className="mb-4 bg-gray-50 rounded-xl p-3 border border-gray-200 space-y-2">
              <button
                onClick={abrirCamera}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors min-h-[52px]"
              >
                <Camera className="w-5 h-5 text-emerald-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">Tirar foto</p>
                  <p className="text-xs text-gray-500">Abrir câmera do celular</p>
                </div>
              </button>
              <button
                onClick={abrirGaleria}
                className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors min-h-[52px]"
              >
                <ImageIcon className="w-5 h-5 text-blue-600" />
                <div className="text-left flex-1">
                  <p className="font-medium text-gray-900">Escolher da galeria</p>
                  <p className="text-xs text-gray-500">Selecionar foto existente</p>
                </div>
              </button>
            </div>
          )}

          {fotos.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
              <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-2">Nenhuma foto adicionada</p>
              <p className="text-sm text-gray-400">
                Clique em "Adicionar" para tirar fotos ou escolher da galeria
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {fotos.map((foto, index) => (
                <div key={index} className="relative aspect-square group">
                  <img
                    src={foto}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    onClick={() => setFotoSelecionada(foto)}
                  />
                  {/* Badge de foto de perfil */}
                  {servico.foto_perfil_url === foto && (
                    <div className="absolute top-1 left-1 bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                      <Star className="w-3 h-3 fill-white" />
                      Perfil
                    </div>
                  )}
                  {/* Botões de ação */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    {servico.foto_perfil_url !== foto && (
                      <Button
                        size="icon"
                        className="w-8 h-8 bg-blue-600 hover:bg-blue-700 shadow-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDefinirComoFotoPerfil(foto);
                        }}
                        title="Definir como foto de perfil"
                      >
                        <Star className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="destructive"
                      className="w-8 h-8 shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoverFoto(index);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edição (Mobile-Friendly) */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-lg rounded-t-2xl max-h-[90vh] overflow-y-auto">
            {/* Header do Modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalAberto === 'nome_veiculo' && 'Editar Nome do Veículo'}
                {modalAberto === 'cliente_nome' && 'Editar Cliente'}
                {modalAberto === 'carro_info' && 'Editar Veículo'}
                {modalAberto === 'carro_placa' && 'Editar Placa'}
                {modalAberto === 'valor_cobrado' && 'Editar Valor'}
                {modalAberto === 'data_servico' && 'Editar Data'}
                {modalAberto === 'servico_descricao' && 'Editar Categoria'}
                {modalAberto === 'forma_pagamento' && 'Editar Pagamento'}
                {modalAberto === 'status' && 'Editar Status'}
                {modalAberto === 'observacoes' && 'Editar Observações'}
                {modalAberto === 'custo_materiais' && 'Editar Custo Materiais'}
                {modalAberto === 'custo_terceiros' && 'Editar Custo Terceiros'}
                {modalAberto === 'outras_despesas_vinculadas' && 'Editar Outras Despesas'}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={fecharModal}
                className="min-h-[44px] min-w-[44px]"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 space-y-4">
              {modalAberto === 'nome_veiculo' && (
                <input
                  type="text"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  placeholder="Nome do veículo"
                  autoFocus
                />
              )}

              {modalAberto === 'cliente_nome' && (
                <input
                  type="text"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  placeholder="Nome do cliente"
                  autoFocus
                />
              )}

              {modalAberto === 'carro_info' && (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={valorModal.marca}
                    onChange={(e) => setValorModal({...valorModal, marca: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                    placeholder="Marca"
                  />
                  <input
                    type="text"
                    value={valorModal.modelo}
                    onChange={(e) => setValorModal({...valorModal, modelo: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                    placeholder="Modelo"
                  />
                  <input
                    type="text"
                    value={valorModal.ano}
                    onChange={(e) => setValorModal({...valorModal, ano: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                    placeholder="Ano"
                  />
                </div>
              )}

              {modalAberto === 'carro_placa' && (
                <input
                  type="text"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  placeholder="Placa"
                  autoFocus
                />
              )}

              {(modalAberto === 'valor_cobrado' || modalAberto === 'custo_materiais' || 
                modalAberto === 'custo_terceiros' || modalAberto === 'outras_despesas_vinculadas') && (
                <input
                  type="number"
                  step="0.01"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  placeholder="0,00"
                  autoFocus
                />
              )}

              {modalAberto === 'data_servico' && (
                <input
                  type="date"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  autoFocus
                />
              )}

              {modalAberto === 'servico_descricao' && (
                <input
                  type="text"
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  placeholder="Categoria do serviço"
                  autoFocus
                />
              )}

              {modalAberto === 'forma_pagamento' && (
                <select
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  autoFocus
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              )}

              {modalAberto === 'status' && (
                <select
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  autoFocus
                >
                  <option value="Orçamento">Orçamento</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Pago">Pago</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              )}

              {modalAberto === 'observacoes' && (
                <textarea
                  value={valorModal}
                  onChange={(e) => setValorModal(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[120px]"
                  placeholder="Observações sobre o serviço"
                  autoFocus
                />
              )}
            </div>

            {/* Botões do Modal */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
              <Button
                variant="outline"
                onClick={fecharModal}
                className="flex-1 min-h-[48px] text-base"
              >
                Cancelar
              </Button>
              <Button
                onClick={salvarEdicaoModal}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px] text-base"
              >
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Foto em Tela Cheia */}
      {fotoSelecionada && (
        <div
          className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4"
          onClick={() => setFotoSelecionada(null)}
        >
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]"
            onClick={() => setFotoSelecionada(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={fotoSelecionada}
            alt="Foto ampliada"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
