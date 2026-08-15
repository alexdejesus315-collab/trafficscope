import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/blog';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, Clock, Calendar, TrendingUp, ImageOff } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

// Extrai a primeira imagem do conteúdo markdown (![alt](url))
function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  return match ? match[2] : null;
}

export default function Blog() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState<Record<string, { title: string; excerpt: string }>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const showDeleteButton = isOwner(user?.id);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  useEffect(() => {
    if (language === 'pt' || posts.length === 0) {
      setTranslations({});
      setIsTranslating(false);
      return;
    }
    const slugs = posts.map(p => p.slug);
    setIsTranslating(true);
    fetch('/api/blog/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs, language }),
    })
      .then(res => res.json())
      .then(data => { if (data.success) setTranslations(data.translations || {}); })
      .catch(() => {})
      .finally(() => setIsTranslating(false));
  }, [language, posts]);

  const handleDelete = async (slug: string) => {
    if (!confirm(t('blog.confirmDelete'))) return;
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    if (data.success) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } else {
      alert(data.error || t('blog.deleteError'));
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      language === 'pt' ? 'pt-PT' : language === 'en' ? 'en-US' : language === 'es' ? 'es-ES' : 'fr-FR',
      { day: 'numeric', month: 'long', year: 'numeric' }
    );
  };

  const readingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const mins = Math.ceil(words / 200);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const heroPosts = posts.slice(0, 3);
  const listPosts = posts.slice(3);

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
              TrafficScope <span className="text-primary font-light">Blog</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            {isTranslating && (
              <span className="text-xs text-muted-foreground animate-pulse">{t('blog.translating', 'A traduzir...')}</span>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero Section */}
        {heroPosts.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {t('blog.featured', 'Em destaque')}
              </h2>
            </div>

            {heroPosts.length >= 3 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FeaturedCard
                  post={heroPosts[0]}
                  tr={translations[heroPosts[0].slug]}
                  formatDate={formatDate}
                  readingTime={readingTime}
                  showDelete={showDeleteButton}
                  onDelete={handleDelete}
                  size="large"
                />
                <div className="flex flex-col gap-4">
                  <FeaturedCard
                    post={heroPosts[1]}
                    tr={translations[heroPosts[1].slug]}
                    formatDate={formatDate}
                    readingTime={readingTime}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="small"
                  />
                  <FeaturedCard
                    post={heroPosts[2]}
                    tr={translations[heroPosts[2].slug]}
                    formatDate={formatDate}
                    readingTime={readingTime}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="small"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {heroPosts.map(post => (
                  <FeaturedCard
                    key={post.id}
                    post={post}
                    tr={translations[post.slug]}
                    formatDate={formatDate}
                    readingTime={readingTime}
                    showDelete={showDeleteButton}
                    onDelete={handleDelete}
                    size="medium"
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* All Posts */}
        {listPosts.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="h-px flex-1 bg-border" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground px-4">
                {t('blog.allPosts', 'Todos os artigos')}
              </h2>
              <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  tr={translations[post.slug]}
                  formatDate={formatDate}
                  readingTime={readingTime}
                  showDelete={showDeleteButton}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </section>
        )}

        {posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
            <p className="text-lg font-medium">{t('blog.empty.title', 'Nenhum artigo publicado')}</p>
            <p className="text-sm mt-1">{t('blog.empty.subtitle', 'Volte mais tarde para novos conteúdos')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function FeaturedCard({
  post,
  tr,
  formatDate,
  readingTime,
  showDelete,
  onDelete,
  size,
}: {
  post: BlogPost;
  tr?: { title: string; excerpt: string };
  formatDate: (d: string) => string;
  readingTime: (c: string) => string;
  showDelete: boolean;
  onDelete: (s: string) => void;
  size: 'large' | 'small' | 'medium';
}) {
  const displayTitle = tr?.title || post.title;
  const isLarge = size === 'large';
  const coverUrl = extractFirstImage(post.content);

  return (
    <Link
      to={`/blog/${post.slug}`}
      className={`group relative block overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isLarge ? 'h-[420px] lg:h-full' : 'h-[200px]'
      }`}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover opacity-40 group-hover:opacity-50 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
        )}
        <div className={`absolute inset-0 ${
          isLarge
            ? 'bg-gradient-to-t from-black/80 via-black/50 to-black/20'
            : 'bg-gradient-to-r from-black/70 via-black/50 to-transparent'
        }`} />
      </div>

      {/* Content */}
      <div className={`absolute inset-0 flex flex-col justify-end p-6 ${!isLarge && 'p-5'}`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center rounded-full bg-primary/90 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-white/70">
            <Calendar className="h-3 w-3" />
            {formatDate(post.created_at)}
          </span>
        </div>

        <h3 className={`font-bold text-white leading-tight group-hover:text-primary-foreground/90 transition-colors ${
          isLarge ? 'text-2xl lg:text-3xl' : 'text-lg'
        }`}>
          {displayTitle}
        </h3>

        {isLarge && (
          <p className="mt-2 text-sm text-white/70 line-clamp-2 max-w-lg">
            {tr?.excerpt || post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-[11px] text-white/60">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {readingTime(post.content)}
          </span>
        </div>
      </div>

      {showDelete && (
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(post.slug);
          }}
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white/70 hover:text-destructive hover:bg-destructive/20 backdrop-blur-sm transition-colors z-10"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </Link>
  );
}

function PostCard({
  post,
  tr,
  formatDate,
  readingTime,
  showDelete,
  onDelete,
}: {
  post: BlogPost;
  tr?: { title: string; excerpt: string };
  formatDate: (d: string) => string;
  readingTime: (c: string) => string;
  showDelete: boolean;
  onDelete: (s: string) => void;
}) {
  const displayTitle = tr?.title || post.title;
  const displayExcerpt = tr?.excerpt || post.excerpt;
  const coverUrl = extractFirstImage(post.content);

  return (
    <article className="group flex flex-col">
      <Link to={`/blog/${post.slug}`} className="block overflow-hidden rounded-2xl bg-card border border-border hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/5 to-primary/10 flex flex-col items-center justify-center gap-2">
              <ImageOff className="h-8 w-8 text-primary/20" />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sem imagem</span>
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-foreground border border-border/50">
              {post.category}
            </span>
          </div>
          {showDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onDelete(post.slug);
              }}
              className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
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
              {formatDate(post.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {readingTime(post.content)}
            </span>
          </div>

          <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
            {displayTitle}
          </h3>

          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {displayExcerpt}
          </p>

          <div className="mt-4 flex items-center text-xs font-semibold text-primary group-hover:underline">
            Ler artigo
            <svg className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </article>
  );
}