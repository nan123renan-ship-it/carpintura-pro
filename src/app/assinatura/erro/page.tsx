"use client";

import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default function ErroPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8 text-center bg-white border border-gray-200 shadow-lg">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Pagamento Não Aprovado
        </h1>

        <p className="text-gray-500 mb-8">
          Não foi possível processar seu pagamento. Isso pode acontecer por
          diversos motivos, como saldo insuficiente ou dados incorretos.
        </p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push("/assinatura")}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Voltar para o Início
          </Button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">
            Precisa de ajuda?
          </p>
          <Button
            variant="link"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => {
              window.location.href = "mailto:suporte@carpinturapro.com";
            }}
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Falar com o Suporte
          </Button>
        </div>
      </Card>
    </div>
  );
}
