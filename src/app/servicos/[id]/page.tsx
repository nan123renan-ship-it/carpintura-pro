"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatarMoeda, formatarData } from '@/lib/storage';
import { Servico, StatusServico, Despesa, TipoDespesa, StatusPagamentoDespesa } from '@/lib/types';
import { useServicos } from '@/hooks/useServicos';
import { useDespesas } from '@/hooks/useDespesas';
import { getProfileNote, getProfileNoteData, saveProfileNote } from '@/lib/profile-notes';
import { adicionarOuAtualizarCliente, buscarClientes, atualizarCliente, carregarClientes, Cliente } from '@/lib/clientes';
import {
  carregarListasStorage,
  salvarListasStorage,
  LISTA_COMUNS_DEFAULT,
  ListaCategoria,
  CategoriaItem,
  LISTAS_FIXAS_IDS,
  CategorySelectorModal,
  CategoryFieldButton,
} from '@/components/custom/CategorySelectorModal';

const NOTA_PROFILE_KEY = 'geral';

const CORES_CAT = [
  'bg-rose-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500',
  'bg-lime-500', 'bg-amber-500', 'bg-orange-400', 'bg-teal-400',
  'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500',
];

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
  Image as ImageIcon,
  Pen,
  Plus,
  Receipt,
  AlertCircle,
  ChevronRight,
  Wallet,
  ClipboardList,
  AlertTriangle,
  Link2,
  CheckSquare,
  Search,
  FolderOpen,
  ChevronDown,
  CheckCircle,
  Clock,
  Mail,
  MapPin,
  Phone,
  Share2,
  FileDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ---- Checklist de defeitos ----
const DEFEITOS_OPCOES = [
  'Amassado',
  'Arranhão',
  'Bolha na pintura',
  'Ferrugem',
  'Lascado',
  'Oxidação',
  'Peça faltando',
  'Quebrado',
  'Rachado',
  'Risco profundo',
  'Trincado',
  'Outro',
];

// ---- Tipos dos painéis ----
type PainelTipo = 'valor' | 'cliente' | 'carro' | 'despesas' | 'defeitos' | 'categorias' | 'galeria';

