
import { NewsArticle } from '@/types/news';
import { facebookAuthScraper } from './facebookAuthScraper';

// Enhanced Facebook scraper that combines multiple methods
export const enhancedScrapeFacebookPage = async (pageUrl: string, pageName: string): Promise<NewsArticle[]> => {
  console.log(`Enhanced scraping for: ${pageName}`);

  // Check if auth cookies are available
  const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
  const hasCookies = !!settings.facebookCookies;

  if (hasCookies) {
    console.log('Using authenticated scraping method');
    try {
      const authPosts = await facebookAuthScraper.scrapePage(pageUrl, pageName);
      if (authPosts.length > 0) {
        return authPosts;
      }
    } catch (error) {
      console.warn('Authenticated scraping failed, falling back to public methods');
    }
  }

  // Fallback to existing public scraping methods
  const { scrapeFacebookPage } = await import('./facebookScraper');
  return scrapeFacebookPage(pageUrl, pageName);
};
