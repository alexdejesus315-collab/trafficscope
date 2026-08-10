import React, { useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Zap,
  Trophy,
  ShoppingCart,
  Search,
  TestTube2,
  Crown,
  ArrowRight,
  Battery,
  BatteryWarning,
  BatteryCharging,
} from 'lucide-react';
import { UserProfile, UserMode } from '../types/domain';
import { useLanguage } from '../context/LanguageContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onOpenBuyCredits: () => void;
  onToggleMode: (mode: UserMode) => void;
  onRefetch?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenBuyCredits,
  onToggleMode,
  onRefetch,
}) => {
  const { t } = useLanguage();

  useEffect(() => {
    if (isOpen && onRefetch) {
      onRefetch();
    }
  }, [isOpen, onRefetch]);

  const { credits, mode, totalSearches, totalPurchases } = profile;
  const isTest = mode === 'test';
  const maxCredits = Math.max(credits, 10);
  const progressPercent = (credits / maxCredits) * 100;

  const getLevel = (searches: number) => {
    if (searches >= 500) return { name: t('profile.level.legend'), color: '#F59E0B', icon: Crown };
    if (searches >= 200) return { name: t('profile.level.master'), color: '#8B5CF6', icon: Trophy };
    if (searches >= 50) return { name: t('profile.level.expert'), color: 'var(--primary)', icon: Zap };
    return { name: t('profile.level.explorer'), color: '#10B981', icon: Search };
  };

  const level = getLevel(totalSearches);
  const LevelIcon = level.icon;

  const BatteryIcon = credits === 0 ? BatteryWarning : credits <= 3 ? Battery : BatteryCharging;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
        <div className="relative bg-gradient-to-br from-foreground via-foreground/90 to-foreground text-background p-6 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-primary blur-3xl" />
            <div className="absolute bottom-2 left-2 w-20 h-20 rounded-full bg-primary blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
              style={{ borderColor: level.color, backgroundColor: `color-mix(in srgb, ${level.color} 20%, transparent)` }}
            >
              <LevelIcon className="h-8 w-8" style={{ color: level.color }} />
            </div>
            <div>
              <Badge
                className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: level.color, color: '#fff' }}
              >
                {t('profile.level.label', undefined, { name: level.name })}
              </Badge>
              <h2 className="text-xl font-bold">{t('profile.title')}</h2>
              <p className="text-xs text-background/60 mt-0.5">
                {t('profile.searchesCount', undefined, { count: totalSearches })}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {t('profile.searchMode.label')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleMode('test')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isTest
                    ? 'border-amber-500 bg-amber-50 text-foreground dark:bg-amber-950/20'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                }`}
              >
                <TestTube2 className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">{t('profile.searchMode.test.title')}</div>
                  <div className="text-[10px] opacity-70">{t('profile.searchMode.test.desc')}</div>
                </div>
              </button>
              <button
                onClick={() => onToggleMode('real')}
                disabled={credits <= 0}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  !isTest
                    ? 'border-emerald-500 bg-emerald-50 text-foreground dark:bg-emerald-950/20'
                    : credits <= 0
                    ? 'border-border opacity-50 cursor-not-allowed'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                }`}
              >
                <Zap className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">{t('profile.searchMode.real.title')}</div>
                  <div className="text-[10px] opacity-70">
                    {credits > 0 ? t('profile.searchMode.real.credits', undefined, { count: credits }) : t('profile.searchMode.real.noCredits')}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BatteryIcon className="h-3.5 w-3.5" />
                {t('profile.credits.label')}
              </label>
              <span className="text-sm font-bold font-mono">
                {credits} <span className="text-muted-foreground font-sans font-normal text-xs">{t('profile.credits.suffix')}</span>
              </span>
            </div>

            <div className="relative">
              <Progress
                value={progressPercent}
                className="h-4 rounded-full"
              />
              <div className="flex justify-between mt-1 px-1">
                {[0, 2, 4, 6, 8, 10].map((mark) => (
                  <div
                    key={mark}
                    className={`h-1.5 w-0.5 rounded-full ${
                      credits >= mark ? 'bg-primary' : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {credits === 0 && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <BatteryWarning className="h-3 w-3" />
                {t('profile.credits.empty')}
              </p>
            )}
            {credits > 0 && credits <= 3 && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <BatteryWarning className="h-3 w-3" />
                {t('profile.credits.low')}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center shadow-2xs hover:shadow-md transition-shadow duration-200">
              <Search className="h-4 w-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold font-mono">{totalSearches}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{t('profile.stats.searches')}</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center hover:border-primary/30 transition-colors">
              <ShoppingCart className="h-4 w-4 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold font-mono">{totalPurchases * 10}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{t('profile.stats.creditsPurchased')}</div>
            </div>
          </div>

          <Button
            onClick={() => {
              onClose();
              onOpenBuyCredits();
            }}
            className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-bold shadow-lg shadow-primary/20"
          >
            <ShoppingCart className="h-4 w-4" />
            {t('profile.buyCredits')}
            <span className="ml-1 text-xs opacity-90">{t('profile.buyCreditsPrice')}</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};