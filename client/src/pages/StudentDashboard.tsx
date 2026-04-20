import { useMemo, useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueries } from "@tanstack/react-query";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useTheme } from "@/components/ThemeProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Phone,
  Zap,
  Upload,
  Download,
  FileText,
  Bookmark,
  ArrowRight,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UNIVERSITY_BRANCH_OPTIONS } from "@/lib/branchOptions";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";
import type { EventRegistration } from "@shared/schema";
import type { AttendanceDispute } from "@shared/schema";
import type { ClubMembership } from "@shared/schema";
import type { StudentPoints } from "@shared/schema";

type AttendanceGridRow = {
  srNo: number;
  registrationId: string;
  eventId: string;
  eventTitle: string;
  eventTime: string;
  eventDateDisplay: string;
  eventDateValue: number;
  clubName: string;
  status: "present" | "absent" | "pending";
  markedAtDisplay: string;
  markedAtValue: number;
};

type MembershipGridRow = {
  srNo: number;
  id: string;
  clubId: string;
  clubName: string;
  status: string;
  enrollment: string;
  department: string;
};

type RegisteredEventGridRow = {
  srNo: number;
  id: string;
  eventId: string;
  eventTitle: string;
  dateTime: string;
  enrollment: string;
  clubName: string;
};

type NotificationGridRow = {
  srNo: number;
  id: string;
  target: string;
  title: string;
  message: string;
  priority: string;
  author: string;
  createdAt: string;
  isRead: boolean;
};

