export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source_name: string;
  source_url: string;
  youtube_video_id: string | null;
  cover_image: string | null;
  category: string;
  published_at: string;
  created_at: string;
}