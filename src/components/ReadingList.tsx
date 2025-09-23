import { useState } from 'react';
import { ReadingListItem, NewsArticle } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ExternalLink, Trash2, Edit, Plus, AlertCircle, CheckCircle2, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter } from 'date-fns';

interface ReadingListProps {
  readingList: ReadingListItem[];
  onAddToReadingList: (item: Omit<ReadingListItem, 'id'>) => void;
  onUpdateReadingListItem: (id: string, item: Partial<ReadingListItem>) => void;
  onRemoveFromReadingList: (id: string) => void;
  selectedArticle?: NewsArticle;
  onClose?: () => void;
}

const PRIORITY_COLORS = {
  low: 'hsl(200 100% 50%)',
  medium: 'hsl(45 100% 50%)',
  high: 'hsl(0 100% 50%)'
};

const PRIORITY_ICONS = {
  low: Flag,
  medium: AlertCircle,
  high: AlertCircle
};

export const ReadingList = ({
  readingList,
  onAddToReadingList,
  onUpdateReadingListItem,
  onRemoveFromReadingList,
  selectedArticle,
  onClose
}: ReadingListProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReadingListItem | null>(null);
  const [formData, setFormData] = useState({
    dueDate: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    notes: ''
  });
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      dueDate: '',
      priority: 'medium',
      notes: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = () => {
    if (selectedArticle && !editingItem) {
      // Adding new item
      const newItem = {
        articleId: selectedArticle.id,
        title: selectedArticle.title,
        link: selectedArticle.link,
        source: selectedArticle.source,
        addedAt: new Date().toISOString(),
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        notes: formData.notes || undefined
      };

      onAddToReadingList(newItem);
      toast({
        title: 'Added to Reading List',
        description: `${selectedArticle.title} has been saved for later reading`
      });
    } else if (editingItem) {
      // Updating existing item
      onUpdateReadingListItem(editingItem.id, {
        dueDate: formData.dueDate || undefined,
        priority: formData.priority,
        notes: formData.notes || undefined
      });
      toast({
        title: 'Reading List Updated',
        description: 'Item has been updated successfully'
      });
    }

    setIsDialogOpen(false);
    resetForm();
    onClose?.();
  };

  const handleEdit = (item: ReadingListItem) => {
    setEditingItem(item);
    setFormData({
      dueDate: item.dueDate ? format(new Date(item.dueDate), 'yyyy-MM-dd') : '',
      priority: item.priority,
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onRemoveFromReadingList(id);
    toast({
      title: 'Removed from Reading List',
      description: 'Article has been removed from your reading list'
    });
  };

  const isOverdue = (item: ReadingListItem) => {
    if (!item.dueDate) return false;
    return isAfter(new Date(), new Date(item.dueDate));
  };

  const sortedItems = [...readingList].sort((a, b) => {
    // Sort by priority (high > medium > low), then by due date, then by added date
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate && !b.dueDate) return -1;
    if (!a.dueDate && b.dueDate) return 1;
    
    return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reading List</h3>
          <p className="text-sm text-muted-foreground">
            {readingList.length} article{readingList.length !== 1 ? 's' : ''} saved for later
          </p>
        </div>
        
        {selectedArticle && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Save for Later
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Update Reading List Item' : 'Save Article for Later'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {selectedArticle && !editingItem && (
                  <div className="p-3 border rounded-lg bg-accent">
                    <p className="font-medium text-sm">{selectedArticle.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedArticle.source}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Due Date (Optional)</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      min={format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={formData.priority} onValueChange={(priority: 'low' | 'medium' | 'high') => setFormData(prev => ({ ...prev, priority }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Notes (Optional)</label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Add any notes about why you want to read this later..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit}>
                    {editingItem ? 'Update' : 'Save'} Article
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {readingList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No articles in your reading list yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Click "Save for Later" on any article to add it here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedItems.map(item => {
            const PriorityIcon = PRIORITY_ICONS[item.priority];
            const overdue = isOverdue(item);
            
            return (
              <Card key={item.id} className={`${overdue ? 'border-destructive' : ''}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base leading-snug">
                        <a 
                          href={item.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          {item.title}
                        </a>
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className="text-xs"
                          style={{ 
                            backgroundColor: `${PRIORITY_COLORS[item.priority]}20`,
                            color: PRIORITY_COLORS[item.priority]
                          }}
                        >
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {item.priority}
                        </Badge>
                        {item.dueDate && (
                          <Badge variant={overdue ? "destructive" : "outline"} className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(item.dueDate), 'MMM d')}
                            {overdue && ' (Overdue)'}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(item.link, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                {item.notes && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground bg-accent p-2 rounded">
                      {item.notes}
                    </p>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};