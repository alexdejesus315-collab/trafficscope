import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/blog';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2, Activity } from 'lucide-react';

export default function Blog() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const showDeleteButton = isOwner(user?.id);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('published', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setPosts(data || []); setLoading(false); });
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('Eliminar este artigo permanentemente? Esta ação não pode ser desfeita.')) return;

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();

    if (data.success) {
      setPosts((prev) => prev.filter((p) => p.slug !== slug));
    } else {
      alert(data.error || 'Erro ao eliminar artigo.');
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">A carregar...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <a href="/" className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Activity className="h-5 w-5 text-foreground" />
        <span className="text-2xl font-bold text-foreground tracking-tight">TrafficScope</span>
      </a>
      {posts.map(post => (
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
              aria-label="Eliminar artigo"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
          <Link to={`/blog/${post.slug}`} className="block pr-8">
            <span className="text-xs font-semibold text-primary">{post.category}</span>
            <h2 className="text-lg font-bold text-foreground mt-1">{post.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 italic">"{post.excerpt}"</p>
          </Link>
        </div>
      ))}
    </div>
  );
}