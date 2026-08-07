import React from 'react';
import { DomainMetrics } from '../types/domain';
import { GitCompare, Crown, TrendingUp, TrendingDown, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CompareDomainsViewProps {
  metricsList: DomainMetrics[];
  onRemoveFromCompare: (domain: string) => void;
  onExitCompareMode: () => void;
}

export const CompareDomainsView: React.FC<CompareDomainsViewProps> = ({
  metricsList,
  onRemoveFromCompare,
  onExitCompareMode
}) => {
  if (!metricsList || metricsList.length === 0) return null;

  // Find overall traffic leader
  const sortedByVisits = [...metricsList].sort((a, b) => b.monthlyVisits - a.monthlyVisits);
  const leaderDomain = sortedByVisits[0]?.domain;

  // Prepare Comparative Bar Chart Data
  const chartData = metricsList.map((m) => ({
    name: m.domain,
    'Visitas Mensais (M)': Number((m.monthlyVisits / 1000000).toFixed(1))
  }));

  return (
    <div className="space-y-6">

      {/* Compare Header */}
      <Card className="p-5 shadow-2xs hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">
              Comparação de Domínios ({metricsList.length} de 5)
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Benchmarking lado a lado de tráfego, crescimento, SEO e infraestrutura
          </p>
        </div>

        <Button onClick={onExitCompareMode} variant="outline" size="sm">
          Sair do Modo Comparativo
        </Button>
      </Card>

      {/* Comparative Bar Chart */}
      <Card className="p-5 space-y-3 shadow-2xs hover:shadow-md transition-shadow duration-200">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Volume de Tráfego Estimado (Milhões de Visitas / Mês)
        </h3>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '0.75rem', color: 'var(--popover-foreground)' }}
              />
              <Bar dataKey="Visitas Mensais (M)" fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Side-by-Side Comparative Matrix Table */}
      <Card className="p-5 space-y-4 overflow-x-auto shadow-2xs hover:shadow-md transition-shadow duration-200">
        <table className="w-full text-left text-xs text-muted-foreground">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="py-4 px-4 font-bold text-muted-foreground w-48">Métrica Benchmark</th>
              {metricsList.map((m) => (
                <th key={m.domain} className="py-4 px-4 min-w-[200px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${m.domain}&sz=64`}
                        alt={m.domain}
                        className="h-5 w-5 rounded bg-muted p-0.5"
                      />
                      <span className="font-bold text-foreground font-mono">{m.domain}</span>
                    </div>

                    {metricsList.length > 1 && (
                      <Button
                        onClick={() => onRemoveFromCompare(m.domain)}
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-rose-500"
                        title="Remover da comparação"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {m.domain === leaderDomain && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-1">
                      <Crown className="h-3 w-3" /> Líder de Tráfego
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border font-mono">
            {/* Tráfego Mensal */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Tráfego Mensal</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-base font-extrabold text-foreground">
                  {m.monthlyVisits.toLocaleString('pt-BR')}
                </td>
              ))}
            </tr>

            {/* Crescimento % */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Crescimento (%)</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4">
                  <span className={`font-bold flex items-center gap-0.5 ${
                    m.growthRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {m.growthRate >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{m.growthRate >= 0 ? `+${m.growthRate}%` : `${m.growthRate}%`}</span>
                  </span>
                </td>
              ))}
            </tr>

            {/* Tempo Média e Páginas */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Duração / Páginas</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground">
                  {m.avgVisitDuration} • {m.pagesPerVisit} págs.
                </td>
              ))}
            </tr>

            {/* Bounce Rate */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Bounce Rate</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground">
                  {m.bounceRate}%
                </td>
              ))}
            </tr>

            {/* Principal Canal */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Canal Primário</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground font-sans font-medium">
                  {m.trafficSources[0]?.name} ({m.trafficSources[0]?.percentage}%)
                </td>
              ))}
            </tr>

            {/* Principais Países */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">Top País</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 font-sans text-foreground">
                  {m.countryTraffic[0]?.flag} {m.countryTraffic[0]?.name} ({m.countryTraffic[0]?.percentage}%)
                </td>
              ))}
            </tr>

          </tbody>
        </table>
      </Card>

    </div>
  );
};