
import { NewsArticle } from '@/types/news';

const CORS_PROXIES = [
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
  // Added: text proxy that often bypasses CORS for public pages
  'https://r.jina.ai/',
];

const REQUEST_TIMEOUT_MS = 15000;
const DAYS_TO_FETCH = 4;

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

export const scrapeFacebookPage = async (pageUrl: string, pageName: string): Promise<NewsArticle[]> => {
  console.log(`Attempting to scrape Facebook page: ${pageName} from ${pageUrl}`);
  
  // Try to convert Facebook page URL to a scrapable format
  let scrapableUrl = pageUrl;
  
  // Handle different Facebook URL formats
  if (pageUrl.includes('facebook.com/')) {
    const urlParts = pageUrl.split('facebook.com/')[1];
    const pageId = urlParts.split('/')[0].split('?')[0];

    // Try multiple variants: desktop, m, and mbasic with and without /posts
    const urlCandidates = [
      `https://www.facebook.com/${pageId}`,
      `https://www.facebook.com/${pageId}/posts`,
      `https://m.facebook.com/${pageId}`,
      `https://m.facebook.com/${pageId}/posts`,
      `https://mbasic.facebook.com/${pageId}`,
      `https://mbasic.facebook.com/${pageId}/posts`,
      pageUrl,
    ];
    
    for (const url of urlCandidates) {
      console.log(`Trying Facebook URL: ${url}`);
      
      for (const proxy of CORS_PROXIES) {
        try {
          // Build proxied URL; r.jina.ai expects full URL appended without encoding
          const proxiedUrl = proxy.includes('r.jina.ai/')
            ? `${proxy}${url}`
            : `${proxy}${encodeURIComponent(url)}`;

          const response = await fetchWithTimeout(proxiedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.8',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              // Note: r.jina.ai may ignore headers; safe to include for other proxies
            }
          });
          
          if (!response.ok) {
            console.warn(`Non-OK response (${response.status}) for ${url} via ${proxy}`);
            continue;
          }
          
          const html = await response.text();
          const articles = extractPostsFromFacebookHTML(html, pageName, url);
          
          if (articles.length > 0) {
            console.log(`Successfully scraped ${articles.length} posts from ${pageName}`);
            return articles;
          }
        } catch (error) {
          console.warn(`Failed to scrape ${url} with proxy ${proxy}:`, error);
          continue;
        }
      }
    }
  }
  
  console.warn(`Could not scrape any posts from Facebook page: ${pageName}`);
  return [];
};

