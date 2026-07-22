-- Criação da tabela de usuários completa
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha_hash TEXT NOT NULL,
  tipo_perfil VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida por email
CREATE INDEX idx_usuarios_email ON public.usuarios(email);

-- RLS (Row Level Security) - Usuários podem ler apenas seus próprios dados
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Política: usuário pode ver apenas seus próprios dados
CREATE POLICY "Usuários podem ver seus próprios dados"
ON public.usuarios
FOR SELECT
USING (auth.uid()::text = id::text);

-- Política: permitir inserção para novos usuários (cadastro)
CREATE POLICY "Permitir cadastro de novos usuários"
ON public.usuarios
FOR INSERT
WITH CHECK (true);

-- Política: usuário pode atualizar apenas seus próprios dados
CREATE POLICY "Usuários podem atualizar seus próprios dados"
ON public.usuarios
FOR UPDATE
USING (auth.uid()::text = id::text);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tabela para vincular dados dos serviços e despesas aos usuários
-- Adicionar coluna usuario_id às tabelas existentes (se ainda não existir)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'servicos' AND column_name = 'usuario_id') THEN
    ALTER TABLE public.servicos ADD COLUMN usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'despesas' AND column_name = 'usuario_id') THEN
    ALTER TABLE public.despesas ADD COLUMN usuario_id UUID REFERENCES public.usuarios(id) ON DELETE CASCADE;
  END IF;
END $$;
