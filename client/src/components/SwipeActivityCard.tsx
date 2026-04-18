import { useMemo, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useTransform } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Calendar,
  MapPin,
  Clock,
  Radio,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Megaphone,
  Trophy,
} from "lucide-react";
import { Link } from "wouter";

interface SwipeActivityCardProps {
  feedItems: FeedItem[];
  isLoading?: boolean;
}

type FeedItemKind = "latest-event" | "upcoming-event" | "community-post" | "achievement";
type FeedMetaIcon = "calendar" | "clock" | "map" | "author" | "tag" | "sparkles";

export interface FeedItem {
  id: string;
  kind: FeedItemKind;
  title: string;
  description: string;
  imageUrl?: string;
  clubName?: string;
  category?: string;
  href?: string;
  badges?: string[];
  meta?: Array<{ icon: FeedMetaIcon; label: string }>;
  createdAt?: string | Date;
}

const fallbackImage = "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&h=800&fit=crop";
const swipeThreshold = 120;
const swipeVelocityThreshold = 550;

function iconForMeta(icon: FeedMetaIcon) {
  switch (icon) {
    case "calendar":
      return Calendar;
    case "clock":
      return Clock;
    case "map":
      return MapPin;
    case "author":
      return Megaphone;
    case "tag":
      return Trophy;
    case "sparkles":
    default:
      return Sparkles;
  }
}

function kindLabel(kind: FeedItemKind) {
  switch (kind) {
    case "latest-event":
      return "LATEST EVENT";
    case "upcoming-event":
      return "UPCOMING EVENT";
    case "community-post":
      return "COMMUNITY POST";
    case "achievement":
      return "ACHIEVEMENT";
  }
}

function kindTone(kind: FeedItemKind) {
  switch (kind) {
    case "community-post":
      return "border-primary/35 bg-primary/20 text-primary-foreground";
    case "achievement":
      return "border-amber-300/35 bg-amber-500/20 text-amber-100";
    case "latest-event":
      return "border-emerald-300/35 bg-emerald-500/20 text-emerald-100";
    case "upcoming-event":
    default:
      return "border-orange-300/35 bg-orange-500/20 text-orange-100";
  }
}

function formatDate(dateValue?: string | Date) {
  if (!dateValue) return "Date TBA";
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return String(dateValue);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(parsed);
}

function isLive(dateValue?: string | Date) {
  if (!dateValue) return false;
  const now = Date.now();
  const start = new Date(dateValue).getTime();
  return start > now && start - now <= 24 * 60 * 60 * 1000;
}

