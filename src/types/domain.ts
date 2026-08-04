export type PlanType = 'free' | 'pro' | 'enterprise';

export interface TrafficPoint {
  date: string;
  visits: number;
  uniqueVisitors: number;
  pageViews: number;
  [domainName: string]: string | number; // for comparative charts
}

export interface TrafficSource {
  name: string;
  percentage: number;
  visits: number;
  color: string;
}

export interface CountryTraffic {
  code: string;
  name: string;
  flag: string;
  percentage: number;
  visits: number;
  trend: number;
}

export interface AiAnalysisReport {
  summary: string;
  growthDrivers: string[];
  threatsAndRisks: string[];
  opportunities: string[];
  strategicActions: string[];
  forecast3Months: {
    optimistic: number;
    baseline: number;
    pessimistic: number;
    comment: string;
  };
}

export interface DomainMetrics {
  domain: string;
  name: string;
  logo: string;
  category: string;
  description: string;
  monthlyVisits: number;
  growthRate: number;
  avgVisitDuration: string;
  pagesPerVisit: number;
  bounceRate: number;
  trafficHistory: TrafficPoint[];
  trafficSources: TrafficSource[];
  countryTraffic: CountryTraffic[];
  aiReport?: AiAnalysisReport;
  lastUpdated: string;
  dataSource?: 'real' | 'synthetic';
}

export interface ComparisonData {
  domains: string[];
  metrics: DomainMetrics[];
}