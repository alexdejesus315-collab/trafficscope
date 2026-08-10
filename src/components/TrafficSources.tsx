import React from 'react';
import { DomainMetrics } from '../types/domain';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, Search, Compass, Mail, ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '../context/LanguageContext';

interface TrafficSourcesProps {
  metrics: DomainMetrics;
}

export const TrafficSources: React.FC<TrafficSourcesProps> = ({ metrics }) => {
  const { t, language } = useLanguage();
  const sources = metrics.trafficSources || [];

  // Locale para formatação de números conforme idioma
  const numberLocale = language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  // Mapeia nomes de fontes (PT do backend) para chaves de tradução
  const getSourceTranslationKey = (name: string): string | null => {
    const normalized = name.toLowerCase().trim();
    const map: Record<string, string> = {
      'pesquisa': 'trafficSources.source.organic',
      'pesquisa orgânica': 'trafficSources.source.organic',
      'organic search': 'trafficSources.source.organic',
      'direto': 'trafficSources.source.direct',
      'direct': 'trafficSources.source.direct',
      'social': 'trafficSources.source.social',
      'email': 'trafficSources.source.email',
      'email & outros': 'trafficSources.source.emailOthers',
      'email & others': 'trafficSources.source.emailOthers',
      'referral': 'trafficSources.source.referral',
    };
    return map[normalized] || null;
  };

  const getSourceName = (name: string): string => {
    const key = getSourceTranslationKey(name);
    return key ? t(key) : name;
  };

  const getSourceIcon = (name: string) => {
    const normalized = name.toLowerCase().trim();
    switch (normalized) {
      case 'pesquisa':
      case 'pesquisa orgânica':
      case 'organic search':
        return <Search className="h-4 w-4 text-emerald-600" />;
      case 'direto':
      case 'direct':
        return <Globe className="h-4 w-4 text-primary" />;
      case 'social':
        return <Share2 className="h-4 w-4 text-pink-600" />;
      case 'email':
      case 'email & outros':
      case 'email & others':
        return <Mail className="h-4 w-4 text-purple-600" />;
      default:
        return <ExternalLink className="h-4 w-4 text-amber-600" />;
    }
  };

  // Tooltip customizado para traduzir nomes no hover do donut
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    const name = data?.name || '';
    const value = data?.value || 0;
    return (
      <div className="bg-popover border border-border rounded-xl px-3 py-2 shadow-lg">
        <p className="text-xs font-semibold text-popover-foreground">{getSourceName(name)}</p>
        <p className="text-[11px] text-muted-foreground">{value}% {t('trafficSources.donut.participation')}</p>
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>{t('trafficSources.title')}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('trafficSources.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

          {/* Recharts Donut */}
          <div className="md:col-span-5 h-56 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sources}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="percentage"
                  nameKey="name"
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground font-medium">{t('trafficSources.donut.mainSource')}</span>
              <span className="text-base font-extrabold text-foreground font-mono">
                {sources[0]?.name ? getSourceName(sources[0].name) : t('trafficSources.donut.organicFallback')}
              </span>
            </div>
          </div>

          {/* Progress Bars Breakdown List */}
          <div className="md:col-span-7 space-y-3.5">
            {sources.map((source) => (
              <div key={source.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {getSourceIcon(source.name)}
                    <span>{getSourceName(source.name)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{source.visits.toLocaleString(numberLocale)} {t('trafficSources.visits')}</span>
                    <span className="font-mono font-bold text-foreground w-10 text-right">{source.percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${source.percentage}%`,
                      backgroundColor: source.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

        </div>

      </CardContent>
    </Card>
  );
};