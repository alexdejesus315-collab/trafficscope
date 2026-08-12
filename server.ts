import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { getOrGenerateDomainData } from "./src/data/mockDomains";
import rateLimit from "express-rate-limit";
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { supabaseAdmin } from './src/lib/supabaseAdmin';
import { OWNER_USER_ID } from './src/lib/ownerConfig';
import { PADDLE_PRICES } from './src/lib/paddleConfig';
import googleTrends from 'google-trends-api';
const paddle = new Paddle(process.env.PADDLE_API_KEY!);

const LANGUAGE_NAMES: Record<string, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

function getLanguageName(lang?: string): string {
  return LANGUAGE_NAMES[lang || 'pt'] || LANGUAGE_NAMES.pt;
}

// Executa uma chamada à Groq com retry automático quando bate rate limit (429),
// respeitando o "retry-after" que a própria Groq devolve.
async function groqCallWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastErr: any;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const isRateLimit = err?.status === 429;
      if (!isRateLimit || attempt === maxRetries) throw err;

      const retryAfterHeader = err?.headers?.get?.('retry-after');
      const waitMs = retryAfterHeader
        ? Math.ceil(Number(retryAfterHeader) * 1000)
        : 1500 * (attempt + 1);

      console.warn(`Rate limit da Groq, tentativa ${attempt + 1}/${maxRetries}, aguardando ${waitMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastErr;
}

async function getUserFromRequest(req: express.Request) {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;

  return data.user;
}

// ===== ALTERADO: helper único para resolver o plano do utilizador =====
// Free (ou anónimo) => sempre dados sintéticos, sem limites de uso.
// Pro/Enterprise => dados reais via Apify, com os limites diários que já existiam.
type PlanType = 'free' | 'pro' | 'enterprise';

async function resolveUserPlan(user: { id: string } | null): Promise<PlanType> {
  if (!user) return 'free';

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle();

  const isActive = sub?.status === 'active';
  return isActive ? (sub!.plan as PlanType) : 'free';
}


// ===== Integração Apify (SimilarWeb Fast Scraper) — usada apenas para Pro/Enterprise =====

const APIFY_ACTOR_ID = "pro100chok~similarweb-scraper";
const FIXED_REFERENCE_DOMAINS = [
  "amazon.com", "ebay.com", "jumia.co.ao", "aliexpress.com", "temu.com",
  "google.com", "wikipedia.org", "shopify.com", "mercadolivre.com.br", "walmart.com"
];

// ===== NOVO: Pools de nicho e ângulos narrativos para o Blog =====
const NICHE_POOLS: { category: string; domains: string[] }[] = [  { category: "E-commerce Global", domains: ["amazon.com", "ebay.com", "shopee.com", "aliexpress.com", "temu.com"] },
  { category: "Streaming & Entretenimento", domains: ["netflix.com", "disneyplus.com", "primevideo.com", "spotify.com", "hbomax.com"] },
  { category: "Fintech & Pagamentos", domains: ["paypal.com", "stripe.com", "revolut.com", "klarna.com", "wise.com"] },
  { category: "Redes Sociais", domains: ["instagram.com", "tiktok.com", "x.com", "linkedin.com", "snapchat.com"] },
  { category: "Viagens & Turismo", domains: ["booking.com", "airbnb.com", "expedia.com", "tripadvisor.com", "skyscanner.com"] },
  { category: "Entrega & Mobilidade", domains: ["ubereats.com", "doordash.com", "glovoapp.com", "ifood.com.br", "uber.com"] },
  { category: "Produtividade & SaaS", domains: ["notion.so", "slack.com", "zoom.us", "canva.com", "figma.com"] },
];

const NARRATIVE_ANGLES = [
  {
    key: "rivalry",
    instruction: "Foque numa RIVALIDADE direta entre dois domínios do dataset com trajetórias opostas — um a crescer, outro a estagnar ou cair. O título deve criar tensão entre os dois.",
  },
  {
    key: "prediction",
    instruction: "Foque numa PREVISÃO/TENDÊNCIA futura baseada nos dados atuais — o que estes números sugerem para os próximos 6-12 meses neste setor.",
  },
  {
    key: "warning",
    instruction: "Foque num ALERTA ou RISCO que os dados revelam — um sinal de alerta que empresas do setor deveriam notar, com tom de urgência mas sem exagero.",
  },
  {
    key: "listicle",
    instruction: "Estruture o artigo como uma pequena lista ordenada (ex: 'Os 3 sinais que os dados revelam sobre X'), usando os domínios do dataset como exemplos de cada ponto.",
  },
  {
    key: "regional",
    instruction: "Foque na perspetiva REGIONAL/LOCAL, mas só se os domínios do dataset tiverem ligação real a mercados emergentes/África — não force essa ligação se não existir base real nos dados.",
  },
  {
    key: "mythbusting",
    instruction: "Foque em DESMENTIR uma suposição comum do setor, usando os dados reais para mostrar que a realidade é diferente do que se pensa.",
  },
];

// ===== NOVO: Pool de temas de notícia/contexto para o Blog =====
const NEWS_TOPICS: { category: string; query: string; instruction: string }[] = [
  {
    category: "Tecnologia",
    query: "notícias tecnologia inteligência artificial lançamentos 2026",
    instruction: "Escolha UMA notícia recente e concreta sobre tecnologia/IA a partir dos factos fornecidos. Explique o que aconteceu e depois ligue explicitamente a como isso deve afetar o tráfego web, a popularidade de busca ou o comportamento digital das empresas/plataformas envolvidas.",
  },
  {
    category: "Mercados Financeiros",
    query: "notícias mercados financeiros bolsa big tech resultados 2026",
    instruction: "Escolha UM evento financeiro recente (resultados trimestrais, IPO, fusão, queda/alta de ações) a partir dos factos fornecidos. Ligue explicitamente esse evento a como se reflete ou deve refletir no interesse de busca/tráfego online da empresa envolvida.",
  },
  {
    category: "Geopolítica & Economia Global",
    query: "geopolítica economia global tarifas sanções comércio internacional 2026",
    instruction: "Escolha UM desenvolvimento geopolítico recente a partir dos factos fornecidos. Explique as consequências práticas para a economia global e ligue isso a efeitos esperados no comércio digital, e-commerce cross-border ou tráfego web de plataformas afetadas.",
  },
  {
    category: "Startups & Inovação em África",
    query: "startups inovação tecnologia África funding 2026",
    instruction: "Escolha UMA notícia recente sobre uma startup ou iniciativa de inovação africana a partir dos factos fornecidos. Explique o que a torna relevante e ligue isso ao potencial de crescimento de tráfego/popularidade digital que representa para o ecossistema africano.",
  },
  {
    category: "China-América & Comércio Global",
    query: "relação China Estados Unidos comércio tecnologia 2026",
    instruction: "Escolha UM desenvolvimento recente na relação China-EUA (tecnologia, comércio, tarifas) a partir dos factos fornecidos. Ligue isso a como afeta plataformas digitais, e-commerce global ou o tráfego de empresas destes dois mercados.",
  },
  {
    category: "Criptomoedas",
    query: "criptomoedas bitcoin mercado cripto notícias 2026",
    instruction: "Escolha UM movimento recente do mercado cripto a partir dos factos fornecidos. Ligue isso a picos ou quedas esperadas de interesse de busca/tráfego em exchanges e plataformas relacionadas.",
  },
  {
    category: "Moda & Arte",
    query: "moda arte tendências lançamentos colaborações 2026",
    instruction: "Escolha UMA tendência ou lançamento recente em moda/arte a partir dos factos fornecidos. Ligue isso a como esse tipo de evento costuma gerar picos de busca e tráfego digital para marcas e plataformas envolvidas.",
  },
];

// ===== NOVO: Categorias para a área de Notícias (feed de manchetes + vídeo) =====
const NEWS_CATEGORIES: { key: string; label: string; query: string }[] = [
  {
    key: "tech-ia",
    label: "Tecnologia & IA",
    query: "\"artificial intelligence\" OR ChatGPT OR \"AI regulation\"",
  },
  {
    key: "big-tech",
    label: "Big Tech & Plataformas",
    query: "Google OR Meta OR \"Amazon Web Services\" OR TikTok OR Microsoft",
  },
  {
    key: "seo-marketing",
    label: "SEO & Marketing Digital",
    query: "SEO OR \"digital marketing\" OR \"Google algorithm\"",
  },
  {
    key: "ecommerce",
    label: "E-commerce & Retalho Online",
    query: "ecommerce OR \"online retail\" OR \"online shopping trends\"",
  },
  {
    key: "mercados-cripto",
    label: "Mercados Financeiros & Cripto",
    query: "bitcoin OR cryptocurrency OR \"stock market\"",
  },
  {
    key: "startups-africa",
    label: "Startups & Inovação em África",
    query: "\"African startup\" OR \"Africa tech\" OR \"African fintech\"",
  },
  {
    key: "geopolitica-comercio",
    label: "Geopolítica & Comércio Global",
    query: "tariffs OR \"global trade\" OR sanctions OR \"trade war\"",
  },
  {
    key: "privacidade-regulacao",
    label: "Privacidade & Regulação Digital",
    query: "\"data privacy\" OR \"AI regulation\" OR GDPR",
  },
];

// ===== NOVO: Busca de notícias reais (GNews) + vídeo associado (YouTube) =====

async function fetchGNewsForCategory(query: string): Promise<any[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) throw new Error("GNEWS_API_KEY não configurada");

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&in=title&max=3&apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`GNews respondeu com status ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  return data.articles || [];
}

