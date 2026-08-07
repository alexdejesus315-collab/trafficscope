import React from 'react';
import { DomainMetrics } from '../types/domain';
import { Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GeoMapSectionProps {
  metrics: DomainMetrics;
}

export const GeoMapSection: React.FC<GeoMapSectionProps> = ({ metrics }) => {
  const countries = metrics.countryTraffic || [];

  return (
    <Card className="shadow-2xs hover:shadow-md transition-shadow duration-200">
      <CardContent className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <span>Origem Geográfica do Tráfego</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Distribuição de audiência por países
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* Visual Map Representation Card */}
          <div className="lg:col-span-5 bg-muted rounded-xl p-4 border border-border flex flex-col items-center justify-center min-h-[220px] text-center relative overflow-hidden">
            <Globe className="h-20 w-20 text-muted-foreground/40 mb-3 stroke-1" />

            <div className="relative z-10">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mercado Líder</span>
              <div className="text-2xl font-extrabold text-foreground flex items-center justify-center gap-2 mt-1">
                <span>{countries[0]?.flag}</span>
                <span>{countries[0]?.name || 'Global'}</span>
              </div>
              <p className="text-xs text-emerald-600 font-bold mt-1">
                {countries[0]?.percentage}% do tráfego total
              </p>
            </div>
          </div>

          {/* Countries Grid & List */}
          <div className="lg:col-span-7 space-y-3">
            {countries.map((c, index) => (
              <div key={c.code} className="bg-muted p-3 rounded-xl border border-border flex items-center justify-between hover:border-muted-foreground/30 transition-all">

                <div className="flex items-center gap-3">
                  <span className="text-2xl">{c.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{c.name}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">({c.code})</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {c.visits.toLocaleString('pt-BR')} visitas estimadas
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