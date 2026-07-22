-- Adiciona coluna tipo_gasto para classificar despesas como empresarial ou pessoal
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS tipo_gasto text DEFAULT 'empresarial';
