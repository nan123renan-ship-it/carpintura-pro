"use client";

import { useState, useRef } from 'react';
import { Despesa } from '@/lib/types';
import { formatarMoeda } from '@/lib/storage';
import { 
  Receipt, 
  Wrench, 
  ShoppingCart, 
  Fuel, 
  Home, 
  Zap, 
  Wifi, 
  Trash2,
  Pencil,
  ThumbsUp,
  Link as LinkIcon,
  UserCircle
} from 'lucide-react';

interface SwipeableExpenseItemProps {
  despesa: Despesa;
  servico?: {
    id: string;
    status: string;
  } | null;
  onEdit?: (despesa: Despesa) => void;
  onTogglePaymentStatus?: (despesaId: string, currentStatus: 'pago' | 'pendente') => void;
  onDelete: (despesaId: string, servicoId?: string) => void;
}

export function SwipeableExpenseItem({
  despesa,
  servico,
  onEdit,
  onTogglePaymentStatus,
  onDelete,
}: SwipeableExpenseItemProps) {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);

  const SWIPE_THRESHOLD = 80;
  const MAX_SWIPE = 240; // 3 botões sempre

  const getIconeDespesa = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower.includes('material') || tipoLower.includes('produto')) return ShoppingCart;
    if (tipoLower.includes('combustível') || tipoLower.includes('gasolina')) return Fuel;
    if (tipoLower.includes('aluguel') || tipoLower.includes('imóvel')) return Home;
    if (tipoLower.includes('energia') || tipoLower.includes('luz')) return Zap;
    if (tipoLower.includes('internet') || tipoLower.includes('telefone')) return Wifi;
    if (tipoLower.includes('serviço') || tipoLower.includes('terceiro')) return Wrench;
    return Receipt;
  };

  const getFontSizeClass = (valor: number) => {
    if (valor >= 1000000) return 'text-xs';
    if (valor >= 100000) return 'text-sm';
    if (valor >= 10000) return 'text-base';
    return 'text-base';
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
    } else {
      setTranslateX(0);
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
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
      if (translateX < -SWIPE_THRESHOLD) {
        setTranslateX(-MAX_SWIPE);
      } else {
        setTranslateX(0);
      }
    }
  };

  const handleActionClick = (action: () => void, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    setTranslateX(0);
  };

  const handleDeleteClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const confirmDelete = window.confirm(
      `Deseja excluir a despesa "${despesa.descricao}"?\n\nEsta ação não pode ser desfeita.`
    );
    
    if (confirmDelete) {
      onDelete(despesa.id, despesa.servico_id || undefined);
      setTranslateX(0);
    } else {
      setTranslateX(0);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit(despesa);
    }
    setTranslateX(0);
  };

  const handleTogglePaymentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onTogglePaymentStatus) {
      const currentStatus = despesa.status_pagamento || 'pendente';
      onTogglePaymentStatus(despesa.id, currentStatus);
    }
    setTranslateX(0);
  };

  const handleItemClick = () => {
    if (translateX === 0 && onEdit) {
      onEdit(despesa);
    }
  };

  const Icone = getIconeDespesa(despesa.tipo_despesa);
  const isPago = despesa.status_pagamento === 'pago';

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Botões de ação (fundo) */}
      <div className="absolute inset-0 flex items-center justify-end">
        {/* Botão de Edição (Lápis) */}
        <button
          onClick={handleEditClick}
          className="h-full w-20 bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
          aria-label="Editar despesa"
        >
          <Pencil className="w-6 h-6 text-white" />
        </button>

        {/* Botão de Status de Pagamento (Joia) */}
        <button
          onClick={handleTogglePaymentClick}
          className={`h-full w-20 ${
            isPago 
              ? 'bg-emerald-500 hover:bg-emerald-600' 
              : 'bg-red-500 hover:bg-red-600'
          } flex items-center justify-center transition-colors`}
          aria-label={isPago ? "Marcar como pendente" : "Marcar como pago"}
        >
          <ThumbsUp
            className={`w-6 h-6 text-white transition-transform ${
              isPago ? '' : 'rotate-180'
            }`}
          />
        </button>

        {/* Botão de Exclusão (Lixeira) */}
        <button
          onClick={handleDeleteClick}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleDeleteClick(e);
          }}
          className="h-full w-20 bg-gray-500 hover:bg-gray-600 flex items-center justify-center transition-colors active:bg-gray-700"
          aria-label="Excluir despesa"
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
        onClick={handleItemClick}
      >
        <div className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-3">
            {/* Ícone da despesa */}
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Icone className="w-5 h-5 text-red-600" />
            </div>
            
            {/* Informações da despesa */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-medium text-gray-900 truncate">
                  {despesa.descricao}
                </p>
                {despesa.tipo_gasto === 'pessoal' && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 flex-shrink-0" title="Anotação pessoal">
                    <UserCircle className="w-3.5 h-3.5 text-purple-600" />
                  </span>
                )}
                {despesa.origem === 'manual' && despesa.servico_id && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                    <LinkIcon className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 overflow-hidden">
                {/* Categorias como subtítulo principal */}
                {despesa.categorias && despesa.categorias.length > 0 ? (
                  <>
                    {despesa.categorias.slice(0, 2).map(cat => (
                      <span key={cat} className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium whitespace-nowrap max-w-[90px] truncate flex-shrink-0">
                        {cat}
                      </span>
                    ))}
                    {despesa.categorias.length > 2 && (
                      <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full font-medium whitespace-nowrap flex-shrink-0">
                        +{despesa.categorias.length - 2}
                      </span>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 truncate">
                    {despesa.tipo_despesa}
                  </p>
                )}
                {despesa.origem === 'servico' && (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex-shrink-0">
                    <LinkIcon className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
            
            {/* Valor e Status */}
            <div className="text-right flex-shrink-0 max-w-[120px]">
              <p className={`font-semibold text-red-600 ${getFontSizeClass(despesa.valor)} break-words leading-tight`}>
                -{formatarMoeda(despesa.valor)}
              </p>
              <div className="flex items-center justify-end gap-1 mt-0.5">
                <ThumbsUp
                  className={`w-3 h-3 ${
                    isPago
                      ? 'text-emerald-500'
                      : 'text-red-500 rotate-180'
                  } transition-transform`}
                />
                <p className={`text-xs ${
                  isPago ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  {isPago ? 'pago' : 'pendente'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
