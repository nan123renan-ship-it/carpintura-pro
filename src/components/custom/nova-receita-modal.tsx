"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Check, ChevronRight, ThumbsUp, TrendingDown, Divide, Minus, Plus as PlusIcon, Percent, Upload, Calendar, DollarSign, User, Car as CarIcon, CreditCard, Package, FileText, Camera, CheckCircle2, Trash2, Eye, MoreVertical, Star, Tag, Search, Zap, Droplet, Lightbulb, Wrench, Home, Wifi, Phone, ShoppingCart, Utensils, Briefcase, FileCheck, Grid3x3 } from 'lucide-react';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { Servico, FormaPagamento, StatusServico, TipoDespesa } from '@/lib/types';

interface NovaReceitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipoInicial?: 'receita' | 'despesa' | 'calculadora';
}

interface Material {
  id: string;
  nome: string;
  valor: number;
}

interface OutraDespesa {
  id: string;
  descricao: string;
  valor: number;
}

interface Foto {
  id: string;
  url: string;
  nome: string;
  isPerfil?: boolean;
}

interface CategoriaPersonalizada {
  id: string;
  nome: string;
  icone: string;
  cor: string;
}

// Categorias de despesas predefinidas com ícones e cores
const CATEGORIAS_PREDEFINIDAS = [
  { id: 'transporte', nome: 'Transporte', icone: 'Car', cor: 'bg-blue-500' },
  { id: 'agua', nome: 'Água', icone: 'Droplet', cor: 'bg-cyan-500' },
  { id: 'luz', nome: 'Luz', icone: 'Lightbulb', cor: 'bg-yellow-500' },
  { id: 'material', nome: 'Material', icone: 'Package', cor: 'bg-orange-500' },
  { id: 'alimentacao', nome: 'Alimentação', icone: 'Utensils', cor: 'bg-green-500' },
  { id: 'aluguel', nome: 'Aluguel', icone: 'Home', cor: 'bg-purple-500' },
  { id: 'internet', nome: 'Internet', icone: 'Wifi', cor: 'bg-indigo-500' },
  { id: 'telefone', nome: 'Telefone', icone: 'Phone', cor: 'bg-pink-500' },
  { id: 'manutencao', nome: 'Manutenção', icone: 'Wrench', cor: 'bg-red-500' },
  { id: 'equipamentos', nome: 'Equipamentos', icone: 'ShoppingCart', cor: 'bg-teal-500' },
  { id: 'salarios', nome: 'Salários', icone: 'Briefcase', cor: 'bg-emerald-500' },
  { id: 'impostos', nome: 'Impostos', icone: 'FileCheck', cor: 'bg-amber-500' },
] as const;

// Mapeamento de ícones
const IconMap: Record<string, any> = {
  Car: CarIcon,
  Droplet,
  Lightbulb,
  Package,
  Utensils,
  Home,
  Wifi,
  Phone,
  Wrench,
  ShoppingCart,
  Briefcase,
  FileCheck,
  Tag,
};

