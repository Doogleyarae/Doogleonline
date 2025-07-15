export type Language = 'el' | 'en' | 'ru';

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
}

export const languages: LanguageConfig[] = [
  {
    code: 'el',
    name: 'Greek',
    nativeName: 'Ελληνικά',
    flag: '🇨🇾',
    dir: 'ltr'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    dir: 'ltr'
  },
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    dir: 'ltr'
  }
];

type TranslationDict = { [key: string]: string };

export const translations: Record<Language, TranslationDict> = {
  el: {
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
    signUp: 'Зарегистрироваться',
    
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
    signInToAccount: 'Войти в свой аккаунт',
    joinDoogleOnline: 'Присоединяйтесь к Doogle Online для быстрого обмена валюты',
    welcomeBack: 'Добро пожаловать обратно',
    accountCreated: 'Аккаунт создан!',
    checkEmail: 'Пожалуйста, проверьте свою электронную почту для подтверждения аккаунта',
    passwordReset: 'Пароль успешно сброшен!',
    passwordUpdated: 'Ваш пароль успешно обновлен',
    
    // Exchange
    sendAmount: 'Отправить сумму',
    receiveAmount: 'Получить сумму',
    sendMethod: 'Способ отправки',
    receiveMethod: 'Способ получения',
    exchangeRate: 'Курс обмена',
    walletAddress: 'Адрес кошелька',
    phoneNumber: 'Номер телефона',
    accountNumber: 'Номер счета',
    createOrder: 'Создать заказ',
    trackYourOrder: 'Отследить ваш заказ',
    orderId: 'Идентификатор заказа',
    orderStatus: 'Статус заказа',
    
    // Status
    pending: 'Ожидание',
    processing: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
    paid: 'Оплачено',
    
    // Common
    submit: 'Отправить',
    cancel: 'Отменить',
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
    next: 'Вперед',
    previous: 'Назад',
    search: 'Поиск',
    filter: 'Фильтр',
    sort: 'Сортировка',
    refresh: 'Обновить',
    
    // Footer
    copyright: '© 2024 Doogle Online. Все права защищены.',
    privacyPolicy: 'Политика конфиденциальности',
    termsOfService: 'Условия обслуживания',
    
    // Language
    language: 'Язык',
    selectLanguage: 'Выберите язык',
  }
};

export function getLanguageFromStorage(): Language {
  if (typeof window === 'undefined') return 'el';
  return (localStorage.getItem('language') as Language) || 'el';
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
    return translations.el[key] || key;
  }
  
  const translation = langTranslations[key];
  if (!translation) {
    return translations.el[key] || key;
  }
  
  return translation;
}

export function t(key: string, language?: Language): string {
  return getTranslation(key, language);
} 