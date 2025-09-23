import { useCallback } from 'react';
import { NewsArticle } from '@/types/news';

// AI-powered categorization using keyword analysis and pattern matching
export const useAICategorization = () => {
  
  const categorizeArticle = useCallback((article: NewsArticle): string => {
    const title = article.title.toLowerCase();
    const description = article.description.toLowerCase();
    const content = `${title} ${description}`;

    // Enhanced categorization rules with better accuracy
    const categories = {
      'Technology': {
        keywords: ['tech', 'ai', 'artificial intelligence', 'machine learning', 'software', 'app', 'digital', 'cyber', 'bitcoin', 'blockchain', 'crypto', 'startup', 'innovation', 'smartphone', 'computer', 'internet', 'data', 'algorithm', 'programming', 'coding', 'cloud', 'automation', 'robot'],
        weight: 0
      },
      'Politics': {
        keywords: ['government', 'minister', 'president', 'parliament', 'election', 'vote', 'policy', 'political', 'democracy', 'opposition', 'coalition', 'cabinet', 'congress', 'senate', 'reform', 'law', 'legislation', 'diplomatic', 'ambassador', 'treaty'],
        weight: 0
      },
      'Economy': {
        keywords: ['economy', 'economic', 'finance', 'financial', 'market', 'stock', 'investment', 'business', 'company', 'trade', 'export', 'import', 'gdp', 'inflation', 'unemployment', 'bank', 'banking', 'corporate', 'revenue', 'profit', 'budget', 'tax'],
        weight: 0
      },
      'Health': {
        keywords: ['health', 'medical', 'doctor', 'hospital', 'patient', 'disease', 'vaccine', 'medicine', 'treatment', 'healthcare', 'clinic', 'pharmaceutical', 'virus', 'pandemic', 'epidemic', 'therapy', 'surgery', 'drug', 'research', 'study'],
        weight: 0
      },
      'Sports': {
        keywords: ['football', 'soccer', 'basketball', 'tennis', 'sport', 'athlete', 'team', 'match', 'game', 'player', 'championship', 'league', 'tournament', 'olympic', 'coach', 'stadium', 'goal', 'score', 'win', 'victory'],
        weight: 0
      },
      'Education': {
        keywords: ['education', 'school', 'university', 'student', 'teacher', 'learning', 'academic', 'research', 'study', 'graduation', 'curriculum', 'scholarship', 'campus', 'degree', 'professor', 'classroom', 'training', 'course'],
        weight: 0
      },
      'Environment': {
        keywords: ['environment', 'climate', 'weather', 'pollution', 'renewable', 'energy', 'green', 'sustainable', 'carbon', 'emission', 'global warming', 'conservation', 'nature', 'wildlife', 'forest', 'ocean', 'recycling', 'solar', 'wind'],
        weight: 0
      },
      'Culture': {
        keywords: ['culture', 'art', 'music', 'film', 'movie', 'book', 'literature', 'festival', 'museum', 'theater', 'artist', 'cultural', 'heritage', 'tradition', 'entertainment', 'celebrity', 'fashion', 'design'],
        weight: 0
      },
      'Science': {
        keywords: ['science', 'scientific', 'research', 'discovery', 'experiment', 'study', 'laboratory', 'space', 'astronomy', 'physics', 'chemistry', 'biology', 'genetic', 'dna', 'scientist', 'innovation', 'breakthrough'],
        weight: 0
      },
      'Security': {
        keywords: ['security', 'police', 'crime', 'arrest', 'investigation', 'terrorism', 'attack', 'safety', 'military', 'army', 'defense', 'war', 'conflict', 'violence', 'protest', 'demonstration'],
        weight: 0
      }
    };

    // Calculate weights for each category
    Object.keys(categories).forEach(category => {
      categories[category as keyof typeof categories].weight = categories[category as keyof typeof categories].keywords.reduce((weight, keyword) => {
        const titleMatches = (title.match(new RegExp(keyword, 'g')) || []).length;
        const descMatches = (description.match(new RegExp(keyword, 'g')) || []).length;
        
        // Title matches have higher weight
        return weight + (titleMatches * 3) + (descMatches * 1);
      }, 0);
    });

    // Find category with highest weight
    const bestCategory = Object.entries(categories).reduce((best, [category, data]) => {
      return data.weight > best.weight ? { category, weight: data.weight } : best;
    }, { category: '', weight: 0 });

    // Return the best category if it has enough confidence, otherwise return original or International
    if (bestCategory.weight >= 2) {
      return bestCategory.category;
    }

    // Fallback to original category or International
    return article.category || 'International';
  }, []);

  const enhanceArticlesWithAI = useCallback((articles: NewsArticle[]): NewsArticle[] => {
    return articles.map(article => ({
      ...article,
      category: categorizeArticle(article)
    }));
  }, [categorizeArticle]);

  return {
    categorizeArticle,
    enhanceArticlesWithAI
  };
};