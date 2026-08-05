import React, { useState, useRef, useEffect } from 'react';
import { AiAnalysisReport, DomainMetrics } from '../types/domain';
import { RefreshCw, ArrowUp, X, Activity, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

type ChatMsg =
  | { sender: 'user'; kind: 'text'; text: string }
  | { sender: 'ai'; kind: 'text'; text: string }
  | { sender: 'ai'; kind: 'report'; domain: string; metrics: DomainMetrics; report: AiAnalysisReport };

const MAX_LINE_CHARS = 90;
const MAX_REPLY_CHARS = 600;

// Remove markdown (**negrito**, *itálico*, `código`, #títulos, listas, tabelas) —
// o chat mostra texto simples, não deve renderizar símbolos crus.
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^[-*]\s+/gm, '')
    // Linhas separadoras de tabela markdown, ex: |---|---|--- ou ---|---
    .replace(/^\s*\|?[\s:-]+\|[\s:|-]+$/gm, ' ')
    // Pipes de tabela → vírgula, para o conteúdo ficar legível em texto corrido
    .replace(/\s*\|\s*/g, ', ')
    .replace(/\n{2,}/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/,\s*,/g, ',')
    .replace(/^\s*,\s*|\s*,\s*$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Corta por nº de caracteres, mas tenta primeiro terminar num fim de frase
// (. ! ?) para não deixar a ideia a meio; só cai para corte por palavra
// se não houver nenhum fim de frase perto do limite.
function truncate(text: string, max = MAX_LINE_CHARS): string {
  const clean = cleanText(text);
  if (clean.length <= max) return clean;

  const slice = clean.slice(0, max);
  const lastSentenceEnd = Math.max(
    slice.lastIndexOf('. '),
    slice.lastIndexOf('! '),
    slice.lastIndexOf('? '),
    slice.endsWith('.') || slice.endsWith('!') || slice.endsWith('?') ? slice.length - 1 : -1
  );

  // Só usa o corte por frase se não perder demasiado conteúdo (pelo menos
  // 50% do limite); caso contrário, mantém o corte por palavra com reticências.
  if (lastSentenceEnd >= max * 0.5) {
    return slice.slice(0, lastSentenceEnd + 1).trim();
  }

  return slice.replace(/\s+\S*$/, '') + '…';
}

const DOT = {
  action: 'bg-foreground',
  opportunity: 'bg-emerald-500',
  risk: 'bg-rose-500'
} as const;

// Avatar do bot no chat — identidade do TrafficScope, igual ao ícone do Navbar.
function BotAvatar() {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
      <Activity className="h-3.5 w-3.5 text-foreground" />
    </div>
  );
}

// Avatar da marca analisada — só aparece na primeira mensagem (o relatório),
// para destacar de quem é a análise dentro da conversa.
function SiteAvatar({ domain }: { domain: string }) {
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={domain}
      className="h-6 w-6 shrink-0 rounded-full border border-border bg-background object-contain"
    />
  );
}

// ALTERADO: badge reutilizável "Dados de teste" — aparece sempre que
// metrics.dataSource === 'synthetic' (plano Free ou fallback da Apify).
function SyntheticBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-700',
        className
      )}
    >
      <FlaskConical className="h-3 w-3" />
      Dados de teste
    </span>
  );
}

