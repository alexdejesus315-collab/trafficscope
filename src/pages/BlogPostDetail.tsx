import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/blog';
import { BlogChart } from '../components/BlogChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, ArrowLeft, ArrowRight, Clock, Calendar, TrendingUp, ExternalLink, BookOpen, PenSquare } from 'lucide-react';import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import ArticleEditor from '../components/ArticleEditor';
import { getBlogCategoryLabel } from '../lib/blogCategoryLabels';

function stripFootnoteArtifacts(content: string): string {
  return content
    .replace(/\[\^\d+\]:\s*(?:\[[^\]]*\]|\S+)\s*/g, '')
    .replace(/\[\^\d+\]/g, '')
    .trim();
}
function extractFirstImage(content: string): string | null {
  const match = content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
  return match ? match[2] : null;
}

export default function BlogPostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [translated, setTranslated] = useState<{ title: string; excerpt: string; content: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const showDeleteButton = isOwner(user?.id);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('slug', slug).single()
      .then(({ data }) => setPost(data));
  }, [slug]);

  useEffect(() => {
    setTranslated(null);
    if (!slug || language === 'pt') {
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);
    fetch('/api/blog/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slugs: [slug], language, full: true }),
    })
      .then(res => res.json())
      .then(data => {
        const tr = data?.translations?.[slug];
        if (tr?.content) setTranslated({ title: tr.title, excerpt: tr.excerpt, content: tr.content });
      })
      .catch(() => {})
      .finally(() => setIsTranslating(false));
  }, [slug, language]);

  const handleDelete = async () => {
    if (!confirm(t('blog.confirmDelete'))) return;

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();

    if (data.success) {
      navigate('/blog');
    } else {
      alert(data.error || t('blog.deleteError'));
    }
  };

  const handleSaveEdit = async ({ title, markdown, sources }: { title: string; markdown: string; sources: { title: string; url: string }[] }) => {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ title, content: markdown, sources }),
    });
    const data = await res.json();

    if (data.success) {
      setPost(data.post);
      setIsEditing(false);
    } else {
      throw new Error(data.error || 'Falha ao guardar alterações.');
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

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const firstDomainName = post.chart_data?.[0]?.name || '';
  const displayTitle = translated?.title || post.title;
  const displayExcerpt = translated?.excerpt || post.excerpt;
  const displayContent = stripFootnoteArtifacts(translated?.content || post.content);
  const coverUrl = extractFirstImage(post.content);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/blog"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a href="/" className="text-xl font-bold tracking-tight text-foreground">
              TrafficScope <span className="text-primary font-light">Blog</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {showDeleteButton && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('blogPost.deleteButton', 'Eliminar')}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative w-full overflow-hidden bg-muted">
        <div className="absolute inset-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={displayTitle}
              className="h-full w-full object-cover blur-[2px] scale-105"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-primary/5" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        </div>

        <div className="relative min-h-[320px] md:min-h-[420px] flex items-end">
          <div className="max-w-4xl mx-auto px-4 w-full pb-8 md:pb-12 pt-24">
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                {getBlogCategoryLabel(post.category, language)}
              </span>
              {isTranslating && (
                <span className="text-xs text-muted-foreground animate-pulse">{t('blogPost.translating', 'A traduzir...')}</span>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight max-w-3xl">
              {displayTitle}
            </h1>

            <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
              {displayExcerpt}
            </p>

            <div className="flex items-center gap-4 mt-5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                {readingTime(post.content)}
              </span>
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                {post.chart_data?.length || 0} {t('blogPost.companiesCited', 'empresas citadas')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-10 md:py-14">
        {/* Companies cited */}
        {post.chart_data && post.chart_data.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-10 p-4 rounded-2xl bg-card border border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('blogPost.citedCompanies')}
            </span>
            <div className="flex items-center gap-2">
              {post.chart_data.map((d: any) => (
                <div
                  key={d.name}
                  className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 border border-border/50"
                >
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${d.name}&sz=64`}
                    alt={d.name}
                    className="h-4 w-4 rounded-full"
                  />
                  <span className="text-xs font-medium text-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chart */}
        {post.chart_data && post.chart_type && (
          <div className="mb-10">
            <BlogChart data={post.chart_data} type={post.chart_type as any} />
          </div>
        )}

        {/* Article body */}
        <article className="prose prose-lg max-w-none text-foreground prose-headings:text-foreground prose-headings:font-bold prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted-foreground prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-li:text-muted-foreground prose-table:text-sm prose-th:bg-muted prose-th:font-semibold prose-td:border-border">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{displayContent}</ReactMarkdown>
        </article>

        {/* CTA */}
        <div className="mt-14 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm md:text-base text-foreground font-medium">
                {firstDomainName
                  ? t('blogPost.cta.text', undefined, { domain: firstDomainName })
                  : t('blogPost.cta.textGeneric')}
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:underline"
              >
                {t('blogPost.cta.link')}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Affiliate */}
        {post.affiliate_link && (
          <div className="mt-6 p-6 rounded-2xl bg-card border border-border flex items-center gap-4">
            {firstDomainName && (
              <img
                src={`https://www.google.com/s2/favicons?domain=${firstDomainName}&sz=128`}
                alt={firstDomainName}
                className="h-12 w-12 rounded-xl border border-border bg-background object-contain shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{t('blogPost.affiliate.title')}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t('blogPost.affiliate.desc', undefined, { domain: firstDomainName })}</p>
            </div>
            <a
              href={post.affiliate_link}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1.5 shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('blogPost.affiliate.link')}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Sources */}
        {post.sources && post.sources.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              {t('blogPost.sources')}
            </h3>
            <ul className="space-y-2">
              {post.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    {s.title}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>

      {isEditing && (
        <ArticleEditor
          initialContent={post.content}
          initialTitle={post.title}
          initialSources={post.sources || []}
          onSave={handleSaveEdit}
          onClose={() => setIsEditing(false)}
          heading="Editar artigo"
        />
      )}
    </div>
  );
}