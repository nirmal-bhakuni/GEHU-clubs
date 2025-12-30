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
import type { Club } from "@shared/schema";

// Temporary static data until server is fixed
const staticClubs: Club[] = [
  {
    id: "484c2b24-6193-42c1-879b-185457a9598f",
    name: "ARYAVRAT",
    description: "Sharpen your argumentation skills and debate with passion. Join our vibrant community of thinkers and speakers.",
    category: "Academic",
    memberCount: 86,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951",
    name: "RANGMANCH",
    description: "Make a difference in our community through social service and volunteer work. Join hands with us to create positive change.",
    category: "Social",
    memberCount: 175,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    name: "IEEE",
    description: "Building innovative solutions and exploring cutting-edge technology. Join the future of engineering and innovation.",
    category: "Technology",
    memberCount: 125,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "181d3e7d-d6cd-4f40-b712-7182fcd77154",
    name: "PAPERTECH-GEHU",
    description: "Express yourself through various art forms including painting, drawing, and digital art. Unleash your creativity.",
    category: "Arts",
    memberCount: 96,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1U5bjkWeSCRBUuagbLTanHg&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "cc71501e-1525-4e3b-959c-f3874db96396",
    name: "Entrepreneurship Hub",
    description: "Connect with fellow entrepreneurs and learn the skills needed to build successful businesses. Turn ideas into reality.",
    category: "Business",
    memberCount: 150,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "485300f0-e4cc-4116-aa49-d60dd19070d8",
    name: "CODE_HUNTERS",
    description: "Discover the wonders of science through hands-on experiments and research. Join our journey of scientific exploration.",
    category: "Academic",
    memberCount: 110,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  }
];

export default function Clubs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "members" | "category">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Temporarily use static data until server is fixed
  const { data: clubs = staticClubs, isLoading } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    initialData: staticClubs,
    staleTime: Infinity, // Keep data fresh
  });

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
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Explore Clubs
          </h1>
          <p className="text-lg text-muted-foreground font-body">
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

            {filteredClubs.length === 0 && (
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
