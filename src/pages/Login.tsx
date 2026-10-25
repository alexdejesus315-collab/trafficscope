import React from 'react';
import { Activity, ArrowUpRight, BarChart3, Globe2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex items-center justify-center p-4 sm:p-6">
      <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-40 -right-24 h-[28rem] w-[28rem] rounded-full bg-link/5 blur-3xl" />
      <div className="relative flex w-full max-w-5xl flex-col gap-4 md:flex-row">

        {/* Brand Box */}
        <div className="hidden md:flex relative w-[50%] min-h-[85vh] flex-col justify-between rounded-2xl bg-footer px-10 py-10 text-white overflow-hidden shadow-xl shadow-foreground/10">
          <div aria-hidden="true" className="absolute -right-24 -top-20 h-72 w-72 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -right-12 -top-8 h-48 w-48 rounded-full border border-white/10" />
          <div aria-hidden="true" className="absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-brand/10 blur-2xl" />

          <div className="relative inline-flex w-fit items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.24em] text-white">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-footer">
              <Activity className="h-4 w-4" />
            </span>
            TrafficScope
          </div>

          <div className="relative my-10 flex flex-1 items-center">
            <div className="w-full rounded-2xl border border-white/15 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/15 text-brand">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                  <Globe2 className="h-3 w-3" />
                  <span>{t('login.visualBadge')}</span>
                </div>
              </div>
              <svg viewBox="0 0 440 170" aria-hidden="true" className="h-auto w-full overflow-visible">
                <defs>
                  <linearGradient id="loginChartFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2AC6B2" stopOpacity=".32" />
                    <stop offset="100%" stopColor="#2AC6B2" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[30, 70, 110, 150].map((y) => (
                  <line key={y} x1="0" y1={y} x2="440" y2={y} stroke="white" strokeOpacity=".1" strokeDasharray="4 7" />
                ))}
                <path d="M0 133 C42 124 54 95 92 105 S145 129 182 91 S239 83 269 97 S317 48 350 62 S399 54 440 22 V170 H0Z" fill="url(#loginChartFill)" />
                <path d="M0 133 C42 124 54 95 92 105 S145 129 182 91 S239 83 269 97 S317 48 350 62 S399 54 440 22" fill="none" stroke="#2AC6B2" strokeWidth="3" strokeLinecap="round" />
                <circle cx="350" cy="62" r="5" fill="#2AC6B2" stroke="#123832" strokeWidth="3" />
                <circle cx="440" cy="22" r="5" fill="#fff" stroke="#2AC6B2" strokeWidth="3" />
              </svg>
              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/55">
                <span>{t('login.visualFooter')}</span>
                <ArrowUpRight className="h-4 w-4 text-brand" />
              </div>
            </div>
          </div>

          <div className="relative space-y-3">
            <p className="max-w-sm text-2xl font-semibold leading-snug tracking-tight text-white">
              {t('login.tagline')}
            </p>
          </div>
        </div>

        {/* Login Box */}
        <div className="relative overflow-hidden w-full md:w-[50%] min-h-[85vh] px-8 py-10 sm:px-12 sm:py-14 flex flex-col justify-center bg-card text-card-foreground rounded-2xl border border-border/70 shadow-xl shadow-foreground/5">
          <div className="relative max-w-md mx-auto w-full">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/15 text-brand md:hidden">
              <Activity className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">{t('login.welcome')}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground text-center">
              {t('login.subtitle')}
            </p>

            <div className="mt-8 space-y-4">
              <Button
                type="button"
                variant="default"
                onClick={() => void signInWithGoogle()}
                className="w-full gap-2 py-3 h-auto rounded-full shadow-sm"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.0 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {t('login.googleButton')}
              </Button>

              <p className="text-center text-xs leading-5 text-muted-foreground">
                {t('login.footer.termsPrefix')} <span className="font-semibold text-foreground underline cursor-pointer">{t('login.footer.terms')}</span> {t('login.footer.and')} <span className="font-semibold text-foreground underline cursor-pointer">{t('login.footer.privacy')}</span>.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}