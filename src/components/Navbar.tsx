import React, { useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import { Activity, GitCompare, Crown, LogOut, ChevronDown, Info, HelpCircle, Shield, FileText, Mail, Instagram, Linkedin, Twitter, Facebook } from 'lucide-react';
import { PlanType } from '../types/domain';
import { Button } from '@/components/ui/button';


// ALTERADO: largura do painel "Empresa" partilhada com o Dashboard, para que o
// conteúdo seja empurrado exatamente pela mesma largura que o painel ocupa.
export const COMPANY_PANEL_WIDTH = 'clamp(260px, 22vw, 400px)';

interface NavbarProps {
  currentPlan: PlanType;
  onOpenPricing: () => void;
  isCompareMode: boolean;
  onToggleCompareMode: () => void;
  activeDomainCount: number;
  user?: User | null;
  onSignOut?: () => void;
  // ALTERADO: estado do painel "Empresa" agora é controlado pelo componente pai
  // (Dashboard), para poder empurrar o conteúdo quando o painel abre.
  isCompanyMenuOpen: boolean;
  onToggleCompanyMenu: () => void;
  onCloseCompanyMenu: () => void;
}

const COMPANY_LINKS = [
  {
    to: '/sobre',
    icon: Info,
    label: 'Sobre Nós',
    desc: 'Conhece a missão do TrafficScope',
  },
  {
    to: '/faq',
    icon: HelpCircle,
    label: 'FAQ',
    desc: 'Respostas às perguntas mais comuns',
  },
  {
    to: '/politica-privacidade',
    icon: Shield,
    label: 'Política de Privacidade',
    desc: 'Como tratamos os teus dados',
  },
  {
    to: '/termos-de-uso',
    icon: FileText,
    label: 'Termos de Uso',
    desc: 'Regras de utilização da plataforma',
  },
  {
    to: '/suporte',
    icon: Mail,
    label: 'Suporte',
    desc: 'Fala com a nossa equipa',
  },
];



export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  onOpenPricing,
  isCompareMode,
  onToggleCompareMode,
  activeDomainCount,
  user,
  onSignOut,
  isCompanyMenuOpen,
  onToggleCompanyMenu,
  onCloseCompanyMenu,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (!isCompanyMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onCloseCompanyMenu();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCloseCompanyMenu();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCompanyMenuOpen, onCloseCompanyMenu]);

  return (
    <header className="dark sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border text-foreground shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
              <Activity className="h-4 w-4 text-foreground" />
              TrafficScope
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
              Inteligência Competitiva & Análise de Tráfego Web
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onToggleCompanyMenu}
            aria-expanded={isCompanyMenuOpen}
          >
            <span className="hidden md:inline">Empresa</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCompanyMenuOpen ? 'rotate-180' : ''}`} />
          </Button>

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

      {/* ALTERADO: painel fixo no canto superior esquerdo. Sem backdrop — agora o
          conteúdo é empurrado (margin-left) pelo Dashboard, em vez de sobreposto. */}
      {isCompanyMenuOpen && (
        <div
          ref={panelRef}
          style={{ width: COMPANY_PANEL_WIDTH }}
          className="fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] bg-background border-r border-border shadow-2xl overflow-y-auto p-3"
        >
          <p className="px-2 pt-1 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Empresa
          </p>
          <div className="flex flex-col gap-1">
            {COMPANY_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                state={{ backgroundLocation: location }}
                onClick={onCloseCompanyMenu}
                className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors"
              >
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-[#F7FFFF]" />
                  {label}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{desc}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Redes Sociais
            </p>
            <div className="flex items-center gap-2 px-2">
              {[Instagram, Linkedin, Twitter, Facebook].map((Icon, i) => (
                <span
                  key={i}
                  title="Em breve"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed"
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};