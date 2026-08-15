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
import googleTrends from 'google-trends-api';
import fs from 'fs';

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
const NICHE_POOLS: { category: string; domains: string[] }[] = [
  { category: "E-commerce Global", domains: ["amazon.com", "ebay.com", "shopee.com", "aliexpress.com", "temu.com"] },
  { category: "Streaming & Entretenimento", domains: ["netflix.com", "disneyplus.com", "primevideo.com", "spotify.com", "hbomax.com"] },
  { category: "Fintech & Pagamentos", domains: ["paypal.com", "stripe.com", "revolut.com", "klarna.com", "wise.com"] },
  { category: "Redes Sociais", domains: ["instagram.com", "tiktok.com", "x.com", "linkedin.com", "snapchat.com"] },
  { category: "Viagens & Turismo", domains: ["booking.com", "airbnb.com", "expedia.com", "tripadvisor.com", "skyscanner.com"] },
  { category: "Entrega & Mobilidade", domains: ["ubereats.com", "doordash.com", "glovoapp.com", "ifood.com.br", "uber.com"] },
  { category: "Produtividade & SaaS", domains: ["notion.so", "slack.com", "zoom.us", "canva.com", "figma.com"] },
];

const NARRATIVE_ANGLES = [
  {
    key: "ecosystem_analysis",
    instruction: "Analise o ecossistema digital do setor representado pelos domínios do dataset. Em vez de confrontar marcas, examine como diferentes modelos de negócio (marketplace, SaaS, conteúdo, etc.) coexistem e respondem a estímulos de mercado distintos. Use os dados de popularidade de pesquisa apenas para ilustrar padrões de comportamento do consumidor — nunca para declarar um 'vencedor'. O foco é a arquitetura do mercado, não o ranking das empresas.",
  },
  {
    key: "case_study",
    instruction: "Foque num ÚNICO domínio do dataset que apresente o dado mais notável (maior crescimento, maior queda, ou maior volume). Trate-o como um estudo de caso de SEO/estratégia digital: o que a trajetória de pesquisa revela sobre decisões de produto, investimento em conteúdo ou mudanças de algoritmo. O domínio é o protagonista absoluto; os restantes servem apenas como contexto de escala em UMA frase. Este artigo NÃO é sobre 'quem lidera' — é sobre entender uma trajetória específica.",
  },
  {
    key: "sector_trend",
    instruction: "Foque no comportamento coletivo do consumidor ou do mercado que os dados ilustram. Descreva tendências de busca como sintomas de mudanças culturais, económicas ou tecnológicas mais amplas. Use 2-3 domínios apenas como exemplos ilustrativos da tendência — nunca os coloque em confronto direto ou implique que um 'está a ganhar' ao outro.",
  },
  {
    key: "search_behavior",
    instruction: "Foque na psicologia e nos padrões de comportamento de pesquisa revelados pelos dados. O que as flutuações de interesse de pesquisa dizem sobre as necessidades, dúvidas ou intenções dos utilizadores? Analise os dados como um antropólogo digital, não como um comentador desportivo. Não atribua valor moral (bom/ruim, vence/perde) às variações de popularidade.",
  },
  {
    key: "algorithm_impact",
    instruction: "Foque no impacto presumível de atualizações algorítmicas, mudanças regulatórias ou eventos tecnológicos sobre o setor. Como os dados de pesquisa refletem (ou não) grandes mudanças no ecossistema digital? Baseie a análise exclusivamente em dados e factos do presente (ver DATA ATUAL no topo do prompt) — nunca trate projeções, relatórios ou artigos antigos das fontes como se fossem verdades já consolidadas do ano corrente.",
  },
  {
    key: "listicle",
    instruction: "Estruture o artigo como uma lista analítica (ex: '3 padrões de busca que revelam a maturidade do setor'), usando os domínios do dataset como exemplos pontuais de cada padrão — não como um ranking de desempenho.",
  },
  {
    key: "regional",
    instruction: "Foque na perspetiva geográfica dos dados de pesquisa. Como diferentes mercados respondem a estes produtos/serviços? Há padrões regionais que revelam oportunidades de localização SEO ou gaps de conteúdo? Só explore esta vertente se os dados tiverem base geográfica real.",
  },
  {
    key: "mythbusting",
    instruction: "Desminta uma suposição comum sobre SEO, tráfego ou comportamento digital no setor, usando os dados reais para mostrar que a realidade é diferente do senso comum. O foco é educar o leitor, não confrontar marcas.",
  },
  {
    key: "content_strategy",
    instruction: "Analise o que os padrões de pesquisa sugerem sobre estratégias de conteúdo e SEO no setor. Que tipo de intenção de busca (informacional, transacional, navegacional) parece predominar? Como isso deveria informar a criação de conteúdo de quem opera neste mercado? Use os domínios como casos de ilustração, nunca como adversários.",
  },
];

