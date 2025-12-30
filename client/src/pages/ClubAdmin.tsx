import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import EditEventForm from "@/components/EditEventForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Image, Users, Settings, Edit, Bell, MapPin, UserCheck, CheckCircle, Clock, TrendingUp, Activity, Award, AlertCircle, CheckSquare, Mail, Download, UserPlus, Filter, Eye, Trash2, Crown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";
import type { ClubMembership } from "@shared/schema";
import type { Achievement } from "@shared/schema";
import type { ClubLeadership } from "@shared/schema";
import type { StudentPoints } from "@shared/schema";
import type { Message } from "@shared/schema";

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

export default function ClubAdmin() {
  const [, setLocation] = useLocation();
  const [memberFilter, setMemberFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [memberSearch, setMemberSearch] = useState('');
  const [eventSearch, setEventSearch] = useState('');
  const [eventFilter, setEventFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [editingClub, setEditingClub] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showMemberDetails, setShowMemberDetails] = useState<string | null>(null);
  const [showLeadershipModal, setShowLeadershipModal] = useState(false);
  const [selectedLeadershipMember, setSelectedLeadershipMember] = useState<string | null>(null);
  const [leadershipRole, setLeadershipRole] = useState<string>("");
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [creatingAchievement, setCreatingAchievement] = useState(false);
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [selectedStudentForPoints, setSelectedStudentForPoints] = useState<ClubMembership | null>(null);
  const [pointsToAward, setPointsToAward] = useState<number>(0);
  const [pointsReason, setPointsReason] = useState<string>("");
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // Predefined club categories
  const clubCategories = [
    "Academic",
    "Arts",
    "Business",
    "Technology",
    "Sports",
    "Social",
    "Cultural",
    "Environmental",
    "Health",
    "Music",
    "Dance",
    "Literature",
    "Science",
    "Engineering",
    "Other"
  ];

  // Achievement categories
  const achievementCategories = [
    "Competition Win",
    "Award",
    "Event Success",
    "Project Completion",
    "Recognition",
    "Milestone",
    "Collaboration",
    "Innovation",
    "Community Service",
    "Other"
  ];

  const { data: club, isLoading: clubLoading, error: clubError } = useQuery<Club | null>({
    queryKey: ["/api/clubs", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return null;
      // Try API first, fallback to static data
      try {
        const res = await apiRequest("GET", `/api/clubs/${admin.clubId}`);
        return res.json();
      } catch (error) {
        return staticClubs.find(c => c.id === admin?.clubId) || null;
      }
    },
    enabled: !!admin?.clubId && isAuthenticated,
    initialData: staticClubs.find(c => c.id === admin?.clubId) || null,
    staleTime: Infinity,
  });

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

  const { data: memberships = [] } = useQuery<ClubMembership[]>({
    queryKey: ["/api/admin/club-memberships", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/club-memberships/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  // Filter events for this club
  const clubEvents = events.filter(event => event.clubId === admin?.clubId);

  const { data: eventRegistrations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/event-registrations", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/event-registrations/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/announcements");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/admin/achievements", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/achievements/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const { data: leadership = [] } = useQuery<ClubLeadership[]>({
    queryKey: ["/api/club-leadership", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/club-leadership/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const { data: studentPoints = [] } = useQuery<StudentPoints[]>({
    queryKey: ["/api/admin/student-points", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/student-points/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const { data: globalLeaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/global-points-leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/global-points-leaderboard");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/clubs", admin?.clubId, "messages"],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/clubs/${admin.clubId}/messages`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const handleLogoFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setSelectedLogoFile(null);
    setLogoPreview(null);
  };

  // Bulk actions for members
  const handleBulkApprove = () => {
    selectedMembers.forEach(memberId => {
      updateMembershipStatusMutation.mutate({
        membershipId: memberId,
        status: 'approved'
      });
    });
    setSelectedMembers([]);
  };

  const handleBulkReject = () => {
    selectedMembers.forEach(memberId => {
      updateMembershipStatusMutation.mutate({
        membershipId: memberId,
        status: 'rejected'
      });
    });
    setSelectedMembers([]);
  };

  const handleSelectMember = (memberId: string, checked: boolean) => {
    if (checked) {
      setSelectedMembers(prev => [...prev, memberId]);
    } else {
      setSelectedMembers(prev => prev.filter(id => id !== memberId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingMemberIds = memberships
        .filter(m => m.status === 'pending')
        .map(m => m.id);
      setSelectedMembers(pendingMemberIds);
    } else {
      setSelectedMembers([]);
    }
  };

  // Export members data
  const exportMembers = () => {
    const csvData = memberships.map(member => ({
      Name: member.studentName,
      Email: member.studentEmail,
      Enrollment: member.enrollmentNumber,
      Department: member.department,
      Status: member.status,
      'Join Date': new Date(member.joinedAt).toLocaleDateString(),
      Reason: member.reason
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${club?.name || 'Club'}_Members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const updateMembershipStatusMutation = useMutation({
    mutationFn: async ({ membershipId, status }: { membershipId: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/club-memberships/${membershipId}`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/club-memberships", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", admin?.clubId] });
      toast({
        title: "Status updated",
        description: "Membership status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update membership status.",
        variant: "destructive",
      });
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ registrationId, attended, studentData }: { registrationId: string; attended: boolean; studentData?: any }) => {
      const res = await apiRequest("PATCH", `/api/admin/event-registrations/${registrationId}/attendance`, { attended });
      const registration = await res.json();

      // If marking as attended, award points
      if (attended && studentData && admin?.clubId) {
        try {
          await apiRequest("POST", "/api/admin/student-points/award-attendance", {
            clubId: admin.clubId,
            studentId: studentData.studentId || registration.studentEmail, // fallback to email as ID
            studentName: studentData.studentName || registration.studentName,
            studentEmail: studentData.studentEmail || registration.studentEmail,
            enrollmentNumber: studentData.enrollmentNumber || registration.enrollmentNumber,
            eventId: registration.eventId
          });
        } catch (error) {
          console.error("Failed to award attendance points:", error);
        }
      }

      return registration;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-points", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-points-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/events"] });
      toast({
        title: "Attendance updated",
        description: variables.attended
          ? "Attendance marked as present and points awarded!"
          : "Attendance marked as absent.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update attendance status.",
        variant: "destructive",
      });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      await apiRequest("DELETE", `/api/admin/club-memberships/${membershipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/club-memberships", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", admin?.clubId] });
      toast({
        title: "Member removed",
        description: "The member has been successfully removed from the club.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to remove member from club.",
        variant: "destructive",
      });
    },
  });

  const createAchievementMutation = useMutation({
    mutationFn: async (data: { achievementData: Partial<Achievement>; imageFile: File }) => {
      const formData = new FormData();
      formData.append("image", data.imageFile);
      Object.entries(data.achievementData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, value.toString());
        }
      });

      const res = await apiRequest("POST", "/api/admin/achievements", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements", admin?.clubId] });
      setCreatingAchievement(false);
      toast({
        title: "Achievement added",
        description: "The achievement has been successfully added to your community showcase.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to add achievement.",
        variant: "destructive",
      });
    },
  });

  const deleteAchievementMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      await apiRequest("DELETE", `/api/admin/achievements/${achievementId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/achievements", admin?.clubId] });
      toast({
        title: "Achievement removed",
        description: "The achievement has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to remove achievement.",
        variant: "destructive",
      });
    },
  });

  const createLeadershipMutation = useMutation({
    mutationFn: async (data: { studentId: string; studentName: string; studentEmail: string; phoneNumber: string; role: string }) => {
      const res = await apiRequest("POST", "/api/admin/club-leadership", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club-leadership", admin?.clubId] });
      setShowLeadershipModal(false);
      setSelectedLeadershipMember(null);
      setLeadershipRole("");
      toast({
        title: "Leadership assigned",
        description: "Leadership role has been assigned successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Assignment failed",
        description: "Failed to assign leadership role.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadershipMutation = useMutation({
    mutationFn: async (leadershipId: string) => {
      await apiRequest("DELETE", `/api/admin/club-leadership/${leadershipId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/club-leadership", admin?.clubId] });
      toast({
        title: "Leadership removed",
        description: "Leadership role has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to remove leadership role.",
        variant: "destructive",
      });
    },
  });

  const awardPointsMutation = useMutation({
    mutationFn: async (data: { enrollmentNumber: string; points: number; reason: string; badges: string[]; skills: string[] }) => {
      const student = memberships.find(m => m.enrollmentNumber === data.enrollmentNumber);
      if (!student) throw new Error("Student not found in memberships");
      if (!admin?.clubId) throw new Error("Admin club ID not found");

      console.log("Awarding points:", {
        clubId: admin.clubId,
        studentId: data.enrollmentNumber,
        studentName: student.studentName,
        points: data.points,
        badges: data.badges,
        skills: data.skills,
        reason: data.reason,
      });

      return await apiRequest("POST", "/api/admin/student-points", {
        clubId: admin.clubId,
        studentId: data.enrollmentNumber, // Use enrollment number as student ID
        studentName: student.studentName,
        studentEmail: student.studentEmail,
        enrollmentNumber: data.enrollmentNumber,
        points: data.points,
        badges: data.badges,
        skills: data.skills,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-points", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-points-leaderboard"] });
      setShowPointsModal(false);
      setSelectedStudentForPoints(null);
      setPointsToAward(0);
      setPointsReason("");
      setSelectedBadges([]);
      setSelectedSkills([]);
      toast({
        title: "Points awarded",
        description: "Points and badges have been awarded successfully.",
      });
    },
    onError: (error) => {
      console.error("Award points error:", error);
      toast({
        title: "Award failed",
        description: error instanceof Error ? error.message : "Failed to award points.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // Add a small delay to allow authentication state to settle
    const timer = setTimeout(() => {
      if (!authLoading && !isAuthenticated) {
        setLocation("/club-admin/login");
      } else if (!authLoading && isAuthenticated && !admin?.clubId) {
        // If admin doesn't have a club, redirect to general dashboard or show message
        setLocation("/dashboard");
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [authLoading, isAuthenticated, admin, setLocation]);

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
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

  const updateClubMutation = useMutation({
    mutationFn: async (data: { clubData: Partial<Club>; logoFile?: File }) => {
      if (!club?.id) throw new Error("No club ID");

      if (data.logoFile) {
        // Upload logo first
        const logoFormData = new FormData();
        logoFormData.append("file", data.logoFile);
        logoFormData.append("type", "club-logo");

        const logoResponse = await apiRequest("POST", "/api/upload", logoFormData);
        const logoResult = await logoResponse.json();

        // Update club with new logo URL
        return await apiRequest("PATCH", `/api/clubs/${club.id}`, {
          ...data.clubData,
          logoUrl: logoResult.url,
        });
      } else {
        // Update club without logo
        return await apiRequest("PATCH", `/api/clubs/${club.id}`, data.clubData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", admin?.clubId] });
      setEditingClub(false);
      setSelectedLogoFile(null);
      setLogoPreview(null);
      toast({
        title: "Club updated",
        description: "Club information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear stored admin session
      localStorage.removeItem("currentAdmin");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/club-admin/login");
    },
  });

  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await apiRequest("PUT", `/api/messages/${messageId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", admin?.clubId, "messages"] });
    },
  });

  if (authLoading || clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">
            Error loading club information.
          </p>
          <p className="text-sm text-muted-foreground">
            Club ID: {admin?.clubId}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">
            Club not found or access denied.
          </p>
          <p className="text-sm text-muted-foreground">
            Club ID: {admin?.clubId}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact administrator.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Calendar,
      label: "Total Events",
      value: clubEvents.length.toString(),
      trend: `${clubEvents.filter(e => new Date(e.date || new Date()) > new Date()).length} upcoming`,
      color: "text-blue-600",
    },
    {
      icon: Users,
      label: "Active Members",
      value: club.memberCount?.toString() || "0",
      trend: `${memberships.filter(m => m.status === 'approved').length} approved`,
      color: "text-green-600",
    },
    {
      icon: Bell,
      label: "Event Registrations",
      value: eventRegistrations.length.toString(),
      trend: `${eventRegistrations.filter(r => r.attended).length} attended`,
      color: "text-purple-600",
    },
  ];

  // Calculate club health score
  const calculateHealthScore = () => {
    let score = 0;
    const maxScore = 100;

    // Events factor (30 points)
    if (clubEvents.length >= 5) score += 30;
    else if (clubEvents.length >= 2) score += 20;
    else if (clubEvents.length >= 1) score += 10;

    // Members factor (25 points)
    const memberCount = club.memberCount || 0;
    if (memberCount >= 50) score += 25;
    else if (memberCount >= 25) score += 20;
    else if (memberCount >= 10) score += 15;
    else if (memberCount >= 5) score += 10;

    // Attendance factor (25 points)
    const totalRegistrations = eventRegistrations.length;
    const attendedCount = eventRegistrations.filter(r => r.attended).length;
    const attendanceRate = totalRegistrations > 0 ? (attendedCount / totalRegistrations) * 100 : 0;
    if (attendanceRate >= 80) score += 25;
    else if (attendanceRate >= 60) score += 20;
    else if (attendanceRate >= 40) score += 15;
    else if (attendanceRate >= 20) score += 10;

    // Recent activity factor (20 points)
    const recentEvents = clubEvents.filter(e => {
      const eventDate = new Date(e.date || new Date());
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return eventDate >= weekAgo;
    });
    if (recentEvents.length >= 2) score += 20;
    else if (recentEvents.length >= 1) score += 15;
    else if (clubEvents.length > 0) score += 10;

    return Math.min(score, maxScore);
  };

  const healthScore = calculateHealthScore();
  const healthStatus = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Attention";

  return (
    <div className="min-h-screen py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {club.logoUrl && (
              <img
                src={club.logoUrl}
                alt={`${club.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {club.name} Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage your club's events, content, and settings
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: <span className="font-medium">{admin?.username}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className={`text-xs mt-1 ${stat.color}`}>
                    {stat.trend}
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        {/* Club Health & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Club Health Score */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Club Health Score
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{healthScore}/100</span>
                <Badge variant={healthScore >= 60 ? "default" : "secondary"}>
                  {healthStatus}
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    healthScore >= 80 ? 'bg-green-500' :
                    healthScore >= 60 ? 'bg-yellow-500' :
                    healthScore >= 40 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                ></div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Events</p>
                  <p className="font-medium">{clubEvents.length} total</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Attendance Rate</p>
                  <p className="font-medium">
                    {eventRegistrations.length > 0
                      ? Math.round((eventRegistrations.filter(r => r.attended).length / eventRegistrations.length) * 100)
                      : 0
                    }%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => setCreatingEvent(true)}
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                variant="outline"
              >
                <Calendar className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">Create Event</span>
              </Button>
              <Button
                onClick={() => {
                  setActiveTab("settings");
                  setEditingClub(true);
                }}
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                variant="outline"
              >
                <Edit className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Edit Club</span>
              </Button>
              <Button
                onClick={() => setActiveTab("members")}
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                variant="outline"
              >
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Manage Members</span>
              </Button>
              <Button
                onClick={() => setActiveTab("attendance")}
                className="h-auto p-4 flex flex-col items-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                variant="outline"
              >
                <CheckSquare className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium">Track Attendance</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="p-6 mb-8">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {clubEvents
              .sort((a, b) => new Date(b.createdAt || new Date()).getTime() - new Date(a.createdAt || new Date()).getTime())
              .slice(0, 3)
              .map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(event.date || new Date()).toLocaleDateString()} • {eventRegistrations.filter(r => r.eventId === event.id).length} registrations
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {new Date(event.date || new Date()) > new Date() ? 'Upcoming' : 'Past'}
                  </Badge>
                </div>
              ))}
            {clubEvents.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No events yet. Create your first event to get started!
              </p>
            )}
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="leadership">Leadership</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Events */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events
                </h3>
                <div className="space-y-3">
                  {clubEvents
                    .filter(event => new Date(event.date || new Date()) > new Date())
                    .sort((a, b) => new Date(a.date || new Date()).getTime() - new Date(b.date || new Date()).getTime())
                    .slice(0, 3)
                    .map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.date || new Date()).toLocaleDateString()} at {event.time}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {eventRegistrations.filter(r => r.eventId === event.id).length} registered
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingEventId(event.id)}
                        >
                          Edit
                        </Button>
                      </div>
                    ))}
                  {clubEvents.filter(event => new Date(event.date || new Date()) > new Date()).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No upcoming events. Create one to engage your members!
                    </p>
                  )}
                </div>
              </Card>

              {/* Pending Membership Requests */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Membership Requests
                </h3>
                <div className="space-y-3">
                  {memberships
                    .filter(m => m.status === 'pending')
                    .slice(0, 3)
                    .map((membership) => (
                      <div key={membership.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{membership.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {membership.enrollmentNumber} • {membership.department}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {new Date(membership.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => updateMembershipStatusMutation.mutate({
                              membershipId: membership.id,
                              status: 'approved'
                            })}
                            disabled={updateMembershipStatusMutation.isPending}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateMembershipStatusMutation.mutate({
                              membershipId: membership.id,
                              status: 'rejected'
                            })}
                            disabled={updateMembershipStatusMutation.isPending}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  {memberships.filter(m => m.status === 'pending').length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No pending membership requests.
                    </p>
                  )}
                  {memberships.filter(m => m.status === 'pending').length > 3 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab("members")}
                    >
                      View All Requests ({memberships.filter(m => m.status === 'pending').length})
                    </Button>
                  )}
                </div>
              </Card>
            </div>

            {/* Performance Insights */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Performance Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-blue-600">
                    {eventRegistrations.length > 0
                      ? Math.round((eventRegistrations.filter(r => r.attended).length / eventRegistrations.length) * 100)
                      : 0
                    }%
                  </p>
                  <p className="text-sm text-muted-foreground">Average Attendance Rate</p>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">
                    {clubEvents.filter(e => {
                      const eventDate = new Date(e.date || new Date());
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return eventDate >= monthAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Events This Month</p>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">
                    {memberships.filter(m => {
                      const joinedDate = new Date(m.joinedAt);
                      const monthAgo = new Date();
                      monthAgo.setMonth(monthAgo.getMonth() - 1);
                      return joinedDate >= monthAgo;
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">New Members This Month</p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Manage Events</h2>
              <Button onClick={() => setCreatingEvent(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            {/* Filters and Search */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search events..."
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={eventFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('all')}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    All ({clubEvents.length})
                  </Button>
                  <Button
                    variant={eventFilter === 'upcoming' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('upcoming')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Upcoming ({clubEvents.filter(e => new Date(e.date || new Date()) > new Date()).length})
                  </Button>
                  <Button
                    variant={eventFilter === 'past' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEventFilter('past')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Past ({clubEvents.filter(e => new Date(e.date || new Date()) <= new Date()).length})
                  </Button>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              {clubEvents
                .filter(event => {
                  // Apply search filter
                  if (eventSearch) {
                    const searchLower = eventSearch.toLowerCase();
                    return event.title.toLowerCase().includes(searchLower) ||
                           event.description?.toLowerCase().includes(searchLower) ||
                           event.location?.toLowerCase().includes(searchLower);
                  }
                  return true;
                })
                .filter(event => {
                  // Apply status filter
                  const eventDate = new Date(event.date || new Date());
                  const now = new Date();
                  switch (eventFilter) {
                    case 'upcoming':
                      return eventDate > now;
                    case 'past':
                      return eventDate <= now;
                    default:
                      return true;
                  }
                })
                .sort((a, b) => {
                  // Sort by date (upcoming first, then by date)
                  const dateA = new Date(a.date || new Date());
                  const dateB = new Date(b.date || new Date());
                  const now = new Date();

                  const aIsUpcoming = dateA > now;
                  const bIsUpcoming = dateB > now;

                  if (aIsUpcoming && !bIsUpcoming) return -1;
                  if (!aIsUpcoming && bIsUpcoming) return 1;

                  return dateA.getTime() - dateB.getTime();
                })
                .map((event) => {
                  const eventRegs = eventRegistrations.filter(r => r.eventId === event.id);
                  const attendedCount = eventRegs.filter(r => r.attended).length;
                  const isUpcoming = new Date(event.date || new Date()) > new Date();

                  return (
                    <Card key={event.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-lg">{event.title}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant={isUpcoming ? "default" : "secondary"}>
                                {isUpcoming ? 'Upcoming' : 'Past'}
                              </Badge>
                              {event.imageUrl && (
                                <Badge variant="outline" className="text-xs">
                                  <Image className="w-3 h-3 mr-1" />
                                  Media
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {new Date(event.date || new Date()).toLocaleDateString()} at {event.time}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <MapPin className="w-4 h-4 inline mr-1" />
                                {event.location}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                <Users className="w-4 h-4 inline mr-1" />
                                {eventRegs.length} registered
                              </p>
                              {!isUpcoming && (
                                <p className="text-sm text-muted-foreground">
                                  <CheckCircle className="w-4 h-4 inline mr-1" />
                                  {attendedCount} attended ({eventRegs.length > 0 ? Math.round((attendedCount / eventRegs.length) * 100) : 0}%)
                                </p>
                              )}
                            </div>
                          </div>
                          {event.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingEventId(event.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(event.id)}
                            disabled={deleteMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              {clubEvents.filter(event => {
                if (eventSearch) {
                  const searchLower = eventSearch.toLowerCase();
                  return event.title.toLowerCase().includes(searchLower) ||
                         event.description?.toLowerCase().includes(searchLower) ||
                         event.location?.toLowerCase().includes(searchLower);
                }
                return true;
              }).filter(event => {
                const eventDate = new Date(event.date || new Date());
                const now = new Date();
                switch (eventFilter) {
                  case 'upcoming':
                    return eventDate > now;
                  case 'past':
                    return eventDate <= now;
                  default:
                    return true;
                }
              }).length === 0 && (
                <Card className="p-8 text-center">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {eventSearch ? 'No events match your search.' : 'No events found for the selected filter.'}
                  </p>
                  {!eventSearch && (
                    <Button
                      className="mt-4"
                      onClick={() => setCreatingEvent(true)}
                    >
                      Create Your First Event
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Event Attendance Management</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Points awarded per attendance: <Badge variant="secondary">10</Badge>
                </div>
              </div>
            </div>

            {/* Points and Badges Leaderboard */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Global Points & Badges Leaderboard
              </h3>
              {globalLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {globalLeaderboard.slice(0, 10).map((student, index) => (
                    <div key={student.studentEmail} className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.enrollmentNumber} • {student.totalPoints} total points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.badges?.map((badge: string, badgeIndex: number) => (
                          <Badge key={badgeIndex} variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                        {(!student.badges || student.badges.length === 0) && (
                          <span className="text-xs text-muted-foreground">No badges yet</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No students have earned points yet. Points will appear here when students start attending events!
                </p>
              )}
            </Card>

            <div className="space-y-4">
              {clubEvents.map((event) => {
                const eventRegs = eventRegistrations.filter(r => r.eventId === event.id);
                return (
                  <Card key={event.id} className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()} at {event.time}
                        </p>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                      </div>
                      <Badge variant="secondary">
                        {eventRegs.length} registered
                      </Badge>
                    </div>

                    {eventRegs.length > 0 ? (
                      <div className="space-y-2">
                        {eventRegs.map((registration) => {
                          const studentGlobalData = globalLeaderboard.find(sp => sp.studentEmail === registration.studentEmail);
                          return (
                            <div key={registration.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{registration.studentName}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {registration.enrollmentNumber} • {registration.department}
                                    </p>
                                  </div>
                                  {studentGlobalData && (
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {studentGlobalData.totalPoints} total pts
                                      </Badge>
                                      {studentGlobalData.badges?.slice(0, 2).map((badge: string, badgeIndex: number) => (
                                        <Badge key={badgeIndex} variant="secondary" className="text-xs">
                                          {badge}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">
                                  {registration.attended ? (
                                    <Badge variant="default" className="bg-green-500">Present (+10 pts)</Badge>
                                  ) : (
                                    <Badge variant="secondary">Not Marked</Badge>
                                  )}
                                </span>
                                <Button
                                  variant={registration.attended ? "destructive" : "default"}
                                  size="sm"
                                  onClick={() => updateAttendanceMutation.mutate({
                                    registrationId: registration.id,
                                    attended: !registration.attended,
                                    studentData: {
                                      studentId: registration.studentEmail, // Use email as unique ID
                                      studentName: registration.studentName,
                                      studentEmail: registration.studentEmail,
                                      enrollmentNumber: registration.enrollmentNumber
                                    }
                                  })}
                                  disabled={updateAttendanceMutation.isPending}
                                >
                                  {registration.attended ? "Mark Absent" : "Mark Present"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No registrations for this event yet
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">University Announcements</h2>
              <Badge variant="secondary">{announcements.length} announcements</Badge>
            </div>

            <div className="space-y-4">
              {announcements.length > 0 ? (
                [...announcements]
                  .sort((a, b) => {
                    // Pinned announcements first
                    if (a.pinned && !b.pinned) return -1;
                    if (!a.pinned && b.pinned) return 1;
                    // Then by date (newest first)
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                  })
                  .map((announcement: any) => (
                  <Card key={announcement.id} className={`p-4 ${announcement.pinned ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${announcement.pinned ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-lg">{announcement.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              By {announcement.authorName} • {(() => {
                                const now = new Date();
                                const announcementDate = new Date(announcement.createdAt);
                                const diffInHours = Math.floor((now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60));

                                if (diffInHours < 24) {
                                  return diffInHours <= 1 ? 'Just now' : `${diffInHours} hours ago`;
                                } else {
                                  const diffInDays = Math.floor(diffInHours / 24);
                                  return diffInDays === 1 ? 'Yesterday' : `${diffInDays} days ago`;
                                }
                              })()}
                            </p>
                          </div>
                          {announcement.pinned && (
                            <Badge variant="default" className="bg-yellow-500">
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {announcement.content}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Target: {announcement.target || 'all'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No announcements available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    University announcements will appear here when posted by administrators.
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="uploads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Media Gallery</h2>
              <Button onClick={() => setCreatingEvent(true)}>
                <Image className="mr-2 h-4 w-4" />
                Upload New Image
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubEvents
                .filter(event => event.imageUrl)
                .map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
            </div>
            {clubEvents.filter(event => event.imageUrl).length === 0 && (
              <Card className="p-8 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No images uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create an event with an image to see it here
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            {/* Header with Statistics and Actions */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Membership Management</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage club memberships, review applications, and communicate with members
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMembers}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                {selectedMembers.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={updateMembershipStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve ({selectedMembers.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleBulkReject}
                      disabled={updateMembershipStatusMutation.isPending}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Reject ({selectedMembers.length})
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{memberships.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{memberships.filter(m => m.status === 'pending').length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{memberships.filter(m => m.status === 'approved').length}</p>
                    <p className="text-sm text-muted-foreground">Approved</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{memberships.filter(m => m.status === 'rejected').length}</p>
                    <p className="text-sm text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Advanced Filters and Search */}
            <Card className="p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      placeholder="Search by name, email, enrollment, or department..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="pl-10"
                    />
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={memberFilter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMemberFilter('all')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    All ({memberships.length})
                  </Button>
                  <Button
                    variant={memberFilter === 'pending' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMemberFilter('pending')}
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending ({memberships.filter(m => m.status === 'pending').length})
                  </Button>
                  <Button
                    variant={memberFilter === 'approved' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMemberFilter('approved')}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approved ({memberships.filter(m => m.status === 'approved').length})
                  </Button>
                  <Button
                    variant={memberFilter === 'rejected' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMemberFilter('rejected')}
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Rejected ({memberships.filter(m => m.status === 'rejected').length})
                  </Button>
                </div>
              </div>

              {/* Bulk Selection for Pending Members */}
              {memberFilter === 'pending' && memberships.filter(m => m.status === 'pending').length > 0 && (
                <div className="mt-4 pt-4 border-t flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="select-all"
                    checked={selectedMembers.length === memberships.filter(m => m.status === 'pending').length && memberships.filter(m => m.status === 'pending').length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select all pending members ({memberships.filter(m => m.status === 'pending').length})
                  </label>
                  {selectedMembers.length > 0 && (
                    <span className="text-sm text-muted-foreground ml-auto">
                      {selectedMembers.length} selected
                    </span>
                  )}
                </div>
              )}
            </Card>

            <div className="space-y-4">
              {memberships
                .filter(membership => {
                  // Apply search filter
                  if (memberSearch) {
                    const searchLower = memberSearch.toLowerCase();
                    return membership.studentName.toLowerCase().includes(searchLower) ||
                           membership.studentEmail.toLowerCase().includes(searchLower) ||
                           membership.enrollmentNumber.toLowerCase().includes(searchLower) ||
                           membership.department.toLowerCase().includes(searchLower);
                  }
                  return true;
                })
                .filter(membership => {
                  // Apply status filter
                  return memberFilter === 'all' || membership.status === memberFilter;
                })
                .sort((a, b) => {
                  // Sort by status (pending first), then by date
                  if (a.status === 'pending' && b.status !== 'pending') return -1;
                  if (a.status !== 'pending' && b.status === 'pending') return 1;
                  return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
                })
                .map((membership) => (
                  <Card key={membership.id} className={`p-4 transition-all hover:shadow-md ${selectedMembers.includes(membership.id) ? 'ring-2 ring-blue-500 bg-blue-50/50' : ''}`}>
                    <div className="flex justify-between items-start">
                      {/* Checkbox for bulk selection (only for pending members) */}
                      {membership.status === 'pending' && (
                        <div className="mr-3 mt-1">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(membership.id)}
                            onChange={(e) => handleSelectMember(membership.id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </div>
                      )}

                      <div className="space-y-3 flex-1">
                        {/* Header with name and status */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {membership.studentName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{membership.studentName}</h3>
                              <p className="text-sm text-muted-foreground">{membership.enrollmentNumber}</p>
                            </div>
                          </div>
                          <Badge variant={
                            membership.status === 'approved' ? 'default' :
                            membership.status === 'rejected' ? 'destructive' : 'secondary'
                          } className="flex items-center gap-1">
                            {membership.status === 'approved' && <CheckCircle className="w-3 h-3" />}
                            {membership.status === 'pending' && <Clock className="w-3 h-3" />}
                            {membership.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                            {membership.status.charAt(0).toUpperCase() + membership.status.slice(1)}
                          </Badge>
                        </div>

                        {/* Member Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Email:</span>
                              <span className="font-medium">{membership.studentEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <UserCheck className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Department:</span>
                              <span className="font-medium">{membership.department}</span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Joined:</span>
                              <span className="font-medium">{new Date(membership.joinedAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Applied:</span>
                              <span className="font-medium">{new Date(membership.joinedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reason for joining */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground mb-1">Reason for joining:</p>
                          <p className="text-sm leading-relaxed">{membership.reason}</p>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowMemberDetails(membership.id)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Profile
                        </Button>
                        {membership.status === 'approved' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedStudentForPoints(membership);
                                setShowPointsModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                            >
                              <Award className="w-4 h-4" />
                              Award Points
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${membership.studentName} from the club?`)) {
                                  deleteMembershipMutation.mutate(membership.id);
                                }
                              }}
                              disabled={deleteMembershipMutation.isPending}
                              className="flex items-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove
                            </Button>
                          </>
                        )}
                        {membership.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateMembershipStatusMutation.mutate({
                                membershipId: membership.id,
                                status: 'approved'
                              })}
                              disabled={updateMembershipStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateMembershipStatusMutation.mutate({
                                membershipId: membership.id,
                                status: 'rejected'
                              })}
                              disabled={updateMembershipStatusMutation.isPending}
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              {memberships.filter(membership => {
                if (memberSearch) {
                  const searchLower = memberSearch.toLowerCase();
                  return membership.studentName.toLowerCase().includes(searchLower) ||
                         membership.studentEmail.toLowerCase().includes(searchLower) ||
                         membership.enrollmentNumber.toLowerCase().includes(searchLower) ||
                         membership.department.toLowerCase().includes(searchLower);
                }
                return true;
              }).filter(membership => {
                return memberFilter === 'all' || membership.status === memberFilter;
              }).length === 0 && (
                <Card className="p-8 text-center">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {memberSearch ? 'No members match your search.' : 'No members found for the selected filter.'}
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="leadership" className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Club Leadership</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage club leadership positions and assign roles to members
                </p>
              </div>
              <Button
                onClick={() => setShowLeadershipModal(true)}
                className="flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                Assign Leadership Role
              </Button>
            </div>

            {/* Current Leadership */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-500" />
                Current Leadership Team
              </h3>
              <div className="space-y-4">
                {leadership.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leadership.map((leader) => (
                      <Card key={leader.id} className="p-4 relative">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${leader.studentName} from ${leader.role}?`)) {
                              deleteLeadershipMutation.mutate(leader.id);
                            }
                          }}
                          disabled={deleteLeadershipMutation.isPending}
                          className="absolute top-2 right-2 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        <div className="text-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg mx-auto mb-3">
                            {leader.studentName.charAt(0).toUpperCase()}
                          </div>
                          <h4 className="font-semibold text-sm">{leader.studentName}</h4>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {leader.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          <div className="mt-2 text-xs text-muted-foreground">
                            <p>{leader.studentEmail}</p>
                            <p>{leader.phoneNumber}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Crown className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No Leadership Roles Assigned</p>
                    <p className="text-sm mb-4">
                      Assign leadership positions to your approved members to build a strong leadership team.
                    </p>
                    <Button onClick={() => setShowLeadershipModal(true)}>
                      <Crown className="w-4 h-4 mr-2" />
                      Assign First Leader
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {/* Leadership Roles Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Crown className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{leadership.length}</p>
                    <p className="text-sm text-muted-foreground">Leadership Roles</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{memberships.filter(m => m.status === 'approved').length}</p>
                    <p className="text-sm text-muted-foreground">Eligible Members</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Active Leaders</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Leadership Positions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Available Leadership Positions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: "President", description: "Overall club leadership and representation" },
                  { title: "Vice President", description: "Supports president and handles operations" },
                  { title: "Secretary", description: "Manages communications and records" },
                  { title: "Treasurer", description: "Handles financial matters and budgeting" },
                  { title: "Event Coordinator", description: "Organizes and manages club events" },
                  { title: "Public Relations", description: "Manages publicity and member outreach" },
                  { title: "Member Representative", description: "Represents member interests and feedback" }
                ].map((position, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{position.title}</h4>
                      <Badge variant="outline" className="text-xs">Vacant</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{position.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="community" className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Community Showcase</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Share your club's achievements, awards, and milestones with the community
                </p>
              </div>
              <Button
                onClick={() => setCreatingAchievement(true)}
                className="flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Add Achievement
              </Button>
            </div>

            {/* Achievement Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Award className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{achievements.length}</p>
                    <p className="text-sm text-muted-foreground">Achievements</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {achievements.filter(a => {
                        const achievementDate = new Date(a.achievementDate);
                        const monthAgo = new Date();
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        return achievementDate >= monthAgo;
                      }).length}
                    </p>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {achievements.filter(a => a.category === 'Competition Win').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Competition Wins</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {achievements.filter(a => a.category === 'Award').length}
                    </p>
                    <p className="text-sm text-muted-foreground">Awards</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Achievement Gallery */}
            <div className="space-y-4">
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img
                          src={achievement.imageUrl}
                          alt={achievement.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to remove "${achievement.title}"?`)) {
                                deleteAchievementMutation.mutate(achievement.id);
                              }
                            }}
                            disabled={deleteAchievementMutation.isPending}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg line-clamp-2">{achievement.title}</h3>
                          <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                            {achievement.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Achieved on {new Date(achievement.achievementDate).toLocaleDateString()}</span>
                          <span>Posted {new Date(achievement.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Achievements Yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start showcasing your club's achievements, awards, and milestones to inspire the community.
                  </p>
                  <Button onClick={() => setCreatingAchievement(true)}>
                    <Award className="w-4 h-4 mr-2" />
                    Add Your First Achievement
                  </Button>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages" className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <h2 className="text-xl font-semibold">Messages</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage messages from students
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="px-3 py-1">
                  {messages.filter(m => !m.read).length} unread
                </Badge>
              </div>
            </div>

            <div className="space-y-4">
              {messages.length === 0 ? (
                <Card className="p-12 text-center">
                  <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
                  <p className="text-muted-foreground">
                    Messages from students will appear here.
                  </p>
                </Card>
              ) : (
                messages.map((message) => (
                  <Card key={message.id} className={`p-6 ${!message.read ? 'border-l-4 border-l-primary' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{message.senderName}</h3>
                          {!message.read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Email:</strong> {message.senderEmail}</p>
                          <p><strong>Enrollment:</strong> {message.enrollmentNumber}</p>
                          <p><strong>Subject:</strong> {message.subject}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{new Date(message.sentAt).toLocaleDateString()}</p>
                        <p>{new Date(message.sentAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                    </div>

                    {!message.read && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => markMessageAsReadMutation.mutate(message.id)}
                          disabled={markMessageAsReadMutation.isPending}
                        >
                          {markMessageAsReadMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Marking...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Mark as Read
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Club Settings</h2>
              <Button
                variant={editingClub ? "secondary" : "outline"}
                onClick={() => setEditingClub(!editingClub)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {editingClub ? "Cancel" : "Edit Club"}
              </Button>
            </div>

            {editingClub ? (
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Edit Club Information</h3>
                  <p className="text-sm text-muted-foreground">
                    Update your club's details, logo, and category information.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    updateClubMutation.mutate({
                      clubData: {
                        name: formData.get("name") as string,
                        description: formData.get("description") as string,
                        category: formData.get("category") as string,
                      },
                      logoFile: selectedLogoFile || undefined,
                    });
                  }}
                  className="space-y-6"
                >
                  {/* Logo Upload Section */}
                  <div className="space-y-3">
                    <Label>Club Logo</Label>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={logoPreview || club?.logoUrl || "/placeholder-logo.png"}
                          alt="Club logo preview"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-dashed border-gray-300"
                        />
                        {(logoPreview || club?.logoUrl) && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoFileSelect}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById("logo-upload")?.click()}
                        >
                          <Image className="w-4 h-4 mr-2" />
                          {selectedLogoFile ? "Change Logo" : "Upload Logo"}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">
                          Recommended: Square image, max 2MB
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Club Name */}
                  <div>
                    <Label htmlFor="name">Club Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={club?.name || ""}
                      placeholder="Enter club name..."
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={club?.category || ""} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Description */}
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={club?.description || ""}
                      placeholder="Describe your club, its activities, and goals..."
                      required
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 500 characters
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      type="submit"
                      disabled={updateClubMutation.isPending}
                      className="flex-1"
                    >
                      {updateClubMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Updating Club...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Update Club
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditingClub(false);
                        setSelectedLogoFile(null);
                        setLogoPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Club Overview Card */}
                <Card className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {club.logoUrl ? (
                        <img
                          src={club.logoUrl}
                          alt={`${club.name} logo`}
                          className="w-24 h-24 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border">
                          <Image className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="text-2xl font-bold">{club.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {club.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {club.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{club.memberCount || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Active since {new Date(club.createdAt || Date.now()).getFullYear()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{club.memberCount || 0}</p>
                        <p className="text-sm text-muted-foreground">Total Members</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{clubEvents.length}</p>
                        <p className="text-sm text-muted-foreground">Total Events</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {eventRegistrations.length > 0
                            ? Math.round((eventRegistrations.filter(r => r.attended).length / eventRegistrations.length) * 100)
                            : 0
                          }%
                        </p>
                        <p className="text-sm text-muted-foreground">Avg Attendance</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Member Profile Dialog */}
        <Dialog open={!!showMemberDetails} onOpenChange={() => setShowMemberDetails(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Member Profile</DialogTitle>
              <DialogDescription>
                Detailed information about the club member
              </DialogDescription>
            </DialogHeader>
            {showMemberDetails && (() => {
              const member = memberships.find(m => m.id === showMemberDetails);
              if (!member) return null;

              return (
                <div className="space-y-6">
                  {/* Profile Header */}
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {member.studentName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">{member.studentName}</h3>
                      <p className="text-muted-foreground">{member.enrollmentNumber}</p>
                      <Badge variant={
                        member.status === 'approved' ? 'default' :
                        member.status === 'rejected' ? 'destructive' : 'secondary'
                      } className="mt-1">
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  {/* Member Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="text-sm font-medium">{member.studentEmail}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Department</Label>
                        <p className="text-sm font-medium">{member.department}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Application Date</Label>
                        <p className="text-sm font-medium">{new Date(member.joinedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Club</Label>
                        <p className="text-sm font-medium">{member.clubName}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                        <Badge variant={
                          member.status === 'approved' ? 'default' :
                          member.status === 'rejected' ? 'destructive' : 'secondary'
                        }>
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Reason for Joining */}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Reason for Joining</Label>
                    <div className="mt-2 p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed">{member.reason}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t">
                    {member.status === 'approved' && (
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove ${member.studentName} from the club?`)) {
                            deleteMembershipMutation.mutate(member.id);
                            setShowMemberDetails(null);
                          }
                        }}
                        disabled={deleteMembershipMutation.isPending}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove from Club
                      </Button>
                    )}
                    {member.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => {
                            updateMembershipStatusMutation.mutate({
                              membershipId: member.id,
                              status: 'approved'
                            });
                            setShowMemberDetails(null);
                          }}
                          disabled={updateMembershipStatusMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Member
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            updateMembershipStatusMutation.mutate({
                              membershipId: member.id,
                              status: 'rejected'
                            });
                            setShowMemberDetails(null);
                          }}
                          disabled={updateMembershipStatusMutation.isPending}
                        >
                          <AlertCircle className="w-4 h-4 mr-2" />
                          Reject Member
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Leadership Modal */}
        <Dialog open={showLeadershipModal} onOpenChange={setShowLeadershipModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Leadership Role</DialogTitle>
              <DialogDescription>
                Assign a leadership position to a club member and provide their contact information
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);

                const selectedMember = memberships.find(m => m.id === selectedLeadershipMember);
                if (!selectedMember) return;

                createLeadershipMutation.mutate({
                  studentId: selectedMember.enrollmentNumber,
                  studentName: selectedMember.studentName,
                  studentEmail: formData.get("email") as string,
                  phoneNumber: formData.get("phone") as string,
                  role: leadershipRole,
                });
              }}
              className="space-y-4"
            >
              <div>
                <Label>Select Member</Label>
                <Select value={selectedLeadershipMember || ""} onValueChange={setSelectedLeadershipMember}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {memberships
                      .filter(m => m.status === 'approved')
                      .map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.studentName} ({member.enrollmentNumber})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Leadership Role</Label>
                <Select value={leadershipRole} onValueChange={setLeadershipRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="president">President</SelectItem>
                    <SelectItem value="vice-president">Vice President</SelectItem>
                    <SelectItem value="secretary">Secretary</SelectItem>
                    <SelectItem value="treasurer">Treasurer</SelectItem>
                    <SelectItem value="event-coordinator">Event Coordinator</SelectItem>
                    <SelectItem value="public-relations">Public Relations</SelectItem>
                    <SelectItem value="member">Member Representative</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="leadership-email">Email Address *</Label>
                <Input
                  id="leadership-email"
                  name="email"
                  type="email"
                  placeholder="Enter email address"
                  required
                />
              </div>
              <div>
                <Label htmlFor="leadership-phone">Phone Number *</Label>
                <Input
                  id="leadership-phone"
                  name="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={!selectedLeadershipMember || !leadershipRole || createLeadershipMutation.isPending}
                >
                  Assign Role
                </Button>
                <Button variant="outline" onClick={() => setShowLeadershipModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Achievement Creation Modal */}
        <Dialog open={creatingAchievement} onOpenChange={setCreatingAchievement}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Achievement</DialogTitle>
              <DialogDescription>
                Share your club's achievement with the community
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const imageFile = formData.get("image") as File;

                if (!imageFile) {
                  toast({
                    title: "Image required",
                    description: "Please select an image for the achievement.",
                    variant: "destructive",
                  });
                  return;
                }

                createAchievementMutation.mutate({
                  achievementData: {
                    title: formData.get("title") as string,
                    description: formData.get("description") as string,
                    achievementDate: formData.get("achievementDate") as string,
                    category: formData.get("category") as string,
                  },
                  imageFile,
                });
              }}
              className="space-y-6"
            >
              {/* Achievement Image */}
              <div>
                <Label htmlFor="achievement-image">Achievement Image *</Label>
                <input
                  type="file"
                  id="achievement-image"
                  name="image"
                  accept="image/*"
                  required
                  className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a high-quality image of your achievement (max 5MB)
                </p>
              </div>

              {/* Achievement Title */}
              <div>
                <Label htmlFor="achievement-title">Achievement Title *</Label>
                <Input
                  id="achievement-title"
                  name="title"
                  placeholder="e.g., Won Inter-College Coding Competition"
                  required
                  maxLength={100}
                />
              </div>

              {/* Category */}
              <div>
                <Label htmlFor="achievement-category">Category *</Label>
                <Select name="category" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select achievement category" />
                  </SelectTrigger>
                  <SelectContent>
                    {achievementCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Achievement Date */}
              <div>
                <Label htmlFor="achievement-date">Achievement Date *</Label>
                <Input
                  id="achievement-date"
                  name="achievementDate"
                  type="date"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="achievement-description">Description *</Label>
                <Textarea
                  id="achievement-description"
                  name="description"
                  placeholder="Describe the achievement, what was accomplished, and any notable details..."
                  required
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum 500 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={createAchievementMutation.isPending}
                  className="flex-1"
                >
                  {createAchievementMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Adding Achievement...
                    </>
                  ) : (
                    <>
                      <Award className="w-4 h-4 mr-2" />
                      Add Achievement
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreatingAchievement(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {editingEventId && (
          <EditEventForm
            event={clubEvents.find((e) => e.id === editingEventId)}
            onClose={() => setEditingEventId(null)}
          />
        )}

        {creatingEvent && (
          <EditEventForm
            clubId={admin?.clubId || ""}
            onClose={() => setCreatingEvent(false)}
          />
        )}

        {/* Points Awarding Modal */}
        <Dialog open={showPointsModal} onOpenChange={setShowPointsModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Award Points, Badges & Skills</DialogTitle>
              <DialogDescription>
                Award points, badges, and skills to {selectedStudentForPoints?.studentName}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedStudentForPoints && pointsToAward > 0) {
                  awardPointsMutation.mutate({
                    enrollmentNumber: selectedStudentForPoints.enrollmentNumber,
                    points: pointsToAward,
                    reason: pointsReason,
                    badges: selectedBadges,
                    skills: selectedSkills,
                  });
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="points">Points to Award</Label>
                <Input
                  id="points"
                  type="number"
                  min="1"
                  value={pointsToAward}
                  onChange={(e) => setPointsToAward(parseInt(e.target.value) || 0)}
                  placeholder="Enter points (e.g., 25)"
                  required
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  placeholder="Why are you awarding these points?"
                  rows={3}
                />
              </div>
              <div>
                <Label>Badges (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Regular Attendee", "Active Member", "Club Champion", "Event Organizer", "Top Contributor"].map((badge) => (
                    <Button
                      key={badge}
                      type="button"
                      variant={selectedBadges.includes(badge) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedBadges(prev =>
                          prev.includes(badge)
                            ? prev.filter(b => b !== badge)
                            : [...prev, badge]
                        );
                      }}
                    >
                      {badge}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Skills (Optional)</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Leadership", "Teamwork", "Communication", "Problem Solving", "Creativity", "Organization", "Public Speaking", "Project Management"].map((skill) => (
                    <Button
                      key={skill}
                      type="button"
                      variant={selectedSkills.includes(skill) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedSkills(prev =>
                          prev.includes(skill)
                            ? prev.filter(s => s !== skill)
                            : [...prev, skill]
                        );
                      }}
                    >
                      {skill}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPointsModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={pointsToAward <= 0 || awardPointsMutation.isPending}
                >
                  {awardPointsMutation.isPending ? "Awarding..." : "Award Points"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}