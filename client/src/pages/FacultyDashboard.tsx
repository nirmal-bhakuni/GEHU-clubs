import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Calendar, CheckCircle2, Clock3, Download, Loader2, Star, TrendingUp, Trophy, Users, XCircle } from "lucide-react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { clearFacultyToken, facultyApiFetch, getFacultyToken } from "@/lib/facultyAuth";
import { useTheme } from "@/components/ThemeProvider";
import { formatEventTimeRange } from "@/lib/eventTime";

type ParticipationRow = {
  id: string;
  studentName: string;
  department: string;
  section: string;
  year: string;
  semester: string;
  eventName: string;
  eventCategory: string;
  club: string;
  date: string;
  time: string;
  eventDurationMinutes?: number;
  participationCount: number;
};

type ParticipationResponse = {
  items: ParticipationRow[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  analytics: {
    summary: {
      totalParticipations: number;
      uniqueStudents: number;
      mostActiveStudent: string;
      mostPopularCategory: string;
    };
    byDepartment: Array<{ name: string; value: number }>;
    byCategory: Array<{ name: string; value: number }>;
    bestByCategory: Array<{
      category: string;
      studentName: string;
      enrollmentNumber: string;
      department: string;
      section: string;
      semester: string;
      participationCount: number;
      attendedCount: number;
    }>;
    byTimeline: Array<{ name: string; value: number }>;
  };
};

type FiltersState = {
  department: string;
  section: string;
  year: string;
  semester: string;
  category: string;
  club: string;
  eventName: string;
  eventStatus: string;
  dateRange: string;
  time: string;
};

type Drive = {
  id: string;
  title: string;
  description: string;
  deadline: string;
  targetCourse: string;
  targetSection: string;
};

type Submission = {
  id: string;
  studentDetails: { name: string; section: string; department: string; year: number; semester?: string };
  eventCategory: string;
  certificateUrl: string;
  submittedAt: string;
  status: "pending" | "verified" | "rejected";
  rejectionReason?: string;
};

const PIE_COLORS = ["#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6"];
const MASTER_DEPARTMENTS = [
  "Computer Science Engineering",
  "Computer Science and Engineering (AI & ML)",
  "Computer Science and Engineering (Data Science)",
  "Computer Science and Engineering (Cyber Security)",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electronics and Electrical Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology Engineering",
  "Biomedical Engineering",
  "Instrumentation Engineering",
  "Mechatronics Engineering",
  "Robotics and Automation",
  "Automobile Engineering",
  "Aerospace Engineering",
  "Environmental Engineering",
  "Agricultural Engineering",
  "Food Technology",
  "Petroleum Engineering",
  "Mining Engineering",
  "Production Engineering",
  "Industrial Engineering",
  "Physics",
  "Chemistry",
  "Mathematics",
  "Biology",
  "Microbiology",
  "Pharmacy",
  "Commerce",
  "Economics",
  "Business Administration",
  "Management Studies",
  "Law",
  "English",
  "Hindi",
  "History",
  "Political Science",
  "Psychology",
  "Sociology",
  "Fine Arts",
  "Performing Arts",
  "Other",
];
const MASTER_SECTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "A", "B", "C"];
const MASTER_YEARS = ["First Year", "Second Year", "Third Year", "Fourth Year"];
const MASTER_SEMESTERS = Array.from({ length: 8 }, (_, i) => `Semester ${i + 1}`);
const MASTER_EVENT_CATEGORIES = ["Workshop", "Bootcamp", "Social", "Competition", "Conference", "Hackathon", "Meetup", "Webinar", "Exhibition", "Festival", "Training", "Networking", "Sports", "E-Sports", "Technical", "Finance", "Cultural", "Research", "Seminar"];
const MASTER_CURRENT_CLUBS = ["IEEE", "ARYAVRAT", "PAPERTECH-GEHU", "Entrepreneurship Hub", "CODE_HUNTERS", "RANGMANCH", "GEHU Sports Council", "E-Sports Arena", "Cultural Collective"];
const MASTER_FUTURE_CLUBS = ["AI Innovators Guild", "Cyber Security Council", "Robotics & Automation Cell", "Green Energy Society", "Media & Podcast Club"];
const MASTER_EVENT_NAMES = ["Winter Tech Fest", "Hackathon", "Financial Literacy", "Web Development Bootcamp", "Startup Expo", "AI Summit", "Robotics Challenge", "Cyber Drill", "Green Future Conclave"];

