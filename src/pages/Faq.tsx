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
    q: 'Qual a diferença entre Modo Teste e Modo Real?',
    a: 'O Modo Teste usa dados de demonstração (sintéticos), ilimitado e sem custo, pensado para testares a plataforma. O Modo Real usa dados reais de mercado, obtidos através de fontes especializadas de análise de tráfego, e consome 1 crédito por cada domínio pesquisado.'
  },
  {
    q: 'Os dados do Modo Teste são reais?',
    a: 'Não. São dados sintéticos gerados para fins de demonstração, mantendo padrões realistas, mas não refletem tráfego real do domínio pesquisado.'
  },
  {
    q: 'Como funcionam os créditos?',
    a: 'Compras créditos avulsos ($2 por cada 10 pesquisas), sem subscrição nem renovação automática. Cada pesquisa em Modo Real consome 1 crédito. Sem créditos disponíveis, a plataforma volta automaticamente ao Modo Teste.'
  },
  {
    q: 'Os créditos expiram?',
    a: 'Não. Os créditos comprados ficam disponíveis na tua conta até serem usados, sem prazo de validade.'
  },
  {
    q: 'Posso comparar vários domínios ao mesmo tempo?',
    a: 'Sim, o Modo Comparar permite analisar vários domínios lado a lado, tanto em Modo Teste como em Modo Real (cada domínio em Modo Real consome 1 crédito).'
  },
  {
    q: 'Como funcionam os Insights de IA?',
    a: 'A IA analisa as métricas do domínio selecionado e gera um relatório com resumo executivo, fatores de crescimento, riscos, oportunidades e ações estratégicas recomendadas. Está disponível tanto em Modo Teste como em Modo Real.'
  },
  {
    q: 'Posso exportar os relatórios?',
    a: 'Sim, em PDF ou Excel, sem limite de exportações, disponível para todos os utilizadores.'
  },
  {
    q: 'As minhas pesquisas em Modo Real ficam guardadas?',
    a: 'Sim. Toda pesquisa em Modo Real fica automaticamente guardada no teu Histórico de Pesquisas (até 50 mais recentes), onde podes reabrir e exportar os resultados sem gastar crédito outra vez.'
  },
  {
    q: 'Como compro créditos?',
    a: 'Podes comprar créditos a qualquer momento através do botão "Comprar Créditos" no teu perfil, no canto superior da plataforma.'
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