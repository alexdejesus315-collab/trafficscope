import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import {
  Activity,
  LogOut,
  ChevronDown,
  Info,
  HelpCircle,
  Shield,
  FileText,
  Mail,
  Instagram,
  Linkedin,
  Twitter,
  Facebook,
  Zap,
  Battery,
  BatteryWarning,
  BatteryCharging,
  UserCircle,
  TestTube2,
  ShoppingCart,
  Search,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile, UserMode } from '../types/domain';
import { useCompanyPanel } from '../context/CompanyPanelContext';

export const COMPANY_PANEL_WIDTH = 'clamp(260px, 22vw, 400px)';

interface NavbarProps {
  user?: User | null;
  onSignOut?: () => void;
  isOverlayActive: boolean;
  profile?: UserProfile;
  onToggleMode?: (mode: UserMode) => void;
  onOpenBuyCredits?: () => void;
}

const COMPANY_LINKS = [
  { to: '/sobre', icon: Info, label: 'Sobre Nós', desc: 'Conhece a missão do TrafficScope' },
  { to: '/faq', icon: HelpCircle, label: 'FAQ', desc: 'Respostas às perguntas mais comuns' },
  { to: '/politica-privacidade', icon: Shield, label: 'Política de Privacidade', desc: 'Como tratamos os teus dados' },
  { to: '/termos-de-uso', icon: FileText, label: 'Termos de Uso', desc: 'Regras de utilização da plataforma' },
  { to: '/suporte', icon: Mail, label: 'Suporte', desc: 'Fala com a nossa equipa' },
];

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  isOverlayActive,
  profile,
  onToggleMode,
  onOpenBuyCredits,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileToggleRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  // Garante que o "fundo" nunca é outra página de overlay (Sobre/Faq/etc.),
