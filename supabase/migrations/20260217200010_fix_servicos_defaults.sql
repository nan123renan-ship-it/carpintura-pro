-- Adicionar valores padrão para campos que podem estar causando erro

-- Garantir que lucro_liquido tenha valor padrão
ALTER TABLE public.servicos
ALTER COLUMN lucro_liquido SET DEFAULT 0;

-- Garantir que outros campos numéricos tenham valores padrão já definidos
ALTER TABLE public.servicos
ALTER COLUMN valor_cobrado SET DEFAULT 0;

ALTER TABLE public.servicos
ALTER COLUMN custo_materiais SET DEFAULT 0;

ALTER TABLE public.servicos
ALTER COLUMN custo_terceiros SET DEFAULT 0;

ALTER TABLE public.servicos
ALTER COLUMN outras_despesas_vinculadas SET DEFAULT 0;
