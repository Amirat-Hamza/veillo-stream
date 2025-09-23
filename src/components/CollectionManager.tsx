import { useState } from 'react';
import { Collection } from '@/types/news';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Folder, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CollectionManagerProps {
  collections: Collection[];
  sources: string[];
  categories: string[];
  onCollectionCreate: (collection: Omit<Collection, 'id'>) => void;
  onCollectionUpdate: (id: string, collection: Partial<Collection>) => void;
  onCollectionDelete: (id: string) => void;
  selectedCollection?: string;
  onCollectionSelect: (id: string | null) => void;
}

const COLLECTION_COLORS = [
  'hsl(220 100% 50%)', // primary
  'hsl(270 100% 50%)', // purple
  'hsl(200 100% 50%)', // cyan
  'hsl(160 100% 40%)', // green
  'hsl(45 100% 50%)',  // yellow
  'hsl(0 100% 50%)',   // red
  'hsl(30 100% 50%)',  // orange
];

const COLLECTION_ICONS = ['Folder', 'Tag', 'Star', 'Heart', 'BookOpen', 'Globe', 'TrendingUp'];

export const CollectionManager = ({
  collections,
  sources,
  categories,
  onCollectionCreate,
  onCollectionUpdate,
  onCollectionDelete,
  selectedCollection,
  onCollectionSelect
}: CollectionManagerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sources: [] as string[],
    categories: [] as string[],
    keywords: [] as string[],
    color: COLLECTION_COLORS[0],
    icon: 'Folder'
  });
  const [keywordInput, setKeywordInput] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      sources: [],
      categories: [],
      keywords: [],
      color: COLLECTION_COLORS[0],
      icon: 'Folder'
    });
    setKeywordInput('');
    setEditingCollection(null);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Collection name is required',
        variant: 'destructive'
      });
      return;
    }

    const collection = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      sources: formData.sources,
      categories: formData.categories,
      keywords: formData.keywords,
      color: formData.color,
      icon: formData.icon
    };

    if (editingCollection) {
      onCollectionUpdate(editingCollection.id, collection);
      toast({
        title: 'Collection Updated',
        description: `${collection.name} has been updated successfully`
      });
    } else {
      onCollectionCreate(collection);
      toast({
        title: 'Collection Created',
        description: `${collection.name} has been created successfully`
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      sources: collection.sources,
      categories: collection.categories,
      keywords: collection.keywords,
      color: collection.color || COLLECTION_COLORS[0],
      icon: collection.icon || 'Folder'
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    onCollectionDelete(id);
    if (selectedCollection === id) {
      onCollectionSelect(null);
    }
    toast({
      title: 'Collection Deleted',
      description: 'Collection has been removed successfully'
    });
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const toggleSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }));
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom Collections</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              New Collection
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCollection ? 'Edit Collection' : 'Create New Collection'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Tech News"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <Select value={formData.color} onValueChange={(color) => setFormData(prev => ({ ...prev, color }))}>
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: formData.color }} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {COLLECTION_COLORS.map((color, index) => (
                        <SelectItem key={color} value={color}>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
                            Color {index + 1}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this collection is for..."
                  rows={2}
                />
              </div>

              <div>
                <label className="text-sm font-medium">Sources</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {sources.map(source => (
                    <label key={source} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sources.includes(source)}
                        onChange={() => toggleSource(source)}
                        className="rounded"
                      />
                      <span className="text-sm">{source}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Categories</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {categories.map(category => (
                    <label key={category} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="rounded"
                      />
                      <span className="text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Keywords</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    placeholder="Add keyword..."
                    onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  />
                  <Button type="button" onClick={addKeyword}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.keywords.map(keyword => (
                    <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeKeyword(keyword)}>
                      {keyword} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCollection ? 'Update' : 'Create'} Collection
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          className={`cursor-pointer border-2 transition-all ${!selectedCollection ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'}`}
          onClick={() => onCollectionSelect(null)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Folder className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">All Articles</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">View all articles from all sources</p>
          </CardContent>
        </Card>

        {collections.map(collection => (
          <Card 
            key={collection.id}
            className={`cursor-pointer border-2 transition-all ${selectedCollection === collection.id ? 'border-primary bg-accent' : 'border-border hover:border-muted-foreground'}`}
            onClick={() => onCollectionSelect(collection.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: collection.color }}
                  />
                  <CardTitle className="text-base">{collection.name}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(collection);
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(collection.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {collection.description && (
                <p className="text-sm text-muted-foreground mb-2">{collection.description}</p>
              )}
              <div className="space-y-1">
                {collection.sources.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {collection.sources.slice(0, 3).map(source => (
                      <Badge key={source} variant="outline" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                    {collection.sources.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{collection.sources.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
                {collection.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {collection.keywords.slice(0, 3).map(keyword => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {collection.keywords.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{collection.keywords.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};