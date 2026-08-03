import React, { useState } from 'react';
import { DomainMetrics } from '../types/domain';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import { BarChart2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TrafficChartProps {
  metricsList: DomainMetrics[];
}

export const TrafficChart: React.FC<TrafficChartProps> = ({ metricsList }) => {
  const [chartType, setChartType] = useState<'area' | 'line'>('area');

  if (!metricsList || metricsList.length === 0) return null;

  const primaryMetric = metricsList[0];
  const historyData = primaryMetric.trafficHistory || [];

  // Merge traffic data points for multi-domain comparison
  const mergedChartData = historyData.map((pt, index) => {
    const entry: any = { date: pt.date };
    metricsList.forEach((m) => {
      const list = m.trafficHistory || [];
      const ptMatch = list[index] || list[list.length - 1];
      entry[m.domain] = ptMatch ? ptMatch.visits : m.monthlyVisits;
    });
    return entry;
  });

  const domainColors = ['#279ef9', '#059669', '#d97706', '#db2777', '#279ef9'];

  const formatNumberShort = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
    return num.toString();
  };

  return (
    <Card className="shadow-2xs">
      <CardContent className="space-y-4">

        {/* Header & Chart Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BarChart2 className="h-5 w-5 text-[#279ef9]" />
              <span>Evolução do Tráfego Estimado</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visitas totais mensais • histórico completo disponível ({historyData.length} {historyData.length === 1 ? 'mês' : 'meses'})
            </p>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center gap-2">
            <div className="bg-muted p-1 rounded-xl border border-border flex items-center gap-1">
              <button
                onClick={() => setChartType('area')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === 'area'
                    ? 'bg-background text-[#279ef9] shadow-2xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Área
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  chartType === 'line'
                    ? 'bg-background text-[#279ef9] shadow-2xs border border-border'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Linhas
              </button>
            </div>
          </div>
        </div>

        {/* Chart Visual Container */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  {metricsList.map((m, idx) => (
                    <linearGradient key={m.domain} id={`colorGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={domainColors[idx % domainColors.length]} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={domainColors[idx % domainColors.length]} stopOpacity={0.0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={formatNumberShort} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '0.75rem', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString('pt-BR') : val, 'Visitas']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                {metricsList.map((m, idx) => (
                  <Area
                    key={m.domain}
                    type="monotone"
                    dataKey={m.domain}
                    name={m.name || m.domain}
                    stroke={domainColors[idx % domainColors.length]}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill={`url(#colorGrad-${idx})`}
                  />
                ))}
              </AreaChart>
            ) : (
              <LineChart data={mergedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={formatNumberShort} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '0.75rem', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  formatter={(val: any) => [typeof val === 'number' ? val.toLocaleString('pt-BR') : val, 'Visitas']}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                {metricsList.map((m, idx) => (
                  <Line
                    key={m.domain}
                    type="monotone"
                    dataKey={m.domain}
                    name={m.name || m.domain}
                    stroke={domainColors[idx % domainColors.length]}
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Chart Legend / Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {metricsList.map((m, idx) => (
            <div key={m.domain} className="bg-muted p-3 rounded-xl border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: domainColors[idx % domainColors.length] }}
                />
                <span className="text-xs font-bold text-foreground font-mono">{m.domain}</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-extrabold text-foreground font-mono">
                  {formatNumberShort(m.monthlyVisits)}
                </span>
                <span className={`block text-[10px] font-bold ${m.growthRate >= 0 ? 'text-[#279ef9]' : 'text-rose-600'}`}>
                  {m.growthRate >= 0 ? `+${m.growthRate}%` : `${m.growthRate}%`}
                </span>
              </div>
            </div>
          ))}
        </div>

      </CardContent>
    </Card>
  );
};