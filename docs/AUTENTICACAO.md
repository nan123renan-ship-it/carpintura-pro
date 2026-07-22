# Sistema de Autenticação - Carpintura Pro

## 🎯 Visão Geral

O sistema de autenticação foi implementado usando **Supabase Auth** integrado com React Context, garantindo segurança e facilidade de uso.

## 🚀 Funcionalidades

### ✅ Cadastro de Usuário
- Tela de cadastro em 2 etapas:
  1. **Dados Pessoais**: Nome, e-mail e senha
  2. **Seleção de Perfil**: Escolha entre 5 perfis profissionais:
     - 🎨 Pintor
     - 🔧 Preparador
     - ✨ Polidor
     - 🔨 Funileiro
     - 🏢 Dono de Oficina

### ✅ Login
- Autenticação por e-mail e senha
- Validação de campos
- Mensagens de erro claras
- Redirecionamento automático após login

### ✅ Proteção de Rotas
- Apenas usuários autenticados podem acessar o dashboard
- Redirecionamento automático para login se não autenticado
- Loading state durante verificação de autenticação

### ✅ Gerenciamento de Sessão
- Sessão persistente (permanece logado após recarregar)
- Logout seguro
- Sincronização automática do estado de autenticação

## 📁 Estrutura de Arquivos

```
src/
├── contexts/
│   └── AuthContext.tsx          # Contexto de autenticação global
├── app/
│   ├── login/
│   │   └── page.tsx            # Tela de login
│   └── auth/
│       └── cadastro/
│           └── page.tsx        # Tela de cadastro de usuário
└── components/
    └── custom/
        └── ProtectedRoute.tsx  # HOC para proteger rotas
```

## 🔐 Como Funciona

### 1. Contexto de Autenticação (`AuthContext.tsx`)

Fornece as seguintes funcionalidades:

```typescript
const {
  user,        // Usuário autenticado atual
  profile,     // Perfil do usuário (nome, tipo_perfil)
  session,     // Sessão do Supabase
  loading,     // Estado de carregamento
  signUp,      // Função para criar conta
  signIn,      // Função para fazer login
  signOut,     // Função para fazer logout
  updateProfile // Função para atualizar perfil
} = useAuth();
```

### 2. Fluxo de Cadastro

```typescript
// Criar nova conta
const { error } = await signUp(
  email,        // E-mail do usuário
  password,     // Senha (mínimo 6 caracteres)
  nome,         // Nome completo
  tipoPerfil    // Um dos 5 perfis disponíveis
);

if (!error) {
  // Usuário criado com sucesso
  // Redirecionado automaticamente para o dashboard
}
```

### 3. Fluxo de Login

```typescript
// Fazer login
const { error } = await signIn(email, password);

if (!error) {
  // Login bem-sucedido
  // Redirecionado automaticamente para o dashboard
}
```

### 4. Proteção de Rotas

Envolva páginas que requerem autenticação com o componente `ProtectedRoute`:

```typescript
import { ProtectedRoute } from '@/components/custom/ProtectedRoute';

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      {/* Conteúdo da página */}
    </ProtectedRoute>
  );
}
```

## 🎨 Telas Criadas

### 🔑 Login (`/login`)
- Campo de e-mail
- Campo de senha (com opção de mostrar/ocultar)
- Botão de login
- Link para criar nova conta
- Link "Esqueci minha senha"
- Logo da aplicação
- Background decorativo

### ✍️ Cadastro (`/auth/cadastro`)
- **Etapa 1 - Dados**:
  - Nome completo
  - E-mail
  - Senha
  - Confirmar senha
  - Validações em tempo real

- **Etapa 2 - Perfil**:
  - Grid com 5 perfis profissionais
  - Ícones customizados para cada perfil
  - Cores exclusivas por perfil
  - Descrição de cada perfil

## 🔄 Integração com Dados Existentes

O sistema é **retrocompatível** com os dados já salvos no localStorage:

1. Se o usuário não estiver cadastrado no Supabase, os dados do `localStorage` são mantidos
2. Ao criar uma conta, o perfil é sincronizado entre Supabase e localStorage
3. O sistema funciona mesmo se a tabela `perfis` não existir no banco (fallback para localStorage)

## 🛡️ Segurança

- ✅ Senhas criptografadas (hash) no Supabase
- ✅ Tokens JWT para autenticação
- ✅ Sessões seguras com refresh automático
- ✅ Validação de e-mail
- ✅ Proteção contra XSS e CSRF
- ✅ Row Level Security (RLS) no Supabase

## 📝 Variáveis de Ambiente Necessárias

As variáveis já estão configuradas no `.env`:

```bash
VITE_SUPABASE_URL=https://mvygwfjkuwvobfzseyxe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 🎯 Próximos Passos

Para migrar completamente para multi-usuário:

1. ✅ Sistema de autenticação criado
2. 🔄 Vincular serviços e despesas ao usuário logado
3. 🔄 Filtrar dados por usuário
4. 🔄 Migração de dados do localStorage para banco

## 🚦 Como Testar

1. **Criar uma conta**:
   - Acesse `/auth/cadastro`
   - Preencha nome, e-mail e senha
   - Escolha seu perfil
   - Clique em "Criar Conta"

2. **Fazer login**:
   - Acesse `/login`
   - Digite e-mail e senha
   - Clique em "Entrar"

3. **Acessar dashboard**:
   - Após login, você será redirecionado para `/`
   - Apenas usuários autenticados podem ver o dashboard

4. **Fazer logout**:
   - No dashboard, clique no ícone de perfil
   - Selecione "Sair"

## ❓ Troubleshooting

### "Erro ao fazer login"
- Verifique se o e-mail está correto
- Verifique se a senha tem pelo menos 6 caracteres
- Certifique-se de que já criou uma conta

### "Este e-mail já está cadastrado"
- Use o link "Fazer Login" na tela de cadastro
- Ou use a função "Esqueci minha senha"

### Redirecionamento infinito
- Limpe o cache do navegador
- Verifique as variáveis de ambiente do Supabase

## 📞 Suporte

Em caso de dúvidas ou problemas, entre em contato com o time de desenvolvimento.

---

**Criado por Lasy AI** | © 2026 Carpintura Pro
