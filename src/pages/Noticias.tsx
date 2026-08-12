import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { NewsItem } from '../types/news';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, Calendar, ImageOff, PlayCircle } from 'lucide-react';

export default function Noticias() {
  const { user } = useAuth();
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const showDeleteButton = isOwner(user?.id);

  useEffect(() => {
    fetch('/api/news')
      .then((res) => res.json())
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar esta notícia?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert(data.error || 'Falha ao eliminar.');
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <a href="/" className="text-xl font-bold tracking-tight text-foreground">
            TrafficScope <span className="text-primary font-light">Notícias</span>
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
            <p className="text-lg font-medium">Nenhuma notícia disponível</p>
            <p className="text-sm mt-1">Volte mais tarde para atualizações</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                formatDate={formatDate}
                showDelete={showDeleteButton}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function NewsCard({
  item,
  formatDate,
  showDelete,
  onDelete,
}: {
  item: NewsItem;
  formatDate: (d: string) => string;
  showDelete: boolean;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-300">
      <Link to={`/noticias/${item.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden bg-muted">
          {item.cover_image ? (
            <img src={item.cover_image} alt={item.headline} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center gap-2">
              <ImageOff className="h-8 w-8 text-primary/20" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sem imagem</span>
            </div>
          )}
          {item.youtube_video_id && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <PlayCircle className="h-10 w-10 text-white drop-shadow-lg" />
            </div>
          )}
          {showDelete && (
            <button
              onClick={(e) => { e.preventDefault(); onDelete(item.id); }}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
              {item.category}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.published_at)}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {item.headline}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {item.summary}
          </p>
        </div>
      </Link>
    </article>
  );
}