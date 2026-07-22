"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Hammer, Building2, LogIn } from 'lucide-react';

// Ícone customizado de pistola de pintura
const SprayGunIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full"
  >
    <rect x="13" y="4" width="5" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />
    <path d="M13 7h5" />
    <path d="M4 11h9l2-1.5h3v5h-3l-2-1.5H4z" fill="currentColor" fillOpacity="0.15" />
    <path d="M4 11h9l2-1.5h3v5h-3l-2-1.5H4z" />
    <path d="M8 14v2.5c0 .5-.3 1-1 1.5l-1.5 1.5" />
    <path d="M7 14v2.5c0 .5-.3 1-1 1.5l-1.5 1.5" />
    <path d="M9 14v1.5a1 1 0 0 1-1 1h-1" />
    <circle cx="19.5" cy="12" r="1.5" fill="currentColor" fillOpacity="0.3" />
    <path d="M18 12h1.5" strokeWidth="2" />
    <path d="M15.5 10V8" strokeWidth="1.5" />
    <circle cx="11" cy="12" r="0.5" fill="currentColor" />
    <circle cx="14" cy="12" r="0.5" fill="currentColor" />
  </svg>
);

// Ícone customizado de lixadeira orbital
const OrbitalSanderIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full"
  >
    <circle cx="12" cy="15" r="7" fill="currentColor" fillOpacity="0.15" />
    <circle cx="12" cy="15" r="7" strokeWidth="2" />
    <circle cx="12" cy="15" r="1.2" fill="currentColor" fillOpacity="0.3" />
    <circle cx="9" cy="13" r="0.6" fill="currentColor" />
    <circle cx="15" cy="13" r="0.6" fill="currentColor" />
    <circle cx="9" cy="17" r="0.6" fill="currentColor" />
    <circle cx="15" cy="17" r="0.6" fill="currentColor" />
    <circle cx="10.5" cy="15" r="0.5" fill="currentColor" />
    <circle cx="13.5" cy="15" r="0.5" fill="currentColor" />
    <path d="M8 8h8v7H8z" fill="currentColor" fillOpacity="0.2" />
    <rect x="8" y="8" width="8" height="7" rx="1.5" strokeWidth="2" />
    <path d="M9.5 8V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V8" strokeWidth="2" />
    <circle cx="12" cy="5.5" r="0.8" fill="currentColor" />
    <path d="M9.5 10.5h5" strokeWidth="1.5" />
    <path d="M9.5 12.5h5" strokeWidth="1.5" />
    <path d="M16 15a4 4 0 0 1-4 4" strokeWidth="2" opacity="0.4" />
    <path d="M8 15a4 4 0 0 0 4 4" strokeWidth="2" opacity="0.4" />
    <circle cx="12" cy="10" r="0.8" fill="currentColor" fillOpacity="0.5" />
  </svg>
);

const perfisDisponiveis = [
  {
    id: 'Pintor',
    nome: 'Pintor',
    icon: SprayGunIcon,
    cor: '#00A651',
    descricao: 'Especialista em pintura automotiva'
  },
  {
    id: 'Preparador',
    nome: 'Preparador',
    icon: OrbitalSanderIcon,
    cor: '#6F2DA8',
    descricao: 'Especialista em preparação de superfícies'
  },
  {
    id: 'Polidor',
    nome: 'Polidor',
    icon: Sparkles,
    cor: '#0072CE',
    descricao: 'Especialista em polimento e acabamento'
  },
  {
    id: 'Funileiro',
    nome: 'Funileiro',
    icon: Hammer,
    cor: '#D32F2F',
    descricao: 'Especialista em funilaria e estrutura'
  },
  {
    id: 'Dono de Oficina',
    nome: 'Dono de Oficina',
    icon: Building2,
    cor: '#F57C00',
    descricao: 'Gerencia toda a oficina'
  },
];

export default function AcessoDiretoPage() {
  const router = useRouter();
  const [nome, setNome] = useState('');
  const [perfilSelecionado, setPerfilSelecionado] = useState('');

  const handleAcessoRapido = () => {
    if (!nome.trim()) {
      alert('Por favor, digite seu nome');
      return;
    }

    if (!perfilSelecionado) {
      alert('Por favor, selecione um perfil');
      return;
    }

    // Salvar perfil no localStorage (sem precisar de cadastro/login)
    localStorage.setItem('userProfile', JSON.stringify({
      nomeUsuario: nome,
      tipoPerfil: perfilSelecionado,
      onboardingConcluido: true
    }));

    // Redirecionar para o dashboard
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50">
      {/* Background decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-green-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Imagem */}
        <div className="flex justify-center mb-8">
          <div className="relative w-32 h-32 rounded-full overflow-hidden shadow-2xl border-4 border-white">
            <img
              src="https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_33X3t2r5prLJgmeIUM9eiHM1Tcz/82016c16-0ee5-4707-9fc3-3e7eaa90af2b.jpeg"
              alt="Carpintura Pro"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Card de Acesso Rápido */}
        <div className="bg-white rounded-3xl shadow-xl p-8 space-y-6">
          {/* Título */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Acesso Rápido</h1>
            <p className="text-gray-600">Entre direto no app sem cadastro</p>
            <p className="text-xs text-gray-400 mt-2">🚀 Modo de teste - Seus dados ficam salvos no navegador</p>
          </div>

          <div className="space-y-5">
            {/* Campo Nome */}
            <div>
              <label htmlFor="nome" className="block text-sm font-semibold text-gray-700 mb-2">
                Seu Nome
              </label>
              <input
                id="nome"
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                placeholder="Digite seu nome"
              />
            </div>

            {/* Seleção de Perfil */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Escolha seu perfil
              </label>
              <div className="grid grid-cols-2 gap-3">
                {perfisDisponiveis.map((perfil) => {
                  const Icon = perfil.icon;
                  const isSelected = perfilSelecionado === perfil.id;

                  return (
                    <button
                      key={perfil.id}
                      type="button"
                      onClick={() => setPerfilSelecionado(perfil.id)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      <div
                        className="w-10 h-10 rounded-lg mx-auto mb-1 flex items-center justify-center"
                        style={{ backgroundColor: perfil.cor }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-xs font-bold text-gray-900 text-center">{perfil.nome}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Botão de Acesso */}
            <button
              onClick={handleAcessoRapido}
              disabled={!nome.trim() || !perfilSelecionado}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" />
              <span>Entrar no App</span>
            </button>

            {/* Divisor */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Link para Login com Conta */}
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Já tem uma conta?</p>
              <button
                onClick={() => router.push('/login')}
                className="text-blue-600 hover:text-blue-700 font-semibold text-sm underline"
              >
                Fazer login com e-mail e senha
              </button>
            </div>
          </div>
        </div>

        {/* Aviso */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
          <p className="text-xs text-blue-700">
            💡 <strong>Dica:</strong> Use este acesso para testar o app rapidamente. Para produção, use login com e-mail.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            © 2026 Carpintura Pro. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
