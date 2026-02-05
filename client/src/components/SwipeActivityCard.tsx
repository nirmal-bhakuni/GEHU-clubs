import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Send, ChevronLeft, ChevronRight, Flame, MessageCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Event } from "@shared/schema";

interface SwipeActivityCardProps {
  announcements: Event[];
}

export function SwipeActivityCard({ announcements }: SwipeActivityCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [savedEvents, setSavedEvents] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const totalCards = announcements.length;
  const hasItems = totalCards > 0;
  const prevIndex = hasItems ? (currentIndex - 1 + totalCards) % totalCards : 0;
  const nextIndex = hasItems ? (currentIndex + 1) % totalCards : 0;

  const current = announcements[currentIndex];
  const prev = announcements[prevIndex];
  const next = announcements[nextIndex];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const delta = e.clientX - dragStart;
    const clamped = Math.max(Math.min(delta, 600), -600);
    setDragOffset(clamped);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    
    const threshold = 20;
    if (dragOffset > threshold) {
      setCurrentIndex(prevIndex);
    } else if (dragOffset < -threshold) {
      setCurrentIndex(nextIndex);
    }
    setDragOffset(0);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - dragStart;
    const clamped = Math.max(Math.min(delta, 600), -600);
    setDragOffset(clamped);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    
    const threshold = 20;
    if (dragOffset > threshold) {
      setCurrentIndex(prevIndex);
    } else if (dragOffset < -threshold) {
      setCurrentIndex(nextIndex);
    }
    setDragOffset(0);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setCurrentIndex(prevIndex);
      if (e.key === "ArrowRight") setCurrentIndex(nextIndex);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, prevIndex, nextIndex]);

  const getCardStyle = (position: "prev" | "current" | "next") => {
    const baseOffset = position === "prev" ? -380 : position === "next" ? 380 : 0;
    const currentOffset = dragOffset;
    const finalOffset = baseOffset + currentOffset;

    return {
      transform: `translateX(${finalOffset}px) scale(${position === "current" ? 1 : 0.78}) rotateY(${position === "prev" ? 55 : position === "next" ? -55 : 0}deg) rotateX(${position === "prev" ? -12 : position === "next" ? 12 : 0}deg) rotateZ(${position === "prev" ? 12 : position === "next" ? -12 : 0}deg)`,
      opacity: position === "current" ? 1 : 0.45,
      transition: isDragging ? 'none' : 'all 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    };
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-0" aria-live="polite" role="region" aria-label="Activity feed card carousel">
      <div
        ref={containerRef}
        className="relative ml-0 md:ml-0 max-w-5xl h-[480px] sm:h-[540px] md:h-[680px] cursor-grab active:cursor-grabbing select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ perspective: "2000px" }}
      >
        <div className="relative w-full h-full -translate-x-20 sm:-translate-x-32 md:-translate-x-52 -translate-y-32 sm:-translate-y-44 md:-translate-y-56" style={{ perspective: "1200px" }}>
          {!hasItems && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Card className="p-6">
                <p className="text-muted-foreground">No announcements available.</p>
              </Card>
            </div>
          )}
          {/* Previous Card */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[340px] sm:w-[420px] sm:h-[400px] md:w-[520px] md:h-[460px] pointer-events-auto group/prev hover:scale-95 transition-all duration-300"
            style={getCardStyle("prev")}
            role="button"
            tabIndex={0}
            aria-label="Show previous card"
            onClick={() => hasItems && setCurrentIndex(prevIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") hasItems && setCurrentIndex(prevIndex);
            }}
          >
            <div className="h-full p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-background/60 to-background/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                <p className="text-2xl sm:text-3xl md:text-5xl font-bold text-primary/20">Swipe right</p>
              </div>
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex-shrink-0 flex items-center justify-center font-bold text-primary-foreground shadow-lg">
                      {prev?.clubName?.substring(0, 1) || "P"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{prev?.clubName || "Club"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">2h ago</p>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                    {prev?.title || "Previous update"}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {prev?.description || "Check out what was happening before..."}
                  </p>
                </div>
                {/* Engagement */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground font-semibold">+30 interested</span>
                  <Flame className="w-3 h-3 text-destructive" />
                </div>
              </div>
            </div>
          </div>

          {/* Main Current Card */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[340px] sm:w-[420px] sm:h-[400px] md:w-[520px] md:h-[460px] z-20 pointer-events-auto group/main hover:scale-105 transition-transform duration-300"
            style={getCardStyle("current")}
            aria-label="Current card"
          >
            <div className="h-full p-4 sm:p-5 md:p-7 rounded-2xl sm:rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-primary/30 via-background to-background shadow-2xl overflow-hidden relative group hover:border-primary/60 hover:shadow-[0_0_40px_rgba(var(--primary),0.4)] transition-all duration-300">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none" />
              <div className="absolute top-0 left-1/2 w-96 h-64 bg-gradient-to-b from-primary/30 via-transparent to-transparent blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none group-hover/main:from-primary/50 transition-all duration-300" />

              <div className="relative z-10 flex flex-col h-full">
                {/* Header with enhanced styling */}
                <div className="flex items-start justify-between mb-5 pb-5 border-b border-border/50">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-primary via-primary to-primary/80 flex-shrink-0 flex items-center justify-center font-bold text-primary-foreground shadow-lg ring-2 ring-primary/20">
                      {current?.clubName?.substring(0, 1) || "A"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-foreground text-base truncate">{current?.clubName || "Club Name"}</p>
                        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold px-2.5 py-0.5">
                          News
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 font-medium">2h ago</p>
                    </div>
                  </div>
                  <button 
                    className="flex-shrink-0 p-2 hover:bg-primary/10 rounded-lg transition-all duration-200 active:scale-95"
                    onClick={() => {
                      if (navigator.share && current) {
                        navigator.share({
                          title: current.title,
                          text: current.description,
                          url: window.location.href,
                        }).catch(() => {});
                      }
                    }}
                    aria-label="Share announcement"
                  >
                    <Send className="w-5 h-5 text-primary" />
                  </button>
                </div>

                {/* Content with better typography */}
                <div className="flex-1 mb-5">
                  <h3 className="text-xl font-bold text-foreground mb-2.5 leading-tight">
                    {current?.title || "New announcement"}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {current?.description || "Fresh updates from your clubs. Tap to see what's new this week."}
                  </p>
                </div>

                {/* Enhanced engagement section */}
                <div className="flex items-center gap-4 mb-6 pb-5 border-b border-border/50">
                  <div className="flex -space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background shadow-md ring-2 ring-primary/10 hover:ring-primary/20 transition-all">A</div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-secondary/80 flex items-center justify-center text-secondary-foreground text-xs font-bold border-2 border-background shadow-md ring-2 ring-secondary/10 hover:ring-secondary/20 transition-all">B</div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/70 to-primary flex items-center justify-center text-primary-foreground text-xs font-bold border-2 border-background shadow-md ring-2 ring-primary/10 hover:ring-primary/20 transition-all">C</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-semibold">+40 interested</span>
                    <Flame className="w-4 h-4 text-destructive" />
                  </div>
                </div>

                {/* Enhanced action buttons */}
                <div className="flex gap-3 pt-1">
                  <Link href={current?.id ? `/events/${current.id}` : '/events'} className="flex-1">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all duration-200 hover:shadow-xl hover:shadow-primary/30 active:scale-95">
                      View Update
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    className={`flex-1 border-primary/30 hover:bg-primary/10 hover:border-primary/50 rounded-full transition-all duration-200 active:scale-95 ${
                      current && savedEvents.has(current.id) ? 'bg-primary/10 border-primary/50' : ''
                    }`}
                    onClick={() => {
                      if (current) {
                        const newSaved = new Set(savedEvents);
                        if (savedEvents.has(current.id)) {
                          newSaved.delete(current.id);
                          toast({
                            title: "Removed from saved",
                            description: "Event removed from your saved list.",
                          });
                        } else {
                          newSaved.add(current.id);
                          toast({
                            title: "Saved!",
                            description: "Event saved for later.",
                          });
                        }
                        setSavedEvents(newSaved);
                      }
                    }}
                  >
                    {current && savedEvents.has(current.id) ? 'Saved' : 'Save'}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Next Card */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[340px] sm:w-[420px] sm:h-[400px] md:w-[520px] md:h-[460px] pointer-events-auto group/next hover:scale-95 transition-all duration-300"
            style={getCardStyle("next")}
            role="button"
            tabIndex={0}
            aria-label="Show next card"
            onClick={() => hasItems && setCurrentIndex(nextIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") hasItems && setCurrentIndex(nextIndex);
            }}
          >
            <div className="h-full p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/10 via-background/60 to-background/40 backdrop-blur-xl relative overflow-hidden group hover:border-primary/50 hover:shadow-[0_0_30px_rgba(var(--primary),0.3)] transition-all duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
              <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
                <p className="text-5xl font-bold text-primary/20">Swipe left</p>
              </div>
              <div className="relative z-10 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-border/30">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex-shrink-0 flex items-center justify-center font-bold text-primary-foreground shadow-lg">
                      {next?.clubName?.substring(0, 1) || "N"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm">{next?.clubName || "Club"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">1h ago</p>
                    </div>
                  </div>
                </div>
                {/* Content */}
                <div className="flex-1 mb-4">
                  <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                    {next?.title || "Next update"}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {next?.description || "Swipe left to see what's coming next..."}
                  </p>
                </div>
                {/* Engagement */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-foreground font-semibold">+35 interested</span>
                  <Flame className="w-3 h-3 text-destructive" />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Enhanced Pagination Dots */}
      {hasItems && (
        <div className="flex justify-center gap-1.5 sm:gap-2 md:gap-2.5 mt-6 sm:mt-8 md:mt-10">
          {announcements.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all rounded-full duration-300 ${
                index === currentIndex
                  ? "bg-primary w-6 h-2 sm:w-7 sm:h-2.5 md:w-8 md:h-2.5 shadow-lg shadow-primary/30"
                  : "bg-muted w-2 h-2 sm:w-2.5 sm:h-2.5 hover:bg-muted-foreground/50 hover:w-3 sm:hover:w-4 hover:shadow-md"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

