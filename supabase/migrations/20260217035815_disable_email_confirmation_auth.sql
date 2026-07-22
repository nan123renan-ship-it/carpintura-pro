-- Desabilitar confirmação de email no Supabase Auth
-- Isso permite que usuários façam login imediatamente após cadastro

-- Atualizar a configuração do auth.config para não exigir confirmação
-- Nota: Esta configuração também deve ser aplicada no dashboard do Supabase

-- 1. Auto-confirmar novos usuários criados
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmar email do usuário
  UPDATE auth.users
  SET email_confirmed_at = NOW(),
      confirmed_at = NOW()
  WHERE id = NEW.id
  AND email_confirmed_at IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criar trigger para auto-confirmar usuários ao cadastrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Confirmar todos os usuários existentes que ainda não foram confirmados
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
    confirmed_at = COALESCE(confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- 4. Criar função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil na tabela 'perfis' automaticamente
  INSERT INTO public.perfis (id, nome, email, tipo_perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_perfil', 'pintor')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Comentário:
-- Esta migration resolve o erro "email rate limit exceeded" ao desabilitar
-- a necessidade de confirmação de email, permitindo login imediato após cadastro
