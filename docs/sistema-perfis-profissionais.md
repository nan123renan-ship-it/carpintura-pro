# Sistema de Perfis Profissionais

## Resumo

O sistema agora suporta múltiplos perfis profissionais por usuário, onde cada perfil mantém seus próprios dados completamente isolados. Quando você faz login e escolhe um perfil (Pintor, Preparador, Polidor, Funileiro ou Dono de Oficina), todas as anotações, serviços e despesas são específicas daquele perfil.

## Como Funciona

### 1. Estrutura do Banco de Dados

Foram criadas 4 tabelas principais:

**`user_profiles`** - Armazena os perfis do usuário
- Cada usuário pode ter múltiplos perfis (Pintor, Preparador, etc.)
- Um perfil é selecionado por vez

**`profile_notes`** - Anotações por perfil
- Cada anotação pertence a um perfil específico
- Anotações do Pintor não aparecem no Preparador

**`profile_services`** - Serviços por perfil
- Serviços registrados em um perfil não aparecem em outro
- Cada perfil tem sua própria lista de serviços

**`profile_expenses`** - Despesas por perfil
- Despesas são isoladas por perfil
- O Pintor pode ter despesas diferentes do Polidor

### 2. Segurança (RLS - Row Level Security)

Todas as tabelas têm políticas de segurança configuradas:
- Cada usuário só vê seus próprios dados
- Não é possível acessar dados de outro usuário
- O banco de dados garante o isolamento automaticamente

### 3. Fluxo de Uso

1. **Login** - Usuário faz login com email e senha
2. **Escolha do Perfil** - Seleciona qual perfil quer usar (ex: Pintor)
3. **Dados Isolados** - Vê apenas os dados daquele perfil
4. **Trocar Perfil** - Pode mudar para outro perfil a qualquer momento
5. **Dados Preservados** - Ao voltar para o perfil anterior, todos os dados estarão lá

## Exemplo Prático

### Usuário: João Silva

**Perfil Pintor:**
- Anotação: "Comprar tinta azul metálico"
- Serviço: "Pintura completa - Civic 2020"
- Despesa: "Tinta R$ 450,00"

**Perfil Preparador:**
- Anotação: "Lixar porta traseira do Corolla"
- Serviço: "Preparação de lataria - HB20"
- Despesa: "Lixa R$ 80,00"

Quando João está no perfil Pintor, ele vê apenas as anotações, serviços e despesas do Pintor. Quando muda para Preparador, vê apenas os dados do Preparador. Os dados não se misturam.

## Tecnologias Utilizadas

- **Supabase/PostgreSQL** - Banco de dados
- **Row Level Security (RLS)** - Segurança e isolamento de dados
- **React Context** - Gerenciamento de estado do perfil selecionado
- **Next.js** - Framework frontend

## Migrations Aplicadas

As seguintes migrations foram aplicadas ao banco de dados:

1. `20260218153945_setup_profile_based_data.sql` - Estrutura inicial
2. `20260218154125_add_profile_data_tables.sql` - Tabelas de dados por perfil

## Como Consultar os Dados

### Ver todos os perfis de um usuário
```sql
SELECT * FROM user_profiles 
WHERE user_id = 'seu-user-id';
```

### Ver anotações de um perfil específico
```sql
SELECT * FROM profile_notes 
WHERE profile_id = 'seu-profile-id';
```

### Ver serviços de um perfil específico
```sql
SELECT * FROM profile_services 
WHERE profile_id = 'seu-profile-id';
```

### Ver despesas de um perfil específico
```sql
SELECT * FROM profile_expenses 
WHERE profile_id = 'seu-profile-id';
```

## Arquivos Modificados

- `src/contexts/ProfileContext.tsx` - Novo contexto para gerenciar perfis
- `src/app/layout.tsx` - Adicionado ProfileProvider
- `supabase/migrations/` - Migrations do banco de dados

## Próximos Passos

Para usar o sistema de perfis nas suas páginas:

1. Importe o hook `useProfile` do ProfileContext
2. Use `currentProfile` para saber qual perfil está ativo
3. Use `profiles` para listar todos os perfis disponíveis
4. Use `selectProfile(id)` para mudar de perfil

```typescript
import { useProfile } from '@/contexts/ProfileContext';

function MeuComponente() {
  const { currentProfile, profiles, selectProfile } = useProfile();
  
  // currentProfile contém o perfil ativo
  // profiles contém todos os perfis do usuário
  // selectProfile(id) muda para outro perfil
}
```
