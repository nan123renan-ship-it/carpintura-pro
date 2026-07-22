// API Route para confirmar email automaticamente usando Service Role Key
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Cliente Admin do Supabase (com Service Role Key)
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Confirmar email do usuário usando Admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      }
    );

    if (error) {
      console.error('Erro ao confirmar email:', error);
      return NextResponse.json(
        { error: 'Erro ao confirmar email', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email confirmado com sucesso',
      user: data.user
    });

  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: 'Erro interno', details: error.message },
      { status: 500 }
    );
  }
}
