"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEnviado, setResetEnviado] = useState(false);
  const [loadingReset, setLoadingReset] = useState(false);

  const handleEsqueciSenha = async () => {
    if (!email.trim()) {
      setError('Digite seu e-mail acima para receber o link de redefinição.');
      return;
    }
    setLoadingReset(true);
    setError('');
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/login`,
      });
      setResetEnviado(true);
    } catch {
      setError('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoadingReset(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setError('E-mail ou senha incorretos. Verifique seus dados e tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('E-mail não confirmado. Verifique sua caixa de entrada.');
        } else if (error.message.includes('Too many requests') || error.message.includes('rate limit')) {
          setError('Muitas tentativas. Aguarde alguns minutos e tente novamente.');
        } else {
          setError('Erro ao fazer login. Tente novamente.');
        }
        return;
      }

      if (data.session) {
        // Usar window.location para garantir redirecionamento no mobile
        window.location.href = '/';
      }
    } catch (err: any) {
      setError('Erro ao fazer login. Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Logo/Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-gray-600">
              Faça login para continuar
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base"
                placeholder="seu@email.com"
              />
            </div>

            {/* Senha */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Senha
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-base"
                placeholder="••••••••"
              />
            </div>

            {/* Mensagem de Erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Botão Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all shadow-lg hover:shadow-xl text-base"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          {/* Link para Cadastro */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link href="/cadastro" className="text-blue-600 hover:text-blue-700 font-semibold">
                Cadastre-se
              </Link>
            </p>
            {resetEnviado ? (
              <p className="text-sm text-emerald-600 font-medium">
                ✓ Link enviado! Verifique seu e-mail.
              </p>
            ) : (
              <button
                type="button"
                onClick={handleEsqueciSenha}
                disabled={loadingReset}
                className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2 disabled:opacity-50"
              >
                {loadingReset ? 'Enviando...' : 'Esqueci minha senha'}
              </button>
            )}
          </div>
        </div>

        {/* Link para Home */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-800">
            ← Voltar para home
          </Link>
        </div>
      </div>
    </div>
  );
}
