-- Criar tabela de anotações por perfil (usando user_profiles existente)
CREATE TABLE IF NOT EXISTS profile_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de serviços por perfil
CREATE TABLE IF NOT EXISTS profile_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  date DATE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de despesas por perfil
CREATE TABLE IF NOT EXISTS profile_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profile_notes_profile_id ON profile_notes(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_notes_user_id ON profile_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_services_profile_id ON profile_services(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_services_user_id ON profile_services(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_expenses_profile_id ON profile_expenses(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_expenses_user_id ON profile_expenses(user_id);

-- Habilitar RLS
ALTER TABLE profile_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_expenses ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profile_notes
DROP POLICY IF EXISTS "Usuários podem ver suas próprias anotações" ON profile_notes;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias anotações" ON profile_notes;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias anotações" ON profile_notes;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias anotações" ON profile_notes;

CREATE POLICY "Usuários podem ver suas próprias anotações"
  ON profile_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias anotações"
  ON profile_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias anotações"
  ON profile_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias anotações"
  ON profile_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para profile_services
DROP POLICY IF EXISTS "Usuários podem ver seus próprios serviços" ON profile_services;
DROP POLICY IF EXISTS "Usuários podem criar seus próprios serviços" ON profile_services;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios serviços" ON profile_services;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios serviços" ON profile_services;

CREATE POLICY "Usuários podem ver seus próprios serviços"
  ON profile_services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar seus próprios serviços"
  ON profile_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seus próprios serviços"
  ON profile_services FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus próprios serviços"
  ON profile_services FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para profile_expenses
DROP POLICY IF EXISTS "Usuários podem ver suas próprias despesas" ON profile_expenses;
DROP POLICY IF EXISTS "Usuários podem criar suas próprias despesas" ON profile_expenses;
DROP POLICY IF EXISTS "Usuários podem atualizar suas próprias despesas" ON profile_expenses;
DROP POLICY IF EXISTS "Usuários podem deletar suas próprias despesas" ON profile_expenses;

CREATE POLICY "Usuários podem ver suas próprias despesas"
  ON profile_expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias despesas"
  ON profile_expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias despesas"
  ON profile_expenses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar suas próprias despesas"
  ON profile_expenses FOR DELETE
  USING (auth.uid() = user_id);

-- Função para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_profile_notes_updated_at ON profile_notes;
DROP TRIGGER IF EXISTS update_profile_services_updated_at ON profile_services;
DROP TRIGGER IF EXISTS update_profile_expenses_updated_at ON profile_expenses;

CREATE TRIGGER update_profile_notes_updated_at BEFORE UPDATE ON profile_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_services_updated_at BEFORE UPDATE ON profile_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profile_expenses_updated_at BEFORE UPDATE ON profile_expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
