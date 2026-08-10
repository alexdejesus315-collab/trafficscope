import React from 'react';
import { DomainMetrics } from '../types/domain';
import { TrendingUp, TrendingDown, Clock, MousePointerClick, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '../context/LanguageContext';

interface OverviewMetricsProps {
  metrics: DomainMetrics;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ metrics }) => {
  const { t, language } = useLanguage();
  const isPositiveGrowth = metrics.growthRate >= 0;

  // Locale para formatação de números conforme idioma
  const numberLocale = language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

      {/* 1. Tráfego Total */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('overview.trafficTotal')}</span>
            <div className="p-2 rounded-full bg-[#368948]/10 text-[#368948]">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.monthlyVisits.toLocaleString(numberLocale)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('overview.estimatedVisitsPerMonth')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Crescimento */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('overview.growth')}</span>
            <div className={`p-2 rounded-xl ${isPositiveGrowth ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {isPositiveGrowth ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            </div>
          </div>
          <div>
            <div className={`text-2xl font-extrabold font-mono flex items-center gap-1 ${
              isPositiveGrowth ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <span>{isPositiveGrowth ? '▲' : '▼'}</span>
              <span>{isPositiveGrowth ? `+${metrics.growthRate}%` : `${metrics.growthRate}%`}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('overview.periodVariation')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tempo Médio de Permanência */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('overview.avgTime')}</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.avgVisitDuration}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {t('overview.pagesPerVisit', undefined, { count: metrics.pagesPerVisit })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bounce Rate (Taxa de Rejeição) */}
      <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('overview.bounceRate')}</span>
            <div className="p-2 rounded-xl bg-[#EB7414]/10 text-[#EB7414]">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.bounceRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{t('overview.bounceRateLabel')}</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};