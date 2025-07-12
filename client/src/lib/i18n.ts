export type Language = 'en' | 'so';

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
  }
};

export function getLanguageFromStorage(): Language {
  if (typeof window === 'undefined') return 'so';
  return (localStorage.getItem('language') as Language) || 'so';
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
    return translations.so[key] || key;
  }
  
  const translation = langTranslations[key];
  if (!translation) {
    console.warn(`Translation key not found: ${key} for language: ${language}`);
    return translations.so[key] || key;
  }
  
  return translation;
}

export function t(key: string, language?: Language): string {
  return getTranslation(key, language);
} 