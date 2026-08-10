import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/blog';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, Activity, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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

  if (loading) return <div className="p-8 text-center text-muted-foreground">{t('blog.loading')}</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
            aria-label={t('blog.back', 'Voltar')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <a href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Activity className="h-5 w-5 text-foreground" />
            <span className="text-2xl font-bold text-foreground tracking-tight">TrafficScope</span>
          </a>
        </div>
        {isTranslating && (
          <span className="text-xs text-muted-foreground animate-pulse">{t('blog.translating', 'A traduzir...')}</span>
        )}
      </div>
      {posts.map(post => {
        const tr = translations[post.slug];
        const displayTitle = tr?.title || post.title;
        const displayExcerpt = tr?.excerpt || post.excerpt;

        return (
          <div
            key={post.id}
            className="relative block bg-card border border-border rounded-2xl p-5 shadow-2xs hover:shadow-md transition-shadow duration-200"
          >
            {showDeleteButton && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleDelete(post.slug);
                }}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={t('blog.deleteAria')}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <Link to={`/blog/${post.slug}`} className="block pr-8">
              <span className="text-xs font-semibold text-primary">{post.category}</span>
              <h2 className="text-lg font-bold text-foreground mt-1">{displayTitle}</h2>
              <p className="text-sm text-muted-foreground mt-1 italic">"{displayExcerpt}"</p>
            </Link>
          </div>
        );
      })}
    </div>
  );
}