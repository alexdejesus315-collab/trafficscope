import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Loader2, Wand2, PenLine } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../context/LanguageContext';

interface GenerateArticleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (slug: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

type Mode = 'auto' | 'manual';

export function GenerateArticleModal({ open, onOpenChange, onGenerated, anchorRef }: GenerateArticleModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<Mode>('auto');
  const [domain, setDomain] = useState('');
  const [theme, setTheme] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setMode('auto');
    setDomain('');
    setTheme('');
    setAffiliateLink('');
    setError(null);
  };

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!isLoading) { onOpenChange(false); reset(); }
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isLoading) { onOpenChange(false); reset(); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, isLoading, anchorRef, onOpenChange]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    const body = mode === 'manual'
      ? { domain: domain.trim(), theme: theme.trim(), affiliateLink: affiliateLink.trim() }
      : {};

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/blog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        reset();
        onOpenChange(false);
        onGenerated(data.post.slug);
      } else {
        setError(data.error || t('generateArticle.error.generic'));
      }
    } catch {
      setError(t('generateArticle.error.network'));
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = mode === 'auto' || (domain.trim().length > 0 && theme.trim().length > 0);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[340px]
                 bg-popover rounded-2xl border border-border
                 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">{t('generateArticle.title')}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1 mb-3">
        <button
          type="button"
          onClick={() => setMode('auto')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'auto' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wand2 className="h-3.5 w-3.5" />
          {t('generateArticle.mode.auto')}
        </button>
        <button
          type="button"
          onClick={() => setMode('manual')}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PenLine className="h-3.5 w-3.5" />
          {t('generateArticle.mode.manual')}
        </button>
      </div>

      <div className="min-h-[190px]">
        {mode === 'auto' ? (
          <p className="text-sm text-muted-foreground">
            {t('generateArticle.autoDesc')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generateArticle.label.domain')}</label>
              <Input placeholder={t('generateArticle.placeholder.domain')} value={domain} onChange={(e) => setDomain(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generateArticle.label.theme')}</label>
              <Input placeholder={t('generateArticle.placeholder.theme')} value={theme} onChange={(e) => setTheme(e.target.value)} disabled={isLoading} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('generateArticle.label.affiliate')}</label>
              <Input placeholder={t('generateArticle.placeholder.affiliate')} value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} disabled={isLoading} />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mt-2">{error}</p>}

      <Button className="w-full mt-3" disabled={isLoading || !canSubmit} onClick={handleGenerate}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'auto' ? t('generateArticle.button.auto') : t('generateArticle.button.manual')}
      </Button>
    </div>
  );
}