function ReportBubble({ domain, metrics, report }: { domain: string; metrics: DomainMetrics; report: AiAnalysisReport }) {
  const isSynthetic = metrics?.dataSource === 'synthetic';

  return (
    <div className="max-w-full space-y-2 text-sm text-foreground">
      {isSynthetic && (
        <p className="text-xs text-amber-600">
          Esta análise é baseada em dados de teste (plano gratuito), não em tráfego real.
        </p>
      )}
      <p className="leading-6">
        <span className="font-semibold">{domain}</span>: {metrics.monthlyVisits.toLocaleString()} visitas/mês,{' '}
        {metrics.growthRate.toFixed(1)}% crescimento. {truncate(report.summary, 140)}
      </p>

      {report.strategicActions?.[0] && (
        <div className="flex items-start gap-2 leading-6">
          <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', DOT.action)} />
          <span>{truncate(report.strategicActions[0])}</span>
        </div>
      )}
      {report.opportunities?.[0] && (
        <div className="flex items-start gap-2 leading-6">
          <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', DOT.opportunity)} />
          <span>{truncate(report.opportunities[0])}</span>
        </div>
      )}
      {report.threatsAndRisks?.[0] && (
        <div className="flex items-start gap-2 leading-6">
          <span className={cn('mt-2 h-1.5 w-1.5 shrink-0 rounded-full', DOT.risk)} />
          <span>{truncate(report.threatsAndRisks[0])}</span>
        </div>
      )}
    </div>
  );
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
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastReportKey = useRef<string>('');

  const isSynthetic = metrics?.dataSource === 'synthetic';

  useEffect(() => {
    if (!aiReport) return;
    const key = `${domain}:${aiReport.summary}`;
    if (key === lastReportKey.current) return;
    lastReportKey.current = key;
    setChatMessages([{ sender: 'ai', kind: 'report', domain, metrics, report: aiReport }]);
  }, [aiReport, domain, metrics]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, isSending]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputQuestion]);

  const sendMessage = async () => {
    const userText = inputQuestion.trim();
    if (!userText || isSending) return;

    setChatMessages((prev) => [...prev, { sender: 'user', kind: 'text', text: userText }]);
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

      if (!res.ok) {
        const errorText = data?.error || 'Não foi possível processar o pedido agora.';
        setChatMessages((prev) => [...prev, { sender: 'ai', kind: 'text', text: errorText }]);
        return;
      }

      const reply = truncate(data.reply || 'Sem resposta no momento.', MAX_REPLY_CHARS);
      setChatMessages((prev) => [...prev, { sender: 'ai', kind: 'text', text: reply }]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', kind: 'text', text: 'Erro ao conectar ao serviço de IA.' }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  return (
    <div
      className={cn(
        'fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-1/2',
        isOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
      )}
    >
      {/* Header — identidade fixa do TrafficScope, não depende do domínio analisado */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="h-4 w-4 text-foreground shrink-0" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-foreground truncate">TrafficScope</h2>
          {/* ALTERADO: badge de dados de teste no cabeçalho do painel */}
          {isSynthetic && <SyntheticBadge className="ml-1" />}
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={onReanalyze}
            disabled={isAiLoading}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title="Atualizar análise"
          >
            <RefreshCw className={cn('h-4 w-4', isAiLoading && 'animate-spin')} />
          </Button>
          <Button onClick={onClose} variant="ghost" size="icon" className="h-8 w-8" title="Fechar">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-2xl space-y-4 py-4">
          {chatMessages.map((msg, index) => {
            if (msg.kind === 'report') {
              return (
                <div key={index} className="flex items-start gap-2">
                  <SiteAvatar domain={msg.domain} />
                  <ReportBubble domain={msg.domain} metrics={msg.metrics} report={msg.report} />
                </div>
              );
            }
            return (
              <div key={index} className={cn('flex items-start gap-2', msg.sender === 'user' && 'justify-end')}>
                {msg.sender === 'ai' && <BotAvatar />}
                <div
                  className={cn(
                    'text-sm text-foreground leading-6',
                    msg.sender === 'user' ? 'max-w-[80%] rounded-3xl bg-muted px-4 py-2.5' : 'max-w-full'
                  )}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="flex items-start gap-2">
              <BotAvatar />
              <div className="text-sm text-muted-foreground">A escrever…</div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 shrink-0">
        <div className="mx-auto flex max-w-2xl items-end gap-2 rounded-3xl border border-border bg-background px-4 py-2.5 focus-within:ring-1 focus-within:ring-ring">
          <textarea
  ref={textareaRef}
  rows={1}
  value={inputQuestion}
  onChange={(e) => setInputQuestion(e.target.value)}
  onKeyDown={handleKeyDown}
  placeholder="Pergunte sobre este domínio…"
  spellCheck={false}
  className="flex-1 resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-muted-foreground max-h-40"
/>
          <Button
            onClick={sendMessage}
            disabled={isSending || !inputQuestion.trim()}
            size="icon"
            className="h-8 w-8 rounded-full shrink-0"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};