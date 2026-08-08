import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { BlogPost } from '../types/blog';
import { BlogChart } from '../components/BlogChart';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../hooks/useAuth';
import { isOwner } from '../lib/ownerConfig';
import { Trash2 } from 'lucide-react';

export default function BlogPostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const showDeleteButton = isOwner(user?.id);

  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('slug', slug).single()
      .then(({ data }) => setPost(data));
  }, [slug]);

  const handleDelete = async () => {
    if (!confirm('Eliminar este artigo permanentemente? Esta ação não pode ser desfeita.')) return;

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/blog/${slug}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();

    if (data.success) {
      navigate('/blog');
    } else {
      alert(data.error || 'Erro ao eliminar artigo.');
    }
  };

  if (!post) return <div className="p-8 text-center text-muted-foreground">A carregar...</div>;

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs font-semibold text-primary">{post.category}</span>
        {showDeleteButton && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar artigo
          </button>
        )}
      </div>
      <h1 className="text-2xl font-bold text-foreground mt-1 mb-4">{post.title}</h1>
{post.chart_data && post.chart_data.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 my-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresas citadas:</span>
          {post.chart_data.map((d: any) => (
            <img
              key={d.name}
              src={`https://www.google.com/s2/favicons?domain=${d.name}&sz=64`}
              alt={d.name}
              title={d.name}
              className="h-6 w-6 rounded-full border border-border bg-background object-contain"
            />
          ))}
        </div>
      )}
      {post.chart_data && <BlogChart data={post.chart_data} type={post.chart_type as any} />}      <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-table:text-xs prose-th:bg-muted">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {post.sources && post.sources.length > 0 && (
        <div className="mt-8 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Fontes</p>
          <ul className="space-y-1">
            {post.sources.map((s, i) => (
              <li key={i} className="text-xs">
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}