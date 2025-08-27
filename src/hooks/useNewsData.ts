import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsSource, ReadingStats } from '@/types/news';

const NEWS_SOURCES: NewsSource[] = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International' },
  { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia' },
  { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia' },
];

// Multiple CORS proxy services as fallbacks
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://cors.lol/',
  'https://cors-anywhere.herokuapp.com/',
  'https://thingproxy.freeboard.io/fetch/'
];

export const useNewsData = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const parseRSSFeed = async (source: NewsSource): Promise<NewsArticle[]> => {
    console.log(`Attempting to fetch ${source.name} from ${source.url}`);
    
    // Try each CORS proxy until one works
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      console.log(`Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy}`);
      
      try {
        let response;
        let data;
        
        if (proxy.includes('allorigins.win')) {
          // AllOrigins format
          response = await fetch(`${proxy}${encodeURIComponent(source.url)}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const jsonData = await response.json();
          data = jsonData.contents;
        } else if (proxy.includes('cors.lol')) {
          // CORS.lol format
          response = await fetch(`${proxy}${source.url}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          data = await response.text();
        } else {
          // Standard proxy format
          response = await fetch(`${proxy}${source.url}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/rss+xml, application/xml, text/xml',
            }
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          data = await response.text();
        }
        
        console.log(`Successfully fetched from ${source.name} using proxy ${i + 1}`);
        
        // Parse the RSS data
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data, 'text/xml');
        
        // Check for XML parsing errors
        const parseError = xmlDoc.querySelector('parsererror');
        if (parseError) {
          throw new Error('XML parsing error: ' + parseError.textContent);
        }
        
        const items = xmlDoc.querySelectorAll('item');
        console.log(`Found ${items.length} items in ${source.name} RSS feed`);
        
        if (items.length === 0) {
          console.warn(`No items found in RSS feed for ${source.name}`);
        }
        
        return Array.from(items).map((item, index) => {
          const title = item.querySelector('title')?.textContent || '';
          const description = item.querySelector('description')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || new Date().toISOString();
          
          return {
            id: `${source.name}-${index}-${Date.now()}`,
            title: title.replace(/<!\[CDATA\[|\]\]>/g, '').trim(),
            description: description.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]*>/g, '').trim(),
            link,
            pubDate,
            source: source.name,
            category: source.category,
            isRead: false,
          };
        });
        
      } catch (error) {
        console.error(`Proxy ${i + 1} failed for ${source.name}:`, error);
        
        // If this is the last proxy, throw the error
        if (i === CORS_PROXIES.length - 1) {
          throw error;
        }
        
        // Otherwise, continue to next proxy
        continue;
      }
    }
    
    // This should never be reached, but just in case
    return [];
  };

  const fetchAllNews = useCallback(async (isInitialLoad = true) => {
    console.log('Starting to fetch all news...');
    setLoading(true);
    try {
      const allArticles: NewsArticle[] = [];
      const enabledSources = NEWS_SOURCES.filter(source => source.enabled !== false);
      
      // Calculate time threshold - last 24 hours for initial load, or since last update
      const now = new Date();
      const timeThreshold = isInitialLoad 
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000) // Last 24 hours
        : new Date(now.getTime() - 2 * 60 * 60 * 1000); // Last 2 hours for refreshes
      
      console.log(`Fetching from ${enabledSources.length} enabled sources`);
      console.log(`Time threshold: ${timeThreshold.toISOString()} (${isInitialLoad ? 'last 24h' : 'last 2h'})`);
      
      // Add some demo articles first for immediate display (only on initial load)
      if (isInitialLoad) {
        const demoArticles: NewsArticle[] = [
          {
            id: 'demo-1',
            title: 'Welcome to News Veille Pro - Fetching Last 24 Hours of News',
            description: 'News Veille Pro is now fetching articles from the last 24 hours. The app will then refresh at your chosen interval to get new articles. Click on articles to mark as read, add to favorites, or use AI features.',
            link: 'https://example.com',
            pubDate: new Date().toISOString(),
            source: 'News Veille Pro',
            category: 'Demo',
            isRead: false,
          },
          {
            id: 'demo-2',
            title: 'Time-Based Filtering Active - Only Recent Articles Loaded',
            description: 'The app filters articles to show only those from the last 24 hours on initial load, then refreshes with recent articles based on your settings. Check the browser console for detailed logs.',
            link: 'https://example.com',
            pubDate: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
            source: 'System',
            category: 'Technical',
            isRead: false,
          }
        ];
        
        allArticles.push(...demoArticles);
      }
      
      for (const source of enabledSources) {
        console.log(`Fetching from ${source.name}...`);
        try {
          const sourceArticles = await parseRSSFeed(source);
          console.log(`Got ${sourceArticles.length} total articles from ${source.name}`);
          
          // Filter articles by time threshold
          const recentArticles = sourceArticles.filter(article => {
            const articleDate = new Date(article.pubDate);
            const isRecent = articleDate >= timeThreshold;
            if (!isRecent) {
              console.log(`Filtering out old article: ${article.title} (${articleDate.toISOString()})`);
            }
            return isRecent;
          });
          
          console.log(`Filtered to ${recentArticles.length} recent articles from ${source.name}`);
          allArticles.push(...recentArticles);
        } catch (error) {
          console.error(`Failed to fetch from ${source.name}:`, error);
          // Continue with other sources even if one fails
        }
      }

      console.log(`Total recent articles fetched: ${allArticles.length}`);

      // Sort by date (newest first)
      allArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      
      // Load read status from localStorage
      const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
      const articlesWithReadStatus = allArticles.map(article => ({
        ...article,
        isRead: readArticles.includes(article.link),
      }));

      console.log(`Setting ${articlesWithReadStatus.length} articles with read status`);
      
      // On initial load, replace all articles. On refresh, merge with existing ones
      if (isInitialLoad) {
        setArticles(articlesWithReadStatus);
      } else {
        // Merge new articles with existing ones, avoiding duplicates
        setArticles(prevArticles => {
          const existingLinks = new Set(prevArticles.map(a => a.link));
          const newArticles = articlesWithReadStatus.filter(a => !existingLinks.has(a.link));
          
          const mergedArticles = [...newArticles, ...prevArticles];
          // Keep only articles from last 7 days to prevent storage bloat
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
    refreshNews: () => fetchAllNews(false), // Manual refresh gets recent articles
    getReadingStats,
  };
};