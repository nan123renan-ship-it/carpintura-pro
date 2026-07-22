-- Criar tabela de perfis para armazenar informações do usuário
CREATE TABLE IF NOT EXISTS public.perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  tipo_perfil VARCHAR(100) NOT NULL DEFAULT 'Pintor',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_perfis_email ON public.perfis(email);

-- RLS (Row Level Security) - Usuários podem ler apenas seus próprios dados
ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON public.perfis;
DROP POLICY IF EXISTS "Permitir inserção de perfis" ON public.perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios dados" ON public.perfis;

-- Política: usuário pode ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
ON public.perfis
FOR SELECT
USING (auth.uid() = id);

-- Política: permitir inserção para novos usuários (cadastro)
CREATE POLICY "Permitir inserção de perfis"
ON public.perfis
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Política: usuário pode atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON public.perfis
FOR UPDATE
USING (auth.uid() = id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_perfis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_perfis_updated_at ON public.perfis;
CREATE TRIGGER update_perfis_updated_at
BEFORE UPDATE ON public.perfis
FOR EACH ROW
EXECUTE FUNCTION update_perfis_updated_at();

-- Função para criar perfil automaticamente quando usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Criar perfil na tabela 'perfis' automaticamente
  INSERT INTO public.perfis (id, nome, email, tipo_perfil)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Usuário'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'tipo_perfil', 'Pintor')
  )
  ON CONFLICT (id) DO UPDATE SET
    nome = COALESCE(NEW.raw_user_meta_data->>'nome', perfis.nome),
    tipo_perfil = COALESCE(NEW.raw_user_meta_data->>'tipo_perfil', perfis.tipo_perfil);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_profile();

-- Auto-confirmar email de novos usuários (evitar erro de confirmação)
CREATE OR REPLACE FUNCTION public.handle_new_user_confirm()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirmar email do usuário
  IF NEW.email_confirmed_at IS NULL THEN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_confirm ON auth.users;
CREATE TRIGGER on_auth_user_created_confirm
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_confirm();

-- Confirmar todos os usuários existentes que ainda não foram confirmados
UPDATE auth.users
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;
