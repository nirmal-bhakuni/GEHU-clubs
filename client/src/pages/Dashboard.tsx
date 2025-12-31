import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Megaphone,
  Building2,
  TrendingUp,
  UserCheck,
  Activity,
  Bell,
  Plus,
  Send,
  Edit,
  Eye,
  KeyRound
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";

// Static data for when API is not available
const staticClubs: Club[] = [
  {
    id: "484c2b24-6193-42c1-879b-185457a9598f",
    name: "ARYAVRAT",
    description: "Sharpen your argumentation skills and debate with passion.",
    category: "Academic",
    memberCount: 86,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQHSQ26pPoXAi8YKQZQPoLwPeETRdh9ywhCAQ&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951",
    name: "RANGMANCH",
    description: "Make a difference in our community through social service.",
    category: "Social",
    memberCount: 175,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQxB5o3X1zEYYTEL6XAalXWOiubGY_mrVJCvA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "f54a2526-787b-4de5-9582-0a42f4aaa61b",
    name: "IEEE",
    description: "Building innovative solutions and exploring technology.",
    category: "Technology",
    memberCount: 125,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRGCvDLx2YLXsTqnLYhQPbyv6wDRXXhNkU7ww&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "181d3e7d-d6cd-4f40-b712-7182fcd77154",
    name: "PAPERTECH-GEHU",
    description: "Express yourself through various art forms.",
    category: "Arts",
    memberCount: 96,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRN4okYreu0Yak1E5bjkWeSCRBUuagbLTanHg&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "cc71501e-1525-4e3b-959c-f3874db96396",
    name: "Entrepreneurship Hub",
    description: "Connect with fellow entrepreneurs.",
    category: "Business",
    memberCount: 150,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRkdkjI3VT0FR0WkyDb_xIOPfPpoULRDPybNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  },
  {
    id: "485300f0-e4cc-4116-aa49-d60dd19070d8",
    name: "CODE_HUNTERS",
    description: "Discover the wonders of science.",
    category: "Academic",
    memberCount: 110,
    logoUrl: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-SeTgtHQSr0YhjNgYKbk3y_arKfREH0DdNA&s",
    createdAt: new Date("2025-11-18T15:02:01.265Z")
  }
];