const formatDateForRange = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}-${month}-${date.getFullYear()}`;
};

const formatDateRangeInput = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const formatDate = (dateDigits: string) =>
    [dateDigits.slice(0, 2), dateDigits.slice(2, 4), dateDigits.slice(4, 8)]
      .filter(Boolean)
      .join("-");

  const firstDate = formatDate(digits.slice(0, 8));
  const secondDate = formatDate(digits.slice(8, 16));

  if (!secondDate) return firstDate;
  return `${firstDate} to ${secondDate}`;
};

export default function FacultyDashboard() {
  const token = getFacultyToken();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { theme } = useTheme();
  const [quickRange, setQuickRange] = useState<"week" | "month" | "custom">("custom");
  const [rawFilters, setRawFilters] = useState<FiltersState>({
    department: "",
    section: "",
    year: "",
    semester: "",
    category: "",
    club: "",
    eventName: "",
    eventStatus: "",
    dateRange: "",
    time: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FiltersState>(rawFilters);
  const [driveForm, setDriveForm] = useState({
    title: "",
    description: "",
    deadline: "",
    targetCourse: "",
    targetSection: "",
    allowedFileTypes: "pdf,jpg,png",
    maxFileSize: "5242880",
  });
  const [selectedDriveId, setSelectedDriveId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentSort, setStudentSort] = useState<"recent" | "participations">("recent");
  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [submissionsPage, setSubmissionsPage] = useState(1);
  const [selectedSubmissionIds, setSelectedSubmissionIds] = useState<string[]>([]);
  const [isBulkReviewing, setIsBulkReviewing] = useState(false);

  const handleGeneratePdf = async (driveId: string) => {
    try {
      const res = await facultyApiFetch(`/api/drive/${driveId}/section-pdf`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `section_students_${driveId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "PDF generated & emailed", description: "PDF downloaded and students notified by email." });
    } catch (error: any) {
      toast({ title: "PDF generation failed", description: error.message, variant: "destructive" });
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedFilters(rawFilters);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [rawFilters]);

  useEffect(() => {
    if (quickRange === "custom") return;
    const now = new Date();
    if (quickRange === "week") {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      setRawFilters((prev) => ({
        ...prev,
        dateRange: `${formatDateForRange(start)} to ${formatDateForRange(now)}`,
      }));
      return;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setRawFilters((prev) => ({
      ...prev,
      dateRange: `${formatDateForRange(start)} to ${formatDateForRange(now)}`,
    }));
  }, [quickRange]);

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries(debouncedFilters).forEach(([key, value]) => {
      if (value) p.set(key, value);
    });
    p.set("limit", "100");
    return p.toString();
  }, [debouncedFilters]);

  const participationQuery = useQuery<ParticipationResponse>({
    queryKey: ["/api/participation", queryParams],
    enabled: !!token,
    queryFn: async () => {
      const response = await facultyApiFetch(`/api/participation?${queryParams}`);
      if (!response.ok) throw new Error("Failed to fetch participation analytics");
      return response.json();
    },
  });

  const drivesQuery = useQuery<Drive[]>({
    queryKey: ["/api/faculty/drives"],
    enabled: !!token,
    queryFn: async () => {
      const response = await facultyApiFetch("/api/faculty/drives");
      if (!response.ok) throw new Error("Failed to fetch drives");
      return response.json();
    },
  });

  const submissionsQuery = useQuery<Submission[]>({
    queryKey: ["/api/drive/submissions", selectedDriveId],
    enabled: !!token && !!selectedDriveId,
    queryFn: async () => {
      const response = await facultyApiFetch(`/api/drive/${selectedDriveId}/submissions`);
      if (!response.ok) throw new Error("Failed to fetch submissions");
      return response.json();
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="p-6 space-y-4 text-center">
          <p className="text-sm text-muted-foreground">Faculty login required.</p>
          <Button onClick={() => setLocation("/faculty/login")}>Go to Faculty Login</Button>
        </Card>
      </div>
    );
  }

  const tableRows = participationQuery.data?.items || [];
  const filteredTableRows = useMemo(() => {
    const term = studentSearch.trim().toLowerCase();
    if (!term) return tableRows;
    return tableRows.filter((row) =>
      [row.studentName, row.eventName, row.club, row.department, row.section]
        .concat(row.semester ? [row.semester] : [])
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [tableRows, studentSearch]);
  const sortedTableRows = useMemo(() => {
    const rows = [...filteredTableRows];
    if (studentSort === "participations") {
      rows.sort((a, b) => (b.participationCount || 0) - (a.participationCount || 0));
      return rows;
    }
    rows.sort((a, b) => {
      const aDate = new Date(`${a.date} ${a.time || ""}`).getTime();
      const bDate = new Date(`${b.date} ${b.time || ""}`).getTime();
      return bDate - aDate;
    });
    return rows;
  }, [filteredTableRows, studentSort]);
  const analytics = participationQuery.data?.analytics;
  const gridThemeClass = theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";
  const submissions = submissionsQuery.data || [];
  const submissionSummary = useMemo(() => {
    const summary = { total: submissions.length, pending: 0, verified: 0, rejected: 0 };
    submissions.forEach((s) => {
      if (s.status === "pending") summary.pending += 1;
      if (s.status === "verified") summary.verified += 1;
      if (s.status === "rejected") summary.rejected += 1;
    });
    return summary;
  }, [submissions]);
  const visibleSubmissions = useMemo(() => {
    if (submissionStatusFilter === "all") return submissions;
    return submissions.filter((s) => s.status === submissionStatusFilter);
  }, [submissions, submissionStatusFilter]);
  const submissionsPageSize = 8;
  const totalSubmissionPages = Math.max(1, Math.ceil(visibleSubmissions.length / submissionsPageSize));
  const paginatedVisibleSubmissions = useMemo(() => {
    const start = (submissionsPage - 1) * submissionsPageSize;
    return visibleSubmissions.slice(start, start + submissionsPageSize);
  }, [visibleSubmissions, submissionsPage]);
  const pendingIdsOnPage = useMemo(
    () => paginatedVisibleSubmissions.filter((s) => s.status === "pending").map((s) => s.id),
    [paginatedVisibleSubmissions],
  );

  useEffect(() => {
    setSubmissionsPage(1);
    setSelectedSubmissionIds([]);
  }, [selectedDriveId, submissionStatusFilter]);

  useEffect(() => {
    if (submissionsPage > totalSubmissionPages) {
      setSubmissionsPage(totalSubmissionPages);
    }
  }, [submissionsPage, totalSubmissionPages]);

  const participationColumns = useMemo<ColDef<ParticipationRow>[]>(() => [
    { field: "studentName", headerName: "Student Name", minWidth: 180, flex: 1.1 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "section", headerName: "Section", minWidth: 110 },
    { field: "semester", headerName: "Semester", minWidth: 120 },
    { field: "year", headerName: "Year", minWidth: 90 },
    { field: "eventName", headerName: "Event Name", minWidth: 200, flex: 1.2 },
    { field: "eventCategory", headerName: "Event Category", minWidth: 150 },
    { field: "club", headerName: "Club", minWidth: 150 },
    { field: "date", headerName: "Date", minWidth: 120 },
    {
      field: "time",
      headerName: "Time",
      minWidth: 170,
      valueFormatter: (params) => formatEventTimeRange(params.data?.time || "", params.data?.eventDurationMinutes),
    },
    { field: "participationCount", headerName: "Participation Count", minWidth: 170 },
  ], []);

  const distinct = useMemo(() => {
    const d = new Set<string>();
    const s = new Set<string>();
    const y = new Set<string>();
    const sem = new Set<string>();
    const c = new Set<string>();
    const cl = new Set<string>();
    const e = new Set<string>();
    tableRows.forEach((row) => {
      if (row.department) d.add(row.department);
      if (row.section) s.add(row.section);
      if (row.year) y.add(String(row.year));
      if (row.semester) sem.add(row.semester);
      if (row.eventCategory) c.add(row.eventCategory);
      if (row.club) cl.add(row.club);
      if (row.eventName) e.add(row.eventName);
    });
    const mergeOptions = (master: string[], dynamic: string[]) =>
      Array.from(new Set([...master, ...dynamic])).filter(Boolean).sort();
    return {
      departments: mergeOptions(MASTER_DEPARTMENTS, Array.from(d)),
      sections: mergeOptions(MASTER_SECTIONS, Array.from(s)),
      years: mergeOptions(MASTER_YEARS, Array.from(y)),
      semesters: mergeOptions(MASTER_SEMESTERS, Array.from(sem)),
      categories: mergeOptions(MASTER_EVENT_CATEGORIES, Array.from(c)),
      clubs: mergeOptions([...MASTER_CURRENT_CLUBS, ...MASTER_FUTURE_CLUBS], Array.from(cl)),
      eventNames: mergeOptions(MASTER_EVENT_NAMES, Array.from(e)),
    };
  }, [tableRows]);

  const reloadDrives = () => drivesQuery.refetch();
  const reloadSubmissions = () => submissionsQuery.refetch();

  const downloadParticipationCsv = () => {
    if (sortedTableRows.length === 0) {
      toast({ title: "No data to export", description: "Apply different filters or search.", variant: "destructive" });
      return;
    }

    const headers = [
      "Student Name",
      "Department",
      "Section",
      "Semester",
      "Year",
      "Event Name",
      "Event Category",
      "Club",
      "Date",
      "Time",
      "Participation Count",
    ];
    const escapeCsv = (value: string | number) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const rows = sortedTableRows.map((row) =>
      [
        row.studentName,
        row.department,
        row.section,
        row.semester,
        row.year,
        row.eventName,
        row.eventCategory,
        row.club,
        row.date,
        formatEventTimeRange(row.time, row.eventDurationMinutes),
        row.participationCount,
      ].map(escapeCsv).join(","),
    );
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `faculty-participation-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const createDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...driveForm,
        deadline: new Date(driveForm.deadline).toISOString(),
        maxFileSize: Number(driveForm.maxFileSize),
        allowedFileTypes: driveForm.allowedFileTypes.split(",").map((v) => v.trim()).filter(Boolean),
      };
      const response = await facultyApiFetch("/api/drive/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to create drive");
      toast({
        title: "Drive created",
        description: `Link: /drive/${body.drive.id}/submit | Notified: ${body.notifiedStudents ?? 0} students`,
      });
      setDriveForm({
        title: "",
        description: "",
        deadline: "",
        targetCourse: "",
        targetSection: "",
        allowedFileTypes: "pdf,jpg,png",
        maxFileSize: "5242880",
      });
      reloadDrives();
    } catch (error: any) {
      toast({ title: "Drive create failed", description: error.message, variant: "destructive" });
    }
  };

  const reviewSubmission = async (id: string, action: "verify" | "reject") => {
    try {
      const response = await facultyApiFetch(`/api/submission/${id}/${action}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: "Rejected by faculty" } : {}),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed");
      toast({ title: `Submission ${action}d` });
      setSelectedSubmissionIds((prev) => prev.filter((v) => v !== id));
      reloadSubmissions();
    } catch (error: any) {
      toast({ title: "Review failed", description: error.message, variant: "destructive" });
    }
  };

  const bulkReviewSubmissions = async (action: "verify" | "reject") => {
    const pendingSelectedIds = selectedSubmissionIds.filter((id) =>
      visibleSubmissions.some((s) => s.id === id && s.status === "pending"),
    );
    if (pendingSelectedIds.length === 0) {
      toast({
        title: "No pending submissions selected",
        description: "Select pending rows to run bulk actions.",
        variant: "destructive",
      });
      return;
    }

    setIsBulkReviewing(true);
    try {
      await Promise.all(
        pendingSelectedIds.map(async (id) => {
          const response = await facultyApiFetch(`/api/submission/${id}/${action}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(action === "reject" ? { reason: "Rejected by faculty (bulk action)" } : {}),
          });
          const body = await response.json();
          if (!response.ok) throw new Error(body.error || `Failed for submission ${id}`);
        }),
      );
      toast({ title: `Bulk ${action} complete`, description: `${pendingSelectedIds.length} submissions updated.` });
      setSelectedSubmissionIds([]);
      reloadSubmissions();
    } catch (error: any) {
      toast({ title: "Bulk review failed", description: error.message || "Try again.", variant: "destructive" });
    } finally {
      setIsBulkReviewing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Faculty Dashboard</h1>
          <p className="text-sm text-muted-foreground">Analyze participation, manage drives, and verify submissions.</p>
        </div>
        <Button variant="outline" onClick={() => { clearFacultyToken(); setLocation("/faculty/login"); }}>
          Logout
        </Button>
      </div>

      <Tabs defaultValue="students">
        <TabsList>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="drives">Drives</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="students" className="space-y-4">
          <Card className="p-4 sticky top-20 z-10 backdrop-blur bg-card/95">
            <h2 className="font-medium mb-3">Student Participation Analytics</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button size="sm" variant={quickRange === "week" ? "default" : "outline"} onClick={() => setQuickRange("week")}>This Week</Button>
              <Button size="sm" variant={quickRange === "month" ? "default" : "outline"} onClick={() => setQuickRange("month")}>This Month</Button>
              <Button size="sm" variant={quickRange === "custom" ? "default" : "outline"} onClick={() => setQuickRange("custom")}>Custom Range</Button>
            </div>
            <div className="grid items-end gap-3 md:grid-cols-4 lg:grid-cols-5">
              <Select value={rawFilters.department || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, department: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Departments</SelectItem>{distinct.departments.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.section || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, section: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Section" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Sections</SelectItem>{distinct.sections.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.year || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, year: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Years</SelectItem>{distinct.years.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.semester || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, semester: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Semester" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Semesters</SelectItem>{distinct.semesters.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.category || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, category: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Event Category" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Categories</SelectItem>{distinct.categories.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.eventName || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, eventName: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Event Name" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Events</SelectItem>{distinct.eventNames.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={rawFilters.eventStatus || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, eventStatus: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Event Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="upcoming">Upcoming / Future</SelectItem>
                  <SelectItem value="past">Past / Completed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={rawFilters.club || "all"} onValueChange={(v) => setRawFilters((p) => ({ ...p, club: v === "all" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Club" /></SelectTrigger>
                <SelectContent><SelectItem value="all">All Clubs</SelectItem>{distinct.clubs.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
              </Select>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Time</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="--:-- AM/PM to --:-- AM/PM"
                    value={rawFilters.time}
                    onChange={(e) => setRawFilters((p) => ({ ...p, time: e.target.value }))}
                    className="pr-10"
                  />
                  <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Date</Label>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="dd-mm-yyyy to dd-mm-yyyy"
                    value={rawFilters.dateRange}
                    onChange={(e) => {
                      setQuickRange("custom");
                      setRawFilters((p) => ({ ...p, dateRange: formatDateRangeInput(e.target.value) }));
                    }}
                    inputMode="numeric"
                    maxLength={28}
                    className="pr-10"
                  />
                  <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              <Button variant="outline" onClick={() => {
                setQuickRange("custom");
                setRawFilters({
                  department: "",
                  section: "",
                  year: "",
                  semester: "",
                  category: "",
                  club: "",
                  eventName: "",
                  eventStatus: "",
                  dateRange: "",
                  time: "",
                });
              }}>Reset Filters</Button>
            </div>
            <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <Input
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search student, event, club, department..."
                className="md:max-w-md"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={studentSort === "recent" ? "default" : "outline"}
                  onClick={() => setStudentSort("recent")}
                >
                  Most Recent
                </Button>
                <Button
                  size="sm"
                  variant={studentSort === "participations" ? "default" : "outline"}
                  onClick={() => setStudentSort("participations")}
                >
                  Most Participations
                </Button>
                <Button variant="outline" onClick={downloadParticipationCsv}>
                  Export CSV ({sortedTableRows.length})
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4"><p className="text-xs text-muted-foreground">Total Participations</p><p className="mt-2 text-2xl font-semibold flex items-center gap-2"><TrendingUp className="w-5 h-5" />{analytics?.summary.totalParticipations || 0}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Unique Students</p><p className="mt-2 text-2xl font-semibold flex items-center gap-2"><Users className="w-5 h-5" />{analytics?.summary.uniqueStudents || 0}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Most Active Student</p><p className="mt-2 text-lg font-semibold flex items-center gap-2"><Star className="w-5 h-5" />{analytics?.summary.mostActiveStudent || "N/A"}</p></Card>
            <Card className="p-4"><p className="text-xs text-muted-foreground">Popular Category</p><p className="mt-2 text-lg font-semibold flex items-center gap-2"><Activity className="w-5 h-5" />{analytics?.summary.mostPopularCategory || "N/A"}</p></Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="p-4 h-80">
              <h3 className="font-medium mb-3">Participation by Department</h3>
              <ResponsiveContainer width="100%" height="88%">
                <BarChart data={analytics?.byDepartment || []}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4 h-80">
              <h3 className="font-medium mb-3">Event Category Distribution</h3>
              <ResponsiveContainer width="100%" height="88%">
                <PieChart>
                  <Pie data={analytics?.byCategory || []} dataKey="value" nameKey="name" outerRadius={100} label>
                    {(analytics?.byCategory || []).map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-4 h-80">
              <h3 className="font-medium mb-3">Participation over Time</h3>
              <ResponsiveContainer width="100%" height="88%">
                <LineChart data={analytics?.byTimeline || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <div>
                <h3 className="font-medium">Best Student by Category</h3>
                <p className="text-xs text-muted-foreground">Ranked by participation and attendance within each event/game category.</p>
              </div>
            </div>
            {analytics?.bestByCategory?.length ? (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {analytics.bestByCategory.map((item) => (
                  <div key={item.category} className="rounded-lg border bg-muted/20 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.category}</p>
                    <p className="mt-1 text-base font-semibold">{item.studentName}</p>
                    <p className="text-xs text-muted-foreground">{item.department}</p>
                    <p className="mt-2 text-sm">
                      Section {item.section || "-"} | {item.semester || "Semester N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.participationCount} participations | {item.attendedCount} attended
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No category leaders found for the selected filters.</p>
            )}
          </Card>

          <Card className="p-4">
            {participationQuery.isLoading ? (
              <div className="py-12 flex justify-center items-center text-sm text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading participation analytics...
              </div>
            ) : participationQuery.isError ? (
              <div className="py-12 text-center text-sm text-destructive">
                Failed to load participation analytics. Try changing filters or reloading.
              </div>
            ) : tableRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No Data Found</div>
            ) : (
              <div className={`${gridThemeClass} attendance-ag-grid`} style={{ height: 460, width: "100%" }}>
                <AgGridReact<ParticipationRow>
                  rowData={sortedTableRows}
                  columnDefs={participationColumns}
                  pagination={true}
                  paginationPageSize={10}
                  paginationPageSizeSelector={[10, 20, 50]}
                  animateRows={true}
                  rowHeight={42}
                  headerHeight={44}
                  defaultColDef={{
                    sortable: true,
                    filter: true,
                    resizable: true,
                    floatingFilter: false,
                  }}
                />
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="drives" className="space-y-4">
          <Card className="p-4">
            <h2 className="font-medium mb-3">Create Drive</h2>
            <form className="grid md:grid-cols-2 gap-3" onSubmit={createDrive}>
              <div className="space-y-2"><Label>Title</Label><Input value={driveForm.title} onChange={(e) => setDriveForm((p) => ({ ...p, title: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Deadline</Label><Input type="datetime-local" value={driveForm.deadline} onChange={(e) => setDriveForm((p) => ({ ...p, deadline: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Target Course</Label><Input value={driveForm.targetCourse} onChange={(e) => setDriveForm((p) => ({ ...p, targetCourse: e.target.value }))} placeholder="B.Tech CSE" required /></div>
              <div className="space-y-2"><Label>Target Section</Label><Input value={driveForm.targetSection} onChange={(e) => setDriveForm((p) => ({ ...p, targetSection: e.target.value.toUpperCase() }))} placeholder="A1, A2, B1, B2, C1, C2, A, B, or C" required /></div>
              <div className="space-y-2"><Label>Allowed File Types (comma separated)</Label><Input value={driveForm.allowedFileTypes} onChange={(e) => setDriveForm((p) => ({ ...p, allowedFileTypes: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Max File Size (bytes)</Label><Input value={driveForm.maxFileSize} onChange={(e) => setDriveForm((p) => ({ ...p, maxFileSize: e.target.value }))} required /></div>
              <div className="md:col-span-2 space-y-2"><Label>Description</Label><Input value={driveForm.description} onChange={(e) => setDriveForm((p) => ({ ...p, description: e.target.value }))} /></div>
              <Button>Create Drive</Button>
            </form>
          </Card>
          <Card className="p-4">
            <h2 className="font-medium mb-3">My Drives</h2>
            <div className="space-y-2">
              {(drivesQuery.data || []).map((drive) => (
                <div key={drive.id} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{drive.title}</p>
                    <p className="text-xs text-muted-foreground">Submit Link: /drive/{drive.id}/submit</p>
                    <p className="text-xs text-muted-foreground">Target: {drive.targetCourse} | Section {drive.targetSection}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const link = `${window.location.origin}/drive/${drive.id}/submit`;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Link copied", description: "Drive submission link copied to clipboard." });
                      }}
                    >
                      Copy Link
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedDriveId(drive.id)}>View Submissions</Button>
                    <Button variant="outline" onClick={() => handleGeneratePdf(drive.id)} title="Generate PDF & Email">
                      <Download className="w-4 h-4 mr-1" /> PDF & Email
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Select a drive in Drives tab to inspect submissions.</p>
            {selectedDriveId ? <p className="text-sm">Current drive: {selectedDriveId}</p> : null}
            {!!selectedDriveId && (
              <div className="grid gap-3 md:grid-cols-4">
                <Card className="p-3"><p className="text-xs text-muted-foreground">Total</p><p className="text-xl font-semibold">{submissionSummary.total}</p></Card>
                <Card className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><Clock3 className="w-4 h-4" /> Pending</p><p className="text-xl font-semibold">{submissionSummary.pending}</p></Card>
                <Card className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Verified</p><p className="text-xl font-semibold">{submissionSummary.verified}</p></Card>
                <Card className="p-3"><p className="text-xs text-muted-foreground flex items-center gap-1"><XCircle className="w-4 h-4" /> Rejected</p><p className="text-xl font-semibold">{submissionSummary.rejected}</p></Card>
              </div>
            )}
            {!!selectedDriveId && (
              <div className="max-w-xs">
                <Label>Filter by status</Label>
                <Select value={submissionStatusFilter} onValueChange={(v: "all" | "pending" | "verified" | "rejected") => setSubmissionStatusFilter(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {!!selectedDriveId && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={pendingIdsOnPage.length > 0 && pendingIdsOnPage.every((id) => selectedSubmissionIds.includes(id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSubmissionIds((prev) => Array.from(new Set([...prev, ...pendingIdsOnPage])));
                      } else {
                        setSelectedSubmissionIds((prev) => prev.filter((id) => !pendingIdsOnPage.includes(id)));
                      }
                    }}
                  />
                  Select all pending on page
                </label>
                <Button size="sm" onClick={() => bulkReviewSubmissions("verify")} disabled={isBulkReviewing}>
                  {isBulkReviewing ? "Processing..." : `Bulk Approve (${selectedSubmissionIds.length})`}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => bulkReviewSubmissions("reject")} disabled={isBulkReviewing}>
                  {isBulkReviewing ? "Processing..." : `Bulk Reject (${selectedSubmissionIds.length})`}
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {paginatedVisibleSubmissions.map((submission) => (
                <div key={submission.id} className="border rounded p-3 space-y-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      disabled={submission.status !== "pending"}
                      checked={selectedSubmissionIds.includes(submission.id)}
                      onChange={(e) => {
                        setSelectedSubmissionIds((prev) =>
                          e.target.checked ? Array.from(new Set([...prev, submission.id])) : prev.filter((id) => id !== submission.id),
                        );
                      }}
                    />
                    Select for bulk action
                  </label>
                  <p className="font-medium">{submission.studentDetails.name} ({submission.studentDetails.department})</p>
                  <p className="text-sm">
                    Section: {submission.studentDetails.section} | Semester: {submission.studentDetails.semester || "-"} | Year: {submission.studentDetails.year}
                  </p>
                  <p className="text-sm">Event Category: {submission.eventCategory}</p>
                  <a href={submission.certificateUrl} className="underline text-sm" target="_blank" rel="noreferrer">Preview Certificate</a>
                  <p className="text-xs text-muted-foreground">Submitted: {new Date(submission.submittedAt).toLocaleString()}</p>
                  <p className="text-sm">Status: {submission.status}</p>
                  {submission.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => reviewSubmission(submission.id, "verify")}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reviewSubmission(submission.id, "reject")}>Reject</Button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {!!selectedDriveId && visibleSubmissions.length > submissionsPageSize && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {submissionsPage} of {totalSubmissionPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submissionsPage <= 1}
                    onClick={() => setSubmissionsPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={submissionsPage >= totalSubmissionPages}
                    onClick={() => setSubmissionsPage((p) => Math.min(totalSubmissionPages, p + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
