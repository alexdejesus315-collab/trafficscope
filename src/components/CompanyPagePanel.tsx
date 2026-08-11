import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
      className={`min-h-screen bg-background transition-opacity duration-200 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={t('companyPanel.back', 'Voltar')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <a href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="h-5 w-5 text-foreground" />
            <span className="text-2xl font-bold text-foreground tracking-tight">TrafficScope</span>
          </a>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-8">{title}</h1>

        <div className="space-y-8">
          {children}
        </div>
      </div>
    </div>
  );
}