async function findYoutubeCandidates(searchQuery: string): Promise<{ videoId: string; title: string }[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return [];

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=5&relevanceLanguage=en&videoCategoryId=25&order=relevance&videoEmbeddable=true&q=${encodeURIComponent(searchQuery)}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    return (data.items || [])
      .filter((item: any) => item?.id?.videoId)
      .map((item: any) => ({ videoId: item.id.videoId, title: item.snippet?.title || "" }));
  } catch (err) {
    console.error("Falha ao buscar vídeo no YouTube:", err);
    return [];
  }
}

// Entre vários candidatos do YouTube, pede à IA para escolher o mais relevante (ou nenhum)
async function pickRelevantVideo(
  groq: Groq,
  candidates: { videoId: string; title: string }[],
  articleTitle: string,
  articleDescription?: string
): Promise<string | null> {
  if (candidates.length === 0) return null;

  try {
    const list = candidates.map((c, i) => `${i + 1}. ${c.title}`).join("\n");
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 100,
      messages: [
        {
          role: "system",
          content: "Escolha o vídeo cujo TEMA GERAL se sobrepõe ao da notícia — não precisa de ser o mesmo evento, empresa ou pessoa exatos, basta tratar da mesma área/assunto. Exemplo: para a notícia 'CEOs de bancos apontam IA como motor de transformação', o vídeo 'Does AI Mean the End of Banks?' É RELEVANTE, porque ambos tratam de IA no setor bancário. Só responda 0 se NENHUM vídeo tiver qualquer ligação temática — isso deve ser raro. Pense brevemente sobre cada candidato num único parágrafo curto (máximo 2 frases) e depois, OBRIGATORIAMENTE, termine com uma última linha isolada e exata no formato: RESPOSTA: <número> — sem mais nada depois dessa linha.",
        },
        {
          role: "user",
          content: `Notícia: "${articleTitle}"${articleDescription ? ` — ${articleDescription}` : ""}\n\nVídeos encontrados no YouTube:\n${list}\n\nQual destes vídeos tem mais sobreposição temática com a notícia acima? Responda 0 apenas se realmente nenhum tiver relação com o assunto.`,
        },
      ],
    });

    const answer = response.choices[0]?.message?.content?.trim() || "0";
    const respostaMatch = answer.match(/RESPOSTA:\s*(\d+)/i);
    const fallbackMatch = answer.match(/\d+/);
    const chosenNumber = respostaMatch ? respostaMatch[1] : (fallbackMatch ? fallbackMatch[0] : "0");
    const index = parseInt(chosenNumber, 10) - 1;
    return candidates[index]?.videoId || null;
  } catch (err) {
    console.error("Falha ao validar relevância do vídeo:", err);
    return null;
  }
}


type ComparisonTopic = { type: "comparison"; niche: typeof NICHE_POOLS[0]; angle: typeof NARRATIVE_ANGLES[0]; topicKey: string };
type NewsTopic = { type: "news"; news: typeof NEWS_TOPICS[0]; topicKey: string };
type ManualTopic = { type: "manual"; domain: string; theme: string; affiliateLink?: string; topicKey: string };
type Topic = ComparisonTopic | NewsTopic | ManualTopic;


// Evita repetir a mesma combinação nicho+ângulo (ou tema de notícia) dos últimos artigos
async function pickUnusedTopic(): Promise<Topic> {
  const { data: recentPosts } = await supabaseAdmin
    .from("blog_posts")
    .select("topic_key")
    .order("created_at", { ascending: false })
    .limit(6);

  const recentKeys = new Set((recentPosts || []).map((p) => p.topic_key).filter(Boolean));

  const comparisonCombos: ComparisonTopic[] = [];
  for (const niche of NICHE_POOLS) {
    for (const angle of NARRATIVE_ANGLES) {
      comparisonCombos.push({ type: "comparison", niche, angle, topicKey: `compare::${niche.category}::${angle.key}` });
    }
  }

  const newsCombos: NewsTopic[] = NEWS_TOPICS.map((news) => ({
    type: "news",
    news,
    topicKey: `news::${news.category}`,
  }));

  // Notícias entram com peso x6 para equilibrar com o pool bem maior de comparação de tráfego
  // (42 combinações de comparação vs 7 de notícia — sem este peso, notícia sairia só ~14% das vezes)
  const allCombos: Topic[] = [...comparisonCombos, ...Array(6).fill(newsCombos).flat()];

  const unused = allCombos.filter((c) => !recentKeys.has(c.topicKey));
  const pool = unused.length > 0 ? unused : allCombos; // se já usámos tudo, liberta o filtro

  return pool[Math.floor(Math.random() * pool.length)];
}

// Cache simples em memória (evita pagar de novo pelo mesmo domínio em pouco tempo)
const apifyCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// ===== Rate Limiting: protege o crédito Apify contra abuso =====
// Nota: isto continua a aplicar-se a todos os pedidos a /api/analyze-domain,
// incluindo Free, como proteção genérica anti-abuso do servidor (não é um
// limite "de plano" — esses foram removidos para o Free). Se quiseres que o
// Free fique totalmente isento também disto, diz que eu ajusto.

const perIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados pedidos. Tente novamente dentro de uma hora." }
});

let globalRequestCount = 0;
let globalWindowStart = Date.now();
const GLOBAL_WINDOW_MS = 60 * 60 * 1000; // 1 hora
const GLOBAL_MAX_REQUESTS = 100;

function globalLimiter(req: express.Request, res: express.Response, next: express.NextFunction) {
  const now = Date.now();
  if (now - globalWindowStart > GLOBAL_WINDOW_MS) {
    globalWindowStart = now;
    globalRequestCount = 0;
  }

  globalRequestCount++;
  if (globalRequestCount > GLOBAL_MAX_REQUESTS) {
    return res.status(429).json({ error: "Limite global de pedidos atingido. Tente novamente mais tarde." });
  }

  next();
}

// ALTERADO: Free fica isento do rate limiting genérico — só Pro/Enterprise
// (que consomem crédito real da Apify) passam pelos limiters.
async function planAwareRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = await getUserFromRequest(req);
  const plan = await resolveUserPlan(user);

  if (plan === 'free') {
    return next();
  }

  perIpLimiter(req, res, (err?: any) => {
    if (err) return next(err);
    globalLimiter(req, res, next);
  });
}

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return "🏳️";
  const base = 127397;
  return String.fromCodePoint(...[...code.toUpperCase()].map(c => base + c.charCodeAt(0)));
}

function secondsToDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

