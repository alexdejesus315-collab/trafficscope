import React, { useRef, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';import { User } from '@supabase/supabase-js';
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
  History as HistoryIcon,
  Bell,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserProfile, UserMode } from '../types/domain';
import { useCompanyPanel } from '../context/CompanyPanelContext';
import { supabase } from '../lib/supabaseClient';
import { isOwner } from '../lib/ownerConfig';
import { useNotifications } from '../hooks/useNotifications';
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
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const notifToggleRef = useRef<HTMLButtonElement>(null);
const location = useLocation();
  const navigate = useNavigate();
  const showGenerateButton = isOwner(user?.id);  // Garante que o "fundo" nunca é outra página de overlay (Sobre/Faq/etc.),
// só o Dashboard real. Evita empilhar overlays uns sobre os outros.
const state = location.state as { backgroundLocation?: Location } | undefined;
const trueBackgroundLocation = state?.backgroundLocation ?? location;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const { isMenuOpen, isMenuClosing, closeMenuNow, openMenu, requestCloseDetail } = useCompanyPanel();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(user?.id);

  // Fecha o painel preto e o branco em conjunto, sem desfasamento.
  const closeEverything = React.useCallback(() => {
    if (isOverlayActive) {
      requestCloseDetail('close');
    } else {
      closeMenuNow();
    }
  }, [closeMenuNow, isOverlayActive, requestCloseDetail]);

  useEffect(() => {
    if (!isMenuOpen || isOverlayActive) return;
    function handleClickOutside(e: MouseEvent) {
      if (toggleBtnRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        closeEverything();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') closeEverything();
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMenuOpen, isOverlayActive, closeEverything]);

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


  useEffect(() => {
    if (!isNotifOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifToggleRef.current?.contains(e.target as Node)) return;
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsNotifOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isNotifOpen]);

  const credits = profile?.credits ?? 0;
  const mode = profile?.mode ?? 'test';
  const totalSearches = profile?.totalSearches ?? 0;
  const totalPurchases = profile?.totalPurchases ?? 0;
  const isTest = mode === 'test' || credits <= 0;
  const BatteryIcon = credits === 0 ? BatteryWarning : credits <= 3 ? Battery : BatteryCharging;

  return (
<header className="sticky top-0 z-[60] bg-sidebar/95 backdrop-blur-md text-sidebar-foreground shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-sidebar-foreground">
              <Activity className="h-4 w-4 text-sidebar-foreground" />
              TrafficScope
            </div>
            <p className="text-xs text-sidebar-foreground/60 hidden sm:block mt-0.5">
              Inteligência Competitiva & Análise de Tráfego Web
            </p>
          </div>
        </a>

<div className="flex items-center gap-3 sm:gap-5 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/blog')}
            className="!text-sidebar-foreground text-base font-semibold rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
          >
            Blog
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/history')}
            className="!text-sidebar-foreground rounded-full hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
            aria-label="Histórico de pesquisas"
            title="Histórico de pesquisas"
          >
            <HistoryIcon className="h-4 w-4" />
          </Button>

          <button
            ref={notifToggleRef}
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex items-center justify-center h-8 w-8 rounded-full !text-sidebar-foreground hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
            aria-label="Notificações"
            title="Notificações"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div
              ref={notifDropdownRef}
              className="absolute top-[calc(100%+10px)] right-0 w-[360px] max-h-[420px]
                         bg-popover rounded-2xl
                         border border-border
                         shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                         overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150
                         flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <p className="text-sm font-semibold text-foreground">Notificações</p>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Marcar tudo
                  </button>
                )}
              </div>

              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-1.5">
                    <Bell className="h-6 w-6 opacity-30" />
                    <p className="text-xs">Sem notificações por agora.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n.id);
                        if (n.link) {
                          setIsNotifOpen(false);
                          navigate(n.link);
                        }
                      }}
                      className={`w-full text-left px-4 py-3 border-b border-border/60 last:border-0 transition-colors hover:bg-accent/50 ${
                        n.isRead ? '' : 'bg-primary/5'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                        )}
                        <div className={`min-w-0 ${n.isRead ? 'pl-3.5' : ''}`}>
                          <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-[10px] text-muted-foreground/70 mt-1">
                            {new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {showGenerateButton && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 !text-sidebar-foreground text-base font-semibold rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
              onClick={async () => {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/blog/generate', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${session?.access_token}` },
                });
                const data = await res.json();
                if (data.success) {
                  alert('Artigo gerado com sucesso!');
                  navigate(`/blog/${data.post.slug}`);
                } else {
                  alert(data.error || 'Erro ao gerar artigo.');
                }
              }}
            >
              Gerar Artigo
            </Button>
          )}

          <Button
            ref={toggleBtnRef}            variant="ghost"
            size="sm"
            className="gap-1.5 !text-sidebar-foreground text-base font-semibold rounded-full px-4 py-2 hover:!bg-primary/20 hover:!text-primary transition-all duration-200"
            onClick={() => {
              if (isMenuOpen) {
                closeEverything();
              } else {
                openMenu();
              }
            }}
            aria-expanded={isMenuOpen}
          >
            <span className="hidden md:inline">Empresa</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </Button>

          <div ref={profileToggleRef} className="flex items-center rounded-full border border-sidebar-border overflow-hidden shadow-2xs">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold transition-all hover:brightness-95 ${
                isTest
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
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

            <div className="w-px h-5 bg-sidebar-border/60" />

            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sidebar-accent-foreground bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
            >
              <UserCircle className="h-4 w-4" />
              <span className="hidden md:inline">Perfil</span>
            </button>
          </div>

          {user && onSignOut && (
            <div className="flex items-center gap-2 rounded-xl border border-sidebar-border bg-sidebar-accent px-2 py-1.5 shadow-2xs">
              {user.user_metadata?.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt={user.email ?? 'Avatar'} className="h-8 w-8 rounded-full" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-sidebar-accent-foreground/10 flex items-center justify-center text-sm font-semibold text-sidebar-accent-foreground">
                  {user.email?.[0]?.toUpperCase() ?? 'U'}
                </div>
              )}
              <Button
                onClick={() => void onSignOut()}
                variant="ghost"
                size="icon-sm"
                className="text-sidebar-accent-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors"
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
                         bg-popover rounded-2xl 
                         border border-border
                         shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                         overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
            >
              <div className="bg-primary p-4 flex items-center gap-2">
                <Search className="h-3.5 w-3.5 text-primary-foreground/70" />
                <p className="text-sm font-semibold text-primary-foreground">{totalSearches} pesquisas realizadas</p>
              </div>

              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
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
                          ? 'border-amber-400 bg-amber-50 dark:bg-amber-950/20'
                          : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                      }`}
                    >
                      <TestTube2 className={`h-4 w-4 shrink-0 mt-0.5 ${isTest ? 'text-amber-500' : 'text-muted-foreground'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${isTest ? 'text-foreground' : 'text-muted-foreground'}`}>Modo Teste</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">Ilimitado • Sintético</div>
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
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                          : credits <= 0
                            ? 'border-border opacity-40 cursor-not-allowed'
                            : 'border-border text-muted-foreground hover:border-muted-foreground/40'
                      }`}
                    >
                      <Zap className={`h-4 w-4 shrink-0 mt-0.5 ${!isTest ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                      <div>
                        <div className={`text-sm font-semibold ${!isTest ? 'text-foreground' : 'text-muted-foreground'}`}>Modo Real</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{credits > 0 ? `${credits} créditos` : 'Sem créditos'}</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      <BatteryIcon className="h-3.5 w-3.5" />
                      Créditos Disponíveis
                    </label>
                    <span className="text-sm font-bold text-foreground">{credits} <span className="text-muted-foreground font-normal text-xs">/ carga</span></span>
                  </div>

                  <div className="relative">
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((credits / 10) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between px-0.5 mt-1">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex flex-col items-center">
                          <div className="w-px h-1.5 bg-border" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {credits === 0 && (
                    <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
                      <BatteryWarning className="h-3 w-3" />
                      Sem créditos. Compra mais para usar dados reais.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center rounded-xl p-4 border border-border bg-card">
                    <Search className="h-4 w-4 text-primary mb-2" />
                    <div className="text-xl font-bold text-foreground">{totalSearches}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Pesquisas</div>
                  </div>
                  <div className="flex flex-col items-center rounded-xl p-4 border border-border bg-card">
                    <ShoppingCart className="h-4 w-4 text-primary mb-2" />
                    <div className="text-xl font-bold text-foreground">{totalPurchases * 10}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Créditos Comprados</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onOpenBuyCredits?.();
                  }}
                  className="group relative w-full flex items-center gap-2.5 py-0 px-2 rounded-lg 
                             bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm 
                             shadow-[0_0_20px_rgba(42,127,175,0.35),0_4px_12px_rgba(42,127,175,0.25)]
                             hover:shadow-[0_0_32px_rgba(42,127,175,0.5),0_6px_16px_rgba(42,127,175,0.35)]
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
          className={`fixed top-20 left-0 z-50 h-[calc(100vh-5rem)] bg-sidebar border-r border-sidebar-border shadow-2xl overflow-y-auto p-3 duration-200 ${
            isMenuClosing
              ? 'animate-out fade-out slide-out-to-left-4'
              : ''
          }`}
        >
          <p className="px-2 pt-1 pb-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Empresa</p>
          <div className="flex flex-col gap-1">
            {COMPANY_LINKS.map(({ to, icon: Icon, label, desc }) => (
              <Link key={to} to={to} state={{ backgroundLocation: trueBackgroundLocation }} className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 hover:bg-sidebar-accent/15 transition-colors">
                <span className="flex items-center gap-2 font-semibold text-sidebar-foreground">
                  <Icon className="h-4 w-4 text-sidebar-foreground" />
                  {label}
                </span>
                <span className="text-xs text-sidebar-foreground/60 pl-6">{desc}</span>
              </Link>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-sidebar-border">
            <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">Redes Sociais</p>
            <div className="flex items-center gap-2 px-2">
              {[Instagram, Linkedin, Twitter, Facebook].map((Icon, i) => (
                <span key={i} title="Em breve" className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/30 cursor-not-allowed">
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