"use client";

import { useState } from 'react';
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function FixAuthPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFixAllUsers = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/auth/fix-all-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResult(data.results);
      } else {
        setError(data.error || 'Erro ao corrigir usuários');
      }
    } catch (err: any) {
      console.error('Erro:', err);
      setError('Erro ao conectar com a API');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Correção de Autenticação
          </h1>
          <p className="text-gray-600">
            Corrige contas que não conseguem fazer login
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          {/* Informações */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">O que esta ferramenta faz?</p>
                <p>Confirma automaticamente o email de TODAS as contas existentes no banco de dados, permitindo que façam login imediatamente.</p>
              </div>
            </div>
          </div>

          {/* Botão de Ação */}
          <button
            onClick={handleFixAllUsers}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Corrigindo contas...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Corrigir Todas as Contas</span>
              </>
            )}
          </button>

          {/* Resultado */}
          {result && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Sucesso!</h3>
                  <p className="text-green-700 text-sm">Processo concluído com êxito</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-gray-900">{result.total}</p>
                    <p className="text-xs text-gray-600">Total de Usuários</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-green-600">{result.confirmed}</p>
                    <p className="text-xs text-gray-600">Confirmados Agora</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-2xl font-bold text-blue-600">{result.alreadyConfirmed}</p>
                    <p className="text-xs text-gray-600">Já Confirmados</p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-red-900 mb-2">Erros encontrados:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      {result.errors.map((err: any, idx: number) => (
                        <li key={idx}>
                          {err.email}: {err.error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-900">Erro</p>
                  <p className="text-sm text-red-700">{error}</p>
                  {error.includes('SERVICE_ROLE_KEY') && (
                    <p className="text-xs text-red-600 mt-2">
                      ⚠️ Você precisa configurar a variável de ambiente SUPABASE_SERVICE_ROLE_KEY
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instruções */}
          <div className="border-t pt-6">
            <h3 className="font-bold text-gray-900 mb-3">Como usar:</h3>
            <ol className="space-y-2 text-sm text-gray-700">
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">1.</span>
                <span>Configure a variável SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">2.</span>
                <span>Clique no botão "Corrigir Todas as Contas" acima</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">3.</span>
                <span>Aguarde o processamento (pode demorar alguns segundos)</span>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-600">4.</span>
                <span>Após a correção, todas as contas poderão fazer login normalmente</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Voltar */}
        <div className="text-center mt-6">
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Voltar para Login
          </Link>
        </div>
      </div>
    </div>
  );
}
