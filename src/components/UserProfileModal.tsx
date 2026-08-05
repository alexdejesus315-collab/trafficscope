import React from 'react';
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

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onOpenBuyCredits: () => void;
  onToggleMode: (mode: UserMode) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onOpenBuyCredits,
  onToggleMode,
}) => {
  const { credits, mode, totalSearches, totalPurchases } = profile;
  const isTest = mode === 'test';
  const maxCredits = Math.max(credits, 10);
  const progressPercent = (credits / maxCredits) * 100;

  // Determina o "nível" do jogador baseado em pesquisas totais
  const getLevel = (searches: number) => {
    if (searches >= 500) return { name: 'Lenda', color: '#F59E0B', icon: Crown };
    if (searches >= 200) return { name: 'Mestre', color: '#8B5CF6', icon: Trophy };
    if (searches >= 50) return { name: 'Especialista', color: '#279ef9', icon: Zap };
    return { name: 'Explorador', color: '#10B981', icon: Search };
  };

  const level = getLevel(totalSearches);
  const LevelIcon = level.icon;

  // Ícone da bateria baseado nos créditos
  const BatteryIcon = credits === 0 ? BatteryWarning : credits <= 3 ? Battery : BatteryCharging;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header com gradiente */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 rounded-t-lg overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-24 h-24 rounded-full bg-[#279ef9] blur-3xl" />
            <div className="absolute bottom-2 left-2 w-20 h-20 rounded-full bg-emerald-500 blur-3xl" />
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg border-2"
              style={{ borderColor: level.color, backgroundColor: `${level.color}20` }}
            >
              <LevelIcon className="h-8 w-8" style={{ color: level.color }} />
            </div>
            <div>
              <Badge
                className="mb-1 text-[10px] font-bold uppercase tracking-wider"
                style={{ backgroundColor: level.color, color: '#fff' }}
              >
                Nível: {level.name}
              </Badge>
              <h2 className="text-xl font-bold">O teu Perfil</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalSearches} pesquisas realizadas
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Seletor de Modo */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Modo de Pesquisa
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleMode('test')}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  isTest
                    ? 'border-[#279ef9] bg-[#279ef9]/5 text-foreground'
                    : 'border-border text-muted-foreground hover:border-muted-foreground/50'
                }`}
              >
                <TestTube2 className="h-4 w-4 shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-bold">Modo Teste</div>
                  <div className="text-[10px] opacity-70">Ilimitado • Sintético</div>
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
                  <div className="text-xs font-bold">Modo Real</div>
                  <div className="text-[10px] opacity-70">
                    {credits > 0 ? `${credits} créditos` : 'Sem créditos'}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Barra de Créditos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <BatteryIcon className="h-3.5 w-3.5" />
                Créditos Disponíveis
              </label>
              <span className="text-sm font-bold font-mono">
                {credits} <span className="text-muted-foreground font-sans font-normal text-xs">/ recarga</span>
              </span>
            </div>

            <div className="relative">
              <Progress
                value={progressPercent}
                className="h-4 rounded-full"
              />
              {/* Marcadores na barra */}
              <div className="flex justify-between mt-1 px-1">
                {[0, 2, 4, 6, 8, 10].map((mark) => (
                  <div
                    key={mark}
                    className={`h-1.5 w-0.5 rounded-full ${
                      credits >= mark ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>
            </div>

            {credits === 0 && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <BatteryWarning className="h-3 w-3" />
                Sem créditos. Compra mais para usar dados reais.
              </p>
            )}
            {credits > 0 && credits <= 3 && (
              <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                <BatteryWarning className="h-3 w-3" />
                Poucos créditos restantes!
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
              <Search className="h-4 w-4 text-[#279ef9] mx-auto mb-1" />
              <div className="text-lg font-bold font-mono">{totalSearches}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Pesquisas</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3 text-center border border-border">
              <ShoppingCart className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
              <div className="text-lg font-bold font-mono">{totalPurchases * 10}</div>
              <div className="text-[10px] text-muted-foreground font-medium">Créditos Comprados</div>
            </div>
          </div>

          {/* CTA Comprar */}
          <Button
            onClick={() => {
              onClose();
              onOpenBuyCredits();
            }}
            className="w-full gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20"
          >
            <ShoppingCart className="h-4 w-4" />
            Comprar Créditos
            <span className="ml-1 text-xs opacity-90">$2 / 10 pesquisas</span>
            <ArrowRight className="h-3.5 w-3.5 ml-auto" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};