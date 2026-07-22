"use client";

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';

export function DebugAuth() {
  const { user, profile, loading } = useAuth();
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [show, setShow] = useState(false);

  useEffect(() => {
    setSupabaseUrl('https://sqgguqyczdxshuadtmww.supabase.co');
  }, []);

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-20 right-4 bg-red-600 text-white px-3 py-2 rounded-lg text-xs z-50"
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">🐛 Debug Info</h2>
          <button
            onClick={() => setShow(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-gray-700">Loading:</strong>
            <p className="text-gray-900">{loading ? 'Sim' : 'Não'}</p>
          </div>

          <div>
            <strong className="text-gray-700">Autenticado:</strong>
            <p className="text-gray-900">{user ? 'Sim' : 'Não'}</p>
          </div>

          {user && (
            <>
              <div>
                <strong className="text-gray-700">User ID:</strong>
                <p className="text-gray-900 break-all text-xs">{user.id}</p>
              </div>

              <div>
                <strong className="text-gray-700">Email:</strong>
                <p className="text-gray-900 break-all">{user.email}</p>
              </div>
            </>
          )}

          {profile && (
            <>
              <div>
                <strong className="text-gray-700">Nome do Perfil:</strong>
                <p className="text-gray-900">{profile.nome}</p>
              </div>

              <div>
                <strong className="text-gray-700">Tipo:</strong>
                <p className="text-gray-900">{profile.tipo_perfil}</p>
              </div>
            </>
          )}

          <div>
            <strong className="text-gray-700">Supabase URL:</strong>
            <p className="text-gray-900 break-all text-xs">{supabaseUrl}</p>
          </div>

          <div>
            <strong className="text-gray-700">Ambiente:</strong>
            <p className="text-gray-900">{typeof window !== 'undefined' ? 'browser' : 'server'}</p>
          </div>
        </div>

        <button
          onClick={async () => {
            const { data, error, count } = await supabase
              .from('servicos')
              .select('*', { count: 'exact' });

            const info = `
Total: ${count || 0} serviços
Carregados: ${data?.length || 0}
Erro: ${error?.message || 'nenhum'}

Detalhes do primeiro serviço:
${data && data[0] ? JSON.stringify(data[0], null, 2) : 'Nenhum'}
            `.trim();

            alert(info);
          }}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg text-sm"
        >
          🔍 Testar Query Serviços
        </button>

        <button
          onClick={async () => {
            const { data, error, count } = await supabase
              .from('despesas')
              .select('*', { count: 'exact' });

            const info = `
Total: ${count || 0} despesas
Carregadas: ${data?.length || 0}
Erro: ${error?.message || 'nenhum'}

Detalhes da primeira despesa:
${data && data[0] ? JSON.stringify(data[0], null, 2) : 'Nenhuma'}
            `.trim();

            alert(info);
          }}
          className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg text-sm"
        >
          🔍 Testar Query Despesas
        </button>

        <button
          onClick={() => {
            console.clear();
            alert('Console limpo! Agora recarregue a página e veja os logs no console do navegador.');
          }}
          className="mt-2 w-full bg-gray-600 text-white py-2 rounded-lg text-sm"
        >
          🧹 Limpar Console
        </button>
      </div>
    </div>
  );
}
