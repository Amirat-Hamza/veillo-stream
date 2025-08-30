
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Facebook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FacebookSource } from '@/types/news';

export const FacebookSourcesManager = () => {
  const [facebookSources, setFacebookSources] = useState<FacebookSource[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    setFacebookSources(settings.facebookSources || []);
  }, []);

  const saveFacebookSources = (sources: FacebookSource[]) => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.facebookSources = sources;
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    setFacebookSources(sources);
    
    // Trigger refresh event
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
  };

  const addFacebookSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please provide both name and URL for the Facebook page',
        variant: 'destructive',
      });
      return;
    }

    // Validate Facebook URL
    if (!newSourceUrl.includes('facebook.com/')) {
      toast({
        title: 'Error', 
        description: 'Please provide a valid Facebook page URL',
        variant: 'destructive',
      });
      return;
    }

    const newSource: FacebookSource = {
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      type: 'facebook',
      enabled: true,
    };

    const updatedSources = [...facebookSources, newSource];
    saveFacebookSources(updatedSources);

    setNewSourceName('');
    setNewSourceUrl('');

    toast({
      title: 'Success',
      description: 'Facebook page added successfully',
    });
  };

  const removeFacebookSource = (index: number) => {
    const updatedSources = facebookSources.filter((_, i) => i !== index);
    saveFacebookSources(updatedSources);

    toast({
      title: 'Success',
      description: 'Facebook page removed successfully',
    });
  };

  const toggleFacebookSource = (index: number, enabled: boolean) => {
    const updatedSources = facebookSources.map((source, i) =>
      i === index ? { ...source, enabled } : source
    );
    saveFacebookSources(updatedSources);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          Facebook Pages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new Facebook source */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add Facebook Page</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fb-name">Page Name</Label>
              <Input
                id="fb-name"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="e.g., BBC News, CNN"
              />
            </div>
            <div>
              <Label htmlFor="fb-url">Facebook Page URL</Label>
              <Input
                id="fb-url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://www.facebook.com/BBCNews"
              />
            </div>
          </div>
          <Button onClick={addFacebookSource} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Facebook Page
          </Button>
        </div>

        {/* List existing Facebook sources */}
        <div className="space-y-2">
          <h4 className="font-medium">Configured Facebook Pages ({facebookSources.length})</h4>
          {facebookSources.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No Facebook pages configured. Add your first Facebook page above.
            </p>
          ) : (
            facebookSources.map((source, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{source.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {source.url}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={source.enabled !== false}
                    onCheckedChange={(enabled) => toggleFacebookSource(index, enabled)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFacebookSource(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p><strong>Note:</strong> Facebook scraping works by fetching publicly available content from Facebook pages. Some pages may have restrictions or require login, which may limit the content that can be scraped.</p>
        </div>
      </CardContent>
    </Card>
  );
};
