import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, MessageCircle, Send, Bookmark, ChevronLeft, ChevronRight, Calendar, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import type { Event } from "@shared/schema";

interface SwipeActivityCardProps {
  announcements: Event[];
}

export function SwipeActivityCard({ announcements }: SwipeActivityCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const total = announcements.length;
  const hasItems = total > 0;

  const safeIndex = useMemo(() => {
    if (!hasItems) return 0;
    return ((currentIndex % total) + total) % total;
  }, [currentIndex, total, hasItems]);

  const current = hasItems ? announcements[safeIndex] : null;

  const setPrev = () => {
    if (!hasItems) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const setNext = () => {
    if (!hasItems) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const onPointerStart = (clientX: number) => {
    setDragStart(clientX);
    setIsDragging(true);
  };

  const onPointerMove = (clientX: number) => {
    if (dragStart === null) return;
    const delta = clientX - dragStart;
    setDragOffset(Math.max(-140, Math.min(140, delta)));
  };

  const onPointerEnd = () => {
    if (!isDragging) return;
    const threshold = 48;
    if (dragOffset > threshold) setPrev();
    if (dragOffset < -threshold) setNext();
    setDragOffset(0);
    setDragStart(null);
    setIsDragging(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") setPrev();
      if (event.key === "ArrowRight") setNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [total]);

  if (!hasItems) {
    return (
      <Card className="w-full max-w-2xl p-6 text-center border border-border bg-card/90 backdrop-blur-sm">
        <p className="text-muted-foreground">No activity yet. Fresh updates will appear here.</p>
      </Card>
    );
  }

  const isLiked = current ? likedIds.has(current.id) : false;
  const isSaved = current ? savedIds.has(current.id) : false;

  const toggleLiked = () => {
    if (!current) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  };

  const toggleSaved = () => {
    if (!current) return;
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(current.id)) next.delete(current.id);
      else next.add(current.id);
      return next;
    });
  };

  const likes = current ? (current.id.length % 70) + 28 + (likedIds.has(current.id) ? 1 : 0) : 0;
  const comments = current ? (current.id.length % 18) + 4 : 0;

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="text-xs text-muted-foreground">Swipe or use arrows to explore</p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={setPrev} aria-label="Previous post">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={setNext} aria-label="Next post">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card
        className="overflow-hidden border border-border bg-card/95 backdrop-blur-sm shadow-xl"
        role="region"
        aria-label="Campus activity carousel"
        onMouseDown={(event) => onPointerStart(event.clientX)}
        onMouseMove={(event) => onPointerMove(event.clientX)}
        onMouseUp={onPointerEnd}
        onMouseLeave={onPointerEnd}
        onTouchStart={(event) => onPointerStart(event.touches[0].clientX)}
        onTouchMove={(event) => onPointerMove(event.touches[0].clientX)}
        onTouchEnd={onPointerEnd}
      >
        <div
          className="transition-transform duration-200"
          style={{ transform: `translateX(${dragOffset}px)` }}
        >
          <div className="relative h-56 sm:h-72 bg-gradient-to-br from-primary/10 via-card to-muted/40">
            <img
              src={current?.imageUrl || "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop"}
              alt={current?.title || "Campus update"}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

            <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-primary" />
                <span className="text-xs font-medium text-white">Live campus update</span>
              </div>
              <Badge className="bg-background/20 text-white border-white/20">{current?.category || "Event"}</Badge>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-white/80">{current?.clubName || "Club"}</p>
              <h3 className="line-clamp-2 text-xl font-bold text-white sm:text-2xl">{current?.title}</h3>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleLiked} aria-label="Like post">
                  <Heart className={`h-5 w-5 ${isLiked ? "fill-primary text-primary" : "text-foreground"}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Open comments">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-10 w-10" aria-label="Share post">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <Button variant="ghost" size="icon" className="h-10 w-10" onClick={toggleSaved} aria-label="Save post">
                <Bookmark className={`h-5 w-5 ${isSaved ? "fill-primary text-primary" : "text-foreground"}`} />
              </Button>
            </div>

            <div>
              <p className="text-sm font-semibold">{likes} likes</p>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{current?.clubName || "Campus"}</span>
                {" "}
                {current?.description || "New update from your campus community."}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">View all {comments} comments</p>
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{current?.date || "Date TBA"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-2">
                <Clock className="h-3.5 w-3.5" />
                <span>{current?.time || "Time TBA"}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="truncate">{current?.location || "Campus"}</span>
              </div>
            </div>

            <Link href={current ? `/events/${current.id}` : "/events"}>
              <Button className="h-11 w-full text-sm font-semibold">View Event</Button>
            </Link>
          </div>
        </div>
      </Card>

      <div className="mt-4 flex justify-center gap-2">
        {announcements.map((item, index) => (
          <button
            key={item.id || index}
            className={`h-2 rounded-full transition-all ${index === safeIndex ? "w-8 bg-primary" : "w-2 bg-muted"}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to activity card ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

