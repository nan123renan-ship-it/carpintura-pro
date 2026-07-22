-- Adicionar coluna profile_id nas tabelas servicos e despesas
-- Isso permite separar as anotações por perfil ativo

-- Adicionar profile_id em servicos
ALTER TABLE servicos
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Adicionar profile_id em despesas
ALTER TABLE despesas
ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_servicos_profile_id ON servicos(profile_id);
CREATE INDEX IF NOT EXISTS idx_despesas_profile_id ON despesas(profile_id);

-- Atualizar registros existentes para vincular ao primeiro perfil do usuário
-- (apenas para dados já existentes, novos registros terão profile_id definido na criação)
UPDATE servicos s
SET profile_id = (
  SELECT id
  FROM user_profiles up
  WHERE up.user_id = s.user_id
  ORDER BY up.created_at ASC
  LIMIT 1
)
WHERE profile_id IS NULL AND user_id IS NOT NULL;

UPDATE despesas d
SET profile_id = (
  SELECT id
  FROM user_profiles up
  WHERE up.user_id = d.user_id
  ORDER BY up.created_at ASC
  LIMIT 1
)
WHERE profile_id IS NULL AND user_id IS NOT NULL;
