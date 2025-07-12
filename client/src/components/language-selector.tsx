import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { languages, type Language, getCurrentLanguage, setLanguageToStorage, t } from "@/lib/i18n";

interface LanguageSelectorProps {
  className?: string;
  onLanguageChange?: (language: Language) => void;
}

export default function LanguageSelector({ className, onLanguageChange }: LanguageSelectorProps) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('so');

  useEffect(() => {
    const lang = getCurrentLanguage();
    setCurrentLanguage(lang);
  }, []);

  const handleLanguageChange = (language: Language) => {
    setCurrentLanguage(language);
    setLanguageToStorage(language);
    onLanguageChange?.(language);
    window.location.reload();
  };

  const currentLangConfig = languages.find(lang => lang.code === currentLanguage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className}>
          <Globe className="w-4 h-4 mr-2" />
          <span className="mr-1">{currentLangConfig?.flag}</span>
          <span className="hidden sm:inline">{currentLangConfig?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center space-x-2 cursor-pointer ${
              currentLanguage === language.code ? 'bg-accent' : ''
            }`}
          >
            <span className="text-lg">{language.flag}</span>
            <div className="flex flex-col">
              <span className="font-medium">{language.name}</span>
              <span className="text-xs text-muted-foreground">{language.nativeName}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 