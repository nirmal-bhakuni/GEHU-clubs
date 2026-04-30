import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  UserPlus,
} from "lucide-react";

interface AuditLog {
  id: string;
  facultyId: string;
  facultyEmail: string;
  action: "registered" | "approved" | "rejected" | "blocked" | "unblocked";
  performedBy: string;
  performedByEmail: string;
  reason: string;
  metadata: {
    oldStatus: string;
    newStatus: string;
  };
  timestamp: string;
}

interface AuditLogsPanelProps {
  facultyId?: string;
  title?: string;
}

export function AuditLogsPanel({
  facultyId,
  title = "Activity Logs",
}: AuditLogsPanelProps) {
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState("all");
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: [
      "auditLogs",
      facultyId ? `faculty-${facultyId}` : "all",
      offset,
      action,
      search,
    ],
    queryFn: async () => {
      const endpoint = facultyId
        ? `/api/admin/faculty/${facultyId}/history`
        : "/api/admin/faculty/audit-logs";

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (action !== "all") params.append("action", action);
      if (search && !facultyId) params.append("search", search);

      const response = await fetch(`${endpoint}?${params}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      return response.json();
    },
  });

  const getActionIcon = (action: string) => {
    switch (action) {
      case "registered":
        return <UserPlus className="h-4 w-4 text-blue-600" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "blocked":
        return <Lock className="h-4 w-4 text-red-600" />;
      case "unblocked":
        return <Unlock className="h-4 w-4 text-green-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case "registered":
        return "Registered";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "blocked":
        return "Blocked";
      case "unblocked":
        return "Unblocked";
      default:
        return action;
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case "registered":
        return "bg-blue-100 text-blue-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      case "unblocked":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-800">Failed to load audit logs</p>
      </div>
    );
  }

  const logs = data?.data || [];
  const pagination = data?.pagination || { total: 0, hasMore: false };
  const hasMore = pagination.hasMore && logs.length > 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{title}</h3>
      </div>

      {!facultyId && (
        <div className="flex gap-4 flex-wrap">
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="registered">Registered</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="blocked">Blocked</SelectItem>
              <SelectItem value="unblocked">Unblocked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Action</TableHead>
              {!facultyId && (
                <>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Email</TableHead>
                </>
              )}
              <TableHead>Performed By</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Date & Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={!facultyId ? 5 : 4} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={!facultyId ? 5 : 4}
                  className="text-center py-8 text-gray-500"
                >
                  No activity logs found
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log: AuditLog) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActionIcon(log.action)}
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {getActionLabel(log.action)}
                      </span>
                    </div>
                  </TableCell>
                  {!facultyId && (
                    <>
                      <TableCell className="text-sm">
                        {log.facultyEmail.split("@")[0]}
                      </TableCell>
                      <TableCell className="text-sm">{log.facultyEmail}</TableCell>
                    </>
                  )}
                  <TableCell className="text-sm">{log.performedByEmail}</TableCell>
                  <TableCell className="text-sm max-w-xs truncate">
                    {log.reason || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(log.timestamp)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {logs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Showing {offset + 1} to {Math.min(offset + limit, pagination.total)} of{" "}
            {pagination.total} records
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOffset(offset + limit)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
