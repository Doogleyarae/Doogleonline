import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { type Language, getCurrentLanguage, setLanguageToStorage, t } from '@/lib/i18n';

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage = getCurrentLanguage();
    setCurrentLanguage(savedLanguage);
  }, []);

  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    setLanguageToStorage(language);
  };

  const translate = (key: string) => {
    return t(key, currentLanguage);
  };

  const value = {
    currentLanguage,
    setLanguage,
    t: translate,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 