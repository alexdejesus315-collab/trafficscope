import React from 'react';
import { DomainMetrics } from '../types/domain';
import { TrendingUp, TrendingDown, Clock, MousePointerClick, Eye } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface OverviewMetricsProps {
  metrics: DomainMetrics;
}

export const OverviewMetrics: React.FC<OverviewMetricsProps> = ({ metrics }) => {
  const isPositiveGrowth = metrics.growthRate >= 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

      {/* 1. Tráfego Total */}
      <Card className="shadow-2xs">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tráfego Total</span>
            <div className="p-2 rounded-xl bg-[#368948]/10 text-[#368948]">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.monthlyVisits.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">visitas estimadas / mês</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Crescimento */}
      <Card className="shadow-2xs">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Crescimento</span>
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
            <p className="text-[11px] text-muted-foreground mt-1">variação no período</p>
          </div>
        </CardContent>
      </Card>

      {/* 3. Tempo Médio de Permanência */}
      <Card className="shadow-2xs">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tempo Médio</span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.avgVisitDuration}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">{metrics.pagesPerVisit} págs. por visita</p>
          </div>
        </CardContent>
      </Card>

      {/* 4. Bounce Rate (Taxa de Rejeição) */}
      <Card className="shadow-2xs">
        <CardContent className="flex flex-col justify-between h-full">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Bounce Rate</span>
            <div className="p-2 rounded-xl bg-[#EB7414]/10 text-[#EB7414]">
              <MousePointerClick className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-extrabold text-foreground font-mono">
              {metrics.bounceRate}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">taxa de rejeição</p>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};