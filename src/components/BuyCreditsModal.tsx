import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Check, Sparkles, ArrowRight, CreditCard } from 'lucide-react';
import { PADDLE_PRICES } from '../lib/paddleConfig';
import { useLanguage } from '../context/LanguageContext';

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const { t } = useLanguage();

  const handleCheckout = () => {
    if (!userId) {
      alert(t('buyCredits.alert.loginRequired'));
      return;
    }
    window.Paddle.Checkout.open({
      items: [{ priceId: PADDLE_PRICES.credits, quantity: 1 }],
      customData: { 
        user_id: userId, 
        credits_to_add: 10 
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto pt-2 pb-2">
          <Badge variant="secondary" className="gap-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {t('buyCredits.badge')}
          </Badge>
          <h2 className="text-2xl font-bold text-foreground">
            {t('buyCredits.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('buyCredits.subtitle')}
          </p>
        </div>

        {/* Card Único */}
        <Card className="p-6 flex flex-col justify-between space-y-6 border-2 border-primary/30 bg-primary/5 relative overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  {t('buyCredits.package.label')}
                </span>
                <div className="text-4xl font-extrabold text-foreground font-mono">
                  $2.00
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('buyCredits.package.description')}
            </p>

            <ul className="space-y-2.5 text-xs pt-2 border-t">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span className="font-semibold">{t('buyCredits.feature.searches')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{t('buyCredits.feature.realData')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{t('buyCredits.feature.exports')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{t('buyCredits.feature.aiInsights')}</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary shrink-0" />
                <span>{t('buyCredits.feature.noExpiry')}</span>
              </li>
            </ul>
          </div>

          <Button
            onClick={handleCheckout}
            variant="default"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            size="lg"
          >
            <CreditCard className="h-4 w-4" />
            {t('buyCredits.buyButton')}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Card>

        {/* Info */}
        <div className="text-center text-[11px] text-muted-foreground space-y-1">
          <p>{t('buyCredits.footer.testMode')}</p>
          <p>{t('buyCredits.footer.autoAdd')}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};