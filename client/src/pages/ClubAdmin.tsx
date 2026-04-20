import { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, RowClickedEvent, SelectionChangedEvent } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/ThemeProvider";
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
import { Calendar, Image, Users, Settings, Edit, Bell, MapPin, UserCheck, CheckCircle, Clock, TrendingUp, Activity, Award, AlertCircle, CheckSquare, Mail, Download, UserPlus, Filter, Eye, Trash2, Crown, FileText, Upload, RefreshCw, User } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { resolveMediaUrl } from "@/lib/utils";
import type { Event, Club } from "@shared/schema";
import type { ClubMembership } from "@shared/schema";
import type { Achievement } from "@shared/schema";
import type { ClubLeadership } from "@shared/schema";
import type { StudentPoints } from "@shared/schema";
import type { Message } from "@shared/schema";

type AttendanceEventRow = {
  srNo: number;
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  registrations: number;
  attended: number;
  attendanceRate: number;
};

type EventsGridRow = {
  srNo: number;
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  status: "Upcoming" | "Past";
  registrations: number;
  attended: number;
  attendanceRate: number;
};

type MembersGridRow = {
  srNo: number;
  id: string;
  studentName: string;
  enrollmentNumber: string;
  studentEmail: string;
  department: string;
  status: "pending" | "approved" | "rejected";
  joinedAt: string;
};

type MessagesGridRow = {
  srNo: number;
  id: string;
  senderName: string;
  senderEmail: string;
  enrollmentNumber: string;
  subject: string;
  sentDate: string;
  sentTime: string;
  status: "Unread" | "Read";
};

type AnnouncementsGridRow = {
  srNo: number;
  id: string;
  title: string;
  authorName: string;
  target: string;
  createdDate: string;
  status: "Unread" | "Read";
  pinned: "Pinned" | "-";
};

