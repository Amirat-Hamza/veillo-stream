import { useState, useEffect, useCallback } from 'react';
import { NewsArticle, NewsSource, ReadingStats } from '@/types/news';

const NEWS_SOURCES: NewsSource[] = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International' },
  { name: 'Echorouk Online', url: 'https://www.echoroukonline.com/feed/', category: 'Algeria' },
  { name: 'Ennahar Online', url: 'https://www.ennaharonline.com/feed/', category: 'Algeria' },
  { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia' },
  { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia' },
  { name: 'Libya Observer', url: 'https://www.libyaobserver.ly/feed', category: 'Libya' },
  { name: 'Libya Herald', url: 'https://www.libyaherald.com/feed/', category: 'Libya' },
];

// Multiple CORS proxy services as fallbacks (prioritize raw XML to avoid item caps)
const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://cors.isomorphic-git.org/',
  'https://api.allorigins.win/raw?url=',
  'https://api.allorigins.win/get?url=',
  'https://thingproxy.freeboard.io/fetch/',
  'https://r.jina.ai/',
  'https://api.rss2json.com/v1/api.json?rss_url=',
];


// Add reasonable timeouts and pagination caps to avoid long hangs
const REQUEST_TIMEOUT_MS = 10000; // 10s per attempt
const MAX_PAGES_PER_SOURCE = Infinity; // unlimited pagination; will stop when no new items are found
const DAYS_TO_FETCH = 4; // Only fetch articles from the last 4 days

const fetchWithTimeout = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeout = REQUEST_TIMEOUT_MS
): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const resp = await fetch(input, { ...init, signal: controller.signal });
    return resp;
  } finally {
    clearTimeout(id);
  }
};

