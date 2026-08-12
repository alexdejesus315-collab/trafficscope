import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { NewsItem } from '../types/news';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, Calendar, ExternalLink } from 'lucide-react';

export default function NoticiaDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const showDeleteButton = isOwner(user?.id);

  useEffect(() => {
    fetch(`/api/news/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        setItem(data.item || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm('Eliminar esta notícia?')) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/news/${item?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      navigate('/noticias');
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

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p>Notícia não encontrada.</p>
        <Link to="/noticias" className="text-primary text-sm font-semibold hover:underline">Voltar às notícias</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/noticias"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a href="/" className="text-xl font-bold tracking-tight text-foreground">
              TrafficScope <span className="text-primary font-light">Notícias</span>
            </a>
          </div>
          {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Eliminar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {item.category}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(item.published_at)}
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight mb-6">
          {item.headline}
        </h1>

        {item.youtube_video_id ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl mb-8 bg-muted">
            <iframe
              src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
              title={item.headline}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : item.cover_image ? (
          <div className="aspect-video w-full overflow-hidden rounded-2xl mb-8 bg-muted">
            <img src={item.cover_image} alt={item.headline} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <article className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{item.content}</ReactMarkdown>
        </article>

        <div className="mt-10 pt-6 border-t border-border">
          <a
            href={item.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            Fonte original: {item.source_name}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}