function formatCategory(raw: string): string {
  if (!raw) return "Sem categoria";

  return raw
    .split("/")
    .map(segment =>
      segment
        .split("_")
        .map(word => (word === "and" ? "e" : word))
        .join(" ")
        .replace(/\b\w/g, char => char.toUpperCase())
    )
    .join(" / ");
}

function mapApifyItemToDomainMetrics(item: any): any {
  const monthsSorted = Object.keys(item.EstimatedMonthlyVisits || {}).sort();
  const trafficPoints = monthsSorted.map(date => ({
    date,
    visits: item.EstimatedMonthlyVisits[date],
    uniqueVisitors: Math.round(item.EstimatedMonthlyVisits[date] * 0.68),
    pageViews: Math.round(item.EstimatedMonthlyVisits[date] * (item.Engagments?.PagePerVisit || 3))
  }));

  let growthRate = 0;
  if (monthsSorted.length >= 2) {
    const prev = item.EstimatedMonthlyVisits[monthsSorted[monthsSorted.length - 2]];
    const curr = item.EstimatedMonthlyVisits[monthsSorted[monthsSorted.length - 1]];
    if (prev > 0) growthRate = Number((((curr - prev) / prev) * 100).toFixed(1));
  }

  const raw = item.TrafficSources || {};
  const totalVisits = item.Engagments?.Visits || 0;

  const SOURCE_GROUPS: { name: string; color: string; keys: string[] }[] = [
    { name: "Pesquisa", color: "#10b981", keys: ["SearchOrganic", "SearchPaid"] },
    { name: "Direto", color: "#3b82f6", keys: ["Direct"] },
    { name: "Social", color: "#ec4899", keys: ["SocialOrganic", "SocialPaid"] },
    { name: "Email", color: "#06b6d4", keys: ["Mail"] },
    { name: "Outros", color: "#f59e0b", keys: ["Referrals", "Affiliate", "DisplayAds", "GenAi"] }
  ];

  const trafficSources = SOURCE_GROUPS
    .map(group => {
      const percentage = group.keys.reduce((sum, key) => sum + (raw[key] || 0), 0);
      return {
        name: group.name,
        percentage: Number(percentage.toFixed(2)),
        visits: Math.round(totalVisits * (percentage / 100)),
        color: group.color
      };
    })
    .filter(source => source.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const countryTraffic = (item.TopCountryShares || []).map((c: any) => ({
    code: c.CountryCode,
    name: c.CountryCode,
    flag: countryCodeToFlag(c.CountryCode),
    percentage: c.Value,
    visits: Math.round((item.Engagments?.Visits || 0) * (c.Value / 100)),
    trend: 0
  }));

  const trafficHistory = trafficPoints;

  return {
    domain: item.SiteName,
    name: item.Title || item.SiteName,
    logo: `https://www.google.com/s2/favicons?domain=${item.SiteName}&sz=128`,
    category: formatCategory(item.Category),
    description: item.Description || "",
    monthlyVisits: item.Engagments?.Visits || 0,
    growthRate,
    avgVisitDuration: secondsToDuration(item.Engagments?.TimeOnSite || 0),
    pagesPerVisit: item.Engagments?.PagePerVisit || 0,
    bounceRate: item.Engagments?.BounceRate || 0,
    trafficHistory,
    trafficSources,
    countryTraffic,
    lastUpdated: `Dados de ${item.SnapshotDate?.slice(0, 7) || "data desconhecida"}`
  };
}

async function fetchApifyTrafficData(domains: string[]): Promise<any[]> {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("APIFY_TOKEN não configurado no .env");

  const url = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items?token=${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domains, searchType: "similarweb" })
  });

  if (!response.ok) {
    throw new Error(`Apify respondeu com status ${response.status}`);
  }

  return response.json();
}

// ===== NOVO: Dados reais e gratuitos para o Blog =====

// Google Trends — popularidade de pesquisa real, sem custo por chamada
async function fetchTrendsData(keywords: string[]): Promise<{ name: string; value: number }[]> {
  const results = await googleTrends.interestOverTime({
    keyword: keywords,
    startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // últimos 90 dias
  });
  const parsed = JSON.parse(results);
  const timelineData = parsed?.default?.timelineData;
  if (!timelineData?.length) throw new Error('Google Trends sem dados para estas keywords');

  const sums = keywords.map(() => 0);
  timelineData.forEach((point: any) => {
    point.value.forEach((v: number, i: number) => { sums[i] += v; });
  });
  const averages = sums.map((s) => Math.round(s / timelineData.length));

  return keywords.map((k, i) => ({ name: k, value: averages[i] }));
}

// Tavily — pesquisa web real, com fontes citáveis
async function fetchRealStats(query: string): Promise<{ snippets: string[]; sources: { title: string; url: string }[] }> {
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY não configurada');
  }
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      search_depth: 'basic',
      max_results: 5,
    }),
  });
  if (!res.ok) throw new Error(`Tavily respondeu com status ${res.status}`);
  const data = await res.json();
  const results = data.results || [];
  return {
    snippets: results.map((r: any) => r.content).slice(0, 5),
    sources: results.map((r: any) => ({ title: r.title, url: r.url })).slice(0, 5),
  };
}

// Unsplash — fotos reais e gratuitas, com atribuição obrigatória
async function fetchUnsplashImage(query: string): Promise<{ url: string; alt: string; photographer: string; photographerUrl: string } | null> {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const photo = data.results?.[0];
  if (!photo) return null;

  return {
    url: photo.urls.regular,
    alt: photo.alt_description || query,
    photographer: photo.user.name,
    photographerUrl: `${photo.user.links.html}?utm_source=trafficscope&utm_medium=referral`,
  };
}

// Substitui marcadores {{IMG_1}}, {{IMG_2}}, etc. por imagens reais do Unsplash com crédito
async function injectImagesIntoContent(content: string, imagePrompts: string[]): Promise<string> {
  let result = content;
  for (let i = 0; i < imagePrompts.length; i++) {
    const marker = `{{IMG_${i + 1}}}`;
    if (!result.includes(marker)) continue;

    let image = await fetchUnsplashImage(imagePrompts[i]);
    if (!image) {
      image = await fetchUnsplashImage('technology business'); // fallback genérico se a busca específica falhar
    }
    if (image) {
      const block = `\n\n![${image.alt}](${image.url})\n*Foto: [${image.photographer}](${image.photographerUrl}) via Unsplash*\n\n`;
      result = result.replace(marker, block);
    } else {
      result = result.replace(marker, ''); // sem imagem disponível, remove o marcador
    }
  }
  // Remove marcadores sobrantes, caso a IA tenha criado mais do que temos prompts
  result = result.replace(/\{\{IMG_\d+\}\}/g, '');
  return result;
}

// ===== NOVO: Sistema de Notificações =====
type NotificationType =
  | 'search_completed'
  | 'credits_low'
  | 'credits_zero'
  | 'usage_milestone'
  | 'credits_purchased'
  | 'new_blog_post';

async function createNotification(
  userId: string | null, // null = notificação global (todos os utilizadores)
  type: NotificationType,
  title: string,
  message: string,
  link?: string
) {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      link: link || null,
    });
  } catch (err) {
    console.error('Falha ao criar notificação:', err);
  }
}

async function saveSearchHistory(userId: string, domain: string, result: any) {
  try {
    await supabaseAdmin.from('search_history').insert({
      user_id: userId,
      domain,
      result,
      data_source: 'real',
    });

    // Mantém só as últimas 50 pesquisas por utilizador
    const { data: rows } = await supabaseAdmin
      .from('search_history')
      .select('id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (rows && rows.length > 50) {
      const idsToDelete = rows.slice(50).map(r => r.id);
      await supabaseAdmin.from('search_history').delete().in('id', idsToDelete);
    }
  } catch (err) {
    console.error('Falha ao gravar histórico de pesquisa:', err);
  }
}

