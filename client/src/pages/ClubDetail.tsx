import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Star, BookOpen, Award, Mail, Phone, Heart, Share2, ExternalLink, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club, Event } from "@shared/schema";
import type { ClubLeadership } from "@shared/schema";
import type { Achievement } from "@shared/schema";
import ClubMembership from "@/components/ClubMembership";
import ClubContact from "@/components/ClubContact";

// Static event data for when API is not available
const staticEvents: Record<string, Event> = {
  "737b3d2b-78e9-4929-a70b-41444884d697": {
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
  "b46225da-8989-4dab-84ba-0441426b12d6": {
    id: "b46225da-8989-4dab-84ba-0441426b12d6",
    title: "Web Development Bootcamp",
    description: "Learn modern web development technologies including React, Node.js, and database design.",
    date: "November 15, 2025",
    time: "9:00 AM - 5:00 PM",
    location: "Engineering Building",
    category: "Bootcamp",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    clubName: "IEEE",
    imageUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTUzgijNqFpoWRSWhPKpXOqB-W2ccjhrFBeKw&s",
    createdAt: new Date("2025-11-18T15:02:01.343Z")
  }
};

// Static club data for when API is not available
const staticClubs: Record<string, Club> = {
  "484c2b24-6193-42c1-879b-185457a9598f": {
    id: "484c2b24-6193-42c1-879b-185457a9598f",
    name: "ARYAVRAT",
    description: "Sharpen your argumentation skills and debate with passion. Join our vibrant community of thinkers and speakers who engage in intellectual discourse and public speaking competitions.",
    category: "Academic",
    memberCount: 86,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951": {
    id: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951",
    name: "RANGMANCH",
    description: "Make a difference in our community through social service and volunteer work. Join hands with us to create positive change and contribute to society.",
    category: "Social",
    memberCount: 175,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  "f54a2526-787b-4de5-9582-0a42f4aaa61b": {
    id: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    name: "IEEE",
    description: "Building innovative solutions and exploring cutting-edge technology. Join the future of engineering and innovation with hands-on projects and workshops.",
    category: "Technology",
    memberCount: 125,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  "181d3e7d-d6cd-4f40-b712-7182fcd77154": {
    id: "181d3e7d-d6cd-4f40-b712-7182fcd77154",
    name: "PAPERTECH-GEHU",
    description: "Express yourself through various art forms including painting, drawing, and digital art. Unleash your creativity and join our artistic community.",
    category: "Arts",
    memberCount: 96,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1E5bjkWeSCRBUuagbLTanHg&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  "cc71501e-1525-4e3b-959c-f3874db96396": {
    id: "cc71501e-1525-4e3b-959c-f3874db96396",
    name: "Entrepreneurship Hub",
    description: "Connect with fellow entrepreneurs and learn the skills needed to build successful businesses. Turn ideas into reality with our mentorship programs.",
    category: "Business",
    memberCount: 150,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  "485300f0-e4cc-4116-aa49-d60dd19070d8": {
    id: "485300f0-e4cc-4116-aa49-d60dd19070d8",
    name: "CODE_HUNTERS",
    description: "Discover the wonders of science through hands-on experiments and research. Join our journey of scientific exploration and innovation.",
    category: "Academic",
    memberCount: 110,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  }
};

export default function ClubDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    department: '',
    enrollmentNumber: '',
    reason: ''
  });
  const { toast } = useToast();

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      await apiRequest("POST", `/api/clubs/${id}/join`, joinForm);
      toast({
        title: "Join Request Submitted",
        description: "Your request has been sent to the club admin for approval. You'll be notified once it's reviewed.",
      });
      setIsJoinModalOpen(false);
      setJoinForm({ name: '', email: '', department: '', enrollmentNumber: '', reason: '' });
    } catch (error: any) {
      toast({
        title: "Join Request Failed",
        description: error.message || "Failed to submit join request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: `${club?.name} has been ${isFavorited ? "removed from" : "added to"} your favorites.`,
    });
  };

  const handleShare = async () => {
    const shareData = {
      title: `${club?.name} - GEHU Clubs`,
      text: `Check out ${club?.name} club at GEHU!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied!",
          description: "Club link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share this club.",
        variant: "destructive",
      });
    }
  };

  const { data: club, isLoading: clubLoading } = useQuery<Club | null>({
    queryKey: ["/api/clubs", id],
    queryFn: async () => {
      // Try API first, fallback to static data
      try {
        const res = await fetch(`/api/clubs/${id}`);
        if (res.ok) return res.json();
      } catch (error) {
        // Fallback to static data
      }
      return staticClubs[id] || null;
    },
    initialData: staticClubs[id] || null,
    staleTime: Infinity,
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { clubId: id }],
    queryFn: async () => {
      // Try API first, fallback to static data
      try {
        const res = await fetch(`/api/events?clubId=${id}`);
        if (res.ok) return res.json();
      } catch (error) {
        // Fallback to static data
      }
      // Return events for this club (only IEEE has events in our static data)
      return id === "f54a2526-787b-4de5-9582-0a42f4aaa61b" ? Object.values(staticEvents) : [];
    },
    initialData: id === "f54a2526-787b-4de5-9582-0a42f4aaa61b" ? Object.values(staticEvents) : [],
    staleTime: Infinity,
    enabled: !!id,
  });

  const { data: leadership = [] } = useQuery<ClubLeadership[]>({
    queryKey: ["/api/club-leadership", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`/api/club-leadership/${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements", id],
    queryFn: async () => {
      if (!id) return [];
      const res = await fetch(`/api/achievements/${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  if (clubLoading) return <div className="p-8">Loading club...</div>;
  if (!club) return <div className="p-8">Club not found.</div>;

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Cover Image */}
        {club.coverImageUrl && (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
            <img
              src={club.coverImageUrl}
              alt={`${club.name} cover`}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-4 left-4 text-white">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{club.name}</h1>
              <Badge variant="secondary" className="bg-white/90 text-black hover:bg-white">
                {club.category}
              </Badge>
            </div>
          </div>
        )}

        {/* Club Header */}
        <Card className="p-6 relative overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-50" />

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
            <Avatar className="w-20 h-20 ring-2 ring-primary/20">
              <AvatarImage src={club.logoUrl} alt={club.name} />
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {club.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {!club.coverImageUrl && (
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{club.name}</h1>
                  <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                    {club.category}
                  </Badge>
                </div>
              )}
              <p className="text-muted-foreground mb-4">{club.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {club.memberCount} members
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Active Club
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {/* Interactive buttons */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavorite}
                    className="hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorited ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share club</TooltipContent>
              </Tooltip>

              <Dialog open={isJoinModalOpen} onOpenChange={(open) => {
                setIsJoinModalOpen(open);
                if (!open) {
                  setJoinForm({ name: '', email: '', department: '', enrollmentNumber: '', reason: '' });
                  setIsSubmitting(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="hover:scale-105 transition-transform">
                    <Users className="w-4 h-4 mr-2" />
                    Join Club
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join {club.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={joinForm.email}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, email: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={joinForm.department}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, department: e.target.value }))}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                    <Input
                      id="enrollmentNumber"
                      value={joinForm.enrollmentNumber}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, enrollmentNumber: e.target.value }))}
                      placeholder="GEHU/2024/001"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Why do you want to join?</Label>
                    <Textarea
                      id="reason"
                      value={joinForm.reason}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Submit Join Request"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Link href="/clubs">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="club-info">Club Info</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">About {club.name}</h3>
            <p className="text-muted-foreground">{club.description}</p>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Club Achievements
            </h3>
            {achievements.length === 0 ? (
              <Card className="p-6 text-center">
                <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">No Achievements Yet</h4>
                <p className="text-muted-foreground">
                  This club hasn't added any achievements yet. Check back later to see their accomplishments!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement) => (
                  <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={achievement.imageUrl}
                        alt={achievement.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-lg line-clamp-2">{achievement.title}</h4>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                          {achievement.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-3">
                        {achievement.description}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(achievement.achievementDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="club-info" className="space-y-8">
          <ClubMembership
            clubName={club.name}
            description={`Join ${club.name} to be part of a vibrant community of innovators and learners. Connect with like-minded individuals and grow together!`}
            memberCount={club.memberCount}
            joinFee={0}
          />
          <ClubContact clubName={club.name} clubId={id} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Latest Announcements</h3>
            <p className="text-muted-foreground">Stay updated with the latest news and updates from {club.name}.</p>
            <p className="text-sm text-muted-foreground mt-2">No announcements at the moment.</p>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Club Events</h3>
            {eventsLoading ? (
              <div>Loading events...</div>
            ) : events.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground">No events for this club yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((ev) => (
                  <Card key={ev.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{ev.title}</h4>
                        <div className="text-sm text-muted-foreground">{ev.date} • {ev.time}</div>
                      </div>
                      <Link href={`/events/${ev.id}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Leadership Team
            </h3>
            {leadership.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadership.map((leader) => (
                  <div
                    key={leader.id}
                    className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <Avatar className="w-12 h-12 flex-shrink-0">
                        <AvatarFallback className="flex items-center justify-center w-full h-full rounded-full bg-primary/10 text-primary font-bold text-base leading-none">
                          {leader.studentName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{leader.studentName}</p>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {leader.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>

                      <div className="w-full mt-2 space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={`mailto:${leader.studentEmail}`}
                            className="text-primary hover:underline truncate text-sm"
                          >
                            {leader.studentEmail}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(leader.studentEmail);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            aria-label={`Copy ${leader.studentEmail}`}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={`tel:${leader.phoneNumber}`}
                            className="text-primary hover:underline truncate text-sm"
                          >
                            {leader.phoneNumber}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(leader.phoneNumber);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                            aria-label={`Copy ${leader.phoneNumber}`}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h4 className="font-semibold mb-2">Leadership Team</h4>
                <p className="text-muted-foreground">
                  Leadership positions for this club will be displayed here once assigned by the club administrators.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>
    </TooltipProvider>
  );
}