// ===== NOVO: Pool de temas de notícia/contexto para o Blog =====
const NEWS_TOPICS: { category: string; query: string; instruction: string }[] = [
  {
    category: "Tecnologia",
    query: "notícias tecnologia inteligência artificial lançamentos 2026",
    instruction: "Escolha UMA notícia recente e concreta sobre tecnologia/IA a partir dos factos fornecidos. Explique o que aconteceu e o seu impacto real no setor (adoção, investimento, competição, produto, regulação). Só ligue isso a tráfego web, busca ou comportamento digital SE essa ligação for natural e específica ao caso — caso contrário, mantém o foco inteiramente no impacto de mercado/negócio.",
  },
  {
    category: "Mercados Financeiros",
    query: "notícias mercados financeiros bolsa big tech resultados 2026",
    instruction: "Escolha UM evento financeiro recente (resultados trimestrais, IPO, fusão, queda/alta de ações) a partir dos factos fornecidos. Antes de ligar o evento a tráfego, avalia se a empresa é B2C (venda direta ao consumidor, onde interesse de busca é um proxy razoável) ou B2B/infraestrutura (venda a empresas — cloud computing, ferramentas enterprise, etc.). Para empresas B2B/infraestrutura, NUNCA afirmes que a receita sobe por causa de mais pesquisas/tráfego de utilizadores comuns — explica o crescimento em termos do consumo real do negócio (contratos fechados, chamadas de API, migração de servidores, processamento de dados), e só depois, se fizer sentido, menciona tráfego digital como um sinal indireto que ferramentas de inteligência competitiva conseguem monitorizar. Para empresas B2C, podes ligar diretamente o evento a interesse de busca/tráfego online.",
  },
  {
    category: "Geopolítica & Economia Global",
    query: "geopolítica economia global tarifas sanções comércio internacional 2026",
    instruction: "Escolha UM desenvolvimento geopolítico recente a partir dos factos fornecidos. Explique as consequências práticas para a economia global, para setores e empresas afetadas. Só mencione efeitos em comércio digital, e-commerce cross-border ou tráfego web SE houver uma ligação direta e plausível nos factos — caso contrário, foca-te inteiramente no impacto económico/geopolítico, sem inventar uma ponte digital.",
  },
  {
    category: "Startups & Inovação em África",
    query: "startups inovação tecnologia África funding 2026",
    instruction: "Escolha UMA notícia recente sobre uma startup ou iniciativa de inovação africana a partir dos factos fornecidos. Explique o que a torna relevante — modelo de negócio, investimento captado, problema real que resolve. Só menciona potencial de tráfego/popularidade digital se a startup for de consumo digital direto; para startups B2B, fintech de infraestrutura, hardware, etc., mantém o foco no impacto de negócio/mercado.",
  },
  {
    category: "China-América & Comércio Global",
    query: "relação China Estados Unidos comércio tecnologia 2026",
    instruction: "Escolha UM desenvolvimento recente na relação China-EUA (tecnologia, comércio, tarifas) a partir dos factos fornecidos. Explique o impacto real nas empresas, cadeias de fornecimento ou mercados dos dois países. Só ligue isso a plataformas digitais, e-commerce ou tráfego SE a notícia tiver essa natureza — caso contrário, mantém a análise no plano económico/comercial.",
  },
  {
    category: "Criptomoedas",
    query: "criptomoedas bitcoin mercado cripto notícias 2026",
    instruction: "Escolha UM movimento recente do mercado cripto a partir dos factos fornecidos. Explique o impacto direto no mercado (preço, adoção, regulação, confiança de investidores). Só menciona picos/quedas de interesse de busca/tráfego se isso for um ângulo genuinamente natural da notícia, nunca uma conclusão forçada.",
  },
  {
    category: "Moda & Arte",
    query: "moda arte tendências lançamentos colaborações 2026",
    instruction: "Escolha UMA tendência ou lançamento recente em moda/arte a partir dos factos fornecidos. Explique a relevância cultural/comercial do evento para a marca ou o setor. Só menciona impacto em busca/tráfego digital se for um ângulo genuinamente interessante para esta notícia específica — não é obrigatório em todos os artigos desta categoria.",
  },
];

// ===== NOVO: Categorias para a área de Notícias (feed de manchetes + vídeo) =====
const NEWS_CATEGORIES: { key: string; label: string; query: string }[] = [
  {
    key: "tech-ia",
    label: "Tecnologia & IA",
    query: '"artificial intelligence" OR ChatGPT OR "AI regulation"',
  },
  {
    key: "big-tech",
    label: "Big Tech & Plataformas",
    query: 'Google OR Meta OR "Amazon Web Services" OR TikTok OR Microsoft',
  },
  {
    key: "seo-marketing",
    label: "SEO & Marketing Digital",
    query: 'SEO OR "digital marketing" OR "Google algorithm"',
  },
  {
    key: "ecommerce",
    label: "E-commerce & Retalho Online",
    query: 'ecommerce OR "online retail" OR "online shopping trends"',
  },
  {
    key: "mercados-cripto",
    label: "Mercados Financeiros & Cripto",
    query: 'bitcoin OR cryptocurrency OR "stock market"',
  },
  {
    key: "startups-africa",
    label: "Startups & Inovação em África",
    query: '"African startup" OR "Africa tech" OR "African fintech"',
  },
  {
    key: "geopolitica-comercio",
    label: "Geopolítica & Comércio Global",
    query: 'tariffs OR "global trade" OR sanctions OR "trade war"',
  },
  {
    key: "privacidade-regulacao",
    label: "Privacidade & Regulação Digital",
    query: '"data privacy" OR "AI regulation" OR GDPR',
  },
];


