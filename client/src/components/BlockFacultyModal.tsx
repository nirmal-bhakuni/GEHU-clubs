import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle } from "lucide-react";

interface BlockFacultyModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facultyName: string;
  facultyEmail: string;
  isBlocking: boolean;
  onConfirm: (reason: string) => void;
}

export function BlockFacultyModal({
  isOpen,
  onOpenChange,
  facultyName,
  facultyEmail,
  isBlocking,
  onConfirm,
}: BlockFacultyModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      alert("Please provide a reason for blocking this faculty");
      return;
    }
    onConfirm(reason);
    setReason("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setReason("");
    }
    onOpenChange(open);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDialogTitle>Block Faculty Member</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="mt-4">
            <div className="space-y-3 text-sm">
              <p>
                <strong>Faculty:</strong> {facultyName}
              </p>
              <p>
                <strong>Email:</strong> {facultyEmail}
              </p>
              <div className="mt-4 rounded bg-red-50 p-3">
                <p className="text-red-900">
                  ⚠️ This action will:
                </p>
                <ul className="mt-2 ml-4 space-y-1 list-disc text-red-800">
                  <li>Immediately block faculty access</li>
                  <li>Invalidate all existing sessions</li>
                  <li>Prevent future logins</li>
                  <li>Send blocking notification email</li>
                </ul>
              </div>
              <div className="mt-4 space-y-2">
                <label className="text-sm font-medium">
                  Reason for blocking <span className="text-red-600">*</span>
                </label>
                <Textarea
                  placeholder="Enter the reason for blocking this faculty member..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="resize-none"
                  rows={4}
                />
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isBlocking}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isBlocking || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isBlocking ? "Blocking..." : "Block Faculty"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
