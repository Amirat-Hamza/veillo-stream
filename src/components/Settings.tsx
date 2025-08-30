import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Plus, Globe, Bell, Clock, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { NewsSource } from '@/types/news';
import { useTranslation } from '@/hooks/useTranslation';
import { FacebookSourcesManager } from './FacebookSourcesManager';

const DEFAULT_SOURCES: NewsSource[] = [
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International' },
  { name: 'Echorouk Online', url: 'https://www.echoroukonline.com/feed/', category: 'Algeria' },
  { name: 'Ennahar Online', url: 'https://www.ennaharonline.com/feed/', category: 'Algeria' },
  { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia' },
  { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia' },
];

export const Settings = () => {
  const [rssSources, setRssSources] = useState<NewsSource[]>([]);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceCategory, setNewSourceCategory] = useState('International');
  const [refreshInterval, setRefreshInterval] = useState(15);
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [dndStart, setDndStart] = useState('22:00');
  const [dndEnd, setDndEnd] = useState('08:00');
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    setRssSources(settings.rssSources || DEFAULT_SOURCES);
    setRefreshInterval(settings.refreshInterval || 15);
    setSoundNotifications(settings.soundNotifications !== false);
    setDndStart(settings.dndStart || '22:00');
    setDndEnd(settings.dndEnd || '08:00');
  }, []);

  const saveSettings = (updatedSettings: any) => {
    localStorage.setItem('newsVeilleSettings', JSON.stringify(updatedSettings));
  };

  const saveRssSources = (sources: NewsSource[]) => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.rssSources = sources;
    saveSettings(settings);
    setRssSources(sources);
    
    // Trigger refresh event
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
  };

  const addRssSource = () => {
    if (!newSourceName.trim() || !newSourceUrl.trim()) {
      toast({
        title: t('error'),
        description: t('pleaseProvideNameAndUrl'),
        variant: 'destructive',
      });
      return;
    }

    const newSource: NewsSource = {
      name: newSourceName.trim(),
      url: newSourceUrl.trim(),
      category: newSourceCategory,
      enabled: true,
    };

    const updatedSources = [...rssSources, newSource];
    saveRssSources(updatedSources);

    setNewSourceName('');
    setNewSourceUrl('');

    toast({
      title: t('success'),
      description: t('rssSourceAdded'),
    });
  };

  const removeRssSource = (index: number) => {
    const updatedSources = rssSources.filter((_, i) => i !== index);
    saveRssSources(updatedSources);

    toast({
      title: t('success'),
      description: t('rssSourceRemoved'),
    });
  };

  const toggleRssSource = (index: number, enabled: boolean) => {
    const updatedSources = rssSources.map((source, i) =>
      i === index ? { ...source, enabled } : source
    );
    saveRssSources(updatedSources);
  };

  const handleRefreshIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.refreshInterval = interval;
    saveSettings(settings);
  };

  const handleSoundNotificationsChange = (enabled: boolean) => {
    setSoundNotifications(enabled);
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.soundNotifications = enabled;
    saveSettings(settings);
  };

  const handleDndStartChange = (time: string) => {
    setDndStart(time);
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.dndStart = time;
    saveSettings(settings);
  };

  const handleDndEndChange = (time: string) => {
    setDndEnd(time);
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.dndEnd = time;
    saveSettings(settings);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('settings')}</h1>
      </div>

      <Tabs defaultValue="sources" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('sources')}
          </TabsTrigger>
          <TabsTrigger value="facebook" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            {t('notifications')}
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('general')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('rssSources')} ({rssSources.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new RSS source */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">{t('addRssSource')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rss-name">{t('sourceName')}</Label>
                    <Input
                      id="rss-name"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      placeholder={t('sourceNameExample')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rss-url">{t('rssFeedUrl')}</Label>
                    <Input
                      id="rss-url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder={t('rssFeedUrlExample')}
                    />
                  </div>
                  <div>
                    <Label htmlFor="rss-category">{t('category')}</Label>
                    <Select value={newSourceCategory} onValueChange={setNewSourceCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t('selectCategory')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="International">{t('international')}</SelectItem>
                        <SelectItem value="Algeria">{t('algeria')}</SelectItem>
                        <SelectItem value="Tunisia">{t('tunisia')}</SelectItem>
                        {/* Add more categories as needed */}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addRssSource} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addRssSource')}
                </Button>
              </div>

              {/* List existing RSS sources */}
              <div className="space-y-2">
                <h4 className="font-medium">{t('configuredRssSources')} ({rssSources.length})</h4>
                {rssSources.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    {t('noRssSourcesConfigured')}
                  </p>
                ) : (
                  rssSources.map((source, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{source.name}</div>
                        <div className="text-sm text-muted-foreground truncate">
                          {source.url}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {t('category')}: {source.category}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={source.enabled !== false}
                          onCheckedChange={(enabled) => toggleRssSource(index, enabled)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRssSource(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="facebook" className="space-y-6">
          <FacebookSourcesManager />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                {t('notificationSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{t('refreshInterval')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('refreshIntervalDescription')}
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[15, 30, 60, 120].map(interval => (
                    <Button
                      key={interval}
                      variant={refreshInterval === interval ? 'default' : 'outline'}
                      onClick={() => handleRefreshIntervalChange(interval)}
                    >
                      {interval} {t('minutes')}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">{t('soundNotifications')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('soundNotificationsDescription')}
                </p>
                <Switch
                  checked={soundNotifications}
                  onCheckedChange={handleSoundNotificationsChange}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('generalSettings')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">{t('doNotDisturb')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('doNotDisturbDescription')}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dnd-start">{t('startTime')}</Label>
                    <Input
                      type="time"
                      id="dnd-start"
                      value={dndStart}
                      onChange={(e) => handleDndStartChange(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dnd-end">{t('endTime')}</Label>
                    <Input
                      type="time"
                      id="dnd-end"
                      value={dndEnd}
                      onChange={(e) => handleDndEndChange(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
