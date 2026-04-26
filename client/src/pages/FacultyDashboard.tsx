import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Loader2, Star, TrendingUp, Users } from "lucide-react";
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
  dateFrom: string;
  dateTo: string;
  time: string;
};

type Drive = {
  id: string;
  title: string;
  description: string;
  deadline: string;
};

type Submission = {
  id: string;
  studentDetails: { name: string; section: string; department: string; year: number };
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
const MASTER_SECTIONS = ["A1", "A2", "B1", "B2", "C1", "C2", "D1", "D2", "E1", "E2","F1","F2","G1","G2","H1","H2","I1","I2","J1","J2","K1","K2","L1","L2","AI/DS","AI/ML-1","AI/ML-2","AI/ML-3","Cyber Security"];
const MASTER_YEARS = ["First Year", "Second Year", "Third Year", "Fourth Year"];
const MASTER_SEMESTERS = Array.from({ length: 10 }, (_, i) => `Semester ${i + 1}`);
const MASTER_EVENT_CATEGORIES = ["Workshop", "Bootcamp","Social" , "Competition" , "Conference" , "Hackathon" , "Meetup" , "Webinar" , "Exhibition" , "Festival" , "Training" , "Networking" , "Sports", "Technical", "Finance", "Cultural", "Research", "Seminar"];
const MASTER_CURRENT_CLUBS = ["IEEE", "ARYAVRAT", "PAPERTECH-GEHU", "Entrepreneurship Hub", "CODE_HUNTERS", "RANGMANCH"];
const MASTER_FUTURE_CLUBS = ["AI Innovators Guild", "Cyber Security Council", "Robotics & Automation Cell", "Green Energy Society", "Media & Podcast Club"];
const MASTER_EVENT_NAMES = ["Winter Tech Fest", "Hackathon", "Financial Literacy", "Web Development Bootcamp", "Startup Expo", "AI Summit", "Robotics Challenge", "Cyber Drill", "Green Future Conclave"];

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
    dateFrom: "",
    dateTo: "",
    time: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState<FiltersState>(rawFilters);
  const [driveForm, setDriveForm] = useState({
    title: "",
    description: "",
    deadline: "",
    allowedFileTypes: "pdf,jpg,png",
    maxFileSize: "5242880",
  });
  const [selectedDriveId, setSelectedDriveId] = useState("");

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
        dateFrom: start.toISOString().slice(0, 10),
        dateTo: now.toISOString().slice(0, 10),
      }));
      return;
    }
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setRawFilters((prev) => ({
      ...prev,
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: now.toISOString().slice(0, 10),
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
  const analytics = participationQuery.data?.analytics;
  const gridThemeClass = theme === "dark" ? "ag-theme-quartz-dark" : "ag-theme-quartz";

  const participationColumns = useMemo<ColDef<ParticipationRow>[]>(() => [
    { field: "studentName", headerName: "Student Name", minWidth: 180, flex: 1.1 },
    { field: "department", headerName: "Department", minWidth: 160 },
    { field: "section", headerName: "Section", minWidth: 110 },
    { field: "year", headerName: "Year", minWidth: 90 },
    { field: "semester", headerName: "Semester", minWidth: 120 },
    { field: "eventName", headerName: "Event Name", minWidth: 200, flex: 1.2 },
    { field: "eventCategory", headerName: "Event Category", minWidth: 150 },
    { field: "club", headerName: "Club", minWidth: 150 },
    { field: "date", headerName: "Date", minWidth: 120 },
    { field: "time", headerName: "Time", minWidth: 110 },
    { field: "participationCount", headerName: "Participation Count", minWidth: 170 },
  ], []);

  const distinct = useMemo(() => {
    const d = new Set<string>();
    const s = new Set<string>();
    const y = new Set<string>();
    const sem = new Set<string>();
    const c = new Set<string>();
    const cl = new Set<string>();
    const t = new Set<string>();
    const e = new Set<string>();
    tableRows.forEach((row) => {
      if (row.department) d.add(row.department);
      if (row.section) s.add(row.section);
      if (row.year) y.add(String(row.year));
      if (row.semester) sem.add(row.semester);
      if (row.eventCategory) c.add(row.eventCategory);
      if (row.club) cl.add(row.club);
      if (row.eventName) e.add(row.eventName);
      if (row.time) t.add(row.time);
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
      times: mergeOptions([], Array.from(t)),
    };
  }, [tableRows]);

  const reloadDrives = () => drivesQuery.refetch();
  const reloadSubmissions = () => submissionsQuery.refetch();

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
      toast({ title: "Drive created", description: `Link: /drive/${body.drive.id}/submit` });
      setDriveForm({ title: "", description: "", deadline: "", allowedFileTypes: "pdf,jpg,png", maxFileSize: "5242880" });
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
      reloadSubmissions();
    } catch (error: any) {
      toast({ title: "Review failed", description: error.message, variant: "destructive" });
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
            <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-3">
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
                <Input
                  type="text"
                  list="faculty-time-suggestions"
                  placeholder="Time slot (any, e.g. 13:30 or 1:30 PM)"
                  value={rawFilters.time}
                  onChange={(e) => setRawFilters((p) => ({ ...p, time: e.target.value }))}
                />
                <datalist id="faculty-time-suggestions">
                  {distinct.times.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <Input type="date" value={rawFilters.dateFrom} onChange={(e) => setRawFilters((p) => ({ ...p, dateFrom: e.target.value }))} />
              <Input type="date" value={rawFilters.dateTo} onChange={(e) => setRawFilters((p) => ({ ...p, dateTo: e.target.value }))} />
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
                  dateFrom: "",
                  dateTo: "",
                  time: "",
                });
              }}>Reset Filters</Button>
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
            {participationQuery.isLoading ? (
              <div className="py-12 flex justify-center items-center text-sm text-muted-foreground gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading participation analytics...
              </div>
            ) : tableRows.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">No Data Found</div>
            ) : (
              <div className={`${gridThemeClass} attendance-ag-grid`} style={{ height: 460, width: "100%" }}>
                <AgGridReact<ParticipationRow>
                  rowData={tableRows}
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
                  </div>
                  <Button variant="outline" onClick={() => setSelectedDriveId(drive.id)}>View Submissions</Button>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="submissions">
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Select a drive in Drives tab to inspect submissions.</p>
            {selectedDriveId ? <p className="text-sm">Current drive: {selectedDriveId}</p> : null}
            <div className="space-y-2">
              {(submissionsQuery.data || []).map((submission) => (
                <div key={submission.id} className="border rounded p-3 space-y-2">
                  <p className="font-medium">{submission.studentDetails.name} ({submission.studentDetails.department})</p>
                  <p className="text-sm">Section: {submission.studentDetails.section} | Year: {submission.studentDetails.year}</p>
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
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
