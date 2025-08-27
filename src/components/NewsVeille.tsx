import { useState, useMemo, useEffect } from 'react';
import { NewsCard } from './NewsCard';
import { Dashboard } from './Dashboard';
import { SearchAndFilters } from './SearchAndFilters';
import { Header } from './Header';
import { useNewsData } from '@/hooks/useNewsData';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from 'next-themes';

export const NewsVeille = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  
  const { articles, loading, lastUpdate, markAsRead, refreshNews, getReadingStats } = useNewsData();
  const { toast } = useToast();

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show notification for new articles
  useEffect(() => {
    if (articles.length > 0 && lastUpdate) {
      const unreadCount = articles.filter(a => !a.isRead).length;
      if (unreadCount > 0 && Notification.permission === 'granted') {
        new Notification('News Veille', {
          body: `${unreadCount} new articles available`,
          icon: '/favicon.ico',
        });
      }
    }
  }, [articles, lastUpdate]);

  const handleArticleRead = (link: string) => {
    markAsRead(link);
    toast({
      title: "Article marked as read",
      description: "Article has been added to your reading history.",
    });
  };

  const handleExport = () => {
    const readArticles = articles.filter(a => a.isRead);
    const csvContent = [
      'Title,Source,Category,Date,Link',
      ...readArticles.map(article => 
        `"${article.title}","${article.source}","${article.category}","${article.pubDate}","${article.link}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `news-veille-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Your reading history has been exported to CSV.",
    });
  };

  const filteredArticles = useMemo(() => {
    return articles.filter(article => {
      if (searchTerm && !article.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !article.description.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedSource !== 'all' && article.source !== selectedSource) {
        return false;
      }
      if (selectedCategory !== 'all' && article.category !== selectedCategory) {
        return false;
      }
      if (showUnreadOnly && article.isRead) {
        return false;
      }
      return true;
    });
  }, [articles, searchTerm, selectedSource, selectedCategory, showUnreadOnly]);

  const sources = useMemo(() => 
    [...new Set(articles.map(a => a.source))].sort(), 
    [articles]
  );

  const categories = useMemo(() => 
    [...new Set(articles.map(a => a.category).filter(Boolean))].sort(), 
    [articles]
  );

  const unreadCount = articles.filter(a => !a.isRead).length;
  const stats = getReadingStats();

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <div className="min-h-screen bg-background">
        <Header
          lastUpdate={lastUpdate}
          onRefresh={refreshNews}
          isLoading={loading}
          onToggleDashboard={() => setShowDashboard(!showDashboard)}
          showDashboard={showDashboard}
          onExport={handleExport}
          totalArticles={articles.length}
          unreadCount={unreadCount}
        />

        <main className="container mx-auto px-4 py-6">
          {showDashboard ? (
            <Dashboard stats={stats} />
          ) : (
            <div className="space-y-6">
              <SearchAndFilters
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedSource={selectedSource}
                onSourceChange={setSelectedSource}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                showUnreadOnly={showUnreadOnly}
                onUnreadOnlyChange={setShowUnreadOnly}
                sources={sources}
                categories={categories}
              />

              {loading && articles.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Loading news articles...</p>
                  </div>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    {searchTerm || selectedSource !== 'all' || selectedCategory !== 'all' || showUnreadOnly
                      ? 'No articles match your filters.'
                      : 'No articles available yet.'
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map(article => (
                    <NewsCard
                      key={article.id}
                      article={article}
                      onRead={handleArticleRead}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
};