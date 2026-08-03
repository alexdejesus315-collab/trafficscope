import React from 'react';
import { User } from '@supabase/supabase-js';
import { Activity, GitCompare, Crown, LogOut } from 'lucide-react';
import { PlanType } from '../types/domain';
import { Button } from '@/components/ui/button';

interface NavbarProps {
  currentPlan: PlanType;
  onOpenPricing: () => void;
  isCompareMode: boolean;
  onToggleCompareMode: () => void;
  activeDomainCount: number;
  user?: User | null;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  onOpenPricing,
  isCompareMode,
  onToggleCompareMode,
  activeDomainCount,
  user,
  onSignOut
}) => {
  return (
    <header className="dark sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border text-foreground shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
              <Activity className="h-4 w-4 text-foreground" />
              TrafficScope
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
              Inteligência Competitiva & Análise de Tráfego Web
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* ALTERADO: Modo Comparar liberado para todos os planos (Free = dados de teste, sem custo) */}
          <Button
            onClick={onToggleCompareMode}
            id="compare-mode-toggle-btn"
            variant={isCompareMode ? 'default' : 'outline'}
            size="sm"
            className="gap-1.5"
          >
            <GitCompare className="h-4 w-4" />
            <span className="hidden md:inline">Modo Comparar</span>
            {activeDomainCount > 1 && (
              <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                isCompareMode ? 'bg-background text-foreground' : 'bg-muted text-foreground'
              }`}>
                {activeDomainCount}
              </span>
            )}
          </Button>

          <Button
            onClick={onOpenPricing}
            id="pricing-plan-btn"
            variant="outline"
            size="sm"
            className="gap-1.5 font-bold"
          >
            <Crown className="h-4 w-4 text-amber-500" />
            <span className="uppercase tracking-wider">{currentPlan}</span>
          </Button>

          {user && onSignOut && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1.5 shadow-2xs">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.email ?? 'Avatar'} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-foreground">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <Button
                onClick={() => void onSignOut()}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-foreground"
                aria-label="Terminar sessão"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};