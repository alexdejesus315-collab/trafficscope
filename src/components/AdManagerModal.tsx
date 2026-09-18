import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Megaphone, Loader2, Trash2, Power, PowerOff, Image, Video, ImagePlay, Upload, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Ad {
  id: string;
  title: string | null;
  media_type: 'image' | 'gif' | 'video';
  media_url: string;
  link_url: string;
  active: boolean;
  display_order: number;
  created_at: string;
}

interface AdManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

const MEDIA_TYPE_ICONS = {
  image: Image,
  gif: ImagePlay,
  video: Video,
};

export function AdManagerModal({ open, onOpenChange, anchorRef }: AdManagerModalProps) {
  const [tab, setTab] = useState<'list' | 'add'>('list');
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'gif' | 'video'>('image');
  const [file, setFile] = useState<File | null>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setTitle('');
    setMediaType('image');
    setFile(null);
    setMediaUrl('');
    setLinkUrl('');
    setDisplayOrder('0');
    setError(null);
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const fetchAds = async () => {
    setIsLoadingList(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch('/api/ads', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (data.success) setAds(data.ads);
    } catch {
      // silencioso — lista fica vazia
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (open) fetchAds();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        if (!isSubmitting) { onOpenChange(false); }
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isSubmitting) { onOpenChange(false); }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, isSubmitting, anchorRef, onOpenChange]);

  const handleToggleActive = async (ad: Ad) => {
    setBusyId(ad.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ active: !ad.active }),
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, active: !a.active } : a)));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (ad: Ad) => {
    setBusyId(ad.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/ads/${ad.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAds((prev) => prev.filter((a) => a.id !== ad.id));
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleStartEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setTitle(ad.title || '');
    setMediaType(ad.media_type);
    setFile(null);
    setMediaUrl(ad.media_url);
    setLinkUrl(ad.link_url);
    setDisplayOrder(String(ad.display_order));
    setError(null);
    setTab('add');
  };

  const handleSubmit = async () => {
    if (!linkUrl.trim()) {
      setError('O link de afiliado é obrigatório.');
      return;
    }
    if (!editingId && !file && !mediaUrl.trim()) {
      setError('Envia um ficheiro (imagem/gif/vídeo) ou cola um link de media.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      let res: Response;

      if (editingId) {
        // Edição: se escolheu novo ficheiro, faz upload primeiro para obter o novo media_url
        let finalMediaUrl = mediaUrl.trim();
        if (file) {
          const uploadRes = await fetch('/api/upload-image', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: (() => {
              const fd = new FormData();
              fd.append('image', file);
              return fd;
            })(),
          });
          const uploadData = await uploadRes.json();
          if (!uploadData.success) {
            setError(uploadData.error || 'Falha ao enviar novo ficheiro.');
            setIsSubmitting(false);
            return;
          }
          finalMediaUrl = uploadData.url;
        }

        res = await fetch(`/api/ads/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim() || null,
            media_type: mediaType,
            media_url: finalMediaUrl,
            link_url: linkUrl.trim(),
            display_order: Number(displayOrder) || 0,
          }),
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('media', file);
        formData.append('media_type', mediaType);
        formData.append('link_url', linkUrl.trim());
        formData.append('display_order', displayOrder || '0');
        if (title.trim()) formData.append('title', title.trim());

        res = await fetch('/api/ads', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
      } else {
        res = await fetch('/api/ads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: title.trim() || null,
            media_type: mediaType,
            media_url: mediaUrl.trim(),
            link_url: linkUrl.trim(),
            display_order: Number(displayOrder) || 0,
          }),
        });
      }

      const data = await res.json();
      if (data.success) {
        resetForm();
        setTab('list');
        fetchAds();
      } else {
        setError(data.error || 'Falha ao guardar anúncio.');
      }
    } catch {
      setError('Falha de rede ao guardar anúncio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute top-[calc(100%+10px)] left-1/2 -translate-x-1/2 w-[360px]
                 bg-popover rounded-2xl border border-border
                 shadow-[0_8px_30px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                 overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150 p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Megaphone className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Gerir Anúncios</p>
      </div>

      <div className="flex gap-1 mb-3 bg-muted rounded-lg p-1">
        <button
          type="button"
          onClick={() => { resetForm(); setTab('list'); }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            tab === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground'
          }`}
        >
          Anúncios ({ads.length})
        </button>
        <button
          type="button"
          onClick={() => { resetForm(); setTab('add'); }}
          className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
            tab === 'add' ? 'bg-background text-foreground' : 'text-muted-foreground'
          }`}
        >
          Adicionar
        </button>
      </div>

      {tab === 'list' && (
        <div className="flex flex-col gap-1.5 max-h-[320px] overflow-y-auto">
          {isLoadingList ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : ads.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">Nenhum anúncio criado ainda.</p>
          ) : (
            ads.map((ad) => {
              const Icon = MEDIA_TYPE_ICONS[ad.media_type];
              return (
                <div
                  key={ad.id}
                  className="flex items-center gap-2 rounded-lg border border-border p-2"
                >
                  <div className="h-10 w-10 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                    {ad.media_type === 'video' ? (
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <img src={ad.media_url} alt={ad.title || ''} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {ad.title || 'Sem título'}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{ad.link_url}</p>
                  </div>
                  <button
                    onClick={() => handleStartEdit(ad)}
                    title="Editar"
                    className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(ad)}
                    disabled={busyId === ad.id}
                    title={ad.active ? 'Desativar' : 'Ativar'}
                    className={`shrink-0 h-7 w-7 rounded-md flex items-center justify-center transition-colors ${
                      ad.active
                        ? 'text-emerald-600 hover:bg-emerald-500/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {ad.active ? <Power className="h-3.5 w-3.5" /> : <PowerOff className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(ad)}
                    disabled={busyId === ad.id}
                    title="Remover"
                    className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'add' && (
        <div className="flex flex-col gap-2">
          {editingId && (
            <p className="text-xs font-semibold text-primary mb-1">✏️ A editar anúncio existente</p>
          )}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Título (interno, opcional)</p>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="Ex: Promo Hosting XYZ"
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tipo de media</p>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              {(['image', 'gif', 'video'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setMediaType(type)}
                  disabled={isSubmitting}
                  className={`flex-1 rounded-md py-1.5 text-xs font-semibold capitalize transition-colors ${
                    mediaType === type ? 'bg-background text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ficheiro (imagem/gif/vídeo curto)</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 border border-dashed border-border rounded-lg px-3 py-3 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              {file ? file.name : 'Escolher ficheiro'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] text-muted-foreground uppercase">ou</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Link direto da media</p>
            <input
              type="text"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              disabled={isSubmitting || !!file}
              placeholder="https://..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary disabled:opacity-40"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Link de afiliado (destino do clique)</p>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              disabled={isSubmitting}
              placeholder="https://..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Ordem de exibição</p>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <Button className="w-full mt-1" disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? 'Guardar alterações' : 'Criar anúncio'}
          </Button>
        </div>
      )}
    </div>
  );
}