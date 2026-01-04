import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import EventCard from "@/components/EventCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events");
      return res.json();
    },
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12 group">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 relative inline-block group/heading">
            Upcoming Events
            {/* Animated underline */}
            <div className="absolute -bottom-2 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-primary to-transparent group-hover:w-full transition-all duration-700 ease-out rounded-full"></div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover/heading:opacity-100 transition-opacity duration-500 blur-lg bg-primary/10 rounded-lg -z-10 group-hover/heading:blur-xl"></div>
          </h1>
          <p className="text-lg text-muted-foreground font-body group-hover:text-foreground transition-colors duration-300">
            Discover workshops, bootcamps, and exciting campus activities
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-events"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Workshop">Workshop</SelectItem>
              <SelectItem value="Bootcamp">Bootcamp</SelectItem>
              <SelectItem value="Seminar">Seminar</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
              <SelectItem value="Competition">Competition</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body">Loading events...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <EventCard 
                  key={event.id} 
                  {...event} 
                  imageUrl={event.imageUrl || '/api/placeholder/event.jpg'}
                />
              ))}
            </div>

            {filteredEvents.length === 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body">No events found matching your criteria.</p>
                <Button
                  variant="ghost"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
