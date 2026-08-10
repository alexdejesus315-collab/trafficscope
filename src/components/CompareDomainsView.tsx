import React from 'react';
import { DomainMetrics } from '../types/domain';
import { GitCompare, Crown, TrendingUp, TrendingDown, X } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../context/LanguageContext';

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
  const { t } = useLanguage();

  if (!metricsList || metricsList.length === 0) return null;

  const sortedByVisits = [...metricsList].sort((a, b) => b.monthlyVisits - a.monthlyVisits);
  const leaderDomain = sortedByVisits[0]?.domain;

  const chartData = metricsList.map((m) => ({
    name: m.domain,
    value: Number((m.monthlyVisits / 1000000).toFixed(1))
  }));

  return (
    <div className="space-y-6">

      {/* Compare Header */}
      <Card className="p-5 hover:shadow-md transition-shadow duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-foreground" />
            <h2 className="text-lg font-bold text-foreground">
              {t('compare.title').replace('{{count}}', String(metricsList.length))}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('compare.subtitle')}
          </p>
        </div>

        <Button onClick={onExitCompareMode} variant="outline" size="sm">
          {t('compare.exitButton')}
        </Button>
      </Card>

      {/* Comparative Bar Chart */}
      <Card className="p-5 space-y-3 hover:shadow-md transition-shadow duration-200">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t('compare.chartTitle')}
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
              <Bar dataKey="value" name={t('compare.chartLabel')} fill="var(--primary)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Side-by-Side Comparative Matrix Table */}
      <Card className="p-5 space-y-4 overflow-x-auto hover:shadow-md transition-shadow duration-200">
        <table className="w-full text-left text-xs text-muted-foreground">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="py-4 px-4 font-bold text-muted-foreground w-48">{t('compare.metricHeader')}</th>
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
                        title={t('compare.removeTitle')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {m.domain === leaderDomain && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 mt-1">
                      <Crown className="h-3 w-3" /> {t('compare.trafficLeader')}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border font-mono">
            {/* Monthly Traffic */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.monthlyTraffic')}</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-base font-extrabold text-foreground">
                  {m.monthlyVisits.toLocaleString('pt-BR')}
                </td>
              ))}
            </tr>

            {/* Growth % */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.growth')}</td>
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

            {/* Duration & Pages */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.durationPages')}</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground">
                  {m.avgVisitDuration} • {m.pagesPerVisit} {t('compare.pagesAbbr')}
                </td>
              ))}
            </tr>

            {/* Bounce Rate */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.bounceRate')}</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground">
                  {m.bounceRate}%
                </td>
              ))}
            </tr>

            {/* Primary Channel */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.primaryChannel')}</td>
              {metricsList.map((m) => (
                <td key={m.domain} className="py-3 px-4 text-foreground font-sans font-medium">
                  {m.trafficSources[0]?.name} ({m.trafficSources[0]?.percentage}%)
                </td>
              ))}
            </tr>

            {/* Top Country */}
            <tr className="hover:bg-muted/40 transition-colors">
              <td className="py-3 px-4 font-sans font-semibold text-muted-foreground">{t('compare.topCountry')}</td>
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