const extractPostsFromFacebookHTML = (html: string, pageName: string, pageUrl: string): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);
  
  try {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Try different selectors for Facebook posts (include mobile/mbasic variants)
    const postSelectors = [
      // mbasic/m variants
      'div[id^="m_story_permalink_view"] article',
      'div[id^="m_story_permalink_view"]',
      'article',
      'div[data-ft]', // often present in mobile stories
      // desktop variants
      '[data-pagelet="FeedUnit"]',
      '[data-testid="fbfeed_story"]',
      '.userContentWrapper',
      '.story_body_container',
      '[role="article"]',
      '.timeline-story',
      '.post',
    ];
    
    let posts: Element[] = [];
    
    for (const selector of postSelectors) {
      posts = Array.from(doc.querySelectorAll(selector));
      if (posts.length > 0) {
        console.log(`Found ${posts.length} posts using selector: ${selector}`);
        break;
      }
    }
    
    // If no posts found with selectors, try to extract from script tags (JSON-LD or similar)
    if (posts.length === 0) {
      const scriptTags = doc.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scriptTags) {
        try {
          const jsonData = JSON.parse(script.textContent || '');
          if (jsonData['@type'] === 'Article' || jsonData.headline) {
            const article: NewsArticle = {
              id: `fb-${pageName}-${Date.now()}-${articles.length}`,
              title: jsonData.headline || jsonData.name || 'Facebook Post',
              description: jsonData.description || jsonData.text || '',
              link: jsonData.url || pageUrl,
              pubDate: jsonData.datePublished || jsonData.dateModified || new Date().toISOString(),
              source: pageName,
              category: 'Facebook',
              isRead: false,
            };
            
            const articleDate = new Date(article.pubDate);
            if (articleDate >= fourDaysAgo) {
              articles.push(article);
            }
          }
        } catch (e) {
          // Continue to next script tag
        }
      }
    }
    
    // Extract posts from DOM elements
    posts.forEach((post, index) => {
      try {
        // Try to extract post text
        const textSelectors = [
          // desktop
          '[data-testid="post_message"]',
          '.userContent',
          '.text_exposed_show',
          '.story_body_container p',
          // mobile/mbasic
          'div > p',
          'span',
          // generic
          'p',
          '.post-content',
        ];
        
        let postText = '';
        for (const textSelector of textSelectors) {
          const textElement = post.querySelector(textSelector);
          if (textElement?.textContent?.trim()) {
            postText = textElement.textContent.trim();
            break;
          }
        }
        
        // Try to extract timestamp
        const timeSelectors = [
          // desktop
          '[data-testid="story-subtitle"] time',
          'time',
          '.timestamp',
          '[data-utime]',
          '.story_body_container time',
          // mobile/mbasic variants
          'abbr', // e.g., relative time on mobile
        ];
        
        let timestamp = new Date().toISOString();
        for (const timeSelector of timeSelectors) {
          const timeElement = post.querySelector(timeSelector);
          if (timeElement) {
            const timeValue = timeElement.getAttribute('datetime') || 
                            timeElement.getAttribute('data-utime') || 
                            timeElement.getAttribute('title') ||
                            timeElement.textContent;
            if (timeValue) {
              try {
                // Handle Unix timestamp
                if (/^\d{10}$/.test(timeValue)) {
                  timestamp = new Date(parseInt(timeValue) * 1000).toISOString();
                } else {
                  const parsed = new Date(timeValue);
                  if (!isNaN(parsed.getTime())) {
                    timestamp = parsed.toISOString();
                  }
                }
                break;
              } catch (e) {
                // Continue with current timestamp
              }
            }
          }
        }
        
        // Try to extract link
        const linkSelectors = [
          'a[href*="/posts/"]',
          'a[href*="/story.php"]',
          'a[href*="fbid="]',
          '.story_body_container a',
          // mobile/mbasic sometimes uses absolute links on anchors
          'a[href*="facebook.com"]',
        ];
        
        let postLink = pageUrl;
        for (const linkSelector of linkSelectors) {
          const linkElement = post.querySelector(linkSelector);
          if (linkElement?.getAttribute('href')) {
            let href = linkElement.getAttribute('href') || '';
            if (href.startsWith('/')) {
              href = 'https://www.facebook.com' + href;
            }
            postLink = href;
            break;
          }
        }
        
        if (postText.length > 10) { // Only include posts with meaningful content
          const article: NewsArticle = {
            id: `fb-${pageName}-${index}-${Date.now()}`,
            title: postText.substring(0, 100) + (postText.length > 100 ? '...' : ''),
            description: postText,
            link: postLink,
            pubDate: timestamp,
            source: pageName,
            category: 'facebook', // normalized to lowercase to match filtering
            isRead: false,
          };
          
          const articleDate = new Date(article.pubDate);
          if (articleDate >= fourDaysAgo) {
            articles.push(article);
          }
        }
      } catch (error) {
        console.warn(`Error extracting post ${index}:`, error);
      }
    });
    
    // If still no articles, try a more aggressive text extraction
    if (articles.length === 0) {
      const allText = doc.body?.textContent || '';
      const sentences = allText.split(/[.!?]+/).filter(s => s.trim().length > 50);
      
      sentences.slice(0, 5).forEach((sentence, index) => {
        if (sentence.trim()) {
          articles.push({
            id: `fb-fallback-${pageName}-${index}-${Date.now()}`,
            title: sentence.trim().substring(0, 100) + '...',
            description: sentence.trim(),
            link: pageUrl,
            pubDate: new Date().toISOString(),
            source: pageName,
            category: 'facebook',
            isRead: false,
          });
        }
      });
    }
    
  } catch (error) {
    console.error('Error parsing Facebook HTML:', error);
  }
  
  return articles.slice(0, 20); // Limit to 20 most recent posts
};