async function getDomainDataWithCache(requestedDomain: string): Promise<any> {
  const cached = apifyCache.get(requestedDomain);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // Monta lote de 10 domínios: o pedido + referências fixas (sem repetir)
  const batch = [requestedDomain, ...FIXED_REFERENCE_DOMAINS.filter(d => d !== requestedDomain)].slice(0, 10);

  const results = await fetchApifyTrafficData(batch);

  const now = Date.now();
  for (const item of results) {
    const mapped = mapApifyItemToDomainMetrics(item);
    apifyCache.set(item.SiteName, { data: mapped, timestamp: now });
  }

  const result = apifyCache.get(requestedDomain);
  if (!result) throw new Error(`Domínio ${requestedDomain} não encontrado na resposta da Apify`);
  return result.data;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

app.post(
  '/api/webhooks/paddle',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['paddle-signature'] as string;
    const rawBody = req.body.toString();

    try {
      const event = await paddle.webhooks.unmarshal(
        rawBody,
        process.env.PADDLE_WEBHOOK_SECRET!,
        signature
      );

      console.log('Webhook Paddle recebido:', event.eventType);

      // === SUBSCRIÇÕES ANTIGAS (mantido para compatibilidade) ===
            // === SUBSCRIÇÕES ANTIGAS (mantido para compatibilidade, mas inativo no novo modelo) ===
      if (
        event.eventType === EventName.SubscriptionCreated ||
        event.eventType === EventName.SubscriptionUpdated
      ) {
        const sub = event.data;
        const userId = sub.customData?.user_id as string | undefined;

        if (userId) {
          const priceId = sub.items?.[0]?.price?.id;
          // NOVO: como o modelo mudou para créditos, subscrições antigas são tratadas como Pro
          const billingCycle = 'monthly';
          const plan = 'pro';

          await supabaseAdmin.from('subscriptions').upsert(
            {
              user_id: userId,
              paddle_subscription_id: sub.id,
              paddle_customer_id: sub.customerId,
              status: sub.status,
              plan,
              billing_cycle: billingCycle,
              current_period_end: sub.currentBillingPeriod?.endsAt ?? null,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        } else {
          console.error('Webhook sem user_id em customData');
        }
      }

      if (event.eventType === EventName.SubscriptionCanceled) {
        const sub = event.data;
        const userId = sub.customData?.user_id as string | undefined;

        if (userId) {
          await supabaseAdmin
            .from('subscriptions')
            .update({ status: 'canceled', updated_at: new Date().toISOString() })
            .eq('user_id', userId);
        }
      }

      // === NOVO: COMPRA ÚNICA DE CRÉDITOS ===
      if (event.eventType === EventName.TransactionCompleted) {
        const transaction = event.data;
        const userId = transaction.customData?.user_id as string | undefined;
        const creditsToAdd = (transaction.customData?.credits_to_add as number) || 10;

        if (userId) {
          // Busca perfil atual
          const { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('credits, total_purchases')
            .eq('user_id', userId)
            .single();

          const currentCredits = profile?.credits ?? 0;
          const currentPurchases = profile?.total_purchases ?? 0;

          const newCredits = currentCredits + creditsToAdd;
          const newPurchases = currentPurchases + 1;

          // Atualiza perfil com créditos e ativa modo real
          await supabaseAdmin
            .from('user_profiles')
            .upsert(
              {
                user_id: userId,
                credits: newCredits,
                total_purchases: newPurchases,
                mode: 'real',
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id' }
            );

          console.log(`✅ Créditos adicionados: user=${userId}, +${creditsToAdd}, total=${newCredits}`);

          // NOVO: notifica o utilizador da compra confirmada
          await createNotification(
            userId,
            'credits_purchased',
            'Créditos adicionados',
            `Foram adicionados ${creditsToAdd} créditos à tua conta. Total: ${newCredits}.`,
            undefined
          );
        } else {
          console.error('❌ TransactionCompleted sem user_id em customData');
        }
      }

      res.status(200).send('OK');
    } catch (err) {
      console.error('Erro ao verificar webhook Paddle:', err);
      res.status(400).send('Assinatura inválida');
    }
  }
);

  app.use(express.json());

  // Initialize Groq AI Client Server-Side
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "",
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ===== ALTERADO: Free passa a ter exportação liberada e ilimitada =====
  app.post("/api/check-export-limit", async (req, res) => {
    // NOVO: exportação liberada para todos (modo teste e real)
    return res.json({ success: true });
  });

  // ===== ALTERADO: Analyze Domain Metrics Endpoint =====
  // Free (ou sem sessão) => sempre dados sintéticos (getOrGenerateDomainData), nunca Apify, sem limite diário.
  // Pro/Enterprise => dados reais via Apify (com cache), fallback sintético se a Apify falhar.
  app.post("/api/analyze-domain", async (req, res) => {
    try {
      const { domain, domains, useRealData } = req.body;

      // Modo comparação (vários domínios) — sempre dados de teste
      if (domains && Array.isArray(domains) && domains.length > 0) {
        const results = domains.map((d: string) => ({
          ...getOrGenerateDomainData(d),
          dataSource: 'synthetic'
        }));
        return res.json({ success: true, domains: results });
      }

      if (!domain) {
        return res.status(400).json({ error: "Parâmetro domain ou domains é obrigatório" });
      }

      // NOVO: usa dados reais apenas se useRealData for true (frontend já consumiu crédito)
      if (!useRealData) {
        const data = { ...getOrGenerateDomainData(domain), dataSource: 'synthetic' };
        return res.json({ success: true, data });
      }

      try {
        const data = await getDomainDataWithCache(domain);
        const finalData = { ...data, dataSource: 'real' };

        // NOVO: grava no histórico (só dados reais, com sessão válida)
        const user = await getUserFromRequest(req);
        if (user) {
          await saveSearchHistory(user.id, domain, finalData);
          await createNotification(
            user.id,
            'search_completed',
            'Pesquisa concluída',
            `A análise de ${domain} foi concluída com dados reais.`,
            '/history'
          );
        }

        return res.json({ success: true, data: finalData });
      } catch (apifyErr) {
        console.error("Falha na Apify, a usar dados de teste como fallback:", apifyErr);
        const data = { ...getOrGenerateDomainData(domain), dataSource: 'synthetic' };
        return res.json({ success: true, data });
      }
    } catch (err: any) {
      console.error("Erro ao analisar domínio:", err);
      return res.status(500).json({ error: "Falha interna na análise do domínio" });
    }
  });

// ===== NOVO: Histórico de Pesquisas =====

  // Lista o histórico do utilizador autenticado
  app.get("/api/search-history", async (req, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const { data, error } = await supabaseAdmin
        .from("search_history")
        .select("id, domain, result, data_source, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return res.json({ success: true, history: data });
    } catch (err: any) {
      console.error("Erro ao buscar histórico de pesquisas:", err);
      return res.status(500).json({ error: "Falha ao buscar histórico." });
    }
  });

  // Apaga um item específico do histórico
  app.delete("/api/search-history/:id", async (req, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const { id } = req.params;

      const { error } = await supabaseAdmin
        .from("search_history")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id); // garante que só apaga o que é do próprio utilizador

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erro ao apagar item do histórico:", err);
      return res.status(500).json({ error: "Falha ao apagar item." });
    }
  });

  // Limpa todo o histórico do utilizador
  app.delete("/api/search-history", async (req, res) => {
    try {
      const user = await getUserFromRequest(req);
      if (!user) {
        return res.status(401).json({ error: "Sessão inválida." });
      }

      const { error } = await supabaseAdmin
        .from("search_history")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erro ao limpar histórico:", err);
      return res.status(500).json({ error: "Falha ao limpar histórico." });
    }
  });

  // ===== ALTERADO: AI Analysis Endpoint (Groq) — Free deixa de ser bloqueado =====
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { domain, metrics, language } = req.body;

      if (!domain || !metrics) {
        return res.status(400).json({ error: "Métricas do domínio são necessárias para análise" });
      }

      const languageName = getLanguageName(language);

      const user = await getUserFromRequest(req);
      const plan = await resolveUserPlan(user);
      const isSynthetic = metrics?.dataSource === 'synthetic' || plan === 'free';

      // ALTERADO: IA agora livre em todos os planos (Free, Pro, Enterprise) — limite de 10/dia removido do Pro

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          success: true,
          aiReport: {
            summary: `${isSynthetic ? '[Dados de demonstração] ' : ''}O tráfego de ${domain} registrou ${metrics.monthlyVisits.toLocaleString('pt-BR')} visitas mensais com taxa de variação de ${metrics.growthRate}%. A maior participação provém de ${metrics.trafficSources?.[0]?.name || 'Pesquisa Orgânica'} (${metrics.trafficSources?.[0]?.percentage || 48}%) com retenção média de ${metrics.avgVisitDuration}.`,
            growthDrivers: [
              `Forte participação de tráfego vindo de ${metrics.trafficSources?.[0]?.name || 'Busca Orgânica'}.`,
              `Baixa taxa de rejeição (${metrics.bounceRate}%) indicando boa retenção de visitantes.`,
              `Crescimento contínuo em mercados como ${metrics.countryTraffic?.[0]?.name || 'Estados Unidos'}.`
            ],
            threatsAndRisks: [
              `Dependência elevada em um único canal de aquisição primário.`,
              `Concorrência acirrada com plataformas emergentes no mesmo segmento.`
            ],
            opportunities: [
              `Expansão e otimização do canal Social (atualmente com apenas ${metrics.trafficSources?.find((s: any) => s.name === 'Social')?.percentage || 9}% do tráfego).`,
              `Captação de buscas por palavras-chave de cauda longa de baixa dificuldade.`
            ],
            strategicActions: [
              `Implementar campanhas focadas em atração de tráfego social no Instagram/TikTok.`,
              `Melhorar o tempo de carregamento de páginas móveis para diminuir a taxa de rejeição.`
            ],
            forecast3Months: {
              optimistic: Math.round(metrics.monthlyVisits * 1.25),
              baseline: Math.round(metrics.monthlyVisits * 1.08),
              pessimistic: Math.round(metrics.monthlyVisits * 0.95),
              comment: "Previsão baseada no histórico de engajamento e autoridade de domínio."
            }
          }
        });
      }

      const dataNotice = isSynthetic
        ? `\n\nAVISO IMPORTANTE: Os dados acima são sintéticos/ilustrativos, gerados para fins de demonstração (plano gratuito) e não refletem tráfego real de mercado. Nunca afirmes que são dados reais — podes referir que se trata de uma análise sobre dados de demonstração.`
        : '';

      const prompt = `
Você é um especialista sênior em inteligência competitiva e marketing digital.
Analise os seguintes dados do website "${domain}":
- Visitas Mensais: ${metrics.monthlyVisits}
- Crescimento: ${metrics.growthRate}%
- Tempo Médio: ${metrics.avgVisitDuration}
- Taxa de Rejeição: ${metrics.bounceRate}%
- Fontes de Tráfego: ${JSON.stringify(metrics.trafficSources)}
- Top Países: ${JSON.stringify(metrics.countryTraffic)}
${dataNotice}

Forneça uma análise estratégica completa em ${languageName}, respondendo APENAS com um objeto JSON válido no seguinte formato exato, sem texto antes ou depois:{
  "summary": "resumo executivo de 2 a 3 frases com principais conclusões de tráfego e comportamento",
  "growthDrivers": ["impulsionador 1", "impulsionador 2", "impulsionador 3"],
  "threatsAndRisks": ["risco 1", "risco 2"],
  "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3"],
  "strategicActions": ["ação 1", "ação 2"],
  "forecast3Months": {
    "optimistic": numero,
    "baseline": numero,
    "pessimistic": numero,
    "comment": "comentário sobre a previsão"
  }
}
`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
content: `Você é o assistente executivo de Inteligência Competitiva da plataforma TrafficScope. Responda em ${languageName} com tom profissional, preciso e acionável. Responda SEMPRE apenas com JSON válido, sem texto adicional, sem markdown dentro dos valores de texto (nada de tabelas, pipes, asteriscos ou cabeçalhos dentro das strings).${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`          },
          { role: "user", content: prompt }
        ]
      });

      const responseText = response.choices[0]?.message?.content || "{}";
      const parsedAiReport = JSON.parse(responseText);

      return res.json({ success: true, aiReport: parsedAiReport });
    } catch (err: any) {
      console.error("Erro na API Groq:", err);
      return res.status(500).json({ error: "Falha ao gerar insights da IA" });
    }
  });

  // AI Chat Copilot Endpoint using Groq (openai/gpt-oss-120b)
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { domain, metrics, messages, language } = req.body;
      const isSynthetic = metrics?.dataSource === 'synthetic';
      const languageName = getLanguageName(language);

      if (!process.env.GROQ_API_KEY) {
        return res.json({
          reply: `Análise para ${domain}: O site possui ${metrics?.monthlyVisits?.toLocaleString('pt-BR') || 'alto'} tráfego mensal e boa distribuição geográfica. Atualmente, a maior alavanca de crescimento é reforçar os canais com menor penetração.`
        });
      }

      const lastUserMessage = messages?.[messages.length - 1]?.content || `Como podemos aumentar o tráfego de ${domain}?`;

      const chatPrompt = `
Contexto do domínio analisado: ${domain}
Métricas Chave:
- Tráfego Mensal: ${metrics?.monthlyVisits}
- Taxa de Crescimento: ${metrics?.growthRate}%
- Principais canais: ${metrics?.trafficSources?.map((s: any) => `${s.name} (${s.percentage}%)`).join(', ')}
- Principais países: ${metrics?.countryTraffic?.map((c: any) => `${c.name} (${c.percentage}%)`).join(', ')}
${isSynthetic ? '\nNota: estes dados são sintéticos/de demonstração, não são tráfego real de mercado.' : ''}

Pergunta do usuário: "${lastUserMessage}"
`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        temperature: 0.6,
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
content: `Responda sempre em ${languageName}. Você é o Copilot de Inteligência Competitiva da TrafficScope. Responda em texto corrido, natural, como numa conversa de chat — nem telegráfico nem um ensaio. Como referência, entre 3 a 6 frases costuma ser o ponto certo, mas ajuste ao que a pergunta pede: uma dúvida simples merece resposta curta, um pedido que peça mais detalhe ou passos merece uma resposta um pouco mais desenvolvida. Nunca recuse ou diga que não consegue responder só por causa do tamanho pedido — nesse caso, dê a versão mais completa e útil que conseguir dentro de um chat, sem se preocupar em bater um número exato de linhas. Termine sempre as frases por completo, nunca corte uma ideia a meio. NUNCA use tabelas markdown, símbolos de pipe (|), cabeçalhos (#), listas numeradas ou com marcadores, nem asteriscos para negrito.${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`          },
          { role: "user", content: chatPrompt }
        ]
      });

      return res.json({ reply: response.choices[0]?.message?.content || "Não foi possível gerar uma resposta no momento." });
    } catch (err: any) {
      console.error("Erro no chat IA (Groq):", err);
      return res.status(500).json({ error: "Erro ao processar conversa de IA." });
    }
  });

