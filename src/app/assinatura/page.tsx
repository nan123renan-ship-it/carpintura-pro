"use client";

import { useState } from "react";
import { Check, CreditCard, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export const dynamic = "force-dynamic";

type BillingPeriod = "monthly" | "annual";

export default function AssinaturaPage() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plans = {
    monthly: {
      price: "29,00",
      period: "mês",
      total: "R$ 29,00/mês",
      savings: null,
    },
    annual: {
      price: "240,00",
      period: "ano",
      total: "R$ 20,00/mês",
      savings: "Economize R$ 108,00",
      badge: "Melhor oferta",
    },
  };

  const currentPlan = plans[billingPeriod];

  const features = [
    "Gestão completa de serviços",
    "Controle de despesas e receitas",
    "Relatórios financeiros detalhados",
    "Acesso ao app mobile e web",
    "Atualizações automáticas",
    "Backup automático de dados",
    "Sem limite de serviços",
  ];

  const handleSubscribe = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cria a preferência de pagamento no Mercado Pago
      const response = await fetch("/api/create-preference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: billingPeriod }),
      });

      if (!response.ok) {
        let errorMsg = "Erro ao processar pagamento. Tente novamente.";
        let errorDetails = "";
        try {
          const errorData = await response.json();
          console.error("Erro na resposta:", errorData);
          errorMsg = errorData.error || errorMsg;
          errorDetails = errorData.details || "";
        } catch (parseError) {
          console.error("Erro ao analisar resposta:", parseError);
        }

        // Combinar mensagem principal com detalhes se houver
        const fullErrorMsg = errorDetails ? `${errorMsg}\n\n${errorDetails}` : errorMsg;
        setError(fullErrorMsg);
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.init_point) {
        // Abre o checkout do Mercado Pago em uma nova aba
        // Isso resolve problemas com iframes e cookies bloqueados
        const checkoutWindow = window.open(data.init_point, '_blank');

        if (!checkoutWindow) {
          // Se o popup foi bloqueado, redireciona na mesma aba
          setError("Popup bloqueado! Redirecionando...");
          setTimeout(() => {
            window.location.href = data.init_point;
          }, 1500);
        } else {
          // Popup abriu com sucesso
          setLoading(false);
          setError(null);
        }
      } else {
        console.error("Resposta sem init_point:", data);
        setError("Não foi possível gerar o link de pagamento. Tente novamente.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro ao conectar com o servidor. Verifique sua conexão e tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-600 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            Planos Premium
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Escolha seu plano
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Tenha acesso completo ao Car Pintura Pro e gerencie seu negócio de
            forma profissional
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                billingPeriod === "monthly"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                billingPeriod === "annual"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Anual
              {billingPeriod === "annual" && plans.annual.savings && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-emerald-600 whitespace-nowrap">
                  {plans.annual.savings}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Card */}
        <Card className="p-8 mb-8 border-2 border-emerald-500 shadow-lg bg-white">
          <div className="flex flex-col items-center mb-8">
            {billingPeriod === "annual" && plans.annual.badge && (
              <Badge className="mb-4 bg-emerald-600 text-white">
                {plans.annual.badge}
              </Badge>
            )}

            <div className="flex items-baseline gap-2 mb-2">
              <div className="flex items-baseline gap-1 whitespace-nowrap">
                <span className="text-2xl font-bold text-gray-900">R$</span>
                <span className="text-5xl font-bold text-gray-900">{currentPlan.price}</span>
              </div>
              <span className="text-xl text-gray-500">
                /{currentPlan.period}
              </span>
            </div>

            {billingPeriod === "annual" && (
              <p className="text-sm text-gray-500">
                cobrado anualmente
              </p>
            )}
          </div>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            size="lg"
            className="w-full mb-4 bg-emerald-600 hover:bg-emerald-700 text-white text-lg h-14"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Abrindo checkout...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5 mr-2" />
                Assinar agora
              </>
            )}
          </Button>

          {!error && (
            <p className="text-xs text-center text-muted-foreground mb-4">
              💡 Uma nova aba será aberta com o checkout seguro
            </p>
          )}

          {/* Payment Methods Info */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-center text-gray-500 mb-2">
              💳 Formas de pagamento disponíveis:
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                PIX
              </Badge>
              <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                Cartão de Crédito
              </Badge>
              <Badge variant="outline" className="bg-white text-gray-700 border-gray-300">
                Boleto
              </Badge>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-4">
            <p className="font-semibold text-gray-900 mb-4">
              O que está incluído:
            </p>
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Trust Badges */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Pagamento seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Cancele quando quiser</span>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Ao assinar, você concorda com nossos Termos de Serviço e Política de
            Privacidade
          </p>
        </div>
      </div>
    </div>
  );
}
