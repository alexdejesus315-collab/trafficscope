import React from 'react';
import { DomainMetrics } from '../types/domain';
import { Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLanguage } from '../context/LanguageContext';

interface GeoMapSectionProps {
  metrics: DomainMetrics;
}

export const GeoMapSection: React.FC<GeoMapSectionProps> = ({ metrics }) => {
  const { t, language } = useLanguage();
  const countries = metrics.countryTraffic || [];

  // Locale para formatação de números conforme idioma
  const numberLocale = language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  // Traduz nome do país automaticamente via código ISO (ex: JP → Japan/Japão/Japón)
  const getCountryName = (code: string, fallbackName?: string): string => {
    try {
      const displayNames = new Intl.DisplayNames([language], { type: 'region' });
      return displayNames.of(code.toUpperCase()) || fallbackName || code;
    } catch {
      return fallbackName || code;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span>{t('geoMap.title')}</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('geoMap.subtitle')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* Visual Map Representation Card */}
          <div className="lg:col-span-5 bg-muted rounded-xl p-4 flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
            <Globe className="h-20 w-20 text-muted-foreground/40 mb-3 stroke-1" />

            <div className="relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('geoMap.leadingMarket')}</span>
              <div className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-2 mt-1">
                <span>{countries[0]?.flag}</span>
                <span>
                  {countries[0]?.code
                    ? getCountryName(countries[0].code, countries[0]?.name)
                    : t('geoMap.globalFallback')}
                </span>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                {t('geoMap.totalTrafficShare', undefined, { percentage: countries[0]?.percentage ?? 0 })}
              </p>
            </div>
          </div>

          {/* Countries Grid & List */}
          <div className="lg:col-span-7 space-y-3">
            {countries.map((c) => (
              <div key={c.code} className="bg-muted p-3 rounded-xl flex items-center justify-between shadow-2xs hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        {getCountryName(c.code, c.name)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">({c.code})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.visits.toLocaleString(numberLocale)} {t('geoMap.estimatedVisits')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-foreground font-mono">
                    {c.percentage}%
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

      </CardContent>
    </Card>
  );
};