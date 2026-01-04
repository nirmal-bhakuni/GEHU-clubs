import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import ClubCard from "@/components/ClubCard";
import StatsSection from "@/components/StatsSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event, Club } from "@shared/schema";
import eventPlaceholder from "@assets/stock_images/student_club_meeting_08b2a880.jpg";

export default function Home() {
  const [visibleEvents, setVisibleEvents] = useState(false);
  const [visibleClubs, setVisibleClubs] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisibleEvents(true), 200);
    setTimeout(() => setVisibleClubs(true), 600);
  }, []);

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events");
      return res.json();
    },
  });

  const { data: clubs = [], isLoading: clubsLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clubs");
      return res.json();
    },
  });

  const upcomingEvents = events.slice(0, 3);
  const featuredClubs = clubs.slice(0, 4);

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
            ) : featuredClubs.length > 0 ? (
              featuredClubs.map((club, idx) => (
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
      `}</style>
    </div>
  );
}
