import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import Reminder from "@/components/reminder";
import LanguageSelector from "@/components/language-selector";
import { useLanguage } from "@/contexts/language-context";
import { useAuth } from "@/contexts/auth-context";
import UserProfileDropdown from "@/components/user-profile-dropdown";
import Logo from "../assets/doogle-logo.png";

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
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useLanguage();
  const { isAuthenticated, user, logout } = useAuth();

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
    <nav className="bg-white shadow-sm border-b border-gray-200" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2" aria-label="Go to homepage">
              <img src={Logo} alt="Doogle Online Logo" className="h-10 w-10 object-contain" />
              {/* Optionally, add text next to the logo: */}
              {/* <span className="font-bold text-xl text-primary">DoogleOnline</span> */}
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4" role="menubar">
              {translatedNavigationItems.map((item) => (
                <Link key={item.href} to={item.href}>
                  <span 
                    className={cn(
                      "px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                      location.pathname === item.href
                        ? "text-primary bg-blue-50"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    )}
                    role="menuitem"
                    aria-current={location.pathname === item.href ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
              
              {/* Language and Auth Buttons */}
              <div className="flex items-center space-x-2 ml-4">
                <LanguageSelector />
                <Reminder />
                {isAuthenticated ? (
                  <UserProfileDropdown />
                ) : (
                  <>
                    <Link to="/signin">
                      <Button variant="ghost" size="sm" aria-label="Sign in to your account">
                        {t("signIn")}
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button size="sm" aria-label="Create a new account">
                        {t("signUp")}
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  aria-label="Open navigation menu"
                  aria-expanded={isOpen}
                  aria-controls="mobile-navigation"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64" id="mobile-navigation">
                <div className="flex items-center space-x-2 mb-6 px-3">
                  <img 
                    src={Logo}
                    alt="Doogle Online Logo"
                    className="h-8 w-8 object-contain"
                  />
                  <span className="font-bold text-primary">Doogle Online</span>
                </div>
                <div className="flex flex-col space-y-1" role="menu">
                  {translatedNavigationItems.map((item) => (
                    <Link key={item.href} to={item.href} onClick={() => setIsOpen(false)}>
                      <span 
                        className={cn(
                          "block px-3 py-2 rounded-md text-base font-medium transition-colors cursor-pointer",
                          location.pathname === item.href
                            ? "text-primary bg-blue-50"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                        role="menuitem"
                        aria-current={location.pathname === item.href ? "page" : undefined}
                      >
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  
                  {/* Mobile Language and Auth Buttons */}
                  <div className="pt-4 border-t border-gray-200 mt-4">
                    <div className="flex flex-col space-y-2">
                      <LanguageSelector className="w-full justify-start" />
                      {isAuthenticated ? (
                        <>
                          <div className="px-3 py-2">
                            <div className="flex items-center space-x-3">
                              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium" aria-label={`User avatar for ${user?.fullName}`}>
                                {user?.fullName?.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                                <p className="text-xs text-gray-500">{user?.email}</p>
                              </div>
                            </div>
                          </div>
                          <Link to="/profile" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start" aria-label="View your profile">
                              {t("profile")}
                            </Button>
                          </Link>
                          <Link to="/my-orders" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start" aria-label="View your orders">
                              {t("myOrders")}
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-red-600" 
                            onClick={() => {
                              setIsOpen(false);
                              logout();
                            }}
                            aria-label="Sign out of your account"
                          >
                            {t("signOut")}
                          </Button>
                        </>
                      ) : (
                        <>
                          <Link to="/signin" onClick={() => setIsOpen(false)}>
                            <Button variant="ghost" className="w-full justify-start" aria-label="Sign in to your account">
                              {t("signIn")}
                            </Button>
                          </Link>
                          <Link to="/signup" onClick={() => setIsOpen(false)}>
                            <Button className="w-full justify-start" aria-label="Create a new account">
                              {t("signUp")}
                            </Button>
                          </Link>
                        </>
                      )}
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
