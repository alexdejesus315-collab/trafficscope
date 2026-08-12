import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Shuffle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface GenerateNewsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (slug: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const NEWS_CATEGORIES_UI = [
  { key: 'tech-ia', label: 'Tecnologia & IA' },
  { key: 'big-tech', label: 'Big Tech & Plataformas' },
  { key: 'seo-marketing', label: 'SEO & Marketing Digital' },
  { key: 'ecommerce', label: 'E-commerce & Retalho Online' },
  { key: 'mercados-cripto', label: 'Mercados Financeiros & Cripto' },
  { key: 'startups-africa', label: 'Startups & Inovação em África' },
  { key: 'geopolitica-comercio', label: 'Geopolítica & Comércio Global' },
  { key: 'privacidade-regulacao', label: 'Privacidade & Regulação Digital' },
];

export function GenerateNewsModal({ open, onOpenChange, onGenerated, anchorRef }: GenerateNewsModalProps) {
  const [categoryKey, setCategoryKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setCategoryKey(null);
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/news/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(categoryKey ? { categoryKey } : {}),
      });
      const data = await res.json();
      if (data.success) {
        reset();
        onOpenChange(false);
        onGenerated(data.item.slug);
      } else {
        setError(data.error || 'Falha ao gerar notícia.');
      }
    } catch {
      setError('Falha de rede ao gerar notícia.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[300px]
                 bg-popover rounded-2xl border border-border
                 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Gerar Notícia</p>
      </div>

      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Categoria</p>
      <div className="flex flex-col gap-1 max-h-[220px] overflow-y-auto mb-3">
        <button
          type="button"
          onClick={() => setCategoryKey(null)}
          disabled={isLoading}
          className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
            categoryKey === null ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'
          }`}
        >
          <Shuffle className="h-3.5 w-3.5" />
          Aleatória
        </button>
        {NEWS_CATEGORIES_UI.map((cat) => (
          <button
            key={cat.key}
            type="button"
            onClick={() => setCategoryKey(cat.key)}
            disabled={isLoading}
            className={`rounded-lg px-3 py-2 text-sm text-left transition-colors ${
              categoryKey === cat.key ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <Button className="w-full" disabled={isLoading} onClick={handleGenerate}>
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar'}
      </Button>
    </div>
  );
}