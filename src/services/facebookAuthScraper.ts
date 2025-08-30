
import { NewsArticle } from '@/types/news';

// Enhanced scraper that mimics browser behavior with cookie support
export class FacebookAuthScraper {
  private cookies: string = '';
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
  
  // Set login cookies (user would need to provide these)
  setCookies(cookieString: string) {
    this.cookies = cookieString;
  }

  // Enhanced fetch with authentication headers
  private async authenticatedFetch(url: string): Promise<Response> {
    const headers: HeadersInit = {
      'User-Agent': this.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    };

    if (this.cookies) {
      headers['Cookie'] = this.cookies;
    }

    // Use CORS proxy for browser compatibility
    const proxyUrl = 'https://api.codetabs.com/v1/proxy?quest=';
    
    return fetch(proxyUrl + encodeURIComponent(url), {
      method: 'GET',
      headers,
      credentials: 'omit'
    });
  }

  // Extract post data from Facebook HTML
  private extractPostsFromHTML(html: string, pageName: string): NewsArticle[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const posts: NewsArticle[] = [];

    // Multiple selectors for different Facebook layouts
    const postSelectors = [
      '[data-pagelet="FeedUnit"]',
      '[data-testid="fbfeed_story"]',
      'div[id*="m_story"]',
      'div[data-ft*="top_level"]',
      '[role="article"]',
      '.userContentWrapper',
      'div[data-testid="post_message"]'
    ];

    let postElements: Element[] = [];
    
    for (const selector of postSelectors) {
      postElements = Array.from(doc.querySelectorAll(selector));
      if (postElements.length > 0) break;
    }

    postElements.slice(0, 10).forEach((postEl, index) => {
      try {
        // Extract text content
        const textElement = postEl.querySelector('[data-testid="post_message"], .userContent, [data-ad-preview="message"]');
        const text = textElement?.textContent?.trim() || '';

        // Extract images
        const imageElement = postEl.querySelector('img[src*="scontent"], img[src*="fbcdn"]');
        const imageUrl = imageElement?.getAttribute('src') || '';

        // Extract timestamp
        const timeElement = postEl.querySelector('abbr[data-utime], time[datetime], [data-utime]');
        let timestamp = new Date().toISOString();
        
        if (timeElement) {
          const timeValue = timeElement.getAttribute('data-utime') || 
                           timeElement.getAttribute('datetime') ||
                           timeElement.getAttribute('title');
          
          if (timeValue) {
            if (/^\d{10}$/.test(timeValue)) {
              timestamp = new Date(parseInt(timeValue) * 1000).toISOString();
            } else {
              const parsed = new Date(timeValue);
              if (!isNaN(parsed.getTime())) {
                timestamp = parsed.toISOString();
              }
            }
          }
        }

        // Extract post link
        const linkElement = postEl.querySelector('a[href*="/story.php"], a[href*="/posts/"], a[href*="fbid="]');
        const postLink = linkElement?.getAttribute('href') || `https://www.facebook.com/${pageName}`;
        const fullLink = postLink.startsWith('/') ? 'https://www.facebook.com' + postLink : postLink;

        if (text && text.length > 10) {
          const article: NewsArticle = {
            id: `fb-auth-${pageName}-${index}-${Date.now()}`,
            title: text.length > 100 ? text.substring(0, 100) + '...' : text,
            description: text + (imageUrl ? `\n[Image: ${imageUrl}]` : ''),
            link: fullLink,
            pubDate: timestamp,
            source: pageName,
            category: 'facebook',
            isRead: false
          };
          
          posts.push(article);
        }
      } catch (error) {
        console.warn(`Error extracting post ${index}:`, error);
      }
    });

    return posts;
  }

  // Main scraping method
  async scrapePage(pageUrl: string, pageName: string): Promise<NewsArticle[]> {
    console.log(`Scraping Facebook page with auth: ${pageName}`);
    
    try {
      // Try mobile version first (easier to parse)
      const mobileUrl = pageUrl.replace('www.facebook.com', 'mbasic.facebook.com');
      
      const response = await this.authenticatedFetch(mobileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      const posts = this.extractPostsFromHTML(html, pageName);
      
      console.log(`Successfully extracted ${posts.length} posts from ${pageName}`);
      return posts;
      
    } catch (error) {
      console.error(`Failed to scrape ${pageName}:`, error);
      
      // Fallback to desktop version
      try {
        const response = await this.authenticatedFetch(pageUrl);
        if (response.ok) {
          const html = await response.text();
          return this.extractPostsFromHTML(html, pageName);
        }
      } catch (fallbackError) {
        console.error(`Fallback also failed for ${pageName}:`, fallbackError);
      }
      
      return [];
    }
  }
}

// Export singleton instance
export const facebookAuthScraper = new FacebookAuthScraper();
