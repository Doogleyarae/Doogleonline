import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Reminder from "@/components/reminder";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/exchange", label: "Exchange" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  // { href: "/admin", label: "Admin" }, // Hidden for preview
];

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();

  const translatedNavigationItems = [
    { href: "/", label: t("home") },
    { href: "/services", label: t("services") },
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/exchange", label: t("exchange") },
    { href: "/track", label: t("trackOrder") },
    { href: "/contact", label: t("contact") },
    { href: "/about", label: t("about") },
    // { href: "/admin", label: "Admin" }, // Hidden for preview
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-2">
                <img 
                  src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg"
                  alt="Doogle Online"
                  className="h-10 w-10 rounded-full"
                />
                <h1 className="text-xl font-bold text-primary">Doogle Online</h1>
              </div>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {translatedNavigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <span className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                    location === item.href
                      ? "text-primary bg-blue-50"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  )}>
                    {item.label}
                  </span>
                </Link>
              ))}
              
              {/* Language and Auth Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <LanguageSelector />
                <Reminder />
                <Link href="/signin">
                  <Button variant="ghost" size="sm">
                    {t("signIn")}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm">
                    {t("signUp")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64">
                <div className="flex items-center space-x-2 mb-6 px-3">
                  <img 
                    src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg"
                    alt="Doogle Online"
                    className="h-8 w-8 rounded-full"
                  />
                  <span className="font-bold text-primary">Doogle Online</span>
                </div>
                <div className="flex flex-col space-y-1">
                  {translatedNavigationItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span 
                        className={cn(
                          "block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer",
                          location === item.href
                            ? "text-primary bg-blue-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                        onClick={() => setIsOpen(false)}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  
                  {/* Mobile Language and Auth Buttons */}
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex flex-col space-y-2">
                      <LanguageSelector className="w-full justify-start" />
                      <Link href="/signin">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsOpen(false)}>
                          {t("signIn")}
                        </Button>
                      </Link>
                      <Link href="/signup">
                        <Button className="w-full justify-start" onClick={() => setIsOpen(false)}>
                          {t("signUp")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
