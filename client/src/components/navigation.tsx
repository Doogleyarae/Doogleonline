import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, User, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationsPanel from "@/components/notifications";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/exchange", label: "Exchange" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
  { href: "/about", label: "About" },
  { href: "/login", label: "Sign In" },
  { href: "/admin", label: "Admin" },
];

export default function Navigation() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

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
            <div className="ml-10 flex items-center space-x-4">
              {navigationItems
                .filter(item => item.href !== '/login' || !user) // Hide sign in when user is authenticated
                .map((item) => (
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
              
              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                        <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                          {getInitials(user.displayName || user.email || 'User')}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm">{user.displayName || 'User'}</p>
                        <p className="w-48 truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <Link href="/dashboard">
                      <DropdownMenuItem className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        Dashboard
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
              )}
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
