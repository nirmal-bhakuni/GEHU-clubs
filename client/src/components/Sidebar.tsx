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
      {/* Enhanced Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`
          fixed left-0 top-16 md:top-20 z-50
          h-[calc(100vh-4rem)] md:h-[calc(100vh-5rem)]
          w-full max-w-sm sm:max-w-md md:w-80
          bg-card/95 backdrop-blur-xl border-r border-border
          shadow-2xl
          transform transition-all duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <h2 id="sidebar-title" className="text-lg font-semibold">
              Quick Access
            </h2>
            <Button
              ref={firstFocusableRef}
              size="icon"
              variant="ghost"
              onClick={onClose}
              className="hover:bg-muted/50 transition-colors"
              aria-label="Close sidebar"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <p className="text-sm text-muted-foreground mb-6">
              Login or signup to access your account
            </p>

            <div className="space-y-3">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className="block focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-lg"
                  >
                    <Card className={`
                      p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]
                      ${isActive
                        ? "bg-primary/10 border-primary/30 shadow-md"
                        : "hover:bg-muted/50 border-border/50"
                      }
                    `}>
                      <div className="flex items-center gap-3">
                        <div className={`
                          p-2 rounded-md transition-colors duration-200
                          ${isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted group-hover:bg-muted/80"
                          }
                        `}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{item.label}</h3>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Need help?{" "}
                <a
                  href="mailto:Gehuclubs@gmail.com"
                  className="text-primary hover:underline font-medium"
                >
                  Contact support
                </a>
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}