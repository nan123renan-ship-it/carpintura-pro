"use client";

import { useState, useRef } from 'react';
import { X, Share2, FileText, Copy, Check, Download, MessageCircle } from 'lucide-react';
import { Servico } from '@/lib/types';
import { formatarMoeda } from '@/lib/storage';

interface ShareServicosModalProps {
  isOpen: boolean;
  onClose: () => void;
  servicos: Servico[];
  periodo: string;
  filtroLabel?: string;
  totais: {
    resolvidos: number;
    pendentes: number;
    total: number;
  };
}

export function ShareServicosModal({
  isOpen,
  onClose,
  servicos,
  periodo,
  filtroLabel,
  totais,
}: ShareServicosModalProps) {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const getStatusLabel = (s: Servico) => {
    return s.status || 'Sem status';
  };

  const gerarTexto = () => {
    const linha = '─────────────────────────';
    const titulo = `📋 *Lista de Serviços*`;
    const periodoTxt = `📅 Período: ${periodo}`;
    const filtroTxt = filtroLabel ? `🔍 Filtro: ${filtroLabel}` : '';

    const linhasServicos = servicos.map((s, i) => {
      const data = new Date(s.data_servico).toLocaleDateString('pt-BR');
      const valor = formatarMoeda(s.valor_cobrado || s.valor_servico || 0);
      const status = getStatusLabel(s);
      return [
        `*${i + 1}. ${s.nome_veiculo || 'Veículo'}*`,
        `   👤 ${s.cliente_nome || 'Cliente'}`,
        `   📆 ${data}`,
        `   💰 ${valor}`,
        `   🔖 ${status}`,
      ].join('\n');
    });

    const resumo = [
      `✅ Resolvidos: ${formatarMoeda(totais.resolvidos)}`,
      `⏳ Pendentes: ${formatarMoeda(totais.pendentes)}`,
      `📊 Total: ${formatarMoeda(totais.total)}`,
    ].join('\n');

    const partes = [
      titulo,
      periodoTxt,
      filtroTxt,
      linha,
      linhasServicos.join('\n\n'),
      linha,
      resumo,
    ].filter(Boolean);

    return partes.join('\n');
  };

  const handleCompartilharTexto = async () => {
    const texto = gerarTexto();
    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: 'Lista de Serviços' });
      } catch {}
    } else {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopiar = async () => {
    await navigator.clipboard.writeText(gerarTexto());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const gerarHTML = () => {
    const linhasServicos = servicos.map((s, i) => {
      const data = new Date(s.data_servico).toLocaleDateString('pt-BR');
      const valor = formatarMoeda(s.valor_cobrado || s.valor_servico || 0);
      const status = getStatusLabel(s);
      const badgeClass =
        status === 'Pago' ? 'badge-pago' :
        status === 'Orçamento' ? 'badge-pendente' :
        'badge-outros';
      return `
        <tr>
          <td>${i + 1}</td>
          <td>
            <strong>${s.nome_veiculo || 'Veículo'}</strong><br/>
            <span style="color:#6b7280;font-size:12px">${s.cliente_nome || ''}</span>
          </td>
          <td>${data}</td>
          <td><strong>${valor}</strong></td>
          <td><span class="badge ${badgeClass}">${status}</span></td>
        </tr>
      `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <title>Servicos - ${periodo}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
    h1 { font-size: 20px; color: #00A651; margin-bottom: 4px; }
    .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #00A651; color: white; text-align: left; padding: 8px 10px; font-size: 12px; }
    td { padding: 8px 10px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-pago { background: #d1fae5; color: #065f46; }
    .badge-pendente { background: #fee2e2; color: #991b1b; }
    .badge-outros { background: #e0e7ff; color: #3730a3; }
    .totais { display: flex; gap: 24px; background: #f3f4f6; border-radius: 8px; padding: 16px; }
    .totais div { flex: 1; }
    .totais .label { font-size: 11px; color: #6b7280; margin-bottom: 2px; }
    .totais .valor { font-size: 16px; font-weight: 700; }
    .verde { color: #059669; }
    .vermelho { color: #dc2626; }
    .azul { color: #2563eb; }
    .rodape { margin-top: 32px; text-align: center; color: #9ca3af; font-size: 11px; }
    .btn-print { display: block; margin: 0 auto 24px; padding: 10px 28px; background: #00A651; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
    @media print { .btn-print { display: none !important; } body { padding: 16px; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">Salvar como PDF / Imprimir</button>
  <h1>Lista de Servicos</h1>
  <div class="sub">
    Periodo: ${periodo}${filtroLabel ? ` | Filtro: ${filtroLabel}` : ''} | ${servicos.length} registro(s)
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Veiculo / Cliente</th><th>Data</th><th>Valor</th><th>Status</th>
      </tr>
    </thead>
    <tbody>${linhasServicos}</tbody>
  </table>
  <div class="totais">
    <div><div class="label">Resolvidos</div><div class="valor verde">${formatarMoeda(totais.resolvidos)}</div></div>
    <div><div class="label">Pendentes</div><div class="valor vermelho">${formatarMoeda(totais.pendentes)}</div></div>
    <div><div class="label">Total</div><div class="valor azul">${formatarMoeda(totais.total)}</div></div>
  </div>
  <div class="rodape">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
</body>
</html>`;
  };

  const handleGerarPDF = () => {
    try {
      const html = gerarHTML();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch {
      // fallback: data URI
      const html = gerarHTML();
      const encoded = encodeURIComponent(html);
      const link = document.createElement('a');
      link.href = `data:text/html;charset=utf-8,${encoded}`;
      link.target = '_blank';
      link.download = `servicos-${periodo.replace(/\s/g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl px-5 pb-8 pt-5 z-10">
        {/* Handle */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Compartilhar Serviços</h2>
              <p className="text-xs text-gray-400">{servicos.length} registro(s) · {periodo}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Opções */}
        <div className="space-y-3">
          {/* Compartilhar como texto */}
          <button
            onClick={handleCompartilharTexto}
            className="w-full flex items-center gap-4 bg-green-50 hover:bg-green-100 border border-green-200 rounded-2xl px-4 py-4 transition-all text-left"
          >
            <div className="w-11 h-11 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Compartilhar via WhatsApp / outros</p>
              <p className="text-xs text-gray-500 mt-0.5">Abre o menu de compartilhamento do celular</p>
            </div>
          </button>

          {/* Copiar texto */}
          <button
            onClick={handleCopiar}
            className="w-full flex items-center gap-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl px-4 py-4 transition-all text-left"
          >
            <div className="w-11 h-11 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              {copied ? <Check className="w-6 h-6 text-white" /> : <Copy className="w-6 h-6 text-white" />}
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {copied ? 'Copiado!' : 'Copiar texto'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Copia a lista formatada para a área de transferência</p>
            </div>
          </button>

          {/* Gerar PDF */}
          <button
            onClick={handleGerarPDF}
            className="w-full flex items-center gap-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl px-4 py-4 transition-all text-left"
          >
            <div className="w-11 h-11 bg-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Gerar PDF / Imprimir</p>
              <p className="text-xs text-gray-500 mt-0.5">Abre a lista em nova aba — clique em "Salvar como PDF"</p>
            </div>
          </button>
        </div>

        {/* Resumo */}
        <div className="mt-5 bg-gray-50 rounded-2xl px-4 py-3 flex justify-between">
          <div className="text-center">
            <p className="text-xs text-gray-400">Resolvidos</p>
            <p className="text-sm font-bold text-emerald-600">{formatarMoeda(totais.resolvidos)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Pendentes</p>
            <p className="text-sm font-bold text-red-500">{formatarMoeda(totais.pendentes)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-bold text-blue-600">{formatarMoeda(totais.total)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
