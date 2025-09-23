import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NewsArticle } from '@/types/news';
import { format } from 'date-fns';
import { ExternalLink, Clock, Bookmark, BookmarkCheck } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface NewsCardProps {
  article: NewsArticle;
  onRead: (link: string) => void;
  onSaveForLater?: () => void;
  isInReadingList?: boolean;
}

export const NewsCard = ({ article, onRead, onSaveForLater, isInReadingList }: NewsCardProps) => {
  const { t } = useTranslation();
  
  const handleClick = () => {
    onRead(article.link);
    window.open(article.link, '_blank');
  };

  const handleSaveForLater = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSaveForLater?.();
  };

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-xl transform hover:scale-[1.01] border-l-4 ${
        article.isRead 
          ? 'bg-news-read border-l-muted opacity-80' 
          : 'bg-news-unread border-l-primary hover:border-l-primary/80'
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-4 space-y-4">
        {/* Header with title and action buttons */}
        <div className="flex items-start justify-between gap-4">
          <h3 className={`font-bold text-xl leading-tight line-clamp-2 transition-colors group-hover:text-primary ${
            article.isRead ? 'text-muted-foreground' : 'text-card-foreground'
          }`}>
            {article.title}
          </h3>
          <div className="flex-shrink-0 flex gap-1">
            {onSaveForLater && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 transition-colors hover:bg-primary/10"
                onClick={handleSaveForLater}
                title={isInReadingList ? "Remove from reading list" : "Save for later"}
              >
                {isInReadingList ? (
                  <BookmarkCheck className="w-4 h-4 text-primary" />
                ) : (
                  <Bookmark className="w-4 h-4 text-muted-foreground hover:text-primary" />
                )}
              </Button>
            )}
            <div className="p-1 rounded-full bg-accent/50 transition-colors group-hover:bg-primary/10">
              <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
        
        {/* Metadata section with enhanced visual hierarchy */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Source badge with primary color */}
          <Badge 
            variant="secondary" 
            className="text-xs font-semibold bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
          >
            {article.source}
          </Badge>
          
          {/* Category badge */}
          {article.category && (
            <Badge 
              variant="outline" 
              className="text-xs font-medium border-accent-foreground/30 text-accent-foreground hover:border-accent-foreground/50"
            >
              {article.category}
            </Badge>
          )}
          
          {/* Date/time with enhanced styling */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" />
            <span className="font-medium">
              {format(new Date(article.pubDate), 'MMM dd, HH:mm')}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 pb-6">
        {/* Summary with better typography */}
        <p className={`text-sm leading-relaxed line-clamp-3 transition-colors ${
          article.isRead 
            ? 'text-muted-foreground' 
            : 'text-card-foreground/80 group-hover:text-card-foreground'
        }`}>
          {article.description}
        </p>
        
        {/* Read indicator */}
        {article.isRead && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-muted-foreground/50"></div>
            <span className="font-medium">{t('readLabel')}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};