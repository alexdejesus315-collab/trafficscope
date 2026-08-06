import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyPagePanel } from '../components/CompanyPagePanel';

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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <CompanyPagePanel title="Perguntas Frequentes">
      <div className="space-y-2">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} className="border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
              >
                {item.q}
                <ChevronDown className={cn('h-3.5 w-3.5 shrink-0 transition-transform', isOpen && 'rotate-180')} />
              </button>
              {isOpen && (
                <div className="px-3 pb-3 text-xs text-muted-foreground">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </CompanyPagePanel>
  );
}