import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { House, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';

interface CompanyPagePanelProps {
  title: string;
  children: React.ReactNode;
}

export function CompanyPagePanel({ title, children }: CompanyPagePanelProps) {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      className={`min-h-screen bg-background text-foreground transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header igual ao Blog */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center">
          <Link to="/" className="flex min-w-0 flex-col gap-0.5 text-foreground">
            <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] sm:tracking-[0.3em]">
              <Activity className="h-4 w-4" />
              TrafficScope
            </span>
            <span className="hidden sm:block text-[11px] text-muted-foreground leading-tight">{t('nav.tagline')}</span>
          </Link>
          <Link
            to="/"
            aria-label={t('companyPanel.home', 'Página inicial')}
            title={t('companyPanel.home', 'Página inicial')}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <House className="h-4 w-4" />
          </Link>
          <div className="flex min-w-0 justify-end">
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-8">
          {title}
        </h1>

        <div className="prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground prose-headings:font-semibold prose-h2:text-lg prose-strong:text-foreground">
          {children}
        </div>
      </main>
    </div>
  );
}