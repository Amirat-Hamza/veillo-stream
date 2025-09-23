import { useCallback } from 'react';
import { NewsArticle } from '@/types/news';

// AI-powered categorization using keyword analysis and pattern matching
export const useAICategorization = () => {
  
  const categorizeArticle = useCallback((article: NewsArticle): string => {
    const title = article.title.toLowerCase();
    const description = article.description.toLowerCase();
    const content = `${title} ${description}`;

    // Enhanced categorization with semantic analysis and context awareness
    const categories = {
      'Technology': {
        primary: ['artificial intelligence', 'machine learning', 'blockchain', 'cryptocurrency', 'software', 'app', 'digital', 'tech', 'cyber', 'data', 'algorithm', 'programming', 'coding', 'automation', 'robot', 'innovation', 'startup'],
        secondary: ['smartphone', 'computer', 'internet', 'cloud', 'platform', 'system', 'network', 'database', 'security', 'privacy', 'virtual', 'augmented reality'],
        context: ['launch', 'update', 'version', 'feature', 'development', 'engineer', 'developer'],
        weight: 0,
        confidence: 0
      },
      'Politics': {
        primary: ['government', 'minister', 'president', 'parliament', 'election', 'vote', 'policy', 'political', 'democracy', 'opposition', 'coalition', 'cabinet', 'congress', 'senate'],
        secondary: ['reform', 'law', 'legislation', 'diplomatic', 'ambassador', 'treaty', 'constitution', 'governance', 'administration', 'campaign', 'candidate'],
        context: ['announced', 'declared', 'statement', 'speech', 'meeting', 'summit', 'negotiation'],
        weight: 0,
        confidence: 0
      },
      'Economy': {
        primary: ['economy', 'economic', 'finance', 'financial', 'market', 'stock', 'investment', 'business', 'trade', 'export', 'import', 'gdp', 'inflation', 'unemployment'],
        secondary: ['bank', 'banking', 'corporate', 'revenue', 'profit', 'budget', 'tax', 'fiscal', 'monetary', 'currency', 'exchange', 'commerce'],
        context: ['growth', 'decline', 'increase', 'decrease', 'forecast', 'analysis', 'report', 'quarter'],
        weight: 0,
        confidence: 0
      },
      'Health': {
        primary: ['health', 'medical', 'doctor', 'hospital', 'patient', 'disease', 'vaccine', 'medicine', 'treatment', 'healthcare', 'clinic', 'pharmaceutical'],
        secondary: ['virus', 'pandemic', 'epidemic', 'therapy', 'surgery', 'drug', 'diagnosis', 'symptoms', 'prevention', 'cure'],
        context: ['study', 'research', 'trial', 'approved', 'discovered', 'breakthrough'],
        weight: 0,
        confidence: 0
      },
      'Sports': {
        primary: ['football', 'soccer', 'basketball', 'tennis', 'sport', 'athlete', 'team', 'match', 'game', 'player', 'championship', 'league', 'tournament'],
        secondary: ['olympic', 'coach', 'stadium', 'goal', 'score', 'victory', 'defeat', 'competition', 'training'],
        context: ['won', 'lost', 'played', 'final', 'semi-final', 'season', 'transfer'],
        weight: 0,
        confidence: 0
      },
      'Education': {
        primary: ['education', 'school', 'university', 'student', 'teacher', 'learning', 'academic', 'study', 'graduation', 'curriculum'],
        secondary: ['scholarship', 'campus', 'degree', 'professor', 'classroom', 'training', 'course', 'exam', 'research'],
        context: ['enrolled', 'graduated', 'awarded', 'scholarship', 'program', 'initiative'],
        weight: 0,
        confidence: 0
      },
      'Environment': {
        primary: ['environment', 'climate', 'pollution', 'renewable', 'energy', 'sustainable', 'carbon', 'emission', 'global warming', 'conservation'],
        secondary: ['nature', 'wildlife', 'forest', 'ocean', 'recycling', 'solar', 'wind', 'green', 'ecological'],
        context: ['reduce', 'protect', 'preserve', 'initiative', 'project', 'program'],
        weight: 0,
        confidence: 0
      },
      'Culture': {
        primary: ['culture', 'art', 'music', 'film', 'movie', 'book', 'literature', 'festival', 'museum', 'theater', 'artist'],
        secondary: ['cultural', 'heritage', 'tradition', 'entertainment', 'celebrity', 'fashion', 'design', 'exhibition'],
        context: ['perform', 'exhibit', 'premiere', 'release', 'award', 'ceremony'],
        weight: 0,
        confidence: 0
      },
      'Science': {
        primary: ['science', 'scientific', 'research', 'discovery', 'experiment', 'study', 'laboratory', 'space', 'astronomy'],
        secondary: ['physics', 'chemistry', 'biology', 'genetic', 'dna', 'scientist', 'breakthrough', 'finding'],
        context: ['discovered', 'found', 'published', 'revealed', 'demonstrated'],
        weight: 0,
        confidence: 0
      },
      'Security': {
        primary: ['security', 'police', 'crime', 'arrest', 'investigation', 'terrorism', 'attack', 'safety', 'military', 'army'],
        secondary: ['defense', 'war', 'conflict', 'violence', 'protest', 'demonstration', 'enforcement'],
        context: ['arrested', 'charged', 'investigation', 'operation', 'raid'],
        weight: 0,
        confidence: 0
      }
    };

    // Advanced scoring algorithm with context awareness
    Object.keys(categories).forEach(category => {
      const cat = categories[category as keyof typeof categories];
      let score = 0;
      let matches = 0;

      // Primary keywords (high weight)
      cat.primary.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const titleMatches = (title.match(regex) || []).length;
        const descMatches = (description.match(regex) || []).length;
        
        if (titleMatches > 0 || descMatches > 0) {
          score += (titleMatches * 5) + (descMatches * 2); // Title has higher weight
          matches++;
        }
      });

      // Secondary keywords (medium weight)
      cat.secondary.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const titleMatches = (title.match(regex) || []).length;
        const descMatches = (description.match(regex) || []).length;
        
        if (titleMatches > 0 || descMatches > 0) {
          score += (titleMatches * 3) + (descMatches * 1);
          matches++;
        }
      });

      // Context keywords (bonus weight if combined with primary/secondary)
      if (score > 0) {
        cat.context.forEach(keyword => {
          const regex = new RegExp(`\\b${keyword}\\b`, 'g');
          const contextMatches = (content.match(regex) || []).length;
          if (contextMatches > 0) {
            score += contextMatches * 1.5; // Bonus for context
          }
        });
      }

      // Calculate confidence based on word density and relevance
      const totalWords = content.split(' ').length;
      const density = matches / Math.max(totalWords, 1);
      const confidence = Math.min(score * density * 100, 100);

      cat.weight = score;
      cat.confidence = confidence;
    });

    // Find best category with minimum confidence threshold
    const bestCategory = Object.entries(categories).reduce((best, [category, data]) => {
      // Require minimum confidence and weight
      if (data.weight >= 3 && data.confidence >= 15) {
        if (data.weight > best.weight || (data.weight === best.weight && data.confidence > best.confidence)) {
          return { category, weight: data.weight, confidence: data.confidence };
        }
      }
      return best;
    }, { category: '', weight: 0, confidence: 0 });

    // Enhanced fallback logic
    if (bestCategory.weight > 0 && bestCategory.confidence >= 15) {
      console.log(`AI Categorized "${article.title}" as "${bestCategory.category}" (confidence: ${bestCategory.confidence.toFixed(1)}%)`);
      return bestCategory.category;
    }

    // Geographic/source-based fallback with better logic
    const source = article.source.toLowerCase();
    const sourceCategory = article.category;

    // Check for geographic indicators in content
    if (content.includes('algeria') || content.includes('algerian') || source.includes('algeria')) {
      return 'Algeria';
    }
    if (content.includes('tunisia') || content.includes('tunisian') || source.includes('tunisia')) {
      return 'Tunisia';  
    }
    if (content.includes('libya') || content.includes('libyan') || source.includes('libya')) {
      return 'Libya';
    }

    // Use original category if it exists and seems reasonable, otherwise International
    return sourceCategory || 'International';
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