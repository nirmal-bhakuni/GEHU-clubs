import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTeacherAuth } from "@/hooks/useTeacherAuth";

type AttendanceRow = {
  registrationId: string;
  studentName: string;
  studentEmail: string;
  enrollmentNumber: string;
  course: string;
  section: string;
  department: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  clubName: string;
  status: "pending" | "present" | "absent" | "late" | "excused";
  participationScore: number;
  teacherRemark: string;
  participatedAt: string;
};

type Overview = {
  totalStudents: number;
  totalRegistrations: number;
  attendanceSummary: {
    present: number;
    absent: number;
    pending: number;
  };
  recentParticipation: Array<{
    registrationId: string;
    studentName: string;
    enrollmentNumber: string;
    course: string;
    section: string;
    eventTitle: string;
    status: string;
    participatedAt: string;
  }>;
};

const STATUS_OPTIONS = ["pending", "present", "absent", "late", "excused"] as const;

export default function TeacherERP() {
  const [, setLocation] = useLocation();
  const { teacher, isAuthenticated, isLoading: authLoading } = useTeacherAuth();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRow, setSelectedRow] = useState<AttendanceRow | null>(null);
  const [markStatus, setMarkStatus] = useState<AttendanceRow["status"]>("present");
  const [score, setScore] = useState<number>(8);
  const [remark, setRemark] = useState("");
  const [lastSyncInfo, setLastSyncInfo] = useState("Not synced yet");

  const { data: overview } = useQuery<Overview>({
    queryKey: ["/api/teacher/erp/overview"],
    queryFn: async () => {
      const res = await fetch("/api/teacher/erp/overview", { credentials: "include" });
      if (res.status === 401) return Promise.reject(new Error("Unauthorized"));
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const { data: attendanceRows = [], isLoading: attendanceLoading } = useQuery<AttendanceRow[]>({
    queryKey: ["/api/teacher/attendance", search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/teacher/attendance?${params.toString()}`, { credentials: "include" });
      if (res.status === 401) return Promise.reject(new Error("Unauthorized"));
      return res.json();
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const markMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRow) throw new Error("Please choose a student record first.");
      await apiRequest("POST", "/api/teacher/attendance/mark", {
        registrationId: selectedRow.registrationId,
        status: markStatus,
        participationScore: score,
        teacherRemark: remark,
      });
    },
    onSuccess: () => {
      toast({ title: "Attendance updated", description: "ERP attendance updated successfully." });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/attendance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/erp/overview"] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error?.message || "Unable to save attendance",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/teacher/auth/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/teacher/auth/me"], null);
      setLocation("/teacher/login");
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (mode: "filtered" | "selected") => {
      const payload: {
        search: string;
        status: string;
        selectedRegistrationIds?: string[];
      } = {
        search,
        status: statusFilter,
      };

      if (mode === "selected" && selectedRow) {
        payload.selectedRegistrationIds = [selectedRow.registrationId];
      }

      const response = await apiRequest("POST", "/api/teacher/erp/sync", payload);
      return response.json();
    },
    onSuccess: (data: any, mode) => {
      const baseText =
        data?.mode === "pushed"
          ? `Synced ${data?.totalSynced || 0} records to main ERP.`
          : `Prepared ${data?.totalSynced || 0} records. Set ERP_SYNC_URL for direct push.`;

      setLastSyncInfo(`${new Date().toLocaleString()} - ${baseText}`);

      toast({
        title: mode === "selected" ? "Selected record synced" : "ERP sync completed",
        description: data?.message || baseText,
      });
    },
    onError: (error: any) => {
      setLastSyncInfo(`${new Date().toLocaleString()} - ERP sync failed`);
      toast({
        title: "ERP sync failed",
        description: error?.message || "Unable to sync records to ERP",
        variant: "destructive",
      });
    },
  });

  const filteredInsights = useMemo(() => {
    const presentCount = attendanceRows.filter((row) => row.status === "present" || row.status === "late").length;
    const highParticipation = attendanceRows.filter((row) => row.participationScore >= 8).length;
    return {
      presentRate: attendanceRows.length ? Math.round((presentCount / attendanceRows.length) * 100) : 0,
      highParticipation,
    };
  }, [attendanceRows]);

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading teacher profile...</div>;
  }

  if (!isAuthenticated) {
    setLocation("/teacher/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Card className="p-5 md:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Teacher ERP Attendance Console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome {teacher?.fullName || teacher?.username}. Track section-wise student participation and timing.
            </p>
            <p className="text-xs text-muted-foreground mt-2">Last ERP sync: {lastSyncInfo}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => syncMutation.mutate("filtered")}
              disabled={syncMutation.isPending}
            >
              {syncMutation.isPending ? "Syncing..." : "Sync Filtered to ERP"}
            </Button>
            <Button variant="outline" onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
              Logout
            </Button>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Students</p>
            <p className="text-2xl font-semibold mt-2">{overview?.totalStudents ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total Participation Entries</p>
            <p className="text-2xl font-semibold mt-2">{overview?.totalRegistrations ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Present + Late Rate</p>
            <p className="text-2xl font-semibold mt-2">{filteredInsights.presentRate}%</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">High Participation (Score 8+)</p>
            <p className="text-2xl font-semibold mt-2">{filteredInsights.highParticipation}</p>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Present Records</p>
            <p className="text-xl font-semibold mt-2">{overview?.attendanceSummary?.present ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Absent Records</p>
            <p className="text-xl font-semibold mt-2">{overview?.attendanceSummary?.absent ?? 0}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pending Records</p>
            <p className="text-xl font-semibold mt-2">{overview?.attendanceSummary?.pending ?? 0}</p>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2 space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="erp-search">Search Student / Section / Event</Label>
                <Input
                  id="erp-search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student, section, or event"
                />
              </div>
              <div className="w-full md:w-48">
                <Label>Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="overflow-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left p-3">Student</th>
                    <th className="text-left p-3">Course</th>
                    <th className="text-left p-3">Section</th>
                    <th className="text-left p-3">Event</th>
                    <th className="text-left p-3">Participated Time</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLoading ? (
                    <tr><td className="p-3" colSpan={7}>Loading attendance...</td></tr>
                  ) : attendanceRows.length === 0 ? (
                    <tr><td className="p-3" colSpan={7}>No attendance data found.</td></tr>
                  ) : (
                    attendanceRows.map((row) => (
                      <tr
                        key={row.registrationId}
                        className={`border-t cursor-pointer hover:bg-muted/40 ${selectedRow?.registrationId === row.registrationId ? "bg-muted/50" : ""}`}
                        onClick={() => {
                          setSelectedRow(row);
                          setMarkStatus(row.status);
                          setScore(row.participationScore);
                          setRemark(row.teacherRemark || "");
                        }}
                      >
                        <td className="p-3">
                          <p className="font-medium">{row.studentName}</p>
                          <p className="text-xs text-muted-foreground">{row.enrollmentNumber}</p>
                        </td>
                        <td className="p-3">{row.course}</td>
                        <td className="p-3">{row.section}</td>
                        <td className="p-3">
                          <p className="font-medium">{row.eventTitle}</p>
                          <p className="text-xs text-muted-foreground">{row.clubName}</p>
                        </td>
                        <td className="p-3">{new Date(row.participatedAt).toLocaleString()}</td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              row.status === "present"
                                ? "border-green-500/40 text-green-700"
                                : row.status === "late"
                                  ? "border-amber-500/40 text-amber-700"
                                  : row.status === "absent"
                                    ? "border-red-500/40 text-red-700"
                                    : ""
                            }
                          >
                            {row.status}
                          </Badge>
                        </td>
                        <td className="p-3">{row.participationScore}/10</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border p-4">
              <p className="text-sm font-semibold mb-3">Recent Participation Timeline</p>
              <div className="space-y-2">
                {(overview?.recentParticipation || []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent participation records yet.</p>
                ) : (
                  (overview?.recentParticipation || []).map((entry) => (
                    <div key={entry.registrationId} className="flex items-center justify-between rounded-md border p-2 text-xs">
                      <div>
                        <p className="font-medium">{entry.studentName} ({entry.section})</p>
                        <p className="text-muted-foreground">{entry.eventTitle}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium capitalize">{entry.status}</p>
                        <p className="text-muted-foreground">{new Date(entry.participatedAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-4">
            <h2 className="text-lg font-semibold">Mark Attendance</h2>
            <p className="text-xs text-muted-foreground">
              Select a student row to update status, participation score, and mentoring notes.
            </p>

            <div className="space-y-2">
              <Label>Selected Student</Label>
              <div className="rounded-md border p-2 text-sm min-h-10">
                {selectedRow ? `${selectedRow.studentName} (${selectedRow.course}, ${selectedRow.section})` : "No student selected"}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={markStatus} onValueChange={(value: AttendanceRow["status"]) => setMarkStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="score">Participation Score (0-10)</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={10}
                value={score}
                onChange={(e) => setScore(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remark">Teacher Remark</Label>
              <Textarea
                id="remark"
                placeholder="Example: Actively participated in Q&A and coordination."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={!selectedRow || markMutation.isPending}
              onClick={() => markMutation.mutate()}
            >
              {markMutation.isPending ? "Saving..." : "Save Attendance Update"}
            </Button>

            <Button
              className="w-full"
              variant="secondary"
              disabled={!selectedRow || syncMutation.isPending}
              onClick={() => syncMutation.mutate("selected")}
            >
              {syncMutation.isPending ? "Syncing..." : "Sync Selected to ERP"}
            </Button>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium">Added ERP Insights</p>
              <p className="text-xs text-muted-foreground mt-1">
                Teachers can now track participation timing, section-wise trends, and remarks for mentoring follow-ups.
              </p>
            </div>

            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-xs font-medium">Direct ERP Update</p>
              <p className="text-xs text-muted-foreground mt-1">
                Use sync buttons to push filtered or selected attendance directly to the main ERP endpoint.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
