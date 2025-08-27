import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsSource, ReadingStats } from '@/types/news';

const NEWS_SOURCES: NewsSource[] = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International' },
  { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia' },
  { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia' },
];

const CORS_PROXY = 'https://api.allorigins.win/get?url=';

export const useNewsData = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const parseRSSFeed = async (source: NewsSource): Promise<NewsArticle[]> => {
    try {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(source.url)}`);
      const data = await response.json();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.contents, 'text/xml');
      
      const items = xmlDoc.querySelectorAll('item');
      return Array.from(items).map((item, index) => {
        const title = item.querySelector('title')?.textContent || '';
        const description = item.querySelector('description')?.textContent || '';
        const link = item.querySelector('link')?.textContent || '';
        const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
        
        return {
          id: `${source.name}-${index}-${Date.now()}`,
          title: title.replace(/<!\[CDATA\[|\]\]>/g, ''),
          description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, ''),
          link,
          pubDate,
          source: source.name,
          category: source.category,
          isRead: false,
        };
      });
    } catch (error) {
      console.error(`Error fetching ${source.name}:`, error);
      return [];
    }
  };

  const fetchAllNews = useCallback(async () => {
    setLoading(true);
    try {
      const allArticles: NewsArticle[] = [];
      
      for (const source of NEWS_SOURCES) {
        const sourceArticles = await parseRSSFeed(source);
        allArticles.push(...sourceArticles);
      }

      // Sort by date (newest first)
      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      // Load read status from localStorage
      const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
      const articlesWithReadStatus = allArticles.map(article => ({
        ...article,
        isRead: readArticles.includes(article.link),
      }));

      setArticles(articlesWithReadStatus);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback((articleLink: string) => {
    const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
    if (!readArticles.includes(articleLink)) {
      readArticles.push(articleLink);
      localStorage.setItem('readArticles', JSON.stringify(readArticles));
      
      // Update reading stats
      const today = new Date().toISOString().split('T')[0];
      const stats = JSON.parse(localStorage.getItem('readingStats') || '{}');
      stats[today] = (stats[today] || 0) + 1;
      localStorage.setItem('readingStats', JSON.stringify(stats));
    }

    setArticles(prev => 
      prev.map(article => 
        article.link === articleLink ? { ...article, isRead: true } : article
      )
    );
  }, []);

  const getReadingStats = useCallback((): ReadingStats => {
    const readingStats = JSON.parse(localStorage.getItem('readingStats') || '{}');
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = new Date().toISOString().substring(0, 7);
    const thisYear = new Date().getFullYear().toString();

    const todayCount = readingStats[today] || 0;
    const thisMonthCount = Object.keys(readingStats)
      .filter(date => date.startsWith(thisMonth))
      .reduce((sum, date) => sum + readingStats[date], 0);
    const thisYearCount = Object.keys(readingStats)
      .filter(date => date.startsWith(thisYear))
      .reduce((sum, date) => sum + readingStats[date], 0);

    const bySource: Record<string, number> = {};
    articles.filter(a => a.isRead).forEach(article => {
      bySource[article.source] = (bySource[article.source] || 0) + 1;
    });

    return {
      today: todayCount,
      thisMonth: thisMonthCount,
      thisYear: thisYearCount,
      bySource,
      byDay: readingStats,
    };
  }, [articles]);

  useEffect(() => {
    fetchAllNews();
    
    // Set up auto-refresh every 15 minutes
    const interval = setInterval(fetchAllNews, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllNews]);

  return {
    articles,
    loading,
    lastUpdate,
    markAsRead,
    refreshNews: fetchAllNews,
    getReadingStats,
  };
};