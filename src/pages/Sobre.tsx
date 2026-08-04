import React from 'react';
import { Activity } from 'lucide-react';
import { useEscapeGoBack } from '../hooks/useEscapeGoBack';

export default function Sobre() {
  useEscapeGoBack();

  return (
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
  );
}