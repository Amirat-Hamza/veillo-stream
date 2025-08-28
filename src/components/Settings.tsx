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
import { Plus, Trash2, GripVertical, Download, Upload, Save, RotateCcw, ExternalLink } from 'lucide-react';
import { NewsSource } from '@/types/news';

interface SettingsData {
  rssSources: NewsSource[];
  refreshInterval: number;
  soundNotifications: boolean;
  dndStart: string;
  dndEnd: string;
  selectedAiProvider: string;
  selectedModel: string;
  availableModels: string[];
  openaiApiKey: string;
  geminiApiKey: string;
  deepseekApiKey: string;
  claudeApiKey: string;
  huggingfaceApiKey: string;
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
  selectedAiProvider: 'openai',
  selectedModel: '',
  availableModels: [],
  openaiApiKey: '',
  geminiApiKey: '',
  deepseekApiKey: '',
  claudeApiKey: '',
  huggingfaceApiKey: '',
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
  const { toast } = useToast();

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
      title: "Settings Load Failed",
      description: "Using default settings.",
      variant: "destructive"
    });
  }
};

const saveSettings = () => {
  try {
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    toast({
      title: "Save Failed",
      description: "Failed to save settings.",
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
    title: "Settings Reset",
    description: "All settings have been reset to defaults.",
  });
};

  const addSource = () => {
    if (!newSource.name.trim() || !newSource.url.trim()) {
      toast({
        title: "Invalid Source",
        description: "Please provide both name and URL.",
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
      title: "Source Added",
      description: `${newSource.name} has been added to your sources.`,
    });
  };

  const removeSource = (index: number) => {
    const sourceName = settings.rssSources[index].name;
    setSettings(prev => ({
      ...prev,
      rssSources: prev.rssSources.filter((_, i) => i !== index)
    }));

    toast({
      title: "Source Removed",
      description: `${sourceName} has been removed.`,
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
        title: "Export Successful",
        description: "Your data has been exported successfully.",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data.",
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
          title: "Import Successful",
          description: "Your data has been imported successfully.",
        });
      } catch (error) {
        console.error('Import failed:', error);
        toast({
          title: "Import Failed",
          description: "Invalid file format or corrupted data.",
          variant: "destructive"
        });
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Function to detect available models based on API key
  const detectModels = async (provider: string, apiKey: string) => {
    if (!apiKey.trim()) {
      setSettings(prev => ({ ...prev, availableModels: [], selectedModel: '' }));
      return;
    }

    setModelLoading(true);
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
              // Fallback to common OpenAI models if API call fails
              models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
            }
          } catch {
            models = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
          }
          break;

        case 'gemini':
          // Google Gemini models (predefined as they don't have a public models endpoint)
          models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-pro-vision'];
          break;

        case 'deepseek':
          // DeepSeek models
          models = ['deepseek-chat', 'deepseek-coder', 'deepseek-v2-chat'];
          break;

        case 'claude':
          // Anthropic Claude models
          models = [
            'claude-3-5-sonnet-20241022', 
            'claude-3-opus-20240229', 
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
          ];
          break;

        case 'huggingface':
          // Popular HuggingFace models for text generation
          models = [
            'meta-llama/Meta-Llama-3.1-8B-Instruct',
            'microsoft/DialoGPT-medium',
            'mistralai/Mistral-7B-Instruct-v0.1',
            'google/flan-t5-large',
            'facebook/blenderbot-400M-distill'
          ];
          break;
      }

      setSettings(prev => ({
        ...prev,
        availableModels: models,
        selectedModel: models.length > 0 ? models[0] : ''
      }));

      if (models.length > 0) {
        toast({
          title: "Models Detected",
          description: `Found ${models.length} available models for ${provider}`,
        });
      }
    } catch (error) {
      console.error('Error detecting models:', error);
      toast({
        title: "Model Detection Failed",
        description: "Using default models for this provider",
        variant: "destructive"
      });
    } finally {
      setModelLoading(false);
    }
  };

  // Handle API key changes
  const handleApiKeyChange = (provider: string, value: string) => {
    const keyMap: Record<string, keyof SettingsData> = {
      openai: 'openaiApiKey',
      gemini: 'geminiApiKey',
      deepseek: 'deepseekApiKey',
      claude: 'claudeApiKey',
      huggingface: 'huggingfaceApiKey'
    };
    
    setSettings(prev => ({ ...prev, [keyMap[provider]]: value }));
    
    // Detect models after a short delay to avoid too many API calls
    setTimeout(() => detectModels(provider, value), 500);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="flex gap-2">
          <Button onClick={resetSettings} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveSettings} size="sm">
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* RSS Sources Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📡 RSS Sources
            <Badge variant="secondary">{settings.rssSources.length} sources</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add New Source */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/50">
            <Input
              placeholder="Source name"
              value={newSource.name}
              onChange={(e) => setNewSource(prev => ({ ...prev, name: e.target.value }))}
            />
            <Input
              placeholder="RSS URL"
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
  <SelectItem value="General">General</SelectItem>
  <SelectItem value="Technology">Technology</SelectItem>
  <SelectItem value="Politics">Politics</SelectItem>
  <SelectItem value="Sports">Sports</SelectItem>
  <SelectItem value="Business">Business</SelectItem>
  <SelectItem value="International">International</SelectItem>
  <SelectItem value="Tunisia">Tunisia</SelectItem>
  <SelectItem value="Algeria">Algeria</SelectItem>
