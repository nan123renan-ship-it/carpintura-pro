# 🔧 Configuração do Mercado Pago

Este projeto usa o Mercado Pago para processar pagamentos de assinaturas. Siga os passos abaixo para configurar.

## 📋 Pré-requisitos

1. Criar uma conta no Mercado Pago (https://www.mercadopago.com.br)
2. Acessar o Painel de Desenvolvedores

## 🚀 Como Configurar

### 1️⃣ Obter o Access Token

1. Acesse: https://www.mercadopago.com.br/developers/panel/app
2. Clique em **"Criar aplicação"** (se não tiver nenhuma)
3. Dê um nome para sua aplicação (ex: "Car Pintura Pro")
4. Após criar, você verá duas credenciais:
   - **Access Token de Teste** (para desenvolvimento)
   - **Access Token de Produção** (para quando publicar)

### 2️⃣ Configurar no Projeto

1. Abra o arquivo `.env.local` na raiz do projeto
2. Encontre a linha: `MERCADOPAGO_ACCESS_TOKEN=TEST-your-token-here`
3. Substitua `TEST-your-token-here` pelo seu **Access Token de Teste**

Exemplo:
```env
MERCADOPAGO_ACCESS_TOKEN=TEST-1234567890-123456-abc123def456-12345678
```

### 3️⃣ Reiniciar o Servidor

Após adicionar o token, você precisa reiniciar o servidor de desenvolvimento:

```bash
# Pare o servidor (Ctrl+C) e inicie novamente:
npm run dev
```

## 🧪 Testando Pagamentos

Com o Access Token de **TESTE**, você pode usar dados de cartão de teste:

### Cartões de Teste do Mercado Pago:

- **Mastercard Aprovado**
  - Número: `5031 4332 1540 6351`
  - CVV: qualquer 3 dígitos
  - Validade: qualquer data futura

- **Visa Aprovado**
  - Número: `4509 9535 6623 3704`
  - CVV: qualquer 3 dígitos
  - Validade: qualquer data futura

- **PIX de Teste**
  - Ao escolher PIX, será gerado um QR Code de teste
  - O pagamento será aprovado automaticamente no ambiente de teste

## 📱 Formas de Pagamento Disponíveis

- ✅ **PIX** (instantâneo)
- ✅ **Cartão de Crédito** (parcelamento disponível)
- ✅ **Boleto Bancário**

## 🔒 Segurança

⚠️ **IMPORTANTE**:
- Nunca compartilhe seu Access Token
- Use o token de TESTE durante desenvolvimento
- Use o token de PRODUÇÃO apenas quando publicar
- Não commit o arquivo `.env.local` no Git (já está no .gitignore)

## 🌐 URLs de Callback

O projeto está configurado para usar estas URLs de retorno:
- Sucesso: `/assinatura/sucesso`
- Erro: `/assinatura/erro`
- Pendente: `/assinatura/pendente`

## 📚 Documentação Oficial

Para mais informações, consulte:
- [Documentação do Mercado Pago](https://www.mercadopago.com.br/developers/pt/docs)
- [Como obter credenciais](https://www.mercadopago.com.br/developers/pt/guides/overview/credentials)
- [Cartões de teste](https://www.mercadopago.com.br/developers/pt/guides/online-payments/checkout-api/testing)

## 🆘 Problemas Comuns

### Erro: "Configuração de pagamento inválida"
- ✅ Verifique se adicionou o token no `.env.local`
- ✅ Certifique-se de que o token não está vazio ou com valor padrão
- ✅ Reinicie o servidor após adicionar o token

### Pagamento não processado
- ✅ Verifique se está usando um cartão de teste válido
- ✅ Confira os logs do console para ver detalhes do erro
- ✅ Certifique-se de que o token é de TESTE (começa com TEST-)

## 🎉 Pronto!

Após configurar, a página de assinatura estará funcionando e você poderá testar todo o fluxo de pagamento!
