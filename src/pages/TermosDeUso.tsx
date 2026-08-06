import React from 'react';
import { CompanyPagePanel } from '../components/CompanyPagePanel';

export default function TermosDeUso() {
  return (
    <CompanyPagePanel title="Termos de Uso">
      <p className="text-[11px] text-muted-foreground -mt-2">Última atualização: agosto de 2026</p>

      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">1. Aceitação dos termos</h2>
        <p>
          Ao utilizar o TrafficScope, aceitas estes Termos de Uso. Se não concordares
          com alguma condição, pedimos que não utilizes a plataforma.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">2. Natureza dos dados</h2>
        <p>
          O plano Gratuito apresenta dados sintéticos, gerados apenas para fins de
          demonstração, sem qualquer correspondência com tráfego real. Os planos Pro
          e Enterprise apresentam estimativas de tráfego obtidas através de fontes
          especializadas de terceiros; estes valores são estimativas de mercado e
          podem não refletir com exatidão o tráfego real de um website.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">3. Planos e limites de uso</h2>
        <p>
          Cada plano de subscrição tem limites próprios de utilização (número de
          domínios analisados por dia, comparação simultânea de websites, exportações
          e uso de funcionalidades de IA), conforme descrito na página de planos.
          Reservamo-nos o direito de ajustar estes limites mediante aviso prévio.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">4. Uso aceitável</h2>
        <p>
          Não é permitido utilizar a plataforma para fins ilegais, para tentar
          contornar os limites técnicos de uso, ou para extrair dados em massa de
          forma automatizada sem autorização prévia.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">5. Faturação e cancelamento</h2>
        <p>
          As subscrições pagas são faturadas de forma recorrente (mensal ou anual,
          conforme escolhido). Podes cancelar a tua subscrição a qualquer momento;
          o acesso às funcionalidades pagas mantém-se até ao final do período já
          pago.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">6. Limitação de responsabilidade</h2>
        <p>
          A plataforma é fornecida "tal como está". Não garantimos a exatidão
          absoluta das estimativas de tráfego apresentadas, nem nos responsabilizamos
          por decisões de negócio tomadas com base nestes dados.
        </p>
      </section>
      <section>
        <h2 className="text-foreground font-semibold text-sm mb-1.5">7. Alterações aos termos</h2>
        <p>
          Podemos atualizar estes Termos de Uso periodicamente. A utilização
          continuada da plataforma após alterações implica a aceitação dos novos
          termos.
        </p>
      </section>
    </CompanyPagePanel>
  );
}