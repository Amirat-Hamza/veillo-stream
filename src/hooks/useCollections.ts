import { useState, useEffect, useCallback } from 'react';
import { Collection, NewsArticle } from '@/types/news';

export const useCollections = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  // Load collections from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('newsVeilleCollections');
      if (stored) {
        setCollections(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  }, []);

  // Save collections to localStorage
  const saveCollections = useCallback((newCollections: Collection[]) => {
    try {
      localStorage.setItem('newsVeilleCollections', JSON.stringify(newCollections));
      setCollections(newCollections);
    } catch (error) {
      console.error('Failed to save collections:', error);
    }
  }, []);

  const createCollection = useCallback((collection: Omit<Collection, 'id'>) => {
    const newCollection: Collection = {
      ...collection,
      id: `collection_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    const newCollections = [...collections, newCollection];
    saveCollections(newCollections);
  }, [collections, saveCollections]);

  const updateCollection = useCallback((id: string, updates: Partial<Collection>) => {
    const newCollections = collections.map(collection => 
      collection.id === id ? { ...collection, ...updates } : collection
    );
    saveCollections(newCollections);
  }, [collections, saveCollections]);

  const deleteCollection = useCallback((id: string) => {
    const newCollections = collections.filter(collection => collection.id !== id);
    saveCollections(newCollections);
  }, [collections, saveCollections]);

  const filterArticlesByCollection = useCallback((articles: NewsArticle[], collectionId: string | null) => {
    if (!collectionId) return articles;
    
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return articles;

    return articles.filter(article => {
      // Filter by sources
      if (collection.sources.length > 0 && !collection.sources.includes(article.source)) {
        return false;
      }

      // Filter by categories
      if (collection.categories.length > 0 && article.category && !collection.categories.includes(article.category)) {
        return false;
      }

      // Filter by keywords
      if (collection.keywords.length > 0) {
        const hasKeyword = collection.keywords.some(keyword => 
          article.title.toLowerCase().includes(keyword.toLowerCase()) ||
          article.description.toLowerCase().includes(keyword.toLowerCase())
        );
        if (!hasKeyword) return false;
      }

      return true;
    });
  }, [collections]);

  return {
    collections,
    selectedCollection,
    setSelectedCollection,
    createCollection,
    updateCollection,
    deleteCollection,
    filterArticlesByCollection
  };
};