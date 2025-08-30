
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { facebookAuthScraper } from '@/services/facebookAuthScraper';

export const FacebookAuthSettings = () => {
  const [cookies, setCookies] = useState('');
  const [isEnabled, setIsEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    const savedCookies = settings.facebookCookies || '';
    setCookies(savedCookies);
    setIsEnabled(!!savedCookies);
    
    if (savedCookies) {
      facebookAuthScraper.setCookies(savedCookies);
    }
  }, []);

  const saveCookies = () => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.facebookCookies = cookies;
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    
    facebookAuthScraper.setCookies(cookies);
    setIsEnabled(!!cookies);
    
    toast({
      title: 'Success',
      description: cookies ? 'Facebook authentication enabled' : 'Facebook authentication disabled',
    });

    // Trigger refresh event
    window.dispatchEvent(new CustomEvent('newsVeille:sourcesUpdated'));
  };

  const clearCookies = () => {
    setCookies('');
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    delete settings.facebookCookies;
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    
    facebookAuthScraper.setCookies('');
    setIsEnabled(false);
    
    toast({
      title: 'Cleared',
      description: 'Facebook authentication disabled',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Facebook Authentication
          {isEnabled && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            To access Facebook posts, you need to provide login cookies from your browser session.
            This allows the scraper to access content as if you're logged in.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="fb-cookies">Facebook Session Cookies</Label>
          <Textarea
            id="fb-cookies"
            value={cookies}
            onChange={(e) => setCookies(e.target.value)}
            placeholder="Paste your Facebook cookies here..."
            className="min-h-[120px] font-mono text-sm"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={saveCookies} className="flex-1">
            {cookies ? 'Update Authentication' : 'Save Authentication'}
          </Button>
          {isEnabled && (
            <Button variant="outline" onClick={clearCookies}>
              Clear
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground space-y-2">
          <p><strong>How to get cookies:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Open Facebook in your browser and log in</li>
            <li>Press F12 to open Developer Tools</li>
            <li>Go to Application/Storage tab → Cookies → facebook.com</li>
            <li>Copy all cookie values in format: name=value; name2=value2;</li>
            <li>Paste them in the field above</li>
          </ol>
          <p><strong>Note:</strong> Cookies are stored locally and used only for scraping. They may expire and need periodic updates.</p>
        </div>
      </CardContent>
    </Card>
  );
};
