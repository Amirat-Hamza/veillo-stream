import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { RefreshCw, Sun, Moon, Download, BarChart3, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface HeaderProps {
  lastUpdate: Date | null;
  onRefresh: () => void;
  isLoading: boolean;
  onToggleDashboard: () => void;
  showDashboard: boolean;
  onExport: () => void;
  onShowSettings: () => void;
  totalArticles: number;
  unreadCount: number;
}

export const Header = ({
  lastUpdate,
  onRefresh,
  isLoading,
  onToggleDashboard,
  showDashboard,
  onExport,
  onShowSettings,
  totalArticles,
  unreadCount,
}: HeaderProps) => {
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              News Veille
            </h1>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex">
                {totalArticles} articles
              </Badge>
              {unreadCount > 0 && (
                <Badge variant="default">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {lastUpdate && (
              <div className="hidden md:block text-xs text-muted-foreground">
                Last update: {format(lastUpdate, 'HH:mm')}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onToggleDashboard}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">
                {showDashboard ? 'News' : 'Dashboard'}
              </span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onShowSettings}
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};