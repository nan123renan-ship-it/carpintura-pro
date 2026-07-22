-- Habilitar RLS (Row Level Security)
alter database postgres set "app.jwt_secret" to 'your-jwt-secret';

-- Criar tabela de categorias de serviços
create table if not exists public.categorias_servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  nome_categoria text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Criar tabela de serviços
create table if not exists public.servicos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data_servico timestamptz not null,
  status text not null check (status in ('Orçamento', 'Em andamento', 'Finalizado', 'Pago')),
  status_pagamento text check (status_pagamento in ('pendente', 'resolvido')),
  tipo_lancamento text check (tipo_lancamento in ('receita', 'despesa')),
  nome_veiculo text not null,
  cliente_nome text not null,
  telefone_cliente text not null,
  carro_marca text not null,
  carro_modelo text not null,
  carro_ano integer not null,
  carro_placa text not null,
  cor_original text not null,
  servico_descricao text not null,
  categoria_id uuid references public.categorias_servicos(id) on delete set null,
  valor_cobrado numeric(10, 2) not null default 0,
  custo_materiais numeric(10, 2) not null default 0,
  custo_terceiros numeric(10, 2) not null default 0,
  outras_despesas_vinculadas numeric(10, 2) not null default 0,
  lucro_liquido numeric(10, 2) not null default 0,
  forma_pagamento text not null,
  observacoes text,
  cliente_recorrente boolean default false,
  fotos text[],
  foto_perfil_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Criar tabela de despesas
create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  data_despesa timestamptz not null,
  tipo_despesa text not null,
  descricao text not null,
  valor numeric(10, 2) not null,
  relacionado_a_servico boolean default false,
  observacoes text,
  origem text not null check (origem in ('servico', 'manual')),
  servico_id uuid references public.servicos(id) on delete cascade,
  forma_pagamento text,
  status_pagamento text check (status_pagamento in ('pago', 'pendente')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Criar índices para melhor performance
create index if not exists idx_categorias_user_id on public.categorias_servicos(user_id);
create index if not exists idx_servicos_user_id on public.servicos(user_id);
create index if not exists idx_servicos_data on public.servicos(data_servico);
create index if not exists idx_servicos_status on public.servicos(status);
create index if not exists idx_despesas_user_id on public.despesas(user_id);
create index if not exists idx_despesas_data on public.despesas(data_despesa);
create index if not exists idx_despesas_servico_id on public.despesas(servico_id);

-- Habilitar RLS em todas as tabelas
alter table public.categorias_servicos enable row level security;
alter table public.servicos enable row level security;
alter table public.despesas enable row level security;

-- Políticas RLS para categorias_servicos
create policy "Usuários podem ver suas próprias categorias"
  on public.categorias_servicos for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias categorias"
  on public.categorias_servicos for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias categorias"
  on public.categorias_servicos for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias categorias"
  on public.categorias_servicos for delete
  using (auth.uid() = user_id);

-- Políticas RLS para servicos
create policy "Usuários podem ver seus próprios serviços"
  on public.servicos for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir seus próprios serviços"
  on public.servicos for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar seus próprios serviços"
  on public.servicos for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar seus próprios serviços"
  on public.servicos for delete
  using (auth.uid() = user_id);

-- Políticas RLS para despesas
create policy "Usuários podem ver suas próprias despesas"
  on public.despesas for select
  using (auth.uid() = user_id);

create policy "Usuários podem inserir suas próprias despesas"
  on public.despesas for insert
  with check (auth.uid() = user_id);

create policy "Usuários podem atualizar suas próprias despesas"
  on public.despesas for update
  using (auth.uid() = user_id);

create policy "Usuários podem deletar suas próprias despesas"
  on public.despesas for delete
  using (auth.uid() = user_id);

-- Função para atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar updated_at
create trigger handle_categorias_updated_at
  before update on public.categorias_servicos
  for each row
  execute function public.handle_updated_at();

create trigger handle_servicos_updated_at
  before update on public.servicos
  for each row
  execute function public.handle_updated_at();

create trigger handle_despesas_updated_at
  before update on public.despesas
  for each row
  execute function public.handle_updated_at();
