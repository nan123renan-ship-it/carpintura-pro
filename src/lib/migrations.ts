// Aplica migrações pendentes no banco via RPC ou queries diretas
import { supabase } from './supabase';

let migracaoAplicada = false;

export async function aplicarMigracaoCategorias(): Promise<void> {
  if (migracaoAplicada) return;
  migracaoAplicada = true;

  try {
    // Testa se a coluna categorias já existe inserindo um valor nulo
    const { error } = await supabase
      .from('despesas')
      .select('categorias')
      .limit(1);

    if (error && (error.code === '42703' || error.message?.includes('categorias'))) {
      // Coluna não existe — tentar criar via RPC exec_sql se disponível
      await supabase.rpc('exec_sql', {
        query: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[];'
      }).catch(() => {
        // RPC não disponível — silenciosamente ignorar (o fallback via localStorage ainda funciona)
      });
    }
  } catch {
    // Ignorar erros de migração — o sistema tem fallback via localStorage
  }
}