type StudentRegistrationsResponse = {
  registrations: EventRegistration[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ReminderItem = {
  id: string;
  priority?: string;
  title?: string;
  description?: string;
  action?: string;
  [key: string]: unknown;
};

type WatchlistData = {
  savedEvents: Array<{
    id: string;
    title: string;
    clubName: string;
    date: string;
  }>;
  savedClubs: Array<{
    id: string;
    name: string;
    category: string;
    memberCount: number;
  }>;
};

type StudentPointsSummary = {
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
};

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { student, isAuthenticated, isLoading: authLoading } = useStudentAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profilePreviewUrlRef = useRef<string | null>(null);
  const hasAppliedDefaultSemesterFilter = useRef(false);
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState<"overview" | "attendance" | "achievements" | "settings">("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [profileUploadCooldownSeconds, setProfileUploadCooldownSeconds] = useState(0);
  const [profileSaveCooldownSeconds, setProfileSaveCooldownSeconds] = useState(0);
  const [profileUploadMessage, setProfileUploadMessage] = useState("");
  const [profileUploadMessageType, setProfileUploadMessageType] = useState<"info" | "success" | "error">("info");
  const [profileForm, setProfileForm] = useState({
    phone: "",
    department: "",
    yearOfAdmission: "",
    rollNumber: "",
    currentSemester: "",
  });
  const [profileTouched, setProfileTouched] = useState({
    phone: false,
    department: false,
    yearOfAdmission: false,
    rollNumber: false,
    currentSemester: false,
  });
  const [profileServerErrors, setProfileServerErrors] = useState<Partial<Record<string, string>>>({});
  const [selectedAttendanceGridId, setSelectedAttendanceGridId] = useState<string | null>(null);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState<"all" | "present" | "absent" | "pending">("all");
  const [attendanceClubFilter, setAttendanceClubFilter] = useState("all");
  const [attendanceYearFilter, setAttendanceYearFilter] = useState("all");
  const [attendanceSemesterFilter, setAttendanceSemesterFilter] = useState("all");
  const [attendanceDateFilter, setAttendanceDateFilter] = useState("all");
  const [attendanceSort, setAttendanceSort] = useState<"date-desc" | "date-asc" | "club" | "status">("date-desc");
  const [attendancePage, setAttendancePage] = useState(1);
  const [attendancePageSize, setAttendancePageSize] = useState(10);
  const [attendanceDisputeDrafts, setAttendanceDisputeDrafts] = useState<Record<string, string>>({});
  const [expandedAttendanceRowId, setExpandedAttendanceRowId] = useState<string | null>(null);
  const [showAllOverviewReminders, setShowAllOverviewReminders] = useState(false);
  const [isOverviewRemindersCollapsed, setIsOverviewRemindersCollapsed] = useState(false);
  const [showAllOverviewUpcomingEvents, setShowAllOverviewUpcomingEvents] = useState(false);
  const [showAllOverviewSavedEvents, setShowAllOverviewSavedEvents] = useState(false);
  const [showAllOverviewSavedClubs, setShowAllOverviewSavedClubs] = useState(false);
  const [notificationsSearch, setNotificationsSearch] = useState("");
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [showAllMemberships, setShowAllMemberships] = useState(false);
  const [membershipsSearch, setMembershipsSearch] = useState("");
  const [showAllRegisteredEvents, setShowAllRegisteredEvents] = useState(false);
  const [registeredEventsSearch, setRegisteredEventsSearch] = useState("");
  const [hiddenAnnouncementIds, setHiddenAnnouncementIds] = useState<string[]>([]);

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/clubs");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/events");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: registrationsData } = useQuery<StudentRegistrationsResponse>({
    queryKey: ["/api/student/registrations"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/registrations");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: attendanceDisputesData } = useQuery<{ disputes: AttendanceDispute[] }>({
    queryKey: ["/api/student/attendance-disputes"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/attendance-disputes");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: studentPointsData } = useQuery<StudentPointsSummary>({
    queryKey: ["/api/student/points"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/points");
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
      const res = await apiRequest("GET", "/api/student/certificates");
      return res.json();
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

  const leadershipQueries = useQueries({
    queries: memberships.map((membership) => ({
      queryKey: ["/api/club-leadership", membership.clubId],
      queryFn: async () => {
        const res = await apiRequest("GET", `/api/club-leadership/${membership.clubId}`);
        return res.json();
      },
      enabled: isAuthenticated && memberships.length > 0,
    })),
  });

  const clubDesignation = useMemo(() => {
    const leadershipEntry = leadershipQueries
      .flatMap((query) => (Array.isArray(query.data) ? query.data : []))
      .find(
        (entry) =>
          entry?.studentEmail === student?.email ||
          entry?.studentId === student?.id ||
          entry?.studentName === student?.name,
      );

    if (leadershipEntry?.role) {
      return `${leadershipEntry.role} • ${leadershipEntry.clubId ? memberships.find((membership) => membership.clubId === leadershipEntry.clubId)?.clubName || "Club" : "Club"}`;
    }

    const approvedMembership = memberships.find((membership) => membership.status === "approved");
    if (approvedMembership) {
      return `Member • ${approvedMembership.clubName}`;
    }

    if (memberships.length > 0) {
      return `Member • ${memberships[0].clubName}`;
    }

    return "No club role yet";
  }, [leadershipQueries, memberships, student?.email, student?.id, student?.name]);

  const { data: studentPreferencesData } = useQuery<any>({
    queryKey: ["/api/student/preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/preferences");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: reminderData } = useQuery<{ reminders: ReminderItem[] }>({
    queryKey: ["/api/student/reminders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/reminders");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: watchlistData } = useQuery<WatchlistData>({
    queryKey: ["/api/student/watchlist"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/student/watchlist");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const submitAttendanceDisputeMutation = useMutation({
    mutationFn: async (payload: { registrationId: string; reason: string }) => {
      const res = await apiRequest("POST", "/api/student/attendance-disputes", payload);
      return res.json();
    },
  });

  const dismissReminderMutation = useMutation({
    mutationFn: async (reminderId: string) => {
      const res = await apiRequest("POST", `/api/student/reminders/${reminderId}/dismiss`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/reminders"] });
    },
  });

  const updateNotificationPreferencesMutation = useMutation({
    mutationFn: async (payload: Record<string, boolean>) => {
      const res = await apiRequest("PATCH", "/api/student/preferences", {
        notificationPreferences: payload,
      });
      return res.json();
    },
  });

  const uploadProfilePictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);
      const res = await apiRequest("POST", "/api/student/profile-picture", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      setProfileImage(null);
      setProfileUploadCooldownSeconds(10);
      setProfileUploadMessageType("success");
      setProfileUploadMessage("Profile picture uploaded successfully.");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: {
      phone: string;
      department: string;
      yearOfAdmission?: number;
      rollNumber: string;
    }) => {
      const res = await apiRequest("PATCH", "/api/student/me", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      setIsEditingProfile(false);
    },
  });

  useEffect(() => {
    return () => {
      if (profilePreviewUrlRef.current) {
        URL.revokeObjectURL(profilePreviewUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (profileUploadCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setProfileUploadCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [profileUploadCooldownSeconds]);

  useEffect(() => {
    if (profileSaveCooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setProfileSaveCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [profileSaveCooldownSeconds]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/student/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      sessionStorage.setItem("studentDashboardLock", "1");
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    if (!student) return;
    const key = `studentDashboardHiddenAnnouncements:${student.id || student.enrollment || student.email}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHiddenAnnouncementIds(parsed.map((item) => String(item)));
          return;
        }
      } catch {
        // Ignore malformed local storage payload and reset to empty state.
      }
    }
    setHiddenAnnouncementIds([]);
  }, [student]);

  useEffect(() => {
    if (!student) return;
    const key = `studentDashboardHiddenAnnouncements:${student.id || student.enrollment || student.email}`;
    localStorage.setItem(key, JSON.stringify(hiddenAnnouncementIds));
  }, [hiddenAnnouncementIds, student]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/student/logout", {});
      sessionStorage.removeItem("studentDashboardLock");
      await queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      queryClient.setQueryData(["/api/chat/me"], { loggedIn: false, role: "guest" });
      queryClient.removeQueries({ queryKey: ["/api/chat/groups"] });
      queryClient.removeQueries({ queryKey: ["/api/chat/unread-count"] });
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
    if (profileUploadCooldownSeconds > 0) {
      setProfileUploadMessage(`Please wait ${profileUploadCooldownSeconds}s before uploading again.`);
      setProfileUploadMessageType("error");
      return;
    }
    fileInputRef.current?.click();
  };

  const profileValidationErrors = useMemo(() => {
    const errors: Partial<Record<keyof typeof profileForm, string>> = {};
    const normalizedPhone = profileForm.phone.trim();
    const normalizedDepartment = profileForm.department.trim();
    const normalizedRollNumber = profileForm.rollNumber.trim();
    const normalizedYear = profileForm.yearOfAdmission.trim();

    if (normalizedPhone && !/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      errors.phone = "Use 10 to 15 digits (optional leading +).";
    }

    if (normalizedDepartment && normalizedDepartment.length < 2) {
      errors.department = "Department should be at least 2 characters.";
    }

    if (normalizedRollNumber && normalizedRollNumber.length < 2) {
      errors.rollNumber = "Roll number should be at least 2 characters.";
    }

    if (normalizedYear) {
      const year = Number(normalizedYear);
      if (!Number.isInteger(year) || year < 2000 || year > currentYear + 1) {
        errors.yearOfAdmission = `Enter a valid year between 2000 and ${currentYear + 1}.`;
      }
    }

    return errors;
  }, [profileForm, currentYear]);

  const isProfileDirty = useMemo(() => {
    const normalizedCurrent = {
      phone: profileForm.phone.trim(),
      department: profileForm.department.trim(),
      yearOfAdmission: profileForm.yearOfAdmission.trim(),
      rollNumber: profileForm.rollNumber.trim(),
      currentSemester: profileForm.currentSemester.trim(),
    };

    const normalizedOriginal = {
      phone: String(student?.phone || "").trim(),
      department: String(student?.department || "").trim(),
      yearOfAdmission: student?.yearOfAdmission ? String(student.yearOfAdmission).trim() : "",
      rollNumber: String(student?.rollNumber || "").trim(),
      currentSemester: String(student?.currentSemester || "").trim(),
    };

    return Object.keys(normalizedCurrent).some(
      (key) =>
        normalizedCurrent[key as keyof typeof normalizedCurrent] !==
        normalizedOriginal[key as keyof typeof normalizedOriginal],
    );
  }, [profileForm, student]);

  const isProfileFormValid = Object.values(profileValidationErrors).every((message) => !message);
  const profileCompletion = useMemo(() => {
    const values = [
      profileForm.phone,
      profileForm.department,
      profileForm.rollNumber,
      profileForm.yearOfAdmission,
      profileForm.currentSemester,
      student?.profilePicture || profileImage,
    ];
    const filled = values.filter((value) => String(value || "").trim().length > 0).length;
    return Math.round((filled / values.length) * 100);
  }, [profileForm, profileImage, student?.profilePicture]);
  const profileCompletionPercent = Math.max(0, Math.min(100, profileCompletion));

  const allowedProfileImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
  const allowedProfileImageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (profileUploadCooldownSeconds > 0) {
      setProfileUploadMessage(`Please wait ${profileUploadCooldownSeconds}s before uploading again.`);
      setProfileUploadMessageType("error");
      e.target.value = "";
      return;
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    const hasAllowedExtension = Array.from(allowedProfileImageExtensions).some((extension) => fileName.endsWith(extension));
    if (!allowedProfileImageTypes.has(file.type) || !hasAllowedExtension) {
      setProfileUploadMessage("Upload blocked: only JPG, PNG, and WEBP files are allowed.");
      setProfileUploadMessageType("error");
      toast({
        title: "Invalid file",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setProfileUploadMessage("Upload blocked: file size must be under 5MB.");
      setProfileUploadMessageType("error");
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (profilePreviewUrlRef.current) {
      URL.revokeObjectURL(profilePreviewUrlRef.current);
      profilePreviewUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    profilePreviewUrlRef.current = previewUrl;
    setProfileImage(previewUrl);
    setProfileUploadMessage(`Selected ${file.name}. Uploading now...`);
    setProfileUploadMessageType("info");

    setIsUploadingProfile(true);
    uploadProfilePictureMutation.mutate(file, {
      onSettled: () => setIsUploadingProfile(false),
    });
    e.target.value = "";
  };

  const handleSaveProfile = () => {
    setProfileTouched({
      phone: true,
      department: true,
      yearOfAdmission: true,
      rollNumber: true,
      currentSemester: true,
    });

    if (!isProfileFormValid) {
      toast({
        title: "Fix validation errors",
        description: "Please correct highlighted profile fields before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!isProfileDirty) {
      toast({
        title: "No changes to save",
        description: "Update at least one field before saving your profile.",
      });
      return;
    }

    if (profileSaveCooldownSeconds > 0) {
      setProfileServerErrors((prev) => ({
        ...prev,
        form: `Please wait ${profileSaveCooldownSeconds}s before saving again.`,
      }));
      return;
    }

    setProfileServerErrors({});

    updateProfileMutation.mutate({
      phone: profileForm.phone.trim(),
      department: profileForm.department.trim(),
      rollNumber: profileForm.rollNumber.trim(),
      yearOfAdmission: profileForm.yearOfAdmission
        ? Number(profileForm.yearOfAdmission)
        : undefined,
    });
  };

  const handleResetProfileChanges = () => {
    setProfileForm({
      phone: student?.phone || "",
      department: student?.department || "",
      yearOfAdmission: student?.yearOfAdmission ? String(student.yearOfAdmission) : "",
      rollNumber: student?.rollNumber || "",
      currentSemester: student?.currentSemester || "",
    });
    setProfileTouched({
      phone: false,
      department: false,
      yearOfAdmission: false,
      rollNumber: false,
      currentSemester: false,
    });
    setProfileServerErrors({});
  };

  const registrations = registrationsData?.registrations || [];
  const registrationsPagination = registrationsData?.pagination;

  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Filter and sort registrations - only show student's own registrations
  const studentRegistrations = registrations
    .filter(reg => reg.studentEmail === student?.email || reg.enrollmentNumber === student?.enrollment)
    .sort((a, b) => {
      // Sort by event date descending (most recent first)
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      return dateB - dateA;
    })
    .filter((registration, index, self) => {
      // Remove duplicate registrations for the same event
      // Keep only the first registration for each event
      return self.findIndex(r => r.eventId === registration.eventId) === index;
    });

  const presentCount = studentRegistrations.filter((r) => r.attendanceStatus === "present").length;
  const absentCount = studentRegistrations.filter((r) => r.attendanceStatus === "absent").length;
  const pendingCount = studentRegistrations.filter(
    (r) => r.attendanceStatus === "pending" || !r.attendanceStatus,
  ).length;
  const markedCount = presentCount + absentCount;
  const attendanceRate = markedCount > 0 ? Math.round((presentCount / markedCount) * 100) : 0;
  const attendanceClubOptions = Array.from(
    new Set(studentRegistrations.map((registration) => registration.clubName).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));
  const attendanceYearOptions = Array.from(
    new Set(studentRegistrations.map((registration) => String(registration.year || "").trim()).filter(Boolean))
  ).sort((a, b) => {
    const aNum = Number.parseInt(a, 10);
    const bNum = Number.parseInt(b, 10);
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });
  const attendanceSemesterOptions = Array.from(
    new Set(studentRegistrations.map((registration) => String(registration.semester || "").trim()).filter(Boolean))
  ).sort((a, b) => {
    const aNumMatch = a.match(/\d+/);
    const bNumMatch = b.match(/\d+/);
    const aNum = aNumMatch ? Number.parseInt(aNumMatch[0], 10) : Number.NaN;
    const bNum = bNumMatch ? Number.parseInt(bNumMatch[0], 10) : Number.NaN;
    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return aNum - bNum;
    }
    return a.localeCompare(b);
  });

  const filteredStudentRegistrations = studentRegistrations
    .filter((registration) => {
      if (attendanceStatusFilter === "all") return true;
      const normalizedStatus = registration.attendanceStatus || "pending";
      return normalizedStatus === attendanceStatusFilter;
    })
    .filter((registration) => {
      if (attendanceYearFilter === "all") return true;
      return String(registration.year || "").trim() === attendanceYearFilter;
    })
    .filter((registration) => {
      if (attendanceSemesterFilter === "all") return true;
      return String(registration.semester || "").trim() === attendanceSemesterFilter;
    })
    .filter((registration) => {
      if (attendanceClubFilter === "all") return true;
      return registration.clubName === attendanceClubFilter;
    })
    .filter((registration) => {
      if (attendanceDateFilter === "all") return true;
      const days = Number(attendanceDateFilter);
      if (!Number.isFinite(days)) return true;
      const eventDate = new Date(registration.eventDate);
      if (Number.isNaN(eventDate.getTime())) return true;
      const threshold = Date.now() - days * 24 * 60 * 60 * 1000;
      return eventDate.getTime() >= threshold;
    })
    .filter((registration) => {
      const q = attendanceSearch.trim().toLowerCase();
      if (!q) return true;
      return (
        registration.eventTitle?.toLowerCase().includes(q) ||
        registration.clubName?.toLowerCase().includes(q) ||
        registration.eventDate?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (attendanceSort === "club") {
        return (a.clubName || "").localeCompare(b.clubName || "");
      }
      if (attendanceSort === "status") {
        const order = { present: 0, pending: 1, absent: 2 } as const;
        const statusA = (a.attendanceStatus || "pending") as keyof typeof order;
        const statusB = (b.attendanceStatus || "pending") as keyof typeof order;
        return order[statusA] - order[statusB];
      }
      const dateA = new Date(a.eventDate).getTime();
      const dateB = new Date(b.eventDate).getTime();
      const safeA = Number.isNaN(dateA) ? 0 : dateA;
      const safeB = Number.isNaN(dateB) ? 0 : dateB;
      return attendanceSort === "date-asc" ? safeA - safeB : safeB - safeA;
    });

  const filteredPresentCount = filteredStudentRegistrations.filter((r) => r.attendanceStatus === "present").length;
  const filteredAbsentCount = filteredStudentRegistrations.filter((r) => r.attendanceStatus === "absent").length;
  const filteredPendingCount = filteredStudentRegistrations.filter(
    (r) => r.attendanceStatus === "pending" || !r.attendanceStatus,
  ).length;
  const filteredMarkedCount = filteredPresentCount + filteredAbsentCount;
  const filteredAttendanceRate =
    filteredMarkedCount > 0 ? Math.round((filteredPresentCount / filteredMarkedCount) * 100) : 0;
  const clubIdByName = new Map(clubs.map((club) => [club.name, club.id] as const));
  const attendanceDisputeMap = new Map(
    (attendanceDisputesData?.disputes || []).map((dispute) => [dispute.registrationId, dispute] as const)
  );
  const totalPoints = studentPointsData?.totalPoints || 0;
  const nextMilestone = [100, 250, 500, 750, 1000].find((target) => target > totalPoints) || null;
  const pointsToNextMilestone = nextMilestone ? Math.max(nextMilestone - totalPoints, 0) : 0;
  const filteredStudentAnnouncements = studentAnnouncements.filter(
    (announcement) => !hiddenAnnouncementIds.includes(String(announcement.id)),
  );

  const getAnnouncementPriority = (announcement: any) => {
    const text = `${announcement?.title || ""} ${announcement?.content || ""}`.toLowerCase();
    if (/(urgent|deadline|today|immediately|important)/.test(text)) {
      return { label: "High", variant: "destructive" as const };
    }
    if (/(event|club|registration|meeting|certificate)/.test(text)) {
      return { label: "Update", variant: "secondary" as const };
    }
    return { label: "Info", variant: "outline" as const };
  };



  const notificationPreferences =
    studentPreferencesData?.notificationPreferences || {
      eventReminders: true,
      attendanceUpdates: true,
      announcements: true,
      certificates: true,
    };

  const smartReminders = reminderData?.reminders || [];
  const savedEvents = watchlistData?.savedEvents || [];
  const savedClubs = watchlistData?.savedClubs || [];
  const highPriorityReminderCount = smartReminders.filter((reminder) => reminder.priority === "high").length;
  const visibleOverviewReminders = showAllOverviewReminders ? smartReminders : smartReminders.slice(0, 2);
  const visibleOverviewUpcomingEvents = showAllOverviewUpcomingEvents ? upcomingEvents : upcomingEvents.slice(0, 2);
  const visibleOverviewSavedEvents = showAllOverviewSavedEvents ? savedEvents : savedEvents.slice(0, 2);
  const visibleOverviewSavedClubs = showAllOverviewSavedClubs ? savedClubs : savedClubs.slice(0, 2);

  const getGridHeight = (rowCount: number) => {
    const computed = 96 + rowCount * 44;
    return Math.max(220, Math.min(520, computed));
  };

  const handleExportAttendanceCSV = () => {
    if (filteredStudentRegistrations.length === 0) {
      toast({
        title: "No data to export",
        description: "Apply different filters or register for events first.",
      });
      return;
    }

    const escapeCsv = (value: unknown) => {
      const raw = String(value ?? "");
      const escaped = raw.replace(/"/g, '""');
      return `"${escaped}"`;
    };

    const headers = [
      "Event",
      "Event Date",
      "Event Time",
      "Club",
      "Year",
      "Semester",
      "Status",
      "Marked At",
      "Registered At",
      "Registration Status",
    ];

    const rows = filteredStudentRegistrations.map((registration) => [
      registration.eventTitle,
      registration.eventDate,
      registration.eventTime,
      registration.clubName,
      registration.year || "N/A",
      registration.semester || "N/A",
      registration.attendanceStatus || "pending",
      registration.attendanceMarkedAt || "Not marked",
      registration.registeredAt || "N/A",
      registration.status || "N/A",
    ]);

    const csvContent = [headers, ...rows]
      .map((line) => line.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-record-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Downloaded ${filteredStudentRegistrations.length} attendance records.`,
    });
  };

  const handleExportAttendancePDF = () => {
    if (filteredStudentRegistrations.length === 0) {
      toast({
        title: "No data to export",
        description: "Apply different filters or register for events first.",
      });
      return;
    }

    const printWindow = window.open("", "_blank", "width=1080,height=720");
    if (!printWindow) {
      toast({
        title: "Popup blocked",
        description: "Allow popups to export attendance as PDF.",
        variant: "destructive",
      });
      return;
    }

    const escapeHtml = (value: unknown) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    const rowsHtml = filteredStudentRegistrations
      .map((registration) => {
        const markedAt = registration.attendanceMarkedAt
          ? new Date(registration.attendanceMarkedAt).toLocaleString()
          : "Not marked";
        return `
          <tr>
            <td>${escapeHtml(registration.eventTitle)}</td>
            <td>${escapeHtml(registration.eventDate)}</td>
            <td>${escapeHtml(registration.eventTime)}</td>
            <td>${escapeHtml(registration.clubName)}</td>
            <td>${escapeHtml(registration.year || "N/A")}</td>
            <td>${escapeHtml(registration.semester || "N/A")}</td>
            <td>${escapeHtml(registration.attendanceStatus || "pending")}</td>
            <td>${escapeHtml(markedAt)}</td>
            <td>${escapeHtml(registration.status || "N/A")}</td>
          </tr>`;
      })
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin: 0 0 6px; font-size: 22px; }
            .meta { color: #555; margin-bottom: 16px; font-size: 13px; }
            .chips { margin-bottom: 16px; font-size: 12px; color: #333; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f3f3; }
          </style>
        </head>
        <body>
          <h1>Student Attendance Report</h1>
          <div class="meta">Generated: ${new Date().toLocaleString()} | Enrollment: ${escapeHtml(student?.enrollment || "N/A")}</div>
          <div class="chips">Filtered records: ${filteredStudentRegistrations.length} | Present: ${filteredPresentCount} | Absent: ${filteredAbsentCount} | Pending: ${filteredPendingCount} | Rate: ${filteredAttendanceRate}%</div>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Date</th>
                <th>Time</th>
                <th>Club</th>
                <th>Year</th>
                <th>Semester</th>
                <th>Status</th>
                <th>Marked At</th>
                <th>Registration Status</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </body>
      </html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();

    toast({
      title: "PDF ready",
      description: "Use Print dialog to save as PDF.",
    });
  };

  const applyAttendancePreset = (preset: "all" | "pending" | "this-month" | "attention") => {
    if (preset === "all") {
      setAttendanceSearch("");
      setAttendanceStatusFilter("all");
      setAttendanceClubFilter("all");
      setAttendanceYearFilter("all");
      setAttendanceSemesterFilter("all");
      setAttendanceDateFilter("all");
      setAttendanceSort("date-desc");
      return;
    }

    if (preset === "pending") {
      setAttendanceStatusFilter("pending");
      setAttendanceYearFilter("all");
      setAttendanceSemesterFilter("all");
      setAttendanceDateFilter("all");
      setAttendanceSort("date-desc");
      return;
    }

    if (preset === "this-month") {
      setAttendanceDateFilter("30");
      setAttendanceStatusFilter("all");
      setAttendanceYearFilter("all");
      setAttendanceSemesterFilter("all");
      setAttendanceSort("date-desc");
      return;
    }

    setAttendanceDateFilter("90");
    setAttendanceStatusFilter("all");
    setAttendanceYearFilter("all");
    setAttendanceSemesterFilter("all");
    setAttendanceSort("status");
  };

  const submitAttendanceDispute = (registrationId: string) => {
    const reason = (attendanceDisputeDrafts[registrationId] || "").trim();
    if (!reason) {
      toast({
        title: "Reason required",
        description: "Please describe why this attendance record should be reviewed.",
        variant: "destructive",
      });
      return;
    }

    submitAttendanceDisputeMutation.mutate(
      { registrationId, reason },
      {
        onSuccess: () => {
          setAttendanceDisputeDrafts((prev) => ({ ...prev, [registrationId]: "" }));
        },
      }
    );
  };

  const gridThemeClass = theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

  const attendanceGridRows = useMemo<AttendanceGridRow[]>(() => {
    return filteredStudentRegistrations.map((registration, index) => {
      const registrationId = String(registration.id);
      const eventDateValue = new Date(registration.eventDate).getTime();
      const safeEventDateValue = Number.isNaN(eventDateValue) ? 0 : eventDateValue;
      const markedAtValue = registration.attendanceMarkedAt
        ? new Date(registration.attendanceMarkedAt).getTime()
        : 0;
      const safeMarkedAtValue = Number.isNaN(markedAtValue) ? 0 : markedAtValue;

      return {
        srNo: (attendancePage - 1) * attendancePageSize + index + 1,
        registrationId,
        eventId: registration.eventId,
        eventTitle: registration.eventTitle,
        eventTime: registration.eventTime || "",
        eventDateDisplay: safeEventDateValue
          ? new Date(safeEventDateValue).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : registration.eventDate,
        eventDateValue: safeEventDateValue,
        clubName: registration.clubName || "N/A",
        status: (registration.attendanceStatus || "pending") as "present" | "absent" | "pending",
        markedAtDisplay: safeMarkedAtValue
          ? new Date(safeMarkedAtValue).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Not marked",
        markedAtValue: safeMarkedAtValue,
      };
    });
  }, [filteredStudentRegistrations, attendancePage, attendancePageSize]);

  const attendanceGridColumns = useMemo<ColDef<AttendanceGridRow>[]>(
    () => [
      {
        field: "srNo",
        headerName: "Sr No",
        width: 90,
        filter: false,
        sortable: false,
        pinned: "left",
      },
      {
        field: "eventTitle",
        headerName: "Event",
        flex: 1.3,
        minWidth: 240,
      },
      {
        field: "eventDateDisplay",
        headerName: "Date",
        width: 140,
        comparator: (_a, _b, nodeA, nodeB) =>
          ((nodeA?.data?.eventDateValue as number) || 0) - ((nodeB?.data?.eventDateValue as number) || 0),
      },
      {
        field: "clubName",
        headerName: "Club",
        width: 160,
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        filter: "agSetColumnFilter",
        cellRenderer: (params: any) => {
          const value = String(params.value || "pending").toLowerCase();
          const variant = value === "present" ? "default" : value === "absent" ? "destructive" : "outline";
          return (
            <Badge variant={variant as any} className="capitalize text-[11px] leading-none">
              {value === "present" ? "✓ " : value === "absent" ? "✗ " : ""}
              {value}
            </Badge>
          );
        },
      },
      {
        field: "markedAtDisplay",
        headerName: "Marked At",
        width: 210,
        comparator: (_a, _b, nodeA, nodeB) =>
          ((nodeA?.data?.markedAtValue as number) || 0) - ((nodeB?.data?.markedAtValue as number) || 0),
      },
      {
        headerName: "Actions",
        width: 250,
        sortable: false,
        filter: false,
        resizable: false,
        cellRenderer: (params: any) => {
          const row = params.data as AttendanceGridRow | undefined;
          if (!row) return null;
          const matchedClubId = clubIdByName.get(row.clubName);
          const isExpanded = expandedAttendanceRowId === row.registrationId;

          return (
            <div className="flex h-full items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px]"
                onClick={() => setLocation(`/events/${row.eventId}`)}
              >
                Event
              </Button>
              {matchedClubId && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[11px]"
                  onClick={() => setLocation(`/clubs/${matchedClubId}`)}
                >
                  Club
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-[11px]"
                onClick={() => setExpandedAttendanceRowId(isExpanded ? null : row.registrationId)}
              >
                {isExpanded ? "Hide" : "Details"}
              </Button>
            </div>
          );
        },
      },
    ],
    [clubIdByName, expandedAttendanceRowId, setLocation]
  );

  const filteredMemberships = useMemo(() => {
    const q = membershipsSearch.trim().toLowerCase();
    if (!q) return memberships;
    return memberships.filter((membership) => {
      return (
        String(membership.clubName || "").toLowerCase().includes(q) ||
        String(membership.status || "").toLowerCase().includes(q) ||
        String(membership.enrollmentNumber || "").toLowerCase().includes(q) ||
        String(membership.department || "").toLowerCase().includes(q)
      );
    });
  }, [memberships, membershipsSearch]);

  const membershipsGridRows = useMemo<MembershipGridRow[]>(() => {
    const source = showAllMemberships ? filteredMemberships : filteredMemberships.slice(0, 6);
    return source.map((membership, index) => ({
      srNo: index + 1,
      id: String(membership.id),
      clubId: String(membership.clubId || ""),
      clubName: String(membership.clubName || "-"),
      status: String(membership.status || "pending"),
      enrollment: String(membership.enrollmentNumber || "-"),
      department: String(membership.department || "-"),
    }));
  }, [filteredMemberships, showAllMemberships]);

  const membershipsGridColumns = useMemo<ColDef<MembershipGridRow>[]>(
    () => [
      { field: "srNo", headerName: "Sr No", width: 90, sortable: false, filter: false },
      { field: "clubName", headerName: "Club", flex: 1.2, minWidth: 170 },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        cellRenderer: (params: any) => {
          const status = String(params.value || "pending").toLowerCase();
          const variant = status === "approved" ? "default" : status === "pending" ? "secondary" : "destructive";
          return <Badge variant={variant as any}>{status}</Badge>;
        },
      },
      { field: "enrollment", headerName: "Enrollment", minWidth: 140 },
      { field: "department", headerName: "Department", minWidth: 170 },
    ],
    [],
  );

  const filteredRegisteredEvents = useMemo(() => {
    const q = registeredEventsSearch.trim().toLowerCase();
    if (!q) return studentRegistrations;
    return studentRegistrations.filter((registration) => {
      return (
        String(registration.eventTitle || "").toLowerCase().includes(q) ||
        String(registration.eventDate || "").toLowerCase().includes(q) ||
        String(registration.eventTime || "").toLowerCase().includes(q) ||
        String(registration.enrollmentNumber || "").toLowerCase().includes(q) ||
        String(registration.clubName || "").toLowerCase().includes(q)
      );
    });
  }, [studentRegistrations, registeredEventsSearch]);

  const registeredEventsGridRows = useMemo<RegisteredEventGridRow[]>(() => {
    const source = showAllRegisteredEvents ? filteredRegisteredEvents : filteredRegisteredEvents.slice(0, 6);
    return source.map((registration, index) => ({
      srNo: index + 1,
      id: String(registration.id),
      eventId: String(registration.eventId || ""),
      eventTitle: String(registration.eventTitle || "-"),
      dateTime: `${registration.eventDate || ""}${registration.eventTime ? ` at ${registration.eventTime}` : ""}`,
      enrollment: String(registration.enrollmentNumber || "-"),
      clubName: String(registration.clubName || "-"),
    }));
  }, [filteredRegisteredEvents, showAllRegisteredEvents]);

  const registeredEventsGridColumns = useMemo<ColDef<RegisteredEventGridRow>[]>(
    () => [
      { field: "srNo", headerName: "Sr No", width: 90, sortable: false, filter: false },
      { field: "eventTitle", headerName: "Event", flex: 1.2, minWidth: 190 },
      { field: "dateTime", headerName: "Date & Time", flex: 1.1, minWidth: 190 },
      { field: "enrollment", headerName: "Enrollment", minWidth: 140 },
      {
        field: "clubName",
        headerName: "Club",
        width: 130,
        cellRenderer: (params: any) => <Badge variant="secondary">{String(params.value || "-")}</Badge>,
      },
    ],
    [],
  );

  const searchedNotifications = useMemo(() => {
    const q = notificationsSearch.trim().toLowerCase();
    if (!q) return filteredStudentAnnouncements;
    return filteredStudentAnnouncements.filter((announcement) => {
      const priorityLabel = getAnnouncementPriority(announcement).label;
      return (
        String(announcement.title || "").toLowerCase().includes(q) ||
        String(announcement.content || "").toLowerCase().includes(q) ||
        String(announcement.authorName || "").toLowerCase().includes(q) ||
        String(priorityLabel || "").toLowerCase().includes(q)
      );
    });
  }, [filteredStudentAnnouncements, notificationsSearch]);

  const notificationsGridRows = useMemo<NotificationGridRow[]>(() => {
    const source = showAllNotifications ? searchedNotifications : searchedNotifications.slice(0, 8);
    return source.map((announcement, index) => {
      const priority = getAnnouncementPriority(announcement);
      return {
        srNo: index + 1,
        id: String(announcement.id),
        target: String(announcement.target || "all"),
        title: String(announcement.title || ""),
        message: String(announcement.content || ""),
        priority: priority.label,
        author: String(announcement.authorName || "admin"),
        createdAt: announcement.createdAt ? new Date(announcement.createdAt).toLocaleString() : "",
        isRead: Boolean(announcement.isRead),
      };
    });
  }, [searchedNotifications, showAllNotifications]);

  const notificationsGridColumns = useMemo<ColDef<NotificationGridRow>[]>(
    () => [
      { field: "srNo", headerName: "Sr No", width: 90, sortable: false, filter: false },
      {
        field: "title",
        headerName: "Title",
        flex: 1.1,
        minWidth: 180,
        cellRenderer: (params: any) => {
          const row = params.data as NotificationGridRow;
          return (
            <div className="flex items-center gap-2">
              <span>{String(params.value || "")}</span>
              {!row?.isRead && <Badge variant="destructive">New</Badge>}
            </div>
          );
        },
      },
      { field: "message", headerName: "Message", flex: 1.4, minWidth: 220 },
      {
        field: "priority",
        headerName: "Priority",
        width: 120,
        cellRenderer: (params: any) => {
          const value = String(params.value || "Info");
          const variant = value === "High" ? "destructive" : value === "Update" ? "secondary" : "outline";
          return <Badge variant={variant as any}>{value}</Badge>;
        },
      },
      { field: "author", headerName: "Author", width: 110 },
      { field: "createdAt", headerName: "Created At", minWidth: 180 },
      {
        headerName: "Actions",
        width: 220,
        sortable: false,
        filter: false,
        cellRenderer: (params: any) => {
          const row = params.data as NotificationGridRow;
          if (!row) return null;

          return (
            <div className="flex h-full items-center gap-2">
              {!row.isRead && (
                <Button
                  size="sm"
                  onClick={async (e) => {
                    e.stopPropagation();
                    await apiRequest("POST", `/api/student/announcements/${row.id}/read`);
                    queryClient.invalidateQueries({ queryKey: ["/api/student/announcements"] });
                  }}
                >
                  Mark read
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setHiddenAnnouncementIds((prev) => {
                    const next = new Set(prev);
                    next.add(row.id);
                    return Array.from(next);
                  });
                }}
              >
                Hide
              </Button>
            </div>
          );
        },
      },
    ],
    [setHiddenAnnouncementIds],
  );

  const expandedRegistration = expandedAttendanceRowId
    ? filteredStudentRegistrations.find((registration) => String(registration.id) === expandedAttendanceRowId)
    : null;

  useEffect(() => {
    if (hasAppliedDefaultSemesterFilter.current) return;
    if (registrationsData === undefined) return;

    const currentSemester = String(student?.currentSemester || "").trim();
    if (!currentSemester) {
      hasAppliedDefaultSemesterFilter.current = true;
      return;
    }

    const matchedSemester = attendanceSemesterOptions.find(
      (semester) => semester.toLowerCase() === currentSemester.toLowerCase(),
    );

    if (matchedSemester) {
      setAttendanceSemesterFilter(matchedSemester);
    }

    hasAppliedDefaultSemesterFilter.current = true;
  }, [student?.currentSemester, attendanceSemesterOptions, registrationsData]);

  useEffect(() => {
    setAttendancePage(1);
  }, [attendanceYearFilter, attendanceSemesterFilter]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/85 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-semibold">Student Dashboard</h1>
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Personal activity hub</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Welcome, {student?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative bg-background/50">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_40%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.07),transparent_42%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 sm:grid-cols-4">
            <Card className="group border border-blue-500/25 bg-[linear-gradient(165deg,rgba(30,58,138,0.22),rgba(30,41,59,0.32))] px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-[0_10px_30px_-18px_rgba(37,99,235,0.7)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400/45">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-primary/12 transition-colors group-hover:bg-primary/18 sm:h-9 sm:w-9">
                  <Users className="h-3.5 w-3.5 text-primary/95 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-none sm:text-lg">{memberships.length}</p>
                  <p className="text-[11px] text-muted-foreground">Joined Clubs</p>
                </div>
              </div>
            </Card>
            <Card className="group border border-violet-500/25 bg-[linear-gradient(165deg,rgba(109,40,217,0.18),rgba(30,41,59,0.32))] px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-[0_10px_30px_-18px_rgba(139,92,246,0.65)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-violet-400/45">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-chart-2/35 bg-chart-2/12 transition-colors group-hover:bg-chart-2/20 sm:h-9 sm:w-9">
                  <Calendar className="h-3.5 w-3.5 text-chart-2/95 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-none sm:text-lg">{studentRegistrations.length}</p>
                  <p className="text-[11px] text-muted-foreground">Registered</p>
                </div>
              </div>
            </Card>
            <Card className="group border border-emerald-500/25 bg-[linear-gradient(165deg,rgba(5,150,105,0.18),rgba(30,41,59,0.32))] px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-[0_10px_30px_-18px_rgba(16,185,129,0.7)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/45">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-chart-3/35 bg-chart-3/12 transition-colors group-hover:bg-chart-3/20 sm:h-9 sm:w-9">
                  <Trophy className="h-3.5 w-3.5 text-chart-3/95 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-none sm:text-lg">{studentPointsData?.badges?.length || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Achievements</p>
                </div>
              </div>
            </Card>
            <Card className="group border border-orange-500/25 bg-[linear-gradient(165deg,rgba(234,88,12,0.2),rgba(30,41,59,0.32))] px-2.5 py-2 sm:px-3 sm:py-2.5 shadow-[0_10px_30px_-18px_rgba(251,146,60,0.7)] backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-orange-400/45">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-chart-4/35 bg-chart-4/12 transition-colors group-hover:bg-chart-4/20 sm:h-9 sm:w-9">
                  <Target className="h-3.5 w-3.5 text-chart-4/95 sm:h-4 sm:w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-none sm:text-lg">{studentPointsData?.totalPoints || 0}</p>
                  <p className="text-[11px] text-muted-foreground">Points</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="sticky top-3 z-30 mb-5">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid h-auto w-full grid-cols-2 items-stretch gap-2 rounded-xl border border-border/70 bg-card/85 p-2 shadow-sm backdrop-blur-sm md:grid-cols-4">
              <TabsTrigger value="overview" className="h-9 w-full rounded-lg border border-transparent px-2 text-center text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Overview</TabsTrigger>
              <TabsTrigger value="attendance" className="h-9 w-full rounded-lg border border-transparent px-2 text-center text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Attendance</TabsTrigger>
              <TabsTrigger value="achievements" className="h-9 w-full rounded-lg border border-transparent px-2 text-center text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Achievements</TabsTrigger>
              <TabsTrigger value="settings" className="h-9 w-full rounded-lg border border-transparent px-2 text-center text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Settings</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="space-y-7">
          {activeTab === "overview" && (
            <div className="space-y-6">
          {/* Welcome Section */}
          <Card className="sd-reveal sd-delay-1 relative overflow-hidden border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-md sm:p-5 lg:p-7">
            <div className="pointer-events-none absolute -left-16 top-0 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 bottom-0 h-56 w-56 rounded-full bg-muted/30 blur-3xl" />
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1.65fr)_auto] lg:items-start">
              <div className="relative space-y-3 sm:space-y-4">
                <div className="space-y-2">
                  <p className="inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-2.5 sm:text-[10px] sm:tracking-[0.2em]">Daily Snapshot</p>
                  <h2 className="text-2xl font-bold leading-tight text-foreground drop-shadow-sm sm:text-3xl lg:text-4xl">
                    Welcome back, {student?.name}! 👋
                  </h2>
                  <p className="max-w-2xl text-xs text-muted-foreground sm:text-sm lg:text-lg">
                    Ready to explore clubs and events? Your key actions are grouped so you can jump straight into what matters.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 border border-border/70 bg-secondary text-[11px] shadow-sm">
                    <Star className="h-3 w-3" />
                    {student?.enrollment}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 border-border/70 bg-background/70 text-[11px] shadow-sm">
                    <BookOpen className="h-3 w-3" />
                    {student?.department || student?.branch || "Branch not set"}
                  </Badge>
                  {student?.currentSemester && (
                    <Badge variant="outline" className="flex items-center gap-1 border-border/70 bg-background/70 text-[11px] shadow-sm">
                      <TrendingUp className="h-3 w-3" />
                      {student.currentSemester}
                    </Badge>
                  )}
                  <Badge variant={profileCompletion === 100 ? "secondary" : "outline"} className="flex items-center gap-1 border-border/70 bg-background/70 text-[11px] shadow-sm">
                    <Target className="h-3 w-3" />
                    {profileCompletion}% complete
                  </Badge>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Contact email</p>
                    <p className="mt-1 truncate text-sm font-medium">{student?.email || "Not available"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Admission year</p>
                    <p className="mt-1 text-sm font-medium">{student?.yearOfAdmission || "Not set"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Semester</p>
                    <p className="mt-1 text-sm font-medium">{student?.currentSemester || "Not set"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Enrollment no.</p>
                    <p className="mt-1 text-sm font-medium">{student?.enrollment || "Not available"}</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 sm:col-span-2 lg:col-span-1">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Club designation</p>
                    <p className="mt-1 truncate text-sm font-medium">{clubDesignation}</p>
                  </div>
                </div>
                <div className="md:hidden">
                  <div className="mt-2 rounded-2xl border border-border/70 bg-card/85 p-3.5 shadow-sm backdrop-blur-md">
                    <div className="flex items-center gap-3">
                      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full p-[2px]" style={{ background: `conic-gradient(rgba(59,130,246,0.95) ${profileCompletionPercent * 3.6}deg, rgba(148,163,184,0.35) ${profileCompletionPercent * 3.6}deg)` }}>
                        <button
                          type="button"
                          aria-label="Upload profile picture"
                          className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/45 bg-primary/15 p-0 transition-all duration-300 hover:scale-[1.03] hover:bg-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          onClick={handleProfilePictureClick}
                          title="Click to upload profile picture"
                        >
                          {student?.profilePicture || profileImage ? (
                            <img src={student?.profilePicture || profileImage || ''} alt="Profile" className="h-full w-full rounded-full object-cover" />
                          ) : (
                            <Users className="h-6 w-6 text-primary" />
                          )}
                          {isUploadingProfile && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                            </div>
                          )}
                        </button>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">Profile photo</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {profileCompletionPercent}% profile complete · {" "}
                          {isUploadingProfile
                            ? "Uploading..."
                            : profileUploadCooldownSeconds > 0
                              ? `Retry in ${profileUploadCooldownSeconds}s`
                              : "Tap to replace"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3 h-8 w-full border-border/70 bg-background/70 text-xs transition-colors hover:bg-background"
                      onClick={handleProfilePictureClick}
                      disabled={isUploadingProfile || profileUploadCooldownSeconds > 0}
                    >
                      {isUploadingProfile
                        ? "Uploading..."
                        : profileUploadCooldownSeconds > 0
                          ? `Retry in ${profileUploadCooldownSeconds}s`
                          : "Change Photo"}
                    </Button>
                  </div>
                </div>
              </div>
              <div className="hidden md:block self-start">
                <div className="flex w-[240px] items-center justify-center rounded-[28px] border border-border/70 bg-card/85 p-5 shadow-sm backdrop-blur-md">
                  <button
                    type="button"
                    aria-label="Upload profile picture"
                    className="relative flex h-[132px] w-[132px] items-center justify-center overflow-hidden rounded-full border border-border/70 bg-background/70 p-0 shadow-lg transition-all duration-300 hover:scale-[1.02] hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={handleProfilePictureClick}
                    title="Click to upload profile picture"
                  >
                    {student?.profilePicture || profileImage ? (
                      <img src={student?.profilePicture || profileImage || ''} alt="Profile" className="h-full w-full rounded-full object-cover" />
                    ) : (
                      <Users className="h-10 w-10 text-primary" />
                    )}
                    {isUploadingProfile && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      </div>
                    )}
                  </button>
                  </div>
                </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfilePictureChange}
                disabled={isUploadingProfile || profileUploadCooldownSeconds > 0}
              />
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="sd-reveal sd-delay-4 border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-md sm:p-6">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Smart Reminders
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">Everything that needs your attention right now.</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    <Badge variant="outline" className="text-xs border-border/70 bg-background/70">AI-like assist</Badge>
                    {smartReminders.length > 2 && !isOverviewRemindersCollapsed && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-border/70 bg-background/70 px-2.5 text-xs hover:bg-background"
                        onClick={() => setShowAllOverviewReminders((prev) => !prev)}
                      >
                        {showAllOverviewReminders ? "Show Less" : "View All"}
                      </Button>
                    )}
                    {smartReminders.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 border-border/70 bg-background/70 px-2.5 text-xs hover:bg-background"
                        onClick={() => setIsOverviewRemindersCollapsed((prev) => !prev)}
                      >
                        {isOverviewRemindersCollapsed ? "Expand" : "Collapse"}
                      </Button>
                    )}
                  </div>
                </div>
                {smartReminders.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                    No reminders right now. You are fully on track.
                  </div>
                ) : isOverviewRemindersCollapsed ? (
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border border-primary/30">{smartReminders.length} reminders pending</Badge>
                      <Badge variant={highPriorityReminderCount > 0 ? "destructive" : "outline"}>
                        High priority {highPriorityReminderCount}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Expand to review and dismiss reminders.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleOverviewReminders.map((reminder) => (
                      <div key={reminder.id} className="rounded-xl border border-border/70 bg-background/60 p-3.5 transition-colors hover:bg-background sm:p-4">
                        <div className="mb-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <p className="text-sm font-semibold">{reminder.title}</p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                reminder.priority === "high"
                                  ? "destructive"
                                  : reminder.priority === "medium"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-[10px] uppercase"
                            >
                              {reminder.priority}
                            </Badge>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                              disabled={dismissReminderMutation.isPending}
                              onClick={() => dismissReminderMutation.mutate(reminder.id)}
                            >
                              Dismiss
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{reminder.description}</p>
                        <p className="mt-2 text-[11px] font-medium text-primary">Suggested: {reminder.action}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card id="upcoming-timeline" className="sd-reveal sd-delay-5 border border-border/70 bg-card/80 p-4 shadow-sm backdrop-blur-md sm:p-6">
                <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Upcoming Events Timeline
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">The next events you can act on.</p>
                  </div>
                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
                    {upcomingEvents.length > 2 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-8 border-border/70 bg-background/70 px-2.5 text-xs hover:bg-background"
                        onClick={() => setShowAllOverviewUpcomingEvents((prev) => !prev)}
                      >
                        {showAllOverviewUpcomingEvents ? "Show Less" : "View All"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-8 border-border/70 bg-background/70 px-2.5 text-xs hover:bg-background" onClick={() => setLocation("/events")}>Explore Events</Button>
                  </div>
                </div>
                {upcomingEvents.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                    No upcoming events are scheduled right now.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visibleOverviewUpcomingEvents.map((event) => {
                      const daysUntil = Math.max(
                        0,
                        Math.ceil((new Date(event.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
                      );
                      const isRegistered = studentRegistrations.some((registration) => registration.eventId === event.id);

                      return (
                        <div key={event.id} className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background/60 p-3.5 transition-colors hover:bg-background sm:p-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold">{event.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()} at {event.time} • {event.location}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{daysUntil}d left</Badge>
                            <Badge variant={isRegistered ? "secondary" : "default"}>
                              {isRegistered ? "Registered" : "Open"}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              <Card id="saved-watchlist" className="sd-reveal sd-delay-6 border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-md">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Bookmark className="h-5 w-5 text-primary" />
                      Saved Watchlist
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground">Shortcuts to your saved items.</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {savedEvents.length + savedClubs.length} saved
                  </Badge>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Saved Events</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{savedEvents.length}</Badge>
                        {savedEvents.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setShowAllOverviewSavedEvents((prev) => !prev)}
                          >
                            {showAllOverviewSavedEvents ? "Less" : "All"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {savedEvents.length > 0 ? (
                        visibleOverviewSavedEvents.map((event) => (
                          <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/80 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{event.title}</p>
                              <p className="text-xs text-muted-foreground">{event.clubName} • {event.date}</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setLocation(`/events/${event.id}`)}>
                              Open <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                          No saved events yet. Bookmark upcoming events to keep them in one place.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-background/60 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-sm font-semibold">Saved Clubs</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{savedClubs.length}</Badge>
                        {savedClubs.length > 2 && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={() => setShowAllOverviewSavedClubs((prev) => !prev)}
                          >
                            {showAllOverviewSavedClubs ? "Less" : "All"}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {savedClubs.length > 0 ? (
                        visibleOverviewSavedClubs.map((club) => (
                          <div key={club.id} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/80 p-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{club.name}</p>
                              <p className="text-xs text-muted-foreground">{club.category} • {club.memberCount} members</p>
                            </div>
                            <Button size="sm" variant="outline" onClick={() => setLocation(`/clubs/${club.id}`)}>
                              Open <ArrowRight className="ml-2 h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="rounded-lg border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                          No saved clubs yet. Bookmark clubs you like to build your watchlist.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
          )}

          {/* Attendance Section */}
          {activeTab === "attendance" && (
          <Card id="attendance-record" className="sd-reveal sd-delay-7 border border-border/70 bg-card/80 p-6">
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
                  {filteredPresentCount} / {filteredStudentRegistrations.length} Present
                </Badge>
                <p className="text-xs text-muted-foreground">Enrollment: {student?.enrollment}</p>
              </div>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-8">
              <div className="flex flex-wrap items-center gap-2 lg:col-span-6">
                <Button type="button" size="sm" variant="outline" onClick={() => applyAttendancePreset("all")}>
                  All records
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyAttendancePreset("pending")}>
                  Pending only
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyAttendancePreset("this-month")}>
                  This month
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => applyAttendancePreset("attention")}>
                  Needs attention
                </Button>
                <Badge variant="outline" className="ml-auto text-[11px] uppercase tracking-wide">
                  Compact tabular view
                </Badge>
              </div>
              <Input
                value={attendanceSearch}
                onChange={(e) => setAttendanceSearch(e.target.value)}
                placeholder="Search event, club, date..."
                className="lg:col-span-2"
              />
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceStatusFilter}
                onChange={(e) => setAttendanceStatusFilter(e.target.value as typeof attendanceStatusFilter)}
              >
                <option value="all">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="pending">Pending</option>
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceClubFilter}
                onChange={(e) => setAttendanceClubFilter(e.target.value)}
              >
                <option value="all">All Clubs</option>
                {attendanceClubOptions.map((clubName) => (
                  <option key={clubName} value={clubName}>
                    {clubName}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceYearFilter}
                onChange={(e) => setAttendanceYearFilter(e.target.value)}
              >
                <option value="all">All Years</option>
                {attendanceYearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceSemesterFilter}
                onChange={(e) => setAttendanceSemesterFilter(e.target.value)}
              >
                <option value="all">All Semesters</option>
                {attendanceSemesterOptions.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceDateFilter}
                onChange={(e) => setAttendanceDateFilter(e.target.value as typeof attendanceDateFilter)}
              >
                <option value="all">All Dates</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last 1 year</option>
              </select>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 text-sm"
                value={attendanceSort}
                onChange={(e) => setAttendanceSort(e.target.value as typeof attendanceSort)}
              >
                <option value="date-desc">Sort: Newest</option>
                <option value="date-asc">Sort: Oldest</option>
                <option value="status">Sort: Status</option>
                <option value="club">Sort: Club</option>
              </select>
            </div>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/50 p-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="secondary">Filtered: {filteredStudentRegistrations.length}</Badge>
                <Badge variant="outline">Present {filteredPresentCount}</Badge>
                <Badge variant="outline">Absent {filteredAbsentCount}</Badge>
                <Badge variant="outline">Pending {filteredPendingCount}</Badge>
                <Badge variant="outline">Rate {filteredAttendanceRate}%</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={handleExportAttendanceCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={handleExportAttendancePDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAttendanceSearch("");
                    setAttendanceStatusFilter("all");
                    setAttendanceClubFilter("all");
                    setAttendanceYearFilter("all");
                    setAttendanceSemesterFilter("all");
                    setAttendanceDateFilter("all");
                    setAttendanceSort("date-desc");
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
            <Card className="p-4 border border-border/70 bg-card/70">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">Attendance Grid</h4>
                <span className="text-xs text-muted-foreground">Click Details in a row to open dispute tools</span>
              </div>
              <div className={`${gridThemeClass} student-attendance-grid`} style={{ height: 470, width: "100%" }}>
                <AgGridReact<AttendanceGridRow>
                  rowData={attendanceGridRows}
                  columnDefs={attendanceGridColumns}
                  defaultColDef={{ sortable: true, filter: true, resizable: true }}
                  animateRows
                  rowHeight={42}
                  headerHeight={42}
                  rowSelection="single"
                  pagination={false}
                  onRowClicked={(event) => {
                    if (event.data?.registrationId) {
                      setSelectedAttendanceGridId(event.data.registrationId);
                    }
                  }}
                  getRowClass={(params) =>
                    params.data?.registrationId === selectedAttendanceGridId
                      ? "student-attendance-grid-row-selected"
                      : "student-attendance-grid-row"
                  }
                />
              </div>
              {registrationsPagination && registrationsPagination.totalPages > 1 && (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-background/55 p-3">
                  <div className="text-xs text-muted-foreground">
                    Page {registrationsPagination.page} of {registrationsPagination.totalPages} • Total {registrationsPagination.total} records
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      value={attendancePageSize}
                      onChange={(e) => {
                        const nextSize = Number(e.target.value) || 25;
                        setAttendancePageSize(nextSize);
                        setAttendancePage(1);
                      }}
                    >
                      <option value={10}>10 / page</option>
                      <option value={25}>25 / page</option>
                      <option value={50}>50 / page</option>
                      <option value={100}>100 / page</option>
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={registrationsPagination.page <= 1}
                      onClick={() => setAttendancePage((prev) => Math.max(1, prev - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={registrationsPagination.page >= registrationsPagination.totalPages}
                      onClick={() =>
                        setAttendancePage((prev) => Math.min(registrationsPagination.totalPages, prev + 1))
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              {attendanceGridRows.length === 0 && (
                <div className="py-10 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-sm text-muted-foreground font-medium">No attendance records match your filters</p>
                </div>
              )}
            </Card>

            {expandedRegistration && (
              <div className="mt-3 rounded-lg border border-border/70 bg-background/70 p-4">
                {(() => {
                  const registrationId = String(expandedRegistration.id);
                  const existingDispute = attendanceDisputeMap.get(registrationId);

                  return (
                    <>
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">Attendance Details: {expandedRegistration.eventTitle}</p>
                        {existingDispute && (
                          <Badge
                            variant={
                              existingDispute.status === "approved"
                                ? "default"
                                : existingDispute.status === "rejected"
                                  ? "destructive"
                                  : "secondary"
                            }
                            className="text-[10px] capitalize"
                          >
                            {existingDispute.status}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-xs text-muted-foreground md:grid-cols-3">
                        <div>
                          <p className="font-medium text-foreground">Registration Metadata</p>
                          <p className="mt-1">Registration status: {expandedRegistration.status || "N/A"}</p>
                          <p>Registered at: {expandedRegistration.registeredAt ? new Date(expandedRegistration.registeredAt).toLocaleString() : "N/A"}</p>
                          <p>Enrollment: {expandedRegistration.enrollmentNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Student Context</p>
                          <p className="mt-1">Department: {expandedRegistration.department || "N/A"}</p>
                          <p>Year: {expandedRegistration.year || "N/A"}</p>
                          <p>Semester: {expandedRegistration.semester || "N/A"}</p>
                          <p>Roll number: {expandedRegistration.rollNumber || "N/A"}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Participation Details</p>
                          <p className="mt-1">Experience: {expandedRegistration.experience || "N/A"}</p>
                          <p>Interests: {expandedRegistration.interests?.length ? expandedRegistration.interests.join(", ") : "N/A"}</p>
                          <p>Offline fallback: {expandedRegistration.isFallback ? "Yes" : "No"}</p>
                        </div>
                      </div>
                      <div className="mt-4 border-t border-border/70 pt-4">
                        <p className="mb-2 text-xs font-medium text-foreground">Request Attendance Correction</p>
                        <textarea
                          className="min-h-[68px] w-full rounded-md border border-border bg-background px-3 py-2 text-xs text-foreground"
                          placeholder="Explain what needs correction (e.g., present but marked pending)."
                          value={attendanceDisputeDrafts[registrationId] || ""}
                          onChange={(e) =>
                            setAttendanceDisputeDrafts((prev) => ({
                              ...prev,
                              [registrationId]: e.target.value,
                            }))
                          }
                        />
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedAttendanceRowId(null)}
                          >
                            Close
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => submitAttendanceDispute(registrationId)}
                            disabled={submitAttendanceDisputeMutation.isPending}
                          >
                            {submitAttendanceDisputeMutation.isPending ? "Submitting..." : "Submit Request"}
                          </Button>
                        </div>
                        {existingDispute?.adminResponse && (
                          <p className="mt-2 text-xs text-muted-foreground">Admin note: {existingDispute.adminResponse}</p>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
            {filteredStudentRegistrations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-foreground">{filteredStudentRegistrations.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Total Events</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {filteredPresentCount}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-medium">Present</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {filteredAbsentCount}
                    </div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium">Absent</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {filteredPendingCount}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 font-medium">Pending</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <div className="text-2xl font-bold text-primary">{filteredAttendanceRate}%</div>
                    <div className="text-xs text-primary mt-1 font-medium">Attendance Rate</div>
                  </div>
                </div>
              </div>
            )}
          </Card>
          )}

          {/* Main Content Grid */}
          {(activeTab === "achievements" || activeTab === "settings") && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeTab === "settings" && (
            <Card className="sd-reveal sd-delay-7 border border-border/70 bg-card/80 p-6 lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Profile & Account</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Update your contact details, department, roll number, and profile photo from one place.
                  </p>
                </div>
                <Button type="button" onClick={() => setIsEditingProfile(true)}>
                  Edit Profile
                </Button>
              </div>
            </Card>
            )}

            {activeTab === "settings" && (
            <Card className="sd-reveal sd-delay-8 border border-border/70 bg-card/80 p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Notification Preferences</h3>
                <Badge variant="secondary" className="text-xs">Live</Badge>
              </div>
              <div className="space-y-4">
                {[
                  {
                    key: "eventReminders" as const,
                    label: "Event reminders",
                    description: "Receive reminders for upcoming events you registered for.",
                  },
                  {
                    key: "attendanceUpdates" as const,
                    label: "Attendance updates",
                    description: "Get notified when attendance statuses are updated.",
                  },
                  {
                    key: "announcements" as const,
                    label: "Announcements",
                    description: "Show campus and club announcements in your dashboard.",
                  },
                  {
                    key: "certificates" as const,
                    label: "Certificate reminders",
                    description: "Highlight newly available certificates and achievements.",
                  },
                ].map((pref) => (
                  <div key={pref.key} className="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-background/60 p-3">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{pref.description}</p>
                    </div>
                    <Switch
                      checked={Boolean(notificationPreferences[pref.key])}
                      disabled={updateNotificationPreferencesMutation.isPending}
                      onCheckedChange={(checked) => {
                        updateNotificationPreferencesMutation.mutate({ [pref.key]: checked });
                      }}
                    />
                  </div>
                ))}
              </div>
            </Card>
            )}

            {/* My Clubs */}
            {activeTab === "settings" && (
            <Card className="sd-reveal sd-delay-8 border border-border/70 bg-card/80 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  My Clubs
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{filteredMemberships.length}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setShowAllMemberships((prev) => !prev)}>
                    {showAllMemberships ? "Show Less" : "View All"}
                  </Button>
                </div>
              </div>
              <div className="mb-4">
                <Input
                  value={membershipsSearch}
                  onChange={(e) => setMembershipsSearch(e.target.value)}
                  placeholder="Quick search clubs, status, enrollment, department..."
                />
              </div>
              {membershipsGridRows.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No club memberships yet. Join clubs to see them here!
                </p>
              ) : (
                <div className={`${gridThemeClass}`} style={{ height: getGridHeight(membershipsGridRows.length), width: "100%" }}>
                  <AgGridReact<MembershipGridRow>
                    rowData={membershipsGridRows}
                    columnDefs={membershipsGridColumns}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    animateRows
                    rowSelection="single"
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[5, 10, 25, 50]}
                    onRowClicked={(event) => {
                      const clubId = event.data?.clubId;
                      if (clubId) {
                        setLocation(`/clubs/${clubId}`);
                      }
                    }}
                  />
                </div>
              )}
            </Card>
            )}

            {/* My Events */}
            {activeTab === "settings" && (
            <Card className="sd-reveal sd-delay-8 border border-border/70 bg-card/80 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  My Registered Events
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{filteredRegisteredEvents.length}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setShowAllRegisteredEvents((prev) => !prev)}>
                    {showAllRegisteredEvents ? "Show Less" : "View All"}
                  </Button>
                </div>
              </div>
              <div className="mb-4">
                <Input
                  value={registeredEventsSearch}
                  onChange={(e) => setRegisteredEventsSearch(e.target.value)}
                  placeholder="Quick search event, club, date, enrollment..."
                />
              </div>
              {registeredEventsGridRows.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No registered events yet. Register for events to see them here!
                </p>
              ) : (
                <div className={`${gridThemeClass}`} style={{ height: getGridHeight(registeredEventsGridRows.length), width: "100%" }}>
                  <AgGridReact<RegisteredEventGridRow>
                    rowData={registeredEventsGridRows}
                    columnDefs={registeredEventsGridColumns}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    animateRows
                    rowSelection="single"
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[5, 10, 25, 50]}
                    onRowClicked={(event) => {
                      const eventId = event.data?.eventId;
                      if (eventId) {
                        setLocation(`/events/${eventId}`);
                      }
                    }}
                  />
                </div>
              )}
            </Card>
            )}

            {/* Points & Rank */}
            {activeTab === "achievements" && (
            <Card id="points-rank" className="sd-reveal sd-delay-9 border border-border/70 bg-card/80 p-6">
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Weekly Momentum</p>
                    <p className="mt-1 text-xl font-semibold">{studentPointsData?.pointsThisWeek || 0}</p>
                    <p className="text-xs text-muted-foreground">pts this week</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Attendance Health</p>
                    <p className="mt-1 text-xl font-semibold">{attendanceRate}%</p>
                    <p className="text-xs text-muted-foreground">present among marked</p>
                  </div>
                  <div className="rounded-lg border border-border/70 bg-background/60 p-3 text-center">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Next Milestone</p>
                    <p className="mt-1 text-xl font-semibold">{nextMilestone || "Max"}</p>
                    <p className="text-xs text-muted-foreground">
                      {nextMilestone ? `${pointsToNextMilestone} pts to go` : "Top tier reached"}
                    </p>
                  </div>
                </div>
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
            )}

            {/* Skills Earned */}
            {activeTab === "achievements" && (
            <Card className="sd-reveal sd-delay-9 border border-border/70 bg-card/80 p-6">
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
            )}

            {/* Badges */}
            {activeTab === "achievements" && (
            <Card className="sd-reveal sd-delay-10 border border-border/70 bg-card/80 p-6">
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
            )}

            {/* Certificates */}
            {activeTab === "achievements" && (
            <Card className="sd-reveal sd-delay-10 border border-border/70 bg-card/80 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Certificates
                </h3>
                <Badge variant="secondary">{certificates.length}</Badge>
              </div>
              <div className="space-y-3">
                {certificates && certificates.length > 0 ? (
                  <div className="space-y-2">
                    {certificates.map((cert, index) => (
                      <div
                        key={index}
                        className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Award className="h-5 w-5 text-primary shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{cert.certificateName || cert.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{cert.clubName}</p>
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
            )}

            {/* Notifications */}
            {activeTab === "settings" && (
            <Card id="notifications-panel" className="sd-reveal sd-delay-10 border border-border/70 bg-card/80 p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{searchedNotifications.length || 0}</Badge>
                  <Button variant="outline" size="sm" onClick={() => setShowAllNotifications((prev) => !prev)}>
                    {showAllNotifications ? "Show Less" : "View All"}
                  </Button>
                </div>
              </div>
              <div className="mb-4">
                <Input
                  value={notificationsSearch}
                  onChange={(e) => setNotificationsSearch(e.target.value)}
                  placeholder="Quick search title, message, author, priority..."
                />
              </div>
              {notificationsGridRows.length === 0 ? (
                <div className="text-center p-6 bg-muted/50 rounded-lg">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No new announcements</p>
                </div>
              ) : (
                <div className={`${gridThemeClass}`} style={{ height: getGridHeight(notificationsGridRows.length), width: "100%" }}>
                  <AgGridReact<NotificationGridRow>
                    rowData={notificationsGridRows}
                    columnDefs={notificationsGridColumns}
                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                    animateRows
                    rowSelection="single"
                    pagination
                    paginationPageSize={10}
                    paginationPageSizeSelector={[5, 10, 25, 50]}
                    onRowClicked={(event) => {
                      const target = String(event.data?.target || "");
                      if (target && target !== "all") {
                        setLocation(`/clubs/${target}`);
                      }
                    }}
                  />
                </div>
              )}
            </Card>
            )}
          </div>
          )}
        </div>
      </div>

      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto p-0">
          <div className="p-6">
            <DialogHeader className="mb-4">
              <DialogTitle>Edit Student Profile</DialogTitle>
            </DialogHeader>
            <div className="mb-6 flex items-center justify-between gap-3">
              <h3 className="text-sm text-muted-foreground">Manage your profile details and photo</h3>
              <Badge variant={isProfileDirty ? "secondary" : "outline"} className="text-xs">
                {isProfileDirty ? "Unsaved changes" : "Saved"}
              </Badge>
            </div>
            <div className="mb-6 rounded-lg border border-border/70 bg-background/40 p-3 text-sm text-muted-foreground">
              Email and enrollment are permanently locked. Roll number can only be set once by students.
            </div>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="student-name-readonly" className="text-sm font-medium">Name</Label>
                <Input id="student-name-readonly" value={student?.name || ""} disabled className="mt-2" />
              </div>
              <div>
                <Label htmlFor="student-email-readonly" className="text-sm font-medium">Email (Locked)</Label>
                <Input id="student-email-readonly" value={student?.email || ""} disabled className="mt-2" />
              </div>
              <div>
                <Label htmlFor="student-enrollment-readonly" className="text-sm font-medium">Enrollment (Locked)</Label>
                <Input id="student-enrollment-readonly" value={student?.enrollment || ""} disabled className="mt-2" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="flex flex-col items-center gap-4 lg:col-span-1 lg:border-r lg:border-border/70 lg:pr-8">
                <Label className="block text-base font-semibold">Profile Picture</Label>
                <button
                  type="button"
                  aria-label="Upload profile picture"
                  className="group flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-primary/30 bg-primary/10 p-0 transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:h-36 sm:w-36 lg:h-40 lg:w-40"
                  onClick={handleProfilePictureClick}
                >
                  {student?.profilePicture || profileImage ? (
                    <img src={student?.profilePicture || profileImage || ""} alt="Profile" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="text-xs text-muted-foreground">Click to upload</p>
                    </div>
                  )}
                </button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleProfilePictureClick}
                  disabled={isUploadingProfile || profileUploadCooldownSeconds > 0}
                  className="w-full"
                >
                  {isUploadingProfile
                    ? "Uploading..."
                    : profileUploadCooldownSeconds > 0
                      ? `Retry in ${profileUploadCooldownSeconds}s`
                      : "Choose Image"}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  JPG, PNG, or WEBP<br />up to 5MB
                </p>
                <p
                  className={`text-center text-xs ${
                    profileUploadMessageType === "error"
                      ? "text-destructive"
                      : profileUploadMessageType === "success"
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                  }`}
                  aria-live="polite"
                >
                  {isUploadingProfile
                    ? "Uploading image..."
                    : profileUploadCooldownSeconds > 0
                      ? `Upload cooldown active: ${profileUploadCooldownSeconds}s remaining.`
                      : profileUploadMessage}
                </p>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="student-phone" className="text-sm font-medium">Phone</Label>
                    <Input
                      id="student-phone"
                      value={profileForm.phone}
                      onChange={(e) => {
                        setProfileTouched((prev) => ({ ...prev, phone: true }));
                        setProfileServerErrors((prev) => ({ ...prev, phone: undefined, form: undefined }));
                        setProfileForm((prev) => ({ ...prev, phone: e.target.value }));
                      }}
                      placeholder="Enter phone number"
                      inputMode="tel"
                      maxLength={15}
                      className="mt-2"
                    />
                    <p className={`mt-1 text-xs ${(profileServerErrors.phone || (profileTouched.phone && profileValidationErrors.phone)) ? "text-destructive" : "text-muted-foreground"}`}>
                      {profileServerErrors.phone || (profileTouched.phone && profileValidationErrors.phone) || "Example: +911234567890"}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="student-department" className="text-sm font-medium">Department / Branch</Label>
                    <select
                      id="student-department"
                      value={profileForm.department}
                      onChange={(e) => {
                        setProfileTouched((prev) => ({ ...prev, department: true }));
                        setProfileServerErrors((prev) => ({ ...prev, department: undefined, form: undefined }));
                        setProfileForm((prev) => ({ ...prev, department: e.target.value }));
                      }}
                      className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus:border-primary"
                    >
                      <option value="">Select your branch/department</option>
                      {UNIVERSITY_BRANCH_OPTIONS.map((branch) => (
                        <option key={branch} value={branch}>
                          {branch}
                        </option>
                      ))}
                    </select>
                    <p className={`mt-1 text-xs ${(profileServerErrors.department || (profileTouched.department && profileValidationErrors.department)) ? "text-destructive" : "text-muted-foreground"}`}>
                      {profileServerErrors.department || (profileTouched.department && profileValidationErrors.department) || "Pick your official branch/department from the list."}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="student-roll" className="text-sm font-medium">Roll Number</Label>
                    <Input
                      id="student-roll"
                      value={profileForm.rollNumber}
                      onChange={(e) => {
                        setProfileTouched((prev) => ({ ...prev, rollNumber: true }));
                        setProfileServerErrors((prev) => ({ ...prev, rollNumber: undefined, form: undefined }));
                        setProfileForm((prev) => ({ ...prev, rollNumber: e.target.value }));
                      }}
                      placeholder="Enter roll number"
                      maxLength={20}
                      className="mt-2"
                    />
                    <p className={`mt-1 text-xs ${(profileServerErrors.rollNumber || (profileTouched.rollNumber && profileValidationErrors.rollNumber)) ? "text-destructive" : "text-muted-foreground"}`}>
                      {profileServerErrors.rollNumber || (profileTouched.rollNumber && profileValidationErrors.rollNumber) ||
                        (student?.rollNumber
                          ? "Roll number is locked after first set."
                          : "You can set roll number once from this form.")}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="student-admission-year" className="text-sm font-medium">Year Of Admission</Label>
                    <Input
                      id="student-admission-year"
                      type="number"
                      value={profileForm.yearOfAdmission}
                      onChange={(e) => {
                        setProfileTouched((prev) => ({ ...prev, yearOfAdmission: true }));
                        setProfileServerErrors((prev) => ({ ...prev, yearOfAdmission: undefined, form: undefined }));
                        setProfileForm((prev) => ({ ...prev, yearOfAdmission: e.target.value }));
                      }}
                      placeholder="e.g. 2024"
                      min={2000}
                      max={currentYear + 1}
                      inputMode="numeric"
                      className="mt-2"
                    />
                    <p className={`mt-1 text-xs ${(profileServerErrors.yearOfAdmission || (profileTouched.yearOfAdmission && profileValidationErrors.yearOfAdmission)) ? "text-destructive" : "text-muted-foreground"}`}>
                      {profileServerErrors.yearOfAdmission || (profileTouched.yearOfAdmission && profileValidationErrors.yearOfAdmission) ||
                        `Allowed range: 2000-${currentYear + 1}`}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="student-semester" className="text-sm font-medium">Current Semester</Label>
                    <Input
                      id="student-semester"
                      value={profileForm.currentSemester || "Semester 1"}
                      disabled
                      className="mt-2"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Semester is auto-updated every 6 months based on your admission year.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 border-t border-border/70 bg-card/95 pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-muted-foreground">
                  {isProfileDirty ? "You have unsaved profile changes." : "All profile changes are saved."}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => {
                    handleResetProfileChanges();
                    setIsEditingProfile(false);
                  }}>
                    Cancel
                  </Button>
                  <Button type="button" variant="outline" onClick={handleResetProfileChanges} disabled={!isProfileDirty || updateProfileMutation.isPending}>
                    Reset Changes
                  </Button>
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={
                      updateProfileMutation.isPending ||
                      !isProfileFormValid ||
                      !isProfileDirty ||
                      profileSaveCooldownSeconds > 0
                    }
                  >
                    {updateProfileMutation.isPending
                      ? "Saving..."
                      : profileSaveCooldownSeconds > 0
                        ? `Retry in ${profileSaveCooldownSeconds}s`
                        : "Save Profile"}
                  </Button>
                </div>
              </div>
            </div>
            {profileServerErrors.form && (
              <p className="mt-2 text-right text-xs text-destructive">{profileServerErrors.form}</p>
            )}
            {!isProfileFormValid && (
              <p className="mt-2 text-right text-xs text-destructive">Fix highlighted fields before saving.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
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

        .student-attendance-grid .ag-row.student-attendance-grid-row:hover .ag-cell {
          background-color: hsl(var(--muted) / 0.42) !important;
        }

        .student-attendance-grid .ag-row.student-attendance-grid-row-selected .ag-cell {
          background-color: hsl(var(--primary) / 0.14) !important;
          box-shadow: inset 0 1px 0 hsl(var(--primary) / 0.18), inset 0 -1px 0 hsl(var(--primary) / 0.18);
        }

        .sd-reveal {
          opacity: 0;
          transform: translateY(8px);
          animation: sd-reveal-up 420ms ease forwards;
        }

        .sd-delay-1 { animation-delay: 40ms; }
        .sd-delay-2 { animation-delay: 90ms; }
        .sd-delay-3 { animation-delay: 130ms; }
        .sd-delay-4 { animation-delay: 170ms; }
        .sd-delay-5 { animation-delay: 210ms; }
        .sd-delay-6 { animation-delay: 250ms; }
        .sd-delay-7 { animation-delay: 290ms; }
        .sd-delay-8 { animation-delay: 330ms; }
        .sd-delay-9 { animation-delay: 370ms; }
        .sd-delay-10 { animation-delay: 410ms; }

        @keyframes sd-reveal-up {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sd-reveal {
            opacity: 1;
            transform: none;
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}