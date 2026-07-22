"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Clock, Home, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function PendenteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("payment_id");

  useEffect(() => {
    console.log("Pagamento pendente:", { paymentId });
  }, [paymentId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border border-gray-200 shadow-lg">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-yellow-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Pendente
        </h1>

        <p className="text-gray-500 mb-4">
          Seu pagamento está sendo processado. O tempo de confirmação depende da
          forma de pagamento escolhida.
        </p>

        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700 mb-3">
            <strong>⏱️ Tempo de processamento:</strong>
          </p>
          <ul className="text-sm text-gray-500 space-y-2 text-left">
            <li>• <strong>PIX:</strong> Instantâneo (até 2 minutos)</li>
            <li>• <strong>Cartão de Crédito:</strong> Alguns minutos</li>
            <li>• <strong>Boleto:</strong> Até 2 dias úteis</li>
          </ul>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg mb-8 border border-blue-200">
          <p className="text-sm text-gray-700 mb-2">
            <strong>📱 O que acontece agora?</strong>
          </p>
          <ul className="text-sm text-gray-500 space-y-1 text-left">
            <li>• Você receberá um email quando o pagamento for confirmado</li>
            <li>• O acesso será liberado automaticamente após a confirmação</li>
            <li>• Se pagou via PIX, aguarde alguns minutos e recarregue a página</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Voltar para o Início
          </Button>

          <Button
            onClick={() => window.location.reload()}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Verificar Status
          </Button>
        </div>

        {paymentId && (
          <p className="text-xs text-gray-400 mt-6">
            ID do Pagamento: {paymentId}
          </p>
        )}
      </Card>
    </div>
  );
}

export default function PendentePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <PendenteContent />
    </Suspense>
  );
}
