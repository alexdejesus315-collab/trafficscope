import React from 'react';
import { DomainMetrics } from '../types/domain';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Share2, Search, Compass, Mail, ExternalLink, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrafficSourcesProps {
  metrics: DomainMetrics;
}

export const TrafficSources: React.FC<TrafficSourcesProps> = ({ metrics }) => {
  const sources = metrics.trafficSources || [];

  const getSourceIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case 'pesquisa':
      case 'pesquisa orgânica':
        return <Search className="h-4 w-4 text-emerald-600" />;
      case 'direto':
        return <Globe className="h-4 w-4 text-primary" />;
      case 'social':
        return <Share2 className="h-4 w-4 text-pink-600" />;
      case 'email':
      case 'email & outros':
        return <Mail className="h-4 w-4 text-purple-600" />;
      default:
        return <ExternalLink className="h-4 w-4 text-amber-600" />;
    }
  };

  return (
    <Card className="shadow-2xs hover:shadow-md transition-shadow duration-200">
      <CardContent className="space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Compass className="h-5 w-5 text-primary" />
              <span>Fontes de Tráfego</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Canais de aquisição de visitantes
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
                >
                  {sources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--popover-foreground)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [`${val}%`, 'Participação']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-muted-foreground font-medium">Principal</span>
              <span className="text-base font-extrabold text-foreground font-mono">
                {sources[0]?.name || 'Orgânico'}
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
                    <span>{source.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground">{source.visits.toLocaleString('pt-BR')} visitas</span>
                    <span className="font-mono font-bold text-foreground w-10 text-right">{source.percentage}%</span>
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-border">
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