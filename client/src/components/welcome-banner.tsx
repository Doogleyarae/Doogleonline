import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import { X } from "lucide-react";
import { useState } from "react";

export default function WelcomeBanner() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);

  if (!isAuthenticated || !user || !isVisible) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {user.fullName.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">
                {t("welcomeBack")} {user.fullName}!
              </p>
              <p className="text-xs opacity-90">
                {t("welcomeMessage")}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="flex-shrink-0 p-1 rounded-md hover:bg-white/20 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 