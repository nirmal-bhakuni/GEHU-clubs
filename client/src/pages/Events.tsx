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
import type { Event } from "@shared/schema";

// Temporary static data until server is fixed
const staticEvents: Event[] = [
  {
    id: "737b3d2b-78e9-4929-a70b-41444884d697",
    title: "Winter Tech Fest",
    description: "Two-day technology festival featuring workshops, hackathons, and networking opportunities with industry experts.",
    date: "December 20, 2025",
    time: "10:00 AM - 6:00 PM",
    location: "Main Auditorium",
    category: "Festival",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    clubName: "IEEE",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSI9p1_QlWws8d3TwlotQjB_Itnxyb_BYoRBQ&s",
    createdAt: new Date("2025-11-18T15:02:01.343Z")
  },
  {
    id: "b46225da-8989-4dab-84ba-0441426b12d6",
    title: "Web Development Bootcamp",
    description: "Learn modern web development technologies including React, Node.js, and database design. Perfect for beginners and intermediate developers.",
    date: "November 15, 2025",
    time: "9:00 AM - 5:00 PM",
    location: "Engineering Building",
    category: "Bootcamp",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    clubName: "IEEE",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUzgijNqFpoWRSWhPKpXOqB-W2ccjhrFBeKw&s",
    createdAt: new Date("2025-11-18T15:02:01.343Z")
  }
];

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Temporarily use static data until server is fixed
  const { data: events = staticEvents, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    initialData: staticEvents,
    staleTime: Infinity, // Keep data fresh
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
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upcoming Events
          </h1>
          <p className="text-lg text-muted-foreground font-body">
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
