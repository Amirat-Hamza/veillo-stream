
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
        description: 'Please provide both name and RSS URL for the Facebook source',
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
      description: 'Facebook RSS source added successfully',
    });
  };

  const removeFacebookSource = (index: number) => {
    const updatedSources = facebookSources.filter((_, i) => i !== index);
    saveFacebookSources(updatedSources);

    toast({
      title: 'Success',
      description: 'Facebook RSS source removed successfully',
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
          Facebook RSS Sources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new Facebook source */}
        <div className="space-y-4 p-4 border rounded-lg">
          <h4 className="font-medium">Add Facebook RSS Source</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fb-name">Source Name</Label>
              <Input
                id="fb-name"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
                placeholder="e.g., BBC Facebook, CNN Facebook"
              />
            </div>
            <div>
              <Label htmlFor="fb-url">RSS Feed URL</Label>
              <Input
                id="fb-url"
                value={newSourceUrl}
                onChange={(e) => setNewSourceUrl(e.target.value)}
                placeholder="https://rsshub.app/facebook/page/BBCNews"
              />
            </div>
          </div>
          <Button onClick={addFacebookSource} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Facebook RSS Source
          </Button>
        </div>

        {/* List existing Facebook sources */}
        <div className="space-y-2">
          <h4 className="font-medium">Configured Facebook RSS Sources ({facebookSources.length})</h4>
          {facebookSources.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No Facebook RSS sources configured. Add your first Facebook RSS feed above.
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
          <p><strong>Note:</strong> Add Facebook RSS feeds from services like RSSHub (e.g., https://rsshub.app/facebook/page/PageName) or other RSS aggregators that provide Facebook content feeds.</p>
        </div>
      </CardContent>
    </Card>
  );
};
