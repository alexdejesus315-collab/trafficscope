import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, X, ArrowLeft } from 'lucide-react';
import { useEscapeGoBack } from '../hooks/useEscapeGoBack';

export default function TermosDeUso() {
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Termos de Uso</h1>
        <p className="text-xs text-muted-foreground mb-8">Última atualização: agosto de 2026</p>

        <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">1. Aceitação dos termos</h2>
            <p>
              Ao utilizar o TrafficScope, aceitas estes Termos de Uso. Se não concordares
              com alguma condição, pedimos que não utilizes a plataforma.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">2. Natureza dos dados</h2>
            <p>
              O plano Gratuito apresenta dados sintéticos, gerados apenas para fins de
              demonstração, sem qualquer correspondência com tráfego real. Os planos Pro
              e Enterprise apresentam estimativas de tráfego obtidas através de fontes
              especializadas de terceiros; estes valores são estimativas de mercado e
              podem não refletir com exatidão o tráfego real de um website.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">3. Planos e limites de uso</h2>
            <p>
              Cada plano de subscrição tem limites próprios de utilização (número de
              domínios analisados por dia, comparação simultânea de websites, exportações
              e uso de funcionalidades de IA), conforme descrito na página de planos.
              Reservamo-nos o direito de ajustar estes limites mediante aviso prévio.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">4. Uso aceitável</h2>
            <p>
              Não é permitido utilizar a plataforma para fins ilegais, para tentar
              contornar os limites técnicos de uso, ou para extrair dados em massa de
              forma automatizada sem autorização prévia.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">5. Faturação e cancelamento</h2>
            <p>
              As subscrições pagas são faturadas de forma recorrente (mensal ou anual,
              conforme escolhido). Podes cancelar a tua subscrição a qualquer momento;
              o acesso às funcionalidades pagas mantém-se até ao final do período já
              pago.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">6. Limitação de responsabilidade</h2>
            <p>
              A plataforma é fornecida "tal como está". Não garantimos a exatidão
              absoluta das estimativas de tráfego apresentadas, nem nos responsabilizamos
              por decisões de negócio tomadas com base nestes dados.
            </p>
          </section>
          <section>
            <h2 className="text-foreground font-semibold text-base mb-2">7. Alterações aos termos</h2>
            <p>
              Podemos atualizar estes Termos de Uso periodicamente. A utilização
              continuada da plataforma após alterações implica a aceitação dos novos
              termos.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}