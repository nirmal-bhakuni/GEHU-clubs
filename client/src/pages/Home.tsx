import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import ClubCard from "@/components/ClubCard";
import StatsSection from "@/components/StatsSection";
import { SwipeActivityCard } from "@/components/SwipeActivityCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users, Flame, ChevronLeft, ChevronRight, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Club, ClubStory } from "@shared/schema";
import eventPlaceholder from "@assets/stock_images/student_club_meeting_08b2a880.jpg";

const demoEvents: Event[] = [
  {
    id: "demo-event-1",
    title: "Web Development Bootcamp",
    description: "Learn modern web development fundamentals and build real projects.",
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    time: "10:00 AM",
    durationMinutes: 180,
    location: "Main Auditorium",
    category: "Technology",
    clubId: "demo-club-1",
    clubName: "Code Hunters",
    imageUrl: eventPlaceholder,
    createdAt: new Date(),
  },
  {
    id: "demo-event-2",
    title: "Cultural Evening",
    description: "Performances, music, and campus culture celebration.",
    date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    time: "5:00 PM",
    durationMinutes: 120,
    location: "Open Air Theater",
    category: "Cultural",
    clubId: "demo-club-2",
    clubName: "Rangmanch",
    imageUrl: eventPlaceholder,
    createdAt: new Date(),
  },
];

const demoClubs: Club[] = [
  {
    id: "demo-club-1",
    name: "Code Hunters",
    description: "Build projects, crack hackathons, and grow as developers.",
    category: "Technical",
    memberCount: 124,
    logoUrl: "",
    createdAt: new Date(),
  },
  {
    id: "demo-club-2",
    name: "Rangmanch",
    description: "Theatre, expression, and stage performance culture.",
    category: "Cultural",
    memberCount: 96,
    logoUrl: "",
    createdAt: new Date(),
  },
  {
    id: "demo-club-3",
    name: "NSS GEHU",
    description: "Community service and social impact initiatives.",
    category: "Social",
    memberCount: 142,
    logoUrl: "",
    createdAt: new Date(),
  },
];

