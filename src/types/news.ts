export interface NewsItem {
  id: string;
  slug: string;
  headline: string;
  summary: string;
  content: string;
  source_name: string;
  source_url: string;
  youtube_video_id: string | null;
  cover_image: string | null;
  category: string;
  published_at: string;
  created_at: string;
}