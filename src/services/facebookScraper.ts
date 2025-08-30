
import { NewsArticle } from '@/types/news';

// Prioritize the text proxy first; it's often the only one that works client-side
const CORS_PROXIES = [
  'https://r.jina.ai/', // text-only proxy (no CORS issues, returns readable content)
  'https://api.codetabs.com/v1/proxy?quest=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://thingproxy.freeboard.io/fetch/',
];

// Public RSSHub instances to try as a fallback for Facebook pages
const RSSHUB_INSTANCES = [
  'https://rsshub.app',
  'https://rsshub.moeyy.xyz',
  'https://rsshub.woodland.cafe',
];

const REQUEST_TIMEOUT_MS = 20000;
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

// Enhanced text cleaning to extract readable content from HTML
const cleanText = (text: string): string => {
  if (!text) return '';
  
  // Remove HTML tags and their content
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<[^>]*>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/&apos;/g, "'");
  
  // Remove JavaScript-like patterns and technical content
  text = text.replace(/function\s*\([^)]*\)\s*\{[^}]*\}/g, '');
  text = text.replace(/\{[^}]*:\s*[^}]*\}/g, '');
  text = text.replace(/require\([^)]*\)/g, '');
  text = text.replace(/console\.[a-z]+\([^)]*\)/gi, '');
  text = text.replace(/\$\([^)]*\)/g, '');
  text = text.replace(/jQuery\([^)]*\)/g, '');
  
  // Remove URLs and technical patterns
  text = text.replace(/https?:\/\/[^\s]+/g, '');
  text = text.replace(/www\.[^\s]+/g, '');
  text = text.replace(/\b\d{10,}\b/g, ''); // Remove long numbers
  text = text.replace(/[a-f0-9]{8,}/gi, ''); // Remove hex strings
  
  // Remove Facebook-specific technical terms
  text = text.replace(/\b(data-[a-z-]+|aria-[a-z-]+|role|class|id)="[^"]*"/gi, '');
  text = text.replace(/\b(onclick|onload|onerror)\s*=\s*[^>\s]+/gi, '');
  
  // Clean up punctuation and spaces
  text = text.replace(/[{}()[\]]/g, ' ');
  text = text.replace(/[;,.:!?]+/g, '. ');
  text = text.replace(/\s+/g, ' ');
  text = text.replace(/\.\s*\.\s*/g, '. ');
  
  return text.trim();
};

// Enhanced content validation
const isValidContent = (text: string): boolean => {
  if (!text || text.length < 15) return false;

  // Check for meaningful sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length === 0) return false;

  // Reject technical keywords (but allow some Facebook-related terms)
  const technicalKeywords = ['function', 'require', 'bootstrap', 'console', 'jquery', 'onclick', 'data-'];
  const keywordCount = technicalKeywords.filter(keyword =>
    text.toLowerCase().includes(keyword)
  ).length;

  if (keywordCount > 1) return false;

  // Check for reasonable text content
  const alphaCount = (text.match(/[a-zA-Z\u0600-\u06FF]/g) || []).length; // Include Arabic
  if (alphaCount < text.length * 0.4) return false;

  // Must contain some real words
  const wordPattern = /\b[a-zA-Z\u0600-\u06FF]{3,}\b/g;
  const words = text.match(wordPattern) || [];
  if (words.length < 3) return false;

  return true;
};

