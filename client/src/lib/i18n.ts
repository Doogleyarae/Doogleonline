export type Language = 'en' | 'so' | 'ru' | 'el' | 'tr';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const languages: LanguageConfig[] = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  {
    code: 'so',
    name: 'Somali',
    nativeName: 'Soomaali',
    flag: '🇸🇴',
    dir: 'ltr'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr'
  },
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    flag: '🇨🇾',
    dir: 'ltr'
  },
  {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
    dir: 'ltr'
  }
];

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    services: 'Services',
    howItWorks: 'How It Works',
    exchange: 'Exchange',
    trackOrder: 'Track Order',
    contact: 'Contact',
    about: 'About',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    
    // Auth
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    fullName: 'Full Name',
    phone: 'Phone Number',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password?',
    createAccount: 'Create account',
    alreadyHaveAccount: 'Already have an account?',
    signInToAccount: 'Sign in to your account',
    joinDoogleOnline: 'Join Doogle Online for fast currency exchange',
    welcomeBack: 'Welcome back',
    accountCreated: 'Account created!',
    checkEmail: 'Please check your email to verify your account',
    passwordReset: 'Password reset successful!',
    passwordUpdated: 'Your password has been updated successfully',
    
    // Exchange
    sendAmount: 'Send Amount',
    receiveAmount: 'Receive Amount',
    sendMethod: 'Send Method',
    receiveMethod: 'Receive Method',
    exchangeRate: 'Exchange Rate',
    walletAddress: 'Wallet Address',
    phoneNumber: 'Phone Number',
    accountNumber: 'Account Number',
    createOrder: 'Create Order',
    trackYourOrder: 'Track Your Order',
    orderId: 'Order ID',
    orderStatus: 'Order Status',
    
    // Status
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    paid: 'Paid',
    
    // Common
    submit: 'Submit',
    cancel: 'Cancel',
    save: 'Save',
    edit: 'Edit',
    delete: 'Delete',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Information',
    close: 'Close',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    refresh: 'Refresh',
    
    // Footer
    copyright: '© 2024 Doogle Online. All rights reserved.',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    
    // Language
    language: 'Language',
    selectLanguage: 'Select Language',
  },
  
  so: {
    // Navigation
    home: 'Guriga',
    services: 'Adeegyada',
    howItWorks: 'Sida uu U Shaqeeyo',
    exchange: 'Beddelka',
    trackOrder: 'Raadi Dalbo',
    contact: 'La Xidhiidh',
    about: 'Ku Saabsan',
    signIn: 'Gal',
    signUp: 'Diiwaan Geli',
    
    // Auth
    email: 'Iimaylka',
    password: 'Furaha',
    confirmPassword: 'Xaqiiji Furaha',
    fullName: 'Magaca Buuxa',
    phone: 'Telefoonka',
    rememberMe: 'I xusuus',
    forgotPassword: 'Furaha ma xasuusatay?',
    createAccount: 'Samee akoon',
    alreadyHaveAccount: 'Horey u leedahay akoon?',
    signInToAccount: 'Gal akoonkaaga',
    joinDoogleOnline: 'Ku biir Doogle Online si aad u beddesho lacag degdeg ah',
    welcomeBack: 'Ku soo dhowow',
    accountCreated: 'Akoonka waa la sameeyay!',
    checkEmail: 'Fadlan hubi iimaylkaaga si aad u xaqiijiso akoonkaaga',
    passwordReset: 'Furaha waa la dib u dejiyay!',
    passwordUpdated: 'Furahaaga waa la cusboonaysiiyay',
    
    // Exchange
    sendAmount: 'Lacagta La Dirayo',
    receiveAmount: 'Lacagta La Helayo',
    sendMethod: 'Habka Dirka',
    receiveMethod: 'Habka Helka',
    exchangeRate: 'Heerka Beddelka',
    walletAddress: 'Cinwaanka Walletka',
    phoneNumber: 'Telefoonka',
    accountNumber: 'Tirada Akoonka',
    createOrder: 'Samee Dalbo',
    trackYourOrder: 'Raadi Dalbadaada',
    orderId: 'Aqoonsiga Dalbada',
    orderStatus: 'Xaaladda Dalbada',
    
    // Status
    pending: 'Cusub',
    processing: 'Waa la sameeyay',
    completed: 'Dhammaystiran',
    cancelled: 'La joojiyay',
    paid: 'La bixiyay',
    
    // Common
    submit: 'Dir',
    cancel: 'Jooji',
    save: 'Kaydi',
    edit: 'Wax ka beddel',
    delete: 'Tir',
    loading: 'Waa la soo dejiyay...',
    error: 'Khalad',
    success: 'Guul',
    warning: 'Digniin',
    info: 'Macluumaad',
    close: 'Xir',
    back: 'Dib u noqo',
    next: 'Xiga',
    previous: 'Hore',
    search: 'Raadi',
    filter: 'Shaqsi',
    sort: 'Kala saar',
    refresh: 'Cusboonaysii',
    
    // Footer
    copyright: '© 2024 Doogle Online. Dhammaan xuquuqda waa la ilaaliyay.',
    privacyPolicy: 'Siyaasadda Arrimaha Khaaska',
    termsOfService: 'Shuruudaha Adeegga',
    
    // Language
    language: 'Luuqadda',
    selectLanguage: 'Dooro Luuqadda',
  },
  
  ru: {
    // Navigation
    home: 'Главная',
    services: 'Услуги',
    howItWorks: 'Как это работает',
    exchange: 'Обмен',
    trackOrder: 'Отследить заказ',
    contact: 'Контакты',
    about: 'О нас',
    signIn: 'Войти',
    signUp: 'Регистрация',
    
    // Auth
    email: 'Электронная почта',
    password: 'Пароль',
    confirmPassword: 'Подтвердите пароль',
    fullName: 'Полное имя',
    phone: 'Номер телефона',
    rememberMe: 'Запомнить меня',
    forgotPassword: 'Забыли пароль?',
    createAccount: 'Создать аккаунт',
    alreadyHaveAccount: 'Уже есть аккаунт?',
    signInToAccount: 'Войдите в свой аккаунт',
    joinDoogleOnline: 'Присоединяйтесь к Doogle Online для быстрого обмена валют',
    welcomeBack: 'Добро пожаловать обратно',
    accountCreated: 'Аккаунт создан!',
    checkEmail: 'Пожалуйста, проверьте вашу электронную почту для подтверждения аккаунта',
    passwordReset: 'Пароль успешно сброшен!',
    passwordUpdated: 'Ваш пароль был успешно обновлен',
    
    // Exchange
    sendAmount: 'Сумма отправки',
    receiveAmount: 'Сумма получения',
    sendMethod: 'Метод отправки',
    receiveMethod: 'Метод получения',
    exchangeRate: 'Курс обмена',
    walletAddress: 'Адрес кошелька',
    phoneNumber: 'Номер телефона',
    accountNumber: 'Номер счета',
    createOrder: 'Создать заказ',
    trackYourOrder: 'Отследить ваш заказ',
    orderId: 'ID заказа',
    orderStatus: 'Статус заказа',
    
    // Status
    pending: 'В ожидании',
    processing: 'Обрабатывается',
    completed: 'Завершен',
    cancelled: 'Отменен',
    paid: 'Оплачен',
    
    // Common
    submit: 'Отправить',
    cancel: 'Отмена',
    save: 'Сохранить',
    edit: 'Редактировать',
    delete: 'Удалить',
    loading: 'Загрузка...',
    error: 'Ошибка',
    success: 'Успех',
    warning: 'Предупреждение',
    info: 'Информация',
    close: 'Закрыть',
    back: 'Назад',
    next: 'Далее',
    previous: 'Предыдущий',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    refresh: 'Обновить',
    
    // Footer
    copyright: '© 2024 Doogle Online. Все права защищены.',
    privacyPolicy: 'Политика конфиденциальности',
    termsOfService: 'Условия использования',
    
    // Language
    language: 'Язык',
    selectLanguage: 'Выберите язык',
  },
  
  el: {
    // Navigation
    home: 'Αρχική',
    services: 'Υπηρεσίες',
    howItWorks: 'Πώς λειτουργεί',
    exchange: 'Ανταλλαγή',
    trackOrder: 'Παρακολούθηση παραγγελίας',
    contact: 'Επικοινωνία',
    about: 'Σχετικά',
    signIn: 'Σύνδεση',
    signUp: 'Εγγραφή',
    
    // Auth
    email: 'Email',
    password: 'Κωδικός',
    confirmPassword: 'Επιβεβαίωση κωδικού',
    fullName: 'Πλήρες όνομα',
    phone: 'Τηλέφωνο',
    rememberMe: 'Να με θυμάσαι',
    forgotPassword: 'Ξεχάσατε τον κωδικό;',
    createAccount: 'Δημιουργία λογαριασμού',
    alreadyHaveAccount: 'Έχετε ήδη λογαριασμό;',
    signInToAccount: 'Συνδεθείτε στον λογαριασμό σας',
    joinDoogleOnline: 'Γίνετε μέλος του Doogle Online για γρήγορη ανταλλαγή νομισμάτων',
    welcomeBack: 'Καλώς ήρθατε πάλι',
    accountCreated: 'Ο λογαριασμός δημιουργήθηκε!',
    checkEmail: 'Ελέγξτε το email σας για επιβεβαίωση του λογαριασμού',
    passwordReset: 'Ο κωδικός επαναφέρθηκε επιτυχώς!',
    passwordUpdated: 'Ο κωδικός σας ενημερώθηκε επιτυχώς',
    
    // Exchange
    sendAmount: 'Ποσό αποστολής',
    receiveAmount: 'Ποσό λήψης',
    sendMethod: 'Μέθοδος αποστολής',
    receiveMethod: 'Μέθοδος λήψης',
    exchangeRate: 'Ισοτιμία',
    walletAddress: 'Διεύθυνση πορτοφολιού',
    phoneNumber: 'Τηλέφωνο',
    accountNumber: 'Αριθμός λογαριασμού',
    createOrder: 'Δημιουργία παραγγελίας',
    trackYourOrder: 'Παρακολούθηση παραγγελίας',
    orderId: 'Αριθμός παραγγελίας',
    orderStatus: 'Κατάσταση παραγγελίας',
    
    // Status
    pending: 'Σε εκκρεμότητα',
    processing: 'Σε επεξεργασία',
    completed: 'Ολοκληρώθηκε',
    cancelled: 'Ακυρώθηκε',
    paid: 'Πληρώθηκε',
    
    // Common
    submit: 'Υποβολή',
    cancel: 'Ακύρωση',
    save: 'Αποθήκευση',
    edit: 'Επεξεργασία',
    delete: 'Διαγραφή',
    loading: 'Φόρτωση...',
    error: 'Σφάλμα',
    success: 'Επιτυχία',
    warning: 'Προειδοποίηση',
    info: 'Πληροφορίες',
    close: 'Κλείσιμο',
    back: 'Πίσω',
    next: 'Επόμενο',
    previous: 'Προηγούμενο',
    search: 'Αναζήτηση',
    filter: 'Φίλτρο',
    sort: 'Ταξινόμηση',
    refresh: 'Ανανέωση',
    
    // Footer
    copyright: '© 2024 Doogle Online. Όλα τα δικαιώματα διατηρούνται.',
    privacyPolicy: 'Πολιτική απορρήτου',
    termsOfService: 'Όροι χρήσης',
    
    // Language
    language: 'Γλώσσα',
    selectLanguage: 'Επιλέξτε γλώσσα',
  },
  
  tr: {
    // Navigation
    home: 'Ana Sayfa',
    services: 'Hizmetler',
    howItWorks: 'Nasıl Çalışır',
    exchange: 'Döviz',
    trackOrder: 'Sipariş Takibi',
    contact: 'İletişim',
    about: 'Hakkımızda',
    signIn: 'Giriş Yap',
    signUp: 'Kayıt Ol',
    
    // Auth
    email: 'E-posta',
    password: 'Şifre',
    confirmPassword: 'Şifreyi Onayla',
    fullName: 'Ad Soyad',
    phone: 'Telefon Numarası',
    rememberMe: 'Beni hatırla',
    forgotPassword: 'Şifremi unuttum?',
    createAccount: 'Hesap oluştur',
    alreadyHaveAccount: 'Zaten hesabınız var mı?',
    signInToAccount: 'Hesabınıza giriş yapın',
    joinDoogleOnline: 'Hızlı döviz değişimi için Doogle Online\'a katılın',
    welcomeBack: 'Tekrar hoş geldiniz',
    accountCreated: 'Hesap oluşturuldu!',
    checkEmail: 'Lütfen hesabınızı doğrulamak için e-postanızı kontrol edin',
    passwordReset: 'Şifre başarıyla sıfırlandı!',
    passwordUpdated: 'Şifreniz başarıyla güncellendi',
    
    // Exchange
    sendAmount: 'Gönderilecek Miktar',
    receiveAmount: 'Alınacak Miktar',
    sendMethod: 'Gönderme Yöntemi',
    receiveMethod: 'Alma Yöntemi',
    exchangeRate: 'Döviz Kuru',
    walletAddress: 'Cüzdan Adresi',
    phoneNumber: 'Telefon Numarası',
    accountNumber: 'Hesap Numarası',
    createOrder: 'Sipariş Oluştur',
    trackYourOrder: 'Siparişinizi Takip Edin',
    orderId: 'Sipariş Numarası',
    orderStatus: 'Sipariş Durumu',
    
    // Status
    pending: 'Beklemede',
    processing: 'İşleniyor',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi',
    paid: 'Ödendi',
    
    // Common
    submit: 'Gönder',
    cancel: 'İptal',
    save: 'Kaydet',
    edit: 'Düzenle',
    delete: 'Sil',
    loading: 'Yükleniyor...',
    error: 'Hata',
    success: 'Başarılı',
    warning: 'Uyarı',
    info: 'Bilgi',
    close: 'Kapat',
    back: 'Geri',
    next: 'İleri',
    previous: 'Önceki',
    search: 'Ara',
    filter: 'Filtrele',
    sort: 'Sırala',
    refresh: 'Yenile',
    
    // Footer
    copyright: '© 2024 Doogle Online. Tüm hakları saklıdır.',
    privacyPolicy: 'Gizlilik Politikası',
    termsOfService: 'Kullanım Şartları',
    
    // Language
    language: 'Dil',
    selectLanguage: 'Dil Seçin',
  }
};

export function getLanguageFromStorage(): Language {
  if (typeof window === 'undefined') return 'en';
  return (localStorage.getItem('language') as Language) || 'en';
}

export function setLanguageToStorage(language: Language): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('language', language);
}

export function getCurrentLanguage(): Language {
  return getLanguageFromStorage();
}

export function getTranslation(key: string, language: Language = getCurrentLanguage()): string {
  const langTranslations = translations[language];
  if (!langTranslations) {
    console.warn(`Translation not found for language: ${language}`);
    return translations.en[key] || key;
  }
  
  const translation = langTranslations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key} for language: ${language}`);
    return translations.en[key] || key;
  }
  
  return translation;
}

export function t(key: string, language?: Language): string {
  return getTranslation(key, language);
} 