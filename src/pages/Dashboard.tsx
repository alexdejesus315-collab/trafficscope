import React, { useState, useEffect } from 'react';
import { DomainMetrics, PlanType } from '../types/domain';
import { getOrGenerateDomainData } from '../data/mockDomains';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { supabase } from '../lib/supabaseClient';
import { Button } from '@/components/ui/button';

// Components
import { Navbar } from '../components/Navbar';
import { DomainInputHeader } from '../components/DomainInputHeader';
import { OverviewMetrics } from '../components/OverviewMetrics';
import { TrafficChart } from '../components/TrafficChart';
import { TrafficSources } from '../components/TrafficSources';
import { GeoMapSection } from '../components/GeoMapSection';
import { AiInsightsModal } from '../components/AiInsightsModal';
import { CompareDomainsView } from '../components/CompareDomainsView';
import { PricingModal } from '../components/PricingModal';

// Icons
import { Download, FileText, Sparkles, ExternalLink } from 'lucide-react';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const { plan: currentPlan } = useSubscription(user?.id);
  const [metricsMap, setMetricsMap] = useState<Record<string, DomainMetrics>>({});

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Modals
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Load domain data whenever selectedDomains changes
  useEffect(() => {
    async function loadData() {
      const updatedMap: Record<string, DomainMetrics> = { ...metricsMap };

      const { data: { session } } = await supabase.auth.getSession();

      for (const d of selectedDomains) {
        if (!updatedMap[d]) {
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
          }
        }
      }
      setMetricsMap(updatedMap);
    }

    loadData();
  }, [selectedDomains]);

  const primaryDomain = selectedDomains[0] || 'amazon.com';
  const primaryMetrics = metricsMap[primaryDomain] || getOrGenerateDomainData(primaryDomain);
  const activeMetricsList = selectedDomains.map(d => metricsMap[d] || getOrGenerateDomainData(d));

  // Add Domain handler
  const handleAddDomain = (domain: string) => {
    const cleanDomain = domain.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '').trim();
    if (!cleanDomain) return;

    if (currentPlan === 'free') {
      setSelectedDomains([cleanDomain]);
      return;
    }

    const maxDomains = currentPlan === 'pro' ? 5 : 999;

    if (!selectedDomains.includes(cleanDomain)) {
      if (selectedDomains.length >= maxDomains) {
        alert(`O limite de comparação simultânea é de ${maxDomains} websites.`);
        return;
      }
      setSelectedDomains(prev => [...prev, cleanDomain]);
    }
  };

  // Remove Domain handler
  const handleRemoveDomain = (domain: string) => {
    setSelectedDomains(prev => prev.filter(d => d !== domain));
  };

  // Clear All Domains handler
  const handleClearAllDomains = () => {
    setSelectedDomains([]);
  };

  const handleExport = async (type: 'pdf' | 'excel') => {
    if (currentPlan === 'free') {
      setIsPricingOpen(true);
      return;
    }

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
      exportToPdf(primaryMetrics);
    } else {
      exportToExcel(activeMetricsList);
    }
  };

  // Trigger Gemini AI Report
  const handleTriggerAiAnalysis = async () => {
    if (currentPlan === 'free') {
      setIsPricingOpen(true);
      return;
    }

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
        isCompareMode={isCompareMode}
        onToggleCompareMode={() => setIsCompareMode(!isCompareMode)}
        activeDomainCount={selectedDomains.length}
        user={user}
        onSignOut={() => void signOut()}
      />

      <DomainInputHeader
        selectedDomains={selectedDomains}
        onAddDomain={handleAddDomain}
        onRemoveDomain={handleRemoveDomain}
        onClearAllDomains={handleClearAllDomains}
        onExportPdf={() => exportToPdf(primaryMetrics)}
        onExportExcel={() => exportToExcel(activeMetricsList)}
      />

      {selectedDomains.length > 0 && (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
          {isCompareMode && selectedDomains.length > 1 ? (
            <CompareDomainsView
              metricsList={activeMetricsList}
              onRemoveFromCompare={handleRemoveDomain}
              onExitCompareMode={() => setIsCompareMode(false)}
            />
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
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-[#279ef9]">{primaryMetrics.category}</span>
                      <span>•</span>
                      <span>{primaryMetrics.lastUpdated}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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

                  <Button
                    onClick={handleTriggerAiAnalysis}
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

              {currentPlan !== 'free' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TrafficSources metrics={primaryMetrics} />
                  <GeoMapSection metrics={primaryMetrics} />
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Fontes de tráfego e origem geográfica estão disponíveis a partir do plano Pro.
                  </p>
                  <button
                    onClick={() => setIsPricingOpen(true)}
                    className="px-4 py-2 rounded-xl bg-[#279ef9] hover:bg-[#279ef9]/90 text-white text-xs font-bold transition-all"
                  >
                    Ver Planos
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      )}

      <AiInsightsModal
        domain={primaryDomain}
        metrics={primaryMetrics}
        aiReport={primaryMetrics.aiReport}
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onReanalyze={handleTriggerAiAnalysis}
        isAiLoading={isAiLoading}
      />

      <PricingModal
        isOpen={isPricingOpen}
        onClose={() => setIsPricingOpen(false)}
        currentPlan={currentPlan}
        onChangePlan={() => {}}
        userId={user?.id}
      />
    </div>
  );
}