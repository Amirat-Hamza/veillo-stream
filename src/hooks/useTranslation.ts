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
  },

  // Search & Filters UI
  'filters': { en: 'Filters', fr: 'Filtres', ar: 'مرشحات' },
  'allSources': { en: 'All Sources', fr: 'Toutes les sources', ar: 'كل المصادر' },
  'allCategories': { en: 'All Categories', fr: 'Toutes les catégories', ar: 'كل الفئات' },
  'timeRange': { en: 'Time range', fr: "Plage de temps", ar: 'النطاق الزمني' },
  'unreadOnly': { en: 'Unread Only', fr: 'Non lus uniquement', ar: 'غير المقروء فقط' },
  'clearFilters': { en: 'Clear Filters', fr: 'Effacer les filtres', ar: 'مسح المرشحات' },
  'articles': { en: 'articles', fr: 'articles', ar: 'مقالات' },
  'read': { en: 'read', fr: 'lus', ar: 'مقروء' },
  'unread': { en: 'unread', fr: 'non lus', ar: 'غير مقروء' },
  'source': { en: 'Source', fr: 'Source', ar: 'المصدر' },
  'category': { en: 'Category', fr: 'Catégorie', ar: 'الفئة' },
  'time': { en: 'Time', fr: 'Temps', ar: 'الوقت' },

  // Header
  'refresh': { en: 'Refresh', fr: 'Rafraîchir', ar: 'تحديث' },
  'export': { en: 'Export', fr: 'Exporter', ar: 'تصدير' },

  // Dashboard
  'today': { en: 'Today', fr: "Aujourd'hui", ar: 'اليوم' },
  'thisMonth': { en: 'This Month', fr: 'Ce mois', ar: 'هذا الشهر' },
  'thisYear': { en: 'This Year', fr: 'Cette année', ar: 'هذه السنة' },
  'articlesRead': { en: 'articles read', fr: 'articles lus', ar: 'مقالات مقروءة' },
  'readingActivityLast7Days': { en: 'Reading Activity (Last 7 Days)', fr: 'Activité de lecture (7 derniers jours)', ar: 'نشاط القراءة (آخر 7 أيام)' },
  'topNewsSources': { en: 'Top News Sources', fr: 'Meilleures sources', ar: 'أفضل المصادر' },
  'noReadingDataYet': { en: 'No reading data yet. Start reading articles to see statistics!', fr: "Pas encore de données de lecture. Commencez à lire des articles pour voir les statistiques !", ar: 'لا توجد بيانات قراءة بعد. ابدأ بقراءة المقالات لرؤية الإحصائيات!' },

  // States & messages
  'loadingArticles': { en: 'Loading news articles...', fr: 'Chargement des articles...', ar: 'جاري تحميل الأخبار...' },
  'noArticlesMatchFilters': { en: 'No articles match your filters.', fr: "Aucun article ne correspond à vos filtres.", ar: 'لا توجد مقالات مطابقة لمرشحاتك.' },
  'noArticlesAvailableYet': { en: 'No articles available yet.', fr: 'Aucun article disponible pour le moment.', ar: 'لا توجد مقالات متاحة بعد.' },
  'articleMarkedRead': { en: 'Article marked as read', fr: 'Article marqué comme lu', ar: 'تم تحديد المقال كمقروء' },
  'articleMarkedReadDesc': { en: 'Article has been added to your reading history.', fr: 'L\'article a été ajouté à votre historique de lecture.', ar: 'تمت إضافة المقال إلى سجل القراءة.' },
  'exportSuccessful': { en: 'Export successful', fr: 'Export réussi', ar: 'تم التصدير بنجاح' },
  'exportSuccessfulDesc': { en: 'Your reading history has been exported to CSV.', fr: 'Votre historique de lecture a été exporté en CSV.', ar: 'تم تصدير سجل القراءة إلى CSV.' },

  // Article card
  'readLabel': { en: 'Read', fr: 'Lu', ar: 'مقروء' },

  // Notifications
  'newArticlesAvailable': { en: 'new articles available', fr: 'nouveaux articles disponibles', ar: 'مقالات جديدة متاحة' }
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