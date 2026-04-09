import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UserPlus, LogIn, Shield, Users, X } from "lucide-react";
import { useEffect, useRef } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const sidebarRef = useRef<HTMLElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const sidebarItems = [
    {
      path: "/student/login",
      label: "Student Login",
      icon: LogIn,
      description: "Access your student account"
    },
    {
      path: "/student/signup",
      label: "Student Signup",
      icon: UserPlus,
      description: "Create a new student account"
    },
    {
      path: "/admin/login",
      label: "Admin Login",
      icon: Shield,
      description: "University admin access"
    },
    {
      path: "/club-admin/login",
      label: "Club Admin",
      icon: Users,
      description: "Manage your club"
    }
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Focus the first focusable element when sidebar opens
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle touch gestures for mobile
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (!isOpen) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking || !isOpen) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = Math.abs(startY - currentY);

      // If horizontal swipe is greater than vertical and moving left, close sidebar
      if (diffX > 50 && diffY < 100) {
        onClose();
        isTracking = false;
      }
    };

    const handleTouchEnd = () => {
      isTracking = false;
    };

    if (isOpen) {
      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    }

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Enhanced Overlay with fade animation */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:bg-black/40
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar with slide animation */}
      <aside
        ref={sidebarRef}
        className={`
          fixed left-0 top-16 md:top-20 z-50
          h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]
          w-full max-w-sm sm:max-w-md md:w-80
          bg-card/95 backdrop-blur-xl border-r border-primary/20
          shadow-2xl
          transform transition-all duration-500 ease-out
          ${isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
        style={{
          boxShadow: isOpen ? '0 0 40px rgba(var(--primary-rgb), 0.15), 0 20px 60px rgba(0, 0, 0, 0.4)' : 'none'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with gradient accent */}
          <div className="relative flex items-center justify-between p-6 border-b border-border/50 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent opacity-50"></div>
            
            <h2 id="sidebar-title" className="text-lg font-semibold relative z-10 flex items-center gap-2">
              <div className="w-1 h-6 bg-primary rounded-full animate-pulse"></div>
              Quick Access
            </h2>
            <Button
              ref={firstFocusableRef}
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-destructive/10 hover:text-destructive transition-all duration-300 relative z-10 group hover:rotate-90 hover:scale-110"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4 transition-transform duration-300" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
              Login or signup to access your account
            </p>

            <div className="space-y-3">
              {sidebarItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className="block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg group"
                    style={{
                      animation: isOpen ? `slideInLeft 0.5s ease-out ${index * 0.1}s both` : 'none'
                    }}
                  >
                    <Card className={`
                      p-4 cursor-pointer transition-all duration-300 
                      hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] 
                      hover:scale-[1.03] hover:-translate-y-1
                      relative overflow-hidden
                      ${isActive
                        ? "bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 border-primary/40 shadow-lg shadow-primary/20"
                        : "hover:bg-gradient-to-br hover:from-muted/80 hover:to-muted/40 border-border/50 hover:border-primary/30"
                      }
                    `}>
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent"></div>
                      </div>
                      
                      {/* Active indicator line */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-primary/60 rounded-r-full animate-pulse"></div>
                      )}
                      
                      <div className="flex items-center gap-3 relative z-10">
                        <div className={`
                          p-2.5 rounded-lg transition-all duration-300 
                          group-hover:scale-110 group-hover:rotate-3
                          ${isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                            : "bg-muted group-hover:bg-primary/20 group-hover:text-primary"
                          }
                        `}>
                          <Icon className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`
                            font-semibold text-sm truncate transition-colors duration-300
                            ${isActive ? "text-primary" : "group-hover:text-primary"}
                          `}>
                            {item.label}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 group-hover:text-foreground/80 transition-colors duration-300">
                            {item.description}
                          </p>
                        </div>
                        
                        {/* Arrow indicator on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 group-hover:translate-x-1">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/50 relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-px bg-gradient-to-r from-transparent via-primary to-transparent"></div>
              <p className="text-xs text-muted-foreground text-center">
                Need help?{" "}
                <a
                  href="mailto:Gehuclubs@gmail.com"
                  className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors duration-300 inline-flex items-center gap-1 group"
                >
                  Contact support
                  <svg className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </p>
            </div>
          </div>
        </div>
        
        {/* CSS Animations */}
        <style>{`
          @keyframes slideInLeft {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}</style>
      </aside>
    </>
  );
}