// só o Dashboard real. Evita empilhar overlays uns sobre os outros.
const state = location.state as { backgroundLocation?: Location } | undefined;
const trueBackgroundLocation = state?.backgroundLocation ?? location;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { isMenuOpen, isMenuClosing, toggleMenu, closeMenuNow } = useCompanyPanel();

  useEffect(() => {
    if (!isMenuOpen || isOverlayActive) return;
    function handleClickOutside(e: MouseEvent) {
      if (toggleBtnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeMenuNow();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeMenuNow();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, closeMenuNow, isOverlayActive]);

  useEffect(() => {
    if (!isProfileOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (profileToggleRef.current?.contains(e.target as Node)) return;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsProfileOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileOpen]);

  const credits = profile?.credits ?? 0;
  const mode = profile?.mode ?? 'test';
  const totalSearches = profile?.totalSearches ?? 0;
  const totalPurchases = profile?.totalPurchases ?? 0;
  const isTest = mode === 'test' || credits <= 0;
  const BatteryIcon = credits === 0 ? BatteryWarning : credits <= 3 ? Battery : BatteryCharging;

  return (
    <header className="dark sticky top-0 z-[60] bg-background/95 backdrop-blur-md border-b border-border text-foreground shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-foreground">
              <Activity className="h-4 w-4 text-foreground" />
              TrafficScope
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block mt-0.5">
              Inteligência Competitiva & Análise de Tráfego Web
            </p>
          </div>
        </a>

        <div className="flex items-center gap-2 sm:gap-3 relative">
          <Button
            ref={toggleBtnRef}
            variant="outline"
            size="sm"
            className="gap-1.5 !bg-white !text-black !border-gray-200 hover:!bg-gray-100 hover:!text-black"
            onClick={toggleMenu}
            aria-expanded={isMenuOpen}
          >
            <span className="hidden md:inline">Empresa</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </Button>

          <div ref={profileToggleRef} className="flex items-center rounded-xl border border-border overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-all hover:brightness-95 ${
                isTest
                  ? 'bg-amber-50 text-amber-700 white:bg-amber-950/20 white:text-amber-400'
                  : 'bg-emerald-100 text-emerald-800 white:bg-emerald-950/20 white:text-emerald-400'
              }`}
            >
              {isTest ? (
                <>
                  <TestTube2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Modo Teste</span>
                </>
              ) : (
                <>
                  <BatteryIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{credits} créditos</span>
                </>
              )}
            </button>

            <div className="w-px h-5 bg-border/60" />

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-black bg-white hover:bg-gray-50 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span className="hidden md:inline">Perfil</span>
            </button>
          </div>

          {user && onSignOut && (
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-2 py-1.5 shadow-2xs">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.email ?? 'Avatar'} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-semibold text-black">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <Button
                onClick={() => void onSignOut()}
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-rose-500 hover:bg-rose-50 transition-colors"
                aria-label="Terminar sessão"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isProfileOpen && (
            <div
              ref={profileDropdownRef}
              className="absolute top-[calc(100%+10px)] right-0 w-[340px] 
                         bg-white rounded-2xl 
                         border border-gray-200
                         shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                         overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="bg-[#111111] p-4 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-white/70" />
                <p className="text-sm font-semibold text-white">{totalSearches} pesquisas realizadas</p>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    Modo de Pesquisa
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMode?.('test');
                      }}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                        isTest
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <TestTube2 className={`h-4 w-4 shrink-0 mt-0.5 ${isTest ? 'text-orange-500' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${isTest ? 'text-gray-900' : 'text-gray-600'}`}>Modo Teste</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">Ilimitado • Sintético</div>
                      </div>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleMode?.('real');
                      }}
                      disabled={credits <= 0}
                      className={`flex items-start gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                        !isTest
                          ? 'border-emerald-400 bg-emerald-50'
                          : credits <= 0
                            ? 'border-gray-200 opacity-40 cursor-not-allowed'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <Zap className={`h-4 w-4 shrink-0 mt-0.5 ${!isTest ? 'text-emerald-500' : 'text-gray-400'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${!isTest ? 'text-gray-900' : 'text-gray-600'}`}>Modo Real</div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{credits > 0 ? `${credits} créditos` : 'Sem créditos'}</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      <BatteryIcon className="h-3.5 w-3.5" />
                      Créditos Disponíveis
                    </label>
                    <span className="text-sm font-bold text-gray-900">{credits} <span className="text-gray-400 font-normal text-xs">/ carga</span></span>
                  </div>

                  <div className="relative">
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-black rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between px-0.5 mt-1">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-px h-1.5 bg-gray-300" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {credits === 0 && (
                    <p className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <BatteryWarning className="h-3 w-3" />
                      Sem créditos. Compra mais para usar dados reais.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center rounded-xl p-4 border border-gray-200 bg-white">
                    <Search className="h-4 w-4 text-sky-500 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{totalSearches}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Pesquisas</div>
                  </div>
                  <div className="flex flex-col items-center rounded-xl p-4 border border-gray-200 bg-white">
                    <ShoppingCart className="h-4 w-4 text-emerald-500 mb-2" />
                    <div className="text-xl font-bold text-gray-900">{totalPurchases * 10}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Créditos Comprados</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenBuyCredits?.();
                  }}
                  className="group relative w-full flex items-center gap-2.5 py-0 px-2 rounded-lg 
                             bg-emerald-500 hover:bg-emerald-500 text-white font-semibold text-sm 
                             shadow-[0_0_20px_rgba(16,185,129,0.35),0_4px_12px_rgba(16,185,129,0.25)]
                             hover:shadow-[0_0_32px_rgba(16,185,129,0.5),0_6px_16px_rgba(16,185,129,0.35)]
                             transition-all duration-300 active:scale-[0.98] overflow-hidden"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Comprar Créditos</span>
                  <span className="text-xs opacity-90 font-medium">$2 / 10 pesquisas</span>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div
          ref={panelRef}
          style={{ width: COMPANY_PANEL_WIDTH }}
          className={`fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] bg-background border-r border-border shadow-2xl overflow-y-auto p-3 duration-200 ${
            isMenuClosing
              ? 'animate-out fade-out slide-out-to-left-4'
              : ''
          }`}
        >
          <p className="px-2 pt-1 pb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</p>
          <div className="flex flex-col gap-1">
            {COMPANY_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} state={{ backgroundLocation: trueBackgroundLocation }} className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 hover:bg-muted/60 transition-colors">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <Icon className="h-4 w-4 text-[#F7FFFF]" />
                  {label}
                </span>
                <span className="text-xs text-muted-foreground pl-6">{desc}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Redes Sociais</p>
            <div className="flex items-center gap-2 px-2">
              {[Instagram, Linkedin, Twitter, Facebook].map((Icon, i) => (
                <span key={i} title="Em breve" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed">
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