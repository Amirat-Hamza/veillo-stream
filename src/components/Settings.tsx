import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, GripVertical, Download, Upload, Save, RotateCcw, ExternalLink, Edit2 } from 'lucide-react';
import { NewsSource } from '@/types/news';
import { useApiModels } from '@/hooks/useApiModels';
import { useTranslation } from '@/hooks/useTranslation';

interface ApiKeyConfig {
  id: string;
  provider: string;
  apiKey: string;
  selectedModel: string;
  name: string;
  isActive: boolean;
}

interface SettingsData {
  rssSources: NewsSource[];
  refreshInterval: number;
  soundNotifications: boolean;
  dndStart: string;
  dndEnd: string;
  apiKeyConfigs: ApiKeyConfig[];
  activeApiKeyId: string;
  encryptionEnabled: boolean;
  encryptionPassphrase: string;
  language: string;
  theme: string;
}

const defaultSettings: SettingsData = {
  rssSources: [
    { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/rss.xml', category: 'International', enabled: true, interval: 15 },
    { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'International', enabled: true, interval: 15 },
    { name: 'Echorouk Online', url: 'https://www.echoroukonline.com/feed/', category: 'Algeria', enabled: true, interval: 30 },
    { name: 'Ennahar Online', url: 'https://www.ennaharonline.com/feed/', category: 'Algeria', enabled: true, interval: 30 },
    { name: 'TAP', url: 'https://www.tap.info.tn/rss', category: 'Tunisia', enabled: true, interval: 30 },
    { name: 'Mosaique FM', url: 'https://www.mosaiquefm.net/rss', category: 'Tunisia', enabled: true, interval: 30 }
  ],
  refreshInterval: 15,
  soundNotifications: true,
  dndStart: '22:00',
  dndEnd: '08:00',
  apiKeyConfigs: [],
  activeApiKeyId: '',
  encryptionEnabled: false,
  encryptionPassphrase: '',
  language: 'en',
  theme: 'light'
};

export const Settings = () => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [newSource, setNewSource] = useState({ name: '', url: '', category: 'General' });
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [editingApiKey, setEditingApiKey] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState({
    provider: 'openai',
    apiKey: '',
    name: '',
    selectedModel: ''
  });
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    loadSettings();
  }, []);

const loadSettings = () => {
  try {
    const stored = localStorage.getItem('newsVeilleSettings');
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      const storedSources = Array.isArray(parsedSettings.rssSources) ? parsedSettings.rssSources : [];
      const defaults = defaultSettings.rssSources;
      const norm = (u: string) => (u || '').trim().replace(/\/+$/, '');
      const byUrl = new Map<string, NewsSource>();
      storedSources.forEach((src: NewsSource) => {
        const key = norm(src.url);
        byUrl.set(key, { ...src, enabled: src.enabled !== false });
      });
      defaults.forEach((src) => {
        const key = norm(src.url);
        if (!byUrl.has(key)) byUrl.set(key, { ...src, enabled: true });
      });
      const merged = { ...defaultSettings, ...parsedSettings, rssSources: Array.from(byUrl.values()) };
      setSettings(merged);
    } else {
      setSettings(defaultSettings);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
    toast({
      title: t('settingsLoadFailed'),
      description: t('usingDefaultSettings'),
      variant: "destructive"
    });
  }
};

