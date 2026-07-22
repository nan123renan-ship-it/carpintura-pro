import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (_req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Adicionar coluna categorias se não existir
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[]'
    });

    if (error && !error.message?.includes('already exists')) {
      // Tentar via query direta
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[]' })
      });

      return new Response(JSON.stringify({
        success: res.ok,
        status: res.status,
        error: error.message
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
