import React, { useState, useEffect, useMemo } from "react";
import { useParams, Link, useLocation } from "wouter";
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
import { Users, Calendar, Star, BookOpen, Award, Mail, Phone, Heart, Share2, ExternalLink, Trophy, Megaphone, Clock3 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club, Event } from "@shared/schema";
import type { ClubLeadership } from "@shared/schema";
import type { Achievement } from "@shared/schema";
import ClubMembership from "@/components/ClubMembership";
import ClubContact from "@/components/ClubContact";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { resolveMediaUrl } from "@/lib/utils";

export default function ClubDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, setLocation] = useLocation();
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasAlreadyJoinedClub, setHasAlreadyJoinedClub] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    department: '',
    enrollmentNumber: '',
    reason: ''
  });
  const { toast } = useToast();
  const { student, isAuthenticated, isLoading: studentAuthLoading } = useStudentAuth();
  const missingProfileFields = [
    !student?.name ? "name" : null,
    !student?.email ? "email" : null,
    !student?.department ? "department" : null,
    !student?.enrollment ? "enrollment number" : null,
  ].filter(Boolean) as string[];
  const isStudentProfileComplete =
    !!student?.name &&
    !!student?.email &&
    !!student?.enrollment &&
    !!student?.department;

  // Pre-fill form when student data is available
  useEffect(() => {
    if (student && isAuthenticated) {
      setJoinForm(prev => ({
        ...prev,
        name: student.name,
        email: student.email,
        department: student.department || '',
        enrollmentNumber: student.enrollment
      }));
    }
  }, [student, isAuthenticated]);

  // Check if student has already sent a join request or is a member of this club
  useEffect(() => {
    if (isAuthenticated && student && id) {
      const checkMembership = async () => {
        try {
          const response = await apiRequest("GET", "/api/student/club-memberships");
          const memberships = await response.json();
          const alreadyJoined = memberships.some((membership: any) => 
            membership.clubId === id && (membership.status === 'approved' || membership.status === 'pending')
          );
          setHasAlreadyJoinedClub(alreadyJoined);
        } catch (error) {
          console.error("Failed to check club membership:", error);
        }
      };
      checkMembership();
    }
  }, [isAuthenticated, student, id]);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Ensure user is authenticated and student data is available
    if (!isAuthenticated || !student) {
      toast({
        title: "Authentication Required",
        description: "Please login as a student to join clubs.",
        variant: "destructive",
      });
      setIsJoinModalOpen(false);
      return;
    }

    if (studentAuthLoading) {
      toast({
        title: "Please wait",
        description: "Loading your student profile.",
        variant: "destructive",
      });
      return;
    }

    if (!isStudentProfileComplete) {
      toast({
        title: "Profile incomplete",
        description: "Please complete your student profile (including department) before joining a club.",
        variant: "destructive",
      });
      setIsJoinModalOpen(false);
      setLocation("/student");
      return;
    }

    // Validate that reason is provided
    if (!joinForm.reason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for joining the club.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiRequest("POST", `/api/clubs/${id}/join`, { reason: joinForm.reason.trim() });
      toast({
        title: "Join Request Submitted",
        description: "Your request has been sent to the club admin for approval. You'll be notified once it's reviewed.",
      });
      setIsJoinModalOpen(false);
      setJoinForm(prev => ({ ...prev, reason: '' }));
    } catch (error: any) {
      console.error("Join request error:", error);
      
      // Fallback: store join request locally
      const pendingRequests = JSON.parse(localStorage.getItem("pendingJoinRequests") || "[]");
      const request = {
        id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        clubId: id,
        clubName: club?.name || "Unknown Club",
        studentName: student.name,
        studentEmail: student.email,
        enrollmentNumber: student.enrollment,
        department: student.department,
        reason: joinForm.reason.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
        isFallback: true
      };
      
      pendingRequests.push(request);
      //localStorage.setItem("pendingJoinRequests", JSON.stringify(pendingRequests));
      
      toast({
        title: "Join Request Submitted (Offline)",
        description: "Your request has been saved locally. It will be submitted when you're back online.",
      });
      setIsJoinModalOpen(false);
      setJoinForm(prev => ({ ...prev, reason: '' }));
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
      if (!id) return null;
      const res = await apiRequest("GET", `/api/clubs/${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { clubId: id }],
    queryFn: async () => {
      if (!id) return [];
      const res = await apiRequest("GET", `/api/events?clubId=${id}`);
      return res.json();
    },
    enabled: !!id,
  });

  const { data: leadership = [] } = useQuery<ClubLeadership[]>({
    queryKey: ["/api/club-leadership", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const res = await apiRequest("GET", `/api/club-leadership/${id}`);
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/achievements", id],
    queryFn: async () => {
      if (!id) return [];
      try {
        const res = await apiRequest("GET", `/api/achievements/${id}`);
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: !!id,
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/announcements", id],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements?limit=50");
      return res.json();
    },
    enabled: !!id,
  });

  const updatesTimeline = useMemo(() => {
    const clubAnnouncements = announcements
      .filter((announcement: any) => announcement?.target === "all" || announcement?.target === id)
      .map((announcement: any) => ({
        id: `announcement-${announcement.id || announcement._id}`,
        type: "announcement" as const,
        title: announcement.title,
        description: announcement.content,
        createdAt: announcement.createdAt || new Date(),
        pinned: !!announcement.pinned,
        targetUrl: announcement.target === id ? `/clubs/${id}` : "/events",
        ctaLabel: "View Details",
      }));

    const eventUpdates = events.map((event) => ({
      id: `event-${event.id}`,
      type: "event" as const,
      title: event.title,
      description: event.description,
      createdAt: event.createdAt || event.date || new Date(),
      pinned: false,
      targetUrl: `/events/${event.id}`,
      ctaLabel: "Go To Event",
    }));

    return [...clubAnnouncements, ...eventUpdates].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [announcements, events, id]);

  const formatTimelineTime = (value: string | Date) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Recently";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (clubLoading) return <div className="p-8">Loading club...</div>;
  if (!club) return <div className="p-8">Club not found.</div>;

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Cover Image */}
        {club.coverImageUrl && (
          <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
            <img
              src={resolveMediaUrl(club.coverImageUrl)}
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
              <AvatarImage src={resolveMediaUrl(club.logoUrl)} alt={club.name} />
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
                  setJoinForm(prev => ({ ...prev, reason: '' }));
                  setIsSubmitting(false);
                } else if (open && student && isAuthenticated) {
                  // Ensure form is filled when modal opens
                  setJoinForm(prev => ({
                    ...prev,
                    name: student.name,
                    email: student.email,
                    department: student.department || '',
                    enrollmentNumber: student.enrollment
                  }));
                }
              }}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    {isAuthenticated ? (
                      <DialogTrigger asChild>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="hover:scale-105 transition-transform bg-primary hover:bg-primary/90"
                          disabled={hasAlreadyJoinedClub || club?.isFrozen}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {club?.isFrozen ? "Club Frozen" : hasAlreadyJoinedClub ? "Already Joined" : "Join Club"}
                        </Button>
                      </DialogTrigger>
                    ) : (
                      <Button 
                        variant="default"
                        size="sm"
                        className="hover:scale-105 transition-transform bg-primary hover:bg-primary/90"
                        disabled={club?.isFrozen}
                        onClick={() => {
                          if (club?.isFrozen) {
                            toast({
                              title: "Club Frozen",
                              description: "This club is currently frozen and not accepting new members.",
                              variant: "destructive",
                            });
                            return;
                          }
                          toast({
                            title: "Login Required",
                            description: "Please login as a student to join clubs.",
                            variant: "destructive",
                          });
                          // Redirect to student login page
                          setLocation("/student/login");
                        }}
                      >
                        <Users className="w-4 h-4 mr-2" />
                        {club?.isFrozen ? "Club Frozen" : "Join Club"}
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {club?.isFrozen ? "This club is frozen and not accepting new members" : !isAuthenticated ? "Login required to join clubs" : hasAlreadyJoinedClub ? "You are already a member or have a pending request" : "Join this club"}
                  </TooltipContent>
                </Tooltip>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join {club.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <p className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    Name, email, department, and enrollment number are auto-filled from your logged-in student profile and cannot be edited here.
                  </p>
                  {!isStudentProfileComplete && (
                    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      Submit is disabled because your profile is missing: {missingProfileFields.join(", ")}. Please complete your student profile first.
                    </div>
                  )}
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, name: e.target.value }))}
                      disabled={isSubmitting || isAuthenticated}
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
                      disabled={isSubmitting || isAuthenticated}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={joinForm.department}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, department: e.target.value }))}
                      disabled={isSubmitting || isAuthenticated}
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
                      disabled={isSubmitting || isAuthenticated}
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
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || hasAlreadyJoinedClub || !isStudentProfileComplete}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : hasAlreadyJoinedClub
                        ? "Already a member or request pending"
                        : !isStudentProfileComplete
                          ? "Complete Profile To Submit"
                          : "Submit Join Request"}
                  </Button>
                  {!isStudentProfileComplete && (
                    <Button type="button" variant="outline" className="w-full" onClick={() => setLocation("/student")}>Go To Student Profile</Button>
                  )}
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
          <TabsTrigger value="announcements">Updates</TabsTrigger>
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
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Club Achievements
            </h3>
            {achievements.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 hover:border-primary/40 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </div>
                <h4 className="font-semibold text-lg mb-2">No Achievements Yet</h4>
                <p className="text-muted-foreground">
                  This club hasn't added any achievements yet. Check back later to see their accomplishments!
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {achievements.map((achievement, index) => (
                  <Card key={achievement.id} className="group relative overflow-hidden border border-primary/10 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02] animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer"></div>
                    </div>
                    
                    <div className="aspect-video overflow-hidden relative">
                      <img
                        src={achievement.imageUrl}
                        alt={achievement.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      {/* Award badge */}
                      <div className="absolute top-3 right-3 w-10 h-10 rounded-full bg-yellow-500/90 flex items-center justify-center shadow-lg animate-bounce-subtle">
                        <Trophy className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="p-6 relative z-10">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h4 className="text-lg font-bold group-hover:text-primary transition-colors">{achievement.title}</h4>
                        <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 whitespace-nowrap">
                          {new Date(achievement.achievementDate).getFullYear()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">{achievement.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {new Date(achievement.achievementDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
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
            <h3 className="text-xl font-semibold mb-4">Club Updates Timeline</h3>
            <p className="text-muted-foreground mb-6">Announcements and event activity from {club.name} in one place.</p>

            {updatesTimeline.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet. Check back soon for new activity.</p>
            ) : (
              <div className="space-y-4">
                {updatesTimeline.slice(0, 10).map((item) => (
                  <div key={item.id} className="rounded-lg border border-primary/15 p-4 hover:border-primary/35 transition-colors">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.type === "announcement" ? <Megaphone className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        <span className="font-medium">{item.type === "announcement" ? "Announcement" : "Event update"}</span>
                        {item.pinned && <Badge variant="secondary" className="text-[10px]">Pinned</Badge>}
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="w-3.5 h-3.5" />
                        {formatTimelineTime(item.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-semibold text-base mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{item.description}</p>

                    <Link href={item.targetUrl}>
                      <Button size="sm" variant="outline" className="h-10">
                        {item.ctaLabel}
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Club Events
            </h3>
            {eventsLoading ? (
              <div className="text-center py-8">Loading events...</div>
            ) : events.length === 0 ? (
              <Card className="p-8 text-center border-dashed border-2 hover:border-primary/40 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">No Events Yet</h4>
                <p className="text-muted-foreground">No events for this club yet. Check back soon!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((ev, index) => (
                  <Card key={ev.id} className="group p-5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-primary/10" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex flex-col items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <span className="text-xs font-medium">{new Date(ev.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}</span>
                          <span className="text-xl font-bold">{new Date(ev.date).getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{ev.title}</h4>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {ev.date}
                            </span>
                            <span>•</span>
                            <span>{ev.time}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/events/${ev.id}`}>
                        <Button variant="outline" className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 shadow-sm hover:shadow-md group-hover:scale-105">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <div className="max-w-5xl mx-auto">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Leadership Team
            </h3>
            {leadership.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leadership.map((leader, index) => (
                  <Card
                    key={leader.id}
                    className="group p-5 hover:border-primary/30 hover:bg-primary/5 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border border-primary/10"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className="relative">
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-110">
                          <AvatarFallback className="flex items-center justify-center w-full h-full rounded-full bg-gradient-to-br from-primary to-primary/80 text-white font-bold text-xl leading-none">
                            {leader.studentName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                      </div>

                      <div className="min-w-0 w-full">
                        <p className="font-bold text-base mb-1 truncate group-hover:text-primary transition-colors">{leader.studentName}</p>
                        <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border border-primary/20">
                          {leader.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </Badge>
                      </div>

                      <div className="w-full mt-2 space-y-2 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group/email">
                          <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={`mailto:${leader.studentEmail}`}
                            className="text-primary hover:underline truncate text-sm font-medium"
                          >
                            {leader.studentEmail}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(leader.studentEmail);
                              toast({ title: "Copied!", description: "Email copied to clipboard" });
                            }}
                            className="opacity-0 group-hover/email:opacity-100 transition-opacity flex-shrink-0"
                            aria-label={`Copy ${leader.studentEmail}`}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>

                        <div className="flex items-center justify-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group/phone">
                          <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <a
                            href={`tel:${leader.phoneNumber}`}
                            className="text-primary hover:underline truncate text-sm font-medium"
                          >
                            {leader.phoneNumber}
                          </a>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(leader.phoneNumber);
                              toast({ title: "Copied!", description: "Phone number copied to clipboard" });
                            }}
                            className="opacity-0 group-hover/phone:opacity-100 transition-opacity flex-shrink-0"
                            aria-label={`Copy ${leader.phoneNumber}`}
                          >
                            <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-primary" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center border-dashed border-2 hover:border-primary/40 transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h4 className="font-semibold text-lg mb-2">Leadership Team</h4>
                <p className="text-muted-foreground">
                  Leadership positions for this club will be displayed here once assigned by the club administrators.
                </p>
              </Card>
            )}
          </div>
        </TabsContent>

      </Tabs>
    </div>

    <style>{`
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(1rem);
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
      @keyframes bounce-subtle {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out forwards;
      }
      .animate-shimmer {
        animation: shimmer 2s ease-in-out infinite;
      }
      .animate-bounce-subtle {
        animation: bounce-subtle 2s ease-in-out infinite;
      }
    `}</style>
    </TooltipProvider>
  );
}
