import React from 'react';
import { Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-6">
      <div className="flex w-full max-w-5xl gap-4">

        {/* Brand Box */}
        <div className="hidden md:flex relative w-[50%] min-h-[85vh] flex-col justify-between bg-slate-950 px-10 py-10 text-white rounded-xl shadow-xl shadow-black/5 overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-900/20 rounded-full blur-3xl" />
          </div>

          <div className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            <Activity className="h-4 w-4 text-white" />
            TrafficScope
          </div>

          <div className="relative space-y-4">
            <p className="text-xl font-semibold leading-snug tracking-tight text-white">
              {t('login.tagline')}
            </p>
            <p className="text-xs text-white/60"></p>
          </div>
        </div>

        {/* Login Box */}
        <div className="w-full md:w-[50%] min-h-[85vh] px-8 py-10 sm:px-12 sm:py-14 flex flex-col justify-center bg-background border border-border rounded-xl shadow-xl shadow-black/5">
          <div className="max-w-md mx-auto w-full">
            <h1 className="text-3xl font-bold tracking-tight text-foreground text-center">{t('login.welcome')}</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground text-center">
              {t('login.subtitle')}
            </p>

            <div className="mt-8 space-y-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => void signInWithGoogle()}
                className="w-full gap-2 py-3 h-auto rounded-xl"
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