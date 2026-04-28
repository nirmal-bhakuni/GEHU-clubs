import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({ title: "Username required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/university-admin/forgot-password/request", {
        username: username.trim(),
      });
      const data = await res.json();
      setOtpSent(true);
      toast({ title: "OTP sent", description: data.message || "Check your registered Gmail." });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim() || !newPassword) {
      toast({ title: "OTP and password required", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/university-admin/forgot-password/reset", {
        username: username.trim(),
        otp: otp.trim(),
        newPassword,
      });
      const data = await res.json();
      toast({ title: "Password reset successful", description: data.message || "You can login now." });
      setLocation("/admin/login");
    } catch (error: any) {
      toast({
        title: "Reset failed",
        description: error?.message || "Invalid or expired OTP",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-2">University Admin Forgot Password</h1>
          <p className="text-muted-foreground">Get OTP on your registered Gmail to reset password</p>
        </div>

        {!otpSent ? (
          <form onSubmit={requestOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => setOtpSent(false)}
              disabled={isSubmitting}
            >
              Resend OTP
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setLocation("/admin/login")}
          >
            Back to University Admin Login
          </button>
        </div>
      </Card>
    </div>
  );
}
