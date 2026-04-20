import { useState, useEffect, useMemo } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  KeyRound,
  Image,
  Upload,
  X,
  Search,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Bookmark,
  Filter
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club, AttendanceDispute } from "@shared/schema";

// Interfaces for Campus Feed
interface StoryHighlight {
  clubId: string;
  clubName: string;
  clubLogo: string;
  viewed?: boolean;
  timestamp?: Date;
}

interface FeedPost {
  id: string;
  clubId: string;
  clubName: string;
  clubLogo: string;
  title: string;
  description?: string;
  content?: string;
  timestamp: Date;
  views?: number;
  interactions?: number;
  type?: "post" | "announcement" | "event" | "achievement";
  imageUrl?: string;
}

interface Recommendation {
  clubId: string;
  clubName: string;
  clubLogo: string;
}

type ClubsGridRow = {
  srNo: number;
  id: string;
  name: string;
  category: string;
  description: string;
  memberCount: number;
  eventCount: number;
  status: "Active" | "Frozen";
};

type EventsGridRow = {
  srNo: number;
  id: string;
  title: string;
  category: string;
  date: string;
  time: string;
  location: string;
  clubName: string;
  status: "Upcoming" | "Past";
};

type AnnouncementsGridRow = {
  srNo: number;
  id: string;
  title: string;
  target: string;
  createdDate: string;
  pinned: "Pinned" | "-";
  category: string;
  description: string;
  memberCount?: number;
  reason?: string;
  matchPercentage?: number;
}

type StudentsGridRow = {
  srNo: number;
  id: string;
  name: string;
  email: string;
  enrollment: string;
  phone: string;
  department: string;
  status: string;
  lastLogin: string;
}

