
import { NewsArticle, FacebookSource } from '@/types/news';
import { enhancedScrapeFacebookPage } from './enhancedFacebookScraper';

export const scrapeFacebookSources = async (sources: FacebookSource[]): Promise<NewsArticle[]> => {
  console.log(`Starting to scrape ${sources.length} Facebook sources`);
  
  const allArticles: NewsArticle[] = [];
  
  // Process sources with rate limiting
  for (const source of sources) {
    if (!source.enabled) continue;
    
    try {
      console.log(`Scraping: ${source.name}`);
      const articles = await enhancedScrapeFacebookPage(source.url, source.name);
      
      if (articles.length > 0) {
        console.log(`Successfully scraped ${articles.length} posts from ${source.name}`);
        allArticles.push(...articles);
      } else {
        console.warn(`No posts found for ${source.name}`);
      }
      
      // Rate limiting - wait between requests
      if (sources.indexOf(source) < sources.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
    } catch (error) {
      console.error(`Failed to scrape ${source.name}:`, error);
    }
  }
  
  console.log(`Total Facebook articles scraped: ${allArticles.length}`);
  return allArticles;
};
