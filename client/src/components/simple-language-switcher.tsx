import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import { languages, type Language } from "@/lib/i18n";

export default function SimpleLanguageSwitcher() {
  const { currentLanguage, setLanguage } = useLanguage();

  const handleLanguageChange = (language: Language) => {
    setLanguage(language);
    // Reload the page to apply changes
    window.location.reload();
  };

  return (
    <div className="flex space-x-2">
      {languages.map((language) => (
        <Button
          key={language.code}
          variant={currentLanguage === language.code ? "default" : "outline"}
          size="sm"
          onClick={() => handleLanguageChange(language.code)}
          className="flex items-center space-x-1"
        >
          <span>{language.flag}</span>
          <span className="hidden sm:inline">{language.code.toUpperCase()}</span>
        </Button>
      ))}
    </div>
  );
} 