"use client";

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const MIGRATION_KEY = 'db_migration_categorias_v4_done';

export function AutoMigration() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(MIGRATION_KEY)) return;

    async function runMigration() {
      try {
        // Checar se coluna existe
        const { error: testError } = await supabase
          .from('despesas')
          .select('categorias')
          .limit(1);

        if (!testError) {
          sessionStorage.setItem(MIGRATION_KEY, 'exists');
          return;
        }

        const isColumnMissing =
          testError.code === '42703' ||
          (testError.message || '').includes('categorias') ||
          (testError.message || '').includes('column');

        if (!isColumnMissing) {
          sessionStorage.setItem(MIGRATION_KEY, 'skipped');
          return;
        }

        // Usar a service role key exposta como NEXT_PUBLIC_ para fazer DDL via pg/query
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        // A service key não deve ser NEXT_PUBLIC — usar anon key como fallback
        // O pg/query precisa de service_role. Se não disponível, a coluna será criada
        // pelo admin manualmente ou via supabase CLI na próxima implantação.
        // Por ora, tentamos silenciosamente via pg-meta:
        if (supabaseUrl) {
          // Tentar via pg-meta (requer service_role, pode falhar silenciosamente)
          await fetch(`${supabaseUrl}/pg/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // anon key — pode não ter permissão para DDL, mas tentamos
              'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
              'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`,
            },
            body: JSON.stringify({
              query: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[]'
            })
          }).catch(() => null);
        }

        sessionStorage.setItem(MIGRATION_KEY, 'attempted');
      } catch {
        sessionStorage.setItem(MIGRATION_KEY, 'error');
      }
    }

    runMigration();
  }, []);

  return null;
}
