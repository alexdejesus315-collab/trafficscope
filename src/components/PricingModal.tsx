import React from 'react';
import { PlanType } from '../types/domain';
import { Crown, Check, X, Sparkles } from 'lucide-react';
import { PADDLE_PRICES } from '../lib/paddleConfig';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanType;
  onChangePlan: (plan: PlanType) => void;
  userId?: string;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  isOpen,
  onClose,
  currentPlan,
  onChangePlan,
  userId
}) => {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('monthly');

  const handleProCheckout = () => {
    if (!userId) {
      alert('É necessário iniciar sessão antes de subscrever.');
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICES.pro[billingCycle], quantity: 1 }],
      customData: { user_id: userId },
    });
  };

  const handleEnterpriseCheckout = () => {
    if (!userId) {
      alert('É necessário iniciar sessão antes de subscrever.');
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICES.enterprise.monthly, quantity: 1 }],
      customData: { user_id: userId },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto pt-2">
          <Badge variant="secondary" className="gap-1.5">
            <Crown className="h-3.5 w-3.5 text-amber-500" />
            Planos de Subscrição SaaS
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">
            Escolha o Plano Ideal para a Sua Empresa
          </h2>
          <p className="text-xs text-muted-foreground">
            Acesso completo a ferramentas de inteligência de mercado, relatórios em PDF/Excel e insights com IA
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 bg-muted rounded-lg p-1 w-fit mx-auto">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
              billingCycle === 'monthly' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
            )}
          >
            Mensal
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={cn(
              "px-4 py-1.5 rounded-md text-xs font-bold transition-all",
              billingCycle === 'annual' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
            )}
          >
            Anual
          </button>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">

          {/* 1. Plano Gratuito */}
          <Card className={cn(
            "p-6 flex flex-col justify-between space-y-4 border border-primary/40 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg",
            currentPlan === 'free' && "ring-2 ring-primary"
          )}>
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Plano Gratuito</span>
              <div className="text-4xl font-extrabold text-foreground font-mono">
                $0 <span className="text-xs font-sans font-normal text-muted-foreground">/ mês</span>
              </div>
              <p className="text-xs text-muted-foreground">Para profissionais e testes iniciais de concorrência.</p>

              <ul className="space-y-2 text-xs pt-2 border-t">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pesquisa de domínios limitada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Análise de 1 domínio por vez</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Até 2 domínios analisados por dia</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Exportação PDF e Excel</span>
                </li>
                <li className="flex items-center gap-2 text-muted-foreground">
                  <X className="h-4 w-4 shrink-0" />
                  <span>Análise ilimitada com IA</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={() => { onChangePlan('free'); onClose(); }}
              variant="default"
              disabled={currentPlan === 'free'}
              className="w-full bg-black text-white hover:bg-slate-900"
              size="sm"
            >
              {currentPlan === 'free' ? 'Plano Atual' : 'Selecionar Gratuito'}
            </Button>
          </Card>

          {/* 2. Plano Pro (Featured) */}
          <Card className={cn(
            "p-6 flex flex-col justify-between space-y-4 border border-primary/40 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg",
            currentPlan === 'pro' ? "ring-2 ring-primary" : undefined
          )}>

            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Plano Pro</span>
              <div className="text-4xl font-extrabold text-foreground font-mono">
                {billingCycle === 'monthly' ? '$49' : '$499'} <span className="text-xs font-sans font-normal text-muted-foreground">/ {billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
              </div>
              <p className="text-xs text-muted-foreground">Para equipes de crescimento, marketing e e-commerce.</p>

              <ul className="space-y-2 text-xs pt-2 border-t">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Pesquisas ilimitadas de domínios</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Comparação até 5 websites</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Histórico completo (até 5 anos)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Alertas inteligentes em tempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Exportação PDF e Excel</span>
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-foreground">IA Gemini Ilimitada</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleProCheckout}
              disabled={currentPlan === 'pro'}
              variant="default"
              className="w-full bg-black text-white hover:bg-slate-900"
              size="sm"
            >
              {currentPlan === 'pro' ? 'Plano Ativo' : 'Ativar Plano Pro'}
            </Button>
          </Card>

          {/* 3. Plano Enterprise */}
          <Card className={cn(
            "p-6 flex flex-col justify-between space-y-4 border border-primary/40 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-lg",
            currentPlan === 'enterprise' && "ring-2 ring-primary"
          )}>
            <div className="space-y-3">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider block">Plano Enterprise</span>
              <div className="text-4xl font-extrabold text-foreground font-mono">
                $199 <span className="text-xs font-sans font-normal text-muted-foreground">/ mês</span>
              </div>
              <p className="text-xs text-muted-foreground">Para grandes agências, fundos e corporações globais.</p>

              <ul className="space-y-2 text-xs pt-2 border-t">
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Utilizadores ilimitados da equipe</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>White Label nos relatórios PDF</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>API pública com chave dedicada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Monitoramento contínuo 24/7</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Suporte prioritário via WhatsApp</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleEnterpriseCheckout}
              disabled={currentPlan === 'enterprise'}
              variant="default"
              className="w-full bg-black text-white hover:bg-slate-900"
              size="sm"
            >
              {currentPlan === 'enterprise' ? 'Plano Ativo' : 'Ativar Enterprise'}
            </Button>
          </Card>

        </div>

      </DialogContent>
    </Dialog>
  );
};