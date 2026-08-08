export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  chart_data: Record<string, any>[] | null;
  chart_type: 'bar' | 'line' | 'pie' | null;
  category: string;
  cover_domain: string | null;
  sources: { title: string; url: string }[] | null;
  created_at: string;
  published: boolean;
}