import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationsPanel from "@/components/notifications";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/exchange", label: "Exchange" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/limits", label: "Manage Limits" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-2xl font-bold text-primary">DoogleOnline</h1>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => (
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
              <NotificationsPanel />
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
                <div className="flex flex-col space-y-1 mt-6">
                  {navigationItems.map((item) => (
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
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