export function SwipeActivityCard({ feedItems, isLoading = false }: SwipeActivityCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [interestFlash, setInterestFlash] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const controls = useAnimationControls();
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-240, 0, 240], [-12, 0, 12]);

  const total = feedItems.length;
  const hasItems = total > 0;

  const safeIndex = useMemo(() => {
    if (!hasItems) return 0;
    return ((currentIndex % total) + total) % total;
  }, [currentIndex, total, hasItems]);

  const currentCard = hasItems ? feedItems[safeIndex] : null;

  const goPrev = () => {
    if (!hasItems || isAnimating) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const goNext = () => {
    if (!hasItems || isAnimating) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const toggleLiked = (itemId: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSaved = (itemId: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const advanceCard = (direction: "left" | "right") => {
    if (!hasItems || isAnimating) return;
    setIsAnimating(true);

    controls
      .start({
        x: direction === "right" ? 900 : -900,
        rotate: direction === "right" ? 18 : -18,
        opacity: 0,
        transition: { type: "spring", stiffness: 300, damping: 30 },
      })
      .then(() => {
        dragX.set(0);
        controls.set({ x: 0, rotate: 0, opacity: 1 });
        setCurrentIndex((prev) => (prev + 1) % total);
        if (direction === "right") {
          setInterestFlash(true);
          window.setTimeout(() => setInterestFlash(false), 700);
        }
        setIsAnimating(false);
      });
  };

  const visibleLayers = [2, 1, 0].filter((layer) => layer < Math.min(3, total));

  if (isLoading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.12),transparent_44%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 opacity-30 blur-[90px]" />
        <div className="mx-auto flex max-w-6xl flex-col px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="space-y-2">
              <div className="h-8 w-32 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-72 max-w-[70vw] animate-pulse rounded bg-white/10" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-28 animate-pulse rounded-full bg-white/10" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
              <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center py-6">
            <div className="relative w-full max-w-[92vw] sm:max-w-sm">
              <div className="relative h-[540px] w-full sm:h-[580px]">
                {[2, 1, 0].map((layer) => (
                  <div
                    key={layer}
                    className="absolute inset-0 animate-pulse rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-xl"
                    style={{
                      transform: `translateY(${layer * 12}px) scale(${1 - layer * 0.05})`,
                      opacity: layer === 0 ? 1 : layer === 1 ? 0.6 : 0.4,
                    }}
                  >
                    <div className="h-52 rounded-t-3xl bg-white/10" />
                    <div className="space-y-3 p-4">
                      <div className="h-4 w-24 rounded-full bg-white/10" />
                      <div className="h-6 w-3/4 rounded bg-white/10" />
                      <div className="h-4 w-full rounded bg-white/10" />
                      <div className="h-4 w-2/3 rounded bg-white/10" />
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="h-8 rounded-lg bg-white/10" />
                        <div className="h-8 rounded-lg bg-white/10" />
                        <div className="h-8 rounded-lg bg-white/10" />
                      </div>
                      <div className="h-10 rounded-xl bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!hasItems || !currentCard) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.1),transparent_44%)]" />
        <div className="mx-auto flex max-w-6xl flex-col px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between gap-3 py-2">
            <div>
              <h3 className="text-2xl font-bold sm:text-3xl">Posts</h3>
              <p className="mt-1 text-sm text-muted-foreground">Latest events, community posts, and club achievements from across campus.</p>
            </div>
            <Link href="/events">
              <Button variant="outline" size="sm" className="rounded-full border-border bg-background/70 text-foreground hover:bg-background">
                Explore all events
              </Button>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center text-center text-muted-foreground">
            No activity yet. Fresh updates will appear here.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.14),transparent_42%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 opacity-25 blur-[90px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_38%)]" />

      <div className="grid w-full grid-rows-[auto,auto,auto] py-3 sm:py-3">
        <header className="flex items-center justify-between gap-3 py-1 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-card text-foreground shadow-lg shadow-black/10 backdrop-blur-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Posts</h3>
                <p className="mt-1 max-w-2xl text-xs text-muted-foreground sm:text-sm">Latest events, community posts, and club achievements from across campus.</p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden text-[10px] font-medium uppercase tracking-wide text-muted-foreground md:block">Swipe to explore</div>
            <Link href="/events">
              <Button variant="outline" size="sm" className="rounded-full border-border bg-background/70 text-sm text-foreground backdrop-blur-md hover:bg-background">
                Explore all events
              </Button>
            </Link>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-background/70 text-foreground backdrop-blur-md hover:bg-background"
              onClick={goPrev}
              aria-label="Previous post"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-full border-border bg-background/70 text-foreground backdrop-blur-md hover:bg-background"
              onClick={goNext}
              aria-label="Next post"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center py-0 sm:py-1">
          <div className="w-full max-w-[92vw] sm:max-w-[50rem] lg:max-w-[60rem]">
            <div className="relative h-[490px] w-full sm:h-[525px] lg:h-[545px]">
              {visibleLayers.map((layer) => {
                const item = feedItems[(safeIndex + layer) % total];
                const isTop = layer === 0;
                const isLiked = likedIds.has(item.id);
                const isSaved = savedIds.has(item.id);
                const likes = (item.id.length % 70) + 28 + (isLiked ? 1 : 0);
                const comments = (item.id.length % 18) + 4;
                const layerScale = layer === 0 ? 1 : layer === 1 ? 0.91 : 0.82;
                const layerY = layer === 0 ? 0 : layer === 1 ? 12 : 24;
                const layerOpacity = layer === 0 ? 1 : layer === 1 ? 0.65 : 0.4;
                const layerX = layer === 0 ? 0 : layer === 1 ? -44 : 44;
                const layerZ = layer === 0 ? 30 : layer === 1 ? 20 : 10;
                const tone = kindTone(item.kind);
                const itemBadges = item.badges?.length ? item.badges : [kindLabel(item.kind)];
                const fallbackMeta =
                  item.meta ||
                  ([
                    { icon: "calendar" as const, label: formatDate(item.createdAt) },
                    { icon: "author" as const, label: item.clubName || "Campus" },
                    { icon: "tag" as const, label: item.category || kindLabel(item.kind) },
                  ] as Array<{ icon: FeedMetaIcon; label: string }>);

                return (
                  <motion.div
                    key={`${item.id}-${layer}`}
                    className="absolute inset-0"
                    style={{ zIndex: layerZ, x: isTop ? dragX : layerX, y: layerY, rotate: isTop ? dragRotate : 0 }}
                    animate={
                      isTop
                        ? controls
                        : {
                            x: layerX,
                            y: layerY,
                            scale: layerScale,
                            opacity: layerOpacity,
                          }
                    }
                    initial={false}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    drag={isTop && !isAnimating ? "x" : false}
                    dragElastic={0.16}
                    dragConstraints={{ left: 0, right: 0 }}
                    whileDrag={isTop ? { scale: 1.05, opacity: 0.96 } : undefined}
                    onDragEnd={(_, info) => {
                      if (!isTop || isAnimating) return;
                      const offset = info.offset.x;
                      const velocity = info.velocity.x;
                      if (offset > swipeThreshold || velocity > swipeVelocityThreshold) {
                        advanceCard("right");
                        return;
                      }
                      if (offset < -swipeThreshold || velocity < -swipeVelocityThreshold) {
                        advanceCard("left");
                        return;
                      }
                      controls.start({ x: 0, rotate: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } });
                    }}
                  >
                    <Card className="flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card to-muted/20 shadow-2xl shadow-black/20 backdrop-blur-xl">
                      <div className="relative h-48 overflow-hidden sm:h-52 lg:h-56">
                        <img
                          src={item.imageUrl || fallbackImage}
                          alt={item.title || "Campus update"}
                          className="h-full w-full object-cover"
                          loading={isTop ? "eager" : "lazy"}
                          decoding="async"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08),transparent_72%)]" />

                        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
                          <div className="flex flex-wrap gap-2">
                            {itemBadges.slice(0, 2).map((badge, badgeIndex) => (
                              <div
                                key={`${badge}-${badgeIndex}`}
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm ${tone}`}
                              >
                                {badgeIndex === 0 && item.kind === "latest-event" ? <Radio className="h-3 w-3" /> : null}
                                {badge}
                              </div>
                            ))}
                          </div>

                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"
                            onClick={() => toggleSaved(item.id)}
                            aria-label={isSaved ? "Remove bookmark" : "Save item"}
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-white text-white" : "text-white"}`} />
                          </Button>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          <Badge className="mb-2 rounded-full border-white/20 bg-white/10 text-white backdrop-blur-sm">
                            {item.category || item.kind.replace("-", " ")}
                          </Badge>
                          <p className="text-xs font-medium uppercase tracking-wide text-white/75">{item.clubName || "Campus"}</p>
                          <h3 className="line-clamp-2 text-lg font-bold text-white sm:text-xl lg:text-2xl">{item.title}</h3>
                        </div>
                      </div>

                      <div className="flex flex-1 flex-col space-y-3 p-3.5 sm:p-4 lg:p-4.5">
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          {item.description || "Discover a new campus update from your student community."}
                        </p>

                        <div className="grid grid-cols-1 gap-1.5 text-[10px] text-muted-foreground sm:grid-cols-3 sm:gap-2 sm:text-[11px]">
                          {fallbackMeta.slice(0, 3).map((metaItem, index) => {
                            const Icon = iconForMeta(metaItem.icon);
                            return (
                              <div key={`${metaItem.label}-${index}`} className="inline-flex items-center gap-1.5 rounded-2xl border border-border bg-muted/60 px-2 py-1.5 backdrop-blur-sm">
                                <Icon className="h-3.5 w-3.5" />
                                <span className="truncate">{metaItem.label}</span>
                              </div>
                            );
                          })}
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-muted"
                              onClick={() => toggleLiked(item.id)}
                              aria-label="Like post"
                            >
                              <Heart className={`h-4 w-4 ${isLiked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted" aria-label="Open comments">
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-semibold text-foreground">{likes} likes</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">View all {comments} comments</p>
                          </div>
                        </div>

                        <div className="mt-auto flex gap-2 pt-2">
                          <Link href={item.href || "/events"} className="flex-1">
                            <Button className="h-9 w-full rounded-2xl text-sm font-semibold shadow-lg shadow-primary/25 transition-transform hover:scale-[1.01] hover:shadow-primary/30">
                              {item.kind === "achievement" ? "Open Club" : item.kind === "community-post" ? "Open Post" : "View Event"}
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 rounded-2xl border-border bg-background/60 text-foreground hover:bg-muted"
                            onClick={() => toggleSaved(item.id)}
                            aria-label={isSaved ? "Remove save" : "Save item"}
                          >
                            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}

              <AnimatePresence>
                {interestFlash ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-1.5 text-xs font-semibold text-emerald-100 backdrop-blur-sm"
                  >
                    Marked Interested
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="absolute inset-y-0 left-0 z-40 flex items-center -translate-x-8 sm:-translate-x-14">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border bg-background/70 text-foreground backdrop-blur-md hover:bg-background"
                  onClick={goPrev}
                  aria-label="Previous post"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute inset-y-0 right-0 z-40 flex items-center translate-x-8 sm:translate-x-14">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border bg-background/70 text-foreground backdrop-blur-md hover:bg-background"
                  onClick={goNext}
                  aria-label="Next post"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="absolute bottom-3 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border bg-background/70 px-3 py-1.5 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  {feedItems.map((item, index) => (
                    <button
                      key={item.id || index}
                      className={`h-2 rounded-full transition-all duration-300 ${index === safeIndex ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"}`}
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to activity card ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
