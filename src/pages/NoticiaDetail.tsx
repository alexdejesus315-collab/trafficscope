import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { NewsItem } from '../types/news';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, Calendar, ExternalLink, Radio, PlayCircle, Newspaper, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
export default function NoticiaDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [translated, setTranslated] = useState<{ headline: string; summary: string; content: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
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

  useEffect(() => {
    setTranslated(null);
    if (!slug || language === 'pt') {
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    fetch('/api/news/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: [slug], language, full: true }),
    })
      .then((res) => res.json())
      .then((data) => {
        const tr = data?.translations?.[slug];
        if (tr?.content) setTranslated({ headline: tr.headline, summary: tr.summary, content: tr.content });
      })
      .catch(() => {})
      .finally(() => setIsTranslating(false));
  }, [slug, language]);

  const handleDelete = async () => {
    if (!confirm(t('news.confirmDelete'))) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/news/${item?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      navigate('/noticias');
    } else {
      alert(data.error || t('news.deleteError'));
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
        <Newspaper className="h-12 w-12 text-muted-foreground/20" />
        <p>{t('newsDetail.notFound')}</p>
        <Link to="/noticias" className="text-primary text-sm font-semibold hover:underline">{t('newsDetail.backToNews')}</Link>
      </div>
    );
  }

  const hasVideo = !!item.youtube_video_id;
  const displayHeadline = translated?.headline || item.headline;
  const displaySummary = translated?.summary || item.summary;
  const displayContent = translated?.content || item.content;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/noticias"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a href="/" className="text-xl font-bold tracking-tight text-foreground">
              TrafficScope <span className="text-primary font-light">{t('news.header.title')}</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {showDeleteButton && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('newsDetail.deleteButton')}
            </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden bg-muted">
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt={displayHeadline}
            className="h-full w-full object-cover blur-[2px] scale-105"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-red-500/10 to-orange-500/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />

        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto px-4 w-full pb-8 md:pb-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white">
                <Radio className="h-3 w-3" />
                {item.category}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(item.published_at)}
              </span>
              {isTranslating && (
                <span className="text-xs text-muted-foreground animate-pulse">{t('newsDetail.translating')}</span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-3xl">
              {displayHeadline}
            </h1>

            <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl line-clamp-2">
              {displaySummary}
            </p>

            <div className="flex items-center gap-4 mt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                {t('newsDetail.source')}: {item.source_name}
              </span>
              {hasVideo && (
                <span className="flex items-center gap-1.5 text-red-500 font-medium">
                  <PlayCircle className="h-3.5 w-3.5" />
                  {t('newsDetail.hasVideo')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Video Embed */}
        {hasVideo && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl mb-10 bg-muted border border-border shadow-sm">
            <iframe
              src={`https://www.youtube.com/embed/${item.youtube_video_id}`}
              title={displayHeadline}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* Cover image if no video */}
        {!hasVideo && item.cover_image && (
          <div className="aspect-video w-full overflow-hidden rounded-2xl mb-10 bg-muted border border-border shadow-sm">
            <img src={item.cover_image} alt={displayHeadline} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Article body */}
        <article className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-red-500 prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-red-500 prose-blockquote:bg-red-500/5 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-li:text-muted-foreground">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
        </article>

        {/* CTA Discreto */}
        <div className="mt-14 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            {t('newsDetail.statsVia')}{' '}
            <Link to="/" className="text-red-500/80 hover:text-red-500 font-medium transition-colors">
              TrafficScope →
            </Link>
          </p>
        </div>

        {/* Source CTA */}
        <div className="mt-6 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <ExternalLink className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-sm md:text-base text-foreground font-medium">
                {t('newsDetail.compiledFrom')}
              </p>
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-red-500 hover:underline"
              >
                {t('newsDetail.viewOriginalSource')}: {item.source_name}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}