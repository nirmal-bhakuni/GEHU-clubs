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
      path: "/dashboard",
      label: "Dashboard"
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center -ml-2">
            <Link href="/" data-testid="link-home" className="group flex items-center gap-2.5 rounded-lg px-2 py-1 transition-all duration-300">
              <div className="relative w-12 h-12">
                {/* Premium outer glow - refined and sophisticated */}
                <div className="absolute inset-[-8px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl" style={{ background: 'radial-gradient(circle, var(--primary), transparent 70%)', animation: 'glow-premium 4s ease-in-out infinite' }}></div>
                
                {/* Secondary glow layer */}
                <div className="absolute inset-[-4px] rounded-lg opacity-0 group-hover:opacity-50 transition-opacity duration-700 blur-md" style={{ background: 'radial-gradient(circle, var(--primary), transparent)', animation: 'glow-secondary 3.5s ease-in-out infinite 0.2s' }}></div>
                
                {/* Elegant border ring with accent */}
                <div className="absolute inset-0 rounded-lg border border-primary/30 group-hover:border-primary/50 transition-all duration-600"></div>
                <div className="absolute inset-[1px] rounded-lg border border-primary/10 group-hover:border-primary/30 transition-all duration-600"></div>
                
                {/* Main icon with premium multi-layer gradient */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary via-primary to-primary/80 flex items-center justify-center shadow-2xl group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)] transition-all duration-300 group-hover:scale-105 overflow-hidden">
                  {/* Rich overlay gradient for depth and dimension */}
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-primary/20 group-hover:from-primary/50 group-hover:to-primary/30 transition-all duration-600"></div>
                  
                  {/* Diagonal shimmer effect - premium feel */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.12) 40%, transparent 100%)', animation: 'shimmer-diagonal 5s ease-in-out infinite' }}></div>
                  
                  {/* Center light reflection */}
                  <div className="absolute top-1 left-1 w-3 h-3 rounded-full opacity-0 group-hover:opacity-80 transition-opacity duration-600" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.3), transparent)', animation: 'light-pulse 3s ease-in-out infinite' }}></div>
                  
                  {/* Refined letter with premium typography */}
                  <span className="text-primary-foreground font-bold text-2xl relative z-20 group-hover:scale-110 transition-transform duration-300 drop-shadow-md group-hover:drop-shadow-lg">C</span>
                </div>
                
                {/* Accent corner element - refined */}
                <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-primary/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ animation: 'accent-pulse 2.5s ease-in-out infinite' }}></div>
              </div>
              
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight group-hover:tracking-wide transition-all duration-300 relative text-foreground">
                  GEHU Clubs
                  {/* Premium underline with gradient */}
                  <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-primary via-primary to-transparent w-0 group-hover:w-full transition-all duration-700 ease-out rounded-full opacity-70 group-hover:opacity-100" style={{ animation: 'underline-slide 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}></div>
                </span>
              </div>
            </Link>
            
            <style>{`
              @keyframes glow-premium {
                0%, 100% { opacity: 0.2; transform: scale(0.9); }
                50% { opacity: 0.5; transform: scale(1.1); }
              }
              @keyframes glow-secondary {
                0%, 100% { opacity: 0.2; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.15); }
              }
              @keyframes shimmer-diagonal {
                0%, 100% { transform: translateX(-150%) translateY(-150%); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: translateX(150%) translateY(150%); opacity: 0; }
              }
              @keyframes light-pulse {
                0%, 100% { opacity: 0.3; transform: scale(1); }
                50% { opacity: 0.8; transform: scale(1.2); }
              }
              @keyframes accent-pulse {
                0%, 100% { opacity: 0.3; box-shadow: 0 0 4px rgba(var(--primary-rgb), 0.3); }
                50% { opacity: 1; box-shadow: 0 0 8px rgba(var(--primary-rgb), 0.6); }
              }
              @keyframes underline-slide {
                0% { width: 0; }
                100% { width: 100%; }
              }
            `}</style>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="group relative overflow-hidden"
                data-testid={`link-${item.label.toLowerCase()}`}
              >
                <span className={`
                  relative z-10 px-6 py-3 rounded-2xl font-semibold text-sm 
                  transition-all duration-500 flex items-center gap-2
                  group-hover:scale-110 group-hover:drop-shadow-lg
                  ${location === item.path
                    ? "text-secondary-foreground scale-105"
                    : "text-foreground hover:text-primary/80"
                  }
                `}>
                  <span className="relative inline-block group-hover:block">
                    {location === item.path ? (
                      item.label
                    ) : (
                      item.label.split('').map((char, i) => (
                        <span
                          key={i}
                          className="inline-block transition-all duration-300 group-hover:animate-none"
                          style={{
                            animation: `wave 0.5s ease-in-out ${i * 0.05}s`,
                          }}
                        >
                          {char === ' ' ? '\u00A0' : char}
                        </span>
                      ))
                    )}
                  </span>
                </span>
                
                {/* Multi-layer background effects */}
                {location === item.path ? (
                  <>
                    <span className="absolute inset-0 bg-secondary rounded-2xl shadow-lg transition-shadow duration-300 group-hover:shadow-2xl"></span>
                    {/* Rotating border gradient */}
                    <span className="absolute inset-0 rounded-2xl opacity-50" style={{
                      background: 'conic-gradient(from 0deg, transparent, var(--primary), transparent)',
                      animation: 'spin 3s linear infinite'
                    }}></span>
                    <span className="absolute inset-[2px] bg-secondary rounded-2xl"></span>
                  </>
                ) : (
                  <>
                    {/* Smooth background transition on hover */}
                    <span className="absolute inset-0 bg-secondary/0 rounded-2xl group-hover:bg-secondary/30 transition-colors duration-500"></span>
                    {/* Enhanced pulsing border with glow */}
                    <span className="absolute inset-0 border-2 border-secondary/30 rounded-2xl group-hover:border-primary/60 group-hover:shadow-[inset_0_0_20px_rgba(var(--primary-rgb),0.1)] transition-all duration-500"></span>
                    {/* Animated bottom glow bar with enhanced effect */}
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1.5 bg-primary/50 group-hover:w-full transition-all duration-500 ease-out rounded-full blur-md group-hover:blur-lg group-hover:bg-primary/70"></span>
                    {/* Top accent line */}
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-px bg-primary/30 group-hover:w-1/2 transition-all duration-700 ease-out"></span>
                  </>
                )}
              </Link>
            ))}
          </nav>
          
          <style>{`
            @keyframes wave {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-3px); }
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>

          <div className="hidden md:flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              onClick={onToggleSidebar}
              data-testid="button-sidebar-toggle-desktop"
              className={`
                relative overflow-hidden group transition-all duration-300
                hover:bg-primary/10 hover:scale-110 hover:rotate-3
                ${sidebarOpen ? 'bg-primary/20 rotate-90' : ''}
              `}
            >
              {/* Animated background glow */}
              <span className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></span>
              
              {/* Hamburger icon with animation */}
              <div className="relative z-10 w-5 h-5 flex flex-col items-center justify-center gap-[2.5px]">
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center
                  ${sidebarOpen ? 'rotate-45 translate-y-[4px]' : 'group-hover:w-3.5'}
                `}></span>
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300
                  ${sidebarOpen ? 'opacity-0 scale-0' : 'group-hover:w-3'}
                `}></span>
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center
                  ${sidebarOpen ? '-rotate-45 -translate-y-[4px]' : 'group-hover:w-3.5'}
                `}></span>
              </div>
              
              {/* Ripple effect on click */}
              <span className="absolute inset-0 rounded-full bg-primary/30 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle"
              className="hover:bg-primary/10 hover:scale-110 hover:rotate-12 transition-all duration-300 group"
            >
              {/* Glow effect */}
              <span className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></span>
              
              {theme === "light" ? (
                <Moon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <Sun className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              )}
            </Button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              onClick={toggleTheme}
              data-testid="button-theme-toggle-mobile"
              className="hover:bg-primary/10 hover:scale-110 hover:rotate-12 transition-all duration-300 group"
            >
              {/* Glow effect */}
              <span className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></span>
              
              {theme === "light" ? (
                <Moon className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-12" />
              ) : (
                <Sun className="w-5 h-5 relative z-10 transition-transform duration-300 group-hover:rotate-180" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
              className={`
                relative overflow-hidden group transition-all duration-300
                hover:bg-primary/10 hover:scale-110 hover:rotate-3
                ${mobileMenuOpen ? 'bg-primary/20 rotate-90' : ''}
              `}
            >
              {/* Animated background glow */}
              <span className="absolute inset-0 bg-gradient-to-br from-primary/0 via-primary/20 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"></span>
              
              {/* Animated hamburger/close icon */}
              <div className="relative z-10 w-5 h-5 flex flex-col items-center justify-center gap-[2.5px]">
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center
                  ${mobileMenuOpen ? 'rotate-45 translate-y-[4px]' : 'group-hover:w-3.5'}
                `}></span>
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300
                  ${mobileMenuOpen ? 'opacity-0 scale-0' : 'group-hover:w-3'}
                `}></span>
                <span className={`
                  w-4 h-[1.5px] bg-current rounded-full transition-all duration-300 origin-center
                  ${mobileMenuOpen ? '-rotate-45 -translate-y-[4px]' : 'group-hover:w-3.5'}
                `}></span>
              </div>
              
              {/* Ripple effect on click */}
              <span className="absolute inset-0 rounded-full bg-primary/30 scale-0 group-active:scale-150 opacity-0 group-active:opacity-100 transition-all duration-500"></span>
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div 
            className="md:hidden py-4 border-t border-border bg-card/95 backdrop-blur-lg"
            style={{
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            <nav className="flex flex-col gap-2 px-4">
              {navItems.map((item, index) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`
                    group relative overflow-hidden px-4 py-3 rounded-lg font-medium 
                    transition-all duration-300 hover:scale-[1.02] hover:-translate-y-0.5
                    ${location === item.path
                      ? "bg-gradient-to-r from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20"
                      : "text-foreground hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5"
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                  style={{
                    animation: `slideInLeft 0.3s ease-out ${index * 0.1}s both`
                  }}
                >
                  {/* Hover glow effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                  
                  {/* Active indicator */}
                  {location === item.path && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full animate-pulse"></span>
                  )}
                  
                  <span className="relative z-10 flex items-center justify-between">
                    {item.label}
                    <svg 
                      className={`
                        w-4 h-4 transition-all duration-300
                        ${location === item.path ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}
                      `} 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2" onClick={() => setMobileMenuOpen(false)}>
              </div>
            </nav>
            
            {/* Mobile menu animations */}
            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
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
          </div>
        )}
      </div>
    </header>
  );
}