// ===== NOVO: Geração de artigos do Blog (só o dono) =====
    app.post("/api/blog/generate", async (req, res) => {
      try {
        const user = await getUserFromRequest(req);
        if (!user) {
          console.error("Blog generate: sem sessão válida (token ausente ou expirado).");
          return res.status(403).json({ error: "Sessão inválida. Faz login novamente." });
        }
        if (user.id !== OWNER_USER_ID) {
          console.error(`Blog generate: user.id (${user.id}) não corresponde a OWNER_USER_ID (${OWNER_USER_ID}).`);
          return res.status(403).json({ error: "Acesso negado." });
        }

        if (!process.env.GROQ_API_KEY) {
          return res.status(500).json({ error: "GROQ_API_KEY não configurada no servidor." });
        }

        const { domain: manualDomain, theme: manualTheme, affiliateLink } = req.body;

        // NOVO: se o Admin indicou domínio + temática, usa modo manual;
        // caso contrário, escolhe automaticamente (comparação de tráfego ou notícia/contexto)
        const topic: Topic = manualDomain && manualTheme
          ? { type: "manual", domain: manualDomain, theme: manualTheme, affiliateLink, topicKey: `manual::${manualDomain}::${Date.now()}` }
          : await pickUnusedTopic();

        let chartData: { name: string; value: number }[] | null = null;
        let statsQuery: string;
        let category: string;

        if (topic.type === "comparison") {
          const referenceDomains = topic.niche.domains;
          const trendsKeywords = referenceDomains.map((d) => d.split(".")[0]);
          try {
            const trendsResults = await fetchTrendsData(trendsKeywords);
            // Remapeia de volta para o domínio completo (ex: "amazon" → "amazon.com"),
            // já que o Trends foi consultado com a keyword truncada mas o favicon precisa do domínio real
            chartData = trendsResults.map((r, i) => ({ name: referenceDomains[i], value: r.value }));
          } catch (trendsErr) {
            console.error("Falha no Google Trends, a usar dados de teste como fallback:", trendsErr);
            chartData = referenceDomains.map((d) => {
              const m = getOrGenerateDomainData(d);
              return { name: d, value: m.monthlyVisits };
            });
          }
          statsQuery = `estatísticas ${topic.niche.category} tendências globais 2026`;
          category = topic.niche.category;
        } else if (topic.type === "news") {
          statsQuery = topic.news.query;
          category = topic.news.category;
          // Sem comparação de domínios fixa; gráfico fica ausente a menos que a IA
          // identifique um domínio claramente relevante na notícia (tratado no prompt).
        } else {
          const domainList = topic.domain
            .split(/[,\s]+/)
            .map((d) => d.trim())
            .filter(Boolean)
            .slice(0, 5);
          chartData = domainList.map((d) => ({ name: d, value: getOrGenerateDomainData(d).monthlyVisits }));
          statsQuery = `${topic.theme} ${topic.domain}`;
          category = "Manual";
        }

        let statsContext: { snippets: string[]; sources: { title: string; url: string }[] } = { snippets: [], sources: [] };
        try {
          statsContext = await fetchRealStats(statsQuery);
        } catch (searchErr) {
          console.error("Falha na pesquisa Tavily, artigo seguirá sem estatísticas externas:", searchErr);
        }

        const angleInstruction =
          topic.type === "comparison" ? topic.angle.instruction :
          topic.type === "news" ? topic.news.instruction :
          `Escreva o artigo com foco no domínio "${topic.domain}" e na temática indicada pelo Admin: "${topic.theme}". Use os factos e estatísticas fornecidos para fundamentar o texto de forma natural.`;

        const chartSection =
          topic.type === "comparison"
            ? `Dados reais de popularidade de pesquisa (Google Trends, últimos 90 dias, escala 0-100): ${JSON.stringify(chartData)}`
            : topic.type === "manual"
            ? `Não inclua "chart_data" nem "chart_type" próprios — devolva ambos como null; o sistema já trata a exibição do domínio "${topic.domain}" automaticamente.`
            : `Não há dados de comparação de domínios pré-definidos para este artigo — é um artigo de notícia/contexto, não de comparação de tráfego. Só inclua "chart_data" e "chart_type" no JSON de resposta se a notícia mencionar claramente 1-5 domínios/marcas cujo tráfego/popularidade faça sentido ilustrar; caso contrário, devolva "chart_data": null e "chart_type": null.`;

        const prompt = `
Você é um analista sénior de mercado digital da TrafficScope, especialista em copywriting orientado a dados.
Escreva um artigo de blog em Português sobre tendências de tráfego web e comportamento de mercado.

${chartSection}

Factos e estatísticas reais publicadas recentemente sobre o tema (use-os para fundamentar o artigo,
parafraseando, NUNCA copiando texto literal):
${statsContext.snippets.map((s, i) => `[Fonte ${i + 1}] ${s}`).join("\n")}

ÂNGULO/TEMA OBRIGATÓRIO PARA ESTE ARTIGO:
${angleInstruction}
${topic.type === "manual" && topic.affiliateLink ? `\nEste artigo tem componente comercial. No corpo do texto, de forma natural e não forçada, integre uma recomendação relacionada ao tema (sem inserir links, URLs ou nomes de marcas patrocinadas no texto — isso é tratado à parte pelo sistema).` : ""}${topic.type === "comparison" ? "\nAVISO SOBRE ESCALA: antes de escolher o par de domínios em foco no artigo, avalie se ambos operam numa escala de mercado comparável (ambos globais, ou ambos regionais/de nicho semelhante). Se os dados mostrarem um player claramente global ao lado de um player claramente regional/de nicho menor, NÃO apresente isso como 'quem domina' ou uma disputa direta — em vez disso, explique a diferença de escala como contexto (ex: alcance geográfico diferente), e escolha um par mais equilibrado dentro do dataset para o confronto principal do artigo, se existir." : ""}

REGRAS PARA O TÍTULO (crítico para gerar cliques):
- ${topic.type === "comparison" ? 'Use um dos formatos: número + surpresa ("X cresceu 31% enquanto Y estagnou"), pergunta direta que o leitor quer responder, ou contraste chocante entre dois dados reais do dataset.' : "Use um gancho de curiosidade baseado no facto mais forte encontrado nas fontes: uma pergunta direta, um número concreto, ou uma afirmação que gere tensão."}
- Inclua sempre pelo menos um dado/número concreto vindo dos dados ou fontes fornecidas.
- Máximo 70 caracteres. Nunca prometa algo que o artigo não entrega.

REGRAS PARA O EXCERPT (aparece na listagem do blog, é a isca para o clique):
- 1-2 frases que criem uma lacuna de curiosidade (o leitor precisa de abrir o artigo para saber "porquê"
  ou "como"), sem revelar a resposta completa.
- Deve conter pelo menos um dado numérico específico.

REGRAS PARA O CONTEÚDO:
- Abre com um gancho nas primeiras 2 frases: um dado surpreendente ou contraintuitivo, antes de qualquer
  contexto genérico.
- Insere EXATAMENTE 2 marcadores de imagem no corpo do texto, em pontos que façam sentido visualmente
  (ex: depois de introduzir um conceito, antes de uma secção nova). Os marcadores são literalmente o texto
  {{IMG_1}} e {{IMG_2}}, cada um numa linha própria, sem mais nada à volta.
- Usa subtítulos que também gerem curiosidade, não só descritivos.
- Termina com uma secção final que aponte uma implicação prática ou pergunta em aberto para o leitor.
- Em UM único ponto do corpo do texto (não no título, não no excerpt, não na conclusão), insira uma
  referência natural e sutil ao tipo de análise que a TrafficScope permite fazer — por exemplo, mencionando
  de passagem que "monitorizar esse tipo de variação em tempo real" ou "cruzar esses dados com o próprio
  domínio de um negócio" é algo que ferramentas de inteligência competitiva tornam possível. NUNCA use
  linguagem de venda direta (nunca escreva "experimente", "assine", "clique aqui", "compre", nomes de
  planos ou preços). A menção deve soar como uma observação natural de analista, não como publicidade.
- 400-600 palavras, tom analítico mas envolvente — nunca sensacionalista ao ponto de distorcer os dados.

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "title": "título com gatilho de curiosidade, baseado em dado real",
  "excerpt": "1-2 frases com lacuna de curiosidade e um número concreto",
  "content": "corpo do artigo em markdown, 400-600 palavras, com gancho inicial forte, incluindo {{IMG_1}} e {{IMG_2}} em pontos estratégicos",
  "category": "${category}",
  "chart_type": "bar ou null",
  "chart_data": ${topic.type === "comparison" ? '[{"name": "dominio.com", "value": 12345}, ...]' : "[{...}] ou null"},
  "image_prompts": ["duas palavras-chave em inglês para a imagem 1, ex: online shopping laptop", "duas palavras-chave em inglês para a imagem 2, ex: global business growth"]
}`;

        const response = await groq.chat.completions.create({
          model: "openai/gpt-oss-120b",
          response_format: { type: "json_object" },
          reasoning_effort: "low",
          messages: [
            {
              role: "system",
              content: "Você escreve artigos de blog para a TrafficScope, uma plataforma de inteligência competitiva. Responda SEMPRE apenas com JSON válido, sem markdown fora do campo 'content', sem texto adicional.",
            },
            { role: "user", content: prompt },
          ],
        });

        const raw = response.choices[0]?.message?.content || "{}";
        const article = JSON.parse(raw);

        // NOVO: substitui os marcadores {{IMG_1}}/{{IMG_2}} por fotos reais do Unsplash
        try {
          article.content = await injectImagesIntoContent(article.content, article.image_prompts || []);
        } catch (imgErr) {
          console.error('Falha ao injetar imagens Unsplash, artigo segue sem fotos:', imgErr);
          article.content = article.content.replace(/\{\{IMG_\d+\}\}/g, '');
        }
if (topic.type === "manual") {
          article.chart_data = chartData; // favicon do domínio escolhido pelo Admin
          article.chart_type = null;
        }

        const slugBase = article.title
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        const slug = `${slugBase}-${Date.now()}`;

        const { data: inserted, error } = await supabaseAdmin
          .from("blog_posts")
          .insert({
            slug,
            title: article.title,
            excerpt: article.excerpt,
            content: article.content,
            category: article.category || category,
            chart_type: article.chart_type || null,
            chart_data: article.chart_data || null,
            sources: statsContext.sources.length > 0 ? statsContext.sources : null,
            topic_key: topic.topicKey,
            affiliate_link: topic.type === "manual" ? (topic.affiliateLink || null) : null,
          })
          .select()
          .single();

        if (error) throw error;

        // NOVO: notificação global — todos os utilizadores veem que saiu artigo novo
        await createNotification(
          null,
          'new_blog_post',
          'Novo artigo no blog',
          article.title,
          `/blog/${slug}`
        );

        return res.json({ success: true, post: inserted });
      } catch (err: any) {
        console.error("Erro ao gerar artigo do blog:", err);
        return res.status(500).json({ error: "Falha ao gerar artigo." });
      }
    });



    // ===== NOVO: Eliminar artigo do Blog (só o dono) =====
    app.delete("/api/blog/:slug", async (req, res) => {
      try {
        const user = await getUserFromRequest(req);
        if (!user || user.id !== OWNER_USER_ID) {
          return res.status(403).json({ error: "Acesso negado." });
        }

        const { slug } = req.params;
        const { error } = await supabaseAdmin
          .from("blog_posts")
          .delete()
          .eq("slug", slug);

        if (error) throw error;

        return res.json({ success: true });
      } catch (err: any) {
        console.error("Erro ao eliminar artigo do blog:", err);
        return res.status(500).json({ error: "Falha ao eliminar artigo." });
      }
    });
    
    // ===== NOVO: Geração individual de notícia (busca 1 + reescreve com IA) =====
