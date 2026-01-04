import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ClubCard from "@/components/ClubCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3X3, List, SortAsc, SortDesc } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club } from "@shared/schema";

export default function Clubs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "members" | "category">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Fetch clubs from API
  const { data: clubs = [], isLoading, error } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clubs");
      return res.json();
    },
  });

  // Log for debugging
  console.log("Clubs data:", clubs);
  console.log("Is loading:", isLoading);
  console.log("Error:", error);

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || club.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortBy) {
      case "name":
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case "members":
        aValue = a.memberCount;
        bValue = b.memberCount;
        break;
      case "category":
        aValue = a.category.toLowerCase();
        bValue = b.category.toLowerCase();
        break;
      default:
        return 0;
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return (
    <div className="min-h-screen py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12 group">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 relative inline-block group/heading">
            Explore Clubs
            {/* Animated underline */}
            <div className="absolute -bottom-2 left-0 h-1.5 w-0 bg-gradient-to-r from-primary via-primary to-transparent group-hover:w-full transition-all duration-700 ease-out rounded-full"></div>
            {/* Glow effect on hover */}
            <div className="absolute inset-0 opacity-0 group-hover/heading:opacity-100 transition-opacity duration-500 blur-lg bg-primary/10 rounded-lg -z-10 group-hover/heading:blur-xl"></div>
          </h1>
          <p className="text-lg text-muted-foreground font-body group-hover:text-foreground transition-colors duration-300">
            Find your community and pursue your passions
          </p>
        </div>

        <div className="mb-8 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search clubs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-clubs"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-48" data-testid="select-category-filter">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Technology">Technology</SelectItem>
              <SelectItem value="Academic">Academic</SelectItem>
              <SelectItem value="Arts">Arts</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Social">Social</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Controls and Sorting */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">View:</span>
            <div className="flex rounded-lg border">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="rounded-r-none"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Sort by:</span>
            <Select value={sortBy} onValueChange={(value: "name" | "members" | "category") => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="members">Members</SelectItem>
                <SelectItem value="category">Category</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing {filteredClubs.length} of {clubs.length} clubs
          </p>
          {filteredClubs.length > 0 && (
            <div className="flex gap-2">
              {Array.from(new Set(filteredClubs.map(club => club.category))).slice(0, 3).map(category => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body">Loading clubs...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive font-body">Failed to load clubs. Please try again.</p>
            <p className="text-sm text-muted-foreground mt-2">{String(error)}</p>
          </div>
        ) : clubs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body">No clubs available yet.</p>
          </div>
        ) : (
          <>
            <div className={
              viewMode === "grid"
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
                : "space-y-4"
            }>
              {filteredClubs.map((club) => (
                <ClubCard
                  key={club.id}
                  {...club}
                />
              ))}
            </div>

            {filteredClubs.length === 0 && clubs.length > 0 && (
              <div className="text-center py-16">
                <p className="text-muted-foreground font-body">No clubs found matching your criteria.</p>
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
