import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { NewsItem } from '../types/news';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, Calendar, ImageOff, PlayCircle, Radio, Newspaper } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getCategoryLabel } from '../lib/newsCategoryLabels';
export default function Noticias() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
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
    if (!confirm(t('news.confirmDelete'))) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      setItems((prev) => prev.filter((i) => i.id !== id));
    } else {
      alert(data.error || t('news.deleteError'));
    }
  };

  const DATE_LOCALES: Record<string, string> = { pt: 'pt-PT', en: 'en-US', es: 'es-ES', fr: 'fr-FR' };
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString(DATE_LOCALES[language] || 'pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const heroItems = items.slice(0, 3);
  const listItems = items.slice(3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a href="/" className="text-xl font-bold tracking-tight text-foreground">
              TrafficScope <span className="text-primary font-light">{t('news.header.title')}</span>
            </a>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Section */}
        {heroItems.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Radio className="h-4 w-4 text-red-500" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('news.section.latest')}
              </h2>
            </div>

            {heroItems.length >= 3 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FeaturedNewsCard
                  item={heroItems[0]}
                  formatDate={formatDate}
                  showDelete={showDeleteButton}
                  onDelete={handleDelete}
                  size="large"
                />
                <div className="flex flex-col gap-4">
                  <FeaturedNewsCard
                    item={heroItems[1]}
                    formatDate={formatDate}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="small"
                  />
                  <FeaturedNewsCard
                    item={heroItems[2]}
                    formatDate={formatDate}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="small"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {heroItems.map(item => (
                  <FeaturedNewsCard
                    key={item.id}
                    item={item}
                    formatDate={formatDate}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* All News */}
        {listItems.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="h-px flex-1 bg-border" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-4">
                {t('news.section.all')}
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listItems.map(item => (
                <NewsCard
                  key={item.id}
                  item={item}
                  formatDate={formatDate}
                  showDelete={showDeleteButton}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
            <Newspaper className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium">{t('news.empty.title')}</p>
            <p className="text-sm mt-1">{t('news.empty.subtitle')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function FeaturedNewsCard({
  item,
  translated,
  formatDate,
  showDelete,
  onDelete,
  size,
}: {
  item: NewsItem;
  translated?: { headline: string; summary: string };
  formatDate: (d: string) => string;
  showDelete: boolean;
  onDelete: (id: string) => void;
  size: 'large' | 'small' | 'medium';
}) {
  const { language } = useLanguage();
  const isLarge = size === 'large';  const hasVideo = !!item.youtube_video_id;
  const displayHeadline = translated?.headline || item.headline;
  const displaySummary = translated?.summary || item.summary;

  return (
    <Link
      to={`/noticias/${item.slug}`}
      className={`group relative block overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isLarge ? 'h-[420px] lg:h-full' : 'h-[200px]'
      }`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {item.cover_image ? (
          <img
            src={item.cover_image}
            alt=""
            className="h-full w-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-red-500/10 to-orange-500/5" />
        )}
        <div className={`absolute inset-0 ${
          isLarge
            ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/20'
            : 'bg-gradient-to-r from-black/70 via-black/50 to-transparent'
        }`} />
      </div>

      {/* Video Play Icon Overlay */}
      {hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1]">
          <div className={`rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
            isLarge ? 'h-16 w-16' : 'h-10 w-10'
          }`}>
            <PlayCircle className={`text-white drop-shadow-lg ${isLarge ? 'h-8 w-8' : 'h-5 w-5'}`} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-end p-6 ${!isLarge && 'p-5'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center rounded-full bg-red-500/90 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {getCategoryLabel(item.category, language)}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Calendar className="h-3 w-3" />
            {formatDate(item.published_at)}
          </span>
        </div>

        <h3 className={`font-bold text-white leading-tight group-hover:text-red-100 transition-colors ${
          isLarge ? 'text-2xl lg:text-3xl' : 'text-lg'
        }`}>
          {displayHeadline}
        </h3>

        {isLarge && (
          <p className="mt-2 text-sm text-white/70 line-clamp-2 max-w-lg">
            {displaySummary}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            {item.source_name}
          </span>
        </div>
      </div>

      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(item.id);
          }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-destructive hover:bg-destructive/20 backdrop-blur-sm transition-colors z-10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </Link>
  );
}

function NewsCard({
  item,
  translated,
  formatDate,
  showDelete,
  onDelete,
}: {
  item: NewsItem;
  translated?: { headline: string; summary: string };
  formatDate: (d: string) => string;
  showDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const { t, language } = useLanguage();
  const hasVideo = !!item.youtube_video_id;
  const displayHeadline = translated?.headline || item.headline;
  const displaySummary = translated?.summary || item.summary;

  return (
    <article className="group flex flex-col">
      <Link to={`/noticias/${item.slug}`} className="block overflow-hidden rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {item.cover_image ? (
            <img
              src={item.cover_image}
              alt={displayHeadline}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-red-500/5 to-orange-500/10 flex flex-col items-center justify-center gap-2">
              <ImageOff className="h-8 w-8 text-red-500/20" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{t('news.noImage')}</span>
            </div>
          )}
          
          {/* Video Badge */}
          {hasVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
              <div className="rounded-full bg-white/10 backdrop-blur-sm p-2">
                <PlayCircle className="h-6 w-6 text-white drop-shadow-lg" />
              </div>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-red-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white">
              {getCategoryLabel(item.category, language)}
            </span>
          </div>

          {showDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(item.id);
              }}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors z-10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(item.published_at)}
            </span>
            <span className="flex items-center gap-1 text-red-500/80 font-medium">
              <span className="h-1 w-1 rounded-full bg-red-500" />
              {item.source_name}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-red-600 transition-colors line-clamp-2">
            {displayHeadline}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {displaySummary}
          </p>

          <div className="mt-4 flex items-center text-xs font-semibold text-red-500 group-hover:underline">
            {t('news.readMore')}
            <svg className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </article>
  );
}