import { useQuery } from "@tanstack/react-query";
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

      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-2">
                Upcoming Events
              </h2>
              <p className="text-muted-foreground font-body">
                Don't miss out on these amazing opportunities
              </p>
            </div>
            <Button variant="ghost" className="hidden md:flex" data-testid="button-view-all-events">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
              upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  imageUrl={event.imageUrl || eventPlaceholder}
                />
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
            <Button variant="ghost" data-testid="button-view-all-events-mobile">
              View All Events
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold mb-2">
                Featured Clubs
              </h2>
              <p className="text-muted-foreground font-body">
                Join a community that shares your interests
              </p>
            </div>
            <Button variant="ghost" className="hidden md:flex" data-testid="button-view-all-clubs">
              View All Clubs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
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
              featuredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  {...club}
                  logoUrl={club.logoUrl ?? undefined}
                />
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
            <Button variant="ghost" data-testid="button-view-all-clubs-mobile">
              View All Clubs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
