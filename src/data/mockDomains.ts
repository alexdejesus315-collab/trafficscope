import { DomainMetrics, TrafficPoint } from '../types/domain';

// Utility helper to generate a simple time-series (~3 months, alinhado com o histórico real da Apify)
function generateHistory(baseVisits: number, trendMultiplier: number): TrafficPoint[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const count = 3;
  const points: TrafficPoint[] = [];
  let currentVisits = baseVisits * (1 - (count * 0.02 * trendMultiplier));

  for (let i = 0; i < count; i++) {
    const monthIdx = (new Date().getMonth() - count + i + 12) % 12;
    const fluctuation = 1 + (Math.random() * 0.12 - 0.05);
    currentVisits = Math.max(10000, currentVisits * (1 + (0.015 * trendMultiplier)) * fluctuation);

    points.push({
      date: `${months[monthIdx]} 2025`,
      visits: Math.round(currentVisits),
      uniqueVisitors: Math.round(currentVisits * 0.68),
      pageViews: Math.round(currentVisits * 3.4),
    });
  }
  return points;
}

export const MOCK_PRESET_DOMAINS: Record<string, DomainMetrics> = {
  'amazon.com': {
    domain: 'amazon.com',
    name: 'Amazon Inc.',
    logo: 'https://www.google.com/s2/favicons?domain=amazon.com&sz=128',
    category: 'E-commerce & Varejo Global',
    description: 'Maior ecossistema de e-commerce e serviços de nuvem do mundo.',
    monthlyVisits: 2450000000,
    growthRate: 12.4,
    avgVisitDuration: '7m 14s',
    pagesPerVisit: 8.6,
    bounceRate: 34.2,
    lastUpdated: 'Atualizado há 15 minutos',
    trafficHistory: generateHistory(2450000000, 1.2),
    trafficSources: [
      { name: 'Direto', percentage: 56.4, visits: 1381800000, color: '#3b82f6' },
      { name: 'Pesquisa Orgânica', percentage: 26.8, visits: 656600000, color: '#10b981' },
      { name: 'Referral', percentage: 8.2, visits: 200900000, color: '#f59e0b' },
      { name: 'Social', percentage: 5.1, visits: 124950000, color: '#ec4899' },
      { name: 'Email & Outros', percentage: 3.5, visits: 85750000, color: '#8b5cf6' },
    ],
    countryTraffic: [
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 62.1, visits: 1521450000, trend: 1.8 },
      { code: 'CA', name: 'Canadá', flag: '🇨🇦', percentage: 8.4, visits: 205800000, trend: 3.2 },
      { code: 'DE', name: 'Alemanha', flag: '🇩🇪', percentage: 5.6, visits: 137200000, trend: -0.5 },
      { code: 'UK', name: 'Reino Unido', flag: '🇬🇧', percentage: 5.1, visits: 124950000, trend: 2.1 },
      { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 3.8, visits: 93100000, trend: 14.2 },
      { code: 'AO', name: 'Angola', flag: '🇦🇴', percentage: 0.4, visits: 9800000, trend: 22.5 },
    ],
  },

  'ebay.com': {
    domain: 'ebay.com',
    name: 'eBay Inc.',
    logo: 'https://www.google.com/s2/favicons?domain=ebay.com&sz=128',
    category: 'E-commerce & Leilões Online',
    description: 'Plataforma líder global em leilões, artigos colecionáveis e comércio C2C/B2C.',
    monthlyVisits: 680000000,
    growthRate: -4.2,
    avgVisitDuration: '6m 12s',
    pagesPerVisit: 6.4,
    bounceRate: 38.5,
    lastUpdated: 'Atualizado há 10 minutos',
    trafficHistory: generateHistory(680000000, -0.4),
    trafficSources: [
      { name: 'Pesquisa Orgânica', percentage: 48.2, visits: 327760000, color: '#10b981' },
      { name: 'Direto', percentage: 34.5, visits: 234600000, color: '#3b82f6' },
      { name: 'Referral', percentage: 8.4, visits: 57120000, color: '#f59e0b' },
      { name: 'Social', percentage: 5.2, visits: 35360000, color: '#ec4899' },
      { name: 'Email', percentage: 3.7, visits: 25160000, color: '#8b5cf6' },
    ],
    countryTraffic: [
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 45.3, visits: 308040000, trend: -3.8 },
      { code: 'UK', name: 'Reino Unido', flag: '🇬🇧', percentage: 14.2, visits: 96560000, trend: 1.1 },
      { code: 'DE', name: 'Alemanha', flag: '🇩🇪', percentage: 9.8, visits: 66640000, trend: -1.4 },
      { code: 'AU', name: 'Austrália', flag: '🇦🇺', percentage: 6.1, visits: 41480000, trend: 2.0 },
      { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 2.4, visits: 16320000, trend: 5.6 },
    ],
  },

  'jumia.co.ao': {
    domain: 'jumia.co.ao',
    name: 'Jumia Angola',
    logo: 'https://www.google.com/s2/favicons?domain=jumia.co.ao&sz=128',
    category: 'E-commerce Regional & Marketplace',
    description: 'Plataforma de comércio eletrónico e entregas líder em Angola e mercados africanos.',
    monthlyVisits: 3200000,
    growthRate: 31.0,
    avgVisitDuration: '5m 18s',
    pagesPerVisit: 4.9,
    bounceRate: 41.2,
    lastUpdated: 'Atualizado há 3 minutos',
    trafficHistory: generateHistory(3200000, 2.5),
    trafficSources: [
      { name: 'Pesquisa Orgânica', percentage: 51.2, visits: 1638400, color: '#10b981' },
      { name: 'Direto', percentage: 25.8, visits: 825600, color: '#3b82f6' },
      { name: 'Social', percentage: 14.5, visits: 464000, color: '#ec4899' },
      { name: 'Referral', percentage: 5.3, visits: 169600, color: '#f59e0b' },
      { name: 'Email', percentage: 3.2, visits: 102400, color: '#8b5cf6' },
    ],
    countryTraffic: [
      { code: 'AO', name: 'Angola', flag: '🇦🇴', percentage: 89.2, visits: 2854400, trend: 32.1 },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹', percentage: 4.8, visits: 153600, trend: 8.5 },
      { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 2.1, visits: 67200, trend: 4.2 },
      { code: 'MZ', name: 'Moçambique', flag: '🇲🇿', percentage: 1.8, visits: 57600, trend: 15.0 },
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 1.1, visits: 35200, trend: 1.0 },
    ],
  }
};

