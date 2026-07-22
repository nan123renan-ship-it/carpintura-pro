"use client";

import { useState } from "react";
import { Check, X, Clock, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function TestePagamentoPage() {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">("monthly");

  const plans = {
    monthly: {
      price: "29,00",
      period: "mês",
      total: "R$ 29,00/mês",
    },
    annual: {
      price: "240,00",
      period: "ano",
      total: "R$ 20,00/mês",
      savings: "Economize R$ 108,00",
      badge: "Melhor oferta",
    },
  };

  const handleTestPayment = (status: "sucesso" | "erro" | "pendente") => {
    const baseUrl = window.location.origin;
    const urls = {
      sucesso: `${baseUrl}/assinatura/sucesso?collection_status=approved&payment_id=TEST123456`,
      erro: `${baseUrl}/assinatura/erro?collection_status=rejected`,
      pendente: `${baseUrl}/assinatura/pendente?collection_status=pending`,
    };

    window.location.href = urls[status];
  };

  const currentPlan = plans[selectedPlan];

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-500 text-yellow-950">
            <Sparkles className="w-3 h-3 mr-1" />
            Modo de Teste - Simulação de Pagamento
          </Badge>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Teste o Fluxo de Pagamento
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Esta é uma página de teste para simular os diferentes status de pagamento sem precisar usar o checkout real do Mercado Pago
          </p>
        </div>

        {/* Plan Selection */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex items-center bg-muted p-1 rounded-lg">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                selectedPlan === "monthly"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setSelectedPlan("annual")}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all relative ${
                selectedPlan === "annual"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              {plans.annual.savings && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-primary whitespace-nowrap">
                  {plans.annual.savings}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Pricing Card */}
        <Card className="p-8 mb-8 border-2 border-primary shadow-lg">
          <div className="flex flex-col items-center mb-8">
            {selectedPlan === "annual" && plans.annual.badge && (
              <Badge className="mb-4 bg-primary text-primary-foreground">
                {plans.annual.badge}
              </Badge>
            )}

            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-5xl font-bold text-foreground">
                R$ {currentPlan.price}
              </span>
              <span className="text-xl text-muted-foreground">
                /{currentPlan.period}
              </span>
            </div>

            {selectedPlan === "annual" && (
              <p className="text-sm text-muted-foreground">
                {currentPlan.total} cobrado anualmente
              </p>
            )}
          </div>

          <div className="space-y-4">
            <p className="font-semibold text-foreground text-center mb-6">
              Simule um resultado de pagamento:
            </p>

            {/* Success Button */}
            <Button
              onClick={() => handleTestPayment("sucesso")}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white text-lg h-14"
            >
              <Check className="w-5 h-5 mr-2" />
              Simular Pagamento Aprovado
            </Button>

            {/* Pending Button */}
            <Button
              onClick={() => handleTestPayment("pendente")}
              size="lg"
              variant="outline"
              className="w-full border-2 border-yellow-500 text-yellow-700 hover:bg-yellow-50 text-lg h-14"
            >
              <Clock className="w-5 h-5 mr-2" />
              Simular Pagamento Pendente
            </Button>

            {/* Error Button */}
            <Button
              onClick={() => handleTestPayment("erro")}
              size="lg"
              variant="outline"
              className="w-full border-2 border-red-500 text-red-700 hover:bg-red-50 text-lg h-14"
            >
              <X className="w-5 h-5 mr-2" />
              Simular Pagamento Recusado
            </Button>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Como funciona:
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Clique em qualquer botão para simular o status de pagamento correspondente</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Você será redirecionado para a página de resultado (sucesso/erro/pendente)</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Teste o fluxo completo sem precisar usar o Mercado Pago real</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Perfeito para testar a experiência do usuário após o pagamento</span>
            </li>
          </ul>
        </Card>

        {/* Back Link */}
        <div className="text-center mt-8">
          <Link
            href="/assinatura"
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← Voltar para página de assinatura real
          </Link>
        </div>
      </div>
    </div>
  );
}
