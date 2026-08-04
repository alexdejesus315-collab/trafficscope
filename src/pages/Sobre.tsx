import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, X, ArrowLeft } from 'lucide-react';
import { useEscapeGoBack } from '../hooks/useEscapeGoBack';

export default function Sobre() {
  useEscapeGoBack();
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-200 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground mb-6">
          <Activity className="h-4 w-4" />
          TrafficScope
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Sobre Nós</h1>
        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
          <p>
            O TrafficScope é uma plataforma de inteligência competitiva focada em análise
            de tráfego web. Ajudamos profissionais de marketing, equipas de e-commerce e
            agências a entender melhor a presença digital de qualquer website — desde o
            volume de visitas até às fontes de tráfego e distribuição geográfica.
          </p>
          <p>
            A nossa missão é simples: tornar acessível a informação que antes exigia
            ferramentas caras e complexas, num painel direto e fácil de usar. Combinamos
            dados reais de mercado com insights gerados por inteligência artificial, para
            que cada análise venha acompanhada de recomendações estratégicas acionáveis.
          </p>
          <p>
            Acreditamos numa abordagem simples e transparente: sem excesso de informação
            desnecessária, sem métricas fabricadas — apenas os dados que realmente importam
            para tomar melhores decisões.
          </p>
        </div>
      </div>
    </div>
  );
}