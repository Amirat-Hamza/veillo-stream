import { useState, useEffect, useCallback } from 'react';
import { ReadingListItem } from '@/types/news';

export const useReadingList = () => {
  const [readingList, setReadingList] = useState<ReadingListItem[]>([]);

  // Load reading list from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('newsVeilleReadingList');
      if (stored) {
        setReadingList(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load reading list:', error);
    }
  }, []);

  // Save reading list to localStorage
  const saveReadingList = useCallback((newReadingList: ReadingListItem[]) => {
    try {
      localStorage.setItem('newsVeilleReadingList', JSON.stringify(newReadingList));
      setReadingList(newReadingList);
    } catch (error) {
      console.error('Failed to save reading list:', error);
    }
  }, []);

  const addToReadingList = useCallback((item: Omit<ReadingListItem, 'id'>) => {
    // Check if article is already in reading list
    const existingItem = readingList.find(existing => existing.articleId === item.articleId);
    if (existingItem) {
      return existingItem; // Return existing item
    }

    const newItem: ReadingListItem = {
      ...item,
      id: `reading_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    const newReadingList = [...readingList, newItem];
    saveReadingList(newReadingList);
    return newItem;
  }, [readingList, saveReadingList]);

  const updateReadingListItem = useCallback((id: string, updates: Partial<ReadingListItem>) => {
    const newReadingList = readingList.map(item => 
      item.id === id ? { ...item, ...updates } : item
    );
    saveReadingList(newReadingList);
  }, [readingList, saveReadingList]);

  const removeFromReadingList = useCallback((id: string) => {
    const newReadingList = readingList.filter(item => item.id !== id);
    saveReadingList(newReadingList);
  }, [readingList, saveReadingList]);

  const isInReadingList = useCallback((articleId: string) => {
    return readingList.some(item => item.articleId === articleId);
  }, [readingList]);

  return {
    readingList,
    addToReadingList,
    updateReadingListItem,
    removeFromReadingList,
    isInReadingList
  };
};