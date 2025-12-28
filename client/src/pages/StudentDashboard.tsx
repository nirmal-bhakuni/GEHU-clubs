import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Trophy,
  LogOut,
  Star,
  Award,
  Bell,
  Target,
  TrendingUp,
  BookOpen,
  Zap,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";
import type { EventRegistration } from "@shared/schema";
import type { ClubMembership } from "@shared/schema";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { student, isAuthenticated, isLoading: authLoading } = useStudentAuth();
  const { toast } = useToast();

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    enabled: isAuthenticated,
  });

  const { data: registrations = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/student/registrations"],
    enabled: isAuthenticated,
  });

  const { data: memberships = [] } = useQuery<ClubMembership[]>({
    queryKey: ["/api/student/club-memberships"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/student/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/student/logout", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">Welcome, {student?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">
                  Welcome back, {student?.name}! 👋
                </h2>
                <p className="text-muted-foreground">
                  Ready to explore clubs and events? Your journey starts here.
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Enrollment: {student?.enrollment}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3" />
                    {student?.branch}
                  </Badge>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
                  <Users className="h-10 w-10 text-primary" />
                </div>
              </div>
            </div>
          </Card>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="text-2xl font-bold">{memberships.length}</p>
                  <p className="text-sm text-muted-foreground">Joined Clubs</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-chart-2 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{registrations.length}</p>
                  <p className="text-sm text-muted-foreground">Registered Events</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-chart-3 mr-3" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-chart-4 mr-3" />
                <div>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* My Clubs */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Clubs
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {memberships.slice(0, 3).map((membership) => (
                  <div key={membership.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-medium">{membership.clubName}</h4>
                      <p className="text-sm text-muted-foreground">Status: <Badge variant={membership.status === 'approved' ? 'default' : membership.status === 'pending' ? 'secondary' : 'destructive'}>{membership.status}</Badge></p>
                      <p className="text-xs text-muted-foreground">Enrollment: {membership.enrollmentNumber}</p>
                    </div>
                    <Badge variant="outline">{membership.department}</Badge>
                  </div>
                ))}
                {memberships.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No club memberships yet. Join clubs to see them here!
                  </p>
                )}
              </div>
            </Card>

            {/* My Events */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  My Registered Events
                </h3>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                {registrations.slice(0, 3).map((registration) => (
                  <div key={registration.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-medium">{registration.eventTitle}</h4>
                      <p className="text-sm text-muted-foreground">{registration.eventDate} at {registration.eventTime}</p>
                      <p className="text-xs text-muted-foreground">Enrollment: {registration.enrollmentNumber}</p>
                    </div>
                    <Badge variant="secondary">{registration.clubName}</Badge>
                  </div>
                ))}
                {registrations.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No registered events yet. Register for events to see them here!
                  </p>
                )}
              </div>
            </Card>

            {/* Points & Rank */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Points & Rank
                </h3>
              </div>
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">0</div>
                  <p className="text-sm text-muted-foreground mb-4">Total Points Earned</p>
                  <Badge variant="secondary" className="mb-2">Beginner Rank</Badge>
                  <p className="text-xs text-muted-foreground">
                    Earn points by participating in events and joining clubs
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-semibold">0</div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-semibold">0</div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Skills Earned */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Skills Earned
                </h3>
              </div>
              <div className="space-y-3">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Skills will be unlocked as you participate in club activities and events
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {["Leadership", "Teamwork", "Communication", "Problem Solving"].map((skill) => (
                    <div key={skill} className="p-2 bg-muted/30 rounded text-center">
                      <p className="text-xs font-medium text-muted-foreground">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Badges */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Badges
                </h3>
              </div>
              <div className="space-y-3">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Earn badges by achieving milestones and completing challenges
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["First Event", "Club Member", "Active Participant"].map((badge) => (
                    <div key={badge} className="p-3 bg-muted/30 rounded-lg text-center">
                      <Award className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <p className="text-xs font-medium text-muted-foreground">{badge}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </h3>
                <Badge variant="secondary">0</Badge>
              </div>
              <div className="space-y-3">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Stay updated with club announcements, event reminders, and achievements
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="p-3 border border-border rounded-lg">
                    <p className="text-sm text-muted-foreground">No new notifications</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      You'll receive updates about your clubs and events here
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}