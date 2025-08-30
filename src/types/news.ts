
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
  type?: 'rss' | 'facebook'; // Add type to distinguish source types
}

export interface FacebookSource {
  name: string;
  url: string;
  type: 'facebook';
  enabled?: boolean;
}

export interface ReadingStats {
  today: number;
  thisMonth: number;
  thisYear: number;
  bySource: Record<string, number>;
  byDay: Record<string, number>;
}