const saveSettings = () => {
  try {
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
    window.dispatchEvent(new CustomEvent('newsVeille:settingsUpdated'));
    toast({
      title: t('settingsSaved'),
      description: t('settingsSavedDesc'),
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    toast({
      title: t('saveFailed'),
      description: t('saveFailedDesc'),
      variant: "destructive"
    });
  }
};

const resetSettings = () => {
  setSettings(defaultSettings);
  try {
    localStorage.setItem('newsVeilleSettings', JSON.stringify(defaultSettings));
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
  } catch {}
  toast({
    title: t('settingsReset'),
    description: t('settingsResetDesc'),
  });
};

  const addSource = () => {
    if (!newSource.name.trim() || !newSource.url.trim()) {
      toast({
        title: t('invalidSource'),
        description: t('invalidSourceDesc'),
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate URLs
    const normalizeUrl = (url: string) => url.trim().replace(/\/+$/, '').toLowerCase();
    const newNormalizedUrl = normalizeUrl(newSource.url);
    const isDuplicate = settings.rssSources.some(source => 
      normalizeUrl(source.url) === newNormalizedUrl
    );

    if (isDuplicate) {
      toast({
        title: t('duplicateUrl'),
        description: t('duplicateUrlDesc'),
        variant: "destructive"
      });
      return;
    }

    const source: NewsSource = {
      ...newSource,
      enabled: true,
      interval: 15
    };

    // Update state and persist immediately so the app can react
    const updated = {
      ...settings,
      rssSources: [...settings.rssSources, source]
    };
    setSettings(updated);
    try {
      localStorage.setItem('newsVeilleSettings', JSON.stringify(updated));
      // Notify the app to refresh sources and fetch articles for the new feed
      window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
    } catch (e) {
      console.error('Failed to persist new source', e);
    }

    setNewSource({ name: '', url: '', category: 'General' });

    toast({
      title: t('sourceAdded'),
      description: `${newSource.name} ${t('addedToSources')}`,
    });
  };

  const removeSource = (index: number) => {
    const sourceName = settings.rssSources[index].name;
    setSettings(prev => ({
      ...prev,
      rssSources: prev.rssSources.filter((_, i) => i !== index)
    }));

    toast({
      title: t('sourceRemoved'),
      description: `${sourceName} ${t('hasBeenRemoved')}`,
    });
  };

  const updateSource = (index: number, field: keyof NewsSource, value: any) => {
    setSettings(prev => ({
      ...prev,
      rssSources: prev.rssSources.map((source, i) => 
        i === index ? { ...source, [field]: value } : source
      )
    }));
  };

  const moveSource = (fromIndex: number, toIndex: number) => {
    const newSources = [...settings.rssSources];
    const [movedSource] = newSources.splice(fromIndex, 1);
    newSources.splice(toIndex, 0, movedSource);
    
    setSettings(prev => ({
      ...prev,
      rssSources: newSources
    }));
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      moveSource(draggedIndex, index);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const exportData = () => {
    try {
      const articles = JSON.parse(localStorage.getItem('newsVeilleArticles') || '[]');
      const readingHistory = JSON.parse(localStorage.getItem('newsVeilleReadingHistory') || '{}');
      
      const exportData = {
        settings,
        articles,
        readingHistory,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `news-veille-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      URL.revokeObjectURL(url);

      toast({
        title: t('exportSuccessful'),
        description: t('exportSuccessfulDesc'),
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: t('exportFailed'),
        description: t('exportFailedDesc'),
        variant: "destructive"
      });
    }
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        if (importedData.settings) {
          setSettings({ ...defaultSettings, ...importedData.settings });
        }
        
        if (importedData.articles) {
          localStorage.setItem('newsVeilleArticles', JSON.stringify(importedData.articles));
        }
        
        if (importedData.readingHistory) {
          localStorage.setItem('newsVeilleReadingHistory', JSON.stringify(importedData.readingHistory));
        }

        toast({
          title: t('importSuccessful'),
          description: t('importSuccessfulDesc'),
        });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: t('importFailed'),
          description: t('importFailedDesc'),
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Function to detect available models based on API key
  const detectModels = async (provider: string, apiKey: string): Promise<string[]> => {
    if (!apiKey.trim()) {
      return [];
    }

    try {
      let models: string[] = [];
      
      switch (provider) {
        case 'openai':
          try {
            const response = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (response.ok) {
              const data = await response.json();
              models = data.data
                .filter((model: any) => model.id.includes('gpt'))
                .map((model: any) => model.id)
                .sort();
            } else {
              models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
            }
          } catch {
            models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
          }
          break;

        case 'gemini':
          models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'];
          break;

        case 'deepseek':
          models = ['deepseek-chat', 'deepseek-coder', 'deepseek-v2-chat'];
          break;

        case 'claude':
          models = [
            'claude-3-5-sonnet-20241022', 
            'claude-3-opus-20240229', 
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
          ];
          break;

        case 'huggingface':
          models = [
            'meta-llama/Meta-Llama-3.1-8B-Instruct',
            'microsoft/DialoGPT-medium',
            'mistralai/Mistral-7B-Instruct-v0.1',
            'google/flan-t5-large',
            'facebook/blenderbot-400M-distill'
          ];
          break;

        case 'openrouter':
          models = [
            'anthropic/claude-3.5-sonnet',
            'openai/gpt-4o',
            'openai/gpt-4o-mini',
            'google/gemini-pro-1.5',
            'meta-llama/llama-3.1-8b-instruct',
            'mistralai/mistral-7b-instruct',
            'cohere/command-r-plus'
          ];
          break;
      }

      return models;
    } catch (error) {
      console.error('Error detecting models:', error);
      return [];
    }
  };

  const addApiKey = async () => {
    if (!newApiKey.apiKey.trim() || !newApiKey.name.trim()) {
      toast({
        title: t('invalidInput'),
        description: t('provideApiKeyAndName'),
        variant: "destructive"
      });
      return;
    }

    setModelLoading(true);
    const models = await detectModels(newApiKey.provider, newApiKey.apiKey);
    
    const apiKeyConfig: ApiKeyConfig = {
      id: Date.now().toString(),
      provider: newApiKey.provider,
      apiKey: newApiKey.apiKey,
      selectedModel: models.length > 0 ? models[0] : '',
      name: newApiKey.name,
      isActive: settings.apiKeyConfigs.length === 0
    };

    setSettings(prev => ({
      ...prev,
      apiKeyConfigs: [...prev.apiKeyConfigs, apiKeyConfig],
      activeApiKeyId: prev.apiKeyConfigs.length === 0 ? apiKeyConfig.id : prev.activeApiKeyId
    }));

    setNewApiKey({ provider: 'openai', apiKey: '', name: '', selectedModel: '' });
    setModelLoading(false);

    toast({
      title: t('apiKeyAdded'),
      description: `${newApiKey.name} ${t('addedSuccessfully')}`,
    });
  };

  const deleteApiKey = (id: string) => {
    const config = settings.apiKeyConfigs.find(c => c.id === id);
    setSettings(prev => {
      const newConfigs = prev.apiKeyConfigs.filter(c => c.id !== id);
      return {
        ...prev,
        apiKeyConfigs: newConfigs,
        activeApiKeyId: prev.activeApiKeyId === id ? (newConfigs[0]?.id || '') : prev.activeApiKeyId
      };
    });

  toast({
    title: t('apiKeyDeleted'),
    description: `${config?.name} ${t('hasBeenDeleted')}`,
  });
  };

  const setActiveApiKey = (id: string) => {
    setSettings(prev => ({
      ...prev,
      activeApiKeyId: id
    }));

    const config = settings.apiKeyConfigs.find(c => c.id === id);
    toast({
      title: t('activeApiKeyChanged'),
      description: `${t('nowUsing')} ${config?.name}`,
    });
  };

  const updateApiKeyModel = (id: string, model: string) => {
    setSettings(prev => ({
      ...prev,
      apiKeyConfigs: prev.apiKeyConfigs.map(config =>
        config.id === id ? { ...config, selectedModel: model } : config
      )
    }));
  };

  const getProviderInfo = (provider: string) => {
    const providerInfo = {
      openai: {
        name: 'OpenAI',
        url: 'https://platform.openai.com/api-keys',
        description: 'GPT models with excellent reasoning capabilities'
      },
      gemini: {
        name: 'Google Gemini',
        url: 'https://aistudio.google.com/app/apikey',
        description: 'Google\'s advanced AI with multimodal capabilities'
      },
      deepseek: {
        name: 'DeepSeek',
        url: 'https://platform.deepseek.com/api_keys',
        description: 'Powerful coding and reasoning models at low cost'
      },
      claude: {
        name: 'Anthropic Claude',
        url: 'https://console.anthropic.com/settings/keys',
        description: 'Advanced reasoning with strong safety features'
      },
      huggingface: {
        name: 'Hugging Face',
        url: 'https://huggingface.co/settings/tokens',
        description: 'Open-source models and transformers'
      },
      openrouter: {
        name: 'OpenRouter',
        url: 'https://openrouter.ai/keys',
        description: 'Access to multiple AI models through one API'
      }
    };
    return providerInfo[provider as keyof typeof providerInfo];
  };

  // Model Selector Component
  const ModelSelector = ({ config, onModelChange }: { config: ApiKeyConfig, onModelChange: (model: string) => void }) => {
    const { models, loading } = useApiModels(config.provider, config.apiKey);

    if (loading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          {t('detectingModels')}
        </div>
      );
    }

    if (models.length === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {t('noModelsDetected')}
        </div>
      );
    }

    return (
      <Select
        value={config.selectedModel}
        onValueChange={onModelChange}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => (
            <SelectItem key={model} value={model}>
              {model}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('settings')}</h1>
        <div className="flex gap-2">
          <Button onClick={resetSettings} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            {t('reset')}
          </Button>
          <Button onClick={saveSettings} size="sm">
            <Save className="w-4 h-4 mr-2" />
            {t('saveSettings')}
          </Button>
        </div>
        </div>

      {/* RSS Sources Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📡 {t('rssSources')}
            <Badge variant="secondary">{settings.rssSources.length} {t('sources')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Source */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/50">
            <Input
              placeholder={t('sourceName')}
              value={newSource.name}
              onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder={t('rssUrl')}
              value={newSource.url}
              onChange={(e) => setNewSource(prev => ({ ...prev, url: e.target.value }))}
            />
            <Select
              value={newSource.category}
              onValueChange={(value) => setNewSource(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
<SelectContent>
  <SelectItem value="General">{t('general')}</SelectItem>
  <SelectItem value="Technology">{t('technology')}</SelectItem>
  <SelectItem value="Politics">{t('politics')}</SelectItem>
  <SelectItem value="Sports">{t('sports')}</SelectItem>
  <SelectItem value="Business">{t('business')}</SelectItem>
  <SelectItem value="International">{t('international')}</SelectItem>
  <SelectItem value="Tunisia">{t('tunisia')}</SelectItem>
  <SelectItem value="Algeria">{t('algeria')}</SelectItem>
</SelectContent>
            </Select>
            <Button onClick={addSource} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              {t('addSource')}
            </Button>
          </div>

          {/* Existing Sources */}
          <div className="space-y-2">
            {settings.rssSources.map((source, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors ${
                  draggedIndex === index ? 'opacity-50' : ''
                }`}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={source.enabled}
                    onCheckedChange={(checked) => updateSource(index, 'enabled', checked)}
                  />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input
                    value={source.name}
                    onChange={(e) => updateSource(index, 'name', e.target.value)}
                    placeholder={t('sourceName')}
                  />
                  <Input
                    value={source.url}
                    onChange={(e) => updateSource(index, 'url', e.target.value)}
                    placeholder={t('rssUrl')}
                    className="text-sm"
                  />
                  <div className="flex gap-2">
                    <Select
                      value={source.category}
                      onValueChange={(value) => updateSource(index, 'category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
<SelectContent>
  <SelectItem value="General">{t('general')}</SelectItem>
  <SelectItem value="Technology">{t('technology')}</SelectItem>
  <SelectItem value="Politics">{t('politics')}</SelectItem>
  <SelectItem value="Sports">{t('sports')}</SelectItem>
  <SelectItem value="Business">{t('business')}</SelectItem>
  <SelectItem value="International">{t('international')}</SelectItem>
  <SelectItem value="Tunisia">{t('tunisia')}</SelectItem>
  <SelectItem value="Algeria">{t('algeria')}</SelectItem>
</SelectContent>
                    </Select>
                    <Select
                      value={source.interval?.toString() || '15'}
                      onValueChange={(value) => updateSource(index, 'interval', parseInt(value))}
                    >
                      <SelectTrigger className="w-20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5m</SelectItem>
                        <SelectItem value="15">15m</SelectItem>
                        <SelectItem value="30">30m</SelectItem>
                        <SelectItem value="60">60m</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  onClick={() => removeSource(index)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle>⚙️ {t('generalSettings')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t('defaultRefreshInterval')}</Label>
              <Select
                value={settings.refreshInterval.toString()}
                onValueChange={(value) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">{t('fiveMinutes')}</SelectItem>
                  <SelectItem value="15">{t('fifteenMinutes')}</SelectItem>
                  <SelectItem value="30">{t('thirtyMinutes')}</SelectItem>
                  <SelectItem value="60">{t('oneHour')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t('language')}</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => {
                  setSettings(prev => ({ ...prev, language: value }));
                  // Immediately save and notify about language change
                  const newSettings = { ...settings, language: value };
                  localStorage.setItem('newsVeilleSettings', JSON.stringify(newSettings));
                  window.dispatchEvent(new CustomEvent('newsVeille:settingsUpdated'));
                  
                  // Set document direction for Arabic
                  document.documentElement.dir = value === 'ar' ? 'rtl' : 'ltr';
                  document.documentElement.lang = value;
                  
                  toast({
                    title: t('languageChanged'),
                    description: t('languageChangedDesc'),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">🇺🇸 English</SelectItem>
                  <SelectItem value="fr">🇫🇷 Français</SelectItem>
                  <SelectItem value="ar">🇸🇦 العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notifications */}
          <div className="space-y-4">
            <h3 className="font-semibold">🔔 {t('notifications')}</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('soundNotifications')}</Label>
                <p className="text-sm text-muted-foreground">{t('playSoundOnNew')}</p>
              </div>
              <Switch
                checked={settings.soundNotifications}
                onCheckedChange={(checked) => {
                  const updated = { ...settings, soundNotifications: checked };
                  setSettings(updated);
                  try {
                    localStorage.setItem('newsVeilleSettings', JSON.stringify(updated));
                    window.dispatchEvent(new CustomEvent('newsVeille:settingsUpdated'));
                  } catch {}
                  if (checked) {
                    try {
                      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                      const oscillator = audioContext.createOscillator();
                      const gainNode = audioContext.createGain();
                      oscillator.connect(gainNode);
                      gainNode.connect(audioContext.destination);
                      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
                      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
                      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
                      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.1);
                      gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.6);
                      oscillator.start(audioContext.currentTime);
                      oscillator.stop(audioContext.currentTime + 0.6);
                    } catch (e) {
                      console.warn('Sound test failed:', e);
                    }
                  }
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t('dndStart')}</Label>
                <Input
                  type="time"
                  value={settings.dndStart}
                  onChange={(e) => {
                    const updated = { ...settings, dndStart: e.target.value };
                    setSettings(updated);
                    try {
                      localStorage.setItem('newsVeilleSettings', JSON.stringify(updated));
                      window.dispatchEvent(new CustomEvent('newsVeille:settingsUpdated'));
                    } catch {}
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('dndEnd')}</Label>
                <Input
                  type="time"
                  value={settings.dndEnd}
                  onChange={(e) => {
                    const updated = { ...settings, dndEnd: e.target.value };
                    setSettings(updated);
                    try {
                      localStorage.setItem('newsVeilleSettings', JSON.stringify(updated));
                      window.dispatchEvent(new CustomEvent('newsVeille:settingsUpdated'));
                    } catch {}
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🤖 {t('aiApiKeysManagement')}
            <Badge variant="secondary">{settings.apiKeyConfigs.length} {t('keys')}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New API Key */}
          <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
            <h3 className="font-medium">{t('addNewApiKey')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>{t('provider')}</Label>
                <Select
                  value={newApiKey.provider}
                  onValueChange={(value) => setNewApiKey(prev => ({ ...prev, provider: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">🧠 OpenAI</SelectItem>
                    <SelectItem value="gemini">🔮 Google Gemini</SelectItem>
                    <SelectItem value="deepseek">🚀 DeepSeek</SelectItem>
                    <SelectItem value="claude">🎭 Anthropic Claude</SelectItem>
                    <SelectItem value="huggingface">🤗 Hugging Face</SelectItem>
                    <SelectItem value="openrouter">🌐 OpenRouter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('name')}</Label>
                <Input
                  placeholder={t('myOpenAiKey')}
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('apiKey')}</Label>
              <Input
                type="password"
                placeholder="sk-..."
                value={newApiKey.apiKey}
                onChange={(e) => setNewApiKey(prev => ({ ...prev, apiKey: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={addApiKey} disabled={modelLoading}>
                {modelLoading ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {t('addApiKey')}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const info = getProviderInfo(newApiKey.provider);
                  if (info) window.open(info.url, '_blank');
                }}
              >
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('getApiKey')}
              </Button>
            </div>
            {/* Provider Info */}
            {(() => {
              const info = getProviderInfo(newApiKey.provider);
              return info ? (
                <div className="p-3 bg-background/50 rounded border">
                  <h4 className="font-medium mb-1">{info.name}</h4>
                  <p className="text-sm text-muted-foreground">{info.description}</p>
                </div>
              ) : null;
            })()}
          </div>

          {/* API Keys List */}
          {settings.apiKeyConfigs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium">{t('yourApiKeys')}</h3>
              {settings.apiKeyConfigs.map((config) => (
                <div
                  key={config.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    config.id === settings.activeApiKeyId ? 'border-primary bg-primary/5' : 'bg-card'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{config.name}</span>
                        <Badge variant="secondary">
                          {getProviderInfo(config.provider)?.name || config.provider}
                        </Badge>
                        {config.id === settings.activeApiKeyId && (
                          <Badge variant="default">{t('active')}</Badge>
                        )}
                      </div>
                    </div>
                     <div className="flex items-center gap-2">
                      <ModelSelector 
                        config={config}
                        onModelChange={(model) => updateApiKeyModel(config.id, model)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveApiKey(config.id)}
                        disabled={config.id === settings.activeApiKeyId}
                      >
                        {t('useThis')}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteApiKey(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    <p>{t('model')}: {config.selectedModel || t('autoDetecting')}</p>
                    <p>{t('apiKeyLabel')}: •••••••••{config.apiKey.slice(-8)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Key Selection */}
          {settings.apiKeyConfigs.length > 0 && (
            <div className="p-4 border rounded-lg bg-muted/20">
              <h3 className="font-medium mb-3">{t('selectActiveApiKey')}</h3>
              <Select
                value={settings.activeApiKeyId}
                onValueChange={setActiveApiKey}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectApiKeyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {settings.apiKeyConfigs.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {getProviderInfo(config.provider)?.name}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Security */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 {t('dataSecurity')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>{t('enableDataEncryption')}</Label>
              <p className="text-sm text-muted-foreground">{t('encryptWithPassphrase')}</p>
            </div>
            <Switch
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
            />
          </div>

          {settings.encryptionEnabled && (
            <div className="space-y-2">
              <Label>{t('encryptionPassphrase')}</Label>
              <Input
                type="password"
                placeholder={t('enterSecurePassphrase')}
                value={settings.encryptionPassphrase}
                onChange={(e) => setSettings(prev => ({ ...prev, encryptionPassphrase: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                {t('passphraseRequired')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>💾 {t('dataManagement')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={exportData} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              {t('exportData')}
            </Button>
            <div className="flex-1">
              <Input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
                id="import-input"
              />
              <Button
                onClick={() => document.getElementById('import-input')?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {t('importData')}
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>{t('exportIncludesAll')}</p>
            <p>{t('useImportExportToSync')}</p>
            <p>{t('dataExportedJson')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