// RSSHub fallback to fetch Facebook page posts as RSS
const fetchRssHubFeed = async (pageId: string, pageName: string): Promise<NewsArticle[]> => {
  console.log(`Attempting RSSHub fallback for Facebook page: ${pageId}`);

  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);

  // Build candidate RSS URLs across multiple instances
  const rssCandidates: string[] = [];
  RSSHUB_INSTANCES.forEach((base) => {
    rssCandidates.push(`${base}/facebook/page/${pageId}`);
    rssCandidates.push(`${base}/facebook/posts/${pageId}`);
  });

  for (const rssUrl of rssCandidates) {
    console.log(`Trying RSSHub URL: ${rssUrl}`);
    for (const proxy of CORS_PROXIES) {
      try {
        const proxiedUrl = proxy.includes('r.jina.ai/')
          ? `${proxy}${rssUrl}`
          : `${proxy}${encodeURIComponent(rssUrl)}`;

        const resp = await fetchWithTimeout(proxiedUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*;q=0.8',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'User-Agent':
              'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
          },
        });

        if (!resp.ok) {
          console.warn(`Non-OK RSS response (${resp.status}) for ${rssUrl} via ${proxy}`);
          continue;
        }

        const xml = await resp.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const items = Array.from(doc.querySelectorAll('item'));

        if (!items.length) {
          console.warn(`No <item> entries found in RSS feed from ${rssUrl}`);
          continue;
        }

        const articles: NewsArticle[] = items.slice(0, 15).map((item, idx) => {
          const title = cleanText(item.querySelector('title')?.textContent || '');
          const link = (item.querySelector('link')?.textContent || '').trim();
          const pubRaw =
            item.querySelector('pubDate')?.textContent ||
            item.querySelector('dc\\:date')?.textContent ||
            item.querySelector('updated')?.textContent ||
            '';
          const pubDate = (() => {
            const d = new Date(pubRaw);
            return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
          })();

          const descRaw =
            item.querySelector('description')?.textContent ||
            item.querySelector('content\\:encoded')?.textContent ||
            '';
          const description = cleanText(descRaw) || title;

          return {
            id: `fb-rsshub-${pageName}-${idx}-${Date.now()}`,
            title: title || (description ? description.substring(0, 100) : 'Facebook post'),
            description: description || title,
            link: link || `https://www.facebook.com/${pageId}`,
            pubDate,
            source: pageName,
            category: 'facebook',
            isRead: false,
          } as NewsArticle;
        });

        const recentArticles = articles.filter(a => {
          const d = new Date(a.pubDate);
          return !isNaN(d.getTime()) && d >= fourDaysAgo;
        });

        if (recentArticles.length > 0) {
          console.log(`RSSHub fallback succeeded with ${recentArticles.length} items.`);
          return recentArticles.slice(0, 10);
        }
      } catch (err) {
        console.warn(`RSSHub fetch failed for ${rssUrl} via ${proxy}`, err);
        continue;
      }
    }
  }

  console.warn('RSSHub fallback did not return any items.');
  return [];
};

export const scrapeFacebookPage = async (pageUrl: string, pageName: string): Promise<NewsArticle[]> => {
  console.log(`Attempting to scrape Facebook page: ${pageName} from ${pageUrl}`);

  let scrapableUrl = pageUrl;

  if (pageUrl.includes('facebook.com/')) {
    const urlParts = pageUrl.split('facebook.com/')[1];
    const pageId = urlParts.split('/')[0].split('?')[0];

    // Try r.jina.ai first as it returns clean text
    const textProxy = 'https://r.jina.ai/';
    const urlCandidates = [
      `https://mbasic.facebook.com/${pageId}`,
      `https://m.facebook.com/${pageId}`,
      `https://www.facebook.com/${pageId}`,
      pageUrl,
    ];

    for (const url of urlCandidates) {
      console.log(`Trying Facebook URL with text proxy: ${url}`);
      
      try {
        const proxiedUrl = `${textProxy}${url}`;
        const response = await fetchWithTimeout(proxiedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
            'Accept': 'text/plain, text/html, */*',
            'Cache-Control': 'no-cache',
          },
        });

        if (response.ok) {
          const text = await response.text();
          const articles = extractPostsFromText(text, pageName, url);
          
          if (articles.length > 0) {
            console.log(`Successfully extracted ${articles.length} posts from ${pageName} using text proxy`);
            return articles;
          }
        }
      } catch (error) {
        console.warn(`Text proxy failed for ${url}:`, error);
      }
    }

    // Fallback to RSSHub if text extraction fails
    try {
      const rssArticles = await fetchRssHubFeed(pageId, pageName);
      if (rssArticles.length > 0) {
        return rssArticles;
      }
    } catch (e) {
      console.warn('RSSHub fallback error:', e);
    }

    // Last resort: try other proxies with HTML parsing
    for (const proxy of CORS_PROXIES.slice(1)) { // Skip r.jina.ai since we tried it
      for (const url of urlCandidates) {
        try {
          const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
          const response = await fetchWithTimeout(proxiedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.5 Mobile/15E148 Safari/604.1',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            },
          });

          if (response.ok) {
            const html = await response.text();
            const articles = extractPostsFromFacebookHTML(html, pageName, url);
            
            if (articles.length > 0) {
              console.log(`Successfully scraped ${articles.length} posts from ${pageName}`);
              return articles;
            }
          }
        } catch (error) {
          console.warn(`Failed to scrape ${url} with proxy ${proxy}:`, error);
        }
      }
    }
  }

  console.warn(`Could not scrape any posts from Facebook page: ${pageName}`);
  return [];
};

