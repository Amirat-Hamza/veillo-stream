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
  priority?: boolean; // VIP sources appear at top
}

export interface ReadingStats {
  today: number;
  thisMonth: number;
  thisYear: number;
  bySource: Record<string, number>;
  byDay: Record<string, number>;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  sources: string[]; // source names
  categories: string[];
  keywords: string[];
  color?: string;
  icon?: string;
}

export interface ReadingListItem {
  id: string;
  articleId: string;
  title: string;
  link: string;
  source: string;
  addedAt: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  notes?: string;
}