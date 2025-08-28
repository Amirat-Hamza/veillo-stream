import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X } from 'lucide-react';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedSource: string;
  onSourceChange: (source: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showUnreadOnly: boolean;
  onUnreadOnlyChange: (show: boolean) => void;
  timeRange: number;
  onTimeRangeChange: (hours: number) => void;
  sources: string[];
  categories: string[];
  filteredArticles: any[]; // Articles matching current filters
}

export const SearchAndFilters = ({
  searchTerm,
  onSearchChange,
  selectedSource,
  onSourceChange,
  selectedCategory,
  onCategoryChange,
  showUnreadOnly,
  onUnreadOnlyChange,
  timeRange,
  onTimeRangeChange,
  sources,
  categories,
  filteredArticles,
}: SearchAndFiltersProps) => {
  const hasActiveFilters = selectedSource !== 'all' || selectedCategory !== 'all' || showUnreadOnly || timeRange > 0;
  
  // Calculate article counts
  const totalCount = filteredArticles.length;
  const unreadCount = filteredArticles.filter(article => !article.isRead).length;
  const readCount = totalCount - unreadCount;

  const clearFilters = () => {
    onSourceChange('all');
    onCategoryChange('all');
    onUnreadOnlyChange(false);
    onSearchChange('');
    onTimeRangeChange(0); // Reset to All time
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

        <Select value={selectedSource} onValueChange={onSourceChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {sources.map(source => (
              <SelectItem key={source} value={source}>{source}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(category => (
              <SelectItem key={category} value={category}>{category}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange.toString()} onValueChange={(value) => onTimeRangeChange(parseFloat(value))}>
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">All</SelectItem>
            <SelectItem value="0.5">30m</SelectItem>
            <SelectItem value="1">1h</SelectItem>
            <SelectItem value="2">2h</SelectItem>
            <SelectItem value="3">3h</SelectItem>
            <SelectItem value="6">6h</SelectItem>
            <SelectItem value="12">12h</SelectItem>
            <SelectItem value="24">24h</SelectItem>
            <SelectItem value="36">36h</SelectItem>
            <SelectItem value="48">48h</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showUnreadOnly ? "default" : "outline"}
          size="sm"
          onClick={() => onUnreadOnlyChange(!showUnreadOnly)}
        >
          Unread Only
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
        </div>
        
        {/* Article count display */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            {totalCount} article{totalCount !== 1 ? 's' : ''}
          </span>
          <span>•</span>
          <span className="text-green-600 dark:text-green-400">
            {readCount} read
          </span>
          <span>•</span>
          <span className="text-blue-600 dark:text-blue-400">
            {unreadCount} unread
          </span>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedSource !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Source: {selectedSource}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onSourceChange('all')}
              />
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Category: {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onCategoryChange('all')}
              />
            </Badge>
          )}
          {showUnreadOnly && (
            <Badge variant="secondary" className="gap-1">
              Unread Only
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUnreadOnlyChange(false)}
              />
            </Badge>
          )}
          {timeRange > 0 && (
            <Badge variant="secondary" className="gap-1">
              Time: {timeRange === 0.5 ? '30m' : `${timeRange}h`}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onTimeRangeChange(0)}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};