type ClubAdminsGridRow = {
  srNo: number;
  id: string;
  clubName: string;
  description: string;
  memberCount: number;
  eventCount: number;
  createdAt: string;
}

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
    facultyAssigned: "",
    phone: "",
    email: "",
    eligibility: "",
    eligibilityYears: [] as string[],
  });
  const [clubLoginId, setClubLoginId] = useState("");
  const [clubLoginPassword, setClubLoginPassword] = useState("");
  const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null);
  const [clubCoverFile, setClubCoverFile] = useState<File | null>(null);
  const [clubCoverPreview, setClubCoverPreview] = useState<string | null>(null);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    durationMinutes: "120",
    location: "",
    category: "",
    clubId: "",
  });
  const [eventImageFile, setEventImageFile] = useState<File | null>(null);
  const [eventImagePreview, setEventImagePreview] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentEditForm, setStudentEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    enrollment: "",
    department: "",
    yearOfAdmission: "",
  });
  const [studentEditErrors, setStudentEditErrors] = useState<Record<string, string>>({});
  const [selectedAdmin, setSelectedAdmin] = useState<any | null>(null);
  const [isAdminProfileOpen, setIsAdminProfileOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [targetForAnnouncement, setTargetForAnnouncement] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState("");
  const [clubSearch, setClubSearch] = useState("");
  const [clubStatusFilter, setClubStatusFilter] = useState<"all" | "active" | "frozen">("all");
  const [eventGridSearch, setEventGridSearch] = useState("");
  const [eventGridStatusFilter, setEventGridStatusFilter] = useState<"all" | "upcoming" | "past">("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState<"all" | "active" | "disabled">("all");
  const [disputeStatusFilter, setDisputeStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [attendanceResolutionStatus, setAttendanceResolutionStatus] = useState<Record<string, "present" | "absent" | "pending">>({});
  const [attendanceResolutionNote, setAttendanceResolutionNote] = useState<Record<string, string>>({});
  const [clubAdminSearch, setClubAdminSearch] = useState("");
  const [clubAdminStatusFilter, setClubAdminStatusFilter] = useState<"all" | "active" | "frozen">("all");
  const eligibilityYearOptions = ["1st", "2nd", "3rd", "4th", "5th"];
  const clubCategoryOptions = [
    "Academic",
    "Technical",
    "Technology",
    "Cultural",
    "Sports",
    "Social",
    "Arts",
    "Business",
    "Legal",
    "Leadership",
    "NGO",
    "Entrepreneurship",
    "Other",
  ];
  const trimmedClubLoginId = clubLoginId.trim();
  const suggestionBase = (trimmedClubLoginId || clubForm.name).trim();

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["api", "events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["api", "clubs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clubs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: clubLoginAvailability, isFetching: isCheckingClubLoginId } = useQuery<{
    available: boolean;
    error?: string;
  }>({
    queryKey: ["api", "auth", "check-username", trimmedClubLoginId],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/auth/check-username?username=${encodeURIComponent(trimmedClubLoginId)}`,
      );
      return res.json();
    },
    enabled: isAuthenticated && showCreateClub && !editingClub && trimmedClubLoginId.length > 0,
    staleTime: 30000,
  });

  const isClubLoginIdUnavailable =
    !editingClub && trimmedClubLoginId.length > 0 && clubLoginAvailability?.available === false;

  const { data: clubLoginSuggestion, isFetching: isSuggestingClubLoginId } = useQuery<{
    suggestion: string;
  }>({
    queryKey: ["api", "auth", "suggest-username", suggestionBase],
    queryFn: async () => {
      const res = await apiRequest(
        "GET",
        `/api/auth/suggest-username?base=${encodeURIComponent(suggestionBase)}`,
      );
      return res.json();
    },
    enabled:
      isAuthenticated &&
      showCreateClub &&
      !editingClub &&
      isClubLoginIdUnavailable &&
      suggestionBase.length > 0,
    staleTime: 30000,
  });

  const { data: students = [], error: studentsError, isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ["api", "admin", "students"],
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

  const normalizedStudentSearch = studentSearch.trim().toLowerCase();
  const filteredStudents = normalizedStudentSearch
    ? students.filter((s) => {
        const name = (s?.name || "").toLowerCase();
        const enrollment = (s?.enrollment || "").toLowerCase();
        return name.includes(normalizedStudentSearch) || enrollment.includes(normalizedStudentSearch);
      })
    : students;

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
  const [selectedClubGridId, setSelectedClubGridId] = useState<string | null>(null);
  const [selectedEventGridId, setSelectedEventGridId] = useState<string | null>(null);
  const [selectedAnnouncementGridId, setSelectedAnnouncementGridId] = useState<string | null>(null);
  const [selectedStudentGridId, setSelectedStudentGridId] = useState<string | null>(null);
  const [selectedClubAdminGridId, setSelectedClubAdminGridId] = useState<string | null>(null);
  const { theme } = useTheme();

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

  const { data: attendanceDisputesData, isLoading: attendanceDisputesLoading } = useQuery<{
    disputes: AttendanceDispute[];
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>({
    queryKey: ["/api/admin/attendance-disputes", disputeStatusFilter],
    queryFn: async () => {
      const statusParam = disputeStatusFilter === "all" ? "all" : disputeStatusFilter;
      const res = await apiRequest("GET", `/api/admin/attendance-disputes?status=${encodeURIComponent(statusParam)}&page=1&limit=30`);
      return res.json();
    },
    enabled: isAuthenticated && activeTab === "dashboard",
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
    refetchOnMount: true,
    staleTime: 0,
  });

  // Get the club details from the clubs array
  const selectedClubDetails = selectedAdmin ? clubs.find(c => c.id === selectedAdmin.id) : null;

  // Toggle student account status mutation
  const toggleStudentStatusMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("PATCH", `/api/admin/students/${studentId}/toggle-status`);
      return res.json();
    },
    onSuccess: (data) => {
      // Update the students list with the new status
      queryClient.setQueryData(["api", "admin", "students"], (oldData: any[]) => {
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

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/students/${studentId}`);
      return res.json();
    },
    onSuccess: (data) => {
      // Remove from list
      queryClient.setQueryData(["api", "admin", "students"], (oldData: any[]) => {
        return oldData?.filter(student => student.id !== data.studentId);
      });
      // Clear selected student
      setSelectedStudent(null);
      setIsStudentProfileOpen(false);
      toast({
        title: "Student Deleted",
        description: data.message || "Student has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete student.",
        variant: "destructive",
      });
    },
  });

  const updateStudentDetailsMutation = useMutation({
    mutationFn: async (payload: {
      studentId: string;
      name: string;
      email: string;
      phone: string;
      rollNumber: string;
      enrollment: string;
      department: string;
      yearOfAdmission?: number;
    }) => {
      const { studentId, ...body } = payload;
      const res = await apiRequest("PATCH", `/api/admin/students/${studentId}`, body);
      return res.json();
    },
    onSuccess: (data) => {
      const updated = data?.student;
      if (!updated?.id) return;

      queryClient.setQueryData(["api", "admin", "students"], (oldData: any[] = []) => {
        return oldData.map((student) =>
          student.id === updated.id
            ? {
                ...student,
                ...updated,
                branch: updated.department || "",
              }
            : student,
        );
      });

      setSelectedStudent((prev: any) =>
        prev && prev.id === updated.id
          ? {
              ...prev,
              ...updated,
              branch: updated.department || "",
            }
          : prev,
      );

      setIsEditingStudent(false);
      setStudentEditErrors({});
      toast({
        title: "Student updated",
        description: "Student details have been saved successfully.",
      });
    },
    onError: (error: any) => {
      const rawMessage = String(error?.message || "Could not update student details.");
      let parsedError: any = null;
      const normalizedMessage = rawMessage.replace(/^\d+:\s*/, "");
      try {
        parsedError = JSON.parse(normalizedMessage);
      } catch {
        parsedError = null;
      }

      const field = String(parsedError?.field || "").trim();
      const message = String(parsedError?.error || rawMessage || "Could not update student details.");

      if (field && ["name", "email", "phone", "rollNumber", "enrollment", "department", "yearOfAdmission"].includes(field)) {
        setStudentEditErrors({ [field]: message });
      }

      toast({
        title: "Update failed",
        description: message,
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

  const resolveAttendanceDisputeMutation = useMutation({
    mutationFn: async (payload: {
      disputeId: string;
      status: "approved" | "rejected";
      resolvedAttendanceStatus?: "present" | "absent" | "pending";
      adminResponse?: string;
    }) => {
      const res = await apiRequest("PATCH", `/api/admin/attendance-disputes/${payload.disputeId}`, payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance-disputes"] });
      toast({
        title: "Dispute updated",
        description: "Attendance dispute status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Could not update attendance dispute.",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
      return;
    }

    if (!authLoading && isAuthenticated && !!admin?.clubId) {
      setLocation("/club-admin");
    }
  }, [authLoading, isAuthenticated, admin?.clubId, setLocation]);

  useEffect(() => {
    if (!selectedStudent || !isStudentProfileOpen) return;
    setStudentEditForm({
      name: selectedStudent.name || "",
      email: selectedStudent.email || "",
      phone: selectedStudent.phone || "",
      rollNumber: selectedStudent.rollNumber || "",
      enrollment: selectedStudent.enrollment || "",
      department: selectedStudent.department || selectedStudent.branch || "",
      yearOfAdmission: selectedStudent.yearOfAdmission ? String(selectedStudent.yearOfAdmission) : "",
    });
    setStudentEditErrors({});
  }, [selectedStudent, isStudentProfileOpen]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear stored admin session and cache
      localStorage.removeItem("currentAdmin");
      localStorage.removeItem("adminCache");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.setQueryData(["/api/chat/me"], { loggedIn: false, role: "guest" });
      queryClient.removeQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.removeQueries({ queryKey: ["/api/chat/unread-count"] });
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

  const dispatchEventReminderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/reminders/events-24h/dispatch", {});
      return res.json();
    },
    onSuccess: (result: any) => {
      const summary = result?.summary || {};
      toast({
        title: "24h reminders dispatched",
        description: `Sent: ${summary.sentCount ?? 0} | Skipped: ${summary.skippedCount ?? 0} | Failed: ${summary.failedCount ?? 0}`,
      });
    },
    onError: () => {
      toast({
        title: "Dispatch failed",
        description: "Could not dispatch 24-hour reminders.",
        variant: "destructive",
      });
    },
  });

  const createClubMutation = useMutation({
    mutationFn: async ({
      clubData,
      logoFile,
      coverFile,
    }: {
      clubData: {
        name: string;
        description: string;
        category: string;
        adminName?: string;
        facultyAssigned?: string;
        phone?: string;
        email?: string;
        eligibility?: string;
        eligibilityYears?: string[];
      };
      logoFile?: File | null;
      coverFile?: File | null;
    }) => {
      let logoUrl: string | undefined;
      let coverImageUrl: string | undefined;

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("type", "club-logo");

        const uploadRes = await apiRequest("POST", "/api/upload", formData);
        const uploadJson = await uploadRes.json();
        logoUrl = uploadJson.url;
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        formData.append("type", "club-cover");

        const uploadRes = await apiRequest("POST", "/api/upload", formData);
        const uploadJson = await uploadRes.json();
        coverImageUrl = uploadJson.url;
      }

      const res = await apiRequest("POST", "/api/clubs", {
        ...clubData,
        // Filter out empty strings for optional fields
        facultyAssigned: clubData.facultyAssigned || undefined,
        phone: clubData.phone || undefined,
        email: clubData.email || undefined,
        eligibility: clubData.eligibility || undefined,
        ...(logoUrl ? { logoUrl } : {}),
        ...(coverImageUrl ? { coverImageUrl } : {}),
      });
      const createdClub = await res.json();
      let registerWarning: string | null = null;

      if (clubLoginId && clubLoginPassword) {
        try {
          await apiRequest("POST", "/api/auth/register", {
            username: clubLoginId,
            password: clubLoginPassword,
            clubId: createdClub.id,
          });
        } catch (error: any) {
          registerWarning = error?.message || "Failed to create club login credentials.";
        }
      }

      return { ...createdClub, registerWarning };
    },
    onSuccess: (createdClub) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      const loginCredentials =
        clubLoginId && clubLoginPassword && !createdClub.registerWarning
          ? ` Club admin can now login at /club-admin-login using username: "${clubLoginId}"`
          : "";
      toast({
        title: "Club created successfully!",
        description: `${createdClub.name} has been created.${loginCredentials}`,
      });
      if (createdClub.registerWarning) {
        toast({
          title: "Club created, but login setup failed",
          description: `Club was created successfully. ${createdClub.registerWarning}`,
          variant: "destructive",
        });
      }
      setShowCreateClub(false);
      setClubForm({
        name: "",
        description: "",
        category: "",
        facultyAssigned: "",
        phone: "",
        email: "",
        eligibility: "",
        eligibilityYears: [],
      });
      setClubLoginId("");
      setClubLoginPassword("");
      setClubLogoFile(null);
      setClubLogoPreview(null);
      setClubCoverFile(null);
      setClubCoverPreview(null);
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
    mutationFn: async ({
      id,
      data,
      logoFile,
      coverFile,
    }: {
      id: string;
      data: Partial<Club>;
      logoFile?: File | null;
      coverFile?: File | null;
    }) => {
      let nextData = { ...data };

      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("type", "club-logo");

        const uploadRes = await apiRequest("POST", "/api/upload", formData);
        const uploadJson = await uploadRes.json();
        nextData = { ...nextData, logoUrl: uploadJson.url };
      }

      if (coverFile) {
        const formData = new FormData();
        formData.append("file", coverFile);
        formData.append("type", "club-cover");

        const uploadRes = await apiRequest("POST", "/api/upload", formData);
        const uploadJson = await uploadRes.json();
        nextData = { ...nextData, coverImageUrl: uploadJson.url };
      }

      const res = await apiRequest("PATCH", `/api/clubs/${id}`, nextData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club updated",
        description: "The club has been updated successfully.",
      });
      setEditingClub(null);
      setClubForm({
        name: "",
        description: "",
        category: "",
        facultyAssigned: "",
        phone: "",
        email: "",
        eligibility: "",
        eligibilityYears: [],
      });
      setClubLoginId("");
      setClubLoginPassword("");
      setClubLogoFile(null);
      setClubLogoPreview(null);
      setClubCoverFile(null);
      setClubCoverPreview(null);
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

  const toggleFreezeClubMutation = useMutation({
    mutationFn: async ({ clubId, freeze }: { clubId: string; freeze: boolean }) => {
      await apiRequest("PATCH", `/api/clubs/${clubId}/freeze`, { freeze });
    },
    onMutate: async ({ clubId, freeze }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["api", "clubs"] });
      
      // Snapshot previous value
      const previousClubs = queryClient.getQueryData(["api", "clubs"]);
      
      // Optimistically update
      queryClient.setQueryData(["api", "clubs"], (old: any[]) => {
        return old?.map(club => 
          club.id === clubId 
            ? { ...club, isFrozen: freeze, frozenAt: freeze ? new Date() : null }
            : club
        );
      });
      
      return { previousClubs };
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.freeze ? "🔒 Club Frozen" : "✅ Club Unfrozen",
        description: variables.freeze 
          ? "Club admin can no longer perform operations."
          : "Club admin operations have been restored.",
      });
    },
    onError: (_, __, context) => {
      // Rollback on error
      if (context?.previousClubs) {
        queryClient.setQueryData(["api", "clubs"], context.previousClubs);
      }
      toast({
        title: "Error",
        description: "Failed to update club freeze status. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "clubs"] });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "events"] });
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", durationMinutes: "120", location: "", category: "", clubId: "" });
      setEventImageFile(null);
      setEventImagePreview(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to create event.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "events"] });
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      setEditingEvent(null);
      setEventForm({ title: "", description: "", date: "", time: "", durationMinutes: "120", location: "", category: "", clubId: "" });
      setEventImageFile(null);
      setEventImagePreview(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to update event.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "events"] });
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

  const deleteChatGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("DELETE", `/api/chat/groups/${groupId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api", "chat", "groups"] });
      toast({
        title: "Chat deleted",
        description: "The chat group has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete chat group.",
        variant: "destructive",
      });
    },
  });

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
      value: studentCount.count.toLocaleString(),
      trend: "+12% growth",
      color: "text-purple-500",
    },
    {
      icon: Activity,
      label: "Platform Activity",
      value: students.length > 0 ? `${Math.round((students.filter((s: any) => s.lastLogin).length / students.length) * 100)}%` : "0%",
      trend: "High engagement",
      color: "text-orange-500",
    },
  ];

  // Grid theme class
  const gridThemeClass = theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

  // Clubs Grid - memoized data and columns
  const clubsGridRows = useMemo<ClubsGridRow[]>(() => {
    return clubs
      .filter((club) => {
        if (!clubSearch) return true;
        const searchLower = clubSearch.toLowerCase();
        return (
          club.name.toLowerCase().includes(searchLower) ||
          club.category?.toLowerCase().includes(searchLower) ||
          club.facultyAssigned?.toLowerCase().includes(searchLower)
        );
      })
      .filter((club) => {
        if (clubStatusFilter === "all") return true;
        if (clubStatusFilter === "active") return !club.isFrozen;
        return !!club.isFrozen;
      })
      .map((club, index) => ({
        srNo: index + 1,
        id: club.id,
        name: club.name,
        category: club.category || "",
        description: club.description || "",
        memberCount: club.memberCount || 0,
        eventCount: events.filter((e) => e.clubId === club.id).length,
        status: club.isFrozen ? "Frozen" : "Active",
      }));
  }, [clubs, clubSearch, clubStatusFilter, events]);

  const clubsGridColumns = useMemo<ColDef<ClubsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "name", headerName: "Club Name", flex: 1.2, minWidth: 200 },
    { field: "category", headerName: "Category", minWidth: 140 },
    { field: "memberCount", headerName: "Members", minWidth: 120 },
    { field: "eventCount", headerName: "Events", minWidth: 110 },
    { field: "status", headerName: "Status", minWidth: 110 },
  ], []);

  const selectedClubFromGrid = useMemo(
    () => clubs.find((club) => club.id === selectedClubGridId) || null,
    [clubs, selectedClubGridId],
  );

  // Events Grid - memoized data and columns
  const eventsGridRows = useMemo<EventsGridRow[]>(() => {
    return events
      .filter((event) => {
        const club = clubs.find((c) => c.id === event.clubId);
        const status = new Date(event.date || new Date()) > new Date() ? "upcoming" : "past";

        const matchesSearch = !eventGridSearch || [
          event.title,
          event.category,
          event.location,
          club?.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(eventGridSearch.toLowerCase()));

        const matchesStatus = eventGridStatusFilter === "all" || status === eventGridStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .map((event, index) => {
        const club = clubs.find((c) => c.id === event.clubId);
        return {
          srNo: index + 1,
          id: event.id,
          title: event.title,
          category: event.category || "",
          date: new Date(event.date || new Date()).toLocaleDateString(),
          time: event.time || "TBA",
          location: event.location || "TBA",
          clubName: club?.name || "Unknown",
          status: new Date(event.date || new Date()) > new Date() ? "Upcoming" : "Past",
        };
      });
  }, [events, clubs, eventGridSearch, eventGridStatusFilter]);

  const eventsGridColumns = useMemo<ColDef<EventsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "title", headerName: "Event", flex: 1.2, minWidth: 200 },
    { field: "category", headerName: "Category", minWidth: 140 },
    { field: "date", headerName: "Date", minWidth: 120 },
    { field: "time", headerName: "Time", minWidth: 110 },
    { field: "clubName", headerName: "Club", minWidth: 140 },
    { field: "status", headerName: "Status", minWidth: 110 },
  ], []);

  const selectedEventFromGrid = useMemo(
    () => events.find((event) => event.id === selectedEventGridId) || null,
    [events, selectedEventGridId],
  );

  // Announcements Grid - memoized data and columns
  const announcementsGridRows = useMemo<AnnouncementsGridRow[]>(() => {
    return [...announcements]
      .sort((a: any, b: any) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map((announcement: any, index: number) => ({
        srNo: index + 1,
        id: announcement.id,
        title: announcement.title,
        target: announcement.target || "all",
        createdDate: new Date(announcement.createdAt).toLocaleDateString(),
        pinned: announcement.pinned ? "Pinned" : "-",
        category: announcement.category || "General",
        description: announcement.description || "",
      }));
  }, [announcements]);

  const announcementsGridColumns = useMemo<ColDef<AnnouncementsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "title", headerName: "Title", flex: 1.4, minWidth: 250 },
    { field: "target", headerName: "Target", minWidth: 140 },
    { field: "pinned", headerName: "Pinned", minWidth: 110 },
    { field: "createdDate", headerName: "Date", minWidth: 130 },
  ], []);

  const selectedAnnouncementFromGrid = useMemo(
    () => announcements.find((announcement: any) => announcement.id === selectedAnnouncementGridId) || null,
    [announcements, selectedAnnouncementGridId],
  );

  // Students Grid - memoized data and columns
  const studentsGridRows = useMemo<StudentsGridRow[]>(() => {
    return filteredStudents
      .filter((student: any) => {
        if (studentStatusFilter === "all") return true;
        if (studentStatusFilter === "active") return !student.isDisabled;
        return !!student.isDisabled;
      })
      .map((student: any, index: number) => ({
        srNo: index + 1,
        id: student.id || student._id,
        name: student.name || "",
        email: student.email || "",
        enrollment: student.enrollment || "",
        phone: student.phone || "—",
        department: student.department || student.branch || "—",
        status: student.isDisabled ? "Disabled" : "Active",
        lastLogin: student.lastLogin ? new Date(student.lastLogin).toLocaleString() : "—",
      }));
  }, [filteredStudents, studentStatusFilter]);

  const studentsGridColumns = useMemo<ColDef<StudentsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "name", headerName: "Name", flex: 1.2, minWidth: 180 },
    { field: "email", headerName: "Email", flex: 1.3, minWidth: 220 },
    { field: "enrollment", headerName: "Enrollment", minWidth: 140 },
    { field: "phone", headerName: "Phone", minWidth: 130 },
    { field: "department", headerName: "Department", minWidth: 150 },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "lastLogin", headerName: "Last Active", flex: 1.2, minWidth: 180 },
  ], []);

  const selectedStudentFromGrid = useMemo(
    () => studentsGridRows.find((student) => student.id === selectedStudentGridId) || null,
    [studentsGridRows, selectedStudentGridId],
  );

  // Club Admins Grid - memoized data and columns
  const clubAdminsGridRows = useMemo<ClubAdminsGridRow[]>(() => {
    return clubs
      .filter((club: any) => {
        const matchesSearch = !clubAdminSearch || [club.name, club.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(clubAdminSearch.toLowerCase()));

        const matchesStatus =
          clubAdminStatusFilter === "all" ||
          (clubAdminStatusFilter === "active" && !club.isFrozen) ||
          (clubAdminStatusFilter === "frozen" && !!club.isFrozen);

        return matchesSearch && matchesStatus;
      })
      .map((club: any, index: number) => ({
        srNo: index + 1,
        id: club.id,
        clubName: club.name,
        description: club.description || "",
        memberCount: club.memberCount || 0,
        eventCount: events.filter((e: any) => e.clubId === club.id).length,
        createdAt: club.createdAt ? new Date(club.createdAt).toLocaleDateString() : "",
      }));
  }, [clubs, events, clubAdminSearch, clubAdminStatusFilter]);

  const clubAdminsGridColumns = useMemo<ColDef<ClubAdminsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "clubName", headerName: "Club Name", flex: 1.3, minWidth: 200 },
    { field: "description", headerName: "Description", flex: 1.5, minWidth: 250 },
    { field: "memberCount", headerName: "Members", minWidth: 120, type: "numericColumn" },
    { field: "eventCount", headerName: "Events", minWidth: 110, type: "numericColumn" },
    { field: "createdAt", headerName: "Created", minWidth: 130 },
  ], []);

  const selectedClubAdminFromGrid = useMemo(
    () => clubs.find((club: any) => club.id === selectedClubAdminGridId) || null,
    [clubs, selectedClubAdminGridId],
  );

  const recentDashboardAnnouncements = useMemo(() => {
    if (announcements.length > 0) {
      return [...announcements]
        .sort((a: any, b: any) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        })
        .slice(0, 4)
        .map((item: any, index: number) => ({
          id: item.id || `announcement-${index}`,
          title: item.title || "Platform Update",
          description: item.description || "A new update has been published for clubs and students.",
          createdAt: item.createdAt,
          category: item.category || "General",
          pinned: Boolean(item.pinned),
        }));
    }

    return [
      {
        id: "fallback-welcome",
        title: "Welcome to GEHU Clubs Platform",
        description: "The platform is live with improved club workflows and event management.",
        createdAt: new Date().toISOString(),
        category: "General",
        pinned: true,
      },
      {
        id: "fallback-milestone",
        title: "Event Registration Milestone",
        description: "The campus community crossed 1000 event registrations this semester.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        category: "Milestone",
        pinned: false,
      },
    ];
  }, [announcements]);

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-7">
            <Card className="relative overflow-hidden border border-border/70 bg-card/80 p-6 md:p-7">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.18),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_48%)]" />
              <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin Workspace</p>
                  <h2 className="text-2xl font-semibold leading-tight md:text-3xl">Platform Command Center</h2>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    Track club momentum, event turnout, and member engagement from one unified surface.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">{clubs.length} clubs active</Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">{events.length} total events</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    disabled={dispatchEventReminderMutation.isPending}
                    onClick={() => dispatchEventReminderMutation.mutate()}
                  >
                    <Bell className="mr-2 h-3.5 w-3.5" />
                    {dispatchEventReminderMutation.isPending ? "Dispatching..." : "Dispatch 24h Reminders"}
                  </Button>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Global Platform Statistics</h3>
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Live Snapshot</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                {globalStats.map((stat, index) => {
                  const accentStyles = [
                    "from-blue-500/20 via-blue-500/5 to-transparent",
                    "from-emerald-500/20 via-emerald-500/5 to-transparent",
                    "from-violet-500/20 via-violet-500/5 to-transparent",
                    "from-orange-500/20 via-orange-500/5 to-transparent",
                  ];

                  return (
                    <Card
                      key={index}
                      className="group relative overflow-hidden border border-border/70 bg-card/85 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentStyles[index % accentStyles.length]}`} />
                      <div className="relative space-y-5">
                        <div className="flex items-center justify-between">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-background/70 ring-1 ring-border/70 ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <span className="rounded-full bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground ring-1 ring-border/70">
                            {stat.trend}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
                          <p className="mt-2 text-3xl font-semibold leading-none">{stat.value}</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Club Activity Overview</h3>
                <p className="text-sm text-muted-foreground">Distribution, trends, and performance</p>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="border border-border/70 bg-card/80 p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    Active Clubs by Category
                  </h4>
                  <div className="space-y-2.5">
                    {analyticsData?.distributions?.clubCategories ? (
                      Object.entries(analyticsData.distributions.clubCategories)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([category, count]: [string, any]) => {
                          const total = analyticsData.overview.totalClubs || clubs.length;
                          const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                          return (
                            <div key={category} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 ring-1 ring-border/60">
                              <div className="flex items-center gap-2">
                                <span className="text-sm capitalize">{category}</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {percentage}%
                                </Badge>
                              </div>
                              <span className="text-sm font-semibold">{count}</span>
                            </div>
                          );
                        })
                    ) : (
                      ["Technology", "Academic", "Arts", "Business", "Social"].map((category) => {
                        const count = clubs.filter((club) => club.category === category.toLowerCase()).length;
                        return (
                          <div key={category} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 ring-1 ring-border/60">
                            <span className="text-sm">{category}</span>
                            <span className="text-sm font-semibold">{count}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>

                <Card className="border border-border/70 bg-card/80 p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Club Membership Trends
                  </h4>
                  {analyticsData?.membershipTrends && analyticsData.membershipTrends.length > 0 ? (
                    <div className="h-40 rounded-lg bg-background/55 p-2 ring-1 ring-border/60">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.membershipTrends}>
                          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.35} />
                          <XAxis dataKey="month" fontSize={11} tick={{ fontSize: 10 }} />
                          <YAxis fontSize={11} tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(value) => [value, "New Members"]}
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
                            stroke="#6366f1"
                            strokeWidth={2.5}
                            dot={{ fill: "#6366f1", strokeWidth: 2, r: 3.5 }}
                            activeDot={{ r: 5 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-lg bg-muted/45 ring-1 ring-border/55">
                      <p className="text-sm text-muted-foreground">No membership data available yet</p>
                    </div>
                  )}
                </Card>

                <Card className="border border-border/70 bg-card/80 p-5">
                  <h4 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    Top Performing Clubs
                  </h4>
                  <div className="space-y-2.5">
                    {(analyticsData?.topClubs || clubs
                      .sort((a, b) => (b.memberCount || 0) - (a.memberCount || 0))
                      .slice(0, 5)
                    ).map((club: any, index: number) => (
                      <div key={club.id || index} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-2 ring-1 ring-border/60">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium leading-tight">{club.name}</p>
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

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight">Event Registrations vs Attendance</h3>
                <Badge variant="outline" className="text-xs">Top 10 events</Badge>
              </div>
              <Card className="border border-border/70 bg-card/80 p-5 md:p-6">
                {eventAnalytics?.registrationVsAttendance && eventAnalytics.registrationVsAttendance.length > 0 ? (
                  <div className="h-80 rounded-xl bg-background/55 p-3 ring-1 ring-border/60">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={eventAnalytics.registrationVsAttendance.slice(0, 10)}
                        margin={{
                          top: 20,
                          right: 20,
                          left: 8,
                          bottom: 60,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.35} />
                        <XAxis dataKey="eventTitle" angle={-45} textAnchor="end" height={80} fontSize={12} />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name) => [
                            value,
                            name === "registrations" ? "Registrations" : "Attendance",
                          ]}
                          labelFormatter={(label) => `Event: ${label}`}
                        />
                        <Legend />
                        <Bar dataKey="registrations" fill="#6366f1" name="Registrations" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="attendance" fill="#14b8a6" name="Attendance" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center rounded-xl bg-muted/45 ring-1 ring-border/55">
                    <div className="text-center">
                      <BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No event registration data available</p>
                      <p className="mt-2 text-xs text-muted-foreground">Registrations and attendance will appear once events receive responses.</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <Card className="border border-border/70 bg-card/80 p-5 lg:col-span-2">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">Attendance Disputes Review</h3>
                    <p className="text-xs text-muted-foreground">Resolve student correction requests and optionally update attendance status.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={disputeStatusFilter} onValueChange={(value: any) => setDisputeStatusFilter(value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Dispute status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/attendance-disputes"] })}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Refresh
                    </Button>
                  </div>
                </div>

                {attendanceDisputesLoading ? (
                  <div className="rounded-lg border border-border/70 bg-background/50 p-6 text-sm text-muted-foreground">Loading disputes...</div>
                ) : attendanceDisputesData?.disputes?.length ? (
                  <div className="space-y-3">
                    {attendanceDisputesData.disputes.map((dispute) => {
                      const resolutionStatus = attendanceResolutionStatus[dispute.id] || "present";
                      const note = attendanceResolutionNote[dispute.id] || "";

                      return (
                        <div key={dispute.id} className="rounded-lg border border-border/70 bg-background/55 p-4">
                          <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold">{dispute.eventTitle}</p>
                              <p className="text-xs text-muted-foreground">
                                {dispute.studentName} ({dispute.enrollmentNumber}) • {dispute.clubName}
                              </p>
                            </div>
                            <Badge
                              variant={
                                dispute.status === "approved"
                                  ? "default"
                                  : dispute.status === "rejected"
                                    ? "destructive"
                                    : "secondary"
                              }
                              className="capitalize"
                            >
                              {dispute.status}
                            </Badge>
                          </div>

                          <div className="rounded-md border border-border/70 bg-card/70 p-3 text-xs text-muted-foreground">
                            <p className="font-medium text-foreground">Student reason</p>
                            <p className="mt-1 whitespace-pre-wrap">{dispute.reason}</p>
                            {dispute.adminResponse && (
                              <>
                                <p className="mt-3 font-medium text-foreground">Admin response</p>
                                <p className="mt-1 whitespace-pre-wrap">{dispute.adminResponse}</p>
                              </>
                            )}
                          </div>

                          {dispute.status === "pending" && (
                            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center">
                              <Select
                                value={resolutionStatus}
                                onValueChange={(value: any) =>
                                  setAttendanceResolutionStatus((prev) => ({
                                    ...prev,
                                    [dispute.id]: value,
                                  }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Resolved attendance" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="present">Set Present</SelectItem>
                                  <SelectItem value="absent">Set Absent</SelectItem>
                                  <SelectItem value="pending">Keep Pending</SelectItem>
                                </SelectContent>
                              </Select>

                              <Input
                                value={note}
                                onChange={(e) =>
                                  setAttendanceResolutionNote((prev) => ({
                                    ...prev,
                                    [dispute.id]: e.target.value,
                                  }))
                                }
                                placeholder="Optional admin response"
                              />

                              <div className="flex items-center gap-2 md:justify-end">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={resolveAttendanceDisputeMutation.isPending}
                                  onClick={() =>
                                    resolveAttendanceDisputeMutation.mutate({
                                      disputeId: dispute.id,
                                      status: "approved",
                                      resolvedAttendanceStatus: resolutionStatus,
                                      adminResponse: note,
                                    })
                                  }
                                >
                                  Approve
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={resolveAttendanceDisputeMutation.isPending}
                                  onClick={() =>
                                    resolveAttendanceDisputeMutation.mutate({
                                      disputeId: dispute.id,
                                      status: "rejected",
                                      adminResponse: note,
                                    })
                                  }
                                >
                                  Reject
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background/40 p-6 text-center text-sm text-muted-foreground">
                    No attendance disputes found for this filter.
                  </div>
                )}
              </Card>

              <Card className="border border-border/70 bg-card/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold tracking-tight">User Management Overview</h3>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current distribution</p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-xl border border-blue-500/25 bg-blue-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-500">Student Users</p>
                    <p className="mt-2 text-3xl font-semibold text-blue-500">{studentCount.count || 0}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Active students</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-500">Club Admins</p>
                    <p className="mt-2 text-3xl font-semibold text-emerald-500">6</p>
                    <p className="mt-1 text-xs text-muted-foreground">Active club administrators</p>
                  </div>
                  <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">System Admins</p>
                    <p className="mt-2 text-3xl font-semibold text-violet-500">1</p>
                    <p className="mt-1 text-xs text-muted-foreground">University administrators</p>
                  </div>
                </div>
              </Card>

              <Card className="border border-border/70 bg-card/80 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-semibold tracking-tight">System Announcements</h3>
                  <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">Live feed</Badge>
                </div>
                <div className="space-y-3">
                  {recentDashboardAnnouncements.map((item: any) => (
                    <div key={item.id} className="relative rounded-lg border border-border/70 bg-background/55 p-3.5">
                      <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-primary/80" />
                      <div className="pl-3">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight">{item.title}</p>
                          <div className="flex items-center gap-1.5">
                            {item.pinned && (
                              <Badge variant="secondary" className="text-[10px]">
                                Pinned
                              </Badge>
                            )}
                            <span className="text-[11px] text-muted-foreground">
                              {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "Recent"}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <div className="mt-2">
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );

      case "clubs":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/75 p-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operations</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Clubs Management</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manage club profiles, credentials, and activity controls from one place.</p>
              </div>
              <Button onClick={() => setShowCreateClub(true)} className="md:self-end">
                <Plus className="w-4 h-4 mr-2" />
                Add New Club
              </Button>
            </div>

            {/* Search Bar */}
            <Card className="border border-border/70 bg-card/80 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-muted-foreground">Find Clubs</h3>
                <Badge variant="outline" className="text-[10px]">{clubsGridRows.length} visible</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search clubs by name, category, or faculty..."
                  value={clubSearch}
                  onChange={(e) => setClubSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={clubStatusFilter} onValueChange={(value: any) => setClubStatusFilter(value)}>
                <SelectTrigger className="w-full md:w-[220px]">
                  <SelectValue placeholder="Club status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </Card>

            {/* Create/Edit Club Modal */}
            {(showCreateClub || editingClub) && (
              <Card className="border border-border/70 bg-card/80 p-6">
                <h3 className="text-lg font-semibold mb-1">
                  {editingClub ? "Edit Club" : "Create New Club"}
                </h3>
                <p className="mb-5 text-sm text-muted-foreground">Use structured details to create a complete, discoverable club profile.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingClub) {
                      updateClubMutation.mutate({
                        id: editingClub.id,
                        data: clubForm,
                        logoFile: clubLogoFile,
                        coverFile: clubCoverFile,
                      });
                    } else {
                      if (isClubLoginIdUnavailable) {
                        toast({
                          title: "Club ID already exists",
                          description: "Please choose a different Club ID for dashboard login.",
                          variant: "destructive",
                        });
                        return;
                      }

                      createClubMutation.mutate({
                        clubData: clubForm,
                        logoFile: clubLogoFile,
                        coverFile: clubCoverFile,
                      });
                    }
                  }}
                  className="space-y-5"
                >
                  <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Basic Details</p>
                  </div>
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
                    <Select
                      value={clubForm.category}
                      onValueChange={(value) => setClubForm(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger id="clubCategory">
                        <SelectValue placeholder="Select a club category" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubCategoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                  {!editingClub && (
                    <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Login Credentials</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!editingClub && (
                      <>
                        <div>
                          <Label htmlFor="clubLoginId">Club ID (for dashboard login)</Label>
                          <Input
                            id="clubLoginId"
                            value={clubLoginId}
                            onChange={(e) => setClubLoginId(e.target.value)}
                            placeholder="Enter club_id for login"
                            required
                          />
                          {trimmedClubLoginId.length > 0 && (
                            <p
                              className={`mt-2 text-xs ${
                                isCheckingClubLoginId
                                  ? "text-muted-foreground"
                                  : clubLoginAvailability?.available
                                    ? "text-green-500"
                                    : "text-red-500"
                              }`}
                            >
                              {isCheckingClubLoginId
                                ? "Checking Club ID availability..."
                                : clubLoginAvailability?.available
                                  ? "Club ID is available"
                                  : "Club ID already exists"}
                            </p>
                          )}
                          {isClubLoginIdUnavailable && (
                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isSuggestingClubLoginId || !clubLoginSuggestion?.suggestion}
                                onClick={() => {
                                  if (clubLoginSuggestion?.suggestion) {
                                    setClubLoginId(clubLoginSuggestion.suggestion);
                                  }
                                }}
                              >
                                {isSuggestingClubLoginId
                                  ? "Finding available Club ID..."
                                  : clubLoginSuggestion?.suggestion
                                    ? `Use suggested: ${clubLoginSuggestion.suggestion}`
                                    : "Suggest Club ID"}
                              </Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="clubLoginPassword">Password</Label>
                          <Input
                            id="clubLoginPassword"
                            type="password"
                            value={clubLoginPassword}
                            onChange={(e) => setClubLoginPassword(e.target.value)}
                            placeholder="Create a password"
                            required
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label htmlFor="clubFaculty">Faculty Assigned</Label>
                      <Input
                        id="clubFaculty"
                        value={clubForm.facultyAssigned}
                        onChange={(e) => setClubForm(prev => ({ ...prev, facultyAssigned: e.target.value }))}
                        placeholder="Enter faculty assigned"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clubPhone">Phone No</Label>
                      <Input
                        id="clubPhone"
                        value={clubForm.phone}
                        onChange={(e) => setClubForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clubEmail">Club Email</Label>
                      <Input
                        id="clubEmail"
                        type="email"
                        value={clubForm.email}
                        onChange={(e) => setClubForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="Enter email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="clubEligibility">Eligibility</Label>
                    <Input
                      id="clubEligibility"
                      value={clubForm.eligibility}
                      onChange={(e) => setClubForm(prev => ({ ...prev, eligibility: e.target.value }))}
                      placeholder="e.g., CGPA >= 7.0, No backlogs"
                    />
                  </div>
                  <div>
                    <Label>Eligibility Years</Label>
                    <div className="flex flex-wrap gap-3 mt-2">
                      {eligibilityYearOptions.map((year) => {
                        const yearId = `eligibility-year-${year}`;
                        return (
                          <label
                            key={year}
                            htmlFor={yearId}
                            className="flex items-center gap-2 rounded-md border border-border/70 px-3 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                          >
                            <Checkbox
                              id={yearId}
                              checked={clubForm.eligibilityYears.includes(year)}
                              onCheckedChange={(checked) => {
                                const isChecked = checked === true;
                                setClubForm(prev => ({
                                  ...prev,
                                  eligibilityYears: isChecked
                                    ? Array.from(new Set([...prev.eligibilityYears, year]))
                                    : prev.eligibilityYears.filter((y) => y !== year),
                                }));
                              }}
                            />
                            {year}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Brand Assets</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clubLogo">Club Logo</Label>
                      <Input
                        id="clubLogo"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setClubLogoFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setClubLogoPreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {clubLogoPreview && (
                        <div className="mt-3 flex items-center gap-2">
                          <img src={clubLogoPreview} alt="Club logo preview" className="h-20 w-20 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setClubLogoFile(null);
                              setClubLogoPreview(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="clubCover">Club Cover Photo</Label>
                      <Input
                        id="clubCover"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setClubCoverFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setClubCoverPreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      {clubCoverPreview && (
                        <div className="mt-3 flex items-center gap-2">
                          <img src={clubCoverPreview} alt="Club cover preview" className="h-20 w-24 object-cover rounded-lg" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setClubCoverFile(null);
                              setClubCoverPreview(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={
                        createClubMutation.isPending ||
                        updateClubMutation.isPending ||
                        isCheckingClubLoginId ||
                        isClubLoginIdUnavailable
                      }
                    >
                      {editingClub ? "Update Club" : "Create Club"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateClub(false);
                        setEditingClub(null);
                        setClubForm({
                          name: "",
                          description: "",
                          category: "",
                          facultyAssigned: "",
                          phone: "",
                          email: "",
                          eligibility: "",
                          eligibilityYears: [],
                        });
                        setClubLoginId("");
                        setClubLoginPassword("");
                        setClubLogoFile(null);
                        setClubLogoPreview(null);
                        setClubCoverFile(null);
                        setClubCoverPreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Clubs List */}
            {clubsGridRows.length > 0 ? (
              <>
                <Card className="p-4 border border-border/70 bg-card/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Clubs Grid</h3>
                    <span className="text-xs text-muted-foreground">Click a row to open club details and actions</span>
                  </div>
                  <div className={`${gridThemeClass}`} style={{ height: 360, width: "100%" }}>
                    <AgGridReact<ClubsGridRow>
                      rowData={clubsGridRows}
                      columnDefs={clubsGridColumns}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      animateRows
                      rowSelection="single"
                      getRowClass={(params) =>
                        params.data?.id === selectedClubGridId
                          ? "dashboard-grid-row-selected"
                          : "dashboard-grid-row"
                      }
                      pagination
                      paginationPageSize={8}
                      onRowClicked={(event: RowClickedEvent<ClubsGridRow>) => {
                        if (event.data?.id) {
                          setSelectedClubGridId(event.data.id);
                        }
                      }}
                    />
                  </div>
                </Card>

                {selectedClubFromGrid && (
                  <Card
                    className={`p-6 transition-all duration-300 ${selectedClubFromGrid.isFrozen ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{selectedClubFromGrid.name}</h3>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                            {selectedClubFromGrid.category}
                          </span>
                          {selectedClubFromGrid.isFrozen && (
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-full flex items-center gap-1 animate-in fade-in duration-300">
                              <AlertCircle className="w-3 h-3" />
                              Frozen
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mb-3">{selectedClubFromGrid.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Members: {selectedClubFromGrid.memberCount || 0}</span>
                          <span>Events: {events.filter((e) => e.clubId === selectedClubFromGrid.id).length}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedClubFromGrid.isFrozen ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const action = selectedClubFromGrid.isFrozen ? "unfreeze" : "freeze";
                            const confirmed = confirm(
                              selectedClubFromGrid.isFrozen
                                ? `Unfreeze "${selectedClubFromGrid.name}"? Club admin will be able to perform operations again.`
                                : `Freeze "${selectedClubFromGrid.name}"? This will prevent the club admin from creating events, approving members, and making changes.`,
                            );
                            if (confirmed) {
                              toggleFreezeClubMutation.mutate({
                                clubId: selectedClubFromGrid.id,
                                freeze: !selectedClubFromGrid.isFrozen,
                              });
                            }
                          }}
                          disabled={toggleFreezeClubMutation.isPending}
                          className={`
                            transition-all duration-200
                            ${selectedClubFromGrid.isFrozen
                              ? "bg-green-600 hover:bg-green-700 text-white"
                              : "border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                            }
                            ${toggleFreezeClubMutation.isPending ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                        >
                          {toggleFreezeClubMutation.isPending ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              {selectedClubFromGrid.isFrozen ? (
                                <>
                                  <CheckCircle className="w-4 h-4 mr-1" /> Unfreeze
                                </>
                              ) : (
                                <>
                                  <AlertCircle className="w-4 h-4 mr-1" /> Freeze
                                </>
                              )}
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingClub(selectedClubFromGrid);
                            setClubForm({
                              name: selectedClubFromGrid.name,
                              description: selectedClubFromGrid.description || "",
                              category: selectedClubFromGrid.category || "",
                              facultyAssigned: selectedClubFromGrid.facultyAssigned || "",
                              phone: selectedClubFromGrid.phone || "",
                              email: selectedClubFromGrid.email || "",
                              eligibility: selectedClubFromGrid.eligibility || "",
                              eligibilityYears: selectedClubFromGrid.eligibilityYears || [],
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${selectedClubFromGrid.name}"?`)) {
                              deleteClubMutation.mutate(selectedClubFromGrid.id);
                            }
                          }}
                          disabled={deleteClubMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No clubs found. Create your first club to get started.</p>
              </Card>
            )}
          </div>
        );

      case "events":
        return (
          <div className="space-y-6">
            <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card/75 p-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Calendar Ops</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">Events Management</h2>
                <p className="mt-1 text-sm text-muted-foreground">Create events, monitor status, and manage associated chat spaces.</p>
              </div>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Create/Edit Event Modal */}
            {(showCreateEvent || editingEvent) && (
              <Card className="border border-border/70 bg-card/80 p-6">
                <h3 className="text-lg font-semibold mb-1">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <p className="mb-5 text-sm text-muted-foreground">Capture complete event details so students can discover and register quickly.</p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();

                    if (editingEvent) {
                      // For edit: use FormData if new image, otherwise JSON
                      if (eventImageFile) {
                        const formData = new FormData();
                        Object.entries(eventForm).forEach(([key, value]) => {
                          if (value) formData.append(key, value);
                        });
                        formData.append("imageFile", eventImageFile);
                        updateEventMutation.mutate({
                          id: editingEvent.id,
                          data: formData,
                        });
                      } else {
                        updateEventMutation.mutate({
                          id: editingEvent.id,
                          data: eventForm,
                        });
                      }
                    } else {
                      // For create: always use FormData
                      const formData = new FormData();
                      Object.entries(eventForm).forEach(([key, value]) => {
                        if (value) formData.append(key, value);
                      });
                      if (eventImageFile) {
                        formData.append("imageFile", eventImageFile);
                      }
                      createEventMutation.mutate(formData);
                    }
                  }}
                  className="space-y-5"
                >
                  <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Core Event Details</p>
                  </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <div>
                      <Label htmlFor="eventDuration">Duration (minutes)</Label>
                      <Input
                        id="eventDuration"
                        type="number"
                        min="15"
                        step="15"
                        value={eventForm.durationMinutes}
                        onChange={(e) => setEventForm(prev => ({ ...prev, durationMinutes: e.target.value }))}
                        placeholder="120"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2 mb-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Club Ownership</p>
                    </div>
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

                  <div>
                    <div className="rounded-lg border border-border/70 bg-background/55 px-3 py-2 mb-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Poster / Media</p>
                    </div>
                    <Label htmlFor="eventImage">Event Poster/Image</Label>
                    <div className="flex gap-4">
                      <Input
                        id="eventImage"
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setEventImageFile(file);
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              setEventImagePreview(event.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    {eventImagePreview && (
                      <div className="mt-3 flex items-center gap-2">
                        <img src={eventImagePreview} alt="Event poster preview" className="h-24 w-32 object-cover rounded-lg" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setEventImageFile(null);
                            setEventImagePreview(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
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
                        setEventForm({ title: "", description: "", date: "", time: "", durationMinutes: "120", location: "", category: "", clubId: "" });
                        setEventImageFile(null);
                        setEventImagePreview(null);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Events List */}
            {eventsGridRows.length > 0 ? (
              <>
                <Card className="p-4 border border-border/70 bg-card/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Events Grid</h3>
                    <span className="text-xs text-muted-foreground">Click a row to open event details and actions</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-center mb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search events by title, category, location, or club..."
                        value={eventGridSearch}
                        onChange={(e) => setEventGridSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={eventGridStatusFilter} onValueChange={(value: any) => setEventGridStatusFilter(value)}>
                      <SelectTrigger className="w-full md:w-[220px]">
                        <SelectValue placeholder="Event status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="past">Past</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className={`${gridThemeClass}`} style={{ height: 360, width: "100%" }}>
                    <AgGridReact<EventsGridRow>
                      rowData={eventsGridRows}
                      columnDefs={eventsGridColumns}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      animateRows
                      rowSelection="single"
                      getRowClass={(params) =>
                        params.data?.id === selectedEventGridId
                          ? "dashboard-grid-row-selected"
                          : "dashboard-grid-row"
                      }
                      pagination
                      paginationPageSize={8}
                      onRowClicked={(event: RowClickedEvent<EventsGridRow>) => {
                        if (event.data?.id) {
                          setSelectedEventGridId(event.data.id);
                        }
                      }}
                    />
                  </div>
                </Card>

                {selectedEventFromGrid && (
                  <Card className="p-6 border border-border/70 bg-card/80">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{selectedEventFromGrid.title}</h3>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                            {selectedEventFromGrid.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">{selectedEventFromGrid.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(selectedEventFromGrid.date).toLocaleDateString()}</span>
                          <span className="inline-flex items-center gap-1.5"><Activity className="h-4 w-4" /> {selectedEventFromGrid.time}</span>
                          <span className="inline-flex items-center gap-1.5"><Building2 className="h-4 w-4" /> {selectedEventFromGrid.location}</span>
                          <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4" /> {selectedEventFromGrid.clubName || "Unknown Club"}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(selectedEventFromGrid);
                            setEventForm({
                              title: selectedEventFromGrid.title,
                              description: selectedEventFromGrid.description || "",
                              date: selectedEventFromGrid.date,
                              time: selectedEventFromGrid.time,
                              durationMinutes: String(selectedEventFromGrid.durationMinutes ?? 120),
                              location: selectedEventFromGrid.location,
                              category: selectedEventFromGrid.category || "",
                              clubId: selectedEventFromGrid.clubId,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${selectedEventFromGrid.title}"?`)) {
                              deleteEventMutation.mutate(selectedEventFromGrid.id);
                            }
                          }}
                          disabled={deleteEventMutation.isPending}
                        >
                          Delete
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm("This will delete all messages in the chat. This action cannot be undone.")) {
                              // Query chat groups to find the one for this event
                              apiRequest("GET", "/api/chat/groups")
                                .then((response: any) => {
                                  const eventChat = response.sections?.events?.find((g: any) => g.eventId === selectedEventFromGrid.id);
                                  if (eventChat) {
                                    deleteChatGroupMutation.mutate(eventChat.id);
                                  } else {
                                    toast({
                                      title: "Not Found",
                                      description: "No chat group found for this event.",
                                      variant: "destructive",
                                    });
                                  }
                                })
                                .catch(() => {
                                  toast({
                                    title: "Error",
                                    description: "Failed to fetch chat groups.",
                                    variant: "destructive",
                                  });
                                });
                            }
                          }}
                          disabled={deleteChatGroupMutation.isPending}
                        >
                          Delete Chat
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No events found. Create your first event to get started.</p>
              </Card>
            )}
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card/75 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Identity & Access</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">User Management</h2>
              <p className="mt-1 text-sm text-muted-foreground">Review students and club administrators, then take action from contextual detail panels.</p>
            </div>

            {/* User Statistics */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="border border-blue-500/25 bg-blue-500/10 p-5">
                <h3 className="font-semibold mb-4">Total Students</h3>
                <p className="text-3xl font-bold text-blue-500">{studentCount.count || 0}</p>
                <p className="text-sm text-muted-foreground">Registered students</p>
              </Card>
              <Card className="border border-green-500/25 bg-green-500/10 p-5">
                <h3 className="font-semibold mb-4">Club Administrators</h3>
                <p className="text-3xl font-bold text-green-500">{clubs.length}</p>
                <p className="text-sm text-muted-foreground">Active club admins</p>
              </Card>
              <Card className="border border-violet-500/25 bg-violet-500/10 p-5">
                <h3 className="font-semibold mb-4">System Administrators</h3>
                <p className="text-3xl font-bold text-purple-500">1</p>
                <p className="text-sm text-muted-foreground">University admins</p>
              </Card>
            </div>

            {/* Students Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-3">Students ({studentsGridRows.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-center">
                  <div className="relative">
                    <Input
                      placeholder="Search by name or student ID..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="pl-9"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select value={studentStatusFilter} onValueChange={(value: any) => setStudentStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder="Student status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="disabled">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {studentsGridRows.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No students found.</p>
                </Card>
              ) : (
                <>
                  <Card className="p-4 border border-border/70 bg-card/80">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Students Grid</h3>
                      <span className="text-xs text-muted-foreground">Click a row to view student details</span>
                    </div>
                    <div className={`${gridThemeClass}`} style={{ height: 400, width: "100%" }}>
                      <AgGridReact<StudentsGridRow>
                        rowData={studentsGridRows}
                        columnDefs={studentsGridColumns}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        animateRows
                        rowSelection="single"
                        getRowClass={(params) =>
                          params.data?.id === selectedStudentGridId
                            ? "dashboard-grid-row-selected"
                            : "dashboard-grid-row"
                        }
                        pagination
                        paginationPageSize={10}
                        onRowClicked={(event: RowClickedEvent<StudentsGridRow>) => {
                          if (event.data?.id) {
                            setSelectedStudentGridId(event.data.id);
                          }
                        }}
                      />
                    </div>
                  </Card>

                  {selectedStudentFromGrid && (
                    <Card className="mt-4 border border-border/70 bg-card/80 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-semibold">{selectedStudentFromGrid.name}</h3>
                            {selectedStudentFromGrid.status === "Disabled" && (
                              <Badge variant="destructive" className="text-xs">
                                {selectedStudentFromGrid.status}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-muted-foreground">Email:</p>
                              <p className="font-medium">{selectedStudentFromGrid.email}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Enrollment:</p>
                              <p className="font-medium">{selectedStudentFromGrid.enrollment}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Phone:</p>
                              <p className="font-medium">{selectedStudentFromGrid.phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Department:</p>
                              <p className="font-medium">{selectedStudentFromGrid.department}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Last Active:</p>
                              <p className="font-medium">{selectedStudentFromGrid.lastLogin}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const fullStudentRecord = students.find((student: any) => student.id === selectedStudentFromGrid.id);
                              setSelectedStudent(fullStudentRecord || selectedStudentFromGrid);
                              setIsStudentProfileOpen(true);
                            }}
                          >
                            View
                          </Button>
                          <Button
                            variant={selectedStudentFromGrid.status === "Disabled" ? "default" : "destructive"}
                            size="sm"
                            onClick={() => toggleStudentStatusMutation.mutate(selectedStudentFromGrid.id)}
                            disabled={toggleStudentStatusMutation.isPending}
                          >
                            {selectedStudentFromGrid.status === "Disabled" ? "Enable" : "Disable"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to permanently delete ${selectedStudentFromGrid.name}? This action cannot be undone.`)) {
                                deleteStudentMutation.mutate(selectedStudentFromGrid.id);
                              }
                            }}
                            disabled={deleteStudentMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>

            {/* Club Admins Section */}
            <div>
              <div className="mb-4">
                <h3 className="text-xl font-semibold mb-3">Club Administrators ({clubAdminsGridRows.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_220px] gap-3 items-center">
                  <div className="relative">
                    <Input
                      placeholder="Search by club name or description..."
                      value={clubAdminSearch}
                      onChange={(e) => setClubAdminSearch(e.target.value)}
                      className="pl-9"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  </div>
                  <Select value={clubAdminStatusFilter} onValueChange={(value: any) => setClubAdminStatusFilter(value)}>
                    <SelectTrigger className="w-full md:w-[220px]">
                      <SelectValue placeholder="Club status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="frozen">Frozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {clubAdminsGridRows.length === 0 ? (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No clubs found.</p>
                </Card>
              ) : (
                <>
                  <Card className="p-4 border border-border/70 bg-card/80">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Club Administrators Grid</h3>
                      <span className="text-xs text-muted-foreground">Click a row to view club details</span>
                    </div>
                    <div className={`${gridThemeClass}`} style={{ height: 380, width: "100%" }}>
                      <AgGridReact<ClubAdminsGridRow>
                        rowData={clubAdminsGridRows}
                        columnDefs={clubAdminsGridColumns}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        animateRows
                        rowSelection="single"
                        getRowClass={(params) =>
                          params.data?.id === selectedClubAdminGridId
                            ? "dashboard-grid-row-selected"
                            : "dashboard-grid-row"
                        }
                        pagination
                        paginationPageSize={7}
                        onRowClicked={(event: RowClickedEvent<ClubAdminsGridRow>) => {
                          if (event.data?.id) {
                            setSelectedClubAdminGridId(event.data.id);
                          }
                        }}
                      />
                    </div>
                  </Card>

                  {selectedClubAdminFromGrid && (
                    <Card className="mt-4 border border-border/70 bg-card/80 p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-3">{selectedClubAdminFromGrid.name}</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                            <div>
                              <p className="text-muted-foreground">Description:</p>
                              <p className="font-medium">{selectedClubAdminFromGrid.description}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Members:</p>
                              <p className="font-medium text-lg">{selectedClubAdminFromGrid.memberCount || 0}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Events:</p>
                              <p className="font-medium text-lg">{events.filter(e => e.clubId === selectedClubAdminFromGrid.id).length}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Created:</p>
                              <p className="font-medium">{selectedClubAdminFromGrid.createdAt ? new Date(selectedClubAdminFromGrid.createdAt).toLocaleDateString() : "—"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAdmin(selectedClubAdminFromGrid);
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
                              setSelectedAdmin(selectedClubAdminFromGrid);
                              setIsResetPasswordOpen(true);
                            }}
                          >
                            <KeyRound className="w-4 h-4 mr-2" />
                            Reset Password
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border/70 bg-card/75 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Insights</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">Analytics Dashboard</h2>
              <p className="mt-1 text-sm text-muted-foreground">Monitor category spread, trend velocity, and engagement health with a cleaner analytical canvas.</p>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border border-border/70 bg-card/85 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+12%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Clubs</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalClubs || clubs.length}</p>
              </Card>

              <Card className="border border-border/70 bg-card/85 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+25%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Events</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalEvents || events.length}</p>
              </Card>

              <Card className="border border-border/70 bg-card/85 p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">+18%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">Total Students</p>
                <p className="text-3xl font-bold">{analyticsData?.overview?.totalStudents || studentCount.count || 0}</p>
              </Card>

              <Card className="border border-border/70 bg-card/85 p-5">
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Club Distribution by Category */}
              <Card className="border border-border/70 bg-card/80 p-5">
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
              <Card className="border border-border/70 bg-card/80 p-5">
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
              <Card className="border border-border/70 bg-card/80 p-5">
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
              <Card className="border border-border/70 bg-card/80 p-5">
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
            <Card className="border border-border/70 bg-card/80 p-6">
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
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card className="border border-border/70 bg-card/80 p-5">
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

              <Card className="border border-border/70 bg-card/80 p-5">
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
            <div className="rounded-2xl border border-border/70 bg-card/75 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Communication Hub</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight">System Announcements</h2>
              <p className="mt-1 text-sm text-muted-foreground">Publish notices and manage pinned updates with clearer targeting and action controls.</p>
            </div>
            <div className="space-y-6">
              <Card className="border border-border/70 bg-card/80 p-6">
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

              <Card className="border border-border/70 bg-card/80 p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Recent Announcements</h3>
                    <span className="text-xs text-muted-foreground">{announcements.length} total</span>
                  </div>
                  
                  {announcements.length === 0 ? (
                    <div className="p-4 border rounded-lg text-center text-muted-foreground">No announcements yet.</div>
                  ) : (
                    <div className={`${gridThemeClass}`} style={{ height: 320, width: "100%" }}>
                      <AgGridReact<AnnouncementsGridRow>
                        rowData={announcementsGridRows}
                        columnDefs={announcementsGridColumns}
                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                        animateRows
                        rowSelection="single"
                        getRowClass={(params) =>
                          params.data?.id === selectedAnnouncementGridId
                            ? "dashboard-grid-row-selected"
                            : "dashboard-grid-row"
                        }
                        pagination
                        paginationPageSize={5}
                        onRowClicked={(event: RowClickedEvent<AnnouncementsGridRow>) => {
                          if (event.data?.id) {
                            setSelectedAnnouncementGridId(event.data.id);
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
                
                {/* Selected Announcement Actions */}
                {selectedAnnouncementFromGrid && (
                  <div className="mt-4 p-4 border rounded-lg bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{selectedAnnouncementFromGrid.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{selectedAnnouncementFromGrid.content}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-3">
                        {admin && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => { setEditingAnnouncement(selectedAnnouncementFromGrid); setIsEditOpen(true); }}>
                              Edit
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this announcement?')) deleteAnnouncementMutation.mutate(selectedAnnouncementFromGrid.id); }} disabled={deleteAnnouncementMutation.isPending}>
                              Delete
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => { editAnnouncementMutation.mutate({ id: selectedAnnouncementFromGrid.id, pinned: !selectedAnnouncementFromGrid.pinned }); }}>
                              {selectedAnnouncementFromGrid.pinned === "Pinned" ? 'Unpin' : 'Pin'}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
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
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/70 bg-card/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="mb-8 rounded-xl border border-border/70 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Admin Panel</p>
            <h1 className="mt-2 text-xl font-semibold leading-tight">University Admin</h1>
            <p className="mt-1 text-xs text-muted-foreground">Control clubs, events, users, and announcements</p>
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-border/70 pt-6">
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="w-full bg-background/70"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-7xl">
          {renderMainContent()}
        </div>
      </div>

      {/* Student Profile Modal */}
      <Dialog open={isStudentProfileOpen} onOpenChange={(open) => {
        setIsStudentProfileOpen(open);
        if (!open) {
          setIsEditingStudent(false);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Basic Information */}
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="flex items-center gap-2">
                    {isEditingStudent ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIsEditingStudent(false);
                            setStudentEditForm({
                              name: selectedStudent.name || "",
                              email: selectedStudent.email || "",
                              phone: selectedStudent.phone || "",
                              rollNumber: selectedStudent.rollNumber || "",
                              enrollment: selectedStudent.enrollment || "",
                              department: selectedStudent.department || selectedStudent.branch || "",
                              yearOfAdmission: selectedStudent.yearOfAdmission ? String(selectedStudent.yearOfAdmission) : "",
                            });
                          }}
                          disabled={updateStudentDetailsMutation.isPending}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const normalizedName = studentEditForm.name.trim();
                            const normalizedEmail = studentEditForm.email.trim();
                            const normalizedEnrollment = studentEditForm.enrollment.trim();
                            const normalizedPhone = studentEditForm.phone.trim();
                            const normalizedRollNumber = studentEditForm.rollNumber.trim();
                            const normalizedDepartment = studentEditForm.department.trim();
                            const normalizedYear = studentEditForm.yearOfAdmission.trim();

                            if (!normalizedName || !normalizedEmail || !normalizedEnrollment) {
                              toast({
                                title: "Missing required fields",
                                description: "Name, email, and enrollment are required.",
                                variant: "destructive",
                              });
                              return;
                            }

                            if (normalizedPhone && !/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
                              toast({
                                title: "Invalid phone",
                                description: "Phone must contain 10 to 15 digits (optional leading +).",
                                variant: "destructive",
                              });
                              return;
                            }

                            const parsedAdmissionYear = normalizedYear ? Number(normalizedYear) : null;
                            if (
                              normalizedYear &&
                              (parsedAdmissionYear === null ||
                                !Number.isInteger(parsedAdmissionYear) ||
                                parsedAdmissionYear < 2000 ||
                                parsedAdmissionYear > new Date().getFullYear() + 1)
                            ) {
                              toast({
                                title: "Invalid admission year",
                                description: "Please provide a valid admission year.",
                                variant: "destructive",
                              });
                              return;
                            }

                            updateStudentDetailsMutation.mutate({
                              studentId: selectedStudent.id,
                              name: normalizedName,
                              email: normalizedEmail,
                              phone: normalizedPhone,
                              rollNumber: normalizedRollNumber,
                              enrollment: normalizedEnrollment,
                              department: normalizedDepartment,
                              yearOfAdmission: parsedAdmissionYear ?? undefined,
                            });
                          }}
                          disabled={updateStudentDetailsMutation.isPending}
                        >
                          {updateStudentDetailsMutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => setIsEditingStudent(true)}>
                        Edit Details
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Full Name</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.name}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, name: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.name;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.name}</p>
                    )}
                    {isEditingStudent && studentEditErrors.name && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.name}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.email}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, email: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.email;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.email}</p>
                    )}
                    {isEditingStudent && studentEditErrors.email && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.email}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.phone}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, phone: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.phone;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.phone || "—"}</p>
                    )}
                    {isEditingStudent && studentEditErrors.phone && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Enrollment Number</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.enrollment}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, enrollment: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.enrollment;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.enrollment}</p>
                    )}
                    {isEditingStudent && studentEditErrors.enrollment && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.enrollment}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Roll Number</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.rollNumber}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, rollNumber: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.rollNumber;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.rollNumber || "—"}</p>
                    )}
                    {isEditingStudent && studentEditErrors.rollNumber && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.rollNumber}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Branch</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.department}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, department: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.department;
                            return updated;
                          });
                        }}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-foreground">
                        {selectedStudent.department || selectedStudent.branch || "—"}
                      </p>
                    )}
                    {isEditingStudent && studentEditErrors.department && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.department}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Admission Year</Label>
                    {isEditingStudent ? (
                      <Input
                        value={studentEditForm.yearOfAdmission}
                        onChange={(event) => {
                          setStudentEditForm((prev) => ({ ...prev, yearOfAdmission: event.target.value }));
                          setStudentEditErrors((prev) => {
                            const updated = { ...prev };
                            delete updated.yearOfAdmission;
                            return updated;
                          });
                        }}
                        className="mt-1"
                        inputMode="numeric"
                      />
                    ) : (
                      <p className="text-foreground">{selectedStudent.yearOfAdmission || "—"}</p>
                    )}
                    {isEditingStudent && studentEditErrors.yearOfAdmission && (
                      <p className="mt-1 text-xs text-destructive">{studentEditErrors.yearOfAdmission}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Current Semester</Label>
                    <p className="text-foreground">{selectedStudent.currentSemester || "Semester 1"}</p>
                    <p className="text-xs text-muted-foreground mt-1">Auto-managed every 6 months.</p>
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
                          <p className="text-xs text-muted-foreground">
                            Joined: {new Date(membership.joinedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-sm">{membership.department}</p>
                            <p className="text-xs text-muted-foreground">{membership.reason}</p>
                          </div>
                          <Badge variant={membership.status === 'approved' ? 'default' : membership.status === 'pending' ? 'secondary' : 'destructive'}>
                            {membership.status}
                          </Badge>
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
                          <p className="text-xs text-muted-foreground">
                            Registered: {new Date(registration.registeredAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <p className="text-sm">{registration.department}</p>
                            <p className="text-xs text-muted-foreground">{registration.year}</p>
                          </div>
                          <Badge 
                            variant={
                              registration.attendanceStatus === 'present' ? 'default' : 
                              registration.attendanceStatus === 'absent' ? 'destructive' : 
                              'secondary'
                            }
                          >
                            {registration.attendanceStatus || (registration.attended ? "Present" : "Pending")}
                          </Badge>
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
              {/* Club Information */}
              <Card className="p-6 bg-blue-50 dark:bg-blue-950">
                <h3 className="text-lg font-semibold mb-4">Club Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Club Name</Label>
                    <p className="text-foreground font-semibold">{selectedClubDetails?.name || selectedAdmin.name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Category</Label>
                    <p className="text-foreground">{selectedClubDetails?.category || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Members</Label>
                    <p className="text-foreground">{selectedClubDetails?.memberCount || 0}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Faculty Assigned</Label>
                    <p className="text-foreground">{selectedClubDetails?.facultyAssigned || "Not assigned"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Club Email</Label>
                    <p className="text-foreground">{selectedClubDetails?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Club Phone</Label>
                    <p className="text-foreground">{selectedClubDetails?.phone || "Not provided"}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-foreground text-sm">{selectedClubDetails?.description || "No description"}</p>
                  </div>
                </div>
              </Card>

              {/* Basic Information */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Administrator Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Username</Label>
                    <p className="text-foreground">{adminDetails.username}</p>
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .ag-theme-quartz,
        .ag-theme-quartz-dark {
          --ag-borders: none;
          --ag-border-color: hsl(var(--border) / 0.45);
          --ag-row-border-color: hsl(var(--border) / 0.35);
          --ag-header-background-color: hsl(var(--card) / 0.88);
          --ag-background-color: hsl(var(--background) / 0.65);
          border-radius: 0.85rem;
          overflow: hidden;
        }

        .dashboard-grid-row .ag-cell {
          transition: background-color 0.2s ease;
        }

        .ag-row.dashboard-grid-row:hover .ag-cell {
          background-color: hsl(var(--muted) / 0.42) !important;
        }

        .ag-row.dashboard-grid-row-selected .ag-cell {
          background-color: hsl(var(--primary) / 0.14) !important;
          box-shadow: inset 0 1px 0 hsl(var(--primary) / 0.18), inset 0 -1px 0 hsl(var(--primary) / 0.18);
        }
      `}</style>
    </div>
  );
}
