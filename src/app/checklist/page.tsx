"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Check, Plus, X, AlertTriangle, ChevronDown,
  Camera, FileDown, Loader2, ClipboardList, Trash2,
} from 'lucide-react';

// ─── Defeitos padrão ─────────────────────────────────────────────────────────
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

const STORAGE_KEY_SEL    = 'checklist_universal_selecionados';
const STORAGE_KEY_FOTOS  = 'checklist_universal_fotos';
const STORAGE_KEY_CUSTOM = 'checklist_universal_custom';

export default function ChecklistPage() {
  const router = useRouter();

  const [defeitosSelecionados, setDefeitosSelecionados] = useState<string[]>([]);
  const [fotosDefeito, setFotosDefeito]   = useState<Record<string, string[]>>({});
  const [defeitosCustom, setDefeitosCustom] = useState<string[]>([]);
  const [defeitosExpandidos, setDefeitosExpandidos] = useState<string[]>([]);
  const [mostrarInputNovoDefeito, setMostrarInputNovoDefeito] = useState(false);
  const [novoDefeitoTexto, setNovoDefeitoTexto] = useState('');
  const [defeitoFotoAlvo, setDefeitoFotoAlvo] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [fotoSelecionada, setFotoSelecionada] = useState<string | null>(null);
  const [confirmLimpar, setConfirmLimpar] = useState(false);

  const defeitoFotoInputRef = useRef<HTMLInputElement>(null);

  // ─── Carregar do localStorage ─────────────────────────────────────────────
  useEffect(() => {
    try {
      const sel = localStorage.getItem(STORAGE_KEY_SEL);
      if (sel) setDefeitosSelecionados(JSON.parse(sel));
      const fotos = localStorage.getItem(STORAGE_KEY_FOTOS);
      if (fotos) setFotosDefeito(JSON.parse(fotos));
      const custom = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (custom) setDefeitosCustom(JSON.parse(custom));
    } catch {}
  }, []);

  // ─── Persistir ───────────────────────────────────────────────────────────
  const salvarSel = (v: string[]) => {
    setDefeitosSelecionados(v);
    localStorage.setItem(STORAGE_KEY_SEL, JSON.stringify(v));
  };
  const salvarFotos = (v: Record<string, string[]>) => {
    setFotosDefeito(v);
    localStorage.setItem(STORAGE_KEY_FOTOS, JSON.stringify(v));
  };
  const salvarCustom = (v: string[]) => {
    setDefeitosCustom(v);
    localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(v));
  };

  // ─── Handlers ────────────────────────────────────────────────────────────
  const handleToggleCheckbox = (defeito: string) => {
    const temFotos = (fotosDefeito[defeito] || []).length > 0;
    const marcado  = defeitosSelecionados.includes(defeito);
    if (marcado && temFotos) return; // bloqueado
    if (marcado) {
      salvarSel(defeitosSelecionados.filter(d => d !== defeito));
      setDefeitosExpandidos(prev => prev.filter(d => d !== defeito));
    } else {
      salvarSel([...defeitosSelecionados, defeito]);
      setDefeitosExpandidos(prev => [...prev, defeito]);
    }
  };

  const handleToggleExpansao = (defeito: string) => {
    setDefeitosExpandidos(prev =>
      prev.includes(defeito) ? prev.filter(d => d !== defeito) : [...prev, defeito]
    );
  };

  const handleCriarDefeitoCustom = () => {
    const nome = novoDefeitoTexto.trim();
    if (!nome) return;
    const todos = [...DEFEITOS_OPCOES, ...defeitosCustom];
    if (todos.some(d => d.toLowerCase() === nome.toLowerCase())) {
      alert('Esse defeito já existe.');
      return;
    }
    const novosCustom = [nome, ...defeitosCustom];
    salvarCustom(novosCustom);
    salvarSel([...defeitosSelecionados, nome]);
    setDefeitosExpandidos(prev => [...prev, nome]);
    setNovoDefeitoTexto('');
    setMostrarInputNovoDefeito(false);
  };

  const handleRemoverDefeitoCustom = (nome: string) => {
    const fotos = fotosDefeito[nome] || [];
    if (fotos.length > 0) return;
    salvarCustom(defeitosCustom.filter(d => d !== nome));
    salvarSel(defeitosSelecionados.filter(d => d !== nome));
  };

  const handleAdicionarFotoDefeito = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !defeitoFotoAlvo) return;
    const alvo = defeitoFotoAlvo;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      if (!base64) return;
      // Corrige orientação EXIF antes de salvar para que a foto apareça correta em tela e no PDF
      prepararFotoParaPdf(base64).then(({ dataUrl }) => {
        const fotosAtuais = fotosDefeito[alvo] || [];
        const novas = { ...fotosDefeito, [alvo]: [...fotosAtuais, dataUrl] };
        salvarFotos(novas);
        if (!defeitosSelecionados.includes(alvo)) {
          salvarSel([...defeitosSelecionados, alvo]);
        }
        if (!defeitosExpandidos.includes(alvo)) {
          setDefeitosExpandidos(prev => [...prev, alvo]);
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoverFotoDefeito = (defeito: string, idx: number) => {
    const fotosAtuais = fotosDefeito[defeito] || [];
    const novas = fotosAtuais.filter((_, i) => i !== idx);
    const novoMap = { ...fotosDefeito, [defeito]: novas };
    salvarFotos(novoMap);
  };

  const handleLimparTudo = () => {
    salvarSel([]);
    salvarFotos({});
    salvarCustom([]);
    setDefeitosExpandidos([]);
    setConfirmLimpar(false);
  };

  // ─── Helpers de imagem para jsPDF ────────────────────────────────────────
  const prepararFotoParaPdf = async (src: string): Promise<{ dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = async () => {
        const w = img.naturalWidth;
        const h = img.naturalHeight;

        // Lê orientação EXIF com exifr (confiável para fotos de câmera ao vivo)
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

  // ─── Gerar PDF ────────────────────────────────────────────────────────────
  const gerarPdfChecklist = async () => {
    setGerandoPdf(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const H = 297;
      const margem = 14;

      const todasOpcoes = [...defeitosCustom, ...DEFEITOS_OPCOES];
      const defeitos_com_foto = defeitosSelecionados.filter(d => (fotosDefeito[d] || []).length > 0);
      const defeitos_sem_foto = defeitosSelecionados.filter(d => (fotosDefeito[d] || []).length === 0);

      const cabecalhoMini = () => {
        doc.setFillColor(13, 40, 24);
        doc.rect(0, 0, W, 10, 'F');
        doc.setFontSize(7);
        doc.setTextColor(180, 220, 180);
        doc.setFont('helvetica', 'bold');
        doc.text('CHECK LIST DE DEFEITOS  ·  Car Pintura Pro', margem, 7);
        doc.setFont('helvetica', 'normal');
        doc.text(new Date().toLocaleDateString('pt-BR'), W - margem, 7, { align: 'right' });
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
      doc.text('Universal · sem vínculo com serviço', W - margem, 22, { align: 'right' });
      y = 38;

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
      const pageMap: Record<string, number[]> = {};
      // página 1 = resumo, as fotos começam da 2
      // mas a última página será o Resumo Completo (adicionada depois das fotos)
      let nextPage = 2;
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

          let imgOk = false;
          try {
            const { dataUrl: srcCorrigido } = await prepararFotoParaPdf(src);
            doc.addImage(srcCorrigido, 'JPEG', fx, fy, MINI_W, MINI_H, undefined, 'FAST');
            imgOk = true;
          } catch {
            doc.setFillColor(230, 230, 230);
            doc.roundedRect(fx, fy, MINI_W, MINI_H, 2, 2, 'F');
            doc.setFontSize(7);
            doc.setTextColor(160, 160, 160);
            doc.text('sem imagem', fx + MINI_W / 2, fy + MINI_H / 2, { align: 'center' });
          }

          if (imgOk) {
            doc.setDrawColor(200, 150, 50);
            doc.setLineWidth(0.3);
            doc.roundedRect(fx, fy, MINI_W, MINI_H, 2, 2, 'S');

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
          const areaH = H - areaY - 20;
          const areaW = W - PAD * 2;

          doc.setFillColor(18, 18, 18);
          doc.rect(0, areaY, W, areaH + 2, 'F');

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

          // Link "← voltar ao resumo"
          doc.setFontSize(7);
          doc.setTextColor(34, 197, 94);
          doc.text('← voltar ao resumo', margem, H - 4);
          doc.link(margem, H - 7, 38, 5, { pageNumber: 1 });
        }
      }

      // ══════════════════════════════════════════════════
      // ÚLTIMA PÁGINA — Resumo Completo (todos os defeitos)
      // ══════════════════════════════════════════════════
      if (todasOpcoes.length > 0) {
        doc.addPage();
        cabecalhoMini();
        let yr = 18;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(13, 40, 24);
        doc.text('Resumo Completo', margem, yr);
        doc.setDrawColor(34, 197, 94);
        doc.setLineWidth(0.5);
        doc.line(margem, yr + 2, W - margem, yr + 2);
        yr += 8;
        for (const defeito of todasOpcoes) {
          if (yr > 280) { doc.addPage(); cabecalhoMini(); yr = 18; }
          const marcado = defeitosSelecionados.includes(defeito);
          doc.setFillColor(marcado ? 34 : 220, marcado ? 197 : 220, marcado ? 94 : 220);
          doc.roundedRect(margem, yr - 3.5, 5, 5, 1, 1, 'F');
          if (marcado) {
            doc.setFontSize(8);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('✓', margem + 1.3, yr + 0.3);
          }
          doc.setFontSize(9.5);
          doc.setFont('helvetica', marcado ? 'bold' : 'normal');
          doc.setTextColor(marcado ? 13 : 130, marcado ? 40 : 130, marcado ? 24 : 130);
          doc.text(defeito, margem + 8, yr);
          const nFotos = (fotosDefeito[defeito] || []).length;
          if (nFotos > 0) {
            doc.setFontSize(7.5);
            doc.setTextColor(245, 158, 11);
            doc.text(`${nFotos} foto(s)`, W - margem, yr, { align: 'right' });
          }
          yr += 7.5;
        }
      }

      // ── Rodapé em todas as páginas ────────────────────────────
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        if (p === 1) {
          doc.setFontSize(7);
          doc.setTextColor(180, 180, 180);
          doc.setFont('helvetica', 'normal');
          doc.text('Car Pintura Pro · Check List de Defeitos', margem, 293);
          doc.text(`Pág. ${p} / ${totalPages}`, W - margem, 293, { align: 'right' });
        }
      }

      doc.save(`checklist-defeitos-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error(err);
      alert('Erro ao gerar PDF.');
    } finally {
      setGerandoPdf(false);
    }
  };

  const totalMarcados = defeitosSelecionados.length;

  return (
    <div className="min-h-screen bg-[#0a1f18] pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-gray-900 truncate">Check List de Defeitos</h1>
            <p className="text-xs text-gray-400">Universal · sem vínculo com serviço</p>
          </div>

          {/* Botão limpar tudo */}
          {totalMarcados > 0 && (
            <button
              onClick={() => setConfirmLimpar(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </button>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-3">

        {/* Banner de total */}
        <div className="bg-amber-500 rounded-2xl px-5 py-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-black text-lg leading-none">{totalMarcados}</p>
              <p className="text-white/80 text-xs">defeito{totalMarcados !== 1 ? 's' : ''} marcado{totalMarcados !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={gerarPdfChecklist}
            disabled={gerandoPdf || totalMarcados === 0}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-amber-600 shadow disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-50 transition-colors"
          >
            {gerandoPdf ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Gerando...</>
            ) : (
              <><FileDown className="w-4 h-4" />Exportar PDF</>
            )}
          </button>
        </div>

        <p className="text-xs text-gray-400 px-1">Marque os defeitos encontrados no veículo. Adicione fotos para cada item.</p>
        <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          Apague as fotos para poder desmarcar · toque no nome para ver detalhes
        </p>

        {/* Input foto oculto */}
        <input
          ref={defeitoFotoInputRef}
          type="file"
          accept="image/*"
          onChange={handleAdicionarFotoDefeito}
          style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px' }}
          aria-hidden="true"
        />

        {/* Criar novo defeito customizado */}
        {mostrarInputNovoDefeito ? (
          <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-3 space-y-2">
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
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-amber-300 hover:text-amber-600 hover:bg-amber-50 transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar nova opção
          </button>
        )}

        {/* Lista de defeitos */}
        {[...defeitosCustom, ...DEFEITOS_OPCOES].map((defeito) => {
          const marcado       = defeitosSelecionados.includes(defeito);
          const fotosItem     = fotosDefeito[defeito] || [];
          const expandido     = defeitosExpandidos.includes(defeito);
          const temFotos      = fotosItem.length > 0;
          const isCustom      = defeitosCustom.includes(defeito);
          const checkPreench  = marcado || temFotos;
          const mostrarFotos  = marcado && expandido;

          return (
            <div
              key={defeito}
              className={`rounded-xl border transition-all ${checkPreench ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-center">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggleCheckbox(defeito)}
                  className={`flex-shrink-0 ml-4 w-5 h-5 rounded flex items-center justify-center border-2 transition-all ${
                    checkPreench
                      ? temFotos && !marcado
                        ? 'bg-amber-300 border-amber-300 cursor-not-allowed'
                        : 'bg-amber-500 border-amber-500 cursor-not-allowed'
                      : 'border-gray-300 hover:border-amber-400'
                  }`}
                  title={temFotos && marcado ? 'Apague as fotos antes de desmarcar' : undefined}
                >
                  {checkPreench && <Check className="w-3 h-3 text-white" />}
                </button>

                {/* Nome */}
                <button
                  onClick={() => {
                    if (!marcado && !temFotos) handleToggleCheckbox(defeito);
                    else handleToggleExpansao(defeito);
                  }}
                  className="flex items-center gap-2 px-3 py-3 text-left flex-1 min-w-0"
                >
                  <span className={`text-sm font-medium flex-1 truncate ${checkPreench ? 'text-amber-800' : 'text-gray-700'}`}>
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

                {/* Remover opção customizada */}
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

              {/* Painel de fotos */}
              {mostrarFotos && (
                <div className="px-4 pb-3 space-y-2 border-t border-amber-100 pt-2 mt-1">
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
                            onClick={e => { e.stopPropagation(); handleRemoverFotoDefeito(defeito, idx); }}
                            className="absolute top-0.5 right-0.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-md"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => { setDefeitoFotoAlvo(defeito); defeitoFotoInputRef.current?.click(); }}
                    className="flex items-center gap-2 text-xs text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    {fotosItem.length > 0 ? `${fotosItem.length} foto(s) · Adicionar mais` : 'Adicionar foto'}
                  </button>
                  {temFotos && (
                    <p className="text-[10px] text-gray-400">Apague todas as fotos para poder desmarcar esta opção</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal visualização de foto */}
      {fotoSelecionada && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoSelecionada(null)}
        >
          <img
            src={fotoSelecionada}
            alt="Foto ampliada"
            className="max-w-full max-h-full rounded-xl object-contain"
            style={{ imageOrientation: 'from-image' }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setFotoSelecionada(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      )}

      {/* Modal confirmar limpeza */}
      {confirmLimpar && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-lg">Limpar tudo?</h3>
            <p className="text-sm text-gray-500">Todos os defeitos marcados e fotos serão removidos. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmLimpar(false)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleLimparTudo}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors"
              >
                Limpar tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
