import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Groq from "groq-sdk";
import { getOrGenerateDomainData } from "./src/data/mockDomains";
import rateLimit from "express-rate-limit";
import { Paddle, EventName } from '@paddle/paddle-node-sdk';
import { supabaseAdmin } from './src/lib/supabaseAdmin';
import { PADDLE_PRICES } from './src/lib/paddleConfig';

const paddle = new Paddle(process.env.PADDLE_API_KEY!);

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
  const PORT = 3000;

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

      if (
        event.eventType === EventName.SubscriptionCreated ||
        event.eventType === EventName.SubscriptionUpdated
      ) {
        const sub = event.data;
        const userId = sub.customData?.user_id as string | undefined;

        if (userId) {
          const priceId = sub.items?.[0]?.price?.id;
          const billingCycle =
            priceId === PADDLE_PRICES.pro.annual ? 'annual' : 'monthly';
          const plan = priceId === PADDLE_PRICES.enterprise.monthly ? 'enterprise' : 'pro';

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
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Sessão inválida" });

    const plan = await resolveUserPlan(user);

    if (plan === 'free') {
      // Dados de teste => sem custo real, sem limite de exportações
      return res.json({ success: true });
    }

    if (plan === 'pro') {
      const today = new Date().toISOString().slice(0, 10);
      const { data: usage } = await supabaseAdmin
        .from('export_usage')
        .select('count')
        .eq('user_id', user.id)
        .eq('usage_date', today)
        .maybeSingle();

      const currentCount = usage?.count ?? 0;

      if (currentCount >= 20) {
        return res.status(429).json({ error: 'Limite diário de 20 exportações atingido no plano Pro.' });
      }

      await supabaseAdmin
        .from('export_usage')
        .upsert(
          { user_id: user.id, usage_date: today, count: currentCount + 1 },
          { onConflict: 'user_id,usage_date' }
        );
    }

    return res.json({ success: true });
  });

  // ===== ALTERADO: Analyze Domain Metrics Endpoint =====
  // Free (ou sem sessão) => sempre dados sintéticos (getOrGenerateDomainData), nunca Apify, sem limite diário.
  // Pro/Enterprise => dados reais via Apify (com cache), fallback sintético se a Apify falhar.
  app.post("/api/analyze-domain", planAwareRateLimit, async (req, res) => {
    try {
      const { domain, domains } = req.body;
      const user = await getUserFromRequest(req);
      const plan = await resolveUserPlan(user);

      // Modo comparação (vários domínios) — sempre dados de teste por agora
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

      if (plan === 'free') {
        const data = { ...getOrGenerateDomainData(domain), dataSource: 'synthetic' };
        return res.json({ success: true, data });
      }

      // ALTERADO: limite diário de domínios analisados para Pro/Enterprise (tabela domain_usage)
      if (user) {
        const dailyLimit = plan === 'enterprise' ? 40 : 20;
        const today = new Date().toISOString().slice(0, 10);
        const { data: usage } = await supabaseAdmin
          .from('domain_usage')
          .select('count')
          .eq('user_id', user.id)
          .eq('usage_date', today)
          .maybeSingle();

        const currentCount = usage?.count ?? 0;

        if (currentCount >= dailyLimit) {
          return res.status(429).json({
            error: `Limite diário de ${dailyLimit} domínios analisados atingido no plano ${plan === 'enterprise' ? 'Enterprise' : 'Pro'}.`,
          });
        }

        await supabaseAdmin
          .from('domain_usage')
          .upsert(
            { user_id: user.id, usage_date: today, count: currentCount + 1 },
            { onConflict: 'user_id,usage_date' }
          );
      }

      try {
        const data = await getDomainDataWithCache(domain);
        return res.json({ success: true, data: { ...data, dataSource: 'real' } });
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

  // ===== ALTERADO: AI Analysis Endpoint (Groq) — Free deixa de ser bloqueado =====
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { domain, metrics } = req.body;

      if (!domain || !metrics) {
        return res.status(400).json({ error: "Métricas do domínio são necessárias para análise" });
      }

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

Forneça uma análise estratégica completa em Português, respondendo APENAS com um objeto JSON válido no seguinte formato exato, sem texto antes ou depois:
{
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
            content: `Você é o assistente executivo de Inteligência Competitiva da plataforma TrafficScope. Responda em Português com tom profissional, preciso e acionável. Responda SEMPRE apenas com JSON válido, sem texto adicional, sem markdown dentro dos valores de texto (nada de tabelas, pipes, asteriscos ou cabeçalhos dentro das strings).${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`
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
      const { domain, metrics, messages } = req.body;
      const isSynthetic = metrics?.dataSource === 'synthetic';

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
            content: `Você é o Copilot de Inteligência Competitiva da TrafficScope. Responda SEMPRE em texto corrido, curto e direto (máximo 2-3 frases, até 220 caracteres). NUNCA use tabelas markdown, símbolos de pipe (|), cabeçalhos (#), listas numeradas ou com marcadores, nem asteriscos para negrito. Escreva como se estivesse a falar num chat, de forma natural e objetiva, sem formatação estrutural nenhuma.${isSynthetic ? ' Os dados fornecidos são sintéticos/de demonstração — nunca os apresentes como dados reais de mercado.' : ''}`
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


  // Vite middleware integration for Development vs Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
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