export function NovaReceitaModal({ isOpen, onClose, tipoInicial = 'receita' }: NovaReceitaModalProps) {
  const { adicionarServico } = useServicos();
  const { addDespesa } = useDespesas();
  const [tipo, setTipo] = useState<'receita' | 'despesa' | 'calculadora'>(tipoInicial);
  const [valor, setValor] = useState('0,00');
  const [nomeVeiculo, setNomeVeiculo] = useState('');
  const [tecladoVisivel, setTecladoVisivel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados para calculadora
  const [displayCalc, setDisplayCalc] = useState('0');
  const [operacao, setOperacao] = useState<string | null>(null);
  const [valorAnterior, setValorAnterior] = useState<number | null>(null);
  const [novoNumero, setNovoNumero] = useState(true);
  
  // Estados para modais das gavetas
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  
  // Estados dos dados das gavetas (RECEITA)
  const [descricaoServico, setDescricaoServico] = useState('');
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [veiculoMarca, setVeiculoMarca] = useState('');
  const [veiculoModelo, setVeiculoModelo] = useState('');
  const [veiculoAno, setVeiculoAno] = useState('');
  const [veiculoPlaca, setVeiculoPlaca] = useState('');
  const [veiculoCor, setVeiculoCor] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [numeroParcelas, setNumeroParcelas] = useState('1');
  const [dataVencimento, setDataVencimento] = useState('');
  const [materiaisUtilizados, setMateriaisUtilizados] = useState<Material[]>([]);
  const [outrasDespesas, setOutrasDespesas] = useState<OutraDespesa[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [dataReceita, setDataReceita] = useState(new Date().toISOString().split('T')[0]);
  const [statusReceita, setStatusReceita] = useState<StatusServico>('Orçamento');
  const [fotoVisualizacao, setFotoVisualizacao] = useState<string | null>(null);
  const [menuFotoAberto, setMenuFotoAberto] = useState<string | null>(null);

  // Estados dos dados das gavetas (DESPESA)
  const [nomeDespesa, setNomeDespesa] = useState('');
  const [categoriaDespesa, setCategoriaDespesa] = useState<string>('');
  const [dataDespesa, setDataDespesa] = useState(new Date().toISOString().split('T')[0]);
  const [statusDespesa, setStatusDespesa] = useState<'pendente' | 'pago'>('pendente');
  const [tipoDespesa, setTipoDespesa] = useState<TipoDespesa>('Outros');
  const [descricaoDespesa, setDescricaoDespesa] = useState('');
  const [fotosDespesa, setFotosDespesa] = useState<Foto[]>([]);

  // Estados para categorias personalizadas
  const [categoriasPersonalizadas, setCategoriasPersonalizadas] = useState<CategoriaPersonalizada[]>([]);
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [novaCategoriaModal, setNovaCategoriaModal] = useState(false);
  const [novaCategoriaNome, setNovaCategoriaNome] = useState('');

  // Estados temporários para edição nos sub-modais
  const [tempMaterialNome, setTempMaterialNome] = useState('');
  const [tempMaterialValor, setTempMaterialValor] = useState('');
  const [tempDespesaDescricao, setTempDespesaDescricao] = useState('');
  const [tempDespesaValor, setTempDespesaValor] = useState('');

  // Estados temporários para edição de cliente/veículo
  const [tempClienteNome, setTempClienteNome] = useState('');
  const [tempClienteTelefone, setTempClienteTelefone] = useState('');
  const [tempVeiculoMarca, setTempVeiculoMarca] = useState('');
  const [tempVeiculoModelo, setTempVeiculoModelo] = useState('');
  const [tempVeiculoAno, setTempVeiculoAno] = useState('');
  const [tempVeiculoPlaca, setTempVeiculoPlaca] = useState('');
  const [tempVeiculoCor, setTempVeiculoCor] = useState('');

  // Estados temporários para forma de pagamento
  const [tempFormaPagamento, setTempFormaPagamento] = useState<FormaPagamento>('Dinheiro');
  const [tempNumeroParcelas, setTempNumeroParcelas] = useState('1');
  const [tempDataVencimento, setTempDataVencimento] = useState('');

  // Estados temporários para data e status (RECEITA)
  const [tempDataReceita, setTempDataReceita] = useState('');
  const [tempStatusReceita, setTempStatusReceita] = useState<StatusServico>('Orçamento');

  // Estados temporários para data e status (DESPESA)
  const [tempDataDespesa, setTempDataDespesa] = useState('');
  const [tempStatusDespesa, setTempStatusDespesa] = useState<'pendente' | 'pago'>('pendente');

  // Estado temporário para descrição
  const [tempDescricaoServico, setTempDescricaoServico] = useState('');
  const [tempDescricaoDespesa, setTempDescricaoDespesa] = useState('');

  // Carregar categorias personalizadas do localStorage
  useEffect(() => {
    const categoriasStorage = localStorage.getItem('categorias_personalizadas');
    if (categoriasStorage) {
      setCategoriasPersonalizadas(JSON.parse(categoriasStorage));
    }
  }, []);

  // Salvar categorias personalizadas no localStorage
  const salvarCategoriasPersonalizadas = (categorias: CategoriaPersonalizada[]) => {
    localStorage.setItem('categorias_personalizadas', JSON.stringify(categorias));
    setCategoriasPersonalizadas(categorias);
  };

  // Criar nova categoria personalizada
  const criarNovaCategoria = () => {
    if (!novaCategoriaNome.trim()) return;

    const cores = ['bg-rose-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-lime-500', 'bg-amber-500'];
    const corAleatoria = cores[Math.floor(Math.random() * cores.length)];

    const novaCategoria: CategoriaPersonalizada = {
      id: `custom-${Date.now()}`,
      nome: novaCategoriaNome,
      icone: 'Tag',
      cor: corAleatoria,
    };

    const novasCategorias = [...categoriasPersonalizadas, novaCategoria];
    salvarCategoriasPersonalizadas(novasCategorias);
    setCategoriaDespesa(novaCategoria.nome);
    setNovaCategoriaNome('');
    setNovaCategoriaModal(false);
    setModalAberto(null);
  };

  // Combinar categorias predefinidas e personalizadas
  const todasCategorias = [
    ...CATEGORIAS_PREDEFINIDAS.map(cat => ({
      id: cat.id,
      nome: cat.nome,
      icone: cat.icone,
      cor: cat.cor,
    })),
    ...categoriasPersonalizadas,
  ];

  // Filtrar categorias pela busca
  const categoriasFiltradas = todasCategorias.filter(cat =>
    cat.nome.toLowerCase().includes(buscaCategoria.toLowerCase())
  );

  if (!isOpen) return null;

  // Funções da calculadora
  const handleNumeroCalc = (num: string) => {
    if (novoNumero) {
      setDisplayCalc(num);
      setNovoNumero(false);
    } else {
      setDisplayCalc(displayCalc === '0' ? num : displayCalc + num);
    }
  };

  const handleOperacao = (op: string) => {
    const valorAtual = parseFloat(displayCalc);
    
    if (valorAnterior !== null && operacao && !novoNumero) {
      calcular();
    } else {
      setValorAnterior(valorAtual);
    }
    
    setOperacao(op);
    setNovoNumero(true);
  };

  const calcular = () => {
    if (valorAnterior === null || operacao === null) return;
    
    const valorAtual = parseFloat(displayCalc);
    let resultado = 0;
    
    switch (operacao) {
      case '+':
        resultado = valorAnterior + valorAtual;
        break;
      case '-':
        resultado = valorAnterior - valorAtual;
        break;
      case '×':
        resultado = valorAnterior * valorAtual;
        break;
      case '÷':
        resultado = valorAnterior / valorAtual;
        break;
      case '%':
        resultado = valorAnterior * (valorAtual / 100);
        break;
    }
    
    setDisplayCalc(resultado.toString());
    setValorAnterior(null);
    setOperacao(null);
    setNovoNumero(true);
  };

  const limparCalc = () => {
    setDisplayCalc('0');
    setOperacao(null);
    setValorAnterior(null);
    setNovoNumero(true);
  };

  const apagarCalc = () => {
    if (displayCalc.length === 1) {
      setDisplayCalc('0');
    } else {
      setDisplayCalc(displayCalc.slice(0, -1));
    }
  };

  // Funções da receita/despesa
  const handleNumeroClick = (num: string) => {
    if (valor === '0,00') {
      setValor(`0,0${num}`);
    } else {
      const valorSemFormatacao = valor.replace(',', '').replace('.', '');
      const novoValor = valorSemFormatacao + num;
      const valorNumerico = parseInt(novoValor) / 100;
      setValor(valorNumerico.toFixed(2).replace('.', ','));
    }
  };

  const handleBackspace = () => {
    const valorSemFormatacao = valor.replace(',', '').replace('.', '');
    if (valorSemFormatacao.length <= 2) {
      setValor('0,00');
    } else {
      const novoValor = valorSemFormatacao.slice(0, -1);
      const valorNumerico = parseInt(novoValor) / 100;
      setValor(valorNumerico.toFixed(2).replace('.', ','));
    }
  };

  const handleLimpar = () => {
    setValor('0,00');
  };

  // Funções para fotos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const novaFoto: Foto = {
            id: `foto-${Date.now()}-${Math.random()}`,
            url: event.target?.result as string,
            nome: file.name,
            isPerfil: false
          };
          if (tipo === 'receita') {
            setFotos((prev) => [...prev, novaFoto]);
          } else if (tipo === 'despesa') {
            setFotosDespesa((prev) => [...prev, novaFoto]);
          }
        };
        reader.readAsDataURL(file);
      }
    });

    // Limpar input para permitir selecionar a mesma foto novamente
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removerFoto = (id: string) => {
    if (tipo === 'receita') {
      setFotos((prev) => prev.filter((f) => f.id !== id));
    } else if (tipo === 'despesa') {
      setFotosDespesa((prev) => prev.filter((f) => f.id !== id));
    }
    setMenuFotoAberto(null);
  };

  const visualizarFoto = (url: string) => {
    setFotoVisualizacao(url);
    setMenuFotoAberto(null);
  };

  const definirFotoPerfil = (id: string) => {
    if (tipo === 'receita') {
      setFotos((prev) => prev.map((f) => ({
        ...f,
        isPerfil: f.id === id
      })));
    } else if (tipo === 'despesa') {
      setFotosDespesa((prev) => prev.map((f) => ({
        ...f,
        isPerfil: f.id === id
      })));
    }
    setMenuFotoAberto(null);
  };

  // Funções para abrir modais com dados atuais
  const abrirModalClienteVeiculo = () => {
    setTempClienteNome(clienteNome);
    setTempClienteTelefone(clienteTelefone);
    setTempVeiculoMarca(veiculoMarca);
    setTempVeiculoModelo(veiculoModelo);
    setTempVeiculoAno(veiculoAno);
    setTempVeiculoPlaca(veiculoPlaca);
    setTempVeiculoCor(veiculoCor);
    setModalAberto('cliente');
  };

  const abrirModalPagamento = () => {
    setTempFormaPagamento(formaPagamento);
    setTempNumeroParcelas(numeroParcelas);
    setTempDataVencimento(dataVencimento);
    setModalAberto('pagamento');
  };

  const abrirModalDataStatus = () => {
    if (tipo === 'receita') {
      setTempDataReceita(dataReceita);
      setTempStatusReceita(statusReceita);
    } else if (tipo === 'despesa') {
      setTempDataDespesa(dataDespesa);
      setTempStatusDespesa(statusDespesa);
    }
    setModalAberto('data-status');
  };

  const abrirModalDescricao = () => {
    if (tipo === 'receita') {
      setTempDescricaoServico(descricaoServico);
    } else if (tipo === 'despesa') {
      setTempDescricaoDespesa(descricaoDespesa);
    }
    setModalAberto('descricao');
  };

  // Funções para salvar dados dos sub-modais
  const salvarClienteVeiculo = () => {
    setClienteNome(tempClienteNome);
    setClienteTelefone(tempClienteTelefone);
    setVeiculoMarca(tempVeiculoMarca);
    setVeiculoModelo(tempVeiculoModelo);
    setVeiculoAno(tempVeiculoAno);
    setVeiculoPlaca(tempVeiculoPlaca);
    setVeiculoCor(tempVeiculoCor);
    setModalAberto(null);
  };

  const salvarPagamento = () => {
    setFormaPagamento(tempFormaPagamento);
    setNumeroParcelas(tempNumeroParcelas);
    setDataVencimento(tempDataVencimento);
    setModalAberto(null);
  };

  const salvarDataStatus = () => {
    if (tipo === 'receita') {
      setDataReceita(tempDataReceita);
      setStatusReceita(tempStatusReceita);
    } else if (tipo === 'despesa') {
      setDataDespesa(tempDataDespesa);
      setStatusDespesa(tempStatusDespesa);
    }
    setModalAberto(null);
  };

  const salvarDescricao = () => {
    if (tipo === 'receita') {
      setDescricaoServico(tempDescricaoServico);
    } else if (tipo === 'despesa') {
      setDescricaoDespesa(tempDescricaoDespesa);
    }
    setModalAberto(null);
  };

  // Funções para materiais
  const adicionarMaterial = () => {
    if (!tempMaterialNome.trim() || !tempMaterialValor) return;
    
    const novoMaterial: Material = {
      id: `mat-${Date.now()}`,
      nome: tempMaterialNome,
      valor: parseFloat(tempMaterialValor.replace(',', '.'))
    };
    
    setMateriaisUtilizados([...materiaisUtilizados, novoMaterial]);
    setTempMaterialNome('');
    setTempMaterialValor('');
  };

  const removerMaterial = (id: string) => {
    setMateriaisUtilizados(materiaisUtilizados.filter(m => m.id !== id));
  };

  // Funções para outras despesas
  const adicionarOutraDespesa = () => {
    if (!tempDespesaDescricao.trim() || !tempDespesaValor) return;
    
    const novaDespesa: OutraDespesa = {
      id: `desp-${Date.now()}`,
      descricao: tempDespesaDescricao,
      valor: parseFloat(tempDespesaValor.replace(',', '.'))
    };
    
    setOutrasDespesas([...outrasDespesas, novaDespesa]);
    setTempDespesaDescricao('');
    setTempDespesaValor('');
  };

  const removerOutraDespesa = (id: string) => {
    setOutrasDespesas(outrasDespesas.filter(d => d.id !== id));
  };

  // Calcular totais
  const totalMateriais = materiaisUtilizados.reduce((acc, m) => acc + m.valor, 0);
  const totalOutrasDespesas = outrasDespesas.reduce((acc, d) => acc + d.valor, 0);

  // Obter resumos para exibir nas gavetas
  const getResumoClienteVeiculo = () => {
    if (!clienteNome && !veiculoMarca) return null;
    return `${clienteNome || 'Cliente não informado'} • ${veiculoMarca || ''} ${veiculoModelo || ''}`.trim();
  };

  const getResumoPagamento = () => {
    if (!formaPagamento) return null;
    const parcelas = parseInt(numeroParcelas) > 1 ? ` (${numeroParcelas}x)` : '';
    return `${formaPagamento}${parcelas}`;
  };

  const getResumoMateriais = () => {
    if (materiaisUtilizados.length === 0) return null;
    return `${materiaisUtilizados.length} ${materiaisUtilizados.length === 1 ? 'item' : 'itens'} • R$ ${totalMateriais.toFixed(2).replace('.', ',')}`;
  };

  const getResumoOutrasDespesas = () => {
    if (outrasDespesas.length === 0) return null;
    return `${outrasDespesas.length} ${outrasDespesas.length === 1 ? 'item' : 'itens'} • R$ ${totalOutrasDespesas.toFixed(2).replace('.', ',')}`;
  };

  const getResumoDataStatus = () => {
    if (tipo === 'receita') {
      if (!dataReceita) return null;
      const dataFormatada = new Date(dataReceita + 'T00:00:00').toLocaleDateString('pt-BR');
      return `${dataFormatada} • ${statusReceita}`;
    } else if (tipo === 'despesa') {
      if (!dataDespesa) return null;
      const dataFormatada = new Date(dataDespesa + 'T00:00:00').toLocaleDateString('pt-BR');
      return `${dataFormatada} • ${statusDespesa === 'pago' ? 'Pago' : 'Pendente'}`;
    }
    return null;
  };

  const validarCampos = () => {
    const erros: string[] = [];
    
    if (tipo === 'receita') {
      if (valor === '0,00' || parseFloat(valor.replace(',', '.')) === 0) {
        erros.push('Valor da Receita');
      }
      if (!nomeVeiculo.trim()) {
        erros.push('Nome do Veículo');
      }
      if (!dataReceita) {
        erros.push('Data da Receita');
      }
    } else if (tipo === 'despesa') {
      if (valor === '0,00' || parseFloat(valor.replace(',', '.')) === 0) {
        erros.push('Valor da Despesa');
      }
      if (!nomeDespesa.trim()) {
        erros.push('Nome da Despesa');
      }
      if (!dataDespesa) {
        erros.push('Data da Despesa');
      }
    }
    
    if (erros.length > 0) {
      alert(`Por favor, preencha os seguintes campos obrigatórios:\n\n• ${erros.join('\n• ')}`);
      return false;
    }
    return true;
  };

  const handleSalvar = () => {
    if (!validarCampos()) return;
    
    const valorNumerico = parseFloat(valor.replace(',', '.'));
    
    if (tipo === 'receita') {
      const novoServico: Omit<Servico, 'id' | 'lucro_liquido'> = {
        data_servico: dataReceita,
        status: statusReceita,
        nome_veiculo: nomeVeiculo,
        cliente_nome: clienteNome || 'Cliente não informado',
        telefone_cliente: clienteTelefone || '',
        carro_marca: veiculoMarca || 'Marca não informada',
        carro_modelo: veiculoModelo || nomeVeiculo,
        carro_ano: parseInt(veiculoAno) || new Date().getFullYear(),
        carro_placa: veiculoPlaca || '',
        cor_original: veiculoCor || '',
        servico_descricao: descricaoServico || 'Serviço de pintura',
        valor_cobrado: valorNumerico,
        custo_materiais: totalMateriais,
        custo_terceiros: 0,
        outras_despesas_vinculadas: totalOutrasDespesas,
        forma_pagamento: formaPagamento,
        observacoes: '',
        fotos: fotos.map(f => f.url),
      };
      
      adicionarServico(novoServico);
    } else if (tipo === 'despesa') {
      addDespesa({
        data_despesa: dataDespesa,
        tipo_despesa: categoriaDespesa as TipoDespesa || 'Outros',
        descricao: nomeDespesa,
        valor: valorNumerico,
        relacionado_a_servico: false,
        observacoes: descricaoDespesa || '',
        origem: 'manual',
        servico_id: null,
        forma_pagamento: formaPagamento,
      });
    }
    
    // Fechar teclado e modal
    setTecladoVisivel(false);
    onClose();
    
    // Resetar campos
    resetarCampos();
  };

  const resetarCampos = () => {
    setValor('0,00');
    setNomeVeiculo('');
    setDescricaoServico('');
    setClienteNome('');
    setClienteTelefone('');
    setVeiculoMarca('');
    setVeiculoModelo('');
    setVeiculoAno('');
    setVeiculoPlaca('');
    setVeiculoCor('');
    setFormaPagamento('Dinheiro');
    setNumeroParcelas('1');
    setDataVencimento('');
    setMateriaisUtilizados([]);
    setOutrasDespesas([]);
    setFotos([]);
    setDataReceita(new Date().toISOString().split('T')[0]);
    setStatusReceita('Orçamento');
    
    // Resetar campos de despesa
    setNomeDespesa('');
    setCategoriaDespesa('');
    setDataDespesa(new Date().toISOString().split('T')[0]);
    setStatusDespesa('pendente');
    setTipoDespesa('Outros');
    setDescricaoDespesa('');
    setFotosDespesa([]);
  };

  const fotosAtivas = tipo === 'receita' ? fotos : fotosDespesa;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div 
          className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header com Abas */}
          <div className={tipo === 'receita' ? 'bg-[#00A859]' : tipo === 'despesa' ? 'bg-red-500' : 'bg-[#00A859]'}>
            {/* Abas */}
            <div className="flex border-b border-white/20">
              <button
                onClick={() => setTipo('receita')}
                className={`flex-1 py-4 text-center font-semibold transition-all text-white ${
                  tipo === 'receita' 
                    ? 'bg-white/20 border-b-2 border-white' 
                    : 'opacity-70 hover:opacity-90'
                }`}
              >
                Receita
              </button>
              <button
                onClick={() => setTipo('despesa')}
                className={`flex-1 py-4 text-center font-semibold transition-all text-white ${
                  tipo === 'despesa' 
                    ? 'bg-white/20 border-b-2 border-white' 
                    : 'opacity-70 hover:opacity-90'
                }`}
              >
                Despesa
              </button>
              <button
                onClick={() => setTipo('calculadora')}
                className={`flex-1 py-4 text-center font-semibold transition-all text-white ${
                  tipo === 'calculadora' 
                    ? 'bg-white/20 border-b-2 border-white' 
                    : 'opacity-70 hover:opacity-90'
                }`}
              >
                Calculadora
              </button>
            </div>

            {/* Conteúdo do Header baseado no tipo */}
            {tipo === 'receita' ? (
              <button
                onClick={() => setTecladoVisivel(!tecladoVisivel)}
                className="w-full p-6 text-center hover:bg-white/10 transition-colors text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <ThumbsUp className="w-8 h-8" />
                  <span className="text-5xl font-bold">R$ {valor}</span>
                </div>
                <p className="text-sm text-white/70 mt-2">Clique para editar</p>
              </button>
            ) : tipo === 'despesa' ? (
              <button
                onClick={() => setTecladoVisivel(!tecladoVisivel)}
                className="w-full p-6 text-center hover:bg-white/10 transition-colors text-white"
              >
                <div className="flex items-center justify-center gap-3">
                  <TrendingDown className="w-8 h-8" />
                  <span className="text-5xl font-bold">R$ {valor}</span>
                </div>
                <p className="text-sm text-white/70 mt-2">Clique para editar</p>
              </button>
            ) : (
              <div className="p-6">
                <div className="bg-white/10 rounded-xl p-4 text-right">
                  <div className="text-sm text-white/70 mb-1 min-h-[20px]">
                    {valorAnterior !== null && operacao ? `${valorAnterior} ${operacao}` : ''}
                  </div>
                  <div className="text-4xl font-bold break-all text-white">{displayCalc}</div>
                </div>
              </div>
            )}
          </div>

          {/* Conteúdo Scrollável */}
          <div className="flex-1 overflow-y-auto">
            {tipo === 'receita' ? (
              <>
                {/* Teclado Numérico - CONDICIONAL - COMPACTO */}
                {tecladoVisivel && (
                  <div className="p-2 bg-gray-50 border-b-4 border-[#00A859]">
                    <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumeroClick(num.toString())}
                          className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={handleLimpar}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-red-600 transition-colors"
                      >
                        C
                      </button>
                      <button
                        onClick={() => handleNumeroClick('0')}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                      >
                        0
                      </button>
                      <button
                        onClick={handleBackspace}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-gray-600 transition-colors"
                      >
                        ←
                      </button>
                    </div>
                    <button
                      onClick={() => setTecladoVisivel(false)}
                      className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Fechar teclado
                    </button>
                  </div>
                )}

                {/* Campo Nome do Veículo */}
                <div className="px-6 py-4 bg-gray-900/5 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Veículo *
                  </label>
                  <input
                    type="text"
                    value={nomeVeiculo}
                    onChange={(e) => setNomeVeiculo(e.target.value)}
                    placeholder="Digite o nome do veículo..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Este nome aparecerá como título principal na lista de serviços
                  </p>
                </div>

                {/* Gavetas (Accordions) */}
                <div className="divide-y divide-gray-200">
                  {/* 1. Data e Status da Receita */}
                  <button
                    onClick={abrirModalDataStatus}
                    className="w-full px-6 py-4 bg-blue-50/20 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">Data e Status da Receita *</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoDataStatus() && (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        {getResumoDataStatus()}
                      </p>
                    )}
                  </button>

                  {/* 2. Anexar Fotos */}
                  <button
                    onClick={() => setModalAberto('fotos')}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800">Anexar Fotos</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {fotos.length > 0 && (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        {fotos.length} {fotos.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                      </p>
                    )}
                  </button>

                  {/* 3. Descrição do Serviço */}
                  <button
                    onClick={abrirModalDescricao}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium text-gray-800">Descrição do Serviço</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {descricaoServico && (
                      <p className="text-xs text-gray-500 text-left ml-8 line-clamp-1">
                        {descricaoServico}
                      </p>
                    )}
                  </button>

                  {/* 4. Cliente e Veículo */}
                  <button
                    onClick={abrirModalClienteVeiculo}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-amber-500" />
                        <span className="font-medium text-gray-800">Cliente e Veículo</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoClienteVeiculo() && (
                      <p className="text-xs text-gray-500 text-left ml-8 line-clamp-1">
                        {getResumoClienteVeiculo()}
                      </p>
                    )}
                  </button>

                  {/* 5. Forma de Pagamento */}
                  <button
                    onClick={abrirModalPagamento}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium text-gray-800">Forma de Pagamento</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoPagamento() && (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        {getResumoPagamento()}
                      </p>
                    )}
                  </button>

                  {/* 6. Materiais Utilizados */}
                  <button
                    onClick={() => setModalAberto('materiais')}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-orange-500" />
                        <span className="font-medium text-gray-800">Materiais Utilizados</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoMateriais() ? (
                      <p className="text-xs text-emerald-600 font-medium text-left ml-8">
                        {getResumoMateriais()}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        Adicione os materiais para recalcular o Lucro Líquido
                      </p>
                    )}
                  </button>

                  {/* 7. Outras Despesas */}
                  <button
                    onClick={() => setModalAberto('outras-despesas')}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-rose-500" />
                        <span className="font-medium text-gray-800">Outras Despesas</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoOutrasDespesas() && (
                      <p className="text-xs text-red-600 font-medium text-left ml-8">
                        {getResumoOutrasDespesas()}
                      </p>
                    )}
                  </button>
                </div>
              </>
            ) : tipo === 'despesa' ? (
              <>
                {/* Teclado Numérico - CONDICIONAL - COMPACTO */}
                {tecladoVisivel && (
                  <div className="p-2 bg-gray-50 border-b-4 border-red-500">
                    <div className="grid grid-cols-3 gap-1.5 max-w-[240px] mx-auto">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                          key={num}
                          onClick={() => handleNumeroClick(num.toString())}
                          className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                        >
                          {num}
                        </button>
                      ))}
                      <button
                        onClick={handleLimpar}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-red-600 transition-colors"
                      >
                        C
                      </button>
                      <button
                        onClick={() => handleNumeroClick('0')}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-lg font-semibold text-gray-800 transition-colors"
                      >
                        0
                      </button>
                      <button
                        onClick={handleBackspace}
                        className="w-16 h-16 rounded-full bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-sm font-semibold text-gray-600 transition-colors"
                      >
                        ←
                      </button>
                    </div>
                    <button
                      onClick={() => setTecladoVisivel(false)}
                      className="w-full mt-2 py-1.5 text-xs text-gray-600 hover:text-gray-800 font-medium"
                    >
                      Fechar teclado
                    </button>
                  </div>
                )}

                {/* Campo Nome da Despesa */}
                <div className="px-6 py-4 bg-gray-900/5 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Despesa *
                  </label>
                  <input
                    type="text"
                    value={nomeDespesa}
                    onChange={(e) => setNomeDespesa(e.target.value)}
                    placeholder="Digite o nome da despesa..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Campo Categoria da Despesa */}
                <button
                  onClick={() => setModalAberto('categorias')}
                  className="w-full px-6 py-4 bg-gray-50 border-t border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag className="w-5 h-5 text-red-500" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-700">Categoria</p>
                        {categoriaDespesa ? (
                          <p className="text-xs text-gray-500 mt-0.5">{categoriaDespesa}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">Selecione uma categoria</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>

                {/* Gavetas (Accordions) */}
                <div className="divide-y divide-gray-200">
                  {/* 1. Data e Status da Despesa */}
                  <button
                    onClick={abrirModalDataStatus}
                    className="w-full px-6 py-4 bg-blue-50/20 hover:bg-blue-50/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        <span className="font-medium text-gray-800">Data e Status da Despesa *</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {getResumoDataStatus() && (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        {getResumoDataStatus()}
                      </p>
                    )}
                  </button>

                  {/* 2. Anexar Fotos */}
                  <button
                    onClick={() => setModalAberto('fotos')}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <Camera className="w-5 h-5 text-purple-500" />
                        <span className="font-medium text-gray-800">Anexar Fotos</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {fotosDespesa.length > 0 && (
                      <p className="text-xs text-gray-500 text-left ml-8">
                        {fotosDespesa.length} {fotosDespesa.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                      </p>
                    )}
                  </button>

                  {/* 3. Descrição da Despesa */}
                  <button
                    onClick={abrirModalDescricao}
                    className="w-full px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <span className="font-medium text-gray-800">Descrição da Despesa</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                    {descricaoDespesa && (
                      <p className="text-xs text-gray-500 text-left ml-8 line-clamp-1">
                        {descricaoDespesa}
                      </p>
                    )}
                  </button>
                </div>
              </>
            ) : (
              /* Calculadora */
              <div className="p-6">
                <div className="grid grid-cols-4 gap-3 max-w-sm mx-auto">
                  {/* Linha 1: C, ÷, ×, ← */}
                  <button
                    onClick={limparCalc}
                    className="aspect-square rounded-xl bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-xl font-semibold transition-colors"
                  >
                    C
                  </button>
                  <button
                    onClick={() => handleOperacao('÷')}
                    className="aspect-square rounded-xl bg-[#00A859] hover:bg-[#009048] active:bg-[#007A3D] text-white text-2xl font-semibold transition-colors"
                  >
                    ÷
                  </button>
                  <button
                    onClick={() => handleOperacao('×')}
                    className="aspect-square rounded-xl bg-[#00A859] hover:bg-[#009048] active:bg-[#007A3D] text-white text-2xl font-semibold transition-colors"
                  >
                    ×
                  </button>
                  <button
                    onClick={apagarCalc}
                    className="aspect-square rounded-xl bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 text-xl font-semibold transition-colors"
                  >
                    ←
                  </button>

                  {/* Linha 2: 7, 8, 9, - */}
                  <button
                    onClick={() => handleNumeroCalc('7')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    7
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('8')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    8
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('9')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    9
                  </button>
                  <button
                    onClick={() => handleOperacao('-')}
                    className="aspect-square rounded-xl bg-[#00A859] hover:bg-[#009048] active:bg-[#007A3D] text-white text-2xl font-semibold transition-colors"
                  >
                    −
                  </button>

                  {/* Linha 3: 4, 5, 6, + */}
                  <button
                    onClick={() => handleNumeroCalc('4')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    4
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('5')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    5
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('6')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    6
                  </button>
                  <button
                    onClick={() => handleOperacao('+')}
                    className="aspect-square rounded-xl bg-[#00A859] hover:bg-[#009048] active:bg-[#007A3D] text-white text-2xl font-semibold transition-colors"
                  >
                    +
                  </button>

                  {/* Linha 4: 1, 2, 3, % */}
                  <button
                    onClick={() => handleNumeroCalc('1')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    1
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('2')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    2
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('3')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    3
                  </button>
                  <button
                    onClick={() => handleOperacao('%')}
                    className="aspect-square rounded-xl bg-[#00A859] hover:bg-[#009048] active:bg-[#007A3D] text-white text-2xl font-semibold transition-colors"
                  >
                    %
                  </button>

                  {/* Linha 5: 0 (span 2), ., = */}
                  <button
                    onClick={() => handleNumeroCalc('0')}
                    className="col-span-2 rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors py-6"
                  >
                    0
                  </button>
                  <button
                    onClick={() => handleNumeroCalc('.')}
                    className="aspect-square rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 shadow-sm text-2xl font-semibold text-gray-800 transition-colors"
                  >
                    .
                  </button>
                  <button
                    onClick={calcular}
                    className="aspect-square rounded-xl bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white text-2xl font-semibold transition-colors"
                  >
                    =
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer com Botões - Apenas para Receita e Despesa */}
          {(tipo === 'receita' || tipo === 'despesa') && (
            <div className="p-4 bg-white border-t border-gray-200 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                className={`flex-1 py-3 rounded-xl ${
                  tipo === 'receita' 
                    ? 'bg-[#00A859] hover:bg-[#009048]' 
                    : 'bg-red-500 hover:bg-red-600'
                } text-white font-semibold transition-colors flex items-center justify-center gap-2`}
              >
                <Check className="w-5 h-5" />
                Salvar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAIS DAS GAVETAS */}
      
      {/* Modal Seleção de Categorias */}
      {modalAberto === 'categorias' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Selecionar uma categoria</h3>
                <button
                  onClick={() => setModalAberto(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Barra de Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={buscaCategoria}
                  onChange={(e) => setBuscaCategoria(e.target.value)}
                  placeholder="Buscar uma categoria"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Grid de Categorias */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-3 gap-4">
                {categoriasFiltradas.map((categoria) => {
                  const IconComponent = IconMap[categoria.icone] || Tag;
                  return (
                    <button
                      key={categoria.id}
                      onClick={() => {
                        setCategoriaDespesa(categoria.nome);
                        setModalAberto(null);
                        setBuscaCategoria('');
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-16 h-16 ${categoria.cor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                        {categoria.nome}
                      </span>
                    </button>
                  );
                })}

                {/* Botão Criar Categoria */}
                <button
                  onClick={() => setNovaCategoriaModal(true)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <PlusIcon className="w-8 h-8 text-gray-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center">
                    Criar categoria
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Nova Categoria */}
      {novaCategoriaModal && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4" onClick={() => setNovaCategoriaModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Criar Nova Categoria</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  value={novaCategoriaNome}
                  onChange={(e) => setNovaCategoriaNome(e.target.value)}
                  placeholder="Ex: Combustível, Ferramentas..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-xs text-blue-700">
                  Esta categoria ficará disponível para futuras despesas e poderá ser usada para filtrar seus gastos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setNovaCategoriaModal(false);
                  setNovaCategoriaNome('');
                }}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={criarNovaCategoria}
                disabled={!novaCategoriaNome.trim()}
                className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Descrição */}
      {modalAberto === 'descricao' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-lg font-semibold">
                {tipo === 'receita' ? 'Descrição do Serviço' : 'Descrição da Despesa'}
              </h3>
            </div>
            
            <textarea
              value={tipo === 'receita' ? tempDescricaoServico : tempDescricaoDespesa}
              onChange={(e) => tipo === 'receita' ? setTempDescricaoServico(e.target.value) : setTempDescricaoDespesa(e.target.value)}
              placeholder={tipo === 'receita' ? 'Descreva detalhadamente o serviço realizado...' : 'Descreva detalhadamente a despesa...'}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859] resize-none"
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarDescricao}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cliente e Veículo */}
      {modalAberto === 'cliente' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Cliente e Veículo</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cliente
                </label>
                <input
                  type="text"
                  value={tempClienteNome}
                  onChange={(e) => setTempClienteNome(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={tempClienteTelefone}
                  onChange={(e) => setTempClienteTelefone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <CarIcon className="w-4 h-4" />
                  Dados do Veículo
                </h4>
                
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca
                      </label>
                      <input
                        type="text"
                        value={tempVeiculoMarca}
                        onChange={(e) => setTempVeiculoMarca(e.target.value)}
                        placeholder="Ex: Fiat"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Modelo
                      </label>
                      <input
                        type="text"
                        value={tempVeiculoModelo}
                        onChange={(e) => setTempVeiculoModelo(e.target.value)}
                        placeholder="Ex: Uno"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ano
                      </label>
                      <input
                        type="number"
                        value={tempVeiculoAno}
                        onChange={(e) => setTempVeiculoAno(e.target.value)}
                        placeholder="2020"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Placa
                      </label>
                      <input
                        type="text"
                        value={tempVeiculoPlaca}
                        onChange={(e) => setTempVeiculoPlaca(e.target.value.toUpperCase())}
                        placeholder="ABC-1234"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cor Original
                    </label>
                    <input
                      type="text"
                      value={tempVeiculoCor}
                      onChange={(e) => setTempVeiculoCor(e.target.value)}
                      placeholder="Ex: Branco"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarClienteVeiculo}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Forma de Pagamento */}
      {modalAberto === 'pagamento' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Pagamento
                </label>
                <select
                  value={tempFormaPagamento}
                  onChange={(e) => setTempFormaPagamento(e.target.value as FormaPagamento)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Pix">Pix</option>
                  <option value="Cartão crédito">Cartão de Crédito</option>
                  <option value="Cartão débito">Cartão de Débito</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              {tempFormaPagamento === 'Cartão crédito' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={tempNumeroParcelas}
                    onChange={(e) => setTempNumeroParcelas(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento (opcional)
                </label>
                <input
                  type="date"
                  value={tempDataVencimento}
                  onChange={(e) => setTempDataVencimento(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarPagamento}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Materiais Utilizados */}
      {modalAberto === 'materiais' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Package className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold">Materiais Utilizados</h3>
            </div>
            
            {/* Formulário para adicionar material */}
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Material
                </label>
                <input
                  type="text"
                  value={tempMaterialNome}
                  onChange={(e) => setTempMaterialNome(e.target.value)}
                  placeholder="Ex: Tinta automotiva"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tempMaterialValor}
                  onChange={(e) => setTempMaterialValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <button
                onClick={adicionarMaterial}
                className="w-full py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar Material
              </button>
            </div>

            {/* Lista de materiais */}
            {materiaisUtilizados.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Materiais Adicionados:</h4>
                {materiaisUtilizados.map((material) => (
                  <div key={material.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{material.nome}</p>
                      <p className="text-sm text-emerald-600 font-semibold">R$ {material.valor.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button
                      onClick={() => removerMaterial(material.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-sm font-medium text-gray-700">Total em Materiais:</p>
                  <p className="text-2xl font-bold text-emerald-600">R$ {totalMateriais.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Outras Despesas */}
      {modalAberto === 'outras-despesas' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold">Outras Despesas</h3>
            </div>
            
            {/* Formulário para adicionar despesa */}
            <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  value={tempDespesaDescricao}
                  onChange={(e) => setTempDespesaDescricao(e.target.value)}
                  placeholder="Ex: Transporte, alimentação..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={tempDespesaValor}
                  onChange={(e) => setTempDespesaValor(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <button
                onClick={adicionarOutraDespesa}
                className="w-full py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Adicionar Despesa
              </button>
            </div>

            {/* Lista de despesas */}
            {outrasDespesas.length > 0 && (
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Despesas Adicionadas:</h4>
                {outrasDespesas.map((despesa) => (
                  <div key={despesa.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{despesa.descricao}</p>
                      <p className="text-sm text-red-600 font-semibold">R$ {despesa.valor.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <button
                      onClick={() => removerOutraDespesa(despesa.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-sm font-medium text-gray-700">Total em Outras Despesas:</p>
                  <p className="text-2xl font-bold text-red-600">R$ {totalOutrasDespesas.toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Anexar Fotos */}
      {modalAberto === 'fotos' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Anexar Fotos</h3>
            </div>
            
            {/* Área de Upload */}
            <div className="mb-6">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-[#00A859] hover:bg-gray-50 transition-colors"
              >
                <Upload className="w-12 h-12 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700 mb-1">Clique para selecionar fotos</p>
                <p className="text-xs text-gray-500">ou arraste e solte aqui</p>
              </label>
            </div>

            {/* Grid de Fotos Anexadas */}
            {fotosAtivas.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-medium text-gray-700">
                  Fotos Anexadas ({fotosAtivas.length})
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {fotosAtivas.map((foto) => (
                    <div key={foto.id} className="relative group">
                      <img
                        src={foto.url}
                        alt={foto.nome}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                      
                      {/* Badge de Foto de Perfil */}
                      {foto.isPerfil && (
                        <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1 shadow-lg">
                          <Star className="w-3 h-3 fill-white" />
                          Perfil
                        </div>
                      )}

                      {/* Botão de Menu (3 pontinhos) */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuFotoAberto(menuFotoAberto === foto.id ? null : foto.id);
                          }}
                          className="p-1.5 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white shadow-lg transition-colors"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-700" />
                        </button>

                        {/* Menu Dropdown */}
                        {menuFotoAberto === foto.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10">
                            <button
                              onClick={() => visualizarFoto(foto.url)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700"
                            >
                              <Eye className="w-4 h-4" />
                              Visualizar em tela grande
                            </button>
                            <button
                              onClick={() => definirFotoPerfil(foto.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-yellow-600"
                            >
                              <Star className="w-4 h-4" />
                              {foto.isPerfil ? 'Remover de perfil' : 'Definir como perfil'}
                            </button>
                            <button
                              onClick={() => removerFoto(foto.id)}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                              Excluir foto
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {fotosAtivas.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma foto anexada ainda</p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Data e Status */}
      {modalAberto === 'data-status' && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={() => setModalAberto(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">
                {tipo === 'receita' ? 'Data e Status da Receita' : 'Data e Status da Despesa'}
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {tipo === 'receita' ? 'Data da Receita *' : 'Data da Despesa *'}
                </label>
                <input
                  type="date"
                  value={tipo === 'receita' ? tempDataReceita : tempDataDespesa}
                  onChange={(e) => tipo === 'receita' ? setTempDataReceita(e.target.value) : setTempDataDespesa(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {tipo === 'receita' ? (
                  <select
                    value={tempStatusReceita}
                    onChange={(e) => setTempStatusReceita(e.target.value as StatusServico)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A859]"
                  >
                    <option value="Orçamento">Orçamento</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Pago">Pago</option>
                  </select>
                ) : (
                  <select
                    value={tempStatusDespesa}
                    onChange={(e) => setTempStatusDespesa(e.target.value as 'pendente' | 'pago')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="pendente">Pendente</option>
                    <option value="pago">Pago</option>
                  </select>
                )}
              </div>

              {tipo === 'receita' && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">Dica:</p>
                      <p className="text-xs text-blue-700">
                        Apenas receitas com status "Finalizado" ou "Pago" entram no cálculo do balanço geral.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModalAberto(null)}
                className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={salvarDataStatus}
                className="flex-1 py-3 rounded-xl bg-[#00A859] hover:bg-[#009048] text-white font-semibold transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Visualização de Foto */}
      {fotoVisualizacao && (
        <div 
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
          onClick={() => setFotoVisualizacao(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setFotoVisualizacao(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={fotoVisualizacao}
              alt="Visualização"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
