"use client";

// Auto-migration: adiciona colunas que não existem ainda no banco
// Executado pelo cliente (browser) que tem acesso ao Supabase via proxy

const MIGRATION_KEY = 'db_migration_categorias_v1';

export async function runAutoMigration() {
  if (typeof window === 'undefined') return;

  // Evitar rodar mais de uma vez por sessão
  if (sessionStorage.getItem(MIGRATION_KEY)) return;

  const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const serviceKey = (import.meta as any).env?.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) return;

  try {
    // Verificar se a coluna já existe tentando uma query
    const testRes = await fetch(`${supabaseUrl}/rest/v1/despesas?select=categorias&limit=1`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
      }
    });

    if (testRes.ok) {
      // Coluna já existe
      sessionStorage.setItem(MIGRATION_KEY, 'done');
      return;
    }

    // Coluna não existe (erro 400/500), tentar adicionar via pg-meta
    const pgMetaRes = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[]'
      })
    });

    if (pgMetaRes.ok) {
      console.log('[Migration] Coluna categorias adicionada com sucesso!');
    } else {
      const errText = await pgMetaRes.text();
      console.warn('[Migration] Falha ao adicionar coluna:', errText);
    }
  } catch (e) {
    // Silently fail - migration will retry next session
  }

  sessionStorage.setItem(MIGRATION_KEY, 'attempted');
}
