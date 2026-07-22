// API Route para confirmar TODOS os usuários existentes no banco
// Use esta rota APENAS UMA VEZ para corrigir contas antigas
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvygwfjkuwvobfzseyxe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada!');
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    // Buscar TODOS os usuários
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários', details: listError.message },
        { status: 500 }
      );
    }

    const results = {
      total: users.users.length,
      confirmed: 0,
      alreadyConfirmed: 0,
      errors: [] as any[]
    };

    // Confirmar email de cada usuário
    for (const user of users.users) {
      if (user.email_confirmed_at) {
        results.alreadyConfirmed++;
        continue;
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email_confirm: true,
        }
      );

      if (error) {
        console.error(`Erro ao confirmar ${user.email}:`, error);
        results.errors.push({ email: user.email, error: error.message });
      } else {
        console.log(`✅ Email confirmado: ${user.email}`);
        results.confirmed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Processo de confirmação concluído',
      results
    });

  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error.message },
      { status: 500 }
    );
  }
}
