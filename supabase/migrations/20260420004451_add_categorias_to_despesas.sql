-- Adicionar coluna categorias (array de texto) na tabela despesas
ALTER TABLE public.despesas
  ADD COLUMN IF NOT EXISTS categorias text[];
