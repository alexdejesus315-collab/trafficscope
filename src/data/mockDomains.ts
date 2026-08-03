import { DomainMetrics, TrafficPoint } from '../types/domain';

// ===== ALTERADO: PRNG determinístico seedado pelo hash do domínio =====
// Antes, generateHistory() usava Math.random() puro — o histórico mudava a
// cada pedido, mesmo para o mesmo domínio. Agora é sempre igual.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashDomain(domain: string): number {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = (hash << 5) - hash + domain.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Utility helper to generate a simple time-series (~3 months, alinhado com o histórico real da Apify)
function generateHistory(baseVisits: number, trendMultiplier: number, rng: () => number): TrafficPoint[] {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const count = 3;
  const points: TrafficPoint[] = [];
  let currentVisits = baseVisits * (1 - (count * 0.02 * trendMultiplier));

  for (let i = 0; i < count; i++) {
    const monthIdx = (new Date().getMonth() - count + i + 12) % 12;
    const fluctuation = 1 + (rng() * 0.12 - 0.05);
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
    trafficHistory: generateHistory(2450000000, 1.2, mulberry32(hashDomain('amazon.com'))),
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
    trafficHistory: generateHistory(680000000, -0.4, mulberry32(hashDomain('ebay.com'))),
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
    trafficHistory: generateHistory(3200000, 2.5, mulberry32(hashDomain('jumia.co.ao'))),
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

// ===== ALTERADO: camadas de popularidade para dar escala coerente =====
// Não há hoje uma base de tráfego real, gratuita e sem limites, integrável
// com segurança (opções como a Tranco List exigem parsing de zip + rede que
// não consigo validar aqui). Em alternativa, usamos domínios mundialmente
// conhecidos como âncora: garante que google.com nunca sai do mesmo tamanho
// que um domínio obscuro qualquer. Fora destas listas, cai no heurístico
// por hash do nome do domínio.
const TIER_1_MEGA = new Set([
  'google.com', 'youtube.com', 'facebook.com', 'instagram.com', 'whatsapp.com',
  'wikipedia.org', 'x.com', 'twitter.com', 'tiktok.com', 'amazon.com',
  'chatgpt.com', 'openai.com', 'microsoft.com', 'apple.com', 'yahoo.com',
  'bing.com', 'reddit.com', 'linkedin.com', 'netflix.com', 'pinterest.com',
]);

const TIER_2_LARGE = new Set([
  'ebay.com', 'github.com', 'stackoverflow.com', 'spotify.com', 'shopify.com',
  'canva.com', 'cnn.com', 'bbc.com', 'nytimes.com', 'twitch.tv', 'discord.com',
  'zoom.us', 'dropbox.com', 'adobe.com', 'salesforce.com', 'walmart.com',
  'aliexpress.com', 'temu.com', 'booking.com', 'airbnb.com',
]);

const TIER_3_REGIONAL = new Set([
  'jumia.co.ao', 'mercadolivre.com.br', 'globo.com', 'uol.com.br',
  'sapo.pt', 'publico.pt', 'expresso.pt', 'olx.co.ao', 'jumia.com.ng',
]);

function popularityMultiplier(domain: string): number {
  if (TIER_1_MEGA.has(domain)) return 60;
  if (TIER_2_LARGE.has(domain)) return 12;
  if (TIER_3_REGIONAL.has(domain)) return 3;
  return 1;
}

// ===== ALTERADO: deteção de país por ccTLD (.ao, .pt, .br, ...) =====
// Dá prioridade geográfica coerente em vez de sempre EUA/Brasil/Portugal fixos.
const CC_TLD_COUNTRY: Record<string, { code: string; name: string; flag: string }> = {
  ao: { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  pt: { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  br: { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  mz: { code: 'MZ', name: 'Moçambique', flag: '🇲🇿' },
  uk: { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  de: { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  fr: { code: 'FR', name: 'França', flag: '🇫🇷' },
  es: { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
};

function detectCcTld(domain: string): { code: string; name: string; flag: string } | null {
  const parts = domain.split('.');
  const tld = parts[parts.length - 1];
  return CC_TLD_COUNTRY[tld] || null;
}

// Dynamic Domain Generator for any unlisted website typed by user
export function getOrGenerateDomainData(rawDomain: string): DomainMetrics {
  const domain = rawDomain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();

  if (MOCK_PRESET_DOMAINS[domain]) {
    return MOCK_PRESET_DOMAINS[domain];
  }

  const positiveHash = hashDomain(domain);
  const rng = mulberry32(positiveHash); // ALTERADO: PRNG seedado, reprodutível

  const tierMultiplier = popularityMultiplier(domain);
  const baseVisits = 150000 + (positiveHash % 1850000); // 150k–2M para domínio "desconhecido"
  const estimatedVisits = Math.round(baseVisits * tierMultiplier);

  const growthRate = ((positiveHash % 50) - 15) + 0.4;
  const isTechOrSaas =
    domain.includes('io') || domain.includes('ai') || domain.includes('app') ||
    domain.includes('dev') || domain.includes('tech') || domain.includes('saas') ||
    domain.includes('cloud') || domain.includes('soft');

  const formattedName = domain.split('.')[0].toUpperCase() + (domain.split('.')[1] ? '.' + domain.split('.')[1] : '');

  const detectedCountry = detectCcTld(domain);
  const countryTraffic = detectedCountry
    ? [
        { ...detectedCountry, percentage: 58.0, visits: Math.round(estimatedVisits * 0.58), trend: Number(((positiveHash % 20) - 5).toFixed(1)) },
        { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 15.0, visits: Math.round(estimatedVisits * 0.15), trend: 1.2 },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹', percentage: 10.0, visits: Math.round(estimatedVisits * 0.10), trend: 0.8 },
        { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 9.0, visits: Math.round(estimatedVisits * 0.09), trend: 3.1 },
        { code: 'FR', name: 'França', flag: '🇫🇷', percentage: 8.0, visits: Math.round(estimatedVisits * 0.08), trend: 0.4 },
      ].filter((c, idx, arr) => arr.findIndex(x => x.code === c.code) === idx)
    : [
        { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', percentage: 42.0, visits: Math.round(estimatedVisits * 0.42), trend: 2.1 },
        { code: 'BR', name: 'Brasil', flag: '🇧🇷', percentage: 18.5, visits: Math.round(estimatedVisits * 0.185), trend: 5.4 },
        { code: 'PT', name: 'Portugal', flag: '🇵🇹', percentage: 12.0, visits: Math.round(estimatedVisits * 0.12), trend: 1.8 },
        { code: 'AO', name: 'Angola', flag: '🇦🇴', percentage: 8.5, visits: Math.round(estimatedVisits * 0.085), trend: 11.2 },
        { code: 'ES', name: 'Espanha', flag: '🇪🇸', percentage: 5.0, visits: Math.round(estimatedVisits * 0.05), trend: 0.5 },
      ];

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
    trafficHistory: generateHistory(estimatedVisits, growthRate > 0 ? 1 : -0.5, rng),
    trafficSources: [
      { name: 'Pesquisa Orgânica', percentage: 45.0, visits: Math.round(estimatedVisits * 0.45), color: '#10b981' },
      { name: 'Direto', percentage: 32.0, visits: Math.round(estimatedVisits * 0.32), color: '#3b82f6' },
      { name: 'Social', percentage: 12.0, visits: Math.round(estimatedVisits * 0.12), color: '#ec4899' },
      { name: 'Referral', percentage: 7.0, visits: Math.round(estimatedVisits * 0.07), color: '#f59e0b' },
      { name: 'Email / Outros', percentage: 4.0, visits: Math.round(estimatedVisits * 0.04), color: '#8b5cf6' },
    ],
    countryTraffic,
  };
}