app.post("/api/news/generate", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.id !== OWNER_USER_ID) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: "GROQ_API_KEY não configurada no servidor." });
    }

    const { categoryKey } = req.body as { categoryKey?: string };
    const category = categoryKey
      ? NEWS_CATEGORIES.find((c) => c.key === categoryKey)
      : NEWS_CATEGORIES[Math.floor(Math.random() * NEWS_CATEGORIES.length)];

    if (!category) {
      return res.status(400).json({ error: "Categoria inválida." });
    }

    // Busca notícias recentes já usadas (para evitar repetir)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingNews } = await supabaseAdmin
      .from("news_items")
      .select("headline")
      .gte("published_at", threeDaysAgo);
    const existingHeadlines = new Set((existingNews || []).map((n) => n.headline.trim().toLowerCase()));

    const articles = await fetchGNewsForCategory(category.query);
    const article = articles.find((a) => !existingHeadlines.has(a.title.trim().toLowerCase()));

    if (!article) {
      return res.status(404).json({ error: "Nenhuma notícia nova encontrada para esta categoria. Tenta novamente mais tarde ou escolhe outra categoria." });
    }

    const candidates = await findYoutubeCandidates(article.title);
    const videoId = await pickRelevantVideo(groq, candidates, article.title, article.description);

    // Reescreve a notícia com a IA — texto curto, factual, sem inventar dados
    const prompt = `
Você é um jornalista digital da TrafficScope, especializado em ligar notícias reais a impacto no tráfego web e comportamento digital.

Reescreva a notícia abaixo em Português, de forma curta e clara (150-250 palavras), parafraseando o conteúdo original (NUNCA copiando texto literal).

TÍTULO ORIGINAL: ${article.title}
DESCRIÇÃO ORIGINAL: ${article.description || ""}
CONTEÚDO DISPONÍVEL: ${article.content || ""}

Regras:
- Só reescreva esta notícia se ela tiver relevância internacional/global real (afeta múltiplos países, mercados globais, big tech, ou tendências mundiais). Se a notícia for essencialmente sobre política ou economia doméstica de um único país sem impacto internacional claro, responda APENAS com {"skip": true} e mais nada.
- Mantenha os factos exatamente como estão na fonte — não invente números, declarações ou detalhes que não estejam no material fornecido.
- Tom jornalístico, direto, sem sensacionalismo.
- Pode incluir, no máximo em uma frase, uma observação sobre a relevância desta notícia para tráfego/comportamento digital — só se fizer sentido natural, sem forçar.
- Não repita o título dentro do corpo do texto.

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "title": "título curto e claro (pode ajustar o original para maior clareza, mas mantendo os factos)",
  "summary": "1 frase de resumo/isca para a listagem",
  "content": "corpo do texto em markdown, 150-250 palavras"
}`;

    const response = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      response_format: { type: "json_object" },
      reasoning_effort: "low",
      messages: [
        {
          role: "system",
          content: "Você reescreve notícias reais para a TrafficScope de forma curta e factual. Responda SEMPRE apenas com JSON válido, sem texto adicional.",
        },
        { role: "user", content: prompt },
      ],
    });

    const raw = response.choices[0]?.message?.content || "{}";
    const rewritten = JSON.parse(raw);

    if (rewritten.skip) {
      console.log("⏭️ Notícia descartada por falta de relevância global:", article.title);
      return res.status(404).json({ error: "A notícia encontrada não tinha relevância global suficiente. Tenta novamente ou escolhe outra categoria." });
    }

    const slugBase = rewritten.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${slugBase}-${Date.now()}`;

    const { data: inserted, error } = await supabaseAdmin
      .from("news_items")
      .insert({
        slug,
        headline: rewritten.title,
        summary: rewritten.summary,
        content: rewritten.content,
        source_name: article.source?.name || "Fonte desconhecida",
        source_url: article.url,
        youtube_video_id: videoId,
        cover_image: article.image || null,
        category: category.label,
        published_at: article.publishedAt,
      })
      .select()
      .single();

    if (error) throw error;

    await createNotification(
      null,
      'new_blog_post',
      'Nova notícia publicada',
      rewritten.title,
      `/noticias/${slug}`
    );

    return res.json({ success: true, item: inserted });
  } catch (err: any) {
    console.error("Erro ao gerar notícia:", err);
    const isGNewsQuota = err?.message?.includes("GNews") && err?.message?.includes("403");
    const errorMessage = isGNewsQuota
      ? "Limite diário da GNews API atingido. Tenta novamente após as 00:00 UTC ou faz upgrade do plano."
      : "Falha ao gerar notícia.";
    return res.status(isGNewsQuota ? 429 : 500).json({ error: errorMessage });
  }
});

// ===== NOVO: Listagem pública de notícias =====
app.get("/api/news", async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("news_items")
      .select("*")
      .not("slug", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);

    if (error) throw error;

    return res.json({ success: true, items: data });
  } catch (err: any) {
    console.error("Erro ao listar notícias:", err);
    return res.status(500).json({ error: "Falha ao listar notícias." });
  }
});

// ===== NOVO: Detalhe público de uma notícia =====
app.get("/api/news/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const { data, error } = await supabaseAdmin
      .from("news_items")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) throw error;

    return res.json({ success: true, item: data });
  } catch (err: any) {
    console.error("Erro ao buscar notícia:", err);
    return res.status(404).json({ error: "Notícia não encontrada." });
  }
});

// ===== NOVO: Eliminar item de notícia (só o dono) =====
app.delete("/api/news/:id", async (req, res) => {
  try {
    const user = await getUserFromRequest(req);
    if (!user || user.id !== OWNER_USER_ID) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const { id } = req.params;
    const { error } = await supabaseAdmin.from("news_items").delete().eq("id", id);
    if (error) throw error;

    return res.json({ success: true });
  } catch (err: any) {
    console.error("Erro ao eliminar item de notícia:", err);
    return res.status(500).json({ error: "Falha ao eliminar item." });
  }
});




  // ===== NOVO: Tradução sob demanda dos artigos do Blog (com cache) =====
  // full=false (padrão): traduz só título+excerto, para a LISTAGEM (barato, um pouco por post).
  // full=true: traduz também o corpo completo, para a PÁGINA DO ARTIGO (mais caro, um post de cada vez).
  app.post("/api/blog/translate", async (req, res) => {
    try {
      const { slugs, language, full } = req.body as { slugs: string[]; language: string; full?: boolean };

      if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
        return res.status(400).json({ error: "slugs é obrigatório." });
      }

      // PT é o idioma original dos artigos — nunca precisa de tradução
      if (!language || language === 'pt') {
        return res.json({ success: true, translations: {} });
      }

      if (!LANGUAGE_NAMES[language]) {
        return res.status(400).json({ error: "Idioma não suportado." });
      }

      const { data: posts, error: postsErr } = await supabaseAdmin
        .from("blog_posts")
        .select("id, slug, title, excerpt, content")
        .in("slug", slugs);

      if (postsErr) throw postsErr;
      if (!posts || posts.length === 0) {
        return res.json({ success: true, translations: {} });
      }

      const postIds = posts.map((p: any) => p.id);

      const { data: cached, error: cacheErr } = await supabaseAdmin
        .from("blog_post_translations")
        .select("post_id, title, excerpt, content")
        .eq("language", language)
        .in("post_id", postIds);

      if (cacheErr) throw cacheErr;

      const cachedByPostId = new Map((cached || []).map((c) => [c.post_id, c]));
      const translations: Record<string, { title: string; excerpt: string; content?: string }> = {};

      // Um post só é considerado "já traduzido" para este pedido se:
      // - pedido leve (listagem): já existe qualquer cache (title/excerpt bastam)
      // - pedido completo (artigo): já existe cache E esse cache já tem content preenchido
      const toTranslate = posts.filter((p: any) => {
        const hit = cachedByPostId.get(p.id);
        if (hit && (!full || hit.content)) {
          translations[p.slug] = full
            ? { title: hit.title, excerpt: hit.excerpt, content: hit.content }
            : { title: hit.title, excerpt: hit.excerpt };
          return false;
        }
        return true;
      });

      if (toTranslate.length > 0 && process.env.GROQ_API_KEY) {
        const languageName = getLanguageName(language);

        // Processa em série (não em paralelo) para não estourar o limite de tokens/minuto da Groq
        for (const post of toTranslate) {
          try {
            const prompt = full
              ? `Traduza o seguinte artigo de blog do Português para ${languageName}.