// ===== Mapa de palavras-chave para validação de relevância de fontes =====
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  // Nichos de comparação
  "E-commerce Global": ["ecommerce", "comércio", "loja", "venda", "online", "retail", "marketplace", "shopping", "consumidor", "digital"],
  "Streaming & Entretenimento": ["streaming", "vídeo", "música", "entretenimento", "plataforma", "conteúdo", "audiovisual", "série", "filme"],
  "Fintech & Pagamentos": ["pagamento", "fintech", "financeiro", "banco", "digital", "carteira", "transação", "drex", "pix", "monetária", "crédito", "débito", "transferência"],
  "Redes Sociais": ["social", "rede", "plataforma", "conteúdo", "comunidade", "engajamento", "usuário", "digital"],
  "Viagens & Turismo": ["viagem", "turismo", "destino", "hospedagem", "turista", "hotel", "aéreo", "passagem", "experiência"],
  "Entrega & Mobilidade": ["entrega", "mobilidade", "transporte", "logística", "delivery", "frete", "veículo", "app"],
  "Produtividade & SaaS": ["produtividade", "saas", "software", "ferramenta", "workflow", "colaboração", "automação", "cloud"],
  // Categorias de notícia
  "Tecnologia": ["tecnologia", "tech", "inteligência artificial", "ia", "ai", "inovação", "digital", "software", "hardware", "computação", "automação", "robótica"],
  "Mercados Financeiros": ["mercado", "financeiro", "bolsa", "ação", "investimento", "economia", "banco", "fintech", "receita", "lucro", "ipo", "fusão", "aquisição"],
  "Geopolítica & Economia Global": ["geopolítica", "economia", "global", "comércio", "tarifa", "sanção", "trade", "internacional", "relação", "diplomacia", "conflito"],
  "Startups & Inovação em África": ["startup", "inovação", "áfrica", "africa", "funding", "investimento", "tecnologia", "empresa", "negócio", "africano"],
  "China-América & Comércio Global": ["china", "estados unidos", "eua", "usa", "comércio", "trade", "tecnologia", "tarifa", "relação", "global", "supply chain"],
  "Criptomoedas": ["cripto", "bitcoin", "ethereum", "blockchain", "moeda digital", "defi", "nft", "mineração", "wallet", "exchange", "regulação"],
  "Moda & Arte": ["moda", "arte", "design", "tendência", "estilo", "criativo", "cultural", "luxo", "coleção", "artista", "galeria"],
};

function isSourceRelevant(
  source: { title: string; url: string; content?: string },
  category: string
): boolean {
  const keywords = CATEGORY_KEYWORDS[category];
  if (!keywords || keywords.length === 0) return true;
  const text = `${source.title} ${source.url} ${source.content || ""}`.toLowerCase();
  const matches = keywords.filter((k) => text.includes(k.toLowerCase()));
  return matches.length >= 1;
}

function filterRelevantStats(
  stats: { snippets: string[]; sources: { title: string; url: string }[] },
  category: string,
  customKeywords?: string[]
): { snippets: string[]; sources: { title: string; url: string }[] } {
  const relevantSnippets: string[] = [];
  const relevantSources: { title: string; url: string }[] = [];
  const keywords = customKeywords || CATEGORY_KEYWORDS[category];

  for (let i = 0; i < stats.snippets.length; i++) {
    const source = stats.sources[i];
    const snippet = stats.snippets[i];
    if (!source) continue;

    // Se não há keywords definidas, aceita tudo (fallback seguro)
    if (!keywords || keywords.length === 0) {
      relevantSnippets.push(snippet);
      relevantSources.push(source);
      continue;
    }

    const text = `${source.title} ${source.url} ${snippet || ""}`.toLowerCase();
    const matches = keywords.filter((k) => text.includes(k.toLowerCase()));

    if (matches.length >= 1) {
      relevantSnippets.push(snippet);
      relevantSources.push(source);
    } else {
      console.warn(`⛔ Fonte irrelevante descartada [${category}]: "${source.title}" (${source.url})`);
    }
  }
  return { snippets: relevantSnippets, sources: relevantSources };
}


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
      model: "openai/gpt-oss-120b",
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

  // Notícias entram com peso x10 para reduzir frequência de artigos baseados em datasets de domínios
  // e privilegiar conteúdo de contexto, análise de mercado e notícias reais
  const allCombos: Topic[] = [...comparisonCombos, ...Array(10).fill(newsCombos).flat()];

  const unused = allCombos.filter((c) => !recentKeys.has(c.topicKey));
  const pool = unused.length > 0 ? unused : allCombos; // se já usámos tudo, liberta o filtro

  return pool[Math.floor(Math.random() * pool.length)];
}

// Cache simples em memória (evita pagar de novo pelo mesmo domínio em pouco tempo)
const apifyCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 horas