// Dynamic Domain Generator for any unlisted website typed by user
export function getOrGenerateDomainData(rawDomain: string): DomainMetrics {
  const domain = rawDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();

  if (MOCK_PRESET_DOMAINS[domain]) {
    return MOCK_PRESET_DOMAINS[domain];
  }

  // Create deterministic hash from domain string
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);

  const estimatedVisits = 150000 + (positiveHash % 85000000);
  const growthRate = ((positiveHash % 50) - 15) + 0.4;
  const isTechOrSaas = domain.includes('io') || domain.includes('ai') || domain.includes('app') || domain.includes('dev') || domain.includes('tech');

  const formattedName = domain.split('.')[0].toUpperCase() + (domain.split('.')[1] ? '.' + domain.split('.')[1] : '');

  return {
    domain,
    name: formattedName,
    logo: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    category: isTechOrSaas ? 'Tecnologia & SaaS / Soluções Web' : 'Negócios Online & Serviços',
    description: `Plataforma e ecossistema web operando no domínio ${domain}.`,
    monthlyVisits: estimatedVisits,
    growthRate: Number(growthRate.toFixed(1)),
    avgVisitDuration: `${3 + (positiveHash % 5)}m ${12 + (positiveHash % 45)}s`,
    pagesPerVisit: Number((2.5 + (positiveHash % 30) / 10).toFixed(1)),
    bounceRate: Number((32 + (positiveHash % 28)).toFixed(1)),
    lastUpdated: 'Análise gerada agora',
    trafficHistory: generateHistory(estimatedVisits, growthRate > 0 ? 1 : -0.5),
    trafficSources: [
      { name: 'Pesquisa Orgânica', percentage: 45.0, visits: Math.round(estimatedVisits * 0.45), color: '#10b981' },
      { name: 'Direto', percentage: 32.0, visits: Math.round(estimatedVisits * 0.32), color: '#3b82f6' },
      { name: 'Social', percentage: 12.0, visits: Math.round(estimatedVisits * 0.12), color: '#ec4899' },
      { name: 'Referral', percentage: 7.0, visits: Math.round(estimatedVisits * 0.07), color: '#f59e0b' },
      { name: 'Email / Outros', percentage: 4.0, visits: Math.round(estimatedVisits * 0.04), color: '#8b5cf6' },
    ],
    countryTraffic: [
      { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 42.0, visits: Math.round(estimatedVisits * 0.42), trend: 2.1 },
      { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 18.5, visits: Math.round(estimatedVisits * 0.185), trend: 5.4 },
      { code: 'PT', name: 'Portugal', flag: '🇵🇹', percentage: 12.0, visits: Math.round(estimatedVisits * 0.12), trend: 1.8 },
      { code: 'AO', name: 'Angola', flag: '🇦🇴', percentage: 8.5, visits: Math.round(estimatedVisits * 0.085), trend: 11.2 },
      { code: 'ES', name: 'Espanha', flag: '🇪🇸', percentage: 5.0, visits: Math.round(estimatedVisits * 0.05), trend: 0.5 },
    ],
  };
}