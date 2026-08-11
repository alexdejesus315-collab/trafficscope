import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { Navbar } from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { DomainMetrics } from '../types/domain';
import { exportToPdf, exportToExcel } from '../utils/exportUtils';
import { FileText, Download, Trash2, Search, Loader2, Inbox } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HistoryItem {
  id: string;
  domain: string;
  result: DomainMetrics;
  data_source: string;
  created_at: string;
}

export default function History() {
  const { user, signOut } = useAuth();
  const { t, language } = useLanguage();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const numberLocale = language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR';

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/search-history', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.history);
      }
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleDeleteOne = async (id: string) => {
    setDeletingId(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(`/api/search-history/${id}`, {
        method: 'DELETE',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Erro ao apagar item:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(t('history.confirm.clearAll'))) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/search-history', {
        method: 'DELETE',
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      setItems([]);
    } catch (err) {
      console.error('Erro ao limpar histórico:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased pb-16">
      <Navbar
        user={user}
        onSignOut={() => void signOut()}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('history.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('history.subtitle', undefined, { count: items.length })}
            </p>
          </div>
          {items.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-1.5 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
              {t('history.clearAll')}
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground gap-2">
            <Inbox className="h-10 w-10 opacity-40" />
            <p className="text-sm">{t('history.empty.title')}</p>
            <p className="text-xs">{t('history.empty.subtitle')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-2xl p-4 border border-border shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                  <img
                    src={item.result.logo}
                    alt={item.result.name}
                    className="h-10 w-10 rounded-lg bg-muted p-1 border border-border shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-sm text-foreground truncate">{item.domain}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString(numberLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Search className="h-3 w-3" />
                  {t('history.visitsPerMonth', undefined, { count: item.result.monthlyVisits ?? 0 })}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full flex-1"
                    onClick={() => exportToPdf(item.result)}
                  >
                    <FileText className="h-3.5 w-3.5 text-rose-500" />
                    {t('history.export.pdf')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 rounded-full flex-1"
                    onClick={() => exportToExcel([item.result])}
                  >
                    <Download className="h-3.5 w-3.5 text-emerald-600" />
                    {t('history.export.excel')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteOne(item.id)}
                    disabled={deletingId === item.id}
                    aria-label={t('history.delete.aria')}
                  >
                    {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}