// Guarda os últimos IDs de foto do Unsplash usados, para evitar repetir a mesma imagem entre artigos
const recentlyUsedUnsplashIds: string[] = [];
const UNSPLASH_MEMORY_SIZE = 30;

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
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&orientation=landscape`,
    { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
  );
  if (!res.ok) return null;

  const data = await res.json();
  const results = data.results || [];
  if (results.length === 0) return null;

  // Prefere uma foto que ainda não tenha sido usada recentemente noutro artigo
  const photo = results.find((p: any) => !recentlyUsedUnsplashIds.includes(p.id)) || results[0];

  recentlyUsedUnsplashIds.push(photo.id);
  if (recentlyUsedUnsplashIds.length > UNSPLASH_MEMORY_SIZE) recentlyUsedUnsplashIds.shift();

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
  | 'new_blog_post'
  | 'new_news_item';

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

      const prompt = `Você é um analista de dados. Com base apenas nos números fornecidos abaixo, descreva o que os dados mostram e o que não mostram.

Dados do website "${domain}":
- Visitas Mensais: ${metrics.monthlyVisits}
- Crescimento: ${metrics.growthRate}%
- Tempo Médio: ${metrics.avgVisitDuration}
- Taxa de Rejeição: ${metrics.bounceRate}%
- Fontes de Tráfego: ${JSON.stringify(metrics.trafficSources)}
- Top Países: ${JSON.stringify(metrics.countryTraffic)}
${dataNotice}

REGRAS DE RIGOR:
1. Descreva APENAS o que é visível nos dados. NÃO invente causas, eventos de mercado, campanhas de marketing, mudanças de algoritmo ou factos externos que "expliquem" os números.
2. NUNCA apresente uma diferença de percentagem entre canais ou países como prova de superioridade, risco ou "ameaça competitiva" — isso é inferência não sustentada.
3. Se não souber o contexto do negócio (tipo de site, sector, modelo de receita), não assuma. Use linguagem como "sugere que", "pode indicar" ou "é consistente com" em vez de afirmações definitivas.
4. NÃO faça previsões numéricas (não invente números de visitas futuras). Se quiser projetar tendência, use linguagem qualitativa: "tendência de crescimento", "estagnação aparente", "aceleração".
5. NÃO associe métricas de tráfego a impacto físico real (armazéns, frotas, lojas) — são comportamentos de atenção online, não compras ou logística.

