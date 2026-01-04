import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/hooks/useAuth";

interface NavbarProps {
  onToggleSidebar: () => void;
  sidebarOpen?: boolean;
}

export default function Navbar({ onToggleSidebar, sidebarOpen = false }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { admin, isAuthenticated } = useAuth();
  const isHomePage = location === "/";

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/clubs", label: "Clubs" },
    { path: "/events", label: "Events" },
    {
      path: isAuthenticated && admin?.clubId ? "/club-admin" : "/dashboard",
      label: isAuthenticated && admin?.clubId ? "Club Admin" : "Dashboard"
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3">
            <Link href="/" data-testid="link-home" className="group flex items-center gap-3 hover-elevate rounded-xl px-3 py-2 transition-all duration-300">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                  <span className="text-primary-foreground font-bold text-xl group-hover:scale-110 transition-transform duration-300">C</span>
                </div>
                {/* Animated ring effect on hover */}
                <div className="absolute inset-0 rounded-xl border-2 border-primary opacity-0 group-hover:opacity-100 scale-100 group-hover:scale-125 transition-all duration-500"></div>
                <div className="absolute inset-0 rounded-xl border border-primary opacity-0 group-hover:opacity-50 scale-100 group-hover:scale-150 transition-all duration-700"></div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight group-hover:tracking-wide transition-all duration-300">
                  GEHU Clubs
                </span>
                <div className="h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-500 ease-out"></div>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors hover-elevate ${
                  location === item.path
                    ? "bg-secondary text-secondary-foreground"
                    : "text-foreground"
                }`}
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleSidebar}
              data-testid="button-sidebar-toggle-desktop"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle-mobile"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <nav className="flex flex-col gap-2">
              {navItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`px-4 py-3 rounded-md font-medium transition-colors hover-elevate ${
                    location === item.path
                      ? "bg-secondary text-secondary-foreground"
                      : "text-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2" onClick={() => setMobileMenuOpen(false)}>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
