import { useLanguage } from "@/contexts/language-context";
import Logo from "../assets/doogle-logo.png";

export default function Footer() {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center justify-center py-4">
              <img src={Logo} alt="Doogle Online Logo" className="h-10 w-10 object-contain" />
            </div>
            <p className="text-gray-400">{t("services")}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("services")}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>{t("exchange")}</li>
              <li>{t("trackOrder")}</li>
              <li>24/7 {t("contact")}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">{t("contact")}</h4>
            <ul className="space-y-2 text-gray-400">
              <li>{t("contact")}</li>
              <li>{t("contact")}</li>
              <li>FAQ</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-gray-400">
              <li>{t("privacyPolicy")}</li>
              <li>{t("termsOfService")}</li>
              <li>Security</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
