import React, { useState, useEffect, lazy, Suspense } from 'react';
import { DomainMetrics, UserProfile } from '../types/domain';
import { getOrGenerateDomainData } from '../data/mockDomains';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useLanguage } from '../context/LanguageContext';

// Components
import { Navbar } from '../components/Navbar';
import { DomainInputHeader } from '../components/DomainInputHeader';
import { OverviewMetrics } from '../components/OverviewMetrics';
import { TrafficChart } from '../components/TrafficChart';
import { TrafficSources } from '../components/TrafficSources';
import { GeoMapSection } from '../components/GeoMapSection';
import { UserProfileModal } from '../components/UserProfileModal';
import { BuyCreditsModal } from '../components/BuyCreditsModal';
import { SiteFooter } from '../components/SiteFooter';

const AiInsightsModal = lazy(() =>
  import('../components/AiInsightsModal').then(m => ({ default: m.AiInsightsModal }))
);
const CompareDomainsView = lazy(() =>
  import('../components/CompareDomainsView').then(m => ({ default: m.CompareDomainsView }))
);

// Icons
import { Download, FileText, Sparkles, ExternalLink, FlaskConical, GitCompare } from 'lucide-react';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-card rounded-2xl p-5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-muted shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-muted" />
            <div className="h-3 w-28 rounded bg-muted" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
          <div className="h-8 w-28 rounded-lg bg-muted" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-2xl p-5 shadow-sm space-y-3">
            <div className="h-3 w-20 rounded bg-muted" />
            <div className="h-7 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm space-y-4">
        <div className="h-4 w-48 rounded bg-muted" />
        <div className="h-64 w-full rounded-xl bg-muted" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-2xl p-5 border border-border shadow-2xs space-y-4">
          <div className="h-4 w-40 rounded bg-muted" />
          <div className="h-40 w-full rounded-xl bg-muted" />
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border shadow-2xs space-y-4">
          <div className="h-4 w-48 rounded bg-muted" />
          <div className="h-40 w-full rounded-xl bg-muted" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, signOut } = useAuth();

  const numberLocale = language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  const {
    credits,
    mode,
    totalSearches,
    totalPurchases,
    isLoading: creditsLoading,
    consumeCredit,
    setMode,
    refetch,
    isTestMode,
  } = useCredits(user?.id);

  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, DomainMetrics>>({});
  const [loadingDomains, setLoadingDomains] = useState<Set<string>>(new Set());

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [primaryDomainOverride, setPrimaryDomainOverride] = useState<string | null>(null);

  const [isBuyCreditsOpen, setIsBuyCreditsOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    setMetricsMap(prev => {
      const next: typeof prev = {};
      for (const [d, m] of Object.entries(prev)) {
        const { aiReport, ...rest } = m;
        next[d] = rest as DomainMetrics;
      }
      return next;
    });
  }, [language]);

  useEffect(() => {
    async function loadData() {
      const updatedMap: Record<string, DomainMetrics> = { ...metricsMap };
      const { data: { session } } = await supabase.auth.getSession();

      for (const d of selectedDomains) {
        if (!updatedMap[d]) {
          setLoadingDomains(prev => new Set(prev).add(d));
          try {
            const useRealData = mode === 'real' && !isTestMode;

            const res = await fetch('/api/analyze-domain', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({
                domain: d,
                useRealData,
              })
            });
            const result = await res.json();
            if (result.success && result.data) {
              updatedMap[d] = result.data;
            } else {
              updatedMap[d] = getOrGenerateDomainData(d);
            }
          } catch (e) {
            updatedMap[d] = getOrGenerateDomainData(d);
          } finally {
            setLoadingDomains(prev => {
              const next = new Set(prev);
              next.delete(d);
              return next;
            });
          }
        }
      }
      setMetricsMap(updatedMap);
    }

    if (selectedDomains.length > 0) {
      loadData();
    }
  }, [selectedDomains]);

  const primaryDomain =
    (primaryDomainOverride && selectedDomains.includes(primaryDomainOverride))
      ? primaryDomainOverride
      : selectedDomains[0] || 'amazon.com';
  const isPrimaryLoading = loadingDomains.has(primaryDomain);
  const primaryMetrics = metricsMap[primaryDomain];
  const activeMetricsList = selectedDomains
    .map(d => metricsMap[d])
    .filter((m): m is DomainMetrics => Boolean(m));

  const isSyntheticData =
    primaryMetrics?.dataSource === 'synthetic' || isTestMode;

  const handleAddDomain = async (domain: string) => {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();
    if (!cleanDomain) return;

    if (mode === 'real' && !isTestMode) {
      const consumed = await consumeCredit();
      if (!consumed) {
        alert(t('dashboard.alert.noCredits'));
        setIsBuyCreditsOpen(true);
        return;
      }
    }

    if (!selectedDomains.includes(cleanDomain)) {
      setSelectedDomains(prev => [...prev, cleanDomain]);
    }
  };

  const handleRemoveDomain = (domain: string) => {
    setSelectedDomains(prev => prev.filter(d => d !== domain));
    setPrimaryDomainOverride(prev => (prev === domain ? null : prev));
  };

  const handleClearAllDomains = () => {
    setSelectedDomains([]);
    setPrimaryDomainOverride(null);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (!primaryMetrics) return;

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/check-export-limit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
    });

    if (!res.ok) {
      const data = await res.json();
      alert(data.error || t('dashboard.alert.exportError'));
      return;
    }

    if (type === 'pdf') {
      await exportToPdf(primaryMetrics);
    } else {
      await exportToExcel(activeMetricsList);
    }
  };

  const handleTriggerAiAnalysis = async () => {
    if (!primaryMetrics) return;

    setIsAiLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          domain: primaryDomain,
          metrics: primaryMetrics,
          language
        })
      });
      const data = await res.json();
      if (data.success && data.aiReport) {
        setMetricsMap(prev => ({
          ...prev,
          [primaryDomain]: {
            ...prev[primaryDomain],
            aiReport: data.aiReport
          }
        }));
      } else if (data.error) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Erro ao gerar relatório com IA:', err);
    } finally {
      setIsAiLoading(false);
      setIsAiModalOpen(true);
    }
  };

  const profile: UserProfile = {
    credits,
    mode,
    totalSearches,
    totalPurchases,
  };

  const getCategoryName = (category?: string): string => {
    if (!category) return t('domain.category.other');
    const map: Record<string, string> = {
      'negócios online & serviços': 'domain.category.business',
      'tecnologia': 'domain.category.technology',
      'e-commerce': 'domain.category.ecommerce',
      'notícias & media': 'domain.category.news',
      'redes sociais': 'domain.category.social',
      'finanças': 'domain.category.finance',
      'saúde & bem-estar': 'domain.category.health',
      'educação': 'domain.category.education',
      'entretenimento': 'domain.category.entertainment',
      'viagens & turismo': 'domain.category.travel',
    };
    const key = map[category.toLowerCase().trim()];
    return key ? t(key) : category;
  };

  const getLastUpdated = (lastUpdated?: string): string => {
    if (!lastUpdated) return '';
    const normalized = lastUpdated.toLowerCase().trim();
    if (normalized.includes('agora') || normalized.includes('now')) {
      return t('domain.lastUpdated.now');
    }
    if (normalized.includes('hoje') || normalized.includes('today')) {
      return t('domain.lastUpdated.today');
    }
    if (normalized.includes('recente') || normalized.includes('recently')) {
      return t('domain.lastUpdated.recent');
    }
    return lastUpdated;
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground pb-16">
      <Navbar
        user={user}
        onSignOut={() => void signOut()}
        profile={profile}
        onToggleMode={setMode}
        onOpenBuyCredits={() => setIsBuyCreditsOpen(true)}
      />

      <DomainInputHeader
        selectedDomains={selectedDomains}
        primaryDomain={primaryDomain}
        onSelectPrimaryDomain={setPrimaryDomainOverride}
        onAddDomain={handleAddDomain}
        onRemoveDomain={handleRemoveDomain}
        onClearAllDomains={handleClearAllDomains}
        onExportPdf={() => primaryMetrics && exportToPdf(primaryMetrics)}
        onExportExcel={() => exportToExcel(activeMetricsList)}
      />

      {selectedDomains.length > 0 && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {isPrimaryLoading || !primaryMetrics ? (
            <DashboardSkeleton />
          ) : isCompareMode && selectedDomains.length > 1 ? (
            <Suspense fallback={<DashboardSkeleton />}>
              <CompareDomainsView
                metricsList={activeMetricsList}
                onRemoveFromCompare={handleRemoveDomain}
                onExitCompareMode={() => setIsCompareMode(false)}
              />
            </Suspense>
          ) : (
            <>
              <div className="bg-card rounded-2xl p-5 shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={primaryMetrics.logo}
                    alt={primaryMetrics.name}
                    className="h-12 w-12 rounded-xl bg-muted p-1 border border-border shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground font-mono">{primaryMetrics.domain}</h2>
                      <a
                        href={`https://${primaryMetrics.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      {isSyntheticData && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5">
                          <FlaskConical className="h-3 w-3" />
                          {t('dashboard.badge.testData')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <span className="font-semibold text-primary">{getCategoryName(primaryMetrics.category)}</span>
                      <span>•</span>
                      <span>{getLastUpdated(primaryMetrics.lastUpdated)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleExport('pdf')}
                    id="export-pdf-btn"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full"
                  >
                    <FileText className="h-4 w-4 text-rose-500" />
                    {t('dashboard.export.pdf')}
                  </Button>

                  <Button
                    onClick={() => handleExport('excel')}
                    id="export-excel-btn"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full"
                  >
                    <Download className="h-4 w-4 text-emerald-600" />
                    {t('dashboard.export.excel')}
                  </Button>

                  <Button
                    onClick={() => setIsCompareMode(!isCompareMode)}
                    id="compare-mode-toggle-btn"
                    variant={isCompareMode ? 'default' : 'outline'}
                    size="sm"
                    className="gap-1.5 rounded-full"
                  >
                    <GitCompare className="h-4 w-4" />
                    {t('dashboard.compareMode')}
                    {selectedDomains.length > 1 && (
                      <span className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                        isCompareMode ? 'bg-background text-foreground' : 'bg-muted text-foreground'
                      }`}>
                        {selectedDomains.length}
                      </span>
                    )}
                  </Button>

                  <Button
                    onClick={() => {
                      if (primaryMetrics?.aiReport) {
                        setIsAiModalOpen(true);
                      } else {
                        handleTriggerAiAnalysis();
                      }
                    }}
                    id="ai-report-banner-btn"
                    size="sm"
                    className="gap-1.5 rounded-full hover:bg-primary/80"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    {t('dashboard.aiInsights')}
                  </Button>
                </div>
              </div>

              <OverviewMetrics metrics={primaryMetrics} />
              <TrafficChart metricsList={activeMetricsList} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TrafficSources metrics={primaryMetrics} />
                <GeoMapSection metrics={primaryMetrics} />
              </div>
            </>
          )}
        </main>
      )}

      {primaryMetrics && (
        <Suspense fallback={null}>
          <AiInsightsModal
            domain={primaryDomain}
            metrics={primaryMetrics}
            aiReport={primaryMetrics.aiReport}
            isOpen={isAiModalOpen}
            onClose={() => setIsAiModalOpen(false)}
            onReanalyze={handleTriggerAiAnalysis}
            isAiLoading={isAiLoading}
          />
        </Suspense>
      )}

      <BuyCreditsModal
        isOpen={isBuyCreditsOpen}
        onClose={() => setIsBuyCreditsOpen(false)}
        userId={user?.id}
      />

      <SiteFooter />
    </div>
  );
}