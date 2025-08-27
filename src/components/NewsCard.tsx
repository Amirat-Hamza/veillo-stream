import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewsArticle } from '@/types/news';
import { format } from 'date-fns';
import { ExternalLink, Clock } from 'lucide-react';

interface NewsCardProps {
  article: NewsArticle;
  onRead: (link: string) => void;
}

export const NewsCard = ({ article, onRead }: NewsCardProps) => {
  const handleClick = () => {
    onRead(article.link);
    window.open(article.link, '_blank');
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] ${
        article.isRead ? 'bg-news-read opacity-75' : 'bg-news-unread'
      }`}
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <h3 className={`font-semibold text-lg leading-tight line-clamp-2 ${
            article.isRead ? 'text-muted-foreground' : 'text-foreground'
          }`}>
            {article.title}
          </h3>
          <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {article.source}
          </Badge>
          {article.category && (
            <Badge variant="outline" className="text-xs">
              {article.category}
            </Badge>
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(new Date(article.pubDate), 'MMM dd, HH:mm')}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <p className={`text-sm leading-relaxed line-clamp-3 ${
          article.isRead ? 'text-muted-foreground' : 'text-foreground'
        }`}>
          {article.description}
        </p>
      </CardContent>
    </Card>
  );
};