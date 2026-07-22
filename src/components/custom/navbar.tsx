"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Car, TrendingDown, PieChart, Menu, Plus, SlidersHorizontal, ChevronDown, Receipt, Wrench } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/", label: "Início", icon: Home },
    { href: "/servicos", label: "Serviços", icon: Car },
    { href: "/despesas", label: "Despesas", icon: TrendingDown },
    { href: "/relatorios", label: "Relatórios", icon: PieChart },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Botão de ação rápida para desktop conforme página
  const renderDesktopActionButton = () => {
    if (pathname.startsWith('/servicos') && !pathname.includes('/servicos/novo')) {
      return (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('abrirModalNovoServico'))}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      );
    }

    if (pathname.startsWith('/despesas')) {
      return (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('abrirModalNovaDespesa'))}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Despesa
        </button>
      );
    }

    if (pathname.startsWith('/relatorios')) {
      return (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('abrirPainelControle'))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95 text-green-400"
          style={{
            background: 'linear-gradient(135deg, #0d2818 0%, #1a3d2a 100%)',
            border: '1.5px solid rgba(34,197,94,0.5)',
          }}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Controle
        </button>
      );
    }

    // Página inicial ou outras: dropdown com as duas ações principais
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setDropdownAberto(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Novo
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownAberto ? 'rotate-180' : ''}`} />
        </button>
        {dropdownAberto && (
          <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden w-48 z-[200]">
            <button
              onClick={() => {
                setDropdownAberto(false);
                // Se estiver na página de serviços, dispara evento direto; caso contrário, navega primeiro
                if (pathname.startsWith('/servicos')) {
                  window.dispatchEvent(new CustomEvent('abrirModalNovoServico'));
                } else {
                  sessionStorage.setItem('autoAbrir', 'novoServico');
                  window.location.href = '/servicos';
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              Novo Serviço
            </button>
            <div className="h-px bg-gray-100 mx-2" />
            <button
              onClick={() => {
                setDropdownAberto(false);
                // Se estiver na página de despesas, dispara evento direto; caso contrário, navega primeiro
                if (pathname.startsWith('/despesas')) {
                  window.dispatchEvent(new CustomEvent('abrirModalNovaDespesa'));
                } else {
                  sessionStorage.setItem('autoAbrir', 'novaDespesa');
                  window.location.href = '/despesas';
                }
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <Receipt className="w-3.5 h-3.5 text-red-500" />
              </div>
              Nova Despesa
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Car Pintura Pro</h1>
                <p className="text-xs text-gray-500">Financeiro do Pintor</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      active
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Separador */}
              <div className="w-px h-6 bg-gray-200 mx-1" />

              {/* Botão de ação rápida contextual */}
              {renderDesktopActionButton()}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        {pathname.startsWith('/servicos') && !pathname.includes('/servicos/') ? (
          /* Layout especial para serviços: 2 itens + FAB central + 2 itens */
          <div className="relative flex items-center p-2">
            {/* Início */}
            <Link
              href="/"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Início</span>
            </Link>
            {/* Serviços — ativo */}
            <Link
              href="/servicos"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 bg-emerald-50 text-emerald-700"
            >
              <Car className="w-6 h-6" />
              <span className="text-xs font-medium">Serviços</span>
            </Link>
            {/* FAB verde central */}
            <div className="w-1/5 flex justify-center">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('abrirModalNovoServico'))}
                className="w-14 h-14 bg-green-500 rounded-full shadow-xl flex items-center justify-center -mt-6 hover:bg-green-600 transition-all hover:scale-110 active:scale-95"
              >
                <Plus className="w-7 h-7 text-white" />
              </button>
            </div>
            {/* Despesas */}
            <Link
              href="/despesas"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <TrendingDown className="w-6 h-6" />
              <span className="text-xs font-medium">Despesas</span>
            </Link>
            {/* Relatórios */}
            <Link
              href="/relatorios"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <PieChart className="w-6 h-6" />
              <span className="text-xs font-medium">Relatórios</span>
            </Link>
          </div>
        ) : pathname.startsWith('/despesas') ? (
          /* Layout especial para despesas: 2 itens + FAB central + 2 itens */
          <div className="relative flex items-center p-2">
            {/* Início */}
            <Link
              href="/"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Início</span>
            </Link>
            {/* Serviços */}
            <Link
              href="/servicos"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <Car className="w-6 h-6" />
              <span className="text-xs font-medium">Serviços</span>
            </Link>
            {/* FAB vermelho central — exato centro da tela */}
            <div className="w-1/5 flex justify-center">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('abrirModalNovaDespesa'))}
                className="w-14 h-14 bg-red-500 rounded-full shadow-xl flex items-center justify-center -mt-6 hover:bg-red-600 transition-all hover:scale-110"
              >
                <Plus className="w-7 h-7 text-white" />
              </button>
            </div>
            {/* Despesas */}
            <Link
              href="/despesas"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 bg-red-50 text-red-600"
            >
              <TrendingDown className="w-6 h-6" />
              <span className="text-xs font-medium">Despesas</span>
            </Link>
            {/* Relatórios */}
            <Link
              href="/relatorios"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <PieChart className="w-6 h-6" />
              <span className="text-xs font-medium">Relatórios</span>
            </Link>
          </div>
        ) : pathname.startsWith('/relatorios') ? (
          /* Layout especial para relatórios: 2 itens + FAB Controle central + 2 itens */
          <div className="relative flex items-center p-2">
            {/* Início */}
            <Link
              href="/"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Início</span>
            </Link>
            {/* Serviços */}
            <Link
              href="/servicos"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <Car className="w-6 h-6" />
              <span className="text-xs font-medium">Serviços</span>
            </Link>
            {/* FAB Controle central */}
            <div className="w-1/5 flex flex-col items-center justify-center">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('abrirPainelControle'))}
                className="w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center -mt-6 transition-all hover:scale-110 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #0d2818 0%, #1a3d2a 100%)',
                  border: '2px solid rgba(34,197,94,0.5)',
                  boxShadow: '0 0 18px rgba(34,197,94,0.35), 0 4px 16px rgba(0,0,0,0.4)',
                }}
              >
                <SlidersHorizontal className="w-6 h-6 text-green-400" />
              </button>
              <span className="text-xs font-medium text-gray-600 mt-0.5 leading-none">Controle</span>
            </div>
            {/* Despesas */}
            <Link
              href="/despesas"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 text-gray-600"
            >
              <TrendingDown className="w-6 h-6" />
              <span className="text-xs font-medium">Despesas</span>
            </Link>
            {/* Relatórios — ativo */}
            <Link
              href="/relatorios"
              className="flex flex-col items-center gap-1 py-2 rounded-lg transition-colors w-1/5 bg-emerald-50 text-emerald-700"
            >
              <PieChart className="w-6 h-6" />
              <span className="text-xs font-medium">Relatórios</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1 p-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors ${
                    active
                      ? "bg-emerald-100 text-emerald-700"
                      : "text-gray-600"
                  }`}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>
    </>
  );
}