</SelectContent>
            </Select>
            <Button onClick={addSource} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Source
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
                    placeholder="Source name"
                  />
                  <Input
                    value={source.url}
                    onChange={(e) => updateSource(index, 'url', e.target.value)}
                    placeholder="RSS URL"
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
  <SelectItem value="General">General</SelectItem>
  <SelectItem value="Technology">Technology</SelectItem>
  <SelectItem value="Politics">Politics</SelectItem>
  <SelectItem value="Sports">Sports</SelectItem>
  <SelectItem value="Business">Business</SelectItem>
  <SelectItem value="International">International</SelectItem>
  <SelectItem value="Tunisia">Tunisia</SelectItem>
  <SelectItem value="Algeria">Algeria</SelectItem>
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
          <CardTitle>⚙️ General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Default Refresh Interval</Label>
              <Select
                value={settings.refreshInterval.toString()}
                onValueChange={(value) => setSettings(prev => ({ ...prev, refreshInterval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
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
            <h3 className="font-semibold">🔔 Notifications</h3>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">Play sound when new articles arrive</p>
              </div>
              <Switch
                checked={settings.soundNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, soundNotifications: checked }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Do Not Disturb Start</Label>
                <Input
                  type="time"
                  value={settings.dndStart}
                  onChange={(e) => setSettings(prev => ({ ...prev, dndStart: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Do Not Disturb End</Label>
                <Input
                  type="time"
                  value={settings.dndEnd}
                  onChange={(e) => setSettings(prev => ({ ...prev, dndEnd: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Provider Selection & API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🤖 AI Features
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApiKeys(!showApiKeys)}
            >
              {showApiKeys ? 'Hide' : 'Show'} API Keys
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Select
                value={settings.selectedAiProvider}
                onValueChange={(value) => setSettings(prev => ({ ...prev, selectedAiProvider: value }))}
              >
                <SelectTrigger className="bg-background border border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  <SelectItem value="openai">
                    <div className="flex items-center justify-between w-full">
                      <span>🧠 OpenAI (ChatGPT)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="gemini">
                    <div className="flex items-center justify-between w-full">
                      <span>🔮 Google Gemini</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="deepseek">
                    <div className="flex items-center justify-between w-full">
                      <span>🚀 DeepSeek</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="claude">
                    <div className="flex items-center justify-between w-full">
                      <span>🎭 Anthropic Claude</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="huggingface">
                    <div className="flex items-center justify-between w-full">
                      <span>🤗 Hugging Face</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Get API Keys Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  const urls: Record<string, string> = {
                    openai: 'https://platform.openai.com/api-keys',
                    gemini: 'https://aistudio.google.com/app/apikey',
                    deepseek: 'https://platform.deepseek.com/api_keys',
                    claude: 'https://console.anthropic.com/settings/keys',
                    huggingface: 'https://huggingface.co/settings/tokens'
                  };
                  window.open(urls[settings.selectedAiProvider], '_blank');
                }}
                className="w-auto"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get {settings.selectedAiProvider === 'openai' ? 'OpenAI' : 
                     settings.selectedAiProvider === 'gemini' ? 'Google Gemini' :
                     settings.selectedAiProvider === 'deepseek' ? 'DeepSeek' :
                     settings.selectedAiProvider === 'claude' ? 'Anthropic Claude' :
                     'Hugging Face'} API Key
              </Button>
            </div>

            {/* Provider Info Cards */}
            {settings.selectedAiProvider === 'openai' && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">🧠 OpenAI (ChatGPT)</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Models: GPT-4, GPT-3.5 Turbo<br/>
                  Pricing: Pay-per-use (requires billing setup)
                </p>
              </div>
            )}

            {settings.selectedAiProvider === 'gemini' && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">🔮 Google Gemini</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Models: Gemini Pro, Gemini Flash<br/>
                  Pricing: Has free tier, then pay-per-use
                </p>
              </div>
            )}

            {settings.selectedAiProvider === 'deepseek' && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">🚀 DeepSeek</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Models: DeepSeek-V2, DeepSeek-Coder<br/>
                  Pricing: Very affordable, competitive rates
                </p>
              </div>
            )}

            {settings.selectedAiProvider === 'claude' && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">🎭 Anthropic Claude</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Models: Claude 3.5 Sonnet, Claude 3 Opus<br/>
                  Pricing: Pay-per-use
                </p>
              </div>
            )}

            {settings.selectedAiProvider === 'huggingface' && (
              <div className="p-3 bg-muted/50 rounded-lg border">
                <h4 className="font-medium mb-2">🤗 Hugging Face</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Models: Open source models, Llama, Mistral<br/>
                  Pricing: Many free models available
                </p>
              </div>
            )}

            {showApiKeys && (
              <div className="space-y-4 pt-4 border-t">
                {/* OpenAI API Key */}
                {settings.selectedAiProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings.openaiApiKey}
                      onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for ChatGPT and GPT-4 models</p>
                  </div>
                )}

                {/* Gemini API Key */}
                {settings.selectedAiProvider === 'gemini' && (
                  <div className="space-y-2">
                    <Label>Google Gemini API Key</Label>
                    <Input
                      type="password"
                      placeholder="AIza..."
                      value={settings.geminiApiKey}
                      onChange={(e) => handleApiKeyChange('gemini', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for Gemini Pro and Flash models</p>
                  </div>
                )}

                {/* DeepSeek API Key */}
                {settings.selectedAiProvider === 'deepseek' && (
                  <div className="space-y-2">
                    <Label>DeepSeek API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-..."
                      value={settings.deepseekApiKey}
                      onChange={(e) => handleApiKeyChange('deepseek', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for DeepSeek-V2 and Coder models</p>
                  </div>
                )}

                {/* Claude API Key */}
                {settings.selectedAiProvider === 'claude' && (
                  <div className="space-y-2">
                    <Label>Anthropic Claude API Key</Label>
                    <Input
                      type="password"
                      placeholder="sk-ant-..."
                      value={settings.claudeApiKey}
                      onChange={(e) => handleApiKeyChange('claude', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for Claude 3.5 Sonnet and Opus models</p>
                  </div>
                )}

                {/* HuggingFace API Key */}
                {settings.selectedAiProvider === 'huggingface' && (
                  <div className="space-y-2">
                    <Label>HuggingFace API Key</Label>
                    <Input
                      type="password"
                      placeholder="hf_..."
                      value={settings.huggingfaceApiKey}
                      onChange={(e) => handleApiKeyChange('huggingface', e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">Used for open source AI models</p>
                  </div>
                )}

                {/* Model Selection - appears when models are detected */}
                {settings.availableModels.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <Label className="flex items-center gap-2">
                      Available Models
                      {modelLoading && (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      )}
                    </Label>
                    <Select
                      value={settings.selectedModel}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, selectedModel: value }))}
                    >
                      <SelectTrigger className="bg-background border border-border">
                        <SelectValue placeholder="Select a model..." />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50">
                        {settings.availableModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {settings.availableModels.length} model{settings.availableModels.length !== 1 ? 's' : ''} detected for your API key
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Data Security */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Data Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Data Encryption</Label>
              <p className="text-sm text-muted-foreground">Encrypt stored data with a passphrase</p>
            </div>
            <Switch
              checked={settings.encryptionEnabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
            />
          </div>

          {settings.encryptionEnabled && (
            <div className="space-y-2">
              <Label>Encryption Passphrase</Label>
              <Input
                type="password"
                placeholder="Enter a secure passphrase"
                value={settings.encryptionPassphrase}
                onChange={(e) => setSettings(prev => ({ ...prev, encryptionPassphrase: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                This passphrase will be required to decrypt your data. Keep it safe!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>💾 Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={exportData} variant="outline" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Export Data
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
                Import Data
              </Button>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground space-y-1">
            <p>• Export includes all articles, settings, and reading history</p>
            <p>• Use import/export to sync data between devices</p>
            <p>• Data is exported in JSON format for easy backup</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
