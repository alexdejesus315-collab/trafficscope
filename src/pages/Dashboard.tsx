import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DomainMetrics, PlanType } from '../types/domain';
import { getOrGenerateDomainData } from '../data/mockDomains';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';

// Components
import { Navbar, COMPANY_PANEL_WIDTH } from '../components/Navbar';
import { DomainInputHeader } from '../components/DomainInputHeader';
import { OverviewMetrics } from '../components/OverviewMetrics';
import { TrafficChart } from '../components/TrafficChart';
import { TrafficSources } from '../components/TrafficSources';
import { GeoMapSection } from '../components/GeoMapSection';

const AiInsightsModal = lazy(() =>
  import('../components/AiInsightsModal').then(m => ({ default: m.AiInsightsModal }))
);
const CompareDomainsView = lazy(() =>
  import('../components/CompareDomainsView').then(m => ({ default: m.CompareDomainsView }))
);
const PricingModal = lazy(() =>
  import('../components/PricingModal').then(m => ({ default: m.PricingModal }))
);

// Icons
import { Download, FileText, Sparkles, ExternalLink, FlaskConical, GitCompare } from 'lucide-react';

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gray-200 shrink-0" />
          <div className="space-y-2">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-3 w-28 rounded bg-gray-200" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-28 rounded-lg bg-gray-200" />
          <div className="h-8 w-28 rounded-lg bg-gray-200" />
          <div className="h-8 w-28 rounded-lg bg-gray-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-3">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-7 w-24 rounded bg-gray-200" />
            <div className="h-3 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4">
        <div className="h-4 w-48 rounded bg-gray-200" />
        <div className="h-64 w-full rounded-xl bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="h-4 w-40 rounded bg-gray-200" />
          <div className="h-40 w-full rounded-xl bg-gray-100" />
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs space-y-4">
          <div className="h-4 w-48 rounded bg-gray-200" />
          <div className="h-40 w-full rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const { plan: currentPlan } = useSubscription(user?.id);
  const [metricsMap, setMetricsMap] = useState<Record<string, DomainMetrics>>({});
  const [loadingDomains, setLoadingDomains] = useState<Set<string>>(new Set());

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [primaryDomainOverride, setPrimaryDomainOverride] = useState<string | null>(null);
  const [isCompanyMenuOpen, setIsCompanyMenuOpen] = useState(false);

  useEffect(() => {
    const state = location.state as { openCompanyMenu?: boolean } | null;
    if (state?.openCompanyMenu) {
      setIsCompanyMenuOpen(true);
      navigate('.', { replace: true, state: null });
    }
  }, [location.state, navigate]);

  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      const updatedMap: Record<string, DomainMetrics> = { ...metricsMap };
      const { data: { session } } = await supabase.auth.getSession();

      for (const d of selectedDomains) {
        if (!updatedMap[d]) {
          setLoadingDomains(prev => new Set(prev).add(d));
          try {
            const res = await fetch('/api/analyze-domain', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
              },
              body: JSON.stringify({ domain: d })
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

    loadData();
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
    primaryMetrics?.dataSource === 'synthetic' || currentPlan === 'free';

  const handleAddDomain = (domain: string) => {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();
    if (!cleanDomain) return;

    const maxDomains = currentPlan === 'pro' ? 5 : currentPlan === 'enterprise' ? 10 : 999;

    if (!selectedDomains.includes(cleanDomain)) {
      if (selectedDomains.length >= maxDomains) {
        alert(`O limite de comparação simultânea é de ${maxDomains} websites.`);
        return;
      }
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
      alert(data.error || 'Não foi possível exportar.');
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
          metrics: primaryMetrics
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

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-gray-900 font-sans antialiased selection:bg-[#279ef9] selection:text-white pb-16">
      <Navbar
        currentPlan={currentPlan}
        onOpenPricing={() => setIsPricingOpen(true)}
        user={user}
        onSignOut={() => void signOut()}
        isCompanyMenuOpen={isCompanyMenuOpen}
        onToggleCompanyMenu={() => setIsCompanyMenuOpen(prev => !prev)}
        onCloseCompanyMenu={() => setIsCompanyMenuOpen(false)}
      />

      <div
        className="transition-[margin] duration-300 ease-in-out"
        style={{ marginLeft: isCompanyMenuOpen ? COMPANY_PANEL_WIDTH : 0 }}
      >
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
                <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={primaryMetrics.logo}
                      alt={primaryMetrics.name}
                      className="h-12 w-12 rounded-xl bg-gray-50 p-1 border border-gray-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 font-mono">{primaryMetrics.domain}</h2>
                        <a
                          href={`https://${primaryMetrics.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-[#279ef9] transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        {isSyntheticData && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5">
                            <FlaskConical className="h-3 w-3" />
                            Dados de teste
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="font-semibold text-[#279ef9]">{primaryMetrics.category}</span>
                        <span>•</span>
                        <span>{primaryMetrics.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => handleExport('pdf')}
                      id="export-pdf-btn"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                    >
                      <FileText className="h-4 w-4 text-rose-500" />
                      Exportar PDF
                    </Button>

                    <Button
                      onClick={() => handleExport('excel')}
                      id="export-excel-btn"
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                    >
                      <Download className="h-4 w-4 text-emerald-600" />
                      Exportar Excel
                    </Button>

                    {/* NOVO: Botão Modo Comparar movido para o card */}
                    <Button
                      onClick={() => setIsCompareMode(!isCompareMode)}
                      id="compare-mode-toggle-btn"
                      variant={isCompareMode ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1.5"
                    >
                      <GitCompare className="h-4 w-4" />
                      Modo Comparar
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
                      className="gap-1.5"
                    >
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      Insights da IA
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
      </div>

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

      <Suspense fallback={null}>
        <PricingModal
          isOpen={isPricingOpen}
          onClose={() => setIsPricingOpen(false)}
          currentPlan={currentPlan}
          onChangePlan={() => {}}
          userId={user?.id}
        />
      </Suspense>
    </div>
  );
}