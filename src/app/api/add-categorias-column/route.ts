import { NextResponse } from 'next/server';

// Este endpoint serve JSON com o SQL a ser executado
// O cliente (browser) executa via fetch direto ao Supabase com service role key
export async function GET() {
  return NextResponse.json({
    sql: 'ALTER TABLE public.despesas ADD COLUMN IF NOT EXISTS categorias text[]',
    instructions: 'Execute this SQL in your Supabase project'
  });
}
