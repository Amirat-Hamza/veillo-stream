import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsSource, ReadingStats } from '@/types/news';

const NEWS_SOURCES: NewsSource[] = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International' },
  { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia' },
  { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia' },
];

// Multiple CORS proxy services as fallbacks (prioritize ones that work reliably)
const CORS_PROXIES = [
  // Returns raw XML (best for RSS parsing)
  'https://api.allorigins.win/raw?url=',
  // JSON RSS transformation (no CORS issues; different parsing path)
  'https://api.rss2json.com/v1/api.json?rss_url=',
  // AllOrigins JSON wrapper (we handle .contents)
  'https://api.allorigins.win/get?url=',
  // Other generic proxies
  'https://thingproxy.freeboard.io/fetch/',
  'https://cors.lol/',
  'https://cors-anywhere.herokuapp.com/',
];

export const useNewsData = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const parseRSSFeed = async (source: NewsSource): Promise<NewsArticle[]> => {
    console.log(`Attempting to fetch ${source.name} from ${source.url}`);
    
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy}`);
      
      try {
        let response;
        let data: string | any;

        if (proxy.includes('rss2json.com')) {
          // RSS2JSON returns JSON with items array
          response = await fetch(`${proxy}${encodeURIComponent(source.url)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const json = await response.json();
          if (json.status !== 'ok' || !Array.isArray(json.items)) {
            throw new Error('Invalid rss2json response');
          }
          console.log(`Successfully fetched (rss2json) from ${source.name} using proxy ${i + 1}`);
          return json.items.map((item: any, index: number) => {
            const title = item.title || '';
            const description = (item.description || '').replace(/<[^>]*>/g, '');
            const link = item.link || '';
            const pubDate = item.pubDate || new Date().toISOString();
            return {
              id: `${source.name}-${index}-${Date.now()}`,
              title: title.trim(),
              description: description.trim(),
              link,
              pubDate,
              source: source.name,
              category: source.category,
              isRead: false,
            } as NewsArticle;
          });
        } else if (proxy.includes('allorigins.win/get')) {
          // AllOrigins JSON wrapper
          response = await fetch(`${proxy}${encodeURIComponent(source.url)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          const jsonData = await response.json();
          data = jsonData.contents as string;
        } else if (proxy.includes('allorigins.win/raw')) {
          // AllOrigins raw passthrough
          response = await fetch(`${proxy}${encodeURIComponent(source.url)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml',
            }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          data = await response.text();
        } else {
          // Standard proxy format
          response = await fetch(`${proxy}${source.url}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml',
            }
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          data = await response.text();
        }
        
        console.log(`Successfully fetched from ${source.name} using proxy ${i + 1}`);
        
        // Parse the RSS/Atom XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data as string, 'text/xml');
        
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) throw new Error('XML parsing error: ' + parseError.textContent);
        
        // Support both RSS <item> and Atom <entry>
        let items = Array.from(xmlDoc.querySelectorAll('item'));
        if (items.length === 0) {
          items = Array.from(xmlDoc.querySelectorAll('entry'));
        }
        console.log(`Found ${items.length} items in ${source.name} feed`);
        
        return items.map((item, index) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent
            || item.querySelector('summary')?.textContent
            || '';
          const link =
            item.querySelector('link')?.getAttribute('href') // Atom
            || item.querySelector('link')?.textContent        // RSS
            || '';
          const pubDate =
            item.querySelector('pubDate')?.textContent
            || item.querySelector('updated')?.textContent
            || item.querySelector('published')?.textContent
            || new Date().toISOString();
          
          return {
            id: `${source.name}-${index}-${Date.now()}`,
            title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
            description: (description || '').replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim(),
            link,
            pubDate,
            source: source.name,
            category: source.category,
            isRead: false,
          } as NewsArticle;
        });
      } catch (error) {
        console.error(`Proxy ${i + 1} failed for ${source.name}:`, error);
        if (i === CORS_PROXIES.length - 1) {
          throw error;
        }
        continue;
      }
    }
    return [];
  };

  const fetchAllNews = useCallback(async (isInitialLoad = true) => {
    console.log('Starting to fetch all news...');
    setLoading(true);
    try {
      const allArticles: NewsArticle[] = [];
      const enabledSources = NEWS_SOURCES.filter(source => source.enabled !== false);
      
      const now = new Date();
      const timeThreshold = isInitialLoad 
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        : new Date(now.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours for refreshes
      
      console.log(`Fetching from ${enabledSources.length} enabled sources`);
      console.log(`Time threshold: ${timeThreshold.toISOString()} (${isInitialLoad ? 'last 24h' : 'last 2h'})`);
      
      for (const source of enabledSources) {
        console.log(`Fetching from ${source.name}...`);
        try {
          const sourceArticles = await parseRSSFeed(source);
          console.log(`Got ${sourceArticles.length} total articles from ${source.name}`);
          
          const recentArticles = sourceArticles.filter(article => {
            const articleDate = new Date(article.pubDate);
            const isRecent = articleDate >= timeThreshold && article.link;
            if (!isRecent) {
              console.log(`Filtering out old/invalid article: ${article.title} (${articleDate.toISOString()})`);
            }
            return isRecent;
          });
          
          console.log(`Filtered to ${recentArticles.length} recent articles from ${source.name}`);
          allArticles.push(...recentArticles);
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
        }
      }

      console.log(`Total recent articles fetched: ${allArticles.length}`);

      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
      const articlesWithReadStatus = allArticles.map(article => ({
        ...article,
        isRead: readArticles.includes(article.link),
      }));

      console.log(`Setting ${articlesWithReadStatus.length} articles with read status`);
      
      if (isInitialLoad) {
        setArticles(articlesWithReadStatus);
      } else {
        setArticles(prevArticles => {
          const existingLinks = new Set(prevArticles.map(a => a.link));
          const newArticles = articlesWithReadStatus.filter(a => !existingLinks.has(a.link));
          
          const mergedArticles = [...newArticles, ...prevArticles];
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const filteredArticles = mergedArticles.filter(a => new Date(a.pubDate) >= sevenDaysAgo);
          
          console.log(`Added ${newArticles.length} new articles, total: ${filteredArticles.length}`);
          return filteredArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
        });
      }
      
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
    // Initial load - fetch last 24 hours
    fetchAllNews(true);
    
    // Set up auto-refresh based on user settings (default 15 minutes)
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    const refreshInterval = (settings.refreshInterval || 15) * 60 * 1000;
    console.log(`Setting up auto-refresh every ${settings.refreshInterval || 15} minutes`);
    
    const interval = setInterval(() => fetchAllNews(false), refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAllNews]);

  return {
    articles,
    loading,
    lastUpdate,
    markAsRead,
    refreshNews: () => fetchAllNews(false),
    getReadingStats,
  };
};
