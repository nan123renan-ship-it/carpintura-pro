// API Route para corrigir usuários existentes que não conseguem fazer login
// Confirma automaticamente todos os emails não confirmados
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mvygwfjkuwvobfzseyxe.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar usuário por email usando Admin API
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Erro ao listar usuários:', listError);
      return NextResponse.json(
        { error: 'Erro ao buscar usuário' },
        { status: 500 }
      );
    }

    // Encontrar usuário com esse email
    const user = users.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se email já está confirmado
    if (user.email_confirmed_at) {
      return NextResponse.json({
        success: true,
        message: 'Email já estava confirmado',
        alreadyConfirmed: true
      });
    }

    // Confirmar email do usuário
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        email_confirm: true,
      }
    );

    if (error) {
      console.error('Erro ao confirmar email:', error);
      return NextResponse.json(
        { error: 'Erro ao confirmar email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso! Agora você pode fazer login.',
      user: {
        id: data.user.id,
        email: data.user.email,
      }
    });

  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno' },
      { status: 500 }
    );
  }
}