export const useNewsData = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const parseRSSFeed = async (source: NewsSource): Promise<NewsArticle[]> => {
    console.log(`Attempting to fetch ${source.name} from ${source.url}`);
    
    const u = new URL(source.url);
    const host = u.hostname.replace(/^www\./, '');
    const isCFWordPress = ['echoroukonline.com', 'ennaharonline.com'].includes(host);
    const proxies = isCFWordPress
      ? ['https://api.rss2json.com/v1/api.json?rss_url=', ...CORS_PROXIES.filter(p => !p.includes('rss2json.com'))]
      : CORS_PROXIES;
    
    // Build alternative URL candidates for problematic sources (e.g., Tunisienumerique)
    const urlCandidates: string[] = [source.url];
    if (host.includes('tunisienumerique.com')) {
      const origin = u.origin;
      const alts = [
        `${origin}/feed/`,
        `${origin}/?feed=rss2`,
        `${origin}/feed-actualites-tunisie.xml`,
      ];
      for (const alt of alts) {
        if (!urlCandidates.includes(alt)) urlCandidates.push(alt);
      }
    }
    
    for (const currentUrl of urlCandidates) {
      console.log(`Trying URL candidate: ${currentUrl}`);
      for (let i = 0; i < proxies.length; i++) {
        const proxy = proxies[i];
        console.log(`Trying proxy ${i + 1}/${proxies.length}: ${proxy}`);
        try {
          let response;
          let data: string | any;

          const doFetch = (url: string, init: RequestInit) => fetchWithTimeout(url, init);
          if (proxy.includes('rss2json.com')) {
            // RSS2JSON returns JSON with items array
            response = await doFetch(`${proxy}${encodeURIComponent(currentUrl)}`, {
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
            console.log(`Successfully fetched (rss2json) from ${source.name} using proxy ${i + 1} with count=${json.items?.length ?? 0}`);
            // Map and filter to last 4 days directly
            const fourDaysAgo = new Date();
            fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);
            const mapped = json.items.map((item: any, index: number) => {
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
            }).filter((a: NewsArticle) => new Date(a.pubDate) >= fourDaysAgo);
            return mapped;
          } else if (proxy.includes('allorigins.win/get')) {
            // AllOrigins JSON wrapper
            response = await doFetch(`${proxy}${encodeURIComponent(currentUrl)}`, {
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
            response = await doFetch(`${proxy}${encodeURIComponent(currentUrl)}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
              }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            data = await response.text();
          } else if (proxy.includes('r.jina.ai')) {
            const proxiedUrl = `https://r.jina.ai/${currentUrl}`;
            response = await doFetch(proxiedUrl, {
              method: 'GET',
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
              }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            data = await response.text();
          } else {
            // Standard proxy format
            response = await doFetch(`${proxy}${currentUrl}`, {
              method: 'GET',
              headers: {
                'Accept': 'application/rss+xml, application/xml, text/xml',
              }
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            data = await response.text();
          }
          
          console.log(`Successfully fetched from ${source.name} using proxy ${i + 1}`);
          
          // Parse the RSS/Atom XML (guard against non-XML blocker pages)
          const xmlText = typeof data === 'string' ? data : String(data ?? '');
          if (!xmlText.trim().startsWith('<')) {
            throw new Error('Non-XML response from proxy');
          }
          
          // Sanitize and parse with XML, then fall back to HTML if needed (more forgiving)
          const cleaned = xmlText
            .replace(/&nbsp;/g, ' ')
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
          const parser = new DOMParser();
          let xmlDoc = parser.parseFromString(cleaned, 'text/xml');
          let parseError = xmlDoc.querySelector('parsererror');
          if (parseError) {
            console.warn('XML parsing failed, trying HTML fallback...', parseError.textContent);
            xmlDoc = parser.parseFromString(cleaned, 'text/html');
          }
          
          // Support both RSS <item> and Atom <entry>
          let items = Array.from(xmlDoc.querySelectorAll('item'));
          if (items.length === 0) {
            items = Array.from(xmlDoc.querySelectorAll('entry'));
          }
          console.log(`Found ${items.length} items in ${source.name} feed`);
          
          // Calculate the cutoff date (4 days ago)
          const fourDaysAgo = new Date();
          fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);
          
          const articles = items.map((item, index) => {
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

          // Filter to only include articles from the last 4 days
          const recentArticles = articles.filter(article => {
            const articleDate = new Date(article.pubDate);
            return articleDate >= fourDaysAgo;
          });

          console.log(`Filtered to ${recentArticles.length} articles from last ${DAYS_TO_FETCH} days for ${source.name}`);
          return recentArticles;
        } catch (error) {
          console.error(`Proxy ${i + 1} failed for ${source.name}:`, error);
          continue;
        }
      }
    }
    return [];
  };

  const fetchAllNews = useCallback(async (isInitialLoad = true) => {
    console.log('Starting progressive fetch of ALL articles (including duplicates)...');
    setLoading(true);
    try {
      const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
      const storedSources: NewsSource[] = (Array.isArray(settings.rssSources) && settings.rssSources.length > 0)
        ? settings.rssSources
        : [];
      // Merge stored sources with defaults to include any new defaults (e.g., Libya)
      const norm = (u: string) => (u || '').trim().replace(/\/+$/, '');
      const byUrl = new Map<string, NewsSource>();
      storedSources.forEach(src => {
        const key = norm(src.url);
        byUrl.set(key, { ...src, enabled: src.enabled !== false });
      });
      NEWS_SOURCES.forEach(src => {
        const key = norm(src.url);
        if (!byUrl.has(key)) byUrl.set(key, { ...src, enabled: true });
      });
      const configuredSources: NewsSource[] = Array.from(byUrl.values());
      const enabledSources = configuredSources.filter(source => source.enabled !== false);

      let hasRenderedFirstBatch = false;

      // Helper to apply read status and append to state immediately (avoiding duplicates)
      const appendArticles = (batch: NewsArticle[]): number => {
        if (!batch || batch.length === 0) return 0;
        const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
        const withRead = batch.map(a => ({
          ...a,
          isRead: readArticles.includes(a.link),
        }));

        let addedCount = 0;
        setArticles(prev => {
          const existingLinks = new Set(prev.map(article => article.link));
          const newArticles = withRead.filter(article => !existingLinks.has(article.link));
          addedCount = newArticles.length;
          
          if (newArticles.length === 0) return prev; // No new articles
          
          const combined = [...prev, ...newArticles];
          combined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
          return combined;
        });
        if (!hasRenderedFirstBatch) {
          hasRenderedFirstBatch = true;
          setLoading(false); // show UI as soon as we have something
        }
        return addedCount;
      };

      console.log(`Progressively fetching from ${enabledSources.length} sources`);

      for (const source of enabledSources) {
        console.log(`→ Source: ${source.name}`);
        // 1) Fetch the main feed first (do not abort pagination if this fails)
        let initial: NewsArticle[] = [];
        try {
          initial = await parseRSSFeed(source);
          console.log(`${source.name}: initial batch size ${initial.length}`);
        } catch (e) {
          console.warn(`${source.name}: initial fetch failed`, e);
        }
        appendArticles(initial); // keep duplicates

        // 2) Paginate ONLY for known WordPress domains using /feed/?paged=N or /page/N/?feed=rss2
        try {
          const u = new URL(source.url);
          const wpDomains = new Set(['www.echoroukonline.com','www.ennaharonline.com','www.aljazeera.com']);
          if (wpDomains.has(u.hostname)) {
            const origin = u.origin;
            const isFeedPath = /\/feed\/?($|\?)/.test(u.pathname);

            const buildPagedCandidates = (p: number) => {
              const candidates: string[] = [];
              if (isFeedPath) {
                candidates.push(`${origin}/feed/?paged=${p}`);
                candidates.push(`${origin}/page/${p}/?feed=rss2`);
              } else {
                const sep = source.url.includes('?') ? '&' : '?';
                candidates.push(`${source.url}${sep}paged=${p}`);
                candidates.push(`${origin}/page/${p}/?feed=rss2`);
                candidates.push(`${origin}/feed/?paged=${p}`);
              }
              return candidates;
            };

            let page = initial.length > 0 ? 2 : 1; // if initial failed, start at page 1
            let consecutiveEmpty = 0;
            let consecutiveNoNew = 0;
            let consecutiveOldPages = 0;
            const fourDaysAgo = new Date();
            fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);
            
            while (page <= MAX_PAGES_PER_SOURCE) { // paginate until empty/new items stop
              let pageArticles: NewsArticle[] = [];
              const candidates = buildPagedCandidates(page);

              for (const url of candidates) {
                console.log(`Fetching ${source.name} page ${page}: ${url}`);
                pageArticles = await parseRSSFeed({ ...source, url });
                if (pageArticles.length > 0) break;
              }

              if (pageArticles.length === 0) {
                consecutiveEmpty++;
                console.log(`${source.name}: empty page ${page} (${consecutiveEmpty} in a row)`);
                if (consecutiveEmpty >= 3) {
                  console.log(`${source.name}: reached end after ${consecutiveEmpty} empty pages`);
                  break;
                }
                page++;
                await new Promise(r => setTimeout(r, 200));
                continue;
              } else {
                consecutiveEmpty = 0;
              }

              // Check if all articles in this page are older than 4 days
              const hasRecentArticles = pageArticles.some(article => {
                const articleDate = new Date(article.pubDate);
                return articleDate >= fourDaysAgo;
              });

              if (!hasRecentArticles && pageArticles.length > 0) {
                consecutiveOldPages++;
                console.log(`${source.name}: page ${page} has only old articles (${consecutiveOldPages} in a row)`);
                if (consecutiveOldPages >= 2) {
                  console.log(`${source.name}: stopping - reached articles older than ${DAYS_TO_FETCH} days`);
                  break;
                }
              } else if (hasRecentArticles) {
                consecutiveOldPages = 0;
              }

              const added = appendArticles(pageArticles);
              if (added === 0) {
                consecutiveNoNew++;
                console.log(`${source.name}: no new items at page ${page} (${consecutiveNoNew} in a row)`);
                if (consecutiveNoNew >= 2) {
                  console.log(`${source.name}: stopping after consecutive no-new pages`);
                  break;
                }
              } else {
                consecutiveNoNew = 0;
              }

              page++;
              await new Promise(r => setTimeout(r, 200)); // gentle rate limit
            }
          }
        } catch (err) {
          console.warn(`${source.name}: pagination failed`, err);
        }
      }

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      // Ensure loading is cleared even if nothing was fetched
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
    // Initial load - fetch latest
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
    refreshNews: (full: boolean = true) => fetchAllNews(full),
    getReadingStats,
  };
};