ESTRUTURA DA RESPOSTA — JSON apenas, sem texto antes ou depois:
{
  "summary": "2-3 frases descrevendo estritamente o que os dados revelam (distribuição de fontes, geografia, padrões de engajamento visíveis). Não interprete além do óbvio.",
  "observedPatterns": ["padrão 1 visível nos dados", "padrão 2 visível nos dados"],
  "limitations": ["limitação 1 do dataset — ex: não sabemos a qualidade do tráfego, não temos dados de conversão", "limitação 2 — ex: crescimento percentual sem base absoluta pode ser enganador"],
  "possibleImplications": ["implicação 1, formulada como hipótese (ex: 'Se o site depende de pesquisa orgânica, a concentração em X canal pode ser ponto de atenção')", "implicação 2 como hipótese"],
  "recommendations": ["recomendação 1 de análise posterior — ex: 'cruzar com taxa de conversão'", "recomendação 2 — ex: 'verificar se o tempo médio reflete engajamento real ou problemas de carregamento'"]
}`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content: `Você é o assistente executivo de Inteligência Competitiva da plataforma TrafficScope. Responda em ${languageName} com tom profissional, preciso e acionável. Responda SEMPRE apenas com JSON válido, sem texto adicional, sem markdown dentro dos valores de texto (nada de tabelas, pipes, asteriscos ou cabeçalhos dentro das strings).${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`
          },
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
            content: `Responda sempre em ${languageName}. Você é o Copilot de Inteligência Competitiva da TrafficScope. Responda em texto corrido, natural, como numa conversa de chat — nem telegráfico nem um ensaio. Como referência, entre 3 a 6 frases costuma ser o ponto certo, mas ajuste ao que a pergunta pede: uma dúvida simples merece resposta curta, um pedido que peça mais detalhe ou passos merece uma resposta um pouco mais desenvolvida. Nunca recuse ou diga que não consegue responder só por causa do tamanho pedido — nesse caso, dê a versão mais completa e útil que conseguir dentro de um chat, sem se preocupar em bater um número exato de linhas. Termine sempre as frases por completo, nunca corte uma ideia a meio. NUNCA use tabelas markdown, símbolos de pipe (|), cabeçalhos (#), listas numeradas ou com marcadores, nem asteriscos para negrito.${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`
          },
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
      let topic: Topic = manualDomain && manualTheme
        ? { type: "manual", domain: manualDomain, theme: manualTheme, affiliateLink, topicKey: `manual::${manualDomain}::${Date.now()}` }
        : await pickUnusedTopic();

      let chartData: { name: string; value: number }[] | null = null;
      let manualKeywords: string[] | undefined = undefined; // só preenchido para artigos manuais
      let chartDataIsRealTrends = false;
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
          chartDataIsRealTrends = true;
        } catch (trendsErr) {
          console.error("Falha no Google Trends, a usar dados de teste como fallback:", trendsErr);
          chartData = referenceDomains.map((d) => {
            const m = getOrGenerateDomainData(d);
            return { name: d, value: m.monthlyVisits };
          });
        }
        const domainKeywords = referenceDomains.map((d) => d.split(".")[0]).join(" OR ");
        statsQuery = `${topic.niche.category} ${domainKeywords} tendências inovação mercado 2026`;
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
        // Keywords personalizadas extraídas do domínio e tema para filtragem
        manualKeywords = [
          ...topic.domain.split(/[.,\s]+/).filter(Boolean),
          ...topic.theme.split(/\s+/).filter(Boolean),
        ].map((k) => k.toLowerCase());
      }

      let statsContext: { snippets: string[]; sources: { title: string; url: string }[] } = { snippets: [], sources: [] };
      try {
        const rawStats = await fetchRealStats(statsQuery);
        statsContext = filterRelevantStats(rawStats, category, topic.type === "manual" ? manualKeywords : undefined);
        if (statsContext.snippets.length < rawStats.snippets.length) {
          console.warn(`🧹 Filtragem: ${rawStats.snippets.length - statsContext.snippets.length} fonte(s) irrelevante(s) removida(s) para "${category}".`);
        }
      } catch (searchErr) {
        console.error("Falha na pesquisa Tavily, artigo seguirá sem estatísticas externas:", searchErr);
      }

      // NOVO: se for artigo de notícia e a Tavily trouxer resultados fracos/insuficientes,
      // tenta automaticamente outras categorias antes de forçar o artigo com material pobre
      // (evita o "ensaio genérico sem facto concreto" que vimos no artigo de IA-como-padrão).
      if (topic.type === "news") {
        const MIN_SNIPPETS = 2;
        const triedCategories = new Set<string>([topic.news.category]);
        let attempts = 0;
        const MAX_ATTEMPTS = 3;

        while (statsContext.snippets.length < MIN_SNIPPETS && attempts < MAX_ATTEMPTS) {
          attempts++;
          const alternatives = NEWS_TOPICS.filter((n) => !triedCategories.has(n.category));
          if (alternatives.length === 0) break;

          const nextNews = alternatives[Math.floor(Math.random() * alternatives.length)];
          triedCategories.add(nextNews.category);

          console.warn(
            `Tavily devolveu apenas ${statsContext.snippets.length} snippet(s) para "${topic.news.category}", a tentar categoria alternativa: "${nextNews.category}" (tentativa ${attempts}/${MAX_ATTEMPTS})`
          );

          try {
            const altContext = await fetchRealStats(nextNews.query);
            const filteredAlt = filterRelevantStats(altContext, nextNews.category);
            if (filteredAlt.snippets.length >= MIN_SNIPPETS) {
              statsContext = filteredAlt;
              (topic as NewsTopic).news = nextNews;
              topic.topicKey = `news::${nextNews.category}`;
              statsQuery = nextNews.query;
              category = nextNews.category;
              break;
            }
          } catch (retryErr) {
            console.error(`Falha na pesquisa Tavily para categoria alternativa "${nextNews.category}":`, retryErr);
          }
        }

        if (statsContext.snippets.length < MIN_SNIPPETS) {
          console.warn(
            `Nenhuma categoria alternativa trouxe resultados suficientes após ${attempts} tentativa(s); artigo seguirá com material limitado (${statsContext.snippets.length} snippet(s)) para "${topic.news.category}".`
          );
        }
      }

      const angleInstruction =
        topic.type === "comparison" ? topic.angle.instruction :
        topic.type === "news" ? topic.news.instruction :
        `Escreva o artigo com foco no domínio "${topic.domain}" e na temática indicada pelo Admin: "${topic.theme}". Use os factos e estatísticas fornecidos para fundamentar o texto de forma natural.`;

      const chartSection =
        topic.type === "comparison"
          ? chartDataIsRealTrends
            ? `Padrão de interesse de pesquisa relativo (Google Trends, últimos 90 dias, escala 0-100): ${JSON.stringify(chartData)}. ESTES DADOS MEDEM ATENÇÃO DE PESQUISA, NÃO DESEMPENHO EMPRESARIAL. Use-os para ilustrar como o interesse do consumidor flutua entre diferentes modelos de negócio no setor. NUNCA os use para declarar que um domínio "vence" outro, "domina" ou "supera" — são padrões de atenção pública, não placares de competição.`
            : `O Google Trends não está disponível. Os valores abaixo são estimativas internas sem validade estatística: ${JSON.stringify(chartData)}. NÃO cite estes números no título, excerpt ou corpo do artigo. Escreva em tom qualitativo sobre o setor, sem estatística de comparação.`
          : topic.type === "manual"
          ? `Não inclua "chart_data" nem "chart_type" próprios — devolva ambos como null; o sistema já trata a exibição do domínio "${topic.domain}" automaticamente.`
          : `Não há dados de comparação de domínios pré-definidos para este artigo — é um artigo de notícia/contexto, não de comparação de tráfego. Só inclua "chart_data" e "chart_type" no JSON de resposta se a notícia mencionar claramente 1-5 domínios/marcas cujo padrão de busca seja relevante ilustrar; caso contrário, devolva "chart_data": null e "chart_type": null.`;

      const prompt = `Você é um analista de mercado. Escreva um artigo de blog em Português sobre o tema fornecido, com base apenas nos factos abaixo.

DATA ATUAL: ${new Date().toLocaleDateString('pt-PT', { year: 'numeric', month: 'long', day: 'numeric' })}. Use esta data como referência de "presente". Dados de anos anteriores são históricos.

${chartSection}

DADOS E FONTES (use apenas estes):
${statsContext.snippets.map((s, i) => `[Fonte ${i + 1}] ${s}`).join("\n")}

REGRAS DE RIGOR:
1. Só cite números, percentagens ou estatísticas se estiverem literalmente nas fontes acima ou no chartData. Se não tiver um número exacto, use linguagem qualitativa (ex: "aumenta", "estabiliza", "desacelera").
2. Só atribua uma afirmação a "[Fonte N]" se essa afirmação estiver literalmente no texto dessa fonte. Não use conhecimento geral e etiquete-o como fonte. Se souber algo que não está nas fontes, mencione-o sem atribuição ou omita.
3. Conte quantas fontes existem acima. Se houver 2 snippets, NUNMA cite "Fonte 3" ou superior. Se houver 0 snippets, NUNCA cite nenhuma fonte.
4. Não invente nomes de produtos futuros, lançamentos não confirmados, declarações de CEOs ou dados de mercado. Se algo não estiver confirmado nas fontes, use termos genéricos.
5. Não confunda pesquisa online com impacto físico real (armazéns, frotas, servidores). Pesquisa é comportamento de atenção, não causa logística.

TOM E ÂNGULO:
- Analítico, maduro, educativo. Sem sensacionalismo, sem "guerras" entre marcas, sem ranking de vencedores/perdedores.
- Não estruture como duelo ou confronto direto, mesmo em comparações. Descreva coexistentes num ecossistema.
- O ângulo natural do artigo pode ser negócio, investimento, produto, regulação, geopolítica ou cultura. NÃO force conexão com tráfego web, SEO ou cliques se não for genuína.
- Se o tema não tiver relação natural com comportamento digital, o artigo fica noutro plano. Não invente ponte digital.
- Abra com uma observação analítica forte nas primeiras 2 frases.
- Termine com uma implicação estratégica para profissionais de mercado, não com pergunta de "quem vai vencer".
- Não adicione disclaimers sobre o próprio artigo.

ESTRUTURA:
- 400-600 palavras.
- Use subtítulos que provoquem reflexão.
- Insira EXATAMENTE 2 marcadores de imagem: {{IMG_1}} e {{IMG_2}}, cada um numa linha própria, em pontos visuais estratégicos.
- Se fizer sentido natural, pode incluir num parágrafo existente uma menção sutil à TrafficScope como ferramenta de monitorização de tendências — integrada ao raciocínio, sem subtítulo dedicado, sem linguagem de venda ("experimente", "assine"). Se não encaixar naturalmente, omita.

TÍTULO E EXCERPT:
- Título: analítico, sem "vs", "quem domina", "guerra". Números só se vierem das fontes/chartData.
- Excerpt: 1-2 frases que criem curiosidade intelectual, sem revelar tudo. Sem linguagem de confronto.

SANITY CHECK:
Antes de responder, verifique:
(a) Não citei fontes inexistentes.
(b) Todos os números vêm literalmente das fontes ou chartData.
(c) Não inventei dados, declarações ou atribuições.

Responda APENAS com este JSON, sem texto antes ou depois:
{
  "title": "...",
  "excerpt": "...",
  "content": "markdown com {{IMG_1}} e {{IMG_2}}",
  "category": "${category}",
  "chart_type": "bar ou null",
  "chart_data": ${topic.type === "comparison" ? '[{"name": "...", "value": 123}, ...]' : "null"},
  "image_prompts": ["keywords imagem 1 em inglês", "keywords imagem 2 em inglês"],
  "sources_used": [números das fontes realmente usadas no texto]
}`;

      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" },
        reasoning_effort: "low",
        messages: [
          {
            role: "system",
            content: "Você escreve artigos de blog para a TrafficScope, uma plataforma de inteligência competitiva. Escreva em português correto, com pontuação cuidada (ex: vírgula após advérbios de tempo introdutórios, como em 'Em 2026, a IA...'). Responda SEMPRE apenas com JSON válido, sem markdown fora do campo 'content', sem texto adicional.",
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

      // ===== VALIDAÇÃO ROBUSTA DE FONTES =====
      const availableSnippetCount = statsContext.snippets.length;

      // 1. Tentar obter índices do campo sources_used da IA
      // Prioridade: o que está REALMENTE citado no corpo do texto, não o que a IA
      // diz em sources_used — a IA às vezes lista fontes que consultou mas não
      // chegou a citar inline, o que criava bibliografia com itens "fantasma".
      const citationMatches = [...article.content.matchAll(/Fonte\s+(\d+)/gi)];
      let rawIndices: number[] = [...new Set(citationMatches.map((m) => parseInt(m[1], 10)))];

      if (rawIndices.length === 0 && Array.isArray(article.sources_used) && article.sources_used.length > 0) {
        console.log(`📰 Artigo "${article.title}": nenhuma citação "Fonte N" encontrada no texto — a usar sources_used como fallback: [${article.sources_used.join(", ")}]`);
        rawIndices = article.sources_used;
      }

      // 3. Validar índices contra snippets reais disponíveis
      const validIndices = rawIndices.filter((n) => Number.isInteger(n) && n >= 1 && n <= availableSnippetCount);
      const invalidIndices = rawIndices.filter((n) => !(Number.isInteger(n) && n >= 1 && n <= availableSnippetCount));

      if (invalidIndices.length > 0) {
        console.warn(`⚠️ Artigo "${article.title}" citou fontes inexistentes: [${invalidIndices.join(", ")}]. Apenas ${availableSnippetCount} snippet(s) disponível(eis).`);
      }

      // 4. Renumera citações válidas para corresponderem à posição na bibliografia final
      //    (que só contém as fontes efetivamente citadas), e remove citações inválidas.
      const sortedUsedIndices = [...new Set(validIndices)].sort((a, b) => a - b);

      // Se a IA tentou citar fontes mas NENHUMA sobrou válida, rejeita em vez de publicar
      // um artigo com citações removidas e sem bibliografia.
      if (sortedUsedIndices.length === 0 && rawIndices.length > 0) {
        console.error(`❌ Todas as citações do artigo "${article.title}" são inválidas (${rawIndices.join(", ")}) contra ${availableSnippetCount} fonte(s) disponível(eis).`);
        return res.status(422).json({
          error: "Artigo gerado citou apenas fontes inexistentes. A IA violou as regras de atribuição.",
          details: { indicesCitados: rawIndices, snippetsDisponiveis: availableSnippetCount, titulo: article.title }
        });
      }

      const indexMap = new Map(sortedUsedIndices.map((oldIdx, i) => [oldIdx, i + 1]));
      article.content = article.content
        .replace(/\(?\[?Fonte\s+(\d+)\]?\)?/gi, (match: string, numStr: string) => {
          const oldNum = parseInt(numStr, 10);
          const newNum = indexMap.get(oldNum);
          return newNum ? `[Fonte ${newNum}]` : '';
        })
        .replace(/  +/g, ' ')
        .replace(/\s+([.,;:!?])/g, '$1')
        .replace(/\n\s*\n\s*\n/g, '\n\n');

      // 5. Bibliografia final já alinhada 1-a-1 com a numeração renumerada no texto
      const finalSources = sortedUsedIndices.map((i) => statsContext.sources[i - 1]).filter(Boolean);
      const finalSnippets = sortedUsedIndices.map((i) => statsContext.snippets[i - 1]).filter(Boolean);

      // 8. Verificação de números suspeitos (auditoria, não bloqueia)
      const suspiciousNumbers: string[] = [];
      const numberPattern = /\d+([.,]\d+)?\s*(%|trilh[ãa]o|bilh[ãa]o|milh[ãa]o)/gi;
      const numbersInContent = [...article.content.matchAll(numberPattern)].map((m) => m[0]);
      const snippetsJoined = finalSnippets.join(" ");
      for (const num of numbersInContent) {
        const digits = num.match(/\d+([.,]\d+)?/)?.[0] || "";
        if (digits && !snippetsJoined.includes(digits)) {
          suspiciousNumbers.push(num);
        }
      }
      if (suspiciousNumbers.length > 0) {
        console.warn(`⚠️ Possível número inventado no artigo "${article.title}":`, suspiciousNumbers);
      }

      // 9. Log consolidado de integridade
      if (invalidIndices.length > 0 || suspiciousNumbers.length > 0) {
        console.warn(`📋 Relatório de integridade — "${article.title}":`, {
          snippetsDisponiveis: availableSnippetCount,
          indicesCitadosPelaIA: rawIndices,
          indicesValidos: validIndices,
          indicesInvalidos: invalidIndices,
          numerosSuspeitos: suspiciousNumbers,
          bibliografiaGerada: finalSources.length,
        });
      }

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
          sources: finalSources.length > 0 ? finalSources : null,
          source_snippets_used: finalSnippets.length > 0 ? finalSnippets : null,
          flagged_numbers: suspiciousNumbers.length > 0 ? suspiciousNumbers : null,
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
Você é um editor de resumo internacional de uma plataforma de notícias digitais. O seu trabalho é identificar notícias com verdadeiro alcance global e reescrevê-las de forma clara, curta e factual.

Dados da notícia original:
TÍTULO: ${article.title}
DESCRIÇÃO: ${article.description || ""}
CONTEÚDO: ${article.content || ""}

Regras rigorosas:
1. Só reescreva se a notícia tiver relevância internacional real (afeta múltiplos países, mercados globais, big tech, ciência/ambiente de alcance mundial, ou segurança global). Se for notícia essencialmente doméstica de um único país (política interna, economia local, acidente regional sem repercussão alargada), responda APENAS com {"skip": true} e nada mais.
2. Parafraseie completamente. NUNCA copie frases literais do original.
3. Mantenha os factos exactamente como constam da fonte. NÃO invente números, nomes de pessoas, declarações, datas ou detalhes que não estejam no material fornecido. Se a fonte não tiver um dado específico, omita-o — não o suponha.
4. Tom jornalístico, directo, neutro. Sem sensacionalismo, sem adjetivos exagerados, sem opinião pessoal.
5. Não repita o título no corpo do texto.
6. Se — e só se — a notícia tiver uma conexão natural e óbvia com comportamento digital, consumo de informação online ou dinâmicas de plataformas, pode incluir uma breve frase sobre isso. Se não for relevante, ignore completamente este ponto. Não force a ligação.

Responda APENAS com um objeto JSON válido, sem texto antes ou depois:
{
  "title": "título curto e claro (ajuste para clareza, mantendo os factos)",
  "summary": "uma frase de resumo/isca para listagem",
  "content": "corpo do texto em markdown, 150-250 palavras"
}
`;

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
        'new_news_item',
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

  // ===== NOVO: Tradução sob demanda das notícias (com cache) =====
  // full=false (padrão): traduz só headline+summary, para a LISTAGEM.
  // full=true: traduz também o corpo completo, para a PÁGINA DA NOTÍCIA.
  app.post("/api/news/translate", async (req, res) => {
    try {
      const { slugs, language, full } = req.body as { slugs: string[]; language: string; full?: boolean };

      if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
        return res.status(400).json({ error: "slugs é obrigatório." });
      }

      // PT é o idioma original das notícias — nunca precisa de tradução
      if (!language || language === 'pt') {
        return res.json({ success: true, translations: {} });
      }

      if (!LANGUAGE_NAMES[language]) {
        return res.status(400).json({ error: "Idioma não suportado." });
      }

      const { data: items, error: itemsErr } = await supabaseAdmin
        .from("news_items")
        .select("id, slug, headline, summary, content")
        .in("slug", slugs);

      if (itemsErr) throw itemsErr;
      if (!items || items.length === 0) {
        return res.json({ success: true, translations: {} });
      }

      const newsIds = items.map((i: any) => i.id);

      const { data: cached, error: cacheErr } = await supabaseAdmin
        .from("news_translations")
        .select("news_id, headline, summary, content")
        .eq("language", language)
        .in("news_id", newsIds);

      if (cacheErr) throw cacheErr;

      const cachedByNewsId = new Map((cached || []).map((c) => [c.news_id, c]));
      const translations: Record<string, { headline: string; summary: string; content?: string }> = {};

      const toTranslate = items.filter((i: any) => {
        const hit = cachedByNewsId.get(i.id);
        if (hit && (!full || hit.content)) {
          translations[i.slug] = full
            ? { headline: hit.headline, summary: hit.summary, content: hit.content }
            : { headline: hit.headline, summary: hit.summary };
          return false;
        }
        return true;
      });

      if (toTranslate.length > 0 && process.env.GROQ_API_KEY) {
        const languageName = getLanguageName(language);

        for (const item of toTranslate) {
          try {
            const prompt = full
              ? `Traduza a seguinte notícia do Português para ${languageName}.

REGRAS CRÍTICAS:
- Preserve TODA a formatação markdown exatamente como está.
- NUNCA traduza URLs ou nomes próprios de marcas/empresas/pessoas.
- Mantenha o mesmo tom jornalístico, direto e neutro.

TÍTULO ORIGINAL:
${item.headline}

RESUMO ORIGINAL:
${item.summary}

CONTEÚDO ORIGINAL (markdown):
${item.content || ""}

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "headline": "título traduzido",
  "summary": "resumo traduzido",
  "content": "conteúdo traduzido em markdown"
}`
              : `Traduza o TÍTULO e o RESUMO da seguinte notícia do Português para ${languageName}.

REGRAS CRÍTICAS:
- NUNCA traduza URLs ou nomes próprios de marcas/empresas/pessoas.
- Mantenha o mesmo tom jornalístico, direto e neutro.

TÍTULO ORIGINAL:
${item.headline}

RESUMO ORIGINAL:
${item.summary}

Responda APENAS com um objeto JSON válido, sem texto antes ou depois, neste formato exato:
{
  "headline": "título traduzido",
  "summary": "resumo traduzido"
}`;

            const response = await groqCallWithRetry(() =>
              groq.chat.completions.create({
                model: "openai/gpt-oss-120b",
                response_format: { type: "json_object" },
                reasoning_effort: "low",
                messages: [
                  {
                    role: "system",
                    content: `Você é um tradutor profissional especializado em notícias. Traduza fielmente para ${languageName}, preservando markdown e nomes próprios. Responda SEMPRE apenas com JSON válido.`,
                  },
                  { role: "user", content: prompt },
                ],
              })
            );

            const raw = response.choices[0]?.message?.content || "{}";
            const parsedTranslation = JSON.parse(raw);

            const isValid = full
              ? parsedTranslation.headline && parsedTranslation.summary && parsedTranslation.content
              : parsedTranslation.headline && parsedTranslation.summary;

            if (isValid) {
              translations[item.slug] = full
                ? { headline: parsedTranslation.headline, summary: parsedTranslation.summary, content: parsedTranslation.content }
                : { headline: parsedTranslation.headline, summary: parsedTranslation.summary };

              await supabaseAdmin.from("news_translations").upsert(
                {
                  news_id: item.id,
                  language,
                  headline: parsedTranslation.headline,
                  summary: parsedTranslation.summary,
                  content: full ? parsedTranslation.content : null,
                },
                { onConflict: "news_id,language" }
              );
            }
          } catch (translateErr) {
            console.error(`Falha ao traduzir notícia ${item.slug} para ${language}:`, translateErr);
          }
        }
      }

      return res.json({ success: true, translations });
    } catch (err: any) {
      console.error("Erro ao traduzir notícias:", err);
      return res.status(500).json({ error: "Falha ao traduzir notícias." });
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
    console.log('favicon existe?', fs.existsSync(path.join(distPath, 'favicon.svg')));

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