REGRAS CRÍTICAS:
- Preserve TODA a formatação markdown exatamente como está (títulos com #, listas, negrito, links, imagens ![alt](url) e créditos de fotos).
- NUNCA traduza URLs, nomes de domínios (ex: amazon.com) ou nomes próprios de marcas.
- Traduza o texto legível (título, excerto, corpo, incluindo o texto alternativo das imagens), mantendo os nomes próprios de fotógrafos e fontes como estão.
- Mantenha o mesmo tom analítico e a mesma estrutura de parágrafos.

TÍTULO ORIGINAL:
${post.title}

EXCERTO ORIGINAL:
${post.excerpt}

CONTEÚDO ORIGINAL (markdown):
${post.content}

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "title": "título traduzido",
  "excerpt": "excerto traduzido",
  "content": "conteúdo traduzido em markdown, preservando toda a formatação"
}`
              : `Traduza o TÍTULO e o EXCERTO do seguinte artigo de blog do Português para ${languageName}.

REGRAS CRÍTICAS:
- NUNCA traduza URLs, nomes de domínios (ex: amazon.com) ou nomes próprios de marcas.
- Mantenha o mesmo tom analítico e o mesmo gancho de curiosidade do original.

TÍTULO ORIGINAL:
${post.title}

EXCERTO ORIGINAL:
${post.excerpt}

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "title": "título traduzido",
  "excerpt": "excerto traduzido"
}`;

            const response = await groqCallWithRetry(() =>
              groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                response_format: { type: "json_object" },
                reasoning_effort: "low",
                messages: [
                  {
                    role: "system",
                    content: `Você é um tradutor profissional especializado em conteúdo de marketing digital. Traduza fielmente para ${languageName}, preservando markdown, links e nomes próprios. Responda SEMPRE apenas com JSON válido.`,
                  },
                  { role: "user", content: prompt },
                ],
              })
            );

            const raw = response.choices[0]?.message?.content || "{}";
            const parsedTranslation = JSON.parse(raw);

            const isValid = full
              ? parsedTranslation.title && parsedTranslation.excerpt && parsedTranslation.content
              : parsedTranslation.title && parsedTranslation.excerpt;

            if (isValid) {
              translations[post.slug] = full
                ? { title: parsedTranslation.title, excerpt: parsedTranslation.excerpt, content: parsedTranslation.content }
                : { title: parsedTranslation.title, excerpt: parsedTranslation.excerpt };

              await supabaseAdmin.from("blog_post_translations").upsert(
                {
                  post_id: post.id,
                  language,
                  title: parsedTranslation.title,
                  excerpt: parsedTranslation.excerpt,
                  content: full ? parsedTranslation.content : null,
                },
                { onConflict: "post_id,language" }
              );
            }
          } catch (translateErr) {
            console.error(`Falha ao traduzir post ${post.slug} para ${language}:`, translateErr);
            // Se falhar, o front simplesmente recebe o original em PT como fallback
          }
        }
      }

      return res.json({ success: true, translations });
    } catch (err: any) {
      console.error("Erro ao traduzir artigos do blog:", err);
      return res.status(500).json({ error: "Falha ao traduzir artigos." });
    }
  });

const SITE_URL = "https://trafficscope.onrender.com";

app.get("/sitemap.xml", async (req, res) => {
  try {
    const staticUrls: { loc: string; changefreq: string; priority: string; lastmod?: string }[] = [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/blog", changefreq: "weekly", priority: "0.8" },
      { loc: "/sobre", changefreq: "monthly", priority: "0.6" },
      { loc: "/faq", changefreq: "monthly", priority: "0.6" },
      { loc: "/politica-privacidade", changefreq: "yearly", priority: "0.3" },
      { loc: "/termos-de-uso", changefreq: "yearly", priority: "0.3" },
      { loc: "/suporte", changefreq: "monthly", priority: "0.5" },
    ];

    const { data: posts, error } = await supabaseAdmin
      .from("blog_posts")
      .select("slug, created_at")
      .eq("published", true)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const postUrls = (posts || []).map((p) => ({
      loc: `/blog/${p.slug}`,
      changefreq: "monthly",
      priority: "0.7",
      lastmod: new Date(p.created_at).toISOString().split("T")[0],
    }));

    const allUrls = [...staticUrls, ...postUrls];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (u) => `  <url>
    <loc>${SITE_URL}${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ""}
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    res.set("Content-Type", "application/xml");
    return res.send(xml);
  } catch (err) {
    console.error("Erro ao gerar sitemap.xml:", err);
    return res.status(500).send("Erro ao gerar sitemap.");
  }
});


  // Vite middleware integration for Development vs Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');

    console.log('CWD:', process.cwd());
    console.log('distPath:', distPath);
    console.log('favicon existe?', require('fs').existsSync(path.join(distPath, 'favicon.svg')));

    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[TrafficScope Server] Rodando na porta ${PORT}`);
    console.log(`➜  Local: http://localhost:${PORT}/`);
  });
}

startServer();