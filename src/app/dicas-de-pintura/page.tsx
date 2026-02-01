"use client";

import { Lightbulb, ArrowLeft, Plus } from 'lucide-react';
import Link from 'next/link';

export default function DicasDePintura() {
  // Dicas estáticas de exemplo (placeholder para futuras funcionalidades)
  const dicasExemplo = [
    {
      id: 1,
      titulo: "Preparação da Superfície",
      descricao: "A preparação adequada da superfície é fundamental para um acabamento perfeito. Lixe bem e remova toda a sujeira antes de aplicar a tinta.",
      categoria: "Preparação"
    },
    {
      id: 2,
      titulo: "Temperatura Ideal",
      descricao: "Aplique a tinta em temperatura ambiente entre 20°C e 25°C. Temperaturas extremas podem afetar a secagem e o acabamento.",
      categoria: "Aplicação"
    },
    {
      id: 3,
      titulo: "Camadas Finas",
      descricao: "Aplique várias camadas finas em vez de uma camada grossa. Isso evita escorrimentos e garante um acabamento mais uniforme.",
      categoria: "Técnica"
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        
        {/* Cabeçalho */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Lightbulb className="w-7 h-7" />
            </div>
            <h1 className="text-3xl font-bold">Dicas de Pintura</h1>
          </div>
          
          <p className="text-amber-50 text-lg">
            Veja técnicas, truques e orientações para melhorar seus resultados na oficina.
          </p>
        </div>

        {/* Botão Adicionar (placeholder para futura funcionalidade) */}
        <div className="flex justify-end">
          <button
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm"
            disabled
            title="Em breve: adicionar suas próprias dicas"
          >
            <Plus className="w-5 h-5" />
            Adicionar Dica
          </button>
        </div>

        {/* Lista de Dicas */}
        <div className="space-y-4">
          {dicasExemplo.map((dica) => (
            <div
              key={dica.id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{dica.titulo}</h3>
                    <span className="text-xs px-2 py-1 bg-amber-100 text-amber-700 rounded-full">
                      {dica.categoria}
                    </span>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 leading-relaxed ml-13">
                {dica.descricao}
              </p>
            </div>
          ))}
        </div>

        {/* Área de Placeholder para Futuras Dicas */}
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 border-dashed text-center">
          <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Mais dicas em breve!
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Esta área está preparada para você cadastrar e gerenciar suas próprias dicas de pintura personalizadas.
          </p>
        </div>

      </div>
    </div>
  );
}