const staticEvents: Event[] = [
  {
    id: "737b3d2b-78e9-4929-a70b-41444884d697",
    title: "Winter Tech Fest",
    description: "Two-day technology festival...",
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
    description: "Learn modern web development...",
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

interface AdminDetails {
  id: string;
  username: string;
  email?: string;
  fullName?: string;
  phone?: string;
  clubId: string;
  role: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  permissions: {
    canCreateEvents: boolean;
    canManageMembers: boolean;
    canEditClub: boolean;
    canViewAnalytics: boolean;
  };
  statistics: {
    totalEvents: number;
    totalMembers: number;
    recentEvents: Array<{
      id: string;
      title: string;
      date: string;
      status: string;
    }>;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [clubForm, setClubForm] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    clubId: "",
  });
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [targetForAnnouncement, setTargetForAnnouncement] = useState<string>("all");

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      // Try API first, fallback to static data
      try {
        const res = await apiRequest("GET", "/api/events");
        return res.json();
      } catch (error) {
        return staticEvents;
      }
    },
    enabled: isAuthenticated,
    initialData: staticEvents,
    staleTime: Infinity,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      // Try API first, fallback to static data
      try {
        const res = await apiRequest("GET", "/api/clubs");
        return res.json();
      } catch (error) {
        return staticClubs;
      }
    },
    enabled: isAuthenticated,
    initialData: staticClubs,
    staleTime: Infinity,
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/students");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: studentCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/students/count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/students/count");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Student profile data queries
  const { data: studentMemberships = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/student-memberships", selectedStudent?.enrollment],
    queryFn: async () => {
      if (!selectedStudent?.enrollment) return [];
      const res = await apiRequest("GET", `/api/admin/student-memberships/${selectedStudent.enrollment}`);
      return res.json();
    },
    enabled: !!selectedStudent?.enrollment && isStudentProfileOpen,
  });

  const { data: studentRegistrations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/student-registrations", selectedStudent?.enrollment],
    queryFn: async () => {
      if (!selectedStudent?.enrollment) return [];
      const res = await apiRequest("GET", `/api/admin/student-registrations/${selectedStudent.enrollment}`);
      return res.json();
    },
    enabled: !!selectedStudent?.enrollment && isStudentProfileOpen,
  });

  // Analytics data queries
  const { data: analyticsData } = useQuery<any>({
    queryKey: ["/api/analytics/overview"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/overview");
      return res.json();
    },
    enabled: isAuthenticated && activeTab === "analytics",
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null);

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/announcements/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/announcements"] });
      toast({ title: "Deleted", description: "Announcement deleted." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete announcement.", variant: "destructive" });
    }
  });

  const editAnnouncementMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiRequest("PATCH", `/api/announcements/${payload.id}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/announcements"] });
      setIsEditOpen(false);
      setEditingAnnouncement(null);
      toast({ title: "Updated", description: "Announcement updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update announcement.", variant: "destructive" });
    }
  });

  const { data: eventAnalytics } = useQuery<any>({
    queryKey: ["/api/analytics/events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/events");
      return res.json();
    },
    enabled: isAuthenticated && activeTab === "analytics",
  });

  const { data: studentAnalytics } = useQuery<any>({
    queryKey: ["/api/analytics/students"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/analytics/students");
      return res.json();
    },
    enabled: isAuthenticated && activeTab === "analytics",
  });

  // Admin profile data queries
  const { data: adminDetails } = useQuery<AdminDetails>({
    queryKey: ["/api/admin/club-admin", selectedAdmin?.id],
    queryFn: async () => {
      if (!selectedAdmin?.id) return null;
      const res = await apiRequest("GET", `/api/admin/club-admin/${selectedAdmin.id}`);
      return res.json();
    },
    enabled: !!selectedAdmin?.id && isAdminProfileOpen,
  });

  // Toggle student account status mutation
  const toggleStudentStatusMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/students/${studentId}/toggle-status`);
      return res.json();
    },
    onSuccess: (data) => {
      // Update the students list with the new status
      queryClient.setQueryData(["/api/admin/students"], (oldData: any[]) => {
        return oldData?.map(student =>
          student.id === data.student.id ? { ...student, isDisabled: data.student.isDisabled } : student
        );
      });
      // Update selected student if it's the one being toggled
      if (selectedStudent?.id === data.student.id) {
        setSelectedStudent((prev: any) => prev ? { ...prev, isDisabled: data.student.isDisabled } : null);
      }
      toast({
        title: data.student.isDisabled ? "Account Disabled" : "Account Enabled",
        description: `${data.student.name}'s account has been ${data.student.isDisabled ? "disabled" : "enabled"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update student account status.",
        variant: "destructive",
      });
    },
  });

  // Reset admin password mutation
  const resetAdminPasswordMutation = useMutation({
    mutationFn: async ({ clubId, newPassword }: { clubId: string; newPassword: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/reset-admin-password/${clubId}`, { newPassword });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Admin password has been reset successfully.",
      });
      setIsResetPasswordOpen(false);
      setNewPassword("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reset admin password.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear stored admin session
      localStorage.removeItem("currentAdmin");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/admin/login");
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string; target?: string }) => {
      const res = await apiRequest("POST", "/api/announcements", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Announcement created",
        description: "The announcement has been posted successfully.",
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    },
  });

  const createClubMutation = useMutation({
    mutationFn: async (clubData: { name: string; description: string; category: string }) => {
      const res = await apiRequest("POST", "/api/clubs", clubData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club created",
        description: "The club has been created successfully.",
      });
      setShowCreateClub(false);
      setClubForm({ name: "", description: "", category: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create club.",
        variant: "destructive",
      });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Club> }) => {
      const res = await apiRequest("PATCH", `/api/clubs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club updated",
        description: "The club has been updated successfully.",
      });
      setEditingClub(null);
      setClubForm({ name: "", description: "", category: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club.",
        variant: "destructive",
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      await apiRequest("DELETE", `/api/clubs/${clubId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club deleted",
        description: "The club has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete club.",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      setEditingEvent(null);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "clubs", label: "Clubs Management", icon: Building2 },
    { id: "events", label: "Events Management", icon: Calendar },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  const globalStats = [
    {
      icon: Building2,
      label: "Total Clubs",
      value: clubs.length.toString(),
      trend: "+2 this month",
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: "Total Events",
      value: events.length.toString(),
      trend: "+5 this week",
      color: "text-green-500",
    },
    {
      icon: UserCheck,
      label: "Active Users",
      value: "1,247",
      trend: "+12% growth",
      color: "text-purple-500",
    },
    {
      icon: Activity,
      label: "Platform Activity",
      value: "94%",
      trend: "High engagement",
      color: "text-orange-500",
    },
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Global Statistics */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Global Platform Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {globalStats.map((stat, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Club Activity Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Club Activity Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Active Clubs by Category
                  </h3>
                  <div className="space-y-3">
                    {analyticsData?.distributions?.clubCategories ? (
                      Object.entries(analyticsData.distributions.clubCategories)
                        .sort(([,a], [,b]) => (b as number) - (a as number))
                        .map(([category, count]: [string, any]) => {
                          const total = analyticsData.overview.totalClubs || clubs.length;
                          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={category} className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className="text-sm capitalize">{category}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {percentage}%
                                </Badge>
                              </div>
                              <span className="font-semibold">{count}</span>
                            </div>
                          );
                        })
                    ) : (
                      ["Technology", "Academic", "Arts", "Business", "Social"].map((category) => {
                        const count = clubs.filter(club => club.category === category.toLowerCase()).length;
                        return (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-sm">{category}</span>
                            <span className="font-semibold">{count}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Club Membership Trends
                  </h3>
                  {analyticsData?.membershipTrends && analyticsData.membershipTrends.length > 0 ? (
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.membershipTrends}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="month"
                            fontSize={12}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            fontSize={12}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(value) => [value, 'New Members']}
                            labelFormatter={(label, payload) => {
                              if (payload && payload[0]) {
                                const data = payload[0].payload;
                                return `${label} ${data.year}`;
                              }
                              return label;
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="newMembers"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">No membership data available</p>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Top Performing Clubs
                  </h3>
                  <div className="space-y-3">
                    {(analyticsData?.topClubs || clubs
                      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                      .slice(0, 5)
                    ).map((club: any, index: number) => (
                      <div key={club.id || index} className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{club.name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{club.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{club.memberCount || 0}</p>
                          <p className="text-xs text-muted-foreground">{club.eventCount || 0} events</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Event Analytics */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Event Registrations vs Attendance</h2>
              <Card className="p-6">
                {eventAnalytics?.registrationVsAttendance && eventAnalytics.registrationVsAttendance.length > 0 ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={eventAnalytics.registrationVsAttendance.slice(0, 10)} // Show top 10 events
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="eventTitle"
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          fontSize={12}
                        />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === 'registrations' ? 'Registrations' : 'Attendance'
                          ]}
                          labelFormatter={(label) => `Event: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="registrations" fill="#8884d8" name="Registrations" />
                        <Bar dataKey="attendance" fill="#82ca9d" name="Attendance" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 bg-muted/50 rounded flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No event registration data available</p>
                      <p className="text-xs text-muted-foreground mt-2">Events need registrations to show analytics</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* User Management Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">User Management Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Student Users</h3>
                  <p className="text-3xl font-bold text-blue-500">{studentCount.count || 0}</p>
                  <p className="text-sm text-muted-foreground">Active students</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Club Admins</h3>
                  <p className="text-3xl font-bold text-green-500">6</p>
                  <p className="text-sm text-muted-foreground">Active club administrators</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">System Admins</h3>
                  <p className="text-3xl font-bold text-purple-500">1</p>
                  <p className="text-sm text-muted-foreground">University administrators</p>
                </Card>
              </div>
            </div>

            {/* System-wide Announcements Panel */}
            <div>
              <h2 className="text-2xl font-bold mb-6">System-wide Announcements</h2>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Welcome to GEHU Clubs Platform</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        The new clubs management system is now live. All club administrators have been notified.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Event Registration Milestone</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Congratulations! We've reached 1000+ event registrations this semester.
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">1 day ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "clubs":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Clubs Management</h2>
              <Button onClick={() => setShowCreateClub(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Club
              </Button>
            </div>

            {/* Create/Edit Club Modal */}
            {(showCreateClub || editingClub) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingClub ? "Edit Club" : "Create New Club"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingClub) {
                      updateClubMutation.mutate({
                        id: editingClub.id,
                        data: clubForm,
                      });
                    } else {
                      createClubMutation.mutate(clubForm);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
                      value={clubForm.name}
                      onChange={(e) => setClubForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter club name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubCategory">Category</Label>
                    <Input
                      id="clubCategory"
                      value={clubForm.category}
                      onChange={(e) => setClubForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Technical, Cultural, Sports"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubDescription">Description</Label>
                    <Textarea
                      id="clubDescription"
                      value={clubForm.description}
                      onChange={(e) => setClubForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the club and its activities"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createClubMutation.isPending || updateClubMutation.isPending}
                    >
                      {editingClub ? "Update Club" : "Create Club"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateClub(false);
                        setEditingClub(null);
                        setClubForm({ name: "", description: "", category: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Clubs List */}
            <div className="grid gap-4">
              {clubs.map((club) => (
                <Card key={club.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{club.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {club.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">{club.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Members: {club.memberCount || 0}</span>
                        <span>Events: {events.filter(e => e.clubId === club.id).length}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingClub(club);
                          setClubForm({
                            name: club.name,
                            description: club.description || "",
                            category: club.category || "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${club.name}"?`)) {
                            deleteClubMutation.mutate(club.id);
                          }
                        }}
                        disabled={deleteClubMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {clubs.length === 0 && (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No clubs found. Create your first club to get started.</p>
              </Card>
            )}
          </div>
        );

      case "events":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Events Management</h2>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Create/Edit Event Modal */}
            {(showCreateEvent || editingEvent) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData();
                    Object.entries(eventForm).forEach(([key, value]) => {
                      if (value) formData.append(key, value);
                    });

                    if (editingEvent) {
                      updateEventMutation.mutate({
                        id: editingEvent.id,
                        data: eventForm,
                      });
                    } else {
                      createEventMutation.mutate(formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventTitle">Event Title</Label>
                      <Input
                        id="eventTitle"
                        value={eventForm.title}
                        onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventCategory">Category</Label>
                      <Input
                        id="eventCategory"
                        value={eventForm.category}
                        onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Technical, Cultural"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="eventDescription">Description</Label>
                    <Textarea
                      id="eventDescription"
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the event"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="eventDate">Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime">Time</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventLocation">Location</Label>
                      <Input
                        id="eventLocation"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Event location"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="eventClub">Club</Label>
                    <select
                      id="eventClub"
                      value={eventForm.clubId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, clubId: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="">Select a club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createEventMutation.isPending || updateEventMutation.isPending}
                    >
                      {editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateEvent(false);
                        setEditingEvent(null);
                        setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Events List */}
            <div className="grid gap-4">
              {events.map((event) => {
                const club = clubs.find(c => c.id === event.clubId);
                return (
                  <Card key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                            {event.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          <span>🕐 {event.time}</span>
                          <span>📍 {event.location}</span>
                          <span>🏛️ {club?.name || 'Unknown Club'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setEventForm({
                              title: event.title,
                              description: event.description || "",
                              date: event.date,
                              time: event.time,
                              location: event.location,
                              category: event.category || "",
                              clubId: event.clubId,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
                              deleteEventMutation.mutate(event.id);
                            }
                          }}
                          disabled={deleteEventMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {events.length === 0 && (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No events found. Create your first event to get started.</p>
              </Card>
            )}
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Total Students</h3>
                <p className="text-3xl font-bold text-blue-500">{studentCount.count || 0}</p>
                <p className="text-sm text-muted-foreground">Registered students</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Club Administrators</h3>
                <p className="text-3xl font-bold text-green-500">{clubs.length}</p>
                <p className="text-sm text-muted-foreground">Active club admins</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">System Administrators</h3>
                <p className="text-3xl font-bold text-purple-500">1</p>
                <p className="text-sm text-muted-foreground">University admins</p>
              </Card>
            </div>

            {/* Students Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Students</h3>
              <div className="grid gap-4">
                {students.length === 0 ? (
                  <Card className="p-6">
                    <p className="text-muted-foreground text-center">No students found.</p>
                  </Card>
                ) : (
                  students.map((s) => (
                    <Card key={s.id || s._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{s.name}</h4>
                            {s.isDisabled && (
                              <Badge variant="destructive" className="text-xs">
                                Disabled
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{s.email}</p>
                          <p className="text-xs text-muted-foreground mt-1">Enrollment: {s.enrollment}</p>
                          <p className="text-xs text-muted-foreground">Branch: {s.branch}</p>
                          <p className="text-xs text-muted-foreground mt-1">{s.lastLogin ? `Last active: ${new Date(s.lastLogin).toLocaleString()}` : "Last active: —"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedStudent(s);
                              setIsStudentProfileOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant={s.isDisabled ? "default" : "destructive"}
                            size="sm"
                            onClick={() => toggleStudentStatusMutation.mutate(s.id)}
                            disabled={toggleStudentStatusMutation.isPending}
                          >
                            {s.isDisabled ? "Enable" : "Disable"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* Club Admins Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Club Administrators</h3>
              <div className="grid gap-4">
                {clubs.map((club) => (
                  <Card key={club.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{club.name}</h4>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Members: {club.memberCount || 0} | Events: {events.filter(e => e.clubId === club.id).length}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(club);
                            setIsAdminProfileOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Admin
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAdmin(club);
                            setIsResetPasswordOpen(true);
                          }}
                        >
                          <KeyRound className="w-4 h-4 mr-2" />
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {clubs.length === 0 && (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No clubs found.</p>
                </Card>
              )}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+12%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Clubs</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalClubs || clubs.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+25%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Events</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalEvents || events.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+18%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Students</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalStudents || studentCount.count || 0}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+8%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Active Clubs</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.activeClubs || clubs.filter(c => c.memberCount > 0).length}</p>
              </Card>
            </div>

            {/* Charts and Detailed Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Club Distribution by Category */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Clubs by Category
                </h3>
                <div className="space-y-4">
                  {analyticsData?.distributions?.clubCategories ? (
                    Object.entries(analyticsData.distributions.clubCategories).map(([category, count]: [string, any]) => {
                      const total = analyticsData.overview.totalClubs || clubs.length;
                      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium capitalize">{category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    ["Technology", "Academic", "Arts", "Business", "Social", "Sports"].map((category) => {
                      const count = clubs.filter(club => club.category?.toLowerCase() === category.toLowerCase()).length;
                      const percentage = clubs.length > 0 ? Math.round((count / clubs.length) * 100) : 0;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <span className="text-sm font-medium">{category}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Event Status Distribution */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Event Status Overview
                </h3>
                <div className="space-y-4">
                  {eventAnalytics?.statusBreakdown ? (
                    [
                      { label: "Upcoming Events", count: eventAnalytics.statusBreakdown.upcoming, color: "bg-green-500" },
                      { label: "Past Events", count: eventAnalytics.statusBreakdown.past, color: "bg-blue-500" },
                    ].map((item) => {
                      const total = (eventAnalytics.statusBreakdown.upcoming || 0) + (eventAnalytics.statusBreakdown.past || 0);
                      const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
                      return (
                        <div key={item.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    [
                      { label: "Upcoming Events", count: events.filter(e => new Date(e.date) > new Date()).length, color: "bg-green-500" },
                      { label: "Past Events", count: events.filter(e => new Date(e.date) <= new Date()).length, color: "bg-blue-500" },
                    ].map((item) => {
                      const percentage = events.length > 0 ? Math.round((item.count / events.length) * 100) : 0;
                      return (
                        <div key={item.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                            <span className="text-sm font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-muted rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${item.color}`}
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-8 text-right">{item.count}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Top Performing Clubs */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Top Performing Clubs
                </h3>
                <div className="space-y-3">
                  {(analyticsData?.topClubs || clubs
                    .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                    .slice(0, 5)).map((club: any, index: number) => (
                      <div key={club.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{club.name}</p>
                            <p className="text-xs text-muted-foreground">{club.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{club.memberCount || 0}</p>
                          <p className="text-xs text-muted-foreground">members</p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>

              {/* Event Categories */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Event Categories
                </h3>
                <div className="space-y-3">
                  {analyticsData?.distributions?.eventCategories ? (
                    Object.entries(analyticsData.distributions.eventCategories).map(([category, count]: [string, any]) => {
                      const total = analyticsData.overview.totalEvents || events.length;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm capitalize">{category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${total > 0 ? Math.round((count / total) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-6 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    ["Workshop", "Seminar", "Competition", "Cultural", "Sports", "Meeting"].map((category) => {
                      const count = events.filter(event => event.category?.toLowerCase() === category.toLowerCase()).length;
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <span className="text-sm">{category}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${events.length > 0 ? Math.round((count / events.length) * 100) : 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-semibold w-6 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Monthly Trends */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Monthly Activity Trends
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">
                    {analyticsData?.trends?.eventsThisMonth || events.filter(e => {
                      const eventDate = new Date(e.date);
                      const now = new Date();
                      return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Events This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">
                    {analyticsData?.overview?.activeClubs || clubs.filter(c => (c.memberCount || 0) > 10).length}
                  </p>
                  <p className="text-sm text-muted-foreground">High-Activity Clubs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-500">
                    {analyticsData?.trends?.studentEngagement ? `${analyticsData.trends.studentEngagement} events/student` :
                      `${studentCount.count > 0 ? Math.round((events.length / studentCount.count) * 100) / 100 : 0} events/student`}
                  </p>
                  <p className="text-sm text-muted-foreground">Student Engagement</p>
                </div>
              </div>
            </Card>

            {/* Data Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Platform Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Club Coverage</span>
                    <span className="text-sm font-semibold">
                      {analyticsData?.trends?.clubCoverage ? `${analyticsData.trends.clubCoverage}%` :
                        `${clubs.length > 0 ? Math.round((clubs.filter(c => c.memberCount > 0).length / clubs.length) * 100) : 0}%`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Event Diversity</span>
                    <span className="text-sm font-semibold">
                      {analyticsData?.trends?.eventDiversity || new Set(events.map(e => e.category)).size} categories
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Student Engagement</span>
                    <span className="text-sm font-semibold">
                      {analyticsData?.trends?.studentEngagement || (studentCount.count > 0 ? Math.round((events.length / studentCount.count) * 100) / 100 : 0)} events/student
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">New club registered</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Event registration milestone</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Student count increased</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "announcements":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Announcements</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Create New Announcement</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createAnnouncementMutation.mutate({
                      title: announcementTitle,
                      content: announcementContent,
                      target: targetForAnnouncement || "all",
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="target">Target</Label>
                    <select
                      id="target"
                      className="w-full rounded-md border border-border bg-input text-foreground px-2 py-2"
                      value={targetForAnnouncement}
                      onChange={(e) => setTargetForAnnouncement(e.target.value)}
                    >
                      <option value="all">All Students</option>
                      {clubs.map((c) => (
                        <option key={c.id} value={c.id}>{`Club: ${c.name}`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Announcement content"
                      rows={4}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createAnnouncementMutation.isPending}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </form>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Announcements</h3>
                <div className="space-y-4">
                  {announcements.length === 0 ? (
                    <div className="p-4 border rounded-lg text-center text-muted-foreground">No announcements yet.</div>
                  ) : (
                    announcements.map((a: any) => (
                      <div key={a.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{a.title} {a.pinned && <Badge variant="secondary">Pinned</Badge>}</h4>
                            <p className="text-sm text-muted-foreground mt-2">{a.content}</p>
                            <p className="text-xs text-muted-foreground mt-2">{a.createdAt ? new Date(a.createdAt).toLocaleString() : ''}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {admin && (
                              <>
                                <Button size="sm" variant="outline" onClick={() => { setEditingAnnouncement(a); setIsEditOpen(true); }}>
                                  Edit
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this announcement?')) deleteAnnouncementMutation.mutate(a.id); }} disabled={deleteAnnouncementMutation.isPending}>
                                  Delete
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { editAnnouncementMutation.mutate({ id: a.id, pinned: !a.pinned }); }}>
                                  {a.pinned ? 'Unpin' : 'Pin'}
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {/* Edit Announcement Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Edit Announcement</DialogTitle>
                    </DialogHeader>
                    {editingAnnouncement && (
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget as HTMLFormElement;
                        const title = (form.elements.namedItem('editTitle') as HTMLInputElement).value;
                        const content = (form.elements.namedItem('editContent') as HTMLTextAreaElement).value;
                        const target = (form.elements.namedItem('editTarget') as HTMLSelectElement).value;
                        editAnnouncementMutation.mutate({ id: editingAnnouncement.id, title, content, target });
                      }} className="space-y-4 p-2">
                        <div>
                          <Label>Title</Label>
                          <Input name="editTitle" defaultValue={editingAnnouncement.title} />
                        </div>
                        <div>
                          <Label>Target</Label>
                          <select name="editTarget" className="w-full rounded-md border border-border bg-input text-foreground px-2 py-2" defaultValue={editingAnnouncement.target || 'all'}>
                            <option value="all">All Students</option>
                            {clubs.map(c => <option key={c.id} value={c.id}>{`Club: ${c.name}`}</option>)}
                          </select>
                        </div>
                        <div>
                          <Label>Content</Label>
                          <Textarea name="editContent" defaultValue={editingAnnouncement.content} rows={6} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button type="button" variant="outline" onClick={() => { setIsEditOpen(false); setEditingAnnouncement(null); }}>Cancel</Button>
                          <Button type="submit">Save</Button>
                        </div>
                      </form>
                    )}
                  </DialogContent>
                </Dialog>
              </Card>
            </div>
          </div>
          
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-8">University Admin</h1>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {renderMainContent()}
        </div>
      </div>

      {/* Student Profile Modal */}
      <Dialog open={isStudentProfileOpen} onOpenChange={setIsStudentProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-foreground">{selectedStudent.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-foreground">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrollment Number</Label>
                    <p className="text-foreground">{selectedStudent.enrollment}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Branch</Label>
                    <p className="text-foreground">{selectedStudent.branch}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Active</Label>
                    <p className="text-foreground">
                      {selectedStudent.lastLogin ? new Date(selectedStudent.lastLogin).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Created</Label>
                    <p className="text-foreground">
                      {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Account Status */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Account Status</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={selectedStudent.isDisabled ? "destructive" : "default"}>
                        {selectedStudent.isDisabled ? "Disabled" : "Active"}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant={selectedStudent.isDisabled ? "default" : "destructive"}
                    size="sm"
                    onClick={() => toggleStudentStatusMutation.mutate(selectedStudent.id)}
                    disabled={toggleStudentStatusMutation.isPending}
                  >
                    {selectedStudent.isDisabled ? "Enable Account" : "Disable Account"}
                  </Button>
                </div>
              </Card>

              {/* Club Memberships */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Club Memberships ({studentMemberships.length})</h3>
                {studentMemberships.length === 0 ? (
                  <p className="text-muted-foreground">No club memberships found.</p>
                ) : (
                  <div className="space-y-3">
                    {studentMemberships.map((membership: any) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{membership.clubName}</h4>
                          <p className="text-sm text-muted-foreground">Status: {membership.status}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{membership.department}</p>
                          <p className="text-xs text-muted-foreground">{membership.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Event Registrations */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Event Registrations ({studentRegistrations.length})</h3>
                {studentRegistrations.length === 0 ? (
                  <p className="text-muted-foreground">No event registrations found.</p>
                ) : (
                  <div className="space-y-3">
                    {studentRegistrations.map((registration: any) => (
                      <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{registration.eventTitle}</h4>
                          <p className="text-sm text-muted-foreground">{registration.clubName}</p>
                          <p className="text-xs text-muted-foreground">
                            Date: {new Date(registration.eventDate).toLocaleDateString()} at {registration.eventTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{registration.location}</p>
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Profile Modal */}
      <Dialog open={isAdminProfileOpen} onOpenChange={setIsAdminProfileOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Club Administrator Details</DialogTitle>
          </DialogHeader>
          {selectedAdmin && adminDetails && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Administrator Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Username</Label>
                    <p className="text-foreground">{adminDetails.username}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    <p className="text-foreground">{adminDetails.fullName || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p className="text-foreground">{adminDetails.email || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p className="text-foreground">{adminDetails.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Club</Label>
                    <p className="text-foreground">{selectedAdmin.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Role</Label>
                    <Badge variant="secondary">{adminDetails.role}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Status</Label>
                    <Badge variant={adminDetails.isActive ? "default" : "destructive"}>
                      {adminDetails.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Login</Label>
                    <p className="text-foreground">
                      {adminDetails.lastLogin ? new Date(adminDetails.lastLogin).toLocaleString() : "Never"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Account Created</Label>
                    <p className="text-foreground">
                      {adminDetails.createdAt ? new Date(adminDetails.createdAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Last Updated</Label>
                    <p className="text-foreground">
                      {adminDetails.updatedAt ? new Date(adminDetails.updatedAt).toLocaleDateString() : "Unknown"}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Permissions */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${adminDetails.permissions?.canCreateEvents ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Create Events</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${adminDetails.permissions?.canManageMembers ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Manage Members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${adminDetails.permissions?.canEditClub ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">Edit Club</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${adminDetails.permissions?.canViewAnalytics ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm">View Analytics</span>
                  </div>
                </div>
              </Card>

              {/* Activity Statistics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Activity Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-500">{adminDetails.statistics?.totalEvents || 0}</p>
                    <p className="text-sm text-muted-foreground">Total Events Created</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-500">{adminDetails.statistics?.totalMembers || 0}</p>
                    <p className="text-sm text-muted-foreground">Members Managed</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-500">
                      {adminDetails.statistics?.recentEvents?.filter(e => e.status === 'upcoming').length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Upcoming Events</p>
                  </div>
                </div>
              </Card>

              {/* Recent Events */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Events</h3>
                {adminDetails.statistics?.recentEvents?.length > 0 ? (
                  <div className="space-y-3">
                    {adminDetails.statistics.recentEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={event.status === 'upcoming' ? 'default' : 'secondary'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No events found.</p>
                )}
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Modal */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Admin Password</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Reset password for <strong>{selectedAdmin.name}</strong> administrator.
                The new password will be set immediately.
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsResetPasswordOpen(false);
                    setNewPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => resetAdminPasswordMutation.mutate({
                    clubId: selectedAdmin.id,
                    newPassword
                  })}
                  disabled={resetAdminPasswordMutation.isPending || newPassword.length < 6}
                >
                  {resetAdminPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
