"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Hammer, Building2 } from 'lucide-react';

interface OnboardingProps {
  onComplete: (nome: string, perfil: string) => void;
}

// Ícone customizado MELHORADO de pistola de pintura automotiva
const SprayGunIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.8" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-10 h-10"
  >
    {/* Reservatório superior (caneca) */}
    <rect x="13" y="4" width="5" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />
    <path d="M13 7h5" />
    
    {/* Corpo principal da pistola */}
    <path d="M4 11h9l2-1.5h3v5h-3l-2-1.5H4z" fill="currentColor" fillOpacity="0.15" />
    <path d="M4 11h9l2-1.5h3v5h-3l-2-1.5H4z" />
    
    {/* Cabo/Empunhadura */}
    <path d="M8 14v2.5c0 .5-.3 1-1 1.5l-1.5 1.5" />
    <path d="M7 14v2.5c0 .5-.3 1-1 1.5l-1.5 1.5" />
    
    {/* Gatilho */}
    <path d="M9 14v1.5a1 1 0 0 1-1 1h-1" />
    
    {/* Bico de pulverização */}
    <circle cx="19.5" cy="12" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <path d="M18 12h1.5" strokeWidth="2" />
    
    {/* Conexão do reservatório */}
    <path d="M15.5 10V8" strokeWidth="1.5" />
    
    {/* Detalhes de ajuste */}
    <circle cx="11" cy="12" r="0.5" fill="currentColor" />
    <circle cx="14" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

// Ícone customizado MELHORADO de lixadeira orbital (preparador)
const OrbitalSanderIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className="w-10 h-10"
  >
    {/* Base circular da lixadeira (disco de lixa) */}
    <circle cx="12" cy="15" r="7" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="15" r="7" strokeWidth="2" />
    
    {/* Padrão de furos no disco (mais realista) */}
    <circle cx="12" cy="15" r="1.2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="9" cy="13" r="0.6" fill="currentColor" />
    <circle cx="15" cy="13" r="0.6" fill="currentColor" />
    <circle cx="9" cy="17" r="0.6" fill="currentColor" />
    <circle cx="15" cy="17" r="0.6" fill="currentColor" />
    <circle cx="10.5" cy="15" r="0.5" fill="currentColor" />
    <circle cx="13.5" cy="15" r="0.5" fill="currentColor" />
    
    {/* Corpo/motor superior (mais robusto) */}
    <path d="M8 8h8v7H8z" fill="currentColor" fillOpacity="0.2" />
    <rect x="8" y="8" width="8" height="7" rx="1.5" strokeWidth="2" />
    
    {/* Alça/empunhadura superior (mais ergonômica) */}
    <path d="M9.5 8V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V8" strokeWidth="2" />
    <circle cx="12" cy="5.5" r="0.8" fill="currentColor" />
    
    {/* Detalhes do motor (ventilação) */}
    <path d="M9.5 10.5h5" strokeWidth="1.5" />
    <path d="M9.5 12.5h5" strokeWidth="1.5" />
    
    {/* Indicador de rotação/movimento */}
    <path d="M16 15a4 4 0 0 1-4 4" strokeWidth="2" opacity="0.4" />
    <path d="M8 15a4 4 0 0 0 4 4" strokeWidth="2" opacity="0.4" />
    
    {/* Botão de controle */}
    <circle cx="12" cy="10" r="0.8" fill="currentColor" fillOpacity="0.5" />
  </svg>
);

const perfis = [
  { 
    nome: 'Pintor', 
    cor: '#00A651',
    icon: SprayGunIcon,
  },
  { 
    nome: 'Preparador', 
    cor: '#6F2DA8',
    icon: OrbitalSanderIcon,
  },
  { 
    nome: 'Polidor', 
    cor: '#0072CE',
    icon: Sparkles,
  },
  { 
    nome: 'Funileiro', 
    cor: '#D32F2F',
    icon: Hammer,
  },
  { 
    nome: 'Dono de Oficina', 
    cor: '#F57C00',
    icon: Building2,
  },
];

export function Onboarding({ onComplete }: OnboardingProps) {
  const [perfilSelecionado, setPerfilSelecionado] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [nome, setNome] = useState('');

  const handlePerfilClick = (perfil: string) => {
    setPerfilSelecionado(perfil);
    setModalAberto(true);
  };

  const handleConfirmar = () => {
    if (nome.trim() && perfilSelecionado) {
      onComplete(nome.trim(), perfilSelecionado);
    }
  };

  return (
    <>
      {/* Tela de fundo com imagem - TELA CHEIA */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat z-50"
        style={{
          backgroundImage: 'url(https://k6hrqrxuu8obbfwn.public.blob.vercel-storage.com/temp/d8f53096-e92b-4cf2-91e8-863da2afd055.jpg)',
        }}
      >
        {/* Conteúdo sobreposto */}
        <div className="relative h-full flex flex-col items-center justify-end pb-16 px-6">
          {/* Título - posicionado acima dos ícones */}
          <h1 className="text-white text-2xl md:text-3xl font-semibold text-center mb-8 drop-shadow-2xl">
            Escolha o seu perfil
          </h1>

          {/* Container dos ícones - abaixo do carro na parte escura */}
          <div className="w-full max-w-2xl flex flex-col items-center gap-4">
            {/* Primeira linha - 4 ícones */}
            <div className="grid grid-cols-4 gap-4 w-full">
              {perfis.slice(0, 4).map((perfil) => {
                const Icon = perfil.icon;
                return (
                  <button
                    key={perfil.nome}
                    onClick={() => handlePerfilClick(perfil.nome)}
                    className="flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: perfil.cor }}
                    >
                      <Icon />
                    </div>
                    <span className="text-white text-sm font-medium text-center drop-shadow-lg">
                      {perfil.nome}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Segunda linha - 1 ícone centralizado */}
            <div className="flex justify-center w-full">
              {perfis.slice(4).map((perfil) => {
                const Icon = perfil.icon;
                return (
                  <button
                    key={perfil.nome}
                    onClick={() => handlePerfilClick(perfil.nome)}
                    className="flex flex-col items-center gap-2 transition-transform hover:scale-105 active:scale-95"
                  >
                    <div
                      className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: perfil.cor }}
                    >
                      <Icon className="w-10 h-10 text-white" strokeWidth={2} />
                    </div>
                    <span className="text-white text-sm font-medium text-center drop-shadow-lg">
                      {perfil.nome}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para capturar nome */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="sm:max-w-md z-[60]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Digite seu nome
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <Input
              type="text"
              placeholder="Seu nome aqui..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="text-lg h-12"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nome.trim()) {
                  handleConfirmar();
                }
              }}
            />

            <Button
              onClick={handleConfirmar}
              disabled={!nome.trim()}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