export default function DetalhesServicoPage() {
  const params = useParams();
  const router = useRouter();
  const { servicos, loading, updateServico: updateServicoHook, deleteServico: deleteServicoHook, adicionarServico } = useServicos();
  const { despesas, addDespesa, deleteDespesa } = useDespesas();
  const [servico, setServico] = useState<Servico | null>(null);
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [mostrarOpcoesFoto, setMostrarOpcoesFoto] = useState(false);

  // Painel ativo (drawer)
  const [painelAtivo, setPainelAtivo] = useState<PainelTipo | null>(null);

  // Estado do modal genérico de edição
  const [modalAberto, setModalAberto] = useState<string | null>(null);
  const [valorModal, setValorModal] = useState<any>('');

  // Estados para anotações
  const [notaPerfil, setNotaPerfil] = useState<string>('');
  const [notaCategorias, setNotaCategorias] = useState<string[]>([]);

  // Estado para modal de vincular despesa
  const [modalDespesaAberto, setModalDespesaAberto] = useState(false);
  const [salvandoDespesa, setSalvandoDespesa] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({
    descricao: '',
    valor: '',
    tipo_despesa: 'Outros' as TipoDespesa,
    data_despesa: new Date().toISOString().split('T')[0],
    forma_pagamento: 'Dinheiro',
    observacoes: '',
    status_pagamento: 'pendente' as StatusPagamentoDespesa,
  });
  const [categoriasDespesa, setCategoriasDespesa] = useState<string[]>([]);
  const [modalCategoriasDespesa, setModalCategoriasDespesa] = useState(false);

  // Checklist de defeitos (localStorage por serviço)
  const [defeitosSelecionados, setDefeitosSelecionados] = useState<string[]>([]);
  // Fotos por defeito: { [nomeDefeito]: string[] }
  const [fotosDefeito, setFotosDefeito] = useState<Record<string, string[]>>({});
  const defeitoFotoInputRef = useRef<HTMLInputElement>(null);
  const [defeitoFotoAlvo, setDefeitoFotoAlvo] = useState<string | null>(null);
  // Opções personalizadas de defeito (por serviço)
  const [defeitosCustom, setDefeitosCustom] = useState<string[]>([]);
  const [novoDefeitoTexto, setNovoDefeitoTexto] = useState('');
  const [mostrarInputNovoDefeito, setMostrarInputNovoDefeito] = useState(false);
  // Controle de quais defeitos estão com painel de fotos expandido
  const [defeitosExpandidos, setDefeitosExpandidos] = useState<string[]>([]);
  // PDF loading
  const [gerandoPdf, setGerandoPdf] = useState(false);

  // Sugestões de clientes no modal de nome do cliente
  const [sugestoesCliente, setSugestoesCliente] = useState<Cliente[]>([]);

  // Cliente vinculado ao serviço atual
  const [clienteVinculadoId, setClienteVinculadoId] = useState<string | null>(null);

  // Modal de confirmação de atualização de dados globais do cliente
  const [modalConfirmAtualizacao, setModalConfirmAtualizacao] = useState(false);
  const [pendingClienteUpdate, setPendingClienteUpdate] = useState<{
    campo: string;
    valorNovo: string;
    clienteId: string;
  } | null>(null);

  // Estado do drawer de cliente integrado (busca inline no drawer)
  const [buscaClienteDrawer, setBuscaClienteDrawer] = useState('');
  const [sugestoesDrawer, setSugestoesDrawer] = useState<Cliente[]>([]);
  const [modoNovoCliente, setModoNovoCliente] = useState(false);
  const [dadosClienteForm, setDadosClienteForm] = useState({
    nome: '',
    telefone: '',
    email: '',
    endereco: '',
  });

  // Edição inline do nome principal
  const [editandoNome, setEditandoNome] = useState(false);
  const [nomeEditado, setNomeEditado] = useState('');
  const nomeInputRef = useRef<HTMLInputElement>(null);

  // Estados para o drawer de Categorias (selector inline)
  const [catListas, setCatListas] = useState<ListaCategoria[]>([]);
  const [catListaAberta, setCatListaAberta] = useState<string | null>(null);
  const [catBusca, setCatBusca] = useState('');
  const [catModalNovaLista, setCatModalNovaLista] = useState(false);
  const [catNovaListaNome, setCatNovaListaNome] = useState('');
  const [catModalNovaCat, setCatModalNovaCat] = useState(false);
  const [catNovaCatNome, setCatNovaCatNome] = useState('');
  const [catListaAlvoId, setCatListaAlvoId] = useState('');

  useEffect(() => {
    if (!loading && servicos.length > 0) {
      const servicoEncontrado = servicos.find(s => s.id === params.id);
      if (servicoEncontrado) {
        setServico(servicoEncontrado);
        // Garante que foto_perfil_url também apareça no array (pode ter sido salva só como capa)
        const fotosBase = servicoEncontrado.fotos || [];
        const fotoPerfil = servicoEncontrado.foto_perfil_url;
        const fotosCompletas = fotoPerfil && !fotosBase.includes(fotoPerfil)
          ? [fotoPerfil, ...fotosBase]
          : fotosBase;
        setFotos(fotosCompletas);
        const notaSalva = getProfileNote(servicoEncontrado.id, NOTA_PROFILE_KEY);
        setNotaPerfil(notaSalva);
        const notaData = getProfileNoteData(servicoEncontrado.id, NOTA_PROFILE_KEY);
        setNotaCategorias(notaData?.categorias || []);
        // Carregar defeitos do localStorage
        const defSalvos = localStorage.getItem(`defeitos_${servicoEncontrado.id}`);
        if (defSalvos) setDefeitosSelecionados(JSON.parse(defSalvos));
        const fotosDef = localStorage.getItem(`defeitos_fotos_${servicoEncontrado.id}`);
        if (fotosDef) setFotosDefeito(JSON.parse(fotosDef));
        const defCustomSalvos = localStorage.getItem(`defeitos_custom_${servicoEncontrado.id}`);
        if (defCustomSalvos) setDefeitosCustom(JSON.parse(defCustomSalvos));
        // Tenta vincular ao cliente global pelo nome
        if (servicoEncontrado.cliente_nome?.trim()) {
          const clientes = carregarClientes();
          const nomeNorm = servicoEncontrado.cliente_nome.trim().toLowerCase();
          const cli = clientes.find(c => c.nome.trim().toLowerCase() === nomeNorm);
          if (cli) setClienteVinculadoId(cli.id);
        }
      }
    }
  }, [params.id, servicos, loading]);

  // Inicializar form do drawer de cliente quando abre
  useEffect(() => {
    if (painelAtivo === 'cliente' && servico) {
      setBuscaClienteDrawer(servico.cliente_nome || '');
      setSugestoesDrawer([]);
      setModoNovoCliente(false);
      setDadosClienteForm({
        nome: servico.cliente_nome || '',
        telefone: servico.telefone_cliente || '',
        email: servico.cliente_email || '',
        endereco: servico.cliente_endereco || '',
      });
    }
  }, [painelAtivo]);

  // Carregar listas de categorias quando painel de categorias abre
  useEffect(() => {
    if (painelAtivo === 'categorias') {
      setCatListas(carregarListasStorage());
      setCatBusca('');
      setCatListaAberta(null);
    }
  }, [painelAtivo]);

  // Focar input ao entrar em modo de edição do nome
  useEffect(() => {
    if (editandoNome && nomeInputRef.current) {
      nomeInputRef.current.focus();
      nomeInputRef.current.select();
    }
  }, [editandoNome]);

  const iniciarEdicaoNome = () => {
    if (!servico) return;
    setNomeEditado(servico.nome_veiculo || `${servico.carro_marca} ${servico.carro_modelo}`);
    setEditandoNome(true);
  };

  const salvarNome = async () => {
    if (!servico || !nomeEditado.trim()) { setEditandoNome(false); return; }
    const updated = { ...servico, nome_veiculo: nomeEditado.trim() };
    setServico(updated);
    setEditandoNome(false);
    await updateServicoHook(servico.id, { nome_veiculo: nomeEditado.trim() });
  };

  const cancelarEdicaoNome = () => {
    setEditandoNome(false);
  };

  const despesasVinculadas = despesas.filter(d => d.servico_id === servico?.id && d.origem === 'manual');

  // ---- Cálculo de progresso ----
  const calcularProgresso = () => {
    if (!servico) return 0;
    const checks = [
      // Dados do serviço (4)
      !!servico.valor_cobrado,
      !!servico.data_servico,
      !!servico.forma_pagamento,
      !!servico.servico_descricao,       // ao menos 1 categoria
      // Dados do cliente (4)
      !!servico.cliente_nome,
      !!servico.telefone_cliente,
      !!servico.cliente_email,
      !!servico.cliente_endereco,
      // Dados do veículo (5)
      !!servico.carro_marca,
      !!servico.carro_modelo,
      !!servico.carro_ano,
      !!servico.carro_placa,
      !!servico.cor_original,
      // Checklist e galeria (2)
      defeitosSelecionados.length > 0,   // ao menos 1 defeito
      fotos.length > 0,                  // ao menos 1 foto na galeria
    ];
    const preenchidos = checks.filter(Boolean).length;
    return Math.round((preenchidos / checks.length) * 100);
  };

  const progresso = calcularProgresso();

  const corProgresso = progresso < 30 ? '#ef4444' : progresso < 60 ? '#f59e0b' : progresso < 90 ? '#3b82f6' : '#10b981';

  // ── Helpers de imagem para jsPDF ──────────────────────────────────────────
  const carregarImagemBase64 = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  // Corrige orientação EXIF usando exifr e retorna dataURL pronto para o PDF
  const prepararFotoParaPdf = async (src: string): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = async () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        let orientation = 1;
        try {
          const exifr = await import('exifr');
          const exif = await exifr.default.parse(src, { pick: ['Orientation'] });
          if (exif?.Orientation) orientation = exif.Orientation;
        } catch {}

        const rotated = orientation >= 5 && orientation <= 8;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        canvas.width  = rotated ? h : w;
        canvas.height = rotated ? w : h;

        ctx.save();
        switch (orientation) {
          case 2: ctx.transform(-1,  0,  0,  1,  w,  0); break;
          case 3: ctx.transform(-1,  0,  0, -1,  w,  h); break;
          case 4: ctx.transform( 1,  0,  0, -1,  0,  h); break;
          case 5: ctx.transform( 0,  1,  1,  0,  0,  0); break;
          case 6: ctx.transform( 0,  1, -1,  0,  h,  0); break;
          case 7: ctx.transform( 0, -1, -1,  0,  h,  w); break;
          case 8: ctx.transform( 0, -1,  1,  0,  0,  w); break;
        }
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        resolve({
          dataUrl: canvas.toDataURL('image/jpeg', 0.92),
          width: canvas.width,
          height: canvas.height,
        });
      };
      img.onerror = () => resolve({ dataUrl: src, width: 100, height: 100 });
      img.src = src;
    });
  };

  // ---- Gerar PDF do Checklist ----
  const gerarPdfChecklist = async () => {
    if (!servico) return;
    setGerandoPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const H = 297;
      const margem = 14;

      const nomeVeiculo = [servico.carro_marca, servico.carro_modelo].filter(Boolean).join(' ') || servico.nome_veiculo || '—';
      const todasOpcoes = [...defeitosCustom, ...DEFEITOS_OPCOES];
      const defeitos_com_foto = defeitosSelecionados.filter(d => (fotosDefeito[d] || []).length > 0);
      const defeitos_sem_foto = defeitosSelecionados.filter(d => (fotosDefeito[d] || []).length === 0);

      // ── helper: cabeçalho mini em páginas internas ──────────────
      const cabecalhoMini = () => {
        doc.setFillColor(13, 40, 24);
        doc.rect(0, 0, W, 10, 'F');
        doc.setFontSize(7);
        doc.setTextColor(180, 220, 180);
        doc.setFont('helvetica', 'bold');
        doc.text('CHECK LIST DE DEFEITOS  ·  Car Pintura Pro', margem, 7);
        doc.setFont('helvetica', 'normal');
        doc.text(nomeVeiculo, W - margem, 7, { align: 'right' });
      };

      // ══════════════════════════════════════════════════
      // PÁGINA 1 — Resumo
      // ══════════════════════════════════════════════════
      let y = 16;

      // Cabeçalho principal
      doc.setFillColor(13, 40, 24);
      doc.rect(0, 0, W, 30, 'F');
      doc.setFontSize(17);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('CHECK LIST DE DEFEITOS', margem, 13);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(180, 220, 180);
      doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, margem, 22);
      doc.text(`Data do serviço: ${servico.data_servico ? new Date(servico.data_servico + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}`, W - margem, 22, { align: 'right' });
      y = 38;

      // Cliente
      doc.setFillColor(245, 250, 245);
      doc.roundedRect(margem, y, W - margem * 2, 26, 3, 3, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.4);
      doc.line(margem, y, margem, y + 26);
      doc.setFontSize(7.5);
      doc.setTextColor(34, 197, 94);
      doc.setFont('helvetica', 'bold');
      doc.text('CLIENTE', margem + 4, y + 7);
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.text(servico.cliente_nome || '—', margem + 4, y + 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const telEmail = [servico.telefone_cliente, servico.cliente_email].filter(Boolean).join('  ·  ');
      if (telEmail) doc.text(telEmail, margem + 4, y + 21.5);
      y += 31;

      // Veículo
      doc.setFillColor(237, 245, 255);
      doc.roundedRect(margem, y, W - margem * 2, 26, 3, 3, 'F');
      doc.setDrawColor(59, 130, 246);
      doc.line(margem, y, margem, y + 26);
      doc.setFontSize(7.5);
      doc.setTextColor(59, 130, 246);
      doc.setFont('helvetica', 'bold');
      doc.text('VEÍCULO', margem + 4, y + 7);
      doc.setFontSize(11);
      doc.setTextColor(20, 20, 20);
      doc.setFont('helvetica', 'bold');
      doc.text(nomeVeiculo, margem + 4, y + 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      const detVeiculo = [
        servico.carro_ano ? `Ano: ${servico.carro_ano}` : '',
        servico.carro_placa ? `Placa: ${servico.carro_placa}` : '',
        servico.cor_original ? `Cor: ${servico.cor_original}` : '',
      ].filter(Boolean).join('  ·  ');
      if (detVeiculo) doc.text(detVeiculo, margem + 4, y + 21.5);
      y += 31;

      // Título seção
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(13, 40, 24);
      doc.text('Defeitos Registrados', margem, y + 5);
      doc.setDrawColor(34, 197, 94);
      doc.setLineWidth(0.5);
      doc.line(margem, y + 7, W - margem, y + 7);
      y += 12;

      // ── Defeitos SEM foto ──────────────────────────────────────
      if (defeitos_sem_foto.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(110, 110, 110);
        doc.setFont('helvetica', 'italic');
        doc.text('Defeitos sem foto:', margem, y);
        y += 6;
        for (const defeito of defeitos_sem_foto) {
          if (y > 272) { doc.addPage(); cabecalhoMini(); y = 18; }
          doc.setFillColor(245, 158, 11);
          doc.roundedRect(margem, y - 3.5, 5, 5, 1, 1, 'F');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text('✓', margem + 1.3, y + 0.3);
          doc.setFontSize(10);
          doc.setTextColor(30, 30, 30);
          doc.setFont('helvetica', 'normal');
          doc.text(defeito, margem + 8, y);
          y += 7.5;
        }
        y += 4;
      }

      // ── Defeitos COM foto — miniaturas clicáveis ───────────────
      // Vamos primeiro construir o mapa de página por foto
      // pageMap[defeitoIdx][fotoIdx] = número da página no PDF
      const pageMap: Record<string, number[]> = {};
      let nextPage = 2; // página 1 = resumo
      for (const defeito of defeitos_com_foto) {
        const fotos = fotosDefeito[defeito] || [];
        pageMap[defeito] = fotos.map((_, idx) => nextPage + idx);
        nextPage += fotos.length;
      }

      const MINI_W = 42;
      const MINI_H = 34;
      const GAP = 4;
      const COLS = 4;

      for (const defeito of defeitos_com_foto) {
        const fotos = fotosDefeito[defeito] || [];
        const rows = Math.ceil(fotos.length / COLS);
        const cardH = 14 + rows * (MINI_H + GAP) + 2;

        if (y + cardH > 278) { doc.addPage(); cabecalhoMini(); y = 18; }

        // Card fundo
        doc.setFillColor(255, 251, 235);
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(0.45);
        doc.roundedRect(margem, y, W - margem * 2, cardH, 3, 3, 'FD');

        // Checkbox
        doc.setFillColor(245, 158, 11);
        doc.roundedRect(margem + 4, y + 4, 5.5, 5.5, 1.2, 1.2, 'F');
        doc.setFontSize(8);
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.text('✓', margem + 5.4, y + 8.5);

        // Nome
        doc.setFontSize(11);
        doc.setTextColor(120, 53, 15);
        doc.setFont('helvetica', 'bold');
        doc.text(defeito, margem + 12, y + 9);

        // Badge fotos
        doc.setFontSize(7);
        doc.setTextColor(120, 60, 5);
        doc.setFont('helvetica', 'normal');
        doc.text(`${fotos.length} foto${fotos.length !== 1 ? 's' : ''} — clique para ampliar`, W - margem - 4, y + 9, { align: 'right' });

        let fy = y + 15;
        let fx = margem + 4;

        for (let i = 0; i < fotos.length; i++) {
          if (i > 0 && i % COLS === 0) { fx = margem + 4; fy += MINI_H + GAP; }
          const src = fotos[i];

          // Tentar adicionar imagem (com correção de orientação EXIF)
          let imgOk = false;
          try {
            const { dataUrl: srcCorrigido } = await prepararFotoParaPdf(src);
            doc.addImage(srcCorrigido, 'JPEG', fx, fy, MINI_W, MINI_H, undefined, 'FAST');
            imgOk = true;
          } catch {
            // placeholder
            doc.setFillColor(230, 230, 230);
            doc.roundedRect(fx, fy, MINI_W, MINI_H, 2, 2, 'F');
            doc.setFontSize(7);
            doc.setTextColor(160, 160, 160);
            doc.text('sem imagem', fx + MINI_W / 2, fy + MINI_H / 2, { align: 'center' });
          }

          if (imgOk) {
            // Borda fina arredondada sobre a foto
            doc.setDrawColor(200, 150, 50);
            doc.setLineWidth(0.3);
            doc.roundedRect(fx, fy, MINI_W, MINI_H, 2, 2, 'S');

            // Faixa inferior escura com "ver +"
            doc.setFillColor(0, 0, 0);
            doc.saveGraphicsState();
            // @ts-ignore
            doc.setGState(new doc.GState({ opacity: 0.45 }));
            doc.rect(fx, fy + MINI_H - 7, MINI_W, 7, 'F');
            doc.restoreGraphicsState();
            doc.setFontSize(6.5);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('ver foto completa', fx + MINI_W / 2, fy + MINI_H - 2.5, { align: 'center' });

            // Link interno → página da foto ampliada
            const paginaFoto = pageMap[defeito][i];
            doc.link(fx, fy, MINI_W, MINI_H, { pageNumber: paginaFoto });
          }

          fx += MINI_W + GAP;
        }

        y += cardH + 5;
      }

      // Itens não marcados
      const naoMarcados = todasOpcoes.filter(d => !defeitosSelecionados.includes(d));
      if (naoMarcados.length > 0) {
        if (y > 270) { doc.addPage(); cabecalhoMini(); y = 18; }
        doc.setFontSize(7.5);
        doc.setTextColor(190, 190, 190);
        doc.setFont('helvetica', 'italic');
        doc.text('Sem defeito: ' + naoMarcados.join(', '), margem, y, { maxWidth: W - margem * 2 });
      }

      // ══════════════════════════════════════════════════
      // PÁGINAS DE FOTO AMPLIADA — uma por foto
      // ══════════════════════════════════════════════════
      for (const defeito of defeitos_com_foto) {
        const fotos = fotosDefeito[defeito] || [];
        for (let i = 0; i < fotos.length; i++) {
          doc.addPage();
          cabecalhoMini();

          const src = fotos[i];
          const PAD = 12;
          const areaY = 14;
          const areaH = H - areaY - 20; // reserva rodapé
          const areaW = W - PAD * 2;

          // Fundo da página
          doc.setFillColor(18, 18, 18);
          doc.rect(0, areaY, W, areaH + 2, 'F');

          // Tentar renderizar a foto em tamanho máximo (com correção de orientação EXIF)
          try {
            const { dataUrl: srcCorrigido, width: imgW, height: imgH } = await prepararFotoParaPdf(src);
            const ratio = imgW / imgH;
            let iW = areaW - 4;
            let iH = iW / ratio;
            if (iH > areaH - 4) { iH = areaH - 4; iW = iH * ratio; }
            const ix = PAD + (areaW - iW) / 2;
            const iy = areaY + 2 + (areaH - iH) / 2;
            doc.addImage(srcCorrigido, 'JPEG', ix, iy, iW, iH, undefined, 'SLOW');
          } catch {
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text('Imagem não disponível', W / 2, areaY + areaH / 2, { align: 'center' });
          }

          // Rodapé da página de foto
          doc.setFillColor(13, 40, 24);
          doc.rect(0, H - 18, W, 18, 'F');
          doc.setFontSize(9);
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.text(defeito, margem, H - 10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(180, 220, 180);
          doc.setFontSize(7.5);
          doc.text(`Foto ${i + 1} de ${fotos.length}`, W - margem, H - 10, { align: 'right' });

          // Link "← voltar ao resumo" (página 1)
          doc.setFontSize(7);
          doc.setTextColor(34, 197, 94);
          doc.text('← voltar ao resumo', margem, H - 4);
          doc.link(margem, H - 7, 38, 5, { pageNumber: 1 });
        }
      }

      // ── Rodapé em todas as páginas ────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        if (p === 1) {
          // Apenas na página de resumo
          doc.setFontSize(7);
          doc.setTextColor(180, 180, 180);
          doc.setFont('helvetica', 'normal');
          doc.text('Car Pintura Pro · Check List de Defeitos', margem, 293);
          doc.text(`Pág. ${p} / ${totalPages}`, W - margem, 293, { align: 'right' });
        }
      }

      const nomeArquivo = `checklist_${nomeVeiculo.replace(/\s+/g, '_').toLowerCase()}_${servico.data_servico || 'sem_data'}.pdf`;
      doc.save(nomeArquivo);
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setGerandoPdf(false);
    }
  };

  // ---- Defeitos ----
  // Clicar no QUADRADO: marca/desmarca (desmarca só se não tiver fotos)
  const handleToggleCheckbox = (defeito: string) => {
    if (!servico) return;
    const marcado = defeitosSelecionados.includes(defeito);
    const fotos = fotosDefeito[defeito] || [];
    if (marcado && fotos.length > 0) return; // bloqueado — tem fotos
    if (marcado) {
      // Desmarca e colapsa
      const novo = defeitosSelecionados.filter(d => d !== defeito);
      setDefeitosSelecionados(novo);
      localStorage.setItem(`defeitos_${servico.id}`, JSON.stringify(novo));
      setDefeitosExpandidos(prev => prev.filter(d => d !== defeito));
    } else {
      // Marca e expande
      const novo = [...defeitosSelecionados, defeito];
      setDefeitosSelecionados(novo);
      localStorage.setItem(`defeitos_${servico.id}`, JSON.stringify(novo));
      setDefeitosExpandidos(prev => [...prev, defeito]);
    }
  };

  // Clicar no NOME: toggle expandir/colapsar (mantém marcado se tiver fotos)
  const handleToggleExpansao = (defeito: string) => {
    setDefeitosExpandidos(prev =>
      prev.includes(defeito) ? prev.filter(d => d !== defeito) : [...prev, defeito]
    );
  };

  // Compatibilidade legada
  const toggleDefeito = handleToggleCheckbox;

  // ---- Defeito customizado ----
  const handleCriarDefeitoCustom = () => {
    if (!servico || !novoDefeitoTexto.trim()) return;
    const nome = novoDefeitoTexto.trim();
    // Não duplicar com opções padrão ou já existentes
    const todasOpcoes = [...DEFEITOS_OPCOES, ...defeitosCustom];
    if (todasOpcoes.some(d => d.toLowerCase() === nome.toLowerCase())) {
      setNovoDefeitoTexto('');
      setMostrarInputNovoDefeito(false);
      return;
    }
    // Inserir no INÍCIO da lista de custom
    const novosCustom = [nome, ...defeitosCustom];
    setDefeitosCustom(novosCustom);
    localStorage.setItem(`defeitos_custom_${servico.id}`, JSON.stringify(novosCustom));
    // Já marcar e expandir o defeito recém criado
    const novosSel = [...defeitosSelecionados, nome];
    setDefeitosSelecionados(novosSel);
    localStorage.setItem(`defeitos_${servico.id}`, JSON.stringify(novosSel));
    setDefeitosExpandidos(prev => [...prev, nome]);
    setNovoDefeitoTexto('');
    setMostrarInputNovoDefeito(false);
  };

  const handleRemoverDefeitoCustom = (nome: string) => {
    if (!servico) return;
    const fotos = fotosDefeito[nome] || [];
    if (fotos.length > 0) return; // não remove se tiver fotos
    const novosCustom = defeitosCustom.filter(d => d !== nome);
    setDefeitosCustom(novosCustom);
    localStorage.setItem(`defeitos_custom_${servico.id}`, JSON.stringify(novosCustom));
    const novosSel = defeitosSelecionados.filter(d => d !== nome);
    setDefeitosSelecionados(novosSel);
    localStorage.setItem(`defeitos_${servico.id}`, JSON.stringify(novosSel));
    setDefeitosExpandidos(prev => prev.filter(d => d !== nome));
  };

  // ---- Fotos de defeito ----
  const handleAdicionarFotoDefeito = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!defeitoFotoAlvo || !servico) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const alvo = defeitoFotoAlvo;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const { dataUrl: novaFoto } = await prepararFotoParaPdf(dataUrl);
      const fotosAtuais = fotosDefeito[alvo] || [];
      const novasFotosDefeito = { ...fotosDefeito, [alvo]: [...fotosAtuais, novaFoto] };
      setFotosDefeito(novasFotosDefeito);
      localStorage.setItem(`defeitos_fotos_${servico.id}`, JSON.stringify(novasFotosDefeito));
      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);
      await updateServicoHook(servico.id, { fotos: novasFotos });
      setServico({ ...servico, fotos: novasFotos });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoverFotoDefeito = async (defeito: string, idx: number) => {
    if (!servico) return;
    const fotosAtuais = fotosDefeito[defeito] || [];
    const fotoRemovida = fotosAtuais[idx];
    const novasFotosDefeito = { ...fotosDefeito, [defeito]: fotosAtuais.filter((_, i) => i !== idx) };
    setFotosDefeito(novasFotosDefeito);
    localStorage.setItem(`defeitos_fotos_${servico.id}`, JSON.stringify(novasFotosDefeito));
    // Remove da galeria também
    const novasFotos = fotos.filter(f => f !== fotoRemovida);
    setFotos(novasFotos);
    const atualizacao: Partial<Servico> = { fotos: novasFotos };
    if (servico.foto_perfil_url === fotoRemovida) atualizacao.foto_perfil_url = novasFotos[0] || undefined;
    await updateServicoHook(servico.id, atualizacao);
    setServico({ ...servico, ...atualizacao });
  };

  // ---- Fotos ----
  const handleAdicionarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      const { dataUrl: novaFoto } = await prepararFotoParaPdf(dataUrl);
      const novasFotos = [...fotos, novaFoto];
      setFotos(novasFotos);
      const atualizacao: Partial<Servico> = { fotos: novasFotos };
      if (fotos.length === 0) atualizacao.foto_perfil_url = novaFoto;
      if (servico) {
        await updateServicoHook(servico.id, atualizacao);
        setServico({ ...servico, ...atualizacao });
      }
    };
    reader.readAsDataURL(file);
    setMostrarOpcoesFoto(false);
    e.target.value = '';
  };

  const handleRemoverFoto = async (index: number) => {
    const fotoRemovida = fotos[index];
    const novasFotos = fotos.filter((_, i) => i !== index);
    setFotos(novasFotos);
    if (servico) {
      const atualizacao: Partial<Servico> = { fotos: novasFotos };
      if (servico.foto_perfil_url === fotoRemovida) {
        atualizacao.foto_perfil_url = novasFotos.length > 0 ? novasFotos[0] : undefined;
      }
      await updateServicoHook(servico.id, atualizacao);
      setServico({ ...servico, ...atualizacao });
    }
  };

  const handleDefinirComoFotoPerfil = async (foto: string) => {
    if (servico) {
      await updateServicoHook(servico.id, { foto_perfil_url: foto });
      setServico({ ...servico, foto_perfil_url: foto });
    }
  };

  const abrirGaleria = () => { fileInputRef.current?.click(); setMostrarOpcoesFoto(false); };
  const abrirCamera = () => { cameraInputRef.current?.click(); setMostrarOpcoesFoto(false); };

  // ---- Modal de edição ----
  const abrirModalEdicao = (campo: string, valorAtual: any) => {
    setModalAberto(campo);
    setValorModal(valorAtual);
  };

  const salvarEdicaoModal = async () => {
    if (!servico || !modalAberto) return;
    const atualizacao: Partial<Servico> = {};
    switch(modalAberto) {
      case 'nome_veiculo': atualizacao.nome_veiculo = valorModal; break;
      case 'cliente_nome': atualizacao.cliente_nome = valorModal; break;
      case 'telefone_cliente': atualizacao.telefone_cliente = valorModal; break;
      case 'cliente_email': atualizacao.cliente_email = valorModal; break;
      case 'cliente_endereco': atualizacao.cliente_endereco = valorModal; break;
      case 'carro_info':
        atualizacao.carro_marca = valorModal.marca;
        atualizacao.carro_modelo = valorModal.modelo;
        atualizacao.carro_ano = valorModal.ano;
        break;
      case 'carro_placa': atualizacao.carro_placa = valorModal; break;
      case 'cor_original': atualizacao.cor_original = valorModal; break;
      case 'valor_cobrado': atualizacao.valor_cobrado = parseFloat(valorModal) || 0; break;
      case 'status': atualizacao.status = valorModal; break;
      case 'data_servico': atualizacao.data_servico = valorModal; break;
      case 'servico_descricao': atualizacao.servico_descricao = valorModal; break;
      case 'forma_pagamento': atualizacao.forma_pagamento = valorModal; break;
      case 'observacoes': atualizacao.observacoes = valorModal; break;
      case 'custo_materiais': atualizacao.custo_materiais = parseFloat(valorModal) || 0; break;
      case 'custo_terceiros': atualizacao.custo_terceiros = parseFloat(valorModal) || 0; break;
      case 'outras_despesas_vinculadas': atualizacao.outras_despesas_vinculadas = parseFloat(valorModal) || 0; break;
      case 'nota_perfil':
        if (servico) { saveProfileNote(servico.id, NOTA_PROFILE_KEY, valorModal, notaCategorias); setNotaPerfil(valorModal); }
        setModalAberto(null); setValorModal(''); return;
    }
    await updateServicoHook(servico.id, atualizacao);
    const servicoAtualizado = { ...servico, ...atualizacao };
    setServico(servicoAtualizado);

    // Sincroniza dados do cliente com a lista global
    const camposCliente = ['cliente_nome', 'telefone_cliente', 'cliente_email', 'cliente_endereco'];
    const camposSecundarios = ['telefone_cliente', 'cliente_email', 'cliente_endereco'];
    if (camposCliente.includes(modalAberto) && servicoAtualizado.cliente_nome?.trim()) {
      // Se alterou dado secundário e tem cliente vinculado, perguntar se atualiza cadastro global
      if (camposSecundarios.includes(modalAberto) && clienteVinculadoId) {
        setPendingClienteUpdate({ campo: modalAberto, valorNovo: valorModal, clienteId: clienteVinculadoId });
        setModalConfirmAtualizacao(true);
      } else {
        // Cria novo cliente ou atualiza sem confirmação (mudança de nome)
        const cli = adicionarOuAtualizarCliente({
          nome: servicoAtualizado.cliente_nome,
          telefone: servicoAtualizado.telefone_cliente,
          email: servicoAtualizado.cliente_email,
          endereco: servicoAtualizado.cliente_endereco,
        });
        setClienteVinculadoId(cli.id);
      }
    }

    setModalAberto(null); setValorModal('');
  };

  // Confirmar atualização dos dados globais do cliente
  const confirmarAtualizacaoCliente = async (atualizar: boolean) => {
    if (atualizar && pendingClienteUpdate && servico) {
      if (pendingClienteUpdate.campo === '__drawer__') {
        // Atualiza todos os campos do formulário do drawer
        atualizarCliente(pendingClienteUpdate.clienteId, {
          telefone: dadosClienteForm.telefone.trim(),
          email: dadosClienteForm.email.trim(),
          endereco: dadosClienteForm.endereco.trim(),
        });
      } else {
        const mapa: Record<string, keyof Pick<Cliente, 'telefone' | 'email' | 'endereco'>> = {
          telefone_cliente: 'telefone',
          cliente_email: 'email',
          cliente_endereco: 'endereco',
        };
        const campoCliente = mapa[pendingClienteUpdate.campo];
        if (campoCliente) {
          atualizarCliente(pendingClienteUpdate.clienteId, { [campoCliente]: pendingClienteUpdate.valorNovo });
        }
      }
    }
    setPendingClienteUpdate(null);
    setModalConfirmAtualizacao(false);
  };

  const fecharModal = () => { setModalAberto(null); setValorModal(''); };

  // ---- Vincular despesa ----
  const handleVincularDespesa = async () => {
    if (!servico) return;
    const valor = parseFloat(novaDespesa.valor);
    if (isNaN(valor) || valor <= 0) return;
    setSalvandoDespesa(true);
    try {
      await addDespesa({
        data_despesa: novaDespesa.data_despesa,
        tipo_despesa: categoriasDespesa.length > 0 ? (categoriasDespesa[0] as TipoDespesa) : novaDespesa.tipo_despesa,
        categorias: categoriasDespesa.length > 0 ? categoriasDespesa : undefined,
        descricao: novaDespesa.descricao.trim() || servico?.nome_veiculo || 'Despesa',
        valor,
        relacionado_a_servico: true,
        observacoes: novaDespesa.observacoes,
        origem: 'manual',
        servico_id: servico.id,
        forma_pagamento: novaDespesa.forma_pagamento as any,
        status_pagamento: novaDespesa.status_pagamento,
      });
      setModalDespesaAberto(false);
      setCategoriasDespesa([]);
      setNovaDespesa({ descricao: '', valor: '', tipo_despesa: 'Outros', data_despesa: new Date().toISOString().split('T')[0], forma_pagamento: 'Dinheiro', observacoes: '', status_pagamento: 'pendente' });
    } catch (err) {
      console.error('Erro ao vincular despesa:', err);
    } finally {
      setSalvandoDespesa(false);
    }
  };

  const handleRemoverDespesaVinculada = async (id: string) => {
    if (!confirm('Deseja remover esta despesa?')) return;
    await deleteDespesa(id);
  };

  const duplicarServico = async () => {
    if (!servico) return;
    const { id, lucro_liquido, ...servicoSemId } = servico;
    await adicionarServico({ ...servicoSemId, nome_veiculo: `${servico.nome_veiculo} (Cópia)`, status: 'Orçamento' as StatusServico });
    router.push('/servicos');
  };

  const excluirServico = async () => {
    if (!servico) return;
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      await deleteServicoHook(servico.id);
      router.push('/servicos');
    }
  };

  const handleCompartilharServico = async () => {
    if (!servico) return;
    const { formatarMoeda: fmt } = await import('@/lib/storage');
    const data = new Date(servico.data_servico).toLocaleDateString('pt-BR');
    const valor = fmt(servico.valor_cobrado || servico.valor_servico || 0);
    const linha = '─────────────────────────';
    const texto = [
      `🚗 *${servico.nome_veiculo || [servico.carro_marca, servico.carro_modelo].filter(Boolean).join(' ') || 'Veículo'}*`,
      servico.carro_placa ? `   🔖 Placa: ${servico.carro_placa}` : '',
      `   👤 ${servico.cliente_nome || 'Cliente não informado'}`,
      servico.telefone_cliente ? `   📱 ${servico.telefone_cliente}` : '',
      `   📆 Data: ${data}`,
      linha,
      `   💰 Valor: *${valor}*`,
      `   🏷️ Status: ${servico.status || 'Não informado'}`,
      servico.servico_descricao ? `   🔧 Serviço: ${servico.servico_descricao}` : '',
      servico.observacoes ? `   📝 Obs: ${servico.observacoes}` : '',
    ].filter(Boolean).join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: 'Detalhes do Serviço' });
      } catch {}
    } else {
      await navigator.clipboard.writeText(texto);
      alert('Texto copiado! Cole no WhatsApp ou outro app.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!servico) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Serviço não encontrado</p>
          <Button onClick={() => router.push('/servicos')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Voltar para serviços
          </Button>
        </div>
      </div>
    );
  }

  const totalDespesasVinculadas = despesasVinculadas.reduce((acc, d) => acc + d.valor, 0);
  const custoTotal = servico.custo_materiais + servico.custo_terceiros + (servico.outras_despesas_vinculadas || 0) + totalDespesasVinculadas;
  const lucro = servico.valor_cobrado - custoTotal;

  // ---- Dados dos painéis ----
  const paineis = [
    {
      id: 'valor' as PainelTipo,
      titulo: 'Valor e Orçamento',
      icone: <Wallet className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-emerald-900',
      corFundo: 'bg-emerald-800',
      resumo: servico.valor_cobrado > 0 ? formatarMoeda(servico.valor_cobrado) : 'Não informado',
      preenchido: !!servico.valor_cobrado && !!servico.status,
    },
    {
      id: 'cliente' as PainelTipo,
      titulo: 'Dados do Cliente',
      icone: <User className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-blue-900',
      corFundo: 'bg-blue-800',
      resumo: servico.cliente_nome || 'Não informado',
      preenchido: !!servico.cliente_nome && !!servico.telefone_cliente && !!servico.cliente_email && !!servico.cliente_endereco,
    },
    {
      id: 'carro' as PainelTipo,
      titulo: 'Dados do Carro',
      icone: <Car className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-purple-900',
      corFundo: 'bg-purple-800',
      resumo: servico.carro_marca ? `${servico.carro_marca} ${servico.carro_modelo}` : 'Não informado',
      preenchido: !!servico.carro_marca && !!servico.carro_modelo && !!servico.carro_placa && !!servico.carro_ano && !!servico.cor_original,
    },
    {
      id: 'despesas' as PainelTipo,
      titulo: 'Vincular Despesas',
      icone: <Receipt className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-red-900',
      corFundo: 'bg-red-800',
      resumo: despesasVinculadas.length > 0 ? `${despesasVinculadas.length} despesa(s)` : 'Nenhuma vinculada',
      preenchido: despesasVinculadas.length > 0,
    },
    {
      id: 'defeitos' as PainelTipo,
      titulo: 'Check List de Defeitos',
      icone: <CheckSquare className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-amber-900',
      corFundo: 'bg-amber-800',
      resumo: defeitosSelecionados.length > 0 ? `${defeitosSelecionados.length} defeito(s)` : 'Nenhum marcado',
      preenchido: defeitosSelecionados.length > 0,
    },
    {
      id: 'categorias' as PainelTipo,
      titulo: 'Categorias',
      icone: <Tag className="w-7 h-7" />,
      cor: '',
      corTexto: 'text-white',
      corBorda: 'border-indigo-900',
      corFundo: 'bg-indigo-800',
      resumo: notaCategorias.length > 0 ? `${notaCategorias.length} categoria(s)` : 'Nenhuma atribuída',
      preenchido: notaCategorias.length > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-gray-600 hover:bg-gray-100 min-h-[44px] min-w-[44px]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={handleCompartilharServico} className="text-green-600 hover:bg-green-50 min-h-[44px] min-w-[44px]">
                <Share2 className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={excluirServico} className="text-red-500 hover:bg-red-50 min-h-[44px] min-w-[44px]">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Perfil do serviço */}
          <div className="flex items-center gap-4">
            {servico.foto_perfil_url ? (
              <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-emerald-400/50">
                <img src={servico.foto_perfil_url} alt="Foto do veículo" className="w-full h-full object-cover" style={{ imageOrientation: 'from-image' }} />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center flex-shrink-0">
                <Car className="w-7 h-7 text-emerald-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              {editandoNome ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={nomeInputRef}
                    value={nomeEditado}
                    onChange={e => setNomeEditado(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') salvarNome(); if (e.key === 'Escape') cancelarEdicaoNome(); }}
                    className="text-lg font-bold text-gray-900 border-b-2 border-emerald-500 bg-transparent outline-none w-full min-w-0"
                  />
                  <button onClick={salvarNome} className="text-emerald-600 hover:text-emerald-700 flex-shrink-0 p-1">
                    <Check className="w-4 h-4" />
                  </button>
                  <button onClick={cancelarEdicaoNome} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group cursor-pointer" onClick={iniciarEdicaoNome}>
                  <h1 className="text-lg font-bold text-gray-900 truncate">
                    {servico.nome_veiculo || `${servico.carro_marca} ${servico.carro_modelo}`}
                  </h1>
                  <Edit2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                </div>
              )}
              <p className={`text-sm flex items-center gap-1 ${servico.cliente_nome ? 'text-gray-500' : 'text-gray-300 italic'}`}>
                {clienteVinculadoId && servico.cliente_nome && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                )}
                {servico.cliente_nome || 'Cliente não informado'}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-emerald-600">{formatarMoeda(servico.valor_cobrado)}</p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                servico.status === 'Finalizado' || servico.status === 'Pago' ? 'bg-emerald-100 text-emerald-700' :
                servico.status === 'Em andamento' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {servico.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="max-w-4xl mx-auto px-4 pt-5 pb-2">
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Completude do cadastro</span>
            <span className="text-2xl font-bold" style={{ color: corProgresso }}>{progresso}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progresso}%`, backgroundColor: corProgresso }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {progresso < 30 ? 'Cadastro básico — adicione mais informações' :
             progresso < 60 ? 'Em progresso — continue preenchendo' :
             progresso < 90 ? 'Quase completo!' :
             'Cadastro completo!'}
          </p>
        </div>
      </div>

      {/* Grid de painéis */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 gap-3 mt-3">
          {paineis.map((painel) => (
            <button
              key={painel.id}
              onClick={() => setPainelAtivo(painel.id)}
              className={`relative text-left rounded-2xl border p-4 transition-all duration-200 active:scale-95 ${painel.corFundo} ${painel.corBorda} hover:brightness-110`}
            >
              {/* Indicador de preenchido */}
              <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${painel.preenchido ? 'bg-white' : 'bg-white/40'}`} />

              <div className="text-white mb-3">
                {painel.icone}
              </div>
              <p className="text-white font-bold text-sm leading-tight mb-1">{painel.titulo}</p>
              <p className={`text-xs truncate ${isValorVazio(painel.resumo) ? 'text-white/30 italic' : 'text-white/80'}`}>{isValorVazio(painel.resumo) ? 'Não preenchido' : painel.resumo}</p>
              <ChevronRight className="w-4 h-4 text-white/60 mt-2" />
            </button>
          ))}

          {/* Painel de galeria (ocupa largura total) */}
          <button
            className="col-span-2 relative text-left rounded-2xl border border-teal-900 bg-teal-800 p-4 transition-all duration-200 active:scale-95 hover:brightness-110"
            onClick={() => setPainelAtivo('galeria')}
          >
            <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full" style={{ backgroundColor: fotos.length > 0 ? 'white' : 'rgba(255,255,255,0.4)' }} />
            <div className="flex items-center gap-3">
              <ImageIcon className="w-7 h-7 text-white" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Galeria do Veículo</p>
                <p className="text-white/80 text-xs">{fotos.length > 0 ? `${fotos.length} foto(s) adicionada(s)` : 'Nenhuma foto ainda'}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60" />
            </div>

            {/* Preview das fotos */}
            {fotos.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {fotos.slice(0, 5).map((foto, idx) => (
                  <img
                    key={idx}
                    src={foto}
                    alt={`Foto ${idx + 1}`}
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    style={{ imageOrientation: 'from-image' }}
                    onClick={(e) => { e.stopPropagation(); setFotoSelecionada(foto); }}
                  />
                ))}
              </div>
            )}
          </button>
        </div>

        {/* Inputs ocultos de foto (mantidos para abrirCamera / abrirGaleria) */}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAdicionarFoto} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} aria-hidden="true" />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleAdicionarFoto} style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }} aria-hidden="true" />
      </div>

      {/* ===== DRAWERS dos painéis ===== */}

      {/* Drawer: Valor e Orçamento */}
      {painelAtivo === 'valor' && (
        <DrawerPainel titulo="Valor e Orçamento" onFechar={() => setPainelAtivo(null)}>
          <div className="space-y-4">
            <CampoEdicao label="Valor cobrado" valor={formatarMoeda(servico.valor_cobrado)} onClick={() => abrirModalEdicao('valor_cobrado', servico.valor_cobrado)} icone={<DollarSign className="w-4 h-4" />} destaque />
            <CampoEdicao label="Status" valor={servico.status} onClick={() => abrirModalEdicao('status', servico.status)} icone={<Tag className="w-4 h-4" />} />
            <CampoEdicao label="Data do serviço" valor={formatarData(servico.data_servico)} onClick={() => abrirModalEdicao('data_servico', servico.data_servico)} icone={<Calendar className="w-4 h-4" />} />
            <CampoEdicao label="Forma de pagamento" valor={servico.forma_pagamento || 'Não informado'} onClick={() => abrirModalEdicao('forma_pagamento', servico.forma_pagamento)} icone={<CreditCard className="w-4 h-4" />} />
            <CampoEdicao label="Categoria do serviço" valor={servico.servico_descricao || 'Não informado'} onClick={() => abrirModalEdicao('servico_descricao', servico.servico_descricao)} icone={<Tag className="w-4 h-4" />} />
            <CampoEdicao label="Observações" valor={servico.observacoes || 'Nenhuma'} onClick={() => abrirModalEdicao('observacoes', servico.observacoes)} icone={<FileText className="w-4 h-4" />} multiline />

            {/* Resumo financeiro */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Resumo financeiro</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Receita</span>
                <span className="text-emerald-600 font-semibold">{formatarMoeda(servico.valor_cobrado)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Despesas vinculadas</span>
                <span className="text-red-500">-{formatarMoeda(totalDespesasVinculadas)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-gray-900 font-semibold">Lucro líquido</span>
                <span className={`font-bold text-lg ${lucro >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatarMoeda(lucro)}</span>
              </div>
            </div>

            {/* Lista de despesas vinculadas */}
            {despesasVinculadas.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide px-1">Despesas vinculadas</p>
                {despesasVinculadas.map(d => (
                  <div key={d.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{d.descricao}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {d.categorias && d.categorias.length > 0 && (
                          <span className="text-xs text-gray-400">{d.categorias[0]}</span>
                        )}
                        <span className={`text-xs font-medium ${d.status_pagamento === 'pago' ? 'text-emerald-600' : 'text-orange-500'}`}>
                          {d.status_pagamento === 'pago' ? 'Pago' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-red-500 ml-3">-{formatarMoeda(d.valor)}</span>
                  </div>
                ))}
              </div>
            )}

          </div>
        </DrawerPainel>
      )}

      {/* Drawer: Dados do Cliente — Integrado com base global */}
      {painelAtivo === 'cliente' && (
        <DrawerPainel titulo="Dados do Cliente" onFechar={() => { setPainelAtivo(null); setSugestoesDrawer([]); }}>
          <div className="space-y-4">
            {/* Indicador de cliente vinculado */}
            {clienteVinculadoId ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs text-emerald-700 font-medium">Cliente vinculado ao cadastro geral</p>
              </div>
            ) : dadosClienteForm.nome ? (
              <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">Novo cliente — será cadastrado ao salvar</p>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">Digite o nome para buscar ou cadastrar um cliente</p>
              </div>
            )}

            {/* Campo busca / nome */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Nome do cliente *</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={dadosClienteForm.nome}
                  onChange={(e) => {
                    const v = e.target.value;
                    setDadosClienteForm(prev => ({ ...prev, nome: v }));
                    setBuscaClienteDrawer(v);
                    if (v.trim().length >= 1) {
                      const resultados = buscarClientes(v);
                      setSugestoesDrawer(resultados.slice(0, 6));
                    } else {
                      setSugestoesDrawer([]);
                    }
                    // Se o nome mudou, desvincula o cliente atual
                    if (clienteVinculadoId) {
                      const clientes = carregarClientes();
                      const cli = clientes.find(c => c.id === clienteVinculadoId);
                      if (cli && cli.nome.toLowerCase() !== v.toLowerCase()) {
                        setClienteVinculadoId(null);
                      }
                    }
                  }}
                  placeholder="Digite o nome do cliente..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                  autoFocus
                />
                {dadosClienteForm.nome && (
                  <button
                    type="button"
                    onClick={() => {
                      setDadosClienteForm({ nome: '', telefone: '', email: '', endereco: '' });
                      setSugestoesDrawer([]);
                      setClienteVinculadoId(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Lista de sugestões */}
              {sugestoesDrawer.length > 0 && (
                <div className="mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {sugestoesDrawer.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setDadosClienteForm({
                          nome: c.nome,
                          telefone: c.telefone || '',
                          email: c.email || '',
                          endereco: c.endereco || '',
                        });
                        setClienteVinculadoId(c.id);
                        setSugestoesDrawer([]);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-emerald-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-emerald-700">{c.nome.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                        {c.telefone && <p className="text-xs text-gray-400 truncate">{c.telefone}</p>}
                        {c.email && <p className="text-xs text-gray-400 truncate">{c.email}</p>}
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Nenhum resultado */}
              {buscaClienteDrawer.trim().length >= 2 && sugestoesDrawer.length === 0 && !clienteVinculadoId && (
                <div className="mt-1 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-700">Novo cliente "{dadosClienteForm.nome}" — preencha os dados abaixo</p>
                </div>
              )}
            </div>

            {/* Campos adicionais — sempre visíveis */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Telefone / WhatsApp</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><Phone className="w-4 h-4 text-gray-400" /></div>
                <input
                  type="tel"
                  value={dadosClienteForm.telefone}
                  onChange={(e) => setDadosClienteForm(prev => ({ ...prev, telefone: e.target.value }))}
                  placeholder="(00) 00000-0000"
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">E-mail</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><Mail className="w-4 h-4 text-gray-400" /></div>
                <input
                  type="email"
                  value={dadosClienteForm.email}
                  onChange={(e) => setDadosClienteForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Endereço</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><MapPin className="w-4 h-4 text-gray-400" /></div>
                <input
                  type="text"
                  value={dadosClienteForm.endereco}
                  onChange={(e) => setDadosClienteForm(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro..."
                  className="w-full pl-9 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                />
              </div>
            </div>

            {/* Botão Salvar */}
            <div className="pt-2">
              <Button
                onClick={async () => {
                  if (!servico || !dadosClienteForm.nome.trim()) return;

                  const nomeAnterior = servico.cliente_nome?.trim().toLowerCase();
                  const nomeNovo = dadosClienteForm.nome.trim().toLowerCase();
                  const dadosAlterados = clienteVinculadoId && (
                    dadosClienteForm.telefone !== (servico.telefone_cliente || '') ||
                    dadosClienteForm.email !== (servico.cliente_email || '') ||
                    dadosClienteForm.endereco !== (servico.cliente_endereco || '')
                  );

                  // Atualiza o serviço
                  const atualizacao: Partial<Servico> = {
                    cliente_nome: dadosClienteForm.nome.trim(),
                    telefone_cliente: dadosClienteForm.telefone.trim(),
                    cliente_email: dadosClienteForm.email.trim(),
                    cliente_endereco: dadosClienteForm.endereco.trim(),
                  };
                  await updateServicoHook(servico.id, atualizacao);
                  setServico({ ...servico, ...atualizacao });

                  if (dadosAlterados && clienteVinculadoId) {
                    // Pergunta se quer atualizar cadastro global
                    setPendingClienteUpdate({ campo: '__drawer__', valorNovo: '', clienteId: clienteVinculadoId });
                    setModalConfirmAtualizacao(true);
                    setPainelAtivo(null);
                  } else {
                    // Cria ou atualiza cliente na base global sem confirmação
                    const cli = adicionarOuAtualizarCliente({
                      nome: dadosClienteForm.nome.trim(),
                      telefone: dadosClienteForm.telefone.trim(),
                      email: dadosClienteForm.email.trim(),
                      endereco: dadosClienteForm.endereco.trim(),
                    });
                    setClienteVinculadoId(cli.id);
                    setPainelAtivo(null);
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px] rounded-xl font-semibold"
                disabled={!dadosClienteForm.nome.trim()}
              >
                <Check className="w-4 h-4 mr-2" />
                {clienteVinculadoId ? 'Salvar alterações' : 'Cadastrar cliente'}
              </Button>
            </div>
          </div>
        </DrawerPainel>
      )}

      {/* Drawer: Dados do Carro */}
      {painelAtivo === 'carro' && (
        <DrawerPainel titulo="Dados do Carro" onFechar={() => setPainelAtivo(null)}>
          <div className="space-y-4">
            <CampoEdicao label="Marca / Modelo / Ano" valor={`${servico.carro_marca || '?'} ${servico.carro_modelo || '?'} ${servico.carro_ano || '?'}`} onClick={() => abrirModalEdicao('carro_info', { marca: servico.carro_marca, modelo: servico.carro_modelo, ano: servico.carro_ano })} icone={<Car className="w-4 h-4" />} />
            <CampoEdicao label="Placa" valor={servico.carro_placa || 'Não informado'} onClick={() => abrirModalEdicao('carro_placa', servico.carro_placa)} icone={<Tag className="w-4 h-4" />} />
            <CampoEdicao label="Cor original" valor={servico.cor_original || 'Não informado'} onClick={() => abrirModalEdicao('cor_original', servico.cor_original || '')} icone={<FileText className="w-4 h-4" />} />

            {/* Foto do carro */}
            <div>
              <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide mb-3">Foto do carro</p>
              {fotos.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {fotos.map((foto, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={foto} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" style={{ imageOrientation: 'from-image' }} />
                      <button
                        onClick={() => handleRemoverFoto(idx)}
                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      {servico.foto_perfil_url !== foto && (
                        <button
                          onClick={() => handleDefinirComoFotoPerfil(foto)}
                          className="absolute bottom-1 left-1 right-1 bg-black/60 text-white text-xs rounded-lg py-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-center"
                        >
                          Usar como capa
                        </button>
                      )}
                      {servico.foto_perfil_url === foto && (
                        <div className="absolute bottom-1 left-1 right-1 bg-emerald-600/80 text-white text-xs rounded-lg py-0.5 text-center">
                          Capa
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic mb-3">Nenhuma foto adicionada</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={abrirCamera}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Camera className="w-4 h-4" /> Câmera
                </button>
                <button
                  onClick={abrirGaleria}
                  className="flex-1 flex items-center justify-center gap-2 border border-gray-300 rounded-xl py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" /> Galeria
                </button>
              </div>
            </div>
          </div>
        </DrawerPainel>
      )}

      {/* Drawer: Vincular Despesas */}
      {painelAtivo === 'despesas' && (
        <DrawerPainel titulo="Vincular Despesas" onFechar={() => setPainelAtivo(null)}>
          <div className="space-y-4">
            <Button onClick={() => setModalDespesaAberto(true)} className="w-full bg-red-600 hover:bg-red-700 text-white min-h-[48px]">
              <Plus className="w-4 h-4 mr-2" />
              Vincular nova despesa
            </Button>

            {despesasVinculadas.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma despesa vinculada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {despesasVinculadas.map((despesa) => (
                  <div key={despesa.id} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-3">
                    <Receipt className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{despesa.descricao}</p>
                      <p className="text-xs text-gray-500">{despesa.tipo_despesa}</p>
                    </div>
                    <p className="text-sm font-semibold text-red-600 flex-shrink-0">-{formatarMoeda(despesa.valor)}</p>
                    <button onClick={() => handleRemoverDespesaVinculada(despesa.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-500">Total</span>
                  <span className="text-sm font-bold text-red-600">-{formatarMoeda(despesasVinculadas.reduce((acc, d) => acc + d.valor, 0))}</span>
                </div>
              </div>
            )}
          </div>
        </DrawerPainel>
      )}

      {/* Drawer: Checklist de defeitos */}
      {painelAtivo === 'defeitos' && (
        <DrawerPainel titulo="Check List de Defeitos" onFechar={() => setPainelAtivo(null)}>
          <div className="space-y-2">

            {/* Botão Compartilhar PDF */}
            <button
              onClick={gerarPdfChecklist}
              disabled={gerandoPdf || defeitosSelecionados.length === 0}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: defeitosSelecionados.length > 0 ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)' : '#e5e7eb',
                color: defeitosSelecionados.length > 0 ? '#ffffff' : '#9ca3af',
                boxShadow: defeitosSelecionados.length > 0 ? '0 2px 12px rgba(5,150,105,0.3)' : 'none',
              }}
            >
              {gerandoPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  {defeitosSelecionados.length > 0 ? `Compartilhar PDF (${defeitosSelecionados.length} defeito${defeitosSelecionados.length !== 1 ? 's' : ''})` : 'Compartilhar PDF'}
                </>
              )}
            </button>

            <p className="text-xs text-gray-500 mb-1">Marque os defeitos encontrados no veículo</p>
            <p className="text-[10px] text-amber-600 bg-amber-100 rounded-lg px-2 py-1 mb-3">Apague as fotos para poder desmarcar · toque no nome para ver</p>

            {/* Input oculto para foto de defeito */}
            <input
              ref={defeitoFotoInputRef}
              type="file"
              accept="image/*"
              onChange={handleAdicionarFotoDefeito}
              style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
              aria-hidden="true"
            />

            {/* ── Criar nova opção — SEMPRE NO TOPO ── */}
            {mostrarInputNovoDefeito ? (
              <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 space-y-2 mb-1">
                <p className="text-xs text-amber-700 font-semibold">Nova opção personalizada</p>
                <input
                  type="text"
                  value={novoDefeitoTexto}
                  onChange={e => setNovoDefeitoTexto(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCriarDefeitoCustom();
                    if (e.key === 'Escape') { setMostrarInputNovoDefeito(false); setNovoDefeitoTexto(''); }
                  }}
                  placeholder="Ex: Teto amassado, Solda aparente..."
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCriarDefeitoCustom}
                    disabled={!novoDefeitoTexto.trim()}
                    className="flex-1 py-2 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Criar e marcar
                  </button>
                  <button
                    onClick={() => { setMostrarInputNovoDefeito(false); setNovoDefeitoTexto(''); }}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setMostrarInputNovoDefeito(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all text-sm font-medium mb-1"
              >
                <Plus className="w-4 h-4" />
                Criar nova opção
              </button>
            )}

            {/* ── Opções customizadas (topo) + padrão (abaixo) ── */}
            {[...defeitosCustom, ...DEFEITOS_OPCOES].map((defeito) => {
              const marcado = defeitosSelecionados.includes(defeito);
              const fotosItem = fotosDefeito[defeito] || [];
              const expandido = defeitosExpandidos.includes(defeito);
              const temFotos = fotosItem.length > 0;
              const isCustom = defeitosCustom.includes(defeito);
              // Checkbox preenchido se: marcado OU tem fotos
              const checkPreenchido = marcado || temFotos;
              // Painel de fotos visível se: expandido E marcado
              const mostrarFotos = marcado && expandido;

              return (
                <div
                  key={defeito}
                  className={`rounded-xl border transition-all ${checkPreenchido ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}
                >
                  <div className="flex items-center">
                    {/* QUADRADO — marca/desmarca (bloqueado se tiver fotos) */}
                    <button
                      onClick={() => handleToggleCheckbox(defeito)}
                      className={`flex-shrink-0 ml-4 w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                        checkPreenchido
                          ? temFotos && !marcado
                            ? 'bg-amber-300 border-amber-300 cursor-not-allowed'
                            : temFotos && marcado
                              ? 'bg-amber-500 border-amber-500 cursor-not-allowed'
                              : 'bg-amber-500 border-amber-500'
                          : 'border-gray-300 hover:border-amber-400'
                      }`}
                      title={temFotos && marcado ? 'Apague as fotos antes de desmarcar' : undefined}
                    >
                      {checkPreenchido && <Check className="w-3 h-3 text-white" />}
                    </button>

                    {/* NOME — expande/colapsa painel de fotos */}
                    <button
                      onClick={() => {
                        if (!marcado && !temFotos) {
                          // Se não marcado e sem fotos, marcar ao clicar no nome também
                          handleToggleCheckbox(defeito);
                        } else {
                          handleToggleExpansao(defeito);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-3 text-left flex-1 min-w-0"
                    >
                      <span className={`text-sm font-medium flex-1 truncate ${checkPreenchido ? 'text-amber-800' : 'text-gray-700'}`}>
                        {defeito}
                      </span>
                      {temFotos && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full shrink-0">
                          {fotosItem.length} foto{fotosItem.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {marcado && !temFotos && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                      {marcado && (
                        <ChevronDown className={`w-4 h-4 text-amber-400 shrink-0 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                      )}
                    </button>

                    {/* Botão remover (apenas customizados sem fotos) */}
                    {isCustom && !temFotos && !marcado && (
                      <button
                        onClick={() => handleRemoverDefeitoCustom(defeito)}
                        className="pr-3 pl-1 text-gray-300 hover:text-red-400 transition-colors"
                        title="Remover esta opção"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Painel de fotos — visível só quando expandido e marcado */}
                  {mostrarFotos && (
                    <div className="px-4 pb-3 space-y-2 border-t border-amber-100 pt-2 mt-1">
                      {/* Miniaturas */}
                      {fotosItem.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {fotosItem.map((foto, idx) => (
                            <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-amber-200">
                              <img
                                src={foto}
                                alt={`Foto ${defeito} ${idx + 1}`}
                                className="w-full h-full object-cover cursor-pointer"
                                style={{ imageOrientation: 'from-image' }}
                                onClick={() => setFotoSelecionada(foto)}
                              />
                              <button
                                onClick={(e) => { e.stopPropagation(); handleRemoverFotoDefeito(defeito, idx); }}
                                className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Botão adicionar foto */}
                      <button
                        onClick={() => { setDefeitoFotoAlvo(defeito); defeitoFotoInputRef.current?.click(); }}
                        className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        {fotosItem.length > 0 ? `${fotosItem.length} foto(s) · Adicionar mais` : 'Adicionar foto'}
                      </button>
                      {temFotos && (
                        <p className="text-[10px] text-gray-400">
                          Apague todas as fotos para poder desmarcar esta opção
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {defeitosSelecionados.length > 0 && (
              <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 font-semibold">{defeitosSelecionados.length} defeito(s) registrado(s)</p>
                <p className="text-xs text-gray-600 mt-1">{defeitosSelecionados.join(', ')}</p>
              </div>
            )}
          </div>
        </DrawerPainel>
      )}

      {/* Drawer: Categorias */}
      {painelAtivo === 'categorias' && servico && (() => {
        const salvarCat = (novasListas: ListaCategoria[]) => {
          salvarListasStorage(novasListas);
          setCatListas(novasListas);
        };
        const toggleCat = (nome: string) => {
          const novas = notaCategorias.includes(nome)
            ? notaCategorias.filter(c => c !== nome)
            : [...notaCategorias, nome];
          setNotaCategorias(novas);
          saveProfileNote(servico.id, NOTA_PROFILE_KEY, notaPerfil, novas);
        };
        const criarLista = () => {
          if (!catNovaListaNome.trim()) return;
          const nova: ListaCategoria = { id: `lista-${Date.now()}`, nome: catNovaListaNome.trim(), categorias: [] };
          const novas = [nova, ...catListas];
          salvarCat(novas);
          setCatListaAberta(nova.id);
          setCatNovaListaNome('');
          setCatModalNovaLista(false);
        };
        const apagarLista = (listaId: string) => {
          const lista = catListas.find(l => l.id === listaId);
          if (lista) {
            const removidos = lista.categorias.map(c => c.nome);
            const novas = notaCategorias.filter(c => !removidos.includes(c));
            setNotaCategorias(novas);
            saveProfileNote(servico.id, NOTA_PROFILE_KEY, notaPerfil, novas);
          }
          salvarCat(catListas.filter(l => l.id !== listaId));
          if (catListaAberta === listaId) setCatListaAberta(null);
        };
        const criarCategoria = () => {
          if (!catNovaCatNome.trim() || !catListaAlvoId) return;
          const cor = CORES_CAT[Math.floor(Math.random() * CORES_CAT.length)];
          const nova: CategoriaItem = { id: `cat-${Date.now()}`, nome: catNovaCatNome.trim(), icone: 'Tag', cor };
          const novas = catListas.map(l => l.id === catListaAlvoId ? { ...l, categorias: [...l.categorias, nova] } : l);
          salvarCat(novas);
          toggleCat(nova.nome);
          setCatNovaCatNome('');
          setCatModalNovaCat(false);
        };
        const apagarCategoria = (listaId: string, catId: string, catNome: string) => {
          const novas = catListas.map(l => l.id === listaId ? { ...l, categorias: l.categorias.filter(c => c.id !== catId) } : l);
          salvarCat(novas);
          const novasSel = notaCategorias.filter(c => c !== catNome);
          setNotaCategorias(novasSel);
          saveProfileNote(servico.id, NOTA_PROFILE_KEY, notaPerfil, novasSel);
        };

        const listasNaoFixas = catListas.filter(l => !LISTAS_FIXAS_IDS.includes(l.id));
        const listasFixas = catListas.filter(l => LISTAS_FIXAS_IDS.includes(l.id));
        const todasAsListas: ListaCategoria[] = [...listasNaoFixas, ...listasFixas, LISTA_COMUNS_DEFAULT];
        const listasFiltradas = catBusca
          ? todasAsListas.map(l => ({ ...l, categorias: l.categorias.filter(c => c.nome.toLowerCase().includes(catBusca.toLowerCase())) })).filter(l => l.categorias.length > 0)
          : todasAsListas;

        const renderGridCat = (lista: ListaCategoria, isCustom: boolean) => (
          <div className="px-4 pb-4">
            <div className="grid grid-cols-4 gap-2">
              {lista.categorias.map(cat => {
                const sel = notaCategorias.includes(cat.nome);
                return (
                  <div key={cat.id} className="relative group/item">
                    <button
                      onClick={() => toggleCat(cat.nome)}
                      className={`relative w-full flex flex-col items-center gap-1.5 p-2 rounded-xl transition-colors group ${sel ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-gray-50'}`}
                    >
                      {sel && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center z-10">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className={`w-10 h-10 ${cat.cor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Tag className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center line-clamp-2 leading-tight">{cat.nome}</span>
                    </button>
                    {isCustom && (
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
              {isCustom && (
                <button
                  onClick={() => { setCatListaAlvoId(lista.id); setCatNovaCatNome(''); setCatModalNovaCat(true); }}
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
            <DrawerPainel titulo="Categorias" onFechar={() => setPainelAtivo(null)} categoriasSelecionadas={notaCategorias}>
              {/* Busca */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl mb-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar categoria..."
                  value={catBusca}
                  onChange={e => setCatBusca(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
                />
                {catBusca && <button onClick={() => setCatBusca('')}><X className="w-3.5 h-3.5 text-gray-400" /></button>}
              </div>

              {/* Categorias selecionadas */}
              {notaCategorias.length > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 mb-3">
                  <p className="text-xs text-indigo-700 font-semibold mb-1">{notaCategorias.length} atribuída(s)</p>
                  <div className="flex flex-wrap gap-1">
                    {notaCategorias.map(cat => (
                      <span key={cat} className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-600 text-white text-xs rounded-full font-medium">
                        {cat}
                        <button onClick={() => toggleCat(cat)}><X className="w-2.5 h-2.5" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Listas accordion */}
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                {listasFiltradas.map(lista => {
                  const isCustom = lista.id !== 'comuns';
                  const isFixa = !!lista.fixa;
                  const aberta = catListaAberta === lista.id || !!catBusca;
                  const qtdSel = lista.categorias.filter(c => notaCategorias.includes(c.nome)).length;
                  return (
                    <div key={lista.id}>
                      <div className="flex items-center hover:bg-gray-50 transition-colors bg-white">
                        <button
                          onClick={() => setCatListaAberta(aberta && !catBusca ? null : lista.id)}
                          className="flex-1 flex items-center gap-3 px-4 py-3.5 text-left"
                        >
                          <FolderOpen className={`w-4 h-4 shrink-0 ${isFixa ? 'text-blue-400' : isCustom ? 'text-red-400' : 'text-gray-400'}`} />
                          <span className="text-sm font-semibold text-gray-700 flex-1">{lista.nome}</span>
                          {qtdSel > 0 && (
                            <span className="text-xs font-bold text-white bg-indigo-500 rounded-full w-5 h-5 flex items-center justify-center">{qtdSel}</span>
                          )}
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${aberta ? 'rotate-180' : ''}`} />
                        </button>
                        {isCustom && !isFixa && (
                          <button onClick={() => apagarLista(lista.id)} className="px-3 py-3.5 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {aberta && (
                        <div className="bg-gray-50/50">
                          {lista.categorias.length === 0 ? (
                            <div className="px-4 pb-4">
                              <button
                                onClick={() => { setCatListaAlvoId(lista.id); setCatNovaCatNome(''); setCatModalNovaCat(true); }}
                                className="w-full flex flex-col items-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
                              >
                                <div className="w-8 h-8 bg-gray-100 group-hover:bg-indigo-100 rounded-full flex items-center justify-center transition-colors">
                                  <Plus className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                </div>
                                <span className="text-xs text-gray-400 group-hover:text-indigo-500 font-medium transition-colors">Adicionar primeira categoria</span>
                              </button>
                            </div>
                          ) : renderGridCat(lista, isCustom)}
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
              <div className="pt-4">
                <button
                  onClick={() => { setCatNovaListaNome(''); setCatModalNovaLista(true); }}
                  className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-indigo-400 text-indigo-500 hover:text-indigo-600 font-semibold text-sm transition-colors text-gray-500 w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Nova lista de categorias
                </button>
              </div>
            </DrawerPainel>

            {/* Modal criar lista */}
            {catModalNovaLista && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[110]" onClick={() => setCatModalNovaLista(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Nova Lista</h3>
                      <p className="text-xs text-gray-500">Grupo para organizar categorias</p>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Lista *</label>
                  <input
                    type="text"
                    value={catNovaListaNome}
                    onChange={e => setCatNovaListaNome(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && criarLista()}
                    placeholder="Ex: Obras, Escritório, Casa..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setCatModalNovaLista(false)} className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-gray-800 transition-colors">Cancelar</button>
                    <button onClick={criarLista} disabled={!catNovaListaNome.trim()} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors">Criar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Modal criar categoria */}
            {catModalNovaCat && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[110]" onClick={() => setCatModalNovaCat(false)}>
                <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <Tag className="w-5 h-5 text-indigo-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Nova Categoria</h3>
                      <p className="text-xs text-gray-500">Em: <strong>{catListas.find(l => l.id === catListaAlvoId)?.nome}</strong></p>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Categoria *</label>
                  <input
                    type="text"
                    value={catNovaCatNome}
                    onChange={e => setCatNovaCatNome(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && criarCategoria()}
                    placeholder="Ex: Combustível, Cimento..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-black"
                    autoFocus
                  />
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setCatModalNovaCat(false)} className="flex-1 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 font-semibold text-gray-800 transition-colors">Cancelar</button>
                    <button onClick={criarCategoria} disabled={!catNovaCatNome.trim()} className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold transition-colors">Criar</button>
                  </div>
                </div>
              </div>
            )}
          </>
        );
      })()}

      {/* Modal de Edição */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={fecharModal}>
          <div className="bg-white border border-gray-200 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {modalAberto === 'nome_veiculo' && 'Nome do Veículo'}
                {modalAberto === 'cliente_nome' && 'Nome do Cliente'}
                {modalAberto === 'telefone_cliente' && 'Telefone'}
                {modalAberto === 'cliente_email' && 'E-mail'}
                {modalAberto === 'cliente_endereco' && 'Endereço'}
                {modalAberto === 'carro_info' && 'Dados do Veículo'}
                {modalAberto === 'carro_placa' && 'Placa'}
                {modalAberto === 'cor_original' && 'Cor Original'}
                {modalAberto === 'valor_cobrado' && 'Valor Cobrado'}
                {modalAberto === 'status' && 'Status'}
                {modalAberto === 'data_servico' && 'Data do Serviço'}
                {modalAberto === 'servico_descricao' && 'Categoria do Serviço'}
                {modalAberto === 'forma_pagamento' && 'Forma de Pagamento'}
                {modalAberto === 'observacoes' && 'Observações'}
                {modalAberto === 'nota_perfil' && 'Minhas Anotações'}
                {modalAberto === 'custo_materiais' && 'Custo Materiais'}
                {modalAberto === 'custo_terceiros' && 'Custo Terceiros'}
                {modalAberto === 'outras_despesas_vinculadas' && 'Outras Despesas'}
              </h3>
              <Button variant="ghost" size="icon" onClick={fecharModal} className="text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              {(modalAberto === 'nome_veiculo' || modalAberto === 'telefone_cliente' || modalAberto === 'cliente_email' || modalAberto === 'cliente_endereco' || modalAberto === 'carro_placa' || modalAberto === 'cor_original' || modalAberto === 'servico_descricao') && (
                <input type="text" value={valorModal} onChange={(e) => setValorModal(modalAberto === 'carro_placa' ? e.target.value.toUpperCase() : e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" autoFocus />
              )}
              {modalAberto === 'cliente_nome' && (
                <div className="relative">
                  <input
                    type="text"
                    value={valorModal}
                    onChange={(e) => {
                      const v = e.target.value;
                      setValorModal(v);
                      if (v.trim().length >= 1) {
                        setSugestoesCliente(buscarClientes(v).slice(0, 5));
                      } else {
                        setSugestoesCliente([]);
                      }
                    }}
                    placeholder="Nome do cliente..."
                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]"
                    autoFocus
                  />
                  {sugestoesCliente.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {sugestoesCliente.map((c, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setValorModal(c.nome);
                            setSugestoesCliente([]);
                            // Preenche automaticamente todos os campos do cliente
                            if (servico) {
                              const atualizacaoAuto: Partial<Servico> = {
                                cliente_nome: c.nome,
                                telefone_cliente: c.telefone || servico.telefone_cliente,
                                cliente_email: c.email || servico.cliente_email,
                                cliente_endereco: c.endereco || servico.cliente_endereco,
                              };
                              setServico({ ...servico, ...atualizacaoAuto });
                              updateServicoHook(servico.id, atualizacaoAuto);
                              setClienteVinculadoId(c.id);
                            }
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-blue-600">{c.nome.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{c.nome}</p>
                            {c.telefone && <p className="text-xs text-gray-400 truncate">{c.telefone}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {modalAberto === 'carro_info' && (
                <div className="space-y-3">
                  <input type="text" value={valorModal.marca} onChange={(e) => setValorModal({...valorModal, marca: e.target.value})} placeholder="Marca" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" />
                  <input type="text" value={valorModal.modelo} onChange={(e) => setValorModal({...valorModal, modelo: e.target.value})} placeholder="Modelo" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" />
                  <input type="text" value={valorModal.ano} onChange={(e) => setValorModal({...valorModal, ano: e.target.value})} placeholder="Ano" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" />
                </div>
              )}
              {(modalAberto === 'valor_cobrado' || modalAberto === 'custo_materiais' || modalAberto === 'custo_terceiros' || modalAberto === 'outras_despesas_vinculadas') && (
                <input type="number" step="0.01" value={valorModal} onChange={(e) => setValorModal(e.target.value)} placeholder="0,00" className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" autoFocus />
              )}
              {modalAberto === 'data_servico' && (
                <input type="date" value={valorModal} onChange={(e) => setValorModal(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]" autoFocus />
              )}
              {modalAberto === 'forma_pagamento' && (
                <select value={valorModal} onChange={(e) => setValorModal(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]">
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Transferência">Transferência</option>
                </select>
              )}
              {modalAberto === 'status' && (
                <select value={valorModal} onChange={(e) => setValorModal(e.target.value)} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base min-h-[48px]">
                  <option value="Orçamento">Orçamento</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Finalizado">Finalizado</option>
                  <option value="Pago">Pago</option>
                  <option value="Cancelado">Cancelado</option>
                </select>
              )}
              {(modalAberto === 'observacoes' || modalAberto === 'nota_perfil') && (
                <div className="space-y-3">
                  <textarea value={valorModal} onChange={(e) => setValorModal(e.target.value)} placeholder={modalAberto === 'nota_perfil' ? 'Suas anotações pessoais...' : 'Observações...'} rows={4} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base" autoFocus />
                  {modalAberto === 'nota_perfil' && (() => {
                    const cats: string[] = (() => {
                      try {
                        const predefinidas = ['Transporte', 'Água', 'Luz', 'Material', 'Alimentação', 'Aluguel', 'Internet', 'Telefone', 'Manutenção', 'Equipamentos', 'Salários', 'Impostos'];
                        const storage = localStorage.getItem('categorias_personalizadas');
                        const personalizadas: string[] = storage ? JSON.parse(storage).map((c: { nome: string }) => c.nome) : [];
                        return [...new Set([...personalizadas, ...predefinidas])];
                      } catch { return []; }
                    })();
                    return (
                      <div>
                        <p className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Categorias</p>
                        <div className="flex flex-wrap gap-2">
                          {cats.map(cat => {
                            const sel = notaCategorias.includes(cat);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setNotaCategorias(prev => sel ? prev.filter(c => c !== cat) : [...prev, cat])}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${sel ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}
                              >
                                {sel && <Check className="w-3 h-3 inline mr-1" />}{cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
              <Button variant="outline" onClick={fecharModal} className="flex-1 min-h-[48px] border-gray-300 text-gray-700 hover:bg-gray-50">Cancelar</Button>
              <Button onClick={salvarEdicaoModal} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white min-h-[48px]">Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Vincular Despesa */}
      {modalDespesaAberto && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={() => setModalDespesaAberto(false)}>
          <div className="bg-white border border-gray-200 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Vincular despesa</h3>
              <Button variant="ghost" size="icon" onClick={() => setModalDespesaAberto(false)} className="text-gray-500 hover:bg-gray-100 min-h-[44px] min-w-[44px]">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700">Vinculado a: <strong>{servico?.nome_veiculo}</strong></p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Valor (R$) *</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setNovaDespesa(prev => ({ ...prev, status_pagamento: prev.status_pagamento === 'pago' ? 'pendente' : 'pago' }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm transition-colors whitespace-nowrap min-h-[48px] ${
                      novaDespesa.status_pagamento === 'pago'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
                        : 'bg-orange-50 border-orange-300 text-orange-600'
                    }`}
                  >
                    {novaDespesa.status_pagamento === 'pago'
                      ? <><CheckCircle className="w-4 h-4" /> Pago</>
                      : <><Clock className="w-4 h-4" /> Pendente</>
                    }
                  </button>
                  <input type="number" step="0.01" min="0" value={novaDespesa.valor} onChange={(e) => setNovaDespesa(prev => ({ ...prev, valor: e.target.value }))} className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[48px]" placeholder="0,00" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Categorias</label>
                <CategoryFieldButton
                  selecionadas={categoriasDespesa}
                  onClick={() => setModalCategoriasDespesa(true)}
                  accent="red"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Data</label>
                <input type="date" value={novaDespesa.data_despesa} onChange={(e) => setNovaDespesa(prev => ({ ...prev, data_despesa: e.target.value }))} className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 text-base min-h-[48px]" />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-4 flex gap-3">
              <Button variant="outline" onClick={() => setModalDespesaAberto(false)} className="flex-1 min-h-[48px] border-gray-300 text-gray-700 hover:bg-gray-50" disabled={salvandoDespesa}>Cancelar</Button>
              <Button onClick={handleVincularDespesa} className="flex-1 bg-red-600 hover:bg-red-700 text-white min-h-[48px]" disabled={salvandoDespesa || !novaDespesa.valor}>
                {salvandoDespesa ? 'Salvando...' : 'Vincular'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal seleção de categorias da despesa vinculada */}
      <CategorySelectorModal
        isOpen={modalCategoriasDespesa}
        onClose={() => setModalCategoriasDespesa(false)}
        selecionadas={categoriasDespesa}
        onChange={setCategoriasDespesa}
        accent="red"
        zIndex={110}
      />

      {/* Drawer: Galeria do Veículo */}
      {painelAtivo === 'galeria' && (
        <DrawerPainel titulo="Galeria do Veículo" onFechar={() => setPainelAtivo(null)}>
          <div className="space-y-4">
            {/* Botões de adicionar */}
            <div className="flex gap-2">
              <button
                onClick={abrirCamera}
                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <Camera className="w-4 h-4" /> Tirar foto
              </button>
              <button
                onClick={abrirGaleria}
                className="flex-1 flex items-center justify-center gap-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                <ImageIcon className="w-4 h-4" /> Galeria
              </button>
            </div>

            {/* Grid de fotos */}
            {fotos.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhuma foto ainda</p>
                <p className="text-xs text-gray-400 mt-1">Adicione fotos do veículo usando os botões acima</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {fotos.map((foto, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group">
                    <img
                      src={foto}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      style={{ imageOrientation: 'from-image' }}
                      onClick={() => setFotoSelecionada(foto)}
                    />
                    {servico.foto_perfil_url === foto && (
                      <div className="absolute top-1 left-1 bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-md font-medium">
                        Capa
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end justify-center pb-2 gap-1 opacity-0 group-hover:opacity-100">
                      {servico.foto_perfil_url !== foto && (
                        <button
                          onClick={() => handleDefinirComoFotoPerfil(foto)}
                          className="bg-white text-gray-800 text-xs px-2 py-1 rounded-lg font-medium"
                        >
                          Capa
                        </button>
                      )}
                      <button
                        onClick={() => handleRemoverFoto(idx)}
                        className="bg-red-600 text-white text-xs px-2 py-1 rounded-lg font-medium"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <p className="text-xs text-gray-400 text-center">{fotos.length} foto(s) • Toque para ampliar</p>
          </div>
        </DrawerPainel>
      )}

      {/* Modal foto fullscreen */}
      {fotoSelecionada && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4" onClick={() => setFotoSelecionada(null)}>
          <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/20 min-h-[44px] min-w-[44px]" onClick={() => setFotoSelecionada(null)}>
            <X className="w-6 h-6" />
          </Button>
          <img src={fotoSelecionada} alt="Foto ampliada" className="max-w-full max-h-full object-contain" style={{ imageOrientation: 'from-image' }} onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Modal de confirmação: atualizar dados globais do cliente */}
      {modalConfirmAtualizacao && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">Atualizar cadastro geral?</h3>
                <p className="text-xs text-gray-500 mt-0.5">Os dados deste cliente foram alterados neste serviço.</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Deseja atualizar também os dados do cadastro global deste cliente? Isso refletirá em todos os serviços futuros.
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => confirmarAtualizacaoCliente(false)}
                className="flex-1 min-h-[44px] border-gray-300 text-gray-700"
              >
                Apenas aqui
              </Button>
              <Button
                onClick={() => confirmarAtualizacaoCliente(true)}
                className="flex-1 min-h-[44px] bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Atualizar tudo
              </Button>
            </div>
            {/* Botão voltar para reeditar */}
            <button
              type="button"
              onClick={() => {
                setModalConfirmAtualizacao(false);
                setPendingClienteUpdate(null);
                setPainelAtivo('cliente');
              }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors pt-1 flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Voltar e editar novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Componente de Drawer ----
function DrawerPainel({ titulo, onFechar, children, categoriasSelecionadas }: { titulo: string; onFechar: () => void; children: React.ReactNode; categoriasSelecionadas?: string[] }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-end justify-center" onClick={onFechar}>
      <div
        className="bg-white border border-gray-200 w-full max-w-lg rounded-t-3xl max-h-[85vh] flex flex-col shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{titulo}</h2>
            {categoriasSelecionadas && categoriasSelecionadas.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {categoriasSelecionadas.map(cat => (
                  <span key={cat} className="inline-flex items-center px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
          <button onClick={onFechar} className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors ml-2 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---- Componente de Campo Editável ----
const VALORES_VAZIOS = [
  'não informado', 'nao informado', 'nenhuma', 'nenhum',
  'cliente não informado', 'marca não informada', 'sem categoria',
];

function isValorVazio(valor: string): boolean {
  return !valor || VALORES_VAZIOS.includes(valor.toLowerCase().trim());
}

function CampoEdicao({ label, valor, onClick, icone, destaque, multiline, corDestaque }: {
  label: string;
  valor: string;
  onClick: () => void;
  icone?: React.ReactNode;
  destaque?: boolean;
  multiline?: boolean;
  corDestaque?: string;
}) {
  const vazio = isValorVazio(valor);

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-left transition-colors active:scale-[0.98] min-h-[56px] shadow-sm"
    >
      {icone && <span className={`flex-shrink-0 ${vazio ? 'text-gray-300' : 'text-gray-400'}`}>{icone}</span>}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        {vazio ? (
          <p className="text-sm mt-0.5 text-gray-300 italic truncate">
            Toque para adicionar
          </p>
        ) : (
          <p className={`text-sm font-medium mt-0.5 ${destaque ? 'text-emerald-600 text-base font-bold' : corDestaque || 'text-gray-900'} ${multiline ? 'line-clamp-2' : 'truncate'}`}>
            {valor}
          </p>
        )}
      </div>
      <Edit2 className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
    </button>
  );
}
