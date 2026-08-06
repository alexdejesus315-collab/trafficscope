import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';

export default function Sobre() {
  return (
    <CompanyPagePanel title="Sobre Nós">
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
    </CompanyPagePanel>
  );
}