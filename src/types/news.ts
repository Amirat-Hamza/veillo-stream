export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  source: string;
  category?: string;
  isRead?: boolean;
}

export interface NewsSource {
  name: string;
  url: string;
  category: string;
  enabled?: boolean;
  interval?: number;
}

export interface ReadingStats {
  today: number;
  thisMonth: number;
  thisYear: number;
  bySource: Record<string, number>;
  byDay: Record<string, number>;
}