"use client";

import { useState, useRef, useEffect } from 'react';
import { Servico } from '@/lib/types';
import { formatarMoeda } from '@/lib/storage';
import { Car, Wrench, Sparkles, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface SwipeableServiceItemProps {
  servico: Servico;
  onMarkAsPaid: (id: string) => void;
  onMarkAsPending: (id: string) => void;
  onDelete: (id: string) => void;
}

export function SwipeableServiceItem({
  servico,
  onMarkAsPaid,
  onMarkAsPending,
  onDelete,
}: SwipeableServiceItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const [showActions, setShowActions] = useState(false);

  const SWIPE_THRESHOLD = 80; // Pixels para mostrar ações
  const MAX_SWIPE = 240; // Máximo de arraste (3 botões de 80px)

  const getIconeServico = (descricao: string) => {
    const desc = descricao.toLowerCase();
    if (desc.includes('polimento') || desc.includes('polish')) return Sparkles;
    if (desc.includes('funilaria') || desc.includes('reparo')) return Wrench;
    return Car;
  };

  const getValorECor = () => {
    const custoTotal = servico.custo_materiais + servico.custo_terceiros + (servico.outras_despesas || 0);
    
    if (servico.status === 'Finalizado' || servico.status === 'Pago') {
      return {
        valor: servico.valor_cobrado,
        cor: 'text-emerald-600',
        sinal: '+'
      };
    } else if (custoTotal > 0) {
      return {
        valor: custoTotal,
        cor: 'text-red-600',
        sinal: '-'
      };
    } else {
      return {
        valor: servico.valor_cobrado,
        cor: 'text-gray-500',
        sinal: ''
      };
    }
  };

  const getStatusTexto = (status: string) => {
    switch (status) {
      case 'Pago':
      case 'Finalizado':
        return 'recebido';
      case 'Em andamento':
        return 'pendente';
      case 'Orçamento':
        return 'orçamento';
      default:
        return status.toLowerCase();
    }
  };

  // Função para determinar tamanho da fonte baseado no valor
  const getFontSizeClass = (valor: number) => {
    if (valor >= 1000000) return 'text-xs'; // R$ 1.000.000+
    if (valor >= 100000) return 'text-sm';  // R$ 100.000+
    if (valor >= 10000) return 'text-base'; // R$ 10.000+
    return 'text-base'; // Valores menores
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartX(e.touches[0].clientX - translateX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const currentX = e.touches[0].clientX - startX;
    const newTranslateX = Math.max(-MAX_SWIPE, Math.min(0, currentX));
    setTranslateX(newTranslateX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-MAX_SWIPE);
      setShowActions(true);
    } else {
      setTranslateX(0);
      setShowActions(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.clientX - translateX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const currentX = e.clientX - startX;
    const newTranslateX = Math.max(-MAX_SWIPE, Math.min(0, currentX));
    setTranslateX(newTranslateX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    if (translateX < -SWIPE_THRESHOLD) {
      setTranslateX(-MAX_SWIPE);
      setShowActions(true);
    } else {
      setTranslateX(0);
      setShowActions(false);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (translateX < -SWIPE_THRESHOLD) {
        setTranslateX(-MAX_SWIPE);
        setShowActions(true);
      } else {
        setTranslateX(0);
        setShowActions(false);
      }
    }
  };

  const handleActionClick = (action: () => void, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setTranslateX(0);
    setShowActions(false);
  };

  const handleMarkAsPaid = (e: React.MouseEvent) => {
    handleActionClick(() => onMarkAsPaid(servico.id), e);
  };

  const handleMarkAsPending = (e: React.MouseEvent) => {
    handleActionClick(() => onMarkAsPending(servico.id), e);
  };

  const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `Deseja excluir o serviço "${servico.nome_veiculo || `${servico.carro_marca} ${servico.carro_modelo}`}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (confirmDelete) {
      onDelete(servico.id);
      setTranslateX(0);
      setShowActions(false);
    } else {
      setTranslateX(0);
      setShowActions(false);
    }
  };

  const { valor, cor, sinal } = getValorECor();
  const Icone = getIconeServico(servico.servico_descricao);

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Botões de ação (fundo) */}
      <div className="absolute inset-0 flex items-center justify-end">
        <button
          onClick={handleMarkAsPaid}
          className="h-full w-20 bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors"
          aria-label="Marcar como pago"
        >
          <ThumbsUp className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={handleMarkAsPending}
          className="h-full w-20 bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-colors"
          aria-label="Marcar como pendente"
        >
          <ThumbsDown className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={handleDeleteClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(e);
          }}
          className="h-full w-20 bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors active:bg-red-700"
          aria-label="Excluir serviço"
        >
          <Trash2 className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Item principal (frente) */}
      <div
        ref={itemRef}
        className="relative bg-white border border-gray-200 rounded-lg cursor-pointer touch-pan-y"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <Link href={`/servicos/${servico.id}`}>
          <div className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              {/* Avatar - Foto de perfil ou ícone padrão */}
              {servico.foto_perfil_url ? (
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200">
                  <img 
                    src={servico.foto_perfil_url} 
                    alt={servico.nome_veiculo || 'Veículo'} 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Icone className="w-5 h-5 text-blue-600" />
                </div>
              )}
              
              {/* Informações */}
              <div className="flex-1 min-w-0">
                {/* Nome do Veículo como título principal */}
                <p className="font-medium text-gray-900 truncate">
                  {servico.nome_veiculo || 'Veículo não informado'}
                </p>
                {/* Marca como subtítulo */}
                <p className="text-sm text-gray-500 truncate">
                  {servico.carro_marca || 'Marca não informada'}
                </p>
              </div>
              
              {/* Valor e Status */}
              <div className="text-right flex-shrink-0 max-w-[120px]">
                <p className={`font-semibold ${cor} ${getFontSizeClass(valor)} break-words leading-tight`}>
                  {sinal}{formatarMoeda(valor)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {getStatusTexto(servico.status)}
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
