import React, { useRef, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from '@supabase/supabase-js';
import {
  Activity, LogOut, ChevronDown, Info, HelpCircle, Shield, FileText, Mail,
  Instagram, Linkedin, Twitter, Facebook, Zap, Battery, BatteryWarning,
  BatteryCharging, UserCircle, TestTube2, ShoppingCart, Search, ArrowRight,
  Bell, CheckCheck, History, PenSquare, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile, UserMode } from '../types/domain';
import { useLanguage } from '../context/LanguageContext';
import { isOwner } from '../lib/ownerConfig';
import { useNotifications } from '../hooks/useNotifications';
import { GenerateArticleModal } from './GenerateArticleModal';
import { GenerateNewsModal } from './GenerateNewsModal';
import { AdManagerModal } from './AdManagerModal';
import { Newspaper, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { LanguageSwitcher } from './LanguageSwitcher';
import { Pagination } from './Pagination';

const LAST_SEEN_BLOG_KEY = 'trafficscope_last_seen_blog';
const LAST_SEEN_NEWS_KEY = 'trafficscope_last_seen_news';
const NOTIFICATIONS_PER_PAGE = 5;

interface NavbarProps {
  user?: User | null;
  onSignOut?: () => void;
  profile?: UserProfile;
  onToggleMode?: (mode: UserMode) => void;
  onOpenBuyCredits?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onSignOut,
  profile,
  onToggleMode,
  onOpenBuyCredits,
}) => {
  const { t } = useLanguage();

  const COMPANY_LINKS = [
    { to: '/sobre', icon: Info, label: t('nav.companyLinks.about.label'), desc: t('nav.companyLinks.about.desc') },
    { to: '/faq', icon: HelpCircle, label: t('nav.companyLinks.faq.label'), desc: t('nav.companyLinks.faq.desc') },
    { to: '/politica-privacidade', icon: Shield, label: t('nav.companyLinks.privacy.label'), desc: t('nav.companyLinks.privacy.desc') },
    { to: '/termos-de-uso', icon: FileText, label: t('nav.companyLinks.terms.label'), desc: t('nav.companyLinks.terms.desc') },
    { to: '/suporte', icon: Mail, label: t('nav.companyLinks.support.label'), desc: t('nav.companyLinks.support.desc') },
  ];

  const companyToggleRef = useRef<HTMLButtonElement>(null);
  const companyDropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const profileToggleRef = useRef<HTMLDivElement>(null);
  const notifDropdownRef = useRef<HTMLDivElement>(null);
  const notifToggleRef = useRef<HTMLButtonElement>(null);
  const generateBtnRef = useRef<HTMLButtonElement>(null);
  const generateMenuRef = useRef<HTMLDivElement>(null);
  const mobileMoreToggleRef = useRef<HTMLButtonElement>(null);
  const mobileMoreDropdownRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const showGenerateButton = isOwner(user?.id);

  const [isCompanyOpen, setIsCompanyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isGenerateNewsModalOpen, setIsGenerateNewsModalOpen] = useState(false);
const [isAdManagerOpen, setIsAdManagerOpen] = useState(false);
  const [isGenerateMenuOpen, setIsGenerateMenuOpen] = useState(false);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const { notifications, unreadCount, isLoadingMore, hasMore, loadMore, markAsRead, markAllAsRead } = useNotifications(user?.id);
  useEffect(() => {
    setNotificationPage(1);
  }, [user?.id]);

  const loadedNotificationPages = Math.ceil(notifications.length / NOTIFICATIONS_PER_PAGE);
  const notificationPageCount = loadedNotificationPages + (hasMore ? 1 : 0);
  const visibleNotifications = notifications.slice(
    (notificationPage - 1) * NOTIFICATIONS_PER_PAGE,
    notificationPage * NOTIFICATIONS_PER_PAGE
  );

  const handleNotificationPageChange = async (page: number) => {
    if (page > loadedNotificationPages) {
      if (!await loadMore()) return;
    }
    setNotificationPage(page);
  };

  const [lastSeenBlog, setLastSeenBlog] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LAST_SEEN_BLOG_KEY) : null
  );
  const [lastSeenNews, setLastSeenNews] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem(LAST_SEEN_NEWS_KEY) : null
  );

  const latestBlogPostAt = notifications
    .filter(n => n.type === 'new_blog_post')
    .reduce<string | null>((latest, n) => (!latest || n.created_at > latest ? n.created_at : latest), null);

  const latestNewsItemAt = notifications
    .filter(n => n.type === 'new_news_item')
    .reduce<string | null>((latest, n) => (!latest || n.created_at > latest ? n.created_at : latest), null);

  const hasNewBlogPost = Boolean(
    latestBlogPostAt && (!lastSeenBlog || latestBlogPostAt > lastSeenBlog)
  );

  const hasNewNews = Boolean(
    latestNewsItemAt && (!lastSeenNews || latestNewsItemAt > lastSeenNews)
  );

  const handleBlogClick = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_BLOG_KEY, now);
    setLastSeenBlog(now);
    navigate('/blog');
  };

  const handleNoticiasClick = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_SEEN_NEWS_KEY, now);
    setLastSeenNews(now);
    navigate('/noticias');
  };


  useEffect(() => {
    if (!isCompanyOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (companyToggleRef.current?.contains(e.target as Node)) return;
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target as Node)) {
        setIsCompanyOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsCompanyOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isCompanyOpen]);

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

  useEffect(() => {
    if (!isGenerateMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (generateBtnRef.current?.contains(e.target as Node)) return;
      if (generateMenuRef.current && !generateMenuRef.current.contains(e.target as Node)) {
        setIsGenerateMenuOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsGenerateMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isGenerateMenuOpen]);

  useEffect(() => {
    if (!isMobileMoreOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (mobileMoreToggleRef.current?.contains(e.target as Node)) return;
      if (mobileMoreDropdownRef.current && !mobileMoreDropdownRef.current.contains(e.target as Node)) {
        setIsMobileMoreOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsMobileMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isMobileMoreOpen]);

  const credits = profile?.credits ?? 0;
  const mode = profile?.mode ?? 'test';
  const totalSearches = profile?.totalSearches ?? 0;
  const totalPurchases = profile?.totalPurchases ?? 0;
  const isTest = mode === 'test' || credits <= 0;
  const BatteryIcon = credits === 0 ? BatteryWarning : credits <= 3 ? Battery : BatteryCharging;

  return (
    <header className="sticky top-0 z-[60] bg-sidebar/95 backdrop-blur-md text-sidebar-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0">
          <span className="sm:hidden flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent shrink-0">
            <Activity className="h-4 w-4 text-sidebar-foreground" />
          </span>
          <div className="hidden sm:block">
            <div className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-sidebar-foreground">
              <Activity className="h-4 w-4 text-sidebar-foreground" />
              TrafficScope
            </div>
            <p className="text-[11px] text-sidebar-foreground/60 hidden sm:block mt-0.5 leading-tight">
              {t('nav.tagline')}
            </p>
          </div>
          <span className="sr-only">TrafficScope</span>
        </a>

        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <div className="hidden lg:block">
            <LanguageSwitcher />
          </div>

          <div className="flex items-center gap-1 sm:gap-2 relative min-w-0">
            {/* 1. Blog */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBlogClick}
              className="relative !bg-muted !text-foreground text-sm font-bold rounded-full px-3 py-1.5 hover:!bg-secondary transition-all duration-200"
            >
              {t('nav.blog')}
              {hasNewBlogPost && (
                <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>

            {/* 2. Notícias */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNoticiasClick}
              className="relative !bg-muted !text-foreground text-sm font-bold rounded-full px-3 py-1.5 hover:!bg-secondary transition-all duration-200"
            >
              Notícias
              {hasNewNews && (
                <span className="absolute top-1 right-1.5 h-2 w-2 rounded-full bg-destructive" />
              )}
            </Button>

            {/* 3. Empresa */}
            <div className="relative w-fit hidden lg:block">
              <Button
                ref={companyToggleRef}
                variant="ghost"
                size="sm"
                className="gap-1.5 !text-sidebar-foreground text-sm font-semibold rounded-full px-3 py-1.5 hover:!bg-muted hover:!text-link-hover transition-all duration-200"
                onClick={() => setIsCompanyOpen((v) => !v)}
                aria-expanded={isCompanyOpen}
              >
                <span className="hidden md:inline">{t('nav.company')}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCompanyOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isCompanyOpen && (
                <div
                  ref={companyDropdownRef}
                  className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[300px]
                           bg-popover rounded-2xl

                           overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-2"
                >
                  <p className="px-2 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t('nav.companyPanel.title')}
                  </p>
                  <div className="flex flex-col gap-1">
                    {COMPANY_LINKS.map(({ to, icon: Icon, label, desc }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsCompanyOpen(false)}
                        className="flex flex-col items-start gap-0.5 rounded-lg px-3 py-2.5 hover:bg-accent/50 transition-colors"
                      >
                        <span className="flex items-center gap-2 font-semibold text-foreground text-sm">
                          <Icon className="h-4 w-4 text-foreground" />
                          {label}
                        </span>
                        <span className="text-xs text-muted-foreground pl-6">{desc}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border">
                    <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('nav.companyPanel.socialMedia')}
                    </p>
                    <div className="flex items-center gap-2 px-2">
                      {[Instagram, Linkedin, Twitter, Facebook].map((Icon, i) => (
                        <span key={i} title={t('nav.companyPanel.comingSoon')} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/40 cursor-not-allowed">
                          <Icon className="h-4 w-4" />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Notificações */}
            <div className="relative">
              <Button
                ref={notifToggleRef}
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                title={t('nav.notifications.title')}
                className="relative !text-sidebar-foreground rounded-full hover:!bg-muted hover:!text-link-hover transition-all duration-200"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>

              {isNotifOpen && (
                <div
                  ref={notifDropdownRef}
                  className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[360px] max-h-[420px]
                           bg-popover rounded-2xl

                           overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150
                           flex flex-col"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                    <p className="text-sm font-semibold text-foreground">{t('nav.notifications.title')}</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1 text-xs font-medium text-link hover:underline"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        {t('nav.notifications.markAll')}
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground gap-1.5">
                        <Bell className="h-6 w-6 opacity-30" />
                        <p className="text-xs">{t('nav.notifications.empty')}</p>
                      </div>
                    ) : (
                      visibleNotifications.map((n) => (
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
                            n.isRead ? '' : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.isRead && (
                              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                            )}
                            <div className={`min-w-0 ${n.isRead ? 'pl-3.5' : ''}`}>
                              <p className="text-sm font-semibold text-foreground truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {new Date(n.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="shrink-0 border-t border-border px-2 py-2">
                      {isLoadingMore && (
                        <div className="flex items-center justify-center pb-1">
                          <div className="h-3.5 w-3.5 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                        </div>
                      )}
                      <Pagination
                        currentPage={notificationPage}
                        totalPages={notificationPageCount}
                        onPageChange={handleNotificationPageChange}
                        ariaLabel={t('pagination.aria')}
                        previousLabel={t('pagination.previous')}
                        nextLabel={t('pagination.next')}
                        disabled={isLoadingMore}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 5. Recentes */}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigate('/history')}
              title={t('nav.history')}
              className="hidden lg:inline-flex !text-sidebar-foreground rounded-full hover:!bg-muted hover:!text-link-hover transition-all duration-200"
            >
              <History className="h-4 w-4" />
            </Button>

                        {/* Menu "mais" (mobile/tablet) */}
            <div className="relative lg:hidden">
              <Button
                ref={mobileMoreToggleRef}
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsMobileMoreOpen((v) => !v)}
                title={t('nav.company')}
                className="!text-sidebar-foreground rounded-full hover:!bg-muted hover:!text-link-hover transition-all duration-200"
              >
                {isMobileMoreOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </Button>

              {isMobileMoreOpen && (
                <div
                  ref={mobileMoreDropdownRef}
                  className="absolute top-[calc(100%+10px)] right-0 w-[260px]
                           bg-popover rounded-2xl

                           overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-2"
                >
                  <div className="px-2 pt-1 pb-2">
                    <LanguageSwitcher />
                  </div>

                  <button
                    onClick={() => { setIsMobileMoreOpen(false); navigate('/history'); }}
                    className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <History className="h-4 w-4" />
                    {t('nav.history')}
                  </button>

                  <div className="mt-1 pt-1 border-t border-border">
                    {COMPANY_LINKS.map(({ to, icon: Icon, label }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsMobileMoreOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Gerar conteúdo (só owner) */}
            {showGenerateButton && (
              <div className="relative">
                <Button
                  ref={generateBtnRef}
                  variant="ghost"
                  size="icon-sm"
                  title="Gerar conteúdo"
                  className="!text-sidebar-foreground rounded-full hover:!bg-muted hover:!text-link-hover transition-all duration-200"
                  onClick={() => setIsGenerateMenuOpen((v) => !v)}
                >
                  <PenSquare className="h-4 w-4" />
                </Button>

                {isGenerateMenuOpen && (
                  <div
                    ref={generateMenuRef}
                    className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[190px] bg-popover rounded-xl overflow-hidden z-50 p-1.5"
                  >
                    <button
                      onClick={() => { setIsGenerateMenuOpen(false); setIsGenerateModalOpen(true); }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      {t('nav.generateArticle')}
                    </button>
                    <button
                      onClick={() => { setIsGenerateMenuOpen(false); setIsGenerateNewsModalOpen(true); }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <Newspaper className="h-4 w-4" />
                      Gerar Notícia
                    </button>
                    <button
                      onClick={() => { setIsGenerateMenuOpen(false); setIsAdManagerOpen(true); }}
                      className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
                    >
                      <Megaphone className="h-4 w-4" />
                      Gerir Anúncios
                    </button>
                  </div>
                )}

                <GenerateArticleModal
                  open={isGenerateModalOpen}
                  onOpenChange={setIsGenerateModalOpen}
                  onGenerated={(slug) => navigate(`/blog/${slug}`)}
                  anchorRef={generateBtnRef}
                />
                <GenerateNewsModal
                  open={isGenerateNewsModalOpen}
                  onOpenChange={setIsGenerateNewsModalOpen}
                  onGenerated={(slug) => navigate(`/noticias/${slug}`)}
                  anchorRef={generateBtnRef}
                />
                <AdManagerModal
                  open={isAdManagerOpen}
                  onOpenChange={setIsAdManagerOpen}
                  anchorRef={generateBtnRef}
                />
              </div>
            )}

            {/* Perfil */}
            <div
              ref={profileToggleRef}
              className="relative flex items-center shrink-0 lg:rounded-full lg:border lg:border-sidebar-border lg:bg-sidebar-accent lg:overflow-hidden"
            >
              {/* Mobile/tablet: apenas o avatar do utilizador, com anel de destaque */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-label={t('nav.profile')}
                className="lg:hidden relative flex h-9 w-9 items-center justify-center shrink-0 group"
              >
                <span
                  className={`absolute inset-0 rounded-full transition-all duration-300 animate-pulse ${
                    isTest
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  } group-active:scale-95`}
                />
                <span className="absolute inset-[2px] rounded-full bg-sidebar overflow-hidden flex items-center justify-center">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt={user.email ?? 'Avatar'}
                      className="h-full w-full object-cover"
                    />
                  ) : user?.email ? (
                    <span className="flex h-full w-full items-center justify-center bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                      {user.email[0].toUpperCase()}
                    </span>
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-sidebar-accent">
                      <UserCircle className="h-4 w-4 text-sidebar-accent-foreground" />
                    </span>
                  )}
                </span>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-sidebar ${
                    isTest ? 'bg-amber-400' : 'bg-emerald-400'
                  }`}
                />
              </button>

              {/* lg e acima: pílula completa (modo/créditos + perfil) */}
              <div className="hidden lg:flex items-center overflow-hidden">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all hover:brightness-95 ${
                    isTest
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300'
                  }`}
                >
                  {isTest ? (
                    <>
                      <TestTube2 className="h-3.5 w-3.5" />
                      <span>{t('nav.testMode')}</span>
                    </>
                  ) : (
                    <>
                      <BatteryIcon className="h-3.5 w-3.5" />
                      <span>{t('nav.creditsShort', undefined, { count: credits })}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-label={t('nav.profile')}
                  title={t('nav.profile')}
                  className="flex items-center justify-center border-l border-sidebar-border/60 bg-sidebar-accent px-2.5 py-1.5 hover:bg-sidebar-accent/80 transition-colors"
                >
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                  ) : user?.email ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-accent-foreground/10 text-[10px] font-semibold text-sidebar-accent-foreground">
                      {user.email[0].toUpperCase()}
                    </span>
                  ) : (
                    <UserCircle className="h-4 w-4 text-sidebar-accent-foreground" />
                  )}
                </button>
              </div>

              {user && onSignOut && (
                <div className="hidden lg:flex items-center border-l border-sidebar-border/60 px-1.5 py-1 shrink-0">
                  <Button
                    onClick={() => void onSignOut()}
                    variant="ghost"
                    size="icon-sm"
                    className="text-sidebar-accent-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-colors h-7 w-7"
                    aria-label={t('nav.signOut')}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>

            {isProfileOpen && (
              <div
                ref={profileDropdownRef}
                className="absolute top-[calc(100%+10px)] right-0 w-[340px] max-w-[calc(100vw-2rem)]
                           bg-popover rounded-2xl border border-border/80 shadow-2xl shadow-foreground/15
                           overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-200"
              >
                <div className="relative overflow-hidden bg-primary px-4 py-3 flex items-center gap-2.5">
                  <div aria-hidden="true" className="absolute -right-5 -top-8 h-20 w-20 rounded-full border border-primary-foreground/10" />
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand">
                    <Search className="h-4 w-4" />
                  </span>
                  <p className="relative text-sm font-semibold text-primary-foreground">{t('nav.searchesPerformed', undefined, { count: totalSearches })}</p>
                </div>

                <div className="p-4 space-y-4">
                  {user && onSignOut && (
                    <div className="flex lg:hidden items-center justify-between gap-3 -mt-1 -mx-1 px-1 pb-1 border-b border-border">
                      <div className="flex items-center gap-2 min-w-0">
                        {user.user_metadata?.avatar_url ? (
                          <img src={user.user_metadata.avatar_url} alt={user.email ?? 'Avatar'} className="h-8 w-8 rounded-full shrink-0" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground shrink-0">
                            {user.email?.[0]?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          void onSignOut();
                        }}
                        className="flex items-center gap-1.5 shrink-0 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors py-1.5 px-2 rounded-lg hover:bg-destructive/10"
                        aria-label={t('nav.signOut')}
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {t('nav.signOut')}
                      </button>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t('nav.searchMode.title')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMode?.('test');
                        }}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                          isTest
                            ? 'border-amber-400/70 bg-amber-50 dark:bg-amber-950/25 shadow-sm shadow-amber-500/5'
                            : 'border-border text-muted-foreground hover:border-amber-400/50 hover:bg-muted/70'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isTest ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' : 'bg-muted text-muted-foreground'}`}>
                          <TestTube2 className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className={`text-xs font-semibold ${isTest ? 'text-foreground' : 'text-muted-foreground'}`}>{t('nav.searchMode.test.title')}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{t('nav.searchMode.test.desc')}</div>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleMode?.('real');
                        }}
                        disabled={credits <= 0}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all text-left ${
                          !isTest
                            ? 'border-emerald-400/70 bg-emerald-50 dark:bg-emerald-950/25 shadow-sm shadow-emerald-500/5'
                            : credits <= 0
                              ? 'border-border opacity-40 cursor-not-allowed'
                              : 'border-border text-muted-foreground hover:border-emerald-400/50 hover:bg-muted/70'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${!isTest ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                          <Zap className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <div className={`text-xs font-semibold ${!isTest ? 'text-foreground' : 'text-muted-foreground'}`}>{t('nav.searchMode.real.title')}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{credits > 0 ? t('nav.searchMode.real.credits', undefined, { count: credits }) : t('nav.searchMode.real.noCredits')}</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <BatteryIcon className="h-3 w-3 text-brand" />
                        {t('nav.creditsAvailable')}
                      </label>
                      <span className="text-xs font-bold text-foreground">{credits} <span className="text-muted-foreground font-normal text-[10px]">{t('nav.perLoad')}</span></span>
                    </div>

                    <div className="relative">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-500"
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
                      <p className="text-xs text-[#8D4B00] dark:text-[#FDD663] font-medium flex items-center gap-1">
                        <BatteryWarning className="h-3 w-3" />
                        {t('nav.noCreditsWarning')}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col items-center rounded-xl p-2.5 border border-border/80 bg-muted/80 transition-colors hover:bg-muted">
                      <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-md bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300">
                        <Search className="h-3 w-3" />
                      </span>
                      <div className="text-base font-bold leading-tight text-foreground">{totalSearches}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{t('nav.stats.searches')}</div>
                    </div>
                    <div className="flex flex-col items-center rounded-xl p-2.5 border border-border/80 bg-muted/80 transition-colors hover:bg-muted">
                      <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-md bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                        <ShoppingCart className="h-3 w-3" />
                      </span>
                      <div className="text-base font-bold leading-tight text-foreground">{totalPurchases * 10}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5">{t('nav.stats.creditsPurchased')}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onOpenBuyCredits?.();
                    }}
                    className="group relative w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg
                               bg-brand text-[#123832] font-semibold text-xs shadow-sm shadow-brand/20
                               transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#21B09F] hover:shadow-lg hover:shadow-brand/25
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                               active:translate-y-0 active:scale-[0.98] overflow-hidden"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/35">
                      <ShoppingCart className="h-3.5 w-3.5" />
                    </span>
                    <span>{t('nav.buyCredits')}</span>
                    <span className="rounded-full bg-[#123832]/10 px-1.5 py-0.5 text-[10px] font-semibold">{t('nav.buyCreditsPrice')}</span>
                    <ArrowRight className="ml-auto h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};