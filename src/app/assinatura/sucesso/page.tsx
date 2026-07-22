"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentId = searchParams.get("payment_id");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    console.log("Pagamento aprovado:", { paymentId, externalReference });
  }, [paymentId, externalReference]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border border-gray-200 shadow-lg">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Confirmado!
        </h1>

        <p className="text-gray-500 mb-8">
          Sua assinatura foi ativada com sucesso. Agora você tem acesso completo
          ao Car Pintura Pro!
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            Ir para o Dashboard
          </Button>

          <Button
            onClick={() => router.push("/servicos")}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <FileText className="w-4 h-4 mr-2" />
            Ver Meus Serviços
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

export default function SucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
