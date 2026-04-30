import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BlockFacultyModal } from "@/components/BlockFacultyModal";
import { AuditLogsPanel } from "@/components/AuditLogsPanel";
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Users,
  BarChart3,
  Megaphone,
  UserCheck,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Faculty = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  contactNumber: string;
  idProofUrl: string;
  status: "pending" | "approved" | "rejected";
  isBlocked?: boolean;
  blockedReason?: string;
  blockedAt?: string;
  rejectionReason?: string;
  approvedAt?: string;
  createdAt?: string;
};

export default function AdminFacultyDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("manage");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isBlockedFilter, setIsBlockedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [offset, setOffset] = useState(0);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);
  const [unblockConfirmOpen, setUnblockConfirmOpen] = useState(false);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const limit = 10;

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {
      // Continue local cleanup even if API logout fails.
    } finally {
      localStorage.removeItem("currentAdmin");
      localStorage.removeItem("adminCache");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/admin/login");
    }
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    { id: "clubs", label: "Clubs Management", icon: Building2 },
    { id: "events", label: "Events Management", icon: Calendar },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "facultyApproval", label: "Faculty Approval", icon: UserCheck },
  ];

  // Build query params
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(isBlockedFilter !== "all" ? { isBlocked: isBlockedFilter } : {}),
    ...(searchQuery && { search: searchQuery }),
    ...(sortBy && { sortBy }),
  });

  type FacultyListResponse = {
    data: Faculty[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  };

  const { data: facultyData, isLoading } = useQuery<FacultyListResponse>({
    queryKey: ["/api/admin/faculty", statusFilter, isBlockedFilter, searchQuery, sortBy, offset],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/faculty?${queryParams}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch faculty");
      return (await response.json()) as FacultyListResponse;
    },
  });

  const facultyList = facultyData?.data || [];
  const pagination = facultyData?.pagination || { total: 0, limit, offset: 0, hasMore: false };

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: ["/api/admin/faculty"] });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/admin/faculty/${id}/approve`);
    },
    onSuccess: () => {
      toast({ title: "Faculty approved successfully" });
      refresh();
    },
    onError: (error: any) => {
      toast({
        title: "Approval failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/admin/faculty/${id}/reject`, {
        reason: reasons[id] || "",
      });
    },
    onSuccess: () => {
      toast({ title: "Faculty rejected" });
      setReasons({});
      refresh();
    },
    onError: (error: any) => {
      toast({
        title: "Rejection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const blockMutation = useMutation<Response, any, { id: string; reason: string }>({
    mutationFn: async ({ id, reason }) => {
      return apiRequest("PUT", `/api/admin/faculty/${id}/block`, { reason });
    },
    onSuccess: () => {
      toast({ title: "Faculty blocked successfully" });
      setBlockModalOpen(false);
      setSelectedFaculty(null);
      refresh();
    },
    onError: (error: any) => {
      toast({
        title: "Block failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const unblockMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PUT", `/api/admin/faculty/${id}/unblock`, {
        reason: reasons[id] || "",
      });
    },
    onSuccess: () => {
      toast({ title: "Faculty unblocked successfully" });
      setUnblockConfirmOpen(false);
      setSelectedFaculty(null);
      setReasons({});
      refresh();
    },
    onError: (error: any) => {
      toast({
        title: "Unblock failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get counts for summary
  const { data: summaryData } = useQuery({
    queryKey: ["/api/admin/faculty", "summary"],
    queryFn: async () => {
      const [pendingRes, approvedRes, rejectedRes, blockedRes] = await Promise.all([
        fetch(`/api/admin/faculty?status=pending&limit=1&offset=0`, {
          credentials: "include",
        }),
        fetch(`/api/admin/faculty?status=approved&limit=1&offset=0`, {
          credentials: "include",
        }),
        fetch(`/api/admin/faculty?status=rejected&limit=1&offset=0`, {
          credentials: "include",
        }),
        fetch(`/api/admin/faculty?isBlocked=true&limit=1&offset=0`, {
          credentials: "include",
        }),
      ]);

      return {
        pending: (await pendingRes.json()).pagination.total,
        approved: (await approvedRes.json()).pagination.total,
        rejected: (await rejectedRes.json()).pagination.total,
        blocked: (await blockedRes.json()).pagination.total,
      };
    },
  });

  const getStatusBadge = (faculty: Faculty) => {
    if (faculty.isBlocked) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 text-red-600 px-3 py-1 text-xs font-semibold">
          <Lock className="h-3 w-3" />
          Blocked
        </span>
      );
    }
    if (faculty.status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-600/20 text-green-600 px-3 py-1 text-xs font-semibold">
          <CheckCircle className="h-3 w-3" />
          Approved
        </span>
      );
    }
    if (faculty.status === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-600/20 text-yellow-600 px-3 py-1 text-xs font-semibold">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    }
    if (faculty.status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-600/20 text-red-600 px-3 py-1 text-xs font-semibold">
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen flex bg-transparent">
      {/* Sidebar */}
      <div className="w-64 border-r border-border/70 bg-card/80 backdrop-blur-sm">
        <div className="p-6">
          <div className="mb-8 rounded-xl border border-border/70 bg-background/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Admin Panel
            </p>
            <h1 className="mt-2 text-xl font-semibold leading-tight">
              University Admin
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Control clubs, events, users, and announcements
            </p>
          </div>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) {
                      setLocation(item.path);
                      return;
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                    item.id === "facultyApproval"
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
              onClick={handleLogout}
              className="w-full bg-background/70"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Faculty Approval Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Review and manage faculty registrations and access control.
            </p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{summaryData?.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Approved</p>
                  <p className="text-2xl font-bold">{summaryData?.approved || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">{summaryData?.rejected || 0}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked</p>
                  <p className="text-2xl font-bold">{summaryData?.blocked || 0}</p>
                </div>
                <Lock className="h-8 w-8 text-red-600 opacity-50" />
              </div>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="manage">Manage Faculty</TabsTrigger>
              <TabsTrigger value="audit">Activity Logs</TabsTrigger>
            </TabsList>

            {activeTab === "manage" && (
              <div className="space-y-4 mt-6">
                {/* Filters and Search */}
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex-1 min-w-0 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setOffset(0);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                  <div className="flex gap-3 flex-wrap">
                    <Select value={statusFilter} onValueChange={(value) => {
                      setStatusFilter(value);
                      setOffset(0);
                    }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={isBlockedFilter} onValueChange={(value) => {
                      setIsBlockedFilter(value);
                      setOffset(0);
                    }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Block Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Faculty</SelectItem>
                        <SelectItem value="true">Blocked Only</SelectItem>
                        <SelectItem value="false">Active Only</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value) => {
                      setSortBy(value);
                      setOffset(0);
                    }}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort By" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Newest First</SelectItem>
                        <SelectItem value="name">Name (A-Z)</SelectItem>
                        <SelectItem value="email">Email (A-Z)</SelectItem>
                        <SelectItem value="approvedAt">Approved Date</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Faculty Table */}
                <Card className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left border-b bg-muted/30">
                        <th className="py-3 px-4 font-semibold">#</th>
                        <th className="py-3 px-4 font-semibold">Name</th>
                        <th className="py-3 px-4 font-semibold">Email</th>
                        <th className="py-3 px-4 font-semibold">Department</th>
                        <th className="py-3 px-4 font-semibold">Status</th>
                        <th className="py-3 px-4 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            <div className="flex justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                          </td>
                        </tr>
                      ) : facultyList.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="text-center py-8 text-muted-foreground"
                          >
                            No faculty found.
                          </td>
                        </tr>
                      ) : (
                        facultyList.map((faculty, idx) => (
                          <tr
                            key={faculty.id}
                            className="border-b hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                              {offset + idx + 1}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {faculty.fullName}
                            </td>
                            <td className="py-3 px-4 text-sm">{faculty.email}</td>
                            <td className="py-3 px-4 text-sm">
                              {faculty.department}
                            </td>
                            <td className="py-3 px-4">{getStatusBadge(faculty)}</td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <a
                                  href={faculty.idProofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-600 hover:underline"
                                >
                                  View ID
                                </a>
                                <div className="relative group">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => {
                                      setSelectedFaculty(faculty);
                                      if (faculty.isBlocked) {
                                        setUnblockConfirmOpen(true);
                                      }
                                    }}
                                  >
                                    ⋯
                                  </Button>
                                  <div className="absolute right-0 top-full mt-1 bg-white border rounded shadow-lg z-10 hidden group-hover:flex flex-col py-1 min-w-max">
                                    {faculty.status === "pending" && (
                                      <>
                                        <button
                                          className="px-4 py-2 text-sm text-left text-slate-900 hover:bg-gray-100"
                                          onClick={() =>
                                            approveMutation.mutate(faculty.id)
                                          }
                                          disabled={approveMutation.isPending}
                                        >
                                          Approve
                                        </button>
                                        <button
                                          className="px-4 py-2 text-sm text-left text-slate-900 hover:bg-gray-100"
                                          onClick={() => {
                                            setSelectedFaculty(faculty);
                                          }}
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    {faculty.status === "approved" &&
                                      !faculty.isBlocked && (
                                        <button
                                          className="px-4 py-2 text-sm text-left text-red-600 hover:bg-red-50"
                                          onClick={() => {
                                            setSelectedFaculty(faculty);
                                            setBlockModalOpen(true);
                                          }}
                                        >
                                          Block Faculty
                                        </button>
                                      )}
                                    {faculty.isBlocked && (
                                      <button
                                        className="px-4 py-2 text-sm text-left text-green-600 hover:bg-green-50"
                                        onClick={() => {
                                          setSelectedFaculty(faculty);
                                          setUnblockConfirmOpen(true);
                                        }}
                                      >
                                        Unblock Faculty
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </Card>

                {/* Pagination */}
                {facultyList.length > 0 && (
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Showing {offset + 1} to{" "}
                      {Math.min(offset + limit, pagination.total)} of{" "}
                      {pagination.total} records
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setOffset(Math.max(0, offset - limit))
                        }
                        disabled={offset === 0}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setOffset(offset + limit)}
                        disabled={!pagination.hasMore}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "audit" && (
              <div className="mt-6">
                <AuditLogsPanel title="Faculty Activity Logs" />
              </div>
            )}
          </Tabs>
        </div>
      </div>

      {/* Block Faculty Modal */}
      <BlockFacultyModal
        isOpen={blockModalOpen}
        onOpenChange={setBlockModalOpen}
        facultyName={selectedFaculty?.fullName || ""}
        facultyEmail={selectedFaculty?.email || ""}
        isBlocking={blockMutation.isPending}
        onConfirm={(reason) => {
          if (selectedFaculty) {
            blockMutation.mutate({ id: selectedFaculty.id, reason });
          }
        }}
      />

      {/* Unblock Confirmation */}
      <AlertDialog open={unblockConfirmOpen} onOpenChange={setUnblockConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock Faculty Member?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 mt-4">
              <p>
                <strong>Faculty:</strong> {selectedFaculty?.fullName}
              </p>
              <p>
                <strong>Email:</strong> {selectedFaculty?.email}
              </p>
              <div className="rounded bg-green-50 p-3">
                <p className="text-sm text-green-900">
                  ✓ Unblocking will allow this faculty to log in and access the system again.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-2 justify-end">
            <AlertDialogCancel disabled={unblockMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedFaculty) {
                  unblockMutation.mutate(selectedFaculty.id);
                }
              }}
              disabled={unblockMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {unblockMutation.isPending ? "Unblocking..." : "Unblock Faculty"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Modal - if selected */}
      {selectedFaculty && selectedFaculty.status === "pending" && (
        <AlertDialog open={!!selectedFaculty && !blockModalOpen && !unblockConfirmOpen} onOpenChange={() => setSelectedFaculty(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject Faculty Application</AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 mt-4">
                <div>
                  <p>
                    <strong>Faculty:</strong> {selectedFaculty?.fullName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedFaculty?.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Reason (Optional)
                  </label>
                  <textarea
                    placeholder="Enter rejection reason..."
                    value={reasons[selectedFaculty?.id] || ""}
                    onChange={(e) =>
                      setReasons((prev) => ({
                        ...prev,
                        [selectedFaculty!.id]: e.target.value,
                      }))
                    }
                    className="w-full border rounded p-2 text-sm"
                    rows={3}
                  />
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel disabled={rejectMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (selectedFaculty) {
                    rejectMutation.mutate(selectedFaculty.id);
                  }
                }}
                disabled={rejectMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectMutation.isPending ? "Rejecting..." : "Reject"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

