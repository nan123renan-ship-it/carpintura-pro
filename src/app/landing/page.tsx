"use client";

import { ArrowRight, Car, TrendingUp, BarChart3, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Imagem de fundo com overlay escuro */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(https://pub-c0bfb119504542e0b2e6ebc8f6b3b1df.r2.dev/user-uploads/user_33X3t2r5prLJgmeIUM9eiHM1Tcz/d6978d01-ad2c-4db4-b268-9efe2fda0c25.jpeg)`
        }}
      >
        {/* Overlay gradiente para garantir legibilidade */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80"></div>
      </div>

      {/* Conteúdo da Landing Page */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="w-full px-6 py-6 md:px-12 md:py-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center md:w-12 md:h-12">
                <Car className="w-6 h-6 text-white md:w-7 md:h-7" />
              </div>
              <h1 className="text-2xl font-black text-white md:text-3xl">
                Carpintura <span className="text-blue-400">Pro</span>
              </h1>
            </div>

            <Link
              href="/login"
              className="px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20 md:px-6 md:py-3"
            >
              Entrar
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <main className="flex-1 flex items-center">
          <div className="w-full max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-20">
            <div className="max-w-3xl">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full border border-blue-400/30 mb-6 md:mb-8">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-blue-300 text-sm font-semibold md:text-base">
                  Gestão Profissional de Pintura Automotiva
                </span>
              </div>

              {/* Título Principal */}
              <h2 className="text-4xl font-black text-white mb-6 leading-tight md:text-6xl md:mb-8 lg:text-7xl">
                Controle Total do Seu{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Negócio Automotivo
                </span>
              </h2>

              {/* Subtítulo */}
              <p className="text-lg text-gray-300 mb-8 leading-relaxed md:text-xl md:mb-10 lg:text-2xl">
                Gerencie serviços, despesas, receitas e relatórios em um só lugar.
                A solução completa para pintores, preparadores e donos de oficina.
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
                <Link
                  href="/cadastro"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold text-lg hover:shadow-2xl hover:shadow-blue-500/50 transition-all flex items-center justify-center gap-3 md:px-10 md:py-5"
                >
                  Começar Agora
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform md:w-6 md:h-6" />
                </Link>

                <Link
                  href="/dicas-de-pintura"
                  className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all flex items-center justify-center gap-3 border border-white/20 md:px-10 md:py-5"
                >
                  Saber Mais
                </Link>
              </div>

              {/* Features em Cards */}
              <div className="grid grid-cols-1 gap-4 mt-12 md:grid-cols-3 md:gap-6 md:mt-16">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all md:p-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 md:w-14 md:h-14">
                    <TrendingUp className="w-6 h-6 text-blue-400 md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 md:text-xl">
                    Controle Financeiro
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed md:text-base">
                    Acompanhe receitas, despesas e lucro líquido em tempo real
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all md:p-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 md:w-14 md:h-14">
                    <Car className="w-6 h-6 text-green-400 md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 md:text-xl">
                    Gestão de Serviços
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed md:text-base">
                    Organize todos os serviços com fotos, valores e status
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all md:p-6">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 md:w-14 md:h-14">
                    <BarChart3 className="w-6 h-6 text-purple-400 md:w-7 md:h-7" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2 md:text-xl">
                    Relatórios Completos
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed md:text-base">
                    Visualize gráficos e métricas para tomar decisões melhores
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-6 py-6 md:px-12 md:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center gap-4 text-center md:flex-row md:justify-between md:text-left">
              <p className="text-gray-400 text-sm md:text-base">
                © 2026 Carpintura Pro. Todos os direitos reservados.
              </p>
              <div className="flex items-center gap-2 text-gray-400 text-sm md:text-base">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
                <span>Seus dados estão seguros conosco</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
