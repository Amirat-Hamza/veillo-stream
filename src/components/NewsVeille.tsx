import { useState, useMemo, useEffect } from 'react';
import { NewsCard } from './NewsCard';
import { Dashboard } from './Dashboard';
import { SearchAndFilters } from './SearchAndFilters';
import { Header } from './Header';
import { Settings } from './Settings';
import { useNewsData } from '@/hooks/useNewsData';
import { useToast } from '@/hooks/use-toast';
import { ThemeProvider } from 'next-themes';

export const NewsVeille = () => {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [timeRange, setTimeRange] = useState(48);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  useEffect(() => {
    const s = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    if (typeof s.timeRange !== 'number') {
      s.timeRange = 48;
      localStorage.setItem('newsVeilleSettings', JSON.stringify(s));
    }
  }, []);
  
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

  // Refresh when sources are updated from Settings (custom event)
  useEffect(() => {
    const handler: EventListener = () => {
      refreshNews(true);
    };
    window.addEventListener('newsVeille:sourcesUpdated', handler);
    return () => window.removeEventListener('newsVeille:sourcesUpdated', handler);
  }, [refreshNews]);

  // Build available sources from settings and articles
  useEffect(() => {
    const names = new Set<string>(articles.map(a => a.source));
    try {
      const s = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
      if (Array.isArray(s.rssSources)) {
        s.rssSources.forEach((src: any) => { if (src?.name) names.add(src.name); });
      }
    } catch {}
    setAvailableSources(Array.from(names).sort());
  }, [articles, showSettings, lastUpdate]);

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
          onRefresh={() => refreshNews()}
          isLoading={loading}
          onToggleDashboard={() => setShowDashboard(!showDashboard)}
          showDashboard={showDashboard}
          onExport={handleExport}
          onShowSettings={() => setShowSettings(!showSettings)}
          totalArticles={articles.length}
          unreadCount={unreadCount}
        />

        <main className="container mx-auto px-4 py-6">
          {showSettings ? (
            <Settings />
          ) : showDashboard ? (
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
                timeRange={timeRange}
                onTimeRangeChange={(hours) => {
                  setTimeRange(hours);
                  const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
                  settings.timeRange = hours;
                  localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
                  refreshNews(true);
                }}
                sources={availableSources}
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