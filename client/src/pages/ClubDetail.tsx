import React, { useState, useEffect } from "react";
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
import { Users, Calendar, Star, BookOpen, Award, Mail, Phone, Heart, Share2, ExternalLink, Trophy } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club, Event } from "@shared/schema";
import type { ClubLeadership } from "@shared/schema";
import type { Achievement } from "@shared/schema";
import ClubMembership from "@/components/ClubMembership";
import ClubContact from "@/components/ClubContact";
import { useStudentAuth } from "@/hooks/useStudentAuth";

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
  const { student, isAuthenticated } = useStudentAuth();

  // Pre-fill form when student data is available
  useEffect(() => {
    if (student && isAuthenticated) {
      setJoinForm(prev => ({
        ...prev,
        name: student.name,
        email: student.email,
        department: student.branch,
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

    // Ensure form is properly filled
    if (!joinForm.name || !joinForm.email || !joinForm.department || !joinForm.enrollmentNumber) {
      toast({
        title: "Form Incomplete",
        description: "Please wait for your information to load and try again.",
        variant: "destructive",
      });
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
        studentName: joinForm.name,
        studentEmail: joinForm.email,
        enrollmentNumber: joinForm.enrollmentNumber,
        department: joinForm.department,
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
                  setJoinForm(prev => ({ ...prev, reason: '' }));
                  setIsSubmitting(false);
                } else if (open && student && isAuthenticated) {
                  // Ensure form is filled when modal opens
                  setJoinForm(prev => ({
                    ...prev,
                    name: student.name,
                    email: student.email,
                    department: student.branch,
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
                          disabled={hasAlreadyJoinedClub}
                        >
                          <Users className="w-4 h-4 mr-2" />
                          {hasAlreadyJoinedClub ? "Already Joined" : "Join Club"}
                        </Button>
                      </DialogTrigger>
                    ) : (
                      <Button 
                        variant="default"
                        size="sm"
                        className="hover:scale-105 transition-transform bg-primary hover:bg-primary/90"
                        onClick={() => {
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
                        Join Club
                      </Button>
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {!isAuthenticated ? "Login required to join clubs" : hasAlreadyJoinedClub ? "You are already a member or have a pending request" : "Join this club"}
                  </TooltipContent>
                </Tooltip>
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
                  <Button type="submit" className="w-full" disabled={isSubmitting || hasAlreadyJoinedClub}>
                    {isSubmitting ? "Submitting..." : hasAlreadyJoinedClub ? "Already a member or request pending" : "Submit Join Request"}
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