// Extract posts from clean text (works well with r.jina.ai)
const extractPostsFromText = (text: string, pageName: string, pageUrl: string): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);

  // Clean the text
  const cleanedText = cleanText(text);
  
  // Split text into potential posts using various delimiters
  const postDelimiters = [
    /(?:Like|J'aime|أعجبني).{0,30}(?:Comment|Commenter|تعليق).{0,30}(?:Share|Partager|مشاركة)/gi,
    /\n{3,}/g,
    /\.{3,}/g,
    /---+/g,
    /===+/g
  ];

  let potentialPosts: string[] = [cleanedText];
  
  // Apply each delimiter
  for (const delimiter of postDelimiters) {
    const newPosts: string[] = [];
    for (const post of potentialPosts) {
      newPosts.push(...post.split(delimiter));
    }
    if (newPosts.length > potentialPosts.length) {
      potentialPosts = newPosts;
      break; // Use the first successful split
    }
  }

  // Process potential posts
  const validPosts = potentialPosts
    .map(post => cleanText(post))
    .filter(post => isValidContent(post))
    .filter((post, index, array) => array.indexOf(post) === index) // Remove duplicates
    .slice(0, 10); // Limit to 10 posts

  validPosts.forEach((post, index) => {
    if (post.length >= 20) {
      const article: NewsArticle = {
        id: `fb-text-${pageName}-${index}-${Date.now()}`,
        title: post.length > 100 ? post.substring(0, 100) + '...' : post,
        description: post,
        link: pageUrl,
        pubDate: new Date(Date.now() - index * 3600000).toISOString(), // Stagger by hours
        source: pageName,
        category: 'facebook',
        isRead: false,
      };
      articles.push(article);
    }
  });

  return articles;
};

// Enhanced HTML parsing fallback
const extractPostsFromFacebookHTML = (html: string, pageName: string, pageUrl: string): NewsArticle[] => {
  const articles: NewsArticle[] = [];
  const fourDaysAgo = new Date();
  fourDaysAgo.setDate(fourDaysAgo.getDate() - DAYS_TO_FETCH);

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Enhanced post selectors for different Facebook layouts
    const postSelectors = [
      'div[id*="m_story"]',
      'div[data-ft*="top_level"]',
      'div[data-ft*="story_id"]',
      'article[data-ft]',
      '.story_body_container',
      'div[id*="story"]',
      '[data-pagelet="FeedUnit"]',
      '[data-testid="fbfeed_story"]',
      '.userContentWrapper',
      '[role="article"]',
      '.timeline-story',
      'div[data-testid="post_message"]'
    ];

    let posts: Element[] = [];

    for (const selector of postSelectors) {
      posts = Array.from(doc.querySelectorAll(selector));
      if (posts.length > 0) {
        console.log(`Found ${posts.length} posts using selector: ${selector}`);
        break;
      }
    }

    posts.forEach((post, index) => {
      try {
        // Extract text content with multiple strategies
        const textElements = post.querySelectorAll('p, span, div');
        const textContents: string[] = [];

        textElements.forEach(element => {
          const text = element.textContent?.trim();
          if (text && text.length > 20) {
            textContents.push(text);
          }
        });

        // Find the best text content
        const validTexts = textContents
          .map(cleanText)
          .filter(isValidContent)
          .filter((text, idx, array) => array.indexOf(text) === idx);

        if (validTexts.length === 0) return;

        const bestText = validTexts.reduce((a, b) => a.length > b.length ? a : b);

        // Extract timestamp
        const timeElements = post.querySelectorAll('abbr[data-utime], time[datetime], [data-utime], time, .timestamp, abbr');
        let timestamp = new Date().toISOString();
        
        for (const timeElement of timeElements) {
          const timeValue = timeElement.getAttribute('datetime') ||
                           timeElement.getAttribute('data-utime') ||
                           timeElement.getAttribute('title') ||
                           timeElement.textContent;
          if (timeValue) {
            try {
              if (/^\d{10}$/.test(timeValue)) {
                timestamp = new Date(parseInt(timeValue) * 1000).toISOString();
              } else {
                const parsed = new Date(timeValue);
                if (!isNaN(parsed.getTime())) {
                  timestamp = parsed.toISOString();
                }
              }
              break;
            } catch (e) {}
          }
        }

        // Extract link
        const linkElements = post.querySelectorAll('a[href*="/story.php"], a[href*="/posts/"], a[href*="fbid="], a[href*="story_fbid"]');
        let postLink = pageUrl;
        
        for (const linkElement of linkElements) {
          const href = linkElement.getAttribute('href');
          if (href) {
            postLink = href.startsWith('/') ? 'https://www.facebook.com' + href : href;
            break;
          }
        }

        if (bestText.length >= 20) {
          const article: NewsArticle = {
            id: `fb-html-${pageName}-${index}-${Date.now()}`,
            title: bestText.length > 100 ? bestText.substring(0, 100) + '...' : bestText,
            description: bestText,
            link: postLink,
            pubDate: timestamp,
            source: pageName,
            category: 'facebook',
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

    // If no posts found via selectors, try text-based extraction
    if (articles.length === 0) {
      console.log('HTML selectors found no posts; trying text extraction from HTML');
      const bodyText = doc.body?.textContent || html;
      return extractPostsFromText(bodyText, pageName, pageUrl);
    }

  } catch (error) {
    console.error('Error parsing Facebook HTML:', error);
  }

  return articles.slice(0, 10);
};
