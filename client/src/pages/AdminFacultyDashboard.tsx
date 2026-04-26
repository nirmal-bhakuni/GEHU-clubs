import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  Building2, 
  Calendar, 
  Users, 
  BarChart3, 
  Megaphone, 
  UserCheck,
  LogOut 
} from "lucide-react";

type Faculty = {
  id: string;
  fullName: string;
  email: string;
  department: string;
  contactNumber: string;
  idProofUrl: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
};

export default function AdminFacultyDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
    { id: "clubs", label: "Clubs Management", icon: Building2 },
    { id: "events", label: "Events Management", icon: Calendar },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "facultyApproval", label: "Faculty Approval", icon: UserCheck },
  ];

  const { data: facultyList = [], isLoading } = useQuery<Faculty[]>({
    queryKey: ["/api/admin/faculty", status],
    queryFn: async () => {
      const response = await fetch(`/api/admin/faculty?status=${status}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch faculty");
      return response.json();
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/faculty"] });

  const approve = async (id: string) => {
    try {
      await apiRequest("PUT", `/api/admin/faculty/${id}/approve`);
      toast({ title: "Faculty approved" });
      refresh();
    } catch (error: any) {
      toast({ title: "Approval failed", description: error.message, variant: "destructive" });
    }
  };

  const reject = async (id: string) => {
    try {
      await apiRequest("PUT", `/api/admin/faculty/${id}/reject`, { reason: reasons[id] || "" });
      toast({ title: "Faculty rejected" });
      refresh();
    } catch (error: any) {
      toast({ title: "Rejection failed", description: error.message, variant: "destructive" });
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
              onClick={() => logoutMutation.mutate()}
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
            <p className="text-sm text-muted-foreground">Review and manage faculty registrations.</p>
          </div>

          <Tabs value={status} onValueChange={(value) => setStatus(value as typeof status)}>
            <TabsList>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>

          <Card className="p-4 overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2 w-10">#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Contact</th>
                  <th>ID Proof</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">Loading faculty...</td>
                  </tr>
                ) : facultyList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-muted-foreground">No faculty found.</td>
                  </tr>
                ) : (
                  facultyList.map((faculty, idx) => (
                    <tr
                      key={faculty.id}
                      className={`border-b align-top transition-colors ${
                        idx % 2 === 0 ? 'bg-background/60' : 'bg-background/80'
                      } hover:bg-primary/10`}
                    >
                      <td className="py-2 font-mono text-xs text-muted-foreground">{idx + 1}</td>
                      <td className="py-2">{faculty.fullName}</td>
                      <td>{faculty.email}</td>
                      <td>{faculty.department}</td>
                      <td>{faculty.contactNumber}</td>
                      <td>
                        <a className="underline" href={faculty.idProofUrl} target="_blank" rel="noreferrer">
                          Preview
                        </a>
                      </td>
                      <td>
                        {faculty.status === "approved" && (
                          <span className="inline-block rounded-full bg-green-600/20 text-green-500 px-3 py-1 text-xs font-semibold">Approved</span>
                        )}
                        {faculty.status === "pending" && (
                          <span className="inline-block rounded-full bg-yellow-600/20 text-yellow-500 px-3 py-1 text-xs font-semibold">Pending</span>
                        )}
                        {faculty.status === "rejected" && (
                          <span className="inline-block rounded-full bg-red-600/20 text-red-500 px-3 py-1 text-xs font-semibold">Rejected</span>
                        )}
                      </td>
                      <td className="space-y-2 py-2 min-w-56">
                        {faculty.status === "pending" ? (
                          <>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => approve(faculty.id)}>Approve</Button>
                              <Button size="sm" variant="destructive" onClick={() => reject(faculty.id)}>Reject</Button>
                            </div>
                            <Input
                              placeholder="Optional rejection reason"
                              value={reasons[faculty.id] || ""}
                              onChange={(e) => setReasons((prev) => ({ ...prev, [faculty.id]: e.target.value }))}
                            />
                          </>
                        ) : faculty.status === "rejected" && faculty.rejectionReason ? (
                          <p className="text-xs text-muted-foreground">Reason: {faculty.rejectionReason}</p>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
