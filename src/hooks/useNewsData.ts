
import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, ReadingStats } from '@/types/news';

const RSS_PROXIES = [
  'https://api.rss2json.com/v1/api.json?rss_url=',
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://cors.isomorphic-git.org/',
  'https://api.allorigins.win/raw?url=',
  'https://api.allorigins.win/get?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://r.jina.ai/',
];

export const useNewsData = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const markAsRead = useCallback((link: string) => {
    setArticles(prev => 
      prev.map(article => 
        article.link === link ? { ...article, isRead: true } : article
      )
    );
  }, []);

  const fetchRSSFeed = async (url: string, sourceName: string, category: string = 'news'): Promise<NewsArticle[]> => {
    const articles: NewsArticle[] = [];
    
    for (const proxy of RSS_PROXIES) {
      try {
        let proxiedUrl: string;
        let headers: HeadersInit = {
          'Accept': 'application/rss+xml, application/xml, text/xml'
        };

        if (proxy === 'https://api.rss2json.com/v1/api.json?rss_url=') {
          proxiedUrl = proxy + encodeURIComponent(url);
          headers = { 'Accept': 'application/json' };
        } else if (proxy === 'https://r.jina.ai/') {
          proxiedUrl = proxy + url;
          headers = { 'Accept': 'application/rss+xml, application/xml, text/xml' };
        } else {
          proxiedUrl = proxy + encodeURIComponent(url);
        }

        const response = await fetch(proxiedUrl, {
          headers,
          method: 'GET',
          cache: 'no-cache',
        });

        if (!response.ok) continue;

        if (proxy === 'https://api.rss2json.com/v1/api.json?rss_url=') {
          const data = await response.json();
          if (data.status === 'ok' && data.items) {
            return data.items.map((item: any, index: number) => ({
              id: `rss2json-${sourceName}-${index}-${Date.now()}`,
              title: item.title || 'No title',
              description: item.description || item.content || '',
              link: item.link || url,
              pubDate: item.pubDate || new Date().toISOString(),
              source: sourceName,
              category,
              isRead: false,
            })).slice(0, 20);
          }
        } else if (proxy === 'https://api.allorigins.win/get?url=') {
          const data = await response.json();
          if (data.contents) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data.contents, 'text/xml');
            const items = Array.from(doc.querySelectorAll('item'));
            
            return items.map((item, index) => ({
              id: `allorigins-${sourceName}-${index}-${Date.now()}`,
              title: item.querySelector('title')?.textContent || 'No title',
              description: item.querySelector('description')?.textContent || 
                         item.querySelector('content\\:encoded')?.textContent || '',
              link: item.querySelector('link')?.textContent || url,
              pubDate: item.querySelector('pubDate')?.textContent || 
                      item.querySelector('dc\\:date')?.textContent || 
                      new Date().toISOString(),
              source: sourceName,
              category,
              isRead: false,
            })).slice(0, 20);
          }
        } else {
          const xmlText = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(xmlText, 'text/xml');
          const items = Array.from(doc.querySelectorAll('item'));
          
          if (items.length > 0) {
            return items.map((item, index) => ({
              id: `${proxy.split('/')[2]}-${sourceName}-${index}-${Date.now()}`,
              title: item.querySelector('title')?.textContent || 'No title',
              description: item.querySelector('description')?.textContent || 
                         item.querySelector('content\\:encoded')?.textContent || '',
              link: item.querySelector('link')?.textContent || url,
              pubDate: item.querySelector('pubDate')?.textContent || 
                      item.querySelector('dc\\:date')?.textContent || 
                      new Date().toISOString(),
              source: sourceName,
              category,
              isRead: false,
            })).slice(0, 20);
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch ${sourceName} via ${proxy}:`, error);
        continue;
      }
    }
    
    return articles;
  };

  const refreshNews = useCallback(async (forceRefresh = false) => {
    if (loading && !forceRefresh) return;
    
    setLoading(true);
    console.log('Refreshing news...');
    
    try {
      const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
      const rssSources = settings.rssSources || [
        { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'news' },
        { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'news' },
        { name: 'Echorouk Online', url: 'https://www.echoroukonline.com/rss', category: 'news' },
        { name: 'Ennahar Online', url: 'https://www.ennaharonline.com/feed/', category: 'news' },
        { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'news' },
        { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'news' }
      ];

      // Add Facebook sources as RSS sources
      const facebookSources = settings.facebookSources || [];
      const allSources = [...rssSources, ...facebookSources.map((fb: any) => ({
        name: fb.name,
        url: fb.url,
        category: 'facebook'
      }))];

      const enabledSources = allSources.filter(source => source.enabled !== false);
      
      const fetchPromises = enabledSources.map(source => 
        fetchRSSFeed(source.url, source.name, source.category || 'news')
      );

      const results = await Promise.allSettled(fetchPromises);
      const newArticles: NewsArticle[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          newArticles.push(...result.value);
          console.log(`✓ ${enabledSources[index].name}: ${result.value.length} articles`);
        } else {
          console.warn(`✗ ${enabledSources[index].name}: ${result.reason}`);
        }
      });

      // Sort by publication date (newest first)
      newArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      setArticles(newArticles);
      setLastUpdate(new Date());
      
      console.log(`News refresh complete: ${newArticles.length} total articles`);
      
    } catch (error) {
      console.error('Error refreshing news:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const getReadingStats = useCallback((): ReadingStats => {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    const readArticles = articles.filter(a => a.isRead);

    const todayCount = readArticles.filter(a => 
      new Date(a.pubDate) >= startOfToday
    ).length;

    const thisMonthCount = readArticles.filter(a => 
      new Date(a.pubDate) >= startOfMonth
    ).length;

    const thisYearCount = readArticles.filter(a => 
      new Date(a.pubDate) >= startOfYear
    ).length;

    const bySource: Record<string, number> = {};
    const byDay: Record<string, number> = {};

    readArticles.forEach(article => {
      bySource[article.source] = (bySource[article.source] || 0) + 1;
      
      const day = new Date(article.pubDate).toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    return {
      today: todayCount,
      thisMonth: thisMonthCount,
      thisYear: thisYearCount,
      bySource,
      byDay,
    };
  }, [articles]);

  // Initial load
  useEffect(() => {
    refreshNews();
  }, []);

  return {
    articles,
    loading,
    lastUpdate,
    markAsRead,
    refreshNews,
    getReadingStats,
  };
};
