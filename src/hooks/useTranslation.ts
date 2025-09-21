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
  'newArticlesAvailable': { en: 'new articles available', fr: 'nouveaux articles disponibles', ar: 'مقالات جديدة متاحة' },

  // Settings & common actions
  'reset': { en: 'Reset', fr: 'Réinitialiser', ar: 'إعادة ضبط' },
  'saveSettings': { en: 'Save Settings', fr: 'Enregistrer les paramètres', ar: 'حفظ الإعدادات' },
  'settingsLoadFailed': { en: 'Settings Load Failed', fr: 'Échec du chargement des paramètres', ar: 'فشل تحميل الإعدادات' },
  'usingDefaultSettings': { en: 'Using default settings.', fr: 'Utilisation des paramètres par défaut.', ar: 'استخدام الإعدادات الافتراضية.' },
  'settingsSaved': { en: 'Settings Saved', fr: 'Paramètres enregistrés', ar: 'تم حفظ الإعدادات' },
  'settingsSavedDesc': { en: 'Your settings have been saved successfully.', fr: 'Vos paramètres ont été enregistrés avec succès.', ar: 'تم حفظ إعداداتك بنجاح.' },
  'saveFailed': { en: 'Save Failed', fr: 'Échec de l\'enregistrement', ar: 'فشل الحفظ' },
  'saveFailedDesc': { en: 'Failed to save settings.', fr: "Échec de l'enregistrement des paramètres.", ar: 'فشل حفظ الإعدادات.' },
  'settingsReset': { en: 'Settings Reset', fr: 'Réinitialisation des paramètres', ar: 'إعادة تعيين الإعدادات' },
  'settingsResetDesc': { en: 'All settings have been reset to defaults.', fr: 'Tous les paramètres ont été réinitialisés aux valeurs par défaut.', ar: 'تمت إعادة تعيين جميع الإعدادات إلى القيم الافتراضية.' },

  // RSS Sources
  'sources': { en: 'sources', fr: 'sources', ar: 'مصادر' },
  'addSource': { en: 'Add Source', fr: 'Ajouter une source', ar: 'إضافة مصدر' },
  'sourceName': { en: 'Source name', fr: 'Nom de la source', ar: 'اسم المصدر' },
  'rssUrl': { en: 'RSS URL', fr: 'URL RSS', ar: 'رابط RSS' },
  'invalidSource': { en: 'Invalid Source', fr: 'Source invalide', ar: 'مصدر غير صالح' },
  'invalidSourceDesc': { en: 'Please provide both name and URL.', fr: 'Veuillez fournir le nom et l\'URL.', ar: 'يرجى تقديم الاسم والرابط.' },
  'sourceAdded': { en: 'Source Added', fr: 'Source ajoutée', ar: 'تمت إضافة المصدر' },
  'addedToSources': { en: 'has been added to your sources.', fr: 'a été ajoutée à vos sources.', ar: 'تمت إضافته إلى مصادرك.' },
  'sourceRemoved': { en: 'Source Removed', fr: 'Source supprimée', ar: 'تمت إزالة المصدر' },
  'hasBeenRemoved': { en: 'has been removed.', fr: 'a été supprimée.', ar: 'تمت إزالته.' },
  'duplicateUrl': { en: 'Duplicate URL', fr: 'URL dupliquée', ar: 'رابط مكرر' },
  'duplicateUrlDesc': { en: 'This URL already exists in your sources.', fr: 'Cette URL existe déjà dans vos sources.', ar: 'هذا الرابط موجود بالفعل في مصادرك.' },

  // General Settings
  'generalSettings': { en: 'General Settings', fr: 'Paramètres généraux', ar: 'إعدادات عامة' },
  'defaultRefreshInterval': { en: 'Default Refresh Interval', fr: 'Intervalle d\'actualisation par défaut', ar: 'فترة التحديث الافتراضية' },
  'fiveMinutes': { en: '5 minutes', fr: '5 minutes', ar: '5 دقائق' },
  'fifteenMinutes': { en: '15 minutes', fr: '15 minutes', ar: '15 دقيقة' },
  'thirtyMinutes': { en: '30 minutes', fr: '30 minutes', ar: '30 دقيقة' },
  'oneHour': { en: '1 hour', fr: '1 heure', ar: 'ساعة واحدة' },
  'language': { en: 'Language', fr: 'Langue', ar: 'اللغة' },
  'languageChanged': { en: 'Language Changed', fr: 'Langue modifiée', ar: 'تم تغيير اللغة' },
  'languageChangedDesc': { en: 'Interface language has been updated.', fr: 'La langue de l\'interface a été mise à jour.', ar: 'تم تحديث لغة الواجهة.' },

  // Notifications
  'soundNotifications': { en: 'Sound Notifications', fr: 'Notifications sonores', ar: 'إشعارات صوتية' },
  'playSoundOnNew': { en: 'Play sound when new articles arrive', fr: 'Jouer un son lorsque de nouveaux articles arrivent', ar: 'تشغيل صوت عند وصول مقالات جديدة' },
  'dndStart': { en: 'Do Not Disturb Start', fr: 'Début du mode Ne pas déranger', ar: 'بداية عدم الإزعاج' },
  'dndEnd': { en: 'Do Not Disturb End', fr: 'Fin du mode Ne pas déranger', ar: 'نهاية عدم الإزعاج' },

  // AI
  'aiApiKeysManagement': { en: 'AI API Keys Management', fr: 'Gestion des clés API IA', ar: 'إدارة مفاتيح واجهة برمجة تطبيقات الذكاء الاصطناعي' },
  'keys': { en: 'keys', fr: 'clés', ar: 'مفاتيح' },
  'addNewApiKey': { en: 'Add New API Key', fr: 'Ajouter une nouvelle clé API', ar: 'إضافة مفتاح API جديد' },
  'provider': { en: 'Provider', fr: 'Fournisseur', ar: 'المزوّد' },
  'name': { en: 'Name', fr: 'Nom', ar: 'الاسم' },
  'apiKey': { en: 'API Key', fr: 'Clé API', ar: 'مفتاح API' },
  'myOpenAiKey': { en: 'My OpenAI Key', fr: 'Ma clé OpenAI', ar: 'مفتاح OpenAI الخاص بي' },
  'addApiKey': { en: 'Add API Key', fr: 'Ajouter une clé API', ar: 'إضافة مفتاح API' },
  'getApiKey': { en: 'Get API Key', fr: 'Obtenir une clé API', ar: 'الحصول على مفتاح API' },
  'yourApiKeys': { en: 'Your API Keys', fr: 'Vos clés API', ar: 'مفاتيح API الخاصة بك' },
  'active': { en: 'Active', fr: 'Actif', ar: 'نشط' },
  'useThis': { en: 'Use This', fr: 'Utiliser ceci', ar: 'استخدم هذا' },
  'model': { en: 'Model', fr: 'Modèle', ar: 'النموذج' },
  'autoDetecting': { en: 'Auto-detecting...', fr: 'Détection automatique...', ar: 'اكتشاف تلقائي...' },
  'apiKeyLabel': { en: 'API Key', fr: 'Clé API', ar: 'مفتاح API' },
  'selectActiveApiKey': { en: 'Select Active API Key for Platform', fr: 'Sélectionner la clé API active pour la plateforme', ar: 'اختر مفتاح API النشط للمنصة' },
  'selectApiKeyPlaceholder': { en: 'Select an API key to use...', fr: 'Sélectionnez une clé API à utiliser...', ar: 'اختر مفتاح API للاستخدام...' },
  'detectingModels': { en: 'Detecting models...', fr: 'Détection des modèles...', ar: 'جارٍ اكتشاف النماذج...' },
  'noModelsDetected': { en: 'No models detected', fr: 'Aucun modèle détecté', ar: 'لم يتم اكتشاف أي نماذج' },

  // Data Security & Management
  'enableDataEncryption': { en: 'Enable Data Encryption', fr: 'Activer le chiffrement des données', ar: 'تمكين تشفير البيانات' },
  'encryptWithPassphrase': { en: 'Encrypt stored data with a passphrase', fr: 'Chiffrer les données stockées avec une phrase secrète', ar: 'تشفير البيانات المخزنة بعبارة مرور' },
  'encryptionPassphrase': { en: 'Encryption Passphrase', fr: 'Phrase secrète de chiffrement', ar: 'عبارة مرور التشفير' },
  'enterSecurePassphrase': { en: 'Enter a secure passphrase', fr: 'Entrez une phrase secrète sécurisée', ar: 'أدخل عبارة مرور آمنة' },
  'passphraseRequired': { en: 'This passphrase will be required to decrypt your data. Keep it safe!', fr: 'Cette phrase sera nécessaire pour déchiffrer vos données. Gardez-la en sécurité !', ar: 'ستُطلب هذه العبارة لفك تشفير بياناتك. احتفظ بها بأمان!' },
  'exportData': { en: 'Export Data', fr: 'Exporter les données', ar: 'تصدير البيانات' },
  'importData': { en: 'Import Data', fr: 'Importer des données', ar: 'استيراد البيانات' },
  'exportIncludesAll': { en: '• Export includes all articles, settings, and reading history', fr: '• L\'export inclut tous les articles, paramètres et l\'historique de lecture', ar: '• يتضمن التصدير جميع المقالات والإعدادات وسجل القراءة' },
  'useImportExportToSync': { en: '• Use import/export to sync data between devices', fr: '• Utilisez l\'import/export pour synchroniser les données entre appareils', ar: '• استخدم الاستيراد/التصدير لمزامنة البيانات بين الأجهزة' },
  'dataExportedJson': { en: '• Data is exported in JSON format for easy backup', fr: '• Les données sont exportées au format JSON pour une sauvegarde facile', ar: '• يتم تصدير البيانات بتنسيق JSON لسهولة النسخ الاحتياطي' },
  'exportFailed': { en: 'Export Failed', fr: 'Échec de l\'export', ar: 'فشل التصدير' },
  'exportFailedDesc': { en: 'Failed to export data.', fr: 'Échec de l\'export des données.', ar: 'فشل تصدير البيانات.' },
  'importSuccessful': { en: 'Import Successful', fr: 'Import réussi', ar: 'تم الاستيراد بنجاح' },
  'importSuccessfulDesc': { en: 'Your data has been imported successfully.', fr: 'Vos données ont été importées avec succès.', ar: 'تم استيراد بياناتك بنجاح.' },
  'importFailed': { en: 'Import Failed', fr: 'Échec de l\'import', ar: 'فشل الاستيراد' },
  'importFailedDesc': { en: 'Invalid file format or corrupted data.', fr: 'Format de fichier invalide ou données corrompues.', ar: 'تنسيق ملف غير صالح أو بيانات تالفة.' },

  // API key toasts
  'invalidInput': { en: 'Invalid Input', fr: 'Entrée invalide', ar: 'إدخال غير صالح' },
  'provideApiKeyAndName': { en: 'Please provide both API key and name.', fr: 'Veuillez fournir la clé API et le nom.', ar: 'يرجى تقديم مفتاح API والاسم.' },
  'apiKeyAdded': { en: 'API Key Added', fr: 'Clé API ajoutée', ar: 'تمت إضافة مفتاح API' },
  'addedSuccessfully': { en: 'has been added successfully.', fr: 'a été ajouté avec succès.', ar: 'تمت إضافته بنجاح.' },
  'apiKeyDeleted': { en: 'API Key Deleted', fr: 'Clé API supprimée', ar: 'تم حذف مفتاح API' },
  'hasBeenDeleted': { en: 'has been deleted.', fr: 'a été supprimé.', ar: 'تم حذفه.' },
  'activeApiKeyChanged': { en: 'Active API Key Changed', fr: 'Clé API active modifiée', ar: 'تم تغيير مفتاح API النشط' },
  'nowUsing': { en: 'Now using', fr: 'Utilisation de', ar: 'يتم استخدام' }
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