import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

const payment = new Payment(client);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Webhook recebido do Mercado Pago:", body);

    // Mercado Pago envia diferentes tipos de notificações
    const { type, data } = body;

    if (type === "payment") {
      const paymentId = data.id;

      // Busca os detalhes do pagamento
      const paymentInfo = await payment.get({ id: paymentId });

      console.log("Informações do pagamento:", {
        id: paymentInfo.id,
        status: paymentInfo.status,
        external_reference: paymentInfo.external_reference,
        payment_method_id: paymentInfo.payment_method_id,
        transaction_amount: paymentInfo.transaction_amount,
      });

      // Aqui você pode processar o pagamento de acordo com o status
      switch (paymentInfo.status) {
        case "approved":
          console.log("✅ Pagamento aprovado!");
          // TODO: Ativar assinatura do usuário no banco de dados
          // Exemplo: await ativarAssinatura(paymentInfo.external_reference);
          break;

        case "pending":
          console.log("⏳ Pagamento pendente (PIX ou Boleto)");
          // Pagamento está aguardando confirmação
          break;

        case "rejected":
          console.log("❌ Pagamento rejeitado");
          // Pagamento foi recusado
          break;

        default:
          console.log("Status desconhecido:", paymentInfo.status);
      }
    }

    // Retorna 200 para confirmar recebimento do webhook
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("Erro ao processar webhook:", error);
    // Mesmo com erro, retorna 200 para evitar reenvios
    return NextResponse.json({ received: true }, { status: 200 });
  }
}

// Método GET para verificar se a rota está funcionando
export async function GET() {
  return NextResponse.json({
    message: "Webhook do Mercado Pago está ativo",
    timestamp: new Date().toISOString(),
  });
}
