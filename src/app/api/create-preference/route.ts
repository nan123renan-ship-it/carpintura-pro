import { NextRequest, NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

// Inicializa o cliente do Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || "",
});

const preference = new Preference(client);

export async function POST(request: NextRequest) {
  try {
    // Verifica se o token do Mercado Pago está configurado
    if (!process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MERCADOPAGO_ACCESS_TOKEN === 'TEST-your-token-here') {
      console.error("MERCADOPAGO_ACCESS_TOKEN não configurado");
      return NextResponse.json(
        {
          error: "Configure o MERCADOPAGO_ACCESS_TOKEN no arquivo .env.local para processar pagamentos.",
          details: "Acesse https://www.mercadopago.com.br/developers/panel/app para obter seu token."
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    // Define os detalhes do plano
    const plans = {
      monthly: {
        title: "Car Pintura Pro - Plano Mensal",
        unit_price: 29.0,
        quantity: 1,
        description: "Assinatura mensal do Car Pintura Pro",
      },
      annual: {
        title: "Car Pintura Pro - Plano Anual",
        unit_price: 240.0,
        quantity: 1,
        description: "Assinatura anual do Car Pintura Pro (Economize R$ 108,00)",
      },
    };

    const selectedPlan = plans[plan as keyof typeof plans];

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Plano inválido" },
        { status: 400 }
      );
    }

    // Obtém a URL base da aplicação
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ||
                   request.headers.get("origin") ||
                   "http://localhost:3000";

    console.log("Criando preferência de pagamento para:", {
      plan,
      appUrl,
      selectedPlan: selectedPlan.title,
    });

    // Determina se estamos em ambiente de produção (URLs públicas válidas)
    const isProduction = appUrl.includes('vercel.app') ||
                        appUrl.includes('https://') && !appUrl.includes('localhost');

    // Cria a preferência de pagamento
    const preferenceData = await preference.create({
      body: {
        items: [
          {
            id: `plan-${plan}`,
            title: selectedPlan.title,
            description: selectedPlan.description,
            quantity: selectedPlan.quantity,
            unit_price: selectedPlan.unit_price,
            currency_id: "BRL",
          },
        ],
        back_urls: {
          success: `${appUrl}/assinatura/sucesso`,
          failure: `${appUrl}/assinatura/erro`,
          pending: `${appUrl}/assinatura/pendente`,
        },
        // Só usa auto_return em produção (Mercado Pago não aceita com localhost)
        ...(isProduction && { auto_return: "approved" }),
        payment_methods: {
          excluded_payment_types: [], // Permite todos os tipos (cartão, PIX, boleto)
          installments: plan === "monthly" ? 1 : 12, // Permite parcelamento no anual
          default_payment_method_id: "pix", // Define PIX como método padrão
        },
        statement_descriptor: "CAR PINTURA PRO",
        external_reference: `subscription-${plan}-${Date.now()}`,
        // Só envia notification_url em produção
        ...(isProduction && { notification_url: `${appUrl}/api/webhooks/mercadopago` }),
      },
    });

    console.log("Preferência criada com sucesso:", {
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    });

    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
    });
  } catch (error: any) {
    console.error("Erro ao criar preferência:", error);
    console.error("Detalhes do erro:", {
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    return NextResponse.json(
      {
        error: "Erro ao processar pagamento",
        details: error.message || "Erro desconhecido"
      },
      { status: 500 }
    );
  }
}