type AttendanceRegistrationGridRow = {
  srNo: number;
  id: string;
  studentName: string;
  enrollmentNumber: string;
  department: string;
  studentEmail: string;
  totalPoints: number;
  attendance: "Present (+10)" | "Not Marked";
  attended: boolean;
};

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
  const [eventSort, setEventSort] = useState<'date-asc' | 'date-desc' | 'title-asc' | 'title-desc' | 'registrations-desc'>('date-desc');
  const [editingClub, setEditingClub] = useState(false);
  const [editingAdminProfile, setEditingAdminProfile] = useState(false);
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
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedStudentForCertificate, setSelectedStudentForCertificate] = useState<ClubMembership | null>(null);
  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [storyCaption, setStoryCaption] = useState("");
  const [storyFile, setStoryFile] = useState<File | null>(null);
  const [storyPreview, setStoryPreview] = useState<string | null>(null);
  const [storyPreviewType, setStoryPreviewType] = useState<"image" | "video" | "text" | null>(null);
  const [storyAsHighlight, setStoryAsHighlight] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [attendanceMarkFilter, setAttendanceMarkFilter] = useState<"all" | "pending" | "present" | "absent">("all");
  const [attendanceYearFilter, setAttendanceYearFilter] = useState("all");
  const [attendanceSemesterFilter, setAttendanceSemesterFilter] = useState("all");
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
  const [selectedEventGridId, setSelectedEventGridId] = useState<string | null>(null);
  const [selectedMemberGridId, setSelectedMemberGridId] = useState<string | null>(null);
  const [selectedMessageGridId, setSelectedMessageGridId] = useState<string | null>(null);
  const [selectedAnnouncementGridId, setSelectedAnnouncementGridId] = useState<string | null>(null);
  const adminSectionsRef = useRef<HTMLDivElement | null>(null);
  const prevPendingRegCount = useRef<number | null>(null);
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();

  // Authorization check: Only club admins can access this page
  useEffect(() => {
    if (!authLoading) {
      // If not authenticated at all, redirect to club admin login
      if (!isAuthenticated) {
        setLocation("/club-admin/login");
        return;
      }
      
      // If authenticated but is university admin (no clubId), redirect to dashboard
      if (isAuthenticated && !admin?.clubId) {
        toast({
          title: "Access Denied",
          description: "University admins cannot access club admin panel. Please use the admin dashboard.",
          variant: "destructive",
        });
        setLocation("/dashboard");
        return;
      }
    }
  }, [isAuthenticated, admin?.clubId, authLoading, setLocation, toast]);

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

  const navigateToSection = (tab: string, options?: { startEditingClub?: boolean; openCreateEvent?: boolean }) => {
    if (club?.isFrozen) return;

    setActiveTab(tab);

    if (options?.startEditingClub) {
      setEditingClub(true);
    }

    if (options?.openCreateEvent) {
      setCreatingEvent(true);
    }

    requestAnimationFrame(() => {
      adminSectionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

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
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      // Try API first, fallback to static data
      try {
        const res = await apiRequest("GET", `/api/events?clubId=${admin.clubId}`);
        return res.json();
      } catch (error) {
        return staticEvents.filter(e => e.clubId === admin?.clubId);
      }
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 15000,
  });

  const { data: memberships = [] } = useQuery<ClubMembership[]>({
    queryKey: ["/api/admin/club-memberships", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      try {
        const res = await apiRequest("GET", `/api/admin/club-memberships/${admin.clubId}`);
        const apiMemberships = await res.json();
        
        // Merge with locally stored pending requests
        const pendingRequests = safeParseArray(localStorage.getItem("pendingJoinRequests"));
        const localRequests = pendingRequests
          .filter((req: any) => req.clubId === admin.clubId && req.isFallback)
          .map((req: any) => ({
            id: req.id,
            studentName: req.studentName,
            studentEmail: req.studentEmail,
            enrollmentNumber: req.enrollmentNumber,
            department: req.department,
            reason: req.reason,
            clubId: req.clubId,
            clubName: req.clubName,
            status: req.status,
            joinedAt: req.createdAt,
            isFallback: true
          }));
        
        return [...apiMemberships, ...localRequests];
      } catch (error) {
        // Fallback: return locally stored pending requests
        const pendingRequests = safeParseArray(localStorage.getItem("pendingJoinRequests"));
        return pendingRequests
          .filter((req: any) => req.clubId === admin?.clubId && req.isFallback)
          .map((req: any) => ({
            id: req.id,
            studentName: req.studentName,
            studentEmail: req.studentEmail,
            enrollmentNumber: req.enrollmentNumber,
            department: req.department,
            reason: req.reason,
            clubId: req.clubId,
            clubName: req.clubName,
            status: req.status,
            joinedAt: req.createdAt,
            isFallback: true
          }));
      }
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  // Filter events for this club (safe guard)
  const clubEvents = events?.filter(event => event.clubId === admin?.clubId) || [];

  const { data: eventRegistrations = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/event-registrations", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/event-registrations/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  const { data: pagedEventRegistrations, isLoading: pagedEventRegistrationsLoading } = useQuery<{
    items: any[];
    pagination?: { total: number; page: number; limit: number; totalPages: number };
  }>({
    queryKey: [
      "/api/admin/event-registrations/paged",
      admin?.clubId,
      expandedEventId,
      attendancePage,
      attendanceSearch,
      attendanceStatusFilter,
      attendanceMarkFilter,
      attendanceYearFilter,
      attendanceSemesterFilter,
      activeTab,
    ],
    queryFn: async () => {
      if (!admin?.clubId || !expandedEventId) {
        return { items: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
      }

      const params = new URLSearchParams({
        eventId: expandedEventId,
        page: String(attendancePage),
        limit: "50",
      });

      if (attendanceSearch.trim()) {
        params.set("search", attendanceSearch.trim());
      }
      if (attendanceStatusFilter !== "all") {
        params.set("status", attendanceStatusFilter);
      }
      if (attendanceMarkFilter !== "all") {
        params.set("attendanceStatus", attendanceMarkFilter);
      }
      if (attendanceYearFilter !== "all") {
        params.set("year", attendanceYearFilter);
      }
      if (attendanceSemesterFilter !== "all") {
        params.set("semester", attendanceSemesterFilter);
      }

      const res = await apiRequest("GET", `/api/admin/event-registrations/${admin.clubId}?${params.toString()}`);
      const data = await res.json();
      return data?.items ? data : { items: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
    },
    enabled: !!admin?.clubId && !!expandedEventId && activeTab === "attendance" && isAuthenticated && !authLoading,
  });

  const currentEventRegistrations = pagedEventRegistrations?.items || [];
  const currentEventRegistrationsPagination = pagedEventRegistrations?.pagination || {
    total: 0,
    page: attendancePage,
    limit: 50,
    totalPages: 0,
  };

  const attendanceYearOptions = useMemo(() => {
    const source = (eventRegistrations || []).filter((registration: any) => registration.eventId === expandedEventId);
    const uniqueYears = new Set(
      source
        .map((registration: any) => String(registration.year || "").trim())
        .filter(Boolean),
    );

    return Array.from(uniqueYears).sort((a, b) => {
      const aNum = Number.parseInt(a, 10);
      const bNum = Number.parseInt(b, 10);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.localeCompare(b);
    });
  }, [eventRegistrations, expandedEventId]);

  const attendanceSemesterOptions = useMemo(() => {
    const source = (eventRegistrations || []).filter((registration: any) => registration.eventId === expandedEventId);
    const uniqueSemesters = new Set(
      source
        .map((registration: any) => String(registration.semester || "").trim())
        .filter(Boolean),
    );

    return Array.from(uniqueSemesters).sort((a, b) => {
      const aNumMatch = a.match(/\d+/);
      const bNumMatch = b.match(/\d+/);
      const aNum = aNumMatch ? Number.parseInt(aNumMatch[0], 10) : Number.NaN;
      const bNum = bNumMatch ? Number.parseInt(bNumMatch[0], 10) : Number.NaN;

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum;
      }

      return a.localeCompare(b);
    });
  }, [eventRegistrations, expandedEventId]);

  useEffect(() => {
    setAttendancePage(1);
    setSelectedAttendanceIds([]);
  }, [expandedEventId, attendanceSearch, attendanceStatusFilter, attendanceMarkFilter, attendanceYearFilter, attendanceSemesterFilter]);

  const { data: announcements = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/announcements");
      return res.json();
    },
    enabled: isAuthenticated && !authLoading,
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/admin/achievements", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/achievements/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  const { data: leadership = [] } = useQuery<ClubLeadership[]>({
    queryKey: ["/api/club-leadership", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/club-leadership/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  const { data: studentPoints = [] } = useQuery<StudentPoints[]>({
    queryKey: ["/api/admin/student-points", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/admin/student-points/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  const { data: globalLeaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/global-points-leaderboard"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/global-points-leaderboard");
      return res.json();
    },
    enabled: isAuthenticated && !authLoading,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/clubs", admin?.clubId, "messages"],
    queryFn: async () => {
      if (!admin?.clubId) return [];
      const res = await apiRequest("GET", `/api/clubs/${admin.clubId}/messages`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
  });

  const { data: myStories = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/stories/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/stories/my");
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated && !authLoading,
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

  const handleStoryFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setStoryFile(file);
      setStoryPreview((previous) => {
        if (previous?.startsWith("blob:")) {
          URL.revokeObjectURL(previous);
        }
        return URL.createObjectURL(file);
      });
      setStoryPreviewType(file.type.startsWith("video/") ? "video" : "image");
    }
  };

  useEffect(() => {
    return () => {
      if (storyPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(storyPreview);
      }
    };
  }, [storyPreview]);

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

  const formatDate = (value?: string | Date) => {
    if (!value) return "Date TBA";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date TBA";
    return date.toLocaleDateString();
  };

  const safeParseArray = (value: string | null) => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
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
      'Join Date': formatDate(member.joinedAt),
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
    a.download = `${displayClub?.name || 'Club'}_Members_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const updateMembershipStatusMutation = useMutation({
    mutationFn: async ({ membershipId, status }: { membershipId: string; status: string }) => {
      // Check if club is frozen
      if (club?.isFrozen) {
        throw new Error("Cannot update membership status - club is frozen");
      }
      
      // Check if this is a locally stored request
      if (membershipId.startsWith('pending-')) {
        // Update localStorage
        const pendingRequests = safeParseArray(localStorage.getItem("pendingJoinRequests"));
        const updatedRequests = pendingRequests.map((req: any) => 
          req.id === membershipId ? { ...req, status } : req
        );
        localStorage.setItem("pendingJoinRequests", JSON.stringify(updatedRequests));
        return { success: true, membership: { id: membershipId, status } };
      } else {
        // Regular API call
        const res = await apiRequest("PATCH", `/api/admin/club-memberships/${membershipId}`, { status });
        return res.json();
      }
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
    mutationFn: async ({ registrationId, attended }: { registrationId: string; attended: boolean }) => {
      const res = await apiRequest("POST", "/api/admin/event-registrations/batch-attendance", {
        updates: [{ registrationId, attended }],
      });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations/paged", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-points", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-points-leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/registrations"] });
      toast({
        title: "Attendance updated",
        description: variables.attended
          ? "Attendance marked as present and points awarded."
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

  const batchAttendanceMutation = useMutation({
    mutationFn: async ({ attended, registrationIds }: { attended: boolean; registrationIds: string[] }) => {
      const res = await apiRequest("POST", "/api/admin/event-registrations/batch-attendance", {
        updates: registrationIds.map((registrationId) => ({ registrationId, attended })),
      });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      setSelectedAttendanceIds([]);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations/paged", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-points", admin?.clubId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/global-points-leaderboard"] });
      toast({
        title: "Batch attendance updated",
        description: `${variables.registrationIds.length} registrations marked as ${variables.attended ? "present" : "absent"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Batch update failed",
        description: "Failed to update attendance for selected students.",
        variant: "destructive",
      });
    },
  });

  const updateRegistrationStatusMutation = useMutation({
    mutationFn: async ({ registrationId, status }: { registrationId: string; status: 'pending' | 'approved' | 'rejected' }) => {
      const res = await apiRequest("PATCH", `/api/admin/event-registrations/${registrationId}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/event-registrations", admin?.clubId] });
      toast({
        title: "Registration updated",
        description: "Event registration status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update failed",
        description: "Failed to update registration status.",
        variant: "destructive",
      });
    },
  });

  const deleteMembershipMutation = useMutation({
    mutationFn: async (membershipId: string) => {
      // Check if this is a locally stored request
      if (membershipId.startsWith('pending-')) {
        // Remove from localStorage
        const pendingRequests = safeParseArray(localStorage.getItem("pendingJoinRequests"));
        const updatedRequests = pendingRequests.filter((req: any) => req.id !== membershipId);
        localStorage.setItem("pendingJoinRequests", JSON.stringify(updatedRequests));
        return { success: true };
      } else {
        // Regular API call
        await apiRequest("DELETE", `/api/admin/club-memberships/${membershipId}`);
      }
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

  const uploadCertificateMutation = useMutation({
    mutationFn: async ({ studentId, title, file }: { studentId: string; title: string; file: File }) => {
      console.log("Uploading certificate:", { studentId, title, fileName: file.name, fileSize: file.size });
      
      const formData = new FormData();
      formData.append("certificate", file);
      formData.append("title", title);
      formData.append("studentId", studentId);
      formData.append("clubId", admin?.clubId || "");
      formData.append("clubName", displayClub?.name || "");

      const res = await apiRequest("POST", "/api/admin/upload-certificate", formData);
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Certificate upload success:", data);
      toast({
        title: "Success",
        description: "Certificate uploaded successfully.",
      });
      setShowCertificateModal(false);
      setCertificateTitle("");
      setCertificateFile(null);
      setSelectedStudentForCertificate(null);
    },
    onError: (error) => {
      console.error("Certificate upload error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload certificate.",
        variant: "destructive",
      });
    },
  });

  const handleUploadCertificate = () => {
    if (!selectedStudentForCertificate || !certificateTitle || !certificateFile) {
      toast({
        title: "Error",
        description: "Please provide certificate title and file.",
        variant: "destructive",
      });
      return;
    }

    if (!admin?.clubId) {
      toast({
        title: "Error",
        description: "You must be logged in as a club admin to upload certificates.",
        variant: "destructive",
      });
      return;
    }

    uploadCertificateMutation.mutate({
      studentId: selectedStudentForCertificate.enrollmentNumber,
      title: certificateTitle,
      file: certificateFile,
    });
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/club-admin/login");
    } else if (!authLoading && isAuthenticated && !admin?.clubId) {
      // If admin doesn't have a club, redirect to general dashboard or show message
      setLocation("/dashboard");
    }
  }, [authLoading, isAuthenticated, admin, setLocation]);

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", admin?.clubId] });
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

  const deleteEventChatMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const groupsRes = await apiRequest("GET", "/api/chat/groups");
      const groupsData = await groupsRes.json();
      const eventChat = groupsData?.sections?.events?.find((group: any) => group.eventId === eventId);

      if (!eventChat?.id) {
        throw new Error("No chat group found for this event.");
      }

      await apiRequest("DELETE", `/api/chat/groups/${eventChat.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/groups"] });
      toast({
        title: "Chat deleted",
        description: "Event chat deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete event chat.",
        variant: "destructive",
      });
    },
  });

  const createStoryMutation = useMutation({
    mutationFn: async (payload: { caption: string; isHighlight: boolean; file?: File | null }) => {
      let mediaUrl = "";
      let mediaType: "image" | "video" | "text" = "text";

      if (payload.file) {
        const formData = new FormData();
        formData.append("file", payload.file);
        formData.append("type", "club-story");

        const uploadRes = await apiRequest("POST", "/api/upload", formData);
        const uploadData = await uploadRes.json();
        mediaUrl = uploadData.url;
        mediaType = payload.file.type.startsWith("video/") ? "video" : "image";
      }

      const res = await apiRequest("POST", "/api/admin/stories", {
        mediaUrl,
        mediaType,
        caption: payload.caption,
        isHighlight: payload.isHighlight,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/highlights"] });
      setStoryCaption("");
      setStoryFile(null);
      setStoryPreview(null);
      setStoryPreviewType(null);
      setStoryAsHighlight(true);
      toast({
        title: "Story uploaded",
        description: "Your story is now live for 24 hours.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to upload story.",
        variant: "destructive",
      });
    },
  });

  const toggleStoryHighlightMutation = useMutation({
    mutationFn: async (payload: { storyId: string; isHighlight: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/stories/${payload.storyId}`, {
        isHighlight: payload.isHighlight,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/highlights"] });
    },
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (storyId: string) => {
      await apiRequest("DELETE", `/api/admin/stories/${storyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stories/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/highlights"] });
      toast({
        title: "Story deleted",
        description: "The story was removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete story.",
        variant: "destructive",
      });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: async (data: { clubData: Partial<Club>; logoFile?: File }) => {
      if (!club?.id) throw new Error("No club ID");
      if (club?.isFrozen) throw new Error("Cannot update club settings - club is frozen");

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

  const updateAdminProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; phone: string }) => {
      if (club?.isFrozen) throw new Error("Cannot update profile - club is frozen");
      return await apiRequest("PATCH", "/api/admin/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setEditingAdminProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile.",
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

  const markAnnouncementAsReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      await apiRequest("PUT", `/api/announcements/${announcementId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/announcements"] });
    },
  });
  
  const showAuthLoading = authLoading;
  const showRedirect = !authLoading && (!isAuthenticated || !admin || !admin.clubId);
  const canRenderDashboard = !authLoading && isAuthenticated && !!admin?.clubId;

  // We always have fallback data from staticClubs, so just render
  // Use club data if available, otherwise use static fallback
  const displayClub = club || staticClubs.find(c => c.id === admin?.clubId) || staticClubs[0];
  const effectiveClubId = admin?.clubId || displayClub?.id;

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
      value: memberships.filter(m => m.status === 'approved').length.toString(),
      trend: `${memberships.filter(m => m.status === 'pending').length} pending`,
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
    const memberCount = displayClub?.memberCount || 0;
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

  const healthScore = club ? calculateHealthScore() : 0;
  const healthStatus = healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : healthScore >= 40 ? "Fair" : "Needs Attention";

  // Count unread messages and announcements
  useEffect(() => {
    const unreadMsgCount = messages.filter((msg: Message) => !msg.read).length;
    setUnreadMessages(unreadMsgCount);
  }, [messages]);

  useEffect(() => {
    const unreadAnnounceCount = announcements.filter((ann: any) => !ann.isRead).length;
    setUnreadAnnouncements(unreadAnnounceCount);
  }, [announcements]);

  useEffect(() => {
    const pendingCount = eventRegistrations.filter(r => !r.status || r.status === 'pending').length;
    if (prevPendingRegCount.current !== null && pendingCount > prevPendingRegCount.current) {
      const diff = pendingCount - prevPendingRegCount.current;
      toast({
        title: "New registration request",
        description: diff === 1 ? "1 new event registration request." : `${diff} new event registration requests.`,
      });
    }
    prevPendingRegCount.current = pendingCount;
  }, [eventRegistrations, toast]);

  const attendanceRegistrationsGridRows = useMemo<AttendanceRegistrationGridRow[]>(() => {
    return currentEventRegistrations.map((registration: any, index: number) => {
      const studentGlobalData = globalLeaderboard.find((sp) => sp.studentEmail === registration.studentEmail);
      return {
        srNo: index + 1,
        id: registration.id,
        studentName: registration.studentName,
        enrollmentNumber: registration.enrollmentNumber,
        department: registration.department,
        studentEmail: registration.studentEmail,
        totalPoints: studentGlobalData?.totalPoints || 0,
        attendance: registration.attended ? "Present (+10)" : "Not Marked",
        attended: !!registration.attended,
      };
    });
  }, [currentEventRegistrations, globalLeaderboard]);

  const attendanceRegistrationsGridColumns = useMemo<ColDef<AttendanceRegistrationGridRow>[]>(() => [
    {
      colId: "select",
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 60,
      pinned: "left",
    },
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "studentName", headerName: "Student", flex: 1.1, minWidth: 180 },
    { field: "enrollmentNumber", headerName: "Enrollment", minWidth: 150 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "studentEmail", headerName: "Email", flex: 1.2, minWidth: 220 },
    {
      field: "totalPoints",
      headerName: "Total Points",
      minWidth: 130,
      valueFormatter: (params) => `${params.value ?? 0} pts`,
    },
    {
      field: "attendance",
      headerName: "Attendance",
      minWidth: 130,
      cellClass: (params) => (params.data?.attended ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"),
    },
    {
      field: "attended",
      headerName: "Action",
      minWidth: 140,
      sortable: false,
      filter: false,
      cellRenderer: (params: any) => {
        const row = params.data as AttendanceRegistrationGridRow;
        const disabled = updateAttendanceMutation.isPending || batchAttendanceMutation.isPending;
        const label = row?.attended ? "Mark Absent" : "Mark Present";
        const className = row?.attended
          ? "px-3 py-1 text-xs rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          : "px-3 py-1 text-xs rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50";

        return (
          <button
            type="button"
            className={className}
            disabled={disabled}
            onClick={() =>
              updateAttendanceMutation.mutate({
                registrationId: row.id,
                attended: !row.attended,
              })
            }
          >
            {label}
          </button>
        );
      },
    },
  ], [batchAttendanceMutation.isPending, updateAttendanceMutation]);

  const eventRegistrationStats = useMemo(() => {
    const stats = new Map<string, { registrations: number; attended: number }>();
    for (const registration of eventRegistrations) {
      const current = stats.get(registration.eventId) || { registrations: 0, attended: 0 };
      current.registrations += 1;
      if (registration.attended) current.attended += 1;
      stats.set(registration.eventId, current);
    }
    return stats;
  }, [eventRegistrations]);

  const attendanceEventRows = useMemo<AttendanceEventRow[]>(() => {
    return clubEvents.map((event, index) => {
      const stats = eventRegistrationStats.get(event.id) || { registrations: 0, attended: 0 };
      const attendanceRate = stats.registrations > 0
        ? Math.round((stats.attended / stats.registrations) * 100)
        : 0;

      return {
        srNo: index + 1,
        id: event.id,
        title: event.title,
        date: formatDate(event.date),
        time: event.time || "Time TBA",
        location: event.location || "Location TBA",
        registrations: stats.registrations,
        attended: stats.attended,
        attendanceRate,
      };
    });
  }, [clubEvents, eventRegistrationStats]);

  const attendanceGridColumns = useMemo<ColDef<AttendanceEventRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "title", headerName: "Event", flex: 1.4, minWidth: 220 },
    { field: "date", headerName: "Date", minWidth: 120 },
    { field: "time", headerName: "Time", minWidth: 130 },
    { field: "location", headerName: "Location", flex: 1, minWidth: 180 },
    { field: "registrations", headerName: "Registered", minWidth: 120 },
    { field: "attended", headerName: "Attended", minWidth: 110 },
    {
      field: "attendanceRate",
      headerName: "Rate",
      minWidth: 100,
      valueFormatter: (params) => `${params.value ?? 0}%`,
    },
  ], []);

  const selectedAttendanceEvent = useMemo(
    () => clubEvents.find((event) => event.id === expandedEventId) || null,
    [clubEvents, expandedEventId],
  );

  const filteredSortedEvents = useMemo(() => {
    return clubEvents
      .filter((event) => {
        if (eventSearch) {
          const searchLower = eventSearch.toLowerCase();
          return (
            event.title.toLowerCase().includes(searchLower) ||
            event.description?.toLowerCase().includes(searchLower) ||
            event.location?.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter((event) => {
        const eventDate = new Date(event.date || new Date());
        const now = new Date();
        switch (eventFilter) {
          case "upcoming":
            return eventDate > now;
          case "past":
            return eventDate <= now;
          default:
            return true;
        }
      })
      .sort((a, b) => {
        switch (eventSort) {
          case "date-asc":
            return new Date(a.date || new Date()).getTime() - new Date(b.date || new Date()).getTime();
          case "date-desc":
            return new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime();
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          case "registrations-desc": {
            const aRegs = eventRegistrations.filter((registration) => registration.eventId === a.id).length;
            const bRegs = eventRegistrations.filter((registration) => registration.eventId === b.id).length;
            return bRegs - aRegs;
          }
          default:
            return new Date(b.date || new Date()).getTime() - new Date(a.date || new Date()).getTime();
        }
      });
  }, [clubEvents, eventFilter, eventRegistrations, eventSearch, eventSort]);

  const eventsGridRows = useMemo<EventsGridRow[]>(() => {
    return filteredSortedEvents.map((event, index) => {
      const eventRegs = eventRegistrations.filter((registration) => registration.eventId === event.id);
      const attended = eventRegs.filter((registration) => registration.attended).length;
      const isUpcoming = new Date(event.date || new Date()) > new Date();

      return {
        srNo: index + 1,
        id: event.id,
        title: event.title,
        date: formatDate(event.date),
        time: event.time || "Time TBA",
        location: event.location || "Location TBA",
        status: isUpcoming ? "Upcoming" : "Past",
        registrations: eventRegs.length,
        attended,
        attendanceRate: eventRegs.length > 0 ? Math.round((attended / eventRegs.length) * 100) : 0,
      };
    });
  }, [filteredSortedEvents, eventRegistrations]);

  const eventsGridColumns = useMemo<ColDef<EventsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "title", headerName: "Event", flex: 1.4, minWidth: 220 },
    { field: "date", headerName: "Date", minWidth: 120 },
    { field: "time", headerName: "Time", minWidth: 120 },
    { field: "location", headerName: "Location", flex: 1, minWidth: 180 },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "registrations", headerName: "Registered", minWidth: 120 },
    {
      field: "attendanceRate",
      headerName: "Attendance",
      minWidth: 120,
      valueFormatter: (params) => `${params.value ?? 0}%`,
    },
  ], []);

  const filteredMembers = useMemo(() => {
    return memberships
      .filter((membership) => {
        if (memberSearch) {
          const searchLower = memberSearch.toLowerCase();
          return (
            membership.studentName.toLowerCase().includes(searchLower) ||
            membership.studentEmail.toLowerCase().includes(searchLower) ||
            membership.enrollmentNumber.toLowerCase().includes(searchLower) ||
            membership.department.toLowerCase().includes(searchLower)
          );
        }
        return true;
      })
      .filter((membership) => memberFilter === "all" || membership.status === memberFilter)
      .sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      });
  }, [memberFilter, memberSearch, memberships]);

  const membersGridRows = useMemo<MembersGridRow[]>(() => {
    return filteredMembers.map((membership, index) => ({
      srNo: index + 1,
      id: membership.id,
      studentName: membership.studentName,
      enrollmentNumber: membership.enrollmentNumber,
      studentEmail: membership.studentEmail,
      department: membership.department,
      status: membership.status,
      joinedAt: formatDate(membership.joinedAt),
    }));
  }, [filteredMembers]);

  const membersGridColumns = useMemo<ColDef<MembersGridRow>[]>(() => [
    {
      colId: "select",
      headerName: "",
      checkboxSelection: true,
      headerCheckboxSelection: true,
      width: 60,
      pinned: "left",
    },
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "studentName", headerName: "Name", flex: 1.2, minWidth: 180 },
    { field: "enrollmentNumber", headerName: "Enrollment", minWidth: 140 },
    { field: "studentEmail", headerName: "Email", flex: 1.2, minWidth: 220 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "status", headerName: "Status", minWidth: 120 },
    { field: "joinedAt", headerName: "Joined", minWidth: 120 },
  ], []);

  const selectedEventFromGrid = useMemo(
    () => filteredSortedEvents.find((event) => event.id === selectedEventGridId) || null,
    [filteredSortedEvents, selectedEventGridId],
  );

  const selectedMemberFromGrid = useMemo(
    () => filteredMembers.find((membership) => membership.id === selectedMemberGridId) || null,
    [filteredMembers, selectedMemberGridId],
  );

  const messagesGridRows = useMemo<MessagesGridRow[]>(() => {
    return [...messages]
      .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
      .map((message, index) => ({
        srNo: index + 1,
        id: message.id,
        senderName: message.senderName,
        senderEmail: message.senderEmail,
        enrollmentNumber: message.enrollmentNumber,
        subject: message.subject,
        sentDate: formatDate(message.sentAt),
        sentTime: new Date(message.sentAt).toLocaleTimeString(),
        status: message.read ? "Read" : "Unread",
      }));
  }, [messages]);

  const messagesGridColumns = useMemo<ColDef<MessagesGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "senderName", headerName: "Student", flex: 1.1, minWidth: 170 },
    { field: "subject", headerName: "Subject", flex: 1.2, minWidth: 220 },
    { field: "senderEmail", headerName: "Email", flex: 1.2, minWidth: 220 },
    { field: "enrollmentNumber", headerName: "Enrollment", minWidth: 140 },
    { field: "sentDate", headerName: "Date", minWidth: 120 },
    { field: "sentTime", headerName: "Time", minWidth: 120 },
    { field: "status", headerName: "Status", minWidth: 110 },
  ], []);

  const selectedMessageFromGrid = useMemo(
    () => messages.find((message) => message.id === selectedMessageGridId) || null,
    [messages, selectedMessageGridId],
  );

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a: any, b: any) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [announcements]);

  const announcementsGridRows = useMemo<AnnouncementsGridRow[]>(() => {
    return sortedAnnouncements.map((announcement: any, index: number) => ({
      srNo: index + 1,
      id: announcement.id,
      title: announcement.title,
      authorName: announcement.authorName,
      target: announcement.target || "all",
      createdDate: formatDate(announcement.createdAt),
      status: announcement.isRead ? "Read" : "Unread",
      pinned: announcement.pinned ? "Pinned" : "-",
    }));
  }, [sortedAnnouncements]);

  const announcementsGridColumns = useMemo<ColDef<AnnouncementsGridRow>[]>(() => [
    { field: "srNo", headerName: "Sr No", minWidth: 90, maxWidth: 110, sortable: false, filter: false },
    { field: "title", headerName: "Title", flex: 1.5, minWidth: 260 },
    { field: "authorName", headerName: "Author", minWidth: 150 },
    { field: "target", headerName: "Target", minWidth: 110 },
    { field: "pinned", headerName: "Pinned", minWidth: 95 },
    { field: "status", headerName: "Status", minWidth: 110 },
    { field: "createdDate", headerName: "Date", minWidth: 120 },
  ], []);

  const selectedAnnouncementFromGrid = useMemo(
    () => sortedAnnouncements.find((announcement: any) => announcement.id === selectedAnnouncementGridId) || null,
    [selectedAnnouncementGridId, sortedAnnouncements],
  );

  const leadershipPositions = useMemo(
    () => [
      { key: "president", title: "President", description: "Overall club leadership and representation" },
      { key: "vice-president", title: "Vice President", description: "Supports president and handles operations" },
      { key: "secretary", title: "Secretary", description: "Manages communications and records" },
      { key: "treasurer", title: "Treasurer", description: "Handles financial matters and budgeting" },
      { key: "event-coordinator", title: "Event Coordinator", description: "Organizes and manages club events" },
      { key: "public-relations", title: "Public Relations", description: "Manages publicity and member outreach" },
      { key: "member", title: "Member Representative", description: "Represents member interests and feedback" },
    ],
    [],
  );

  const leadershipByRole = useMemo(() => {
    const normalizeLeadershipRoleKey = (role: string) => {
      const normalized = role.trim().toLowerCase().replace(/\s+/g, "-");
      if (normalized === "member-representative") return "member";
      return normalized;
    };

    const map = new Map<string, ClubLeadership[]>();
    leadership.forEach((leader) => {
      const roleKey = normalizeLeadershipRoleKey(leader.role || "");
      if (!roleKey) return;
      const existing = map.get(roleKey) || [];
      existing.push(leader);
      map.set(roleKey, existing);
    });
    return map;
  }, [leadership]);

  const activeLeadersCount = useMemo(() => {
    return new Set(leadership.map((leader) => leader.studentEmail || `${leader.studentName}-${leader.role}`)).size;
  }, [leadership]);

  useEffect(() => {
    if (selectedEventGridId && !filteredSortedEvents.some((event) => event.id === selectedEventGridId)) {
      setSelectedEventGridId(null);
    }
  }, [filteredSortedEvents, selectedEventGridId]);

  useEffect(() => {
    if (selectedMemberGridId && !filteredMembers.some((membership) => membership.id === selectedMemberGridId)) {
      setSelectedMemberGridId(null);
    }
  }, [filteredMembers, selectedMemberGridId]);

  useEffect(() => {
    if (selectedMessageGridId && !messages.some((message) => message.id === selectedMessageGridId)) {
      setSelectedMessageGridId(null);
    }
  }, [messages, selectedMessageGridId]);

  useEffect(() => {
    if (
      selectedAnnouncementGridId &&
      !sortedAnnouncements.some((announcement: any) => announcement.id === selectedAnnouncementGridId)
    ) {
      setSelectedAnnouncementGridId(null);
    }
  }, [selectedAnnouncementGridId, sortedAnnouncements]);

  const attendanceGridThemeClass = theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

  return (
    <div className="min-h-screen py-16 md:py-20 bg-background">
      {showAuthLoading && (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground font-body">Loading authentication...</p>
        </div>
      )}

      {showRedirect && (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground font-body">Redirecting...</p>
        </div>
      )}

      {canRenderDashboard && (
        <>
          {isRefreshing && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-background border border-border rounded-lg p-8 text-center">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">Refreshing data...</p>
              </div>
            </div>
          )}
          <div className="container mx-auto px-4">
        {/* Frozen Club Alert */}
        {club?.isFrozen && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200">Club Frozen</h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  This club has been frozen by university administration. You cannot create or modify events, approve memberships, or perform other operations until the club is unfrozen.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {displayClub?.logoUrl && (
              <img
                src={resolveMediaUrl(displayClub?.logoUrl)}
                alt={`${displayClub?.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {displayClub?.name || 'Club'} Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage your club's events, content, and settings
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: <span className="font-medium">{admin?.username}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  // Set all queries to stale so they refetch
                  queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/events", admin?.clubId] });
                  queryClient.invalidateQueries({ queryKey: ["/api/admin"] });
                  
                  // Wait a bit for refetch to complete
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  
                  toast({
                    title: "Refreshed",
                    description: "All data has been refreshed successfully.",
                  });
                } catch (error) {
                  console.error("Refresh failed:", error);
                  toast({
                    title: "Refresh failed",
                    description: "Failed to refresh data. Please try again.",
                    variant: "destructive",
                  });
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              title="Refresh all data"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              Logout
            </Button>
          </div>
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
                onClick={() => navigateToSection("events", { openCreateEvent: true })}
                className="h-auto p-4 flex flex-col items-center gap-2 border-border/80 bg-card hover:bg-blue-500/10 hover:border-blue-500/40 transition-colors disabled:bg-card disabled:border-border/60"
                variant="outline"
                disabled={club?.isFrozen}
                title={club?.isFrozen ? "Cannot create events - club is frozen" : "Create a new event"}
              >
                <Calendar className="w-6 h-6 text-blue-600" />
                <span className="text-sm font-medium">Create Event</span>
              </Button>
              <Button
                onClick={() => {
                  navigateToSection("settings", { startEditingClub: true });
                }}
                className="h-auto p-4 flex flex-col items-center gap-2 border-border/80 bg-card hover:bg-emerald-500/10 hover:border-emerald-500/40 transition-colors"
                variant="outline"
              >
                <Edit className="w-6 h-6 text-green-600" />
                <span className="text-sm font-medium">Edit Club</span>
              </Button>
              <Button
                onClick={() => navigateToSection("members")}
                className="h-auto p-4 flex flex-col items-center gap-2 border-border/80 bg-card hover:bg-violet-500/10 hover:border-violet-500/40 transition-colors"
                variant="outline"
              >
                <Users className="w-6 h-6 text-purple-600" />
                <span className="text-sm font-medium">Manage Members</span>
              </Button>
              <Button
                onClick={() => navigateToSection("attendance")}
                className="h-auto p-4 flex flex-col items-center gap-2 border-border/80 bg-card hover:bg-orange-500/10 hover:border-orange-500/40 transition-colors"
                variant="outline"
              >
                <CheckSquare className="w-6 h-6 text-orange-600" />
                <span className="text-sm font-medium">Track Attendance</span>
              </Button>
              <Button
                onClick={() => navigateToSection("stories")}
                className="h-auto p-4 flex flex-col items-center gap-2 border-border/80 bg-card hover:bg-indigo-500/10 hover:border-indigo-500/40 transition-colors disabled:bg-card disabled:border-border/60"
                variant="outline"
                disabled={club?.isFrozen}
                title={club?.isFrozen ? "Cannot upload stories - club is frozen" : "Upload club stories"}
              >
                <Upload className="w-6 h-6 text-indigo-600" />
                <span className="text-sm font-medium">Upload Story</span>
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
                        {formatDate(event.date)} G�� {eventRegistrations.filter(r => r.eventId === event.id).length} registrations
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

        <div ref={adminSectionsRef}>
        <Tabs value={activeTab} onValueChange={club?.isFrozen ? undefined : setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full grid-cols-11 relative transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
            <TabsTrigger value="dashboard" disabled={club?.isFrozen}>Dashboard</TabsTrigger>
            <TabsTrigger value="events" disabled={club?.isFrozen}>Events</TabsTrigger>
            <TabsTrigger value="attendance" disabled={club?.isFrozen}>Attendance</TabsTrigger>
            <TabsTrigger value="announcements" disabled={club?.isFrozen} className="relative">
              Announcements
              {unreadAnnouncements > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {unreadAnnouncements > 9 ? '9+' : unreadAnnouncements}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="uploads" disabled={club?.isFrozen}>Uploads</TabsTrigger>
            <TabsTrigger value="members" disabled={club?.isFrozen}>Members</TabsTrigger>
            <TabsTrigger value="leadership" disabled={club?.isFrozen}>Leadership</TabsTrigger>
            <TabsTrigger value="messages" disabled={club?.isFrozen} className="relative">
              Messages
              {unreadMessages > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 p-0 flex items-center justify-center text-xs">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="community" disabled={club?.isFrozen}>Community</TabsTrigger>
            <TabsTrigger value="stories" disabled={club?.isFrozen}>Stories</TabsTrigger>
            <TabsTrigger value="settings" disabled={club?.isFrozen}>Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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
                            {formatDate(event.date)} at {event.time}
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
                            {membership.enrollmentNumber} G�� {membership.department}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Applied {formatDate(membership.joinedAt)}
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

          <TabsContent value="events" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl font-semibold">Manage Events</h2>
              <Button 
                onClick={() => !club?.isFrozen && setCreatingEvent(true)}
                disabled={club?.isFrozen}
                title={club?.isFrozen ? "Cannot create events - club is frozen" : "Create a new event"}
              >
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            {/* Search, Filters and Sort */}
            <Card className="p-4">
              <div className="flex flex-col gap-4">
                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Search events by title, description, or location..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Select value={eventSort} onValueChange={(value: any) => setEventSort(value)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date-desc">Newest First</SelectItem>
                      <SelectItem value="date-asc">Oldest First</SelectItem>
                      <SelectItem value="title-asc">Title (A-Z)</SelectItem>
                      <SelectItem value="title-desc">Title (Z-A)</SelectItem>
                      <SelectItem value="registrations-desc">Most Registrations</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filter Buttons */}
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

            <Card className="p-4 border border-border/70 bg-card/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Events Grid</h3>
                <span className="text-xs text-muted-foreground">Click a row to open event details and actions</span>
              </div>
              <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 360, width: "100%" }}>
                <AgGridReact<EventsGridRow>
                  rowData={eventsGridRows}
                  columnDefs={eventsGridColumns}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  animateRows
                  rowSelection="single"
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

            {selectedEventFromGrid && (() => {
              const eventRegs = eventRegistrations.filter((registration) => registration.eventId === selectedEventFromGrid.id);
              const pendingRegs = eventRegs.filter((registration) => !registration.status || registration.status === "pending");
              const attendedCount = eventRegs.filter((registration) => registration.attended).length;
              const isUpcoming = new Date(selectedEventFromGrid.date || new Date()) > new Date();

              return (
                <Card className="p-5 border border-border/80 bg-card/90">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{selectedEventFromGrid.title}</h3>
                        <Badge variant={isUpcoming ? "default" : "secondary"}>{isUpcoming ? "Upcoming" : "Past"}</Badge>
                        {selectedEventFromGrid.imageUrl && <Badge variant="outline">Media</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(selectedEventFromGrid.date)} at {selectedEventFromGrid.time || "Time TBA"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 inline mr-1" />
                        {selectedEventFromGrid.location || "Location TBA"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        <Users className="w-4 h-4 inline mr-1" />
                        {eventRegs.length} registered{!isUpcoming ? `, ${attendedCount} attended (${eventRegs.length > 0 ? Math.round((attendedCount / eventRegs.length) * 100) : 0}%)` : ""}
                      </p>
                      {selectedEventFromGrid.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{selectedEventFromGrid.description}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditingEventId(selectedEventFromGrid.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${selectedEventFromGrid.title}"?`)) {
                            deleteMutation.mutate(selectedEventFromGrid.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm("This will permanently delete the event chat and all its messages. Continue?")) {
                            deleteEventChatMutation.mutate(selectedEventFromGrid.id);
                          }
                        }}
                        disabled={deleteEventChatMutation.isPending}
                      >
                        Delete Chat
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Registration Requests</p>
                    {pendingRegs.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No pending requests for this event.</p>
                    ) : (
                      <ul className="space-y-2">
                        {pendingRegs.map((registration) => (
                          <li key={registration.id} className="flex items-center justify-between text-sm">
                            <div>
                              <span className="font-medium">{registration.studentName}</span>
                              <span className="text-muted-foreground"> · {registration.enrollmentNumber}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">Pending</Badge>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateRegistrationStatusMutation.mutate({
                                    registrationId: registration.id,
                                    status: "approved",
                                  })
                                }
                                disabled={updateRegistrationStatusMutation.isPending}
                              >
                                Approve
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </Card>
              );
            })()}

            {eventsGridRows.length === 0 && (
              <Card className="p-8 text-center">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {eventSearch ? "No events match your search." : "No events found for the selected filter."}
                </p>
                {!eventSearch && (
                  <Button className="mt-4" onClick={() => setCreatingEvent(true)}>
                    Create Your First Event
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          <TabsContent value="attendance" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Event Attendance Management</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Points awarded per attendance: <Badge variant="secondary">10</Badge>
                </div>
              </div>
            </div>

            <Card className="p-6 border border-border/70 bg-card/80">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                Global Points & Badges Leaderboard
              </h3>
              {globalLeaderboard.length > 0 ? (
                <div className="space-y-3">
                  {globalLeaderboard.slice(0, 10).map((student, index) => (
                    <div
                      key={student.studentEmail}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/15 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm dark:bg-primary/25">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.enrollmentNumber} · {student.totalPoints} total points
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {student.badges?.map((badge: string, badgeIndex: number) => (
                          <Badge
                            key={badgeIndex}
                            variant="outline"
                            className="text-xs border-primary/25 bg-primary/10 text-foreground dark:border-primary/35 dark:bg-primary/20"
                          >
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
                  No students have earned points yet. Points will appear here when students start attending events.
                </p>
              )}
            </Card>

            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Events Grid</h3>
                  <span className="text-xs text-muted-foreground">Click any row to open attendance details</span>
                </div>
                <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 340, width: "100%" }}>
                  <AgGridReact<AttendanceEventRow>
                    rowData={attendanceEventRows}
                    columnDefs={attendanceGridColumns}
                    pagination
                    paginationPageSize={10}
                    rowSelection="single"
                    animateRows
                    onRowClicked={(event: RowClickedEvent<AttendanceEventRow>) => {
                      const selectedId = event.data?.id;
                      if (!selectedId) return;
                      setExpandedEventId(selectedId);
                      setAttendancePage(1);
                      setAttendanceSearch("");
                      setAttendanceStatusFilter("all");
                      setAttendanceMarkFilter("all");
                      setAttendanceYearFilter("all");
                      setAttendanceSemesterFilter("all");
                      setSelectedAttendanceIds([]);
                    }}
                  />
                </div>
              </Card>

              {selectedAttendanceEvent && (
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-semibold">{selectedAttendanceEvent.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedAttendanceEvent.date)} at {selectedAttendanceEvent.time} · {selectedAttendanceEvent.location}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {currentEventRegistrationsPagination.total} registered
                    </Badge>
                  </div>

                  <div className="space-y-3 mt-4 pt-4 border-t border-border">
                    <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                      <Input
                        placeholder="Search by name, email, enrollment"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="lg:col-span-2"
                      />
                      <Select value={attendanceStatusFilter} onValueChange={(value: any) => setAttendanceStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Registration status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All registration statuses</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={attendanceMarkFilter} onValueChange={(value: any) => setAttendanceMarkFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Attendance status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All attendance statuses</SelectItem>
                          <SelectItem value="pending">Not marked</SelectItem>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={attendanceYearFilter} onValueChange={(value: string) => setAttendanceYearFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All years</SelectItem>
                          {attendanceYearOptions.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={attendanceSemesterFilter} onValueChange={(value: string) => setAttendanceSemesterFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All semesters</SelectItem>
                          {attendanceSemesterOptions.map((semester) => (
                            <SelectItem key={semester} value={semester}>
                              {semester}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAttendanceSearch("");
                          setAttendanceStatusFilter("all");
                          setAttendanceMarkFilter("all");
                          setAttendanceYearFilter("all");
                          setAttendanceSemesterFilter("all");
                        }}
                      >
                        Reset Filters
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedAttendanceIds.length === 0 || batchAttendanceMutation.isPending}
                        onClick={() => batchAttendanceMutation.mutate({
                          registrationIds: selectedAttendanceIds,
                          attended: true,
                        })}
                      >
                        Mark Selected Present
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={selectedAttendanceIds.length === 0 || batchAttendanceMutation.isPending}
                        onClick={() => batchAttendanceMutation.mutate({
                          registrationIds: selectedAttendanceIds,
                          attended: false,
                        })}
                      >
                        Mark Selected Absent
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedAttendanceIds.length} selected
                      </span>
                    </div>

                    {pagedEventRegistrationsLoading ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">Loading registrations...</div>
                    ) : currentEventRegistrations.length > 0 ? (
                      <>
                        <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 420, width: "100%" }}>
                          <AgGridReact<AttendanceRegistrationGridRow>
                            rowData={attendanceRegistrationsGridRows}
                            columnDefs={attendanceRegistrationsGridColumns}
                            defaultColDef={{ sortable: true, filter: true, resizable: true }}
                            animateRows
                            rowSelection="multiple"
                            onSelectionChanged={(event: SelectionChangedEvent<AttendanceRegistrationGridRow>) => {
                              const selectedIds = event.api.getSelectedRows().map((row) => row.id);
                              setSelectedAttendanceIds(selectedIds);
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-xs text-muted-foreground">Use the checkbox column to select rows.</div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
                              disabled={attendancePage <= 1 || pagedEventRegistrationsLoading}
                            >
                              Previous
                            </Button>
                            <span className="text-xs text-muted-foreground">
                              Page {currentEventRegistrationsPagination.page} of {Math.max(1, currentEventRegistrationsPagination.totalPages)}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setAttendancePage((prev) =>
                                  Math.min(Math.max(1, currentEventRegistrationsPagination.totalPages), prev + 1),
                                )
                              }
                              disabled={
                                pagedEventRegistrationsLoading ||
                                attendancePage >= Math.max(1, currentEventRegistrationsPagination.totalPages)
                              }
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No registrations match this filter.
                      </p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="announcements" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">University Announcements</h2>
              <Badge variant="secondary">{announcements.length} announcements</Badge>
            </div>

            {announcements.length > 0 ? (
              <>
                <Card className="p-4 border border-border/70 bg-card/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Announcements Grid</h3>
                    <span className="text-xs text-muted-foreground">Click a row to open full announcement details</span>
                  </div>
                  <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 360, width: "100%" }}>
                    <AgGridReact<AnnouncementsGridRow>
                      rowData={announcementsGridRows}
                      columnDefs={announcementsGridColumns}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      animateRows
                      rowSelection="single"
                      pagination
                      paginationPageSize={8}
                      onRowClicked={(event: RowClickedEvent<AnnouncementsGridRow>) => {
                        if (event.data?.id) {
                          setSelectedAnnouncementGridId(event.data.id);
                        }
                      }}
                    />
                  </div>
                </Card>

                {selectedAnnouncementFromGrid && (
                  <Card
                    className={`p-4 ${!selectedAnnouncementFromGrid.isRead ? 'border-l-4 border-l-primary' : ''} ${selectedAnnouncementFromGrid.pinned ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <Bell className={`w-5 h-5 mt-0.5 flex-shrink-0 ${selectedAnnouncementFromGrid.pinned ? 'text-yellow-500' : 'text-blue-500'}`} />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-lg">{selectedAnnouncementFromGrid.title}</h4>
                              {!selectedAnnouncementFromGrid.isRead && (
                                <Badge variant="default" className="text-xs">New</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              By {selectedAnnouncementFromGrid.authorName} · {formatDate(selectedAnnouncementFromGrid.createdAt)}
                            </p>
                          </div>
                          {selectedAnnouncementFromGrid.pinned && (
                            <Badge variant="default" className="bg-yellow-500">
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <div className="mt-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedAnnouncementFromGrid.content}
                          </p>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Target: {selectedAnnouncementFromGrid.target || 'all'}
                          </Badge>
                        </div>
                        {!selectedAnnouncementFromGrid.isRead && (
                          <div className="mt-3 flex justify-end">
                            <Button
                              size="sm"
                              onClick={() => markAnnouncementAsReadMutation.mutate(selectedAnnouncementFromGrid.id)}
                              disabled={markAnnouncementAsReadMutation.isPending}
                            >
                              {markAnnouncementAsReadMutation.isPending ? (
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
                      </div>
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No announcements available</p>
                <p className="text-sm text-muted-foreground mt-2">
                  University announcements will appear here when posted by administrators.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="uploads" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        src={resolveMediaUrl(event.imageUrl)}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(event.date)}
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

          <TabsContent value="members" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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

              {memberFilter === 'pending' && memberships.filter((m) => m.status === 'pending').length > 0 && (
                <div className="mt-4 pt-4 border-t text-sm text-muted-foreground">
                  Use the checkbox column in the grid below to select pending members for bulk approval or rejection.
                </div>
              )}
            </Card>

            <Card className="p-4 border border-border/70 bg-card/80">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Members Grid</h3>
                <span className="text-xs text-muted-foreground">Select rows for bulk actions and click any row for details</span>
              </div>
              <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 420, width: "100%" }}>
                <AgGridReact<MembersGridRow>
                  rowData={membersGridRows}
                  columnDefs={membersGridColumns}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  animateRows
                  rowSelection="multiple"
                  pagination
                  paginationPageSize={10}
                  onSelectionChanged={(event: SelectionChangedEvent<MembersGridRow>) => {
                    const pendingSelected = event.api
                      .getSelectedRows()
                      .filter((row) => row.status === "pending")
                      .map((row) => row.id);
                    setSelectedMembers(pendingSelected);
                  }}
                  onRowClicked={(event: RowClickedEvent<MembersGridRow>) => {
                    if (event.data?.id) {
                      setSelectedMemberGridId(event.data.id);
                    }
                  }}
                />
              </div>
            </Card>

            {selectedMemberFromGrid && (
              <Card className="p-5 border border-border/80 bg-card/90">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {selectedMemberFromGrid.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedMemberFromGrid.studentName}</h3>
                        <p className="text-sm text-muted-foreground">{selectedMemberFromGrid.enrollmentNumber}</p>
                      </div>
                      <Badge
                        variant={
                          selectedMemberFromGrid.status === "approved"
                            ? "default"
                            : selectedMemberFromGrid.status === "rejected"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {selectedMemberFromGrid.status.charAt(0).toUpperCase() + selectedMemberFromGrid.status.slice(1)}
                      </Badge>
                      {selectedMemberFromGrid.isFallback && <Badge variant="outline">Offline</Badge>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <p><Mail className="w-4 h-4 inline mr-1 text-muted-foreground" />{selectedMemberFromGrid.studentEmail}</p>
                      <p><UserCheck className="w-4 h-4 inline mr-1 text-muted-foreground" />{selectedMemberFromGrid.department}</p>
                      <p><Calendar className="w-4 h-4 inline mr-1 text-muted-foreground" />Joined {formatDate(selectedMemberFromGrid.joinedAt)}</p>
                    </div>

                    {selectedMemberFromGrid.reason && (
                      <div className="rounded-lg border border-border bg-muted/20 p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Reason for joining</p>
                        <p className="text-sm leading-relaxed">{selectedMemberFromGrid.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 lg:w-[260px] lg:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowMemberDetails(selectedMemberFromGrid.id)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Profile
                    </Button>

                    {selectedMemberFromGrid.status === "approved" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForPoints(selectedMemberFromGrid);
                            setShowPointsModal(true);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                        >
                          <Award className="w-4 h-4" />
                          Award Points
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStudentForCertificate(selectedMemberFromGrid);
                            setShowCertificateModal(true);
                          }}
                          className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                        >
                          <FileText className="w-4 h-4" />
                          Add Certificate
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (
                              confirm(
                                `Are you sure you want to remove ${selectedMemberFromGrid.studentName} from the club?`,
                              )
                            ) {
                              deleteMembershipMutation.mutate(selectedMemberFromGrid.id);
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

                    {selectedMemberFromGrid.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            updateMembershipStatusMutation.mutate({
                              membershipId: selectedMemberFromGrid.id,
                              status: "approved",
                            })
                          }
                          disabled={updateMembershipStatusMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            updateMembershipStatusMutation.mutate({
                              membershipId: selectedMemberFromGrid.id,
                              status: "rejected",
                            })
                          }
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
            )}

            {membersGridRows.length === 0 && (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {memberSearch ? 'No members match your search.' : 'No members found for the selected filter.'}
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="leadership" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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
                    <p className="text-2xl font-bold">{activeLeadersCount}</p>
                    <p className="text-sm text-muted-foreground">Active Leaders</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Leadership Positions */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Available Leadership Positions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {leadershipPositions.map((position) => {
                  const roleLeaders = leadershipByRole.get(position.key) || [];
                  const isOccupied = roleLeaders.length > 0;
                  return (
                  <div key={position.key} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{position.title}</h4>
                      <Badge variant={isOccupied ? "default" : "outline"} className="text-xs">
                        {isOccupied ? "Occupied" : "Vacant"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{position.description}</p>
                    {isOccupied && (
                      <p className="text-xs text-primary mt-2 font-medium">
                        {roleLeaders[0].studentName}
                        {roleLeaders.length > 1 ? ` +${roleLeaders.length - 1} more` : ""}
                      </p>
                    )}
                  </div>
                );})}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="community" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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
                          src={resolveMediaUrl(achievement.imageUrl)}
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
                          <span>Achieved on {formatDate(achievement.achievementDate)}</span>
                          <span>Posted {formatDate(achievement.createdAt)}</span>
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

          <TabsContent value="messages" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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

            {messages.length === 0 ? (
              <Card className="p-12 text-center">
                <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Messages Yet</h3>
                <p className="text-muted-foreground">
                  Messages from students will appear here.
                </p>
              </Card>
            ) : (
              <>
                <Card className="p-4 border border-border/70 bg-card/80">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Messages Grid</h3>
                    <span className="text-xs text-muted-foreground">Click a row to open full message details</span>
                  </div>
                  <div className={`${attendanceGridThemeClass} attendance-ag-grid`} style={{ height: 360, width: "100%" }}>
                    <AgGridReact<MessagesGridRow>
                      rowData={messagesGridRows}
                      columnDefs={messagesGridColumns}
                      defaultColDef={{ sortable: true, filter: true, resizable: true }}
                      animateRows
                      rowSelection="single"
                      pagination
                      paginationPageSize={8}
                      onRowClicked={(event: RowClickedEvent<MessagesGridRow>) => {
                        if (event.data?.id) {
                          setSelectedMessageGridId(event.data.id);
                        }
                      }}
                    />
                  </div>
                </Card>

                {selectedMessageFromGrid && (
                  <Card className={`p-6 border border-border/80 bg-card/90 ${!selectedMessageFromGrid.read ? 'border-l-4 border-l-primary' : ''}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{selectedMessageFromGrid.senderName}</h3>
                          {!selectedMessageFromGrid.read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Email:</strong> {selectedMessageFromGrid.senderEmail}</p>
                          <p><strong>Enrollment:</strong> {selectedMessageFromGrid.enrollmentNumber}</p>
                          <p><strong>Subject:</strong> {selectedMessageFromGrid.subject}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{formatDate(selectedMessageFromGrid.sentAt)}</p>
                        <p>{new Date(selectedMessageFromGrid.sentAt).toLocaleTimeString()}</p>
                      </div>
                    </div>

                    <div className="bg-muted/50 p-4 rounded-lg mb-4">
                      <p className="text-sm whitespace-pre-wrap">{selectedMessageFromGrid.message}</p>
                    </div>

                    {!selectedMessageFromGrid.read && (
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => markMessageAsReadMutation.mutate(selectedMessageFromGrid.id)}
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
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="stories" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Stories</h2>
              <Badge variant="secondary">Home Story Highlights</Badge>
            </div>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload Club Story</h3>
                <span className="text-xs text-muted-foreground">24-hour image, video, or text story</span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="storyFile">Story Media (optional)</Label>
                  <input
                    id="storyFile"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleStoryFileSelect}
                    className="block w-full text-sm mt-2"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Optional for text-only updates.</p>
                </div>

                {storyPreview && (
                  <div className="rounded-lg border p-2 inline-block">
                    {storyPreviewType === "video" ? (
                      <video src={storyPreview} controls muted className="h-24 w-24 object-cover rounded" />
                    ) : storyPreviewType === "image" ? (
                      <img src={storyPreview} alt="Story preview" className="h-24 w-24 object-cover rounded" />
                    ) : null}
                  </div>
                )}

                <div>
                  <Label htmlFor="storyCaption">Story text / caption</Label>
                  <Textarea
                    id="storyCaption"
                    value={storyCaption}
                    onChange={(e) => setStoryCaption(e.target.value)}
                    placeholder="Share club updates, reminders, event info, or a caption"
                    maxLength={500}
                    rows={4}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={storyAsHighlight}
                    onChange={(e) => setStoryAsHighlight(e.target.checked)}
                  />
                  Add this story to highlights
                </label>

                <Button
                  type="button"
                  disabled={createStoryMutation.isPending || (!storyFile && !storyCaption.trim())}
                  onClick={() => {
                    createStoryMutation.mutate({
                      file: storyFile,
                      caption: storyCaption.trim(),
                      isHighlight: storyAsHighlight,
                    });
                  }}
                >
                  {createStoryMutation.isPending ? "Uploading..." : "Upload Story"}
                </Button>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Recent Stories</h3>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {myStories.length === 0 && (
                  <p className="text-sm text-muted-foreground">No stories uploaded yet. Add a video, image, or text update for 24 hours of visibility.</p>
                )}

                {myStories.map((story: any) => (
                  <div key={story.id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      {story.mediaType === "video" && story.mediaUrl ? (
                        <video src={story.mediaUrl} className="h-12 w-12 rounded object-cover" muted />
                      ) : story.mediaType === "text" || !story.mediaUrl ? (
                        <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                          Text
                        </div>
                      ) : (
                        <img src={story.mediaUrl} alt="Story" className="h-12 w-12 rounded object-cover" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate">{story.caption || "(No text)"}</p>
                        <p className="text-xs text-muted-foreground">
                          {story.isHighlight ? "In Highlights" : "Story only"} · 24h auto-delete
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggleStoryHighlightMutation.mutate({
                            storyId: story.id,
                            isHighlight: !story.isHighlight,
                          })
                        }
                        disabled={toggleStoryHighlightMutation.isPending}
                      >
                        {story.isHighlight ? "Unhighlight" : "Highlight"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteStoryMutation.mutate(story.id)}
                        disabled={deleteStoryMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className={`space-y-6 transition-all duration-300 ${club?.isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
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
                        email: formData.get("email") as string,
                        description: formData.get("description") as string,
                        category: formData.get("category") as string,
                        isHighlighted: formData.get("isHighlighted") === "on",
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
                          src={resolveMediaUrl(logoPreview || displayClub?.logoUrl) || "/placeholder-logo.png"}
                          alt="Club logo preview"
                          className="w-20 h-20 rounded-lg object-cover border-2 border-dashed border-gray-300"
                        />
                        {(logoPreview || displayClub?.logoUrl) && (
                          <button
                            type="button"
                            onClick={removeLogo}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            +�
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
                      defaultValue={displayClub?.name || ""}
                      placeholder="Enter club name..."
                      required
                      maxLength={100}
                    />
                  </div>

                  {/* Club Email */}
                  <div>
                    <Label htmlFor="email">Club Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={displayClub?.email || ""}
                      placeholder="Enter club email address..."
                      required
                    />
                  </div>

                  {/* Category Selection */}
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select name="category" defaultValue={displayClub?.category || ""} required>
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
                      defaultValue={displayClub?.description || ""}
                      placeholder="Describe your club, its activities, and goals..."
                      required
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Maximum 500 characters
                    </p>
                  </div>

                  {/* Story Highlight Toggle */}
                  <div className="rounded-lg border p-4 bg-muted/20">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Label htmlFor="isHighlighted" className="text-sm font-medium">Show In Story Highlights</Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enable this to feature your club in the Story Highlights strip on the home feed.
                        </p>
                      </div>
                      <input
                        id="isHighlighted"
                        name="isHighlighted"
                        type="checkbox"
                        defaultChecked={!!displayClub?.isHighlighted}
                        className="h-4 w-4 mt-1"
                      />
                    </div>
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
                {/* Info Banner for Missing Data */}
                {(!(admin as any)?.fullName || !(admin as any)?.email || !(admin as any)?.phone || !displayClub?.facultyAssigned || !displayClub?.phone || !displayClub?.email) && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-900 dark:text-amber-200">
                      G�n+� Some information is missing. Click "Edit Profile" to update your administrator details or "Edit Club" to update club information.
                    </p>
                  </div>
                )}

                {/* Story Studio */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Story Studio</h3>
                    <span className="text-xs text-muted-foreground">24-hour image, video, or text story</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="storyFile">Story Media (optional)</Label>
                      <input
                        id="storyFile"
                        type="file"
                        accept="image/*,video/*"
                        onChange={handleStoryFileSelect}
                        className="block w-full text-sm mt-2"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">Optional for text-only updates.</p>
                    </div>

                    {storyPreview && (
                      <div className="rounded-lg border p-2 inline-block">
                        {storyPreviewType === "video" ? (
                          <video src={storyPreview} controls muted className="h-24 w-24 object-cover rounded" />
                        ) : storyPreviewType === "image" ? (
                          <img src={storyPreview} alt="Story preview" className="h-24 w-24 object-cover rounded" />
                        ) : null}
                      </div>
                    )}

                    <div>
                      <Label htmlFor="storyCaption">Story text / caption</Label>
                      <Textarea
                        id="storyCaption"
                        value={storyCaption}
                        onChange={(e) => setStoryCaption(e.target.value)}
                        placeholder="Share club updates, reminders, event info, or a caption"
                        maxLength={500}
                        rows={4}
                      />
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={storyAsHighlight}
                        onChange={(e) => setStoryAsHighlight(e.target.checked)}
                      />
                      Add this story to highlights
                    </label>

                    <Button
                      type="button"
                      disabled={createStoryMutation.isPending || (!storyFile && !storyCaption.trim())}
                      onClick={() => {
                        createStoryMutation.mutate({
                          file: storyFile,
                          caption: storyCaption.trim(),
                          isHighlight: storyAsHighlight,
                        });
                      }}
                    >
                      {createStoryMutation.isPending ? "Uploading..." : "Upload Story"}
                    </Button>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3">Your Recent Stories</h4>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                      {myStories.length === 0 && (
                        <p className="text-sm text-muted-foreground">No stories uploaded yet. Add a video, image, or text update for 24 hours of visibility.</p>
                      )}

                      {myStories.map((story: any) => (
                        <div key={story.id} className="flex items-center justify-between gap-3 border rounded-lg p-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {story.mediaType === "video" && story.mediaUrl ? (
                              <video src={story.mediaUrl} className="h-12 w-12 rounded object-cover" muted />
                            ) : story.mediaType === "text" || !story.mediaUrl ? (
                              <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
                                Text
                              </div>
                            ) : (
                              <img src={story.mediaUrl} alt="Story" className="h-12 w-12 rounded object-cover" />
                            )}
                            <div className="min-w-0">
                              <p className="text-sm truncate">{story.caption || "(No text)"}</p>
                              <p className="text-xs text-muted-foreground">
                                {story.isHighlight ? "In Highlights" : "Story only"} · 24h auto-delete
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                toggleStoryHighlightMutation.mutate({
                                  storyId: story.id,
                                  isHighlight: !story.isHighlight,
                                })
                              }
                              disabled={toggleStoryHighlightMutation.isPending}
                            >
                              {story.isHighlight ? "Unhighlight" : "Highlight"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteStoryMutation.mutate(story.id)}
                              disabled={deleteStoryMutation.isPending}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                
                {/* Administrator Information Card */}
                <Card className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Club Administrator Details</h3>
                    <Button
                      variant={editingAdminProfile ? "secondary" : "outline"}
                      onClick={() => setEditingAdminProfile(!editingAdminProfile)}
                      size="sm"
                    >
                      <User className="mr-2 h-4 w-4" />
                      {editingAdminProfile ? "Cancel" : "Edit Profile"}
                    </Button>
                  </div>

                  {editingAdminProfile ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target as HTMLFormElement);
                        updateAdminProfileMutation.mutate({
                          fullName: formData.get("fullName") as string,
                          email: formData.get("email") as string,
                          phone: formData.get("phone") as string,
                        });
                      }}
                      className="space-y-6"
                    >
                      <div className="mb-4">
                        <h4 className="text-base font-semibold mb-2">Edit Administrator Information</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your personal contact details.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="fullName">Full Name</Label>
                          <Input
                            id="fullName"
                            name="fullName"
                            defaultValue={(admin as any)?.fullName || ""}
                            placeholder="Enter your full name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            defaultValue={(admin as any)?.email || ""}
                            placeholder="your.email@gehu.ac.in"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={(admin as any)?.phone || ""}
                            placeholder="+91 XXXXX XXXXX"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={updateAdminProfileMutation.isPending}
                        >
                          {updateAdminProfileMutation.isPending ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Updating Profile...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Update Profile
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingAdminProfile(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Administrator Information */}
                      <div>
                        <h4 className="font-semibold mb-4 text-base">Administrator Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                            <p className="text-sm font-medium mt-1">{admin?.username || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Club</Label>
                            <p className="text-sm font-medium mt-1">{displayClub?.name || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Faculty Assigned</Label>
                            <p className="text-sm font-medium mt-1">
                              {displayClub?.facultyAssigned ? displayClub.facultyAssigned : (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Not updated yet</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Club Phone</Label>
                            <p className="text-sm font-medium mt-1">
                              {displayClub?.phone ? displayClub.phone : (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Not updated yet</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Club Email</Label>
                            <p className="text-sm font-medium mt-1">
                              {displayClub?.email ? displayClub.email : (
                                <span className="text-xs text-amber-600 dark:text-amber-400">Not updated yet</span>
                              )}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Role</Label>
                            <Badge variant="outline" className="mt-1">{(admin as any)?.role || "club_admin"}</Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Account Status</Label>
                            <Badge className="mt-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              {(admin as any)?.isActive === false ? "Inactive" : "Active"}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Last Login</Label>
                            <p className="text-sm font-medium mt-1">
                              {(admin as any)?.lastLogin ? new Date((admin as any).lastLogin).toLocaleString() : "Never"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Account Created</Label>
                            <p className="text-sm font-medium mt-1">
                              {(admin as any)?.createdAt ? new Date((admin as any).createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Club Created</Label>
                            <p className="text-sm font-medium mt-1">
                              {displayClub?.createdAt ? new Date(displayClub.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                            <p className="text-sm font-medium mt-1">
                              {(admin as any)?.updatedAt ? new Date((admin as any).updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="border-t pt-6">
                        <h4 className="font-semibold mb-4 text-base">Permissions</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(admin as any)?.permissions?.canCreateEvents !== false && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium">Create Events</span>
                            </div>
                          )}
                          {(admin as any)?.permissions?.canManageMembers !== false && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium">Manage Members</span>
                            </div>
                          )}
                          {(admin as any)?.permissions?.canEditClub !== false && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium">Edit Club</span>
                            </div>
                          )}
                          {(admin as any)?.permissions?.canViewAnalytics !== false && (
                            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="text-sm font-medium">View Analytics</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Club Overview Card */}
                <Card className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      {displayClub?.logoUrl ? (
                        <img
                          src={resolveMediaUrl(displayClub?.logoUrl)}
                          alt={`${displayClub?.name} logo`}
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
                        <h3 className="text-2xl font-bold">{displayClub?.name}</h3>
                        <Badge variant="secondary" className="mt-1">
                          {displayClub?.category}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {displayClub?.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{displayClub?.memberCount || 0} members</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>Active since {new Date(displayClub?.createdAt || Date.now()).getFullYear()}</span>
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
                        <p className="text-2xl font-bold">{displayClub?.memberCount || 0}</p>
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
        </div>

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
                        <p className="text-sm font-medium">{formatDate(member.joinedAt)}</p>
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

        {/* Certificate Upload Modal */}
        <Dialog open={showCertificateModal} onOpenChange={setShowCertificateModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Certificate</DialogTitle>
              <DialogDescription>
                Upload a certificate for {selectedStudentForCertificate?.studentName}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUploadCertificate();
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="certificateTitle">Certificate Title</Label>
                <Input
                  id="certificateTitle"
                  value={certificateTitle}
                  onChange={(e) => setCertificateTitle(e.target.value)}
                  placeholder="e.g., Best Performer Award 2025"
                  required
                />
              </div>
              <div>
                <Label htmlFor="certificateFile">Certificate File (PDF, Image, or Document)</Label>
                <Input
                  id="certificateFile"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: "Error",
                          description: "File size must be less than 10MB",
                          variant: "destructive",
                        });
                        e.target.value = "";
                        return;
                      }
                      setCertificateFile(file);
                    }
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Accepted: PDF, JPG, PNG, DOC (Max 10MB)
                </p>
              </div>
              {certificateFile && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">{certificateFile.name}</span>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCertificateModal(false);
                    setCertificateTitle("");
                    setCertificateFile(null);
                    setSelectedStudentForCertificate(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!certificateTitle || !certificateFile || uploadCertificateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadCertificateMutation.isPending ? "Uploading..." : "Upload Certificate"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
          </div>
        </>
      )}
    </div>
  );
}
