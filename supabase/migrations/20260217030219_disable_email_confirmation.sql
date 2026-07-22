-- Configurar o Supabase Auth para não exigir confirmação de email
-- Isso permite que usuários façam login imediatamente após o cadastro

-- Atualizar configuração do auth para desabilitar confirmação de email
-- Nota: Esta configuração precisa ser feita também no dashboard do Supabase
-- em Authentication > Settings > Email Auth

-- Por enquanto, vamos garantir que os usuários possam fazer login
-- mesmo sem confirmar o email, atualizando manualmente os registros

-- Criar função para auto-confirmar usuários ao criar conta
CREATE OR REPLACE FUNCTION auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Confirmar email automaticamente
  NEW.email_confirmed_at = NOW();
  NEW.confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentário: Esta é uma solução temporária
-- O ideal é desabilitar a confirmação de email no dashboard do Supabase
-- em: Authentication > Email > Confirm email = OFF
