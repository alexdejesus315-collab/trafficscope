import React, { useState } from 'react';
import { AiAnalysisReport, DomainMetrics } from '../types/domain';
import { Sparkles, TrendingUp, Lightbulb, Target, Bot, Send, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface AiInsightsModalProps {
  domain: string;
  metrics: DomainMetrics;
  aiReport?: AiAnalysisReport;
  isOpen: boolean;
  onClose: () => void;
  onReanalyze: () => void;
  isAiLoading: boolean;
}

export const AiInsightsModal: React.FC<AiInsightsModalProps> = ({
  domain,
  metrics,
  aiReport,
  isOpen,
  onClose,
  onReanalyze,
  isAiLoading
}) => {
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    {
      sender: 'ai',
      text: `Olá! Sou o Copilot de Inteligência Competitiva da TrafficScope. Posso ajudar você a analisar gargalos de conversão, comparar com concorrentes e sugerir ações de SEO para ${domain}. Qual a sua pergunta?`
    }
  ]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuestion.trim() || isSending) return;

    const userText = inputQuestion.trim();
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputQuestion('');
    setIsSending(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          metrics,
          messages: [{ role: 'user', content: userText }]
        })
      });

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: data.reply || 'Não foi possível obter resposta no momento.' }
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Ocorreu um erro ao conectar ao serviço de IA.' }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">Insights de IA para {domain}</DialogTitle>
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-background p-6 shadow-2xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  Relatório Executivo IA
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold text-foreground">{domain}</h2>
                  <p className="text-sm text-muted-foreground max-w-2xl">
                    Insights automatizados e recomendações estratégicas para melhorar tráfego, conversão e competitividade do seu website.
                  </p>
                </div>
              </div>
              <Button
                onClick={onReanalyze}
                disabled={isAiLoading}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isAiLoading && 'animate-spin')} />
                Atualizar Análise
              </Button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-xl border border-border bg-muted/70 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visitas</p>
                <p className="mt-2 text-xl font-bold text-foreground">{metrics.monthlyVisits.toLocaleString()}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/70 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Crescimento</p>
                <p className="mt-2 text-xl font-bold text-foreground">{metrics.growthRate.toFixed(1)}%</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/70 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Duração</p>
                <p className="mt-2 text-xl font-bold text-foreground">{metrics.avgVisitDuration}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/70 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Páginas / sessão</p>
                <p className="mt-2 text-xl font-bold text-foreground">{metrics.pagesPerVisit}</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/70 p-4 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Bounce Rate</p>
                <p className="mt-2 text-xl font-bold text-foreground">{metrics.bounceRate}%</p>
              </div>
            </div>
          </div>

          {aiReport && (
            <div className="grid gap-4 xl:grid-cols-[1.4fr_0.9fr]">
              <div className="space-y-4">
                <Card className="p-6 bg-muted/50 border border-border">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        Resumo Executivo
                      </p>
                      <h3 className="mt-2 text-lg font-semibold text-foreground">Principais conclusões para {domain}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">
                    {aiReport.summary}
                  </p>
                </Card>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-5 border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Alavancas de Crescimento</h4>
                    <ul className="mt-4 space-y-3 text-sm text-foreground">
                      {aiReport.growthDrivers?.map((driver, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 text-emerald-600 dark:text-emerald-400">•</span>
                          <span>{driver}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-5 border border-border">
                    <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Oportunidades de Mercado</h4>
                    <ul className="mt-4 space-y-3 text-sm text-foreground">
                      {aiReport.opportunities?.map((opp, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="mt-1 text-amber-600 dark:text-amber-400">•</span>
                          <span>{opp}</span>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <Card className="p-5 border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Riscos & Ameaças</h4>
                  <ul className="mt-4 space-y-3 text-sm text-foreground">
                    {aiReport.threatsAndRisks?.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 text-rose-500 dark:text-rose-400">•</span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="p-5 border border-border">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Ações Recomendadas</p>
                      <p className="mt-1 text-sm text-muted-foreground">Tarefas para melhorar performance nos próximos 30 dias.</p>
                    </div>
                    <Target className="h-5 w-5 text-foreground" />
                  </div>
                  <ul className="mt-4 space-y-3 text-sm text-foreground">
                    {aiReport.strategicActions?.map((action, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="mt-1 text-foreground font-bold">•</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card className="p-5 border border-border">
                  <h4 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Previsão de Crescimento</h4>
                  <div className="mt-4 grid gap-3 text-sm">
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cenário Otimista</p>
                      <p className="mt-3 text-xl font-semibold text-emerald-600 dark:text-emerald-400">
                        {aiReport.forecast3Months?.optimistic ? `+${(aiReport.forecast3Months.optimistic / 1000000).toFixed(1)}M` : 'N/A'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">impacto esperado se as melhorias forem aplicadas</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cenário Base</p>
                      <p className="mt-3 text-xl font-semibold text-foreground">
                        {aiReport.forecast3Months?.baseline ? `${(aiReport.forecast3Months.baseline / 1000000).toFixed(1)}M` : 'N/A'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">projeção conservadora</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-4">
                      <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Cenário Pessimista</p>
                      <p className="mt-3 text-xl font-semibold text-rose-600 dark:text-rose-400">
                        {aiReport.forecast3Months?.pessimistic ? `-${(aiReport.forecast3Months.pessimistic / 1000000).toFixed(1)}M` : 'N/A'}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">queda esperada sem ação rápida</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          <Card className="p-6 border border-border">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Copilot de IA</p>
                <h3 className="mt-2 text-lg font-semibold text-foreground">Pergunte sobre seus dados e estratégias</h3>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                <Bot className="h-4 w-4" />
                Conversação Inteligente
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <div className="max-h-[34rem] overflow-y-auto rounded-xl border border-border bg-muted/80 p-4">
                <div className="space-y-4">
                  {chatMessages.map((msg, index) => (
                    <div key={index} className={cn('flex', msg.sender === 'user' ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-2xs',
                        msg.sender === 'user'
                          ? 'bg-foreground text-background rounded-br-[6px]'
                          : 'bg-background text-foreground rounded-bl-[6px] border border-border'
                      )}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSendChat} className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="text"
                  value={inputQuestion}
                  onChange={(e) => setInputQuestion(e.target.value)}
                  placeholder="Pergunte algo sobre o desempenho ou concorrência deste site..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSending || !inputQuestion.trim()}
                  size="sm"
                  className="w-full gap-2 sm:w-auto"
                >
                  <Send className="h-3.5 w-3.5" />
                  Enviar
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};