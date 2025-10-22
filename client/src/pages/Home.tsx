import { useQuery } from "@tanstack/react-query";
import Hero from "@/components/Hero";
import EventCard from "@/components/EventCard";
import ClubCard from "@/components/ClubCard";
import StatsSection from "@/components/StatsSection";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Event, Club } from "@shared/schema";

export default function Home() {
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
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
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <EventCard 
                key={event.id} 
                {...event}
                imageUrl={event.imageUrl || '/api/placeholder/event.jpg'}
              />
            ))}
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
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredClubs.map((club) => (
              <ClubCard 
                key={club.id} 
                {...club}
                logoUrl={club.logoUrl ?? undefined}
              />
            ))}
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
