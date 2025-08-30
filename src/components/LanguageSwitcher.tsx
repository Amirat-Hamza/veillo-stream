
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

type Language = 'en' | 'fr' | 'ar';

export const LanguageSwitcher: React.FC = () => {
  const { t, currentLanguage } = useTranslation();
  const { toast } = useToast();

  const handleChange = (value: Language) => {
    const settings = JSON.parse(localStorage.getItem('newsVeilleSettings') || '{}');
    settings.language = value;
    localStorage.setItem('newsVeilleSettings', JSON.stringify(settings));
    // Notify the app of settings change so language updates immediately
    window.dispatchEvent(new Event('newsVeille:settingsUpdated'));

    toast({
      title: t('languageChanged'),
      description: t('languageChangedDesc'),
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={currentLanguage} onValueChange={(v) => handleChange(v as Language)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder={t('language')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="fr">Français</SelectItem>
          <SelectItem value="ar">العربية</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
