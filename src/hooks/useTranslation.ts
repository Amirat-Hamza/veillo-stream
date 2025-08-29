import { useState, useEffect } from 'react';

type Language = 'en' | 'fr' | 'ar';

interface Translations {
  [key: string]: {
    [key in Language]: string;
  };
}

const translations: Translations = {
  // Navigation & General
  'dashboard': {
    en: 'Dashboard',
    fr: 'Tableau de bord',
    ar: 'لوحة التحكم'
  },
  'settings': {
    en: 'Settings',
    fr: 'Paramètres',
    ar: 'الإعدادات'
  },
  'search': {
    en: 'Search',
    fr: 'Rechercher',
    ar: 'بحث'
  },
  'news': {
    en: 'News',
    fr: 'Actualités',
    ar: 'الأخبار'
  },
  'veille': {
    en: 'News Monitoring',
    fr: 'Veille Actualités',
    ar: 'رصد الأخبار'
  },

  // Dashboard
  'totalArticles': {
    en: 'Total Articles',
    fr: 'Articles Total',
    ar: 'إجمالي المقالات'
  },
  'activeSources': {
    en: 'Active Sources',
    fr: 'Sources Actives',
    ar: 'المصادر النشطة'
  },
  'unreadNews': {
    en: 'Unread News',
    fr: 'Actualités Non Lues',
    ar: 'الأخبار غير المقروءة'
  },
  'readingTime': {
    en: 'Reading Time',
    fr: 'Temps de Lecture',
    ar: 'وقت القراءة'
  },

  // Article actions
  'readMore': {
    en: 'Read More',
    fr: 'Lire Plus',
    ar: 'اقرأ المزيد'
  },
  'markAsRead': {
    en: 'Mark as Read',
    fr: 'Marquer comme Lu',
    ar: 'تحديد كمقروء'
  },
  'markAsUnread': {
    en: 'Mark as Unread',
    fr: 'Marquer comme Non Lu',
    ar: 'تحديد كغير مقروء'
  },
  'save': {
    en: 'Save',
    fr: 'Enregistrer',
    ar: 'حفظ'
  },
  'share': {
    en: 'Share',
    fr: 'Partager',
    ar: 'مشاركة'
  },

  // Categories
  'all': {
    en: 'All',
    fr: 'Tout',
    ar: 'الكل'
  },
  'general': {
    en: 'General',
    fr: 'Général',
    ar: 'عام'
  },
  'technology': {
    en: 'Technology',
    fr: 'Technologie',
    ar: 'التكنولوجيا'
  },
  'politics': {
    en: 'Politics',
    fr: 'Politique',
    ar: 'السياسة'
  },
  'sports': {
    en: 'Sports',
    fr: 'Sports',
    ar: 'الرياضة'
  },
  'business': {
    en: 'Business',
    fr: 'Business',
    ar: 'الأعمال'
  },
  'international': {
    en: 'International',
    fr: 'International',
    ar: 'دولي'
  },
  'tunisia': {
    en: 'Tunisia',
    fr: 'Tunisie',
    ar: 'تونس'
  },
  'algeria': {
    en: 'Algeria',
    fr: 'Algérie',
    ar: 'الجزائر'
  },

  // Settings sections
  'rssSources': {
    en: 'RSS Sources',
    fr: 'Sources RSS',
    ar: 'مصادر RSS'
  },
  'aiProviders': {
    en: 'AI Providers',
    fr: 'Fournisseurs IA',
    ar: 'مقدمي الذكاء الاصطناعي'
  },
  'notifications': {
    en: 'Notifications',
    fr: 'Notifications',
    ar: 'الإشعارات'
  },
  'dataSecurity': {
    en: 'Data Security',
    fr: 'Sécurité des Données',
    ar: 'أمان البيانات'
  },
  'dataManagement': {
    en: 'Data Management',
    fr: 'Gestion des Données',
    ar: 'إدارة البيانات'
  },

  // Time expressions
  'minutesAgo': {
    en: 'minutes ago',
    fr: 'il y a',
    ar: 'منذ دقائق'
  },
  'hoursAgo': {
    en: 'hours ago',
    fr: 'il y a',
    ar: 'منذ ساعات'
  },
  'daysAgo': {
    en: 'days ago',
    fr: 'il y a',
    ar: 'منذ أيام'
  },

  // Messages
  'noArticles': {
    en: 'No articles found',
    fr: 'Aucun article trouvé',
    ar: 'لم يتم العثور على مقالات'
  },
  'loading': {
    en: 'Loading...',
    fr: 'Chargement...',
    ar: 'جاري التحميل...'
  },
  'error': {
    en: 'Error',
    fr: 'Erreur',
    ar: 'خطأ'
  },
  'success': {
    en: 'Success',
    fr: 'Succès',
    ar: 'نجح'
  },

  // Filters
  'sortBy': {
    en: 'Sort by',
    fr: 'Trier par',
    ar: 'ترتيب حسب'
  },
  'filterBy': {
    en: 'Filter by',
    fr: 'Filtrer par',
    ar: 'تصفية حسب'
  },
  'newest': {
    en: 'Newest',
    fr: 'Plus récent',
    ar: 'الأحدث'
  },
  'oldest': {
    en: 'Oldest',
    fr: 'Plus ancien',
    ar: 'الأقدم'
  },
  'relevance': {
    en: 'Relevance',
    fr: 'Pertinence',
    ar: 'الصلة'
  }
};

export const useTranslation = () => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    // Load language from settings
    const loadLanguage = () => {
      try {
        const stored = localStorage.getItem('newsVeilleSettings');
        if (stored) {
          const settings = JSON.parse(stored);
          if (settings.language && ['en', 'fr', 'ar'].includes(settings.language)) {
            setCurrentLanguage(settings.language);
            // Set document direction for Arabic
            document.documentElement.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
            document.documentElement.lang = settings.language;
          }
        }
      } catch (error) {
        console.error('Failed to load language:', error);
      }
    };

    loadLanguage();

    // Listen for settings changes
    const handleStorageChange = () => {
      loadLanguage();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom settings update event
    const handleSettingsUpdate = () => {
      loadLanguage();
    };
    
    window.addEventListener('newsVeille:settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('newsVeille:settingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const t = (key: string): string => {
    if (translations[key] && translations[key][currentLanguage]) {
      return translations[key][currentLanguage];
    }
    
    // Fallback to English if translation not found
    if (translations[key] && translations[key]['en']) {
      return translations[key]['en'];
    }
    
    // Return key if no translation found
    return key;
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} ${t('daysAgo')}`;
    } else if (hours > 0) {
      return `${hours} ${t('hoursAgo')}`;
    } else if (minutes > 0) {
      return `${minutes} ${t('minutesAgo')}`;
    } else {
      return `1 ${t('minutesAgo')}`;
    }
  };

  return {
    t,
    currentLanguage,
    formatTimeAgo,
    isRTL: currentLanguage === 'ar'
  };
};