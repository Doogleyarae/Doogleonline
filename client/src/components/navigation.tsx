import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/exchange", label: "Exchange" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" }
];

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/attached_assets/WhatsApp Image 2025-06-13 at 17.58.11_cbc00289_1749826746862.jpg"
              alt="Doogle Online"
              className="h-8 w-8 rounded-lg"
            />
            <span className="font-bold text-lg text-primary">Doogle Online</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Link 
                key={item.href}
                href={item.href}
              >
                <span className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                  location === item.href
                    ? "text-primary bg-primary/5 shadow-sm"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}>
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-gray-50"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t bg-white py-2">
            <div className="space-y-1">
              {navigationItems.map((item) => (
                <Link 
                  key={item.href}
                  href={item.href}
                >
                  <span 
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-all duration-200 cursor-pointer ${
                      location === item.href
                        ? "text-primary bg-primary/5"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}