import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, Settings, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNavigate } from 'react-router-dom';

const Translation = () => {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openaiConfig, setOpenaiConfig] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const languages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'nl', name: 'Dutch' },
    { code: 'sv', name: 'Swedish' },
    { code: 'da', name: 'Danish' },
    { code: 'no', name: 'Norwegian' }
  ];

  useEffect(() => {
    // Load OpenAI API key from settings
    const loadApiKey = () => {
      try {
        const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
        const apiKeyConfigs = settings.apiKeyConfigs || [];
        const activeConfigId = settings.activeApiKeyId;
        
        // Find active OpenAI config or first OpenAI config
        let openaiKey = apiKeyConfigs.find((config: any) => 
          config.id === activeConfigId && config.provider === 'openai'
        ) || apiKeyConfigs.find((config: any) => config.provider === 'openai');
        
        setOpenaiConfig(openaiKey);
      } catch (error) {
        console.error('Failed to load API key from settings:', error);
      }
    };

    loadApiKey();
  }, []);

  // SEO metadata for this page
  useEffect(() => {
    document.title = 'AI Translation - Auto Language Detection';
    const ensureMeta = (name: string, content: string) => {
      let m = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!m) {
        m = document.createElement('meta');
        m.setAttribute('name', name);
        document.head.appendChild(m);
      }
      m.setAttribute('content', content);
    };
    ensureMeta('description', 'AI translation with automatic language detection using OpenAI.');

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, []);

  const detectLanguage = async (text: string) => {
    if (!openaiConfig?.apiKey || !text.trim()) {
      console.log('Language detection skipped:', { hasApiKey: !!openaiConfig?.apiKey, hasText: !!text.trim() });
      return '';
    }

    console.log('Starting language detection for:', text.substring(0, 50) + '...');
    setIsDetecting(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openaiConfig.selectedModel || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Detect the language of the given text and return only the language name in English (e.g., "Spanish", "French", "German", etc.). Do not include any other text or explanation.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          temperature: 0.1,
          max_tokens: 20
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const detected = data.choices[0].message.content.trim();
        console.log('Language detected:', detected);
        setDetectedLanguage(detected);
        return detected;
      } else {
        console.error('Language detection API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Language detection error:', error);
    } finally {
      setIsDetecting(false);
    }
    return '';
  };

  useEffect(() => {
    if (!sourceText.trim() || !openaiConfig?.apiKey) return;
    const id = setTimeout(() => {
      detectLanguage(sourceText);
    }, 600);
    return () => clearTimeout(id);
  }, [sourceText, openaiConfig?.apiKey]);

  const translateText = async () => {
    console.log('Translation started', { 
      hasApiKey: !!openaiConfig?.apiKey, 
      hasSourceText: !!sourceText.trim(), 
      hasTargetLanguage: !!targetLanguage,
      detectedLanguage 
    });

    if (!openaiConfig?.apiKey) {
      toast({
        title: "API Key Required",
        description: "Please configure your OpenAI API key in settings first",
        variant: "destructive"
      });
      return;
    }

    if (!sourceText.trim()) {
      toast({
        title: "Text Required",
        description: "Please enter text to translate",
        variant: "destructive"
      });
      return;
    }

    if (!targetLanguage) {
      toast({
        title: "Language Required",
        description: "Please select a target language",
        variant: "destructive"
      });
      return;
    }

    setIsTranslating(true);

    // Auto-detect language if not already detected
    if (!detectedLanguage) {
      await detectLanguage(sourceText);
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiConfig.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: openaiConfig.selectedModel || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the given text from ${detectedLanguage || 'the detected language'} to ${languages.find(l => l.code === targetLanguage)?.name}. Only return the translated text, nothing else.`
            },
            {
              role: 'user',
              content: sourceText
            }
          ],
          temperature: 0.2,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setTranslatedText(data.choices[0].message.content);
      
      toast({
        title: "Translation Complete",
        description: "Text has been successfully translated"
      });
    } catch (error) {
      console.error('Translation error:', error);
      toast({
        title: "Translation Failed",
        description: "Failed to translate text. Please check your API key configuration in settings.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async () => {
    if (translatedText) {
      await navigator.clipboard.writeText(translatedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Translation copied to clipboard"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">AI Translation</h1>
          <p className="text-muted-foreground">Translate any text using ChatGPT AI</p>
        </div>

        {!openaiConfig ? (
          <Alert className="mb-6">
            <Settings className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>No OpenAI API key configured. Please add one in settings first.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="ml-2"
              >
                <Settings className="h-4 w-4 mr-1" />
                Go to Settings
              </Button>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-6">
            <Check className="h-4 w-4" />
            <AlertDescription>
              Using API key: <strong>{openaiConfig.name}</strong> ({openaiConfig.selectedModel || 'gpt-3.5-turbo'})
            </AlertDescription>
          </Alert>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Source Text</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter the text you want to translate..."
                value={sourceText}
                onChange={(e) => {
                  setSourceText(e.target.value);
                  setDetectedLanguage('');
                  setTranslatedText('');
                }}
                onBlur={() => {
                  if (sourceText.trim() && openaiConfig?.apiKey) {
                    detectLanguage(sourceText);
                  }
                }}
                className="min-h-[300px]"
              />
              
              {(isDetecting || detectedLanguage) && (
                <div className="text-sm text-muted-foreground">
                  {isDetecting ? (
                    <div className="flex items-center">
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Detecting language...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="mr-2 h-3 w-3" />
                      Detected language: <strong className="ml-1">{detectedLanguage}</strong>
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="targetLanguage">Target Language</Label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={translateText} 
                disabled={isTranslating || !openaiConfig}
                className="w-full"
              >
                {isTranslating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Translating...
                  </>
                ) : (
                  'Translate Text'
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Translated Text
                {translatedText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Translation will appear here..."
                value={translatedText}
                readOnly
                className="min-h-[300px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Translation;