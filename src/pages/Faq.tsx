import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, X, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEscapeGoBack } from '../hooks/useEscapeGoBack';

const FAQ_ITEMS = [
  {
    q: 'O que é o TrafficScope?',
    a: 'É uma plataforma que estima o tráfego web de qualquer domínio, mostrando volume de visitas, fontes de tráfego, distribuição geográfica e insights gerados por IA.'
  },
  {
    q: 'Qual a diferença entre o plano Gratuito e os planos pagos?',
    a: 'O plano Gratuito usa dados de demonstração (sintéticos), pensados para testares a plataforma sem custos. Os planos Pro e Enterprise usam dados reais de mercado, obtidos através de fontes especializadas de análise de tráfego.'
  },
  {
    q: 'Os dados do plano Gratuito são reais?',
    a: 'Não. São dados sintéticos gerados para fins de demonstração, mantendo padrões realistas, mas não refletem tráfego real do domínio pesquisado.'
  },
  {
    q: 'Quantos domínios posso analisar por dia?',
    a: 'O plano Gratuito não tem limite diário. O plano Pro permite até 20 domínios analisados por dia, e o Enterprise até 40.'
  },
  {
    q: 'Posso comparar vários domínios ao mesmo tempo?',
    a: 'Sim. O plano Pro permite comparar até 5 websites em simultâneo, e o Enterprise até 10.'
  },
  {
    q: 'Como funcionam os Insights de IA?',
    a: 'A IA analisa as métricas do domínio selecionado e gera um relatório com resumo executivo, fatores de crescimento, riscos, oportunidades e ações estratégicas recomendadas.'
  },
  {
    q: 'Posso exportar os relatórios?',
    a: 'Sim, em PDF ou Excel. O plano Gratuito tem exportação ilimitada, o Pro até 20 exportações por dia, e o Enterprise sem limite.'
  },
  {
    q: 'Como cancelo a minha subscrição?',
    a: 'Podes gerir ou cancelar a tua subscrição a qualquer momento através do painel de faturação associado à tua conta.'
  },
];

export default function Faq() {
  useEscapeGoBack();
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

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
        <h1 className="text-3xl font-bold text-foreground mb-8">Perguntas Frequentes</h1>
        <div className="space-y-2">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div key={i} className="border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-4 py-3.5 text-left text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
                >
                  {item.q}
                  <ChevronDown className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}