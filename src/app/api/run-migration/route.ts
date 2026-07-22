import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route is called from the browser (which has Supabase access)
// The browser passes its session token and we execute the migration server-side
// using the service role key

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing configuration' }, { status: 500 });
    }

    // Use the supabase-js client which handles the proxy internally
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Try to query the categorias column - if it fails, we need to add it
    const { error: testError } = await supabase
      .from('despesas')
      .select('categorias')
      .limit(1);

    if (!testError) {
      return NextResponse.json({ success: true, message: 'Coluna já existe!' });
    }

    // Column doesn't exist - this is expected for 42703 (undefined_column)
    if (testError.code === '42703' || testError.message?.includes('categorias')) {
      // Use the pg-meta endpoint to execute DDL
      const ddlRes = await fetch(`${supabaseUrl}/pg/query`, {
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

      if (ddlRes.ok) {
        return NextResponse.json({ success: true, message: 'Coluna categorias adicionada!' });
      }

      const ddlErr = await ddlRes.text();
      return NextResponse.json({ error: 'DDL failed', details: ddlErr, status: ddlRes.status }, { status: 500 });
    }

    return NextResponse.json({
      error: 'Unexpected error',
      code: testError.code,
      message: testError.message
    }, { status: 500 });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
