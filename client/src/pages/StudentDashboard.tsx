import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
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
  Upload,
  Download,
  FileText,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";
import type { EventRegistration } from "@shared/schema";
import type { ClubMembership } from "@shared/schema";
import type { StudentPoints } from "@shared/schema";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { student, isAuthenticated, isLoading: authLoading } = useStudentAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clubs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: registrations = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/student/registrations"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/student/registrations");
        const apiRegistrations = await res.json();
        
        // Merge with locally stored pending registrations
        const pendingRegistrations = JSON.parse(localStorage.getItem("pendingEventRegistrations") || "[]");
        const localRegistrations = pendingRegistrations.map((reg: any) => ({
          id: reg.id,
          eventId: reg.eventId,
          eventTitle: reg.eventTitle,
          eventDate: reg.eventDate,
          eventTime: reg.eventTime,
          clubName: reg.clubName,
          studentName: reg.fullName,
          studentEmail: reg.email,
          registeredAt: reg.registeredAt,
          attended: false,
          isFallback: true
        }));
        
        return [...apiRegistrations, ...localRegistrations];
      } catch (error) {
        // Fallback: return locally stored registrations
        const pendingRegistrations = JSON.parse(localStorage.getItem("pendingEventRegistrations") || "[]");
        return pendingRegistrations.map((reg: any) => ({
          id: reg.id,
          eventId: reg.eventId,
          eventTitle: reg.eventTitle,
          eventDate: reg.eventDate,
          eventTime: reg.eventTime,
          clubName: reg.clubName,
          studentName: reg.fullName,
          studentEmail: reg.email,
          registeredAt: reg.registeredAt,
          attended: false,
          isFallback: true
        }));
      }
    },
    enabled: isAuthenticated,
  });

  const { data: memberships = [] } = useQuery<ClubMembership[]>({
    queryKey: ["/api/student/club-memberships"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/club-memberships");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: studentPointsData } = useQuery<{
    totalPoints: number;
    rank: number;
    badges: string[];
    skills: string[];
    pointsThisMonth: number;
    pointsThisWeek: number;
    clubBreakdown: Array<{
      clubId: string;
      clubName: string;
      points: number;
      badges: string[];
      skills: string[];
    }>;
  }>({
    queryKey: ["/api/student/points"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/points");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: studentAnnouncements = [] } = useQuery<any[]>({
    queryKey: ["/api/student/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/announcements");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: certificates = [] } = useQuery<any[]>({
    queryKey: ["/api/student/certificates"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/student/certificates");
        return res.json();
      } catch (error) {
        return [];
      }
    },
    enabled: isAuthenticated,
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const res = await apiRequest("POST", "/api/student/profile-picture", formData);
      return res.json();
    },
    onSuccess: (data) => {
      setProfileImage(data.imageUrl);
      queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      toast({
        title: "Success",
        description: "Profile picture uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
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

  const handleProfilePictureClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingProfile(true);
    uploadProfilePictureMutation.mutate(file, {
      onSettled: () => setIsUploadingProfile(false),
    });
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

  // Filter and sort registrations - only show student's own registrations
  const studentRegistrations = registrations
    .filter(reg => reg.studentEmail === student?.email || reg.enrollmentNumber === student?.enrollment)
    .sort((a, b) => {
      // Sort by event date descending (most recent first)
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateB - dateA;
    });

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
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/30 transition-colors" onClick={handleProfilePictureClick}>
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <Users className="h-10 w-10 text-primary" />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePictureChange}
                disabled={isUploadingProfile}
              />
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
                  <p className="text-2xl font-bold">{studentPointsData?.badges?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Achievements</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center">
                <Target className="h-8 w-8 text-chart-4 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{studentPointsData?.totalPoints || 0}</p>
                  <p className="text-sm text-muted-foreground">Points</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Profile & Certificates Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Picture Upload */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Profile Picture
                </h3>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div 
                  className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/20 transition-colors border-2 border-dashed border-primary/30"
                  onClick={handleProfilePictureClick}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-32 h-32 rounded-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">Click to upload</p>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleProfilePictureClick}
                  disabled={isUploadingProfile}
                >
                  {isUploadingProfile ? "Uploading..." : "Choose Image"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  PNG or JPG up to 5MB
                </p>
              </div>
            </Card>

            {/* Certificates Section */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Certificates
                </h3>
                <Badge variant="secondary">{certificates.length}</Badge>
              </div>
              <div className="space-y-3">
                {certificates && certificates.length > 0 ? (
                  <div className="space-y-2">
                    {certificates.map((cert, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm font-medium">{cert.certificateName || cert.title}</p>
                            <p className="text-xs text-muted-foreground">{cert.clubName}</p>
                            {cert.issuedDate && (
                              <p className="text-xs text-muted-foreground">
                                Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {cert.certificateUrl && (
                          <a 
                            href={cert.certificateUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 hover:bg-primary/10 rounded transition-colors"
                            title="Download certificate"
                          >
                            <Download className="h-5 w-5 text-primary" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No certificates yet. Complete events to earn certificates!
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Attendance Section */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Event Attendance Record
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Showing attendance for your registered events only
                </p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="text-sm mb-1">
                  {studentRegistrations.filter(r => r.attendanceStatus === 'present').length} / {studentRegistrations.length} Present
                </Badge>
                <p className="text-xs text-muted-foreground">Enrollment: {student?.enrollment}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Club</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">Marked At</th>
                  </tr>
                </thead>
                <tbody>
                  {studentRegistrations.length > 0 ? (
                    studentRegistrations.map((registration) => (
                      <tr key={registration.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-medium text-foreground">{registration.eventTitle}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{registration.eventTime}</div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {(() => {
                            try {
                              const date = new Date(registration.eventDate);
                              return date.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              });
                            } catch {
                              return registration.eventDate;
                            }
                          })()}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="secondary" className="text-xs">{registration.clubName}</Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge 
                            variant={
                              registration.attendanceStatus === 'present' ? 'default' : 
                              registration.attendanceStatus === 'absent' ? 'destructive' : 
                              'outline'
                            }
                            className="capitalize font-medium"
                          >
                            {registration.attendanceStatus === 'present' && '✓ '}
                            {registration.attendanceStatus === 'absent' && '✗ '}
                            {registration.attendanceStatus || 'Pending'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {registration.attendanceMarkedAt ? (
                            (() => {
                              try {
                                const date = new Date(registration.attendanceMarkedAt);
                                return date.toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                });
                              } catch {
                                return 'Invalid date';
                              }
                            })()
                          ) : (
                            <span className="text-muted-foreground/50 italic">Not marked yet</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-16 text-center">
                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-30" />
                        <p className="text-muted-foreground font-medium mb-1">
                          No event registrations yet
                        </p>
                        <p className="text-sm text-muted-foreground/60">
                          Register for events to track your attendance!
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {studentRegistrations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{studentRegistrations.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Events</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {studentRegistrations.filter(r => r.attendanceStatus === 'present').length}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Present</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {studentRegistrations.filter(r => r.attendanceStatus === 'absent').length}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {studentRegistrations.filter(r => r.attendanceStatus === 'pending' || !r.attendanceStatus).length}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      {(() => {
                        const markedEvents = studentRegistrations.filter(r => r.attendanceStatus === 'present' || r.attendanceStatus === 'absent');
                        const presentEvents = studentRegistrations.filter(r => r.attendanceStatus === 'present');
                        return markedEvents.length > 0 
                          ? Math.round((presentEvents.length / markedEvents.length) * 100)
                          : 0;
                      })()}%
                    </div>
                    <div className="text-xs text-primary mt-1 font-medium">Attendance Rate</div>
                  </div>
                </div>
              </div>
            )}
          </Card>

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
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{registration.clubName}</Badge>
                      {registration.isFallback && (
                        <Badge variant="outline" className="text-xs">
                          Offline
                        </Badge>
                      )}
                    </div>
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
                {studentPointsData?.rank && (
                  <Badge variant="secondary" className="text-sm">
                    Rank #{studentPointsData.rank}
                  </Badge>
                )}
              </div>
              <div className="space-y-4">
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold text-primary mb-2">
                    {studentPointsData?.totalPoints || 0}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Total Points Earned</p>
                  <div className="flex flex-wrap justify-center gap-2 mb-3">
                    {studentPointsData?.badges?.map((badge, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                    {(!studentPointsData?.badges || studentPointsData.badges.length === 0) && (
                      <Badge variant="secondary" className="text-xs">Beginner</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Earn points by participating in events and joining clubs
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-semibold">{studentPointsData?.pointsThisMonth || 0}</div>
                    <p className="text-xs text-muted-foreground">This Month</p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-semibold">{studentPointsData?.pointsThisWeek || 0}</div>
                    <p className="text-xs text-muted-foreground">This Week</p>
                  </div>
                </div>
                {studentPointsData?.clubBreakdown && studentPointsData.clubBreakdown.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Points by Club</h4>
                    {studentPointsData.clubBreakdown.map((club) => (
                      <div key={club.clubId} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                        <span className="text-sm">{club.clubName}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{club.points} pts</span>
                          {club.badges?.map((badge, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Skills Earned */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Skills Developed
                </h3>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { name: "Leadership", earned: studentPointsData?.badges?.includes("Club Champion") || studentPointsData?.skills?.includes("Leadership") },
                    { name: "Teamwork", earned: studentPointsData?.badges?.includes("Active Member") || studentPointsData?.skills?.includes("Teamwork") },
                    { name: "Communication", earned: studentPointsData?.badges?.includes("Regular Attendee") || studentPointsData?.skills?.includes("Communication") },
                    { name: "Problem Solving", earned: studentPointsData?.totalPoints && studentPointsData.totalPoints > 100 || studentPointsData?.skills?.includes("Problem Solving") },
                    { name: "Creativity", earned: studentPointsData?.skills?.includes("Creativity") },
                    { name: "Organization", earned: studentPointsData?.skills?.includes("Organization") },
                    { name: "Public Speaking", earned: studentPointsData?.skills?.includes("Public Speaking") },
                    { name: "Project Management", earned: studentPointsData?.skills?.includes("Project Management") }
                  ].map((skill) => (
                    <div key={skill.name} className={`p-2 rounded text-center transition-colors ${
                      skill.earned ? 'bg-primary/10 border border-primary/20' : 'bg-muted/30'
                    }`}>
                      <p className={`text-xs font-medium ${skill.earned ? 'text-primary' : 'text-muted-foreground'}`}>
                        {skill.name}
                      </p>
                      {skill.earned && <div className="w-1 h-1 bg-primary rounded-full mx-auto mt-1"></div>}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted-foreground text-center">
                  Skills are developed through active participation and recognition by club admins
                </div>
              </div>
            </Card>

            {/* Badges */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Badges Earned
                </h3>
                <Badge variant="secondary">{studentPointsData?.badges?.length || 0}</Badge>
              </div>
              <div className="space-y-3">
                {studentPointsData?.badges && studentPointsData.badges.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {studentPointsData.badges.map((badge, index) => (
                      <div key={index} className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg text-center">
                        <Award className="h-8 w-8 text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium text-primary">{badge}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Earn badges by achieving milestones and completing challenges
                    </p>
                  </div>
                )}
                <div className="text-xs text-muted-foreground text-center">
                  Keep participating to unlock more badges!
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
                <Badge variant="secondary">{announcements.length || 0}</Badge>
              </div>
              <div className="space-y-3">
                {studentAnnouncements.length === 0 ? (
                  <div className="text-center p-6 bg-muted/50 rounded-lg">
                    <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No new announcements</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {studentAnnouncements.map((a) => (
                      <div key={a.id} className={`p-3 border border-border rounded-lg ${a.isRead ? 'opacity-60' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{a.title} {!a.isRead && <Badge variant="destructive" className="ml-2">New</Badge>}</p>
                            <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            <div>{a.authorName}</div>
                            <div>{a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}</div>
                            <div className="mt-2 flex gap-2">
                              {!a.isRead && (
                                <Button size="sm" onClick={async () => { await apiRequest('POST', `/api/student/announcements/${a.id}/read`); queryClient.invalidateQueries({ queryKey: ['/api/student/announcements'] }); }}>
                                  Mark read
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={async () => { await apiRequest('DELETE', `/api/announcements/${a.id}`); queryClient.invalidateQueries({ queryKey: ['/api/announcements', '/api/student/announcements'] }); }}>
                                Dismiss
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}