export default function Home() {
  const [visibleEvents, setVisibleEvents] = useState(false);
  const [visibleClubs, setVisibleClubs] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarkedClubs, setBookmarkedClubs] = useState<Set<string>>(new Set());
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [seenStoryClubIds, setSeenStoryClubIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setTimeout(() => setVisibleEvents(true), 200);
    setTimeout(() => setVisibleClubs(true), 600);
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("home-story-seen-clubs");
      if (!stored) return;
      const ids = JSON.parse(stored);
      if (Array.isArray(ids)) {
        setSeenStoryClubIds(new Set(ids));
      }
    } catch {
      // no-op
    }
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/events");
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : demoEvents;
      } catch {
        return demoEvents;
      }
    },
  });

  const { data: clubs = [], isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/clubs");
        const data = await res.json();
        return Array.isArray(data) && data.length > 0 ? data : demoClubs;
      } catch {
        return demoClubs;
      }
    },
  });

  const { data: storyHighlights = [] } = useQuery<ClubStory[]>({
    queryKey: ["/api/stories/highlights"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/stories/highlights");
        return res.json();
      } catch {
        return [];
      }
    },
  });

  const upcomingEvents = events
    .filter((event) => {
      // Only show events from non-frozen clubs
      const club = clubs.find(c => c.id === event.clubId);
      return !club?.isFrozen;
    })
    .slice(0, 3);
  
  const featuredClubs = clubs
    .filter((club) => !club.isFrozen); // Hide frozen clubs

  const highlightedClubIds = storyHighlights.map((story) => story.clubId);
  const storyClubs = highlightedClubIds
    .map((clubId) => featuredClubs.find((club) => club.id === clubId))
    .filter((club): club is Club => !!club);

  const storyByClubId = new Map(storyHighlights.map((story) => [story.clubId, story]));
  const storyItems = storyClubs.map((club) => ({
    club,
    story: storyByClubId.get(club.id),
  }));

  const activeStory = activeStoryIndex !== null ? storyItems[activeStoryIndex] : null;

  const openStoryViewer = (index: number) => {
    if (!storyItems[index]) return;
    setActiveStoryIndex(index);
    setStoryProgress(0);
  };

  const closeStoryViewer = () => {
    setActiveStoryIndex(null);
    setStoryProgress(0);
  };

  const nextStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex >= storyItems.length - 1) {
      closeStoryViewer();
      return;
    }
    setActiveStoryIndex(activeStoryIndex + 1);
    setStoryProgress(0);
  };

  const prevStory = () => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex <= 0) return;
    setActiveStoryIndex(activeStoryIndex - 1);
    setStoryProgress(0);
  };

  useEffect(() => {
    if (activeStoryIndex === null) return;
    if (activeStoryIndex >= storyItems.length) {
      closeStoryViewer();
    }
  }, [activeStoryIndex, storyItems.length]);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const story = storyItems[activeStoryIndex];
    if (!story) return;

    setSeenStoryClubIds((prev) => {
      const next = new Set(prev);
      next.add(story.club.id);
      localStorage.setItem("home-story-seen-clubs", JSON.stringify(Array.from(next)));
      return next;
    });
  }, [activeStoryIndex, storyItems]);

  useEffect(() => {
    if (activeStoryIndex === null) return;

    const timer = window.setInterval(() => {
      setStoryProgress((prev) => {
        const next = prev + 2.5;
        if (next >= 100) {
          window.clearInterval(timer);
          nextStory();
          return 100;
        }
        return next;
      });
    }, 100);

    return () => window.clearInterval(timer);
  }, [activeStoryIndex]);

  useEffect(() => {
    if (activeStoryIndex !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    document.body.style.overflow = "";
  }, [activeStoryIndex]);
  
  const filteredClubs = featuredClubs
    .filter((club) => selectedCategory === 'All' || club.category === selectedCategory)
    .slice(0, 3);

  return (
    <div>
      <Hero />

      <StatsSection />

      {/* Upcoming Events Section */}
      <section className={`py-16 md:py-20 transition-all duration-1000 ${visibleEvents ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8 group">
            <div className="flex-1">
              <h2 className={`
                text-3xl md:text-4xl font-semibold mb-2 relative inline-block group/heading
                group-hover:text-primary transition-colors duration-300
              `}>
                Upcoming Events
                {/* Animated underline */}
                <div className="absolute -bottom-1 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-primary to-transparent group-hover:w-full transition-all duration-700 ease-out rounded-full"></div>
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover/heading:opacity-100 transition-opacity duration-500 blur-lg bg-primary/10 rounded-lg -z-10 group-hover/heading:blur-xl"></div>
              </h2>
              <p className="text-muted-foreground font-body group-hover:text-foreground transition-colors duration-300">
                Discover workshops, bootcamps, and exciting campus activities
              </p>
            </div>
            <Link href="/events">
              <Button variant="ghost" className="hidden md:flex group/btn relative overflow-hidden hover:bg-primary/10 hover:scale-105 transition-all duration-300" data-testid="button-view-all-events">
                <span className="relative z-10 flex items-center">
                  View All Events
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </span>
                {/* Button shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmer 0.8s ease-in-out' }}></div>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {eventsLoading ? (
              // Loading skeleton for events
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-[16/10] rounded-lg mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              ))
            ) : upcomingEvents.length > 0 ? (
              upcomingEvents.map((event, idx) => (
                <div
                  key={event.id}
                  className="group/card"
                  style={{
                    animation: visibleEvents ? `fade-in-up 0.6s ease-out ${idx * 0.1}s both` : 'none'
                  }}
                >
                  <div className="relative">
                    <EventCard
                      {...event}
                      imageUrl={event.imageUrl || eventPlaceholder}
                    />
                    {/* Additional hover info card */}
                    <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 pointer-events-none rounded-xl">
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 rounded-b-xl">
                        <p className="text-white text-sm font-medium">Click to register →</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No upcoming events</p>
                  <p className="text-sm">Check back later for new events!</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/events">
              <Button variant="ghost" className="hover:bg-primary/10 hover:scale-105 transition-all duration-300" data-testid="button-view-all-events-mobile">
                View All Events
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Clubs Section */}
      <section className={`py-16 md:py-20 bg-card transition-all duration-1000 ${visibleClubs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8 group">
            <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-semibold mb-2 relative inline-block group/heading">
                Featured Clubs
                {/* Animated underline */}
                <div className="absolute -bottom-1 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-primary to-transparent group-hover:w-full transition-all duration-700 ease-out rounded-full"></div>
                {/* Glow effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover/heading:opacity-100 transition-opacity duration-500 blur-lg bg-primary/10 rounded-lg -z-10 group-hover/heading:blur-xl"></div>
              </h2>
              <p className="text-muted-foreground font-body group-hover:text-foreground transition-colors duration-300">
                Join a community that shares your interests
              </p>
            </div>
            <Link href="/clubs">
              <Button variant="ghost" className="hidden md:flex group/btn relative overflow-hidden" data-testid="button-view-all-clubs">
                <span className="relative z-10 flex items-center">
                  View All Clubs
                  <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-2 transition-transform duration-300" />
                </span>
                {/* Button shine effect */}
                <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', animation: 'shimmer 0.8s ease-in-out' }}></div>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {clubsLoading ? (
              // Loading skeleton for clubs
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted aspect-square rounded-full w-20 h-20 mx-auto mb-4"></div>
                  <div className="space-y-2 text-center">
                    <div className="h-4 bg-muted rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                    <div className="h-3 bg-muted rounded w-2/3 mx-auto"></div>
                  </div>
                </div>
              ))
            ) : featuredClubs.slice(0, 4).length > 0 ? (
              featuredClubs.slice(0, 4).map((club, idx) => (
                <div
                  key={club.id}
                  style={{
                    animation: visibleClubs ? `fade-in-up 0.6s ease-out ${idx * 0.1}s both` : 'none'
                  }}
                >
                  <ClubCard
                    {...club}
                    logoUrl={club.logoUrl ?? undefined}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No clubs available</p>
                  <p className="text-sm">New clubs will be added soon!</p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/clubs">
              <Button variant="ghost" data-testid="button-view-all-clubs-mobile">
                View All Clubs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Your Campus Feed - Instagram style */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background via-card/20 to-background py-12 sm:py-16 md:py-20">
        <div className="pointer-events-none absolute -left-20 top-16 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
          <div className="mb-8 sm:mb-10 md:mb-12 animate-fade-in-up">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 backdrop-blur-sm sm:mb-4 sm:px-4 sm:py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-foreground">Campus Live</span>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-foreground sm:mb-3 sm:text-3xl md:text-4xl">
              Your Campus Feed
            </h2>
            <p className="max-w-2xl px-0 text-sm text-muted-foreground sm:text-base md:text-lg">
              Stories, posts, and event drops from clubs in one social stream.
            </p>
          </div>

          <div className="story-section mb-8 ml-0 max-w-5xl rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-md sm:mb-10 md:mb-12 sm:p-5">
            <div className="mb-3 flex items-center justify-between sm:mb-4">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
                <span className="text-xl sm:text-2xl">✨</span> Stories
                <span className="text-[10px] font-normal text-muted-foreground sm:text-xs">• {storyClubs.length} clubs</span>
              </h3>
              <Link href="/clubs">
                <button className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground sm:gap-1 sm:text-xs">
                  See All
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </Link>
            </div>
            <div className="relative group">
              <div className="scrollbar-hide flex snap-x gap-3 overflow-x-auto pb-3 sm:gap-4 sm:pb-4 md:gap-5">
                {storyItems.map(({ club, story }, index) => (
                  <button
                    type="button"
                    key={club.id}
                    className="flex-shrink-0 snap-start group/story outline-none cursor-pointer select-none"
                    style={{ animationDelay: `${index * 100}ms` }}
                    aria-label={`View ${club.name} story`}
                    onClick={() => openStoryViewer(index)}
                    onPointerUp={() => openStoryViewer(index)}
                  >
                    <div className="flex cursor-pointer flex-col items-center gap-1.5 animate-fade-in-up sm:gap-2">
                    <div
                      className={`relative h-16 w-16 rounded-full p-[2.5px] transition-all duration-300 hover:scale-110 sm:h-18 sm:w-18 sm:p-[3px] md:h-20 md:w-20 ${
                        seenStoryClubIds.has(club.id)
                          ? 'bg-gradient-to-br from-muted to-muted/70'
                          : 'bg-gradient-to-br from-primary via-primary/80 to-primary'
                      }`}
                    >
                      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-background bg-card">
                        {club.logoUrl ? (
                          <img
                            src={club.logoUrl}
                            alt={club.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover/story:scale-110"
                          />
                        ) : (
                          <span className="bg-gradient-to-br from-primary to-primary/70 bg-clip-text text-lg font-bold text-transparent">{club.name.substring(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <p className="max-w-[60px] truncate text-center text-[10px] font-medium text-muted-foreground transition-colors group-hover/story:text-foreground sm:max-w-[70px] sm:text-xs md:max-w-[80px]">
                      {club.name}
                    </p>
                    </div>
                  </button>
                ))}
              </div>
              {storyItems.length === 0 && (
                <p className="py-2 text-sm text-muted-foreground">No active stories yet. Club admins can post image, video, or text stories that auto-expire after 24 hours.</p>
              )}
            </div>
          </div>

          {activeStory && (
            <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
              <div className="relative w-full max-w-md h-[78vh] bg-black rounded-2xl overflow-hidden border border-white/10">
                <div className="absolute top-0 left-0 right-0 z-20 p-3">
                  <div className="flex gap-1 mb-3">
                    {storyItems.map((_, idx) => (
                      <div key={`story-progress-${idx}`} className="h-1 flex-1 rounded bg-white/25 overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-100"
                          style={{
                            width:
                              idx < (activeStoryIndex ?? 0)
                                ? '100%'
                                : idx === activeStoryIndex
                                  ? `${storyProgress}%`
                                  : '0%',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={activeStory.club.logoUrl || activeStory.story?.mediaUrl || eventPlaceholder}
                        alt={activeStory.club.name}
                        className="w-8 h-8 rounded-full object-cover border border-white/40"
                      />
                      <span className="text-sm font-medium truncate">{activeStory.club.name}</span>
                    </div>
                    <button type="button" onClick={closeStoryViewer} className="p-1 rounded-full hover:bg-white/20" aria-label="Close story viewer">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {activeStory.story?.mediaType === "video" && activeStory.story?.mediaUrl ? (
                  <video
                    src={activeStory.story.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : activeStory.story?.mediaType === "text" || !activeStory.story?.mediaUrl ? (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-neutral-900 to-slate-800 p-6 text-center">
                    <div className="max-w-xs rounded-2xl border border-white/10 bg-white/10 p-6 text-white backdrop-blur-sm">
                      <div className="mb-3 text-xs uppercase tracking-[0.25em] text-white/60">Club Story</div>
                      <p className="whitespace-pre-wrap text-base leading-6">{activeStory.story?.caption || activeStory.club.name}</p>
                    </div>
                  </div>
                ) : (
                  <img
                    src={activeStory.story?.mediaUrl || activeStory.club.logoUrl || eventPlaceholder}
                    alt={activeStory.club.name}
                    className="w-full h-full object-cover"
                  />
                )}

                {activeStory.story?.caption && (
                  <div className="absolute bottom-14 left-0 right-0 px-4">
                    <p className="text-white text-sm bg-black/45 rounded-lg px-3 py-2 backdrop-blur-sm">
                      {activeStory.story.caption}
                    </p>
                  </div>
                )}

                <div className="absolute inset-0 grid grid-cols-2">
                  <button type="button" className="h-full" onClick={prevStory} aria-label="Previous story" />
                  <button type="button" className="h-full" onClick={nextStory} aria-label="Next story" />
                </div>

                <button
                  type="button"
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                  onClick={prevStory}
                  aria-label="Previous story"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60"
                  onClick={nextStory}
                  aria-label="Next story"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <Link href={`/clubs/${activeStory.club.id}`}>
                    <Button size="sm" className="bg-white text-black hover:bg-white/90">Open Club</Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="mb-10 ml-0 max-w-5xl rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:mb-12 md:mb-16 sm:p-6">
            <div className="mb-3 flex flex-col items-start justify-between gap-3 sm:mb-4 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary shadow-lg sm:h-10 sm:w-10">
                  <Flame className="h-4 w-4 text-primary-foreground sm:h-5 sm:w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground sm:text-xl">Posts</h3>
                  <p className="hidden text-xs text-muted-foreground sm:block sm:text-sm">Instagram-style event posts from your campus clubs.</p>
                </div>
              </div>
              <Link href="/events" className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full text-xs sm:w-auto sm:text-sm">
                  Explore all events
                </Button>
              </Link>
            </div>
            <div className="flex justify-center">
              <SwipeActivityCard announcements={upcomingEvents} />
            </div>
          </div>

          {/* Recommended for You Section with Category Filters */}
          <div className="border-t border-primary/10 pt-0 sm:pt-1 md:pt-2 -mt-8 sm:-mt-12 md:-mt-16">
            <div className="max-w-5xl ml-0 px-4 sm:px-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 flex flex-wrap items-center gap-2">
                    Recommended for You
                    <span className="px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-primary/10 rounded-full text-primary">Personalized</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">Based on your interests and activity</p>
                </div>
                <Link href="/clubs" className="w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 hover:bg-primary/10 w-full sm:w-auto text-xs sm:text-sm">View All →</Button>
                </Link>
              </div>
              
              {/* Category filter pills */}
              <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto scrollbar-hide pb-2">
                {['All', 'Technical', 'Cultural', 'Sports', 'Social'].map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                        : 'bg-card border border-primary/20 hover:border-primary/40 hover:bg-primary/5'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
              {filteredClubs.map((club, index) => (
                <Link href={`/clubs/${club.id}`} key={club.id}>
                  <div
                    className="group relative overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-xl transition-all duration-500 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 hover:scale-[1.02] animate-fade-in-up cursor-pointer h-full min-h-[320px] md:min-h-[340px]"
                    style={{ animationDelay: `${index * 150}ms` }}
                  >
                    {/* Enhanced hover gradient effect with shimmer */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 pointer-events-none"></div>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"></div>
                    </div>
                  
                  <div className="relative z-10 p-4 sm:p-5 md:p-6 flex flex-col h-full">
                    {/* Trending badge for first club */}
                    {index === 0 && (
                      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[10px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1 shadow-lg animate-bounce-subtle">
                        <Flame className="w-3 h-3" />
                        Trending
                      </div>
                    )}
                    
                    <div className="flex items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-primary via-primary to-primary/80 p-[2px] flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:rotate-6 transition-all duration-500">
                        <div className="w-full h-full rounded-full bg-card flex items-center justify-center overflow-hidden">
                          {club.logoUrl ? (
                            <img src={club.logoUrl} alt={club.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                          ) : (
                            <span className="text-xl font-bold bg-gradient-to-br from-blue-400 to-purple-500 bg-clip-text text-transparent">{club.name.substring(0, 1)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="min-h-[84px]">
                          <h4 className="font-bold text-base sm:text-lg mb-1 truncate group-hover:text-primary transition-colors">{club.name}</h4>
                          <div className="px-2 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground text-[10px] sm:text-xs capitalize mb-1.5 sm:mb-2 inline-block">
                            {club.category}
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-relaxed">{club.description}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{club.memberCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="flex -space-x-1.5 sm:-space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 border-2 border-background" />
                          ))}
                        </div>
                        <span className="text-xs ml-1">+{Math.floor((club.memberCount || 0) / 10)} active</span>
                      </div>
                    </div>

                    <div className="flex gap-1.5 sm:gap-2 mt-auto">
                      <Button 
                        className="flex-1 bg-primary hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg hover:shadow-primary/30 group-hover:scale-[1.02] text-xs sm:text-sm" 
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/clubs/${club.id}`;
                        }}
                      >
                        Join Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className={`border-primary/30 hover:bg-primary/10 hover:border-primary/50 hover:scale-105 transition-all duration-300 ${
                          bookmarkedClubs.has(club.id) ? 'bg-primary/10' : ''
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const newBookmarks = new Set(bookmarkedClubs);
                          if (bookmarkedClubs.has(club.id)) {
                            newBookmarks.delete(club.id);
                          } else {
                            newBookmarks.add(club.id);
                          }
                          setBookmarkedClubs(newBookmarks);
                        }}
                        aria-label={bookmarkedClubs.has(club.id) ? 'Remove bookmark' : 'Add bookmark'}
                      >
                        <svg className="w-4 h-4" fill={bookmarkedClubs.has(club.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  </div>
                </Link>
              ))}
            </div>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes shimmer-border {
          0% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.4); }
          50% { box-shadow: 0 0 20px 5px rgba(var(--primary), 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.4); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes sparkle {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(-10deg); }
          75% { transform: scale(1.2) rotate(10deg); }
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(var(--primary), 0.7); }
          100% { box-shadow: 0 0 0 20px rgba(var(--primary), 0); }
        }
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-shimmer-border {
          animation: shimmer-border 2s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
        .animate-sparkle {
          animation: sparkle 2s ease-in-out infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 1.5s ease-out infinite;
        }
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
