import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function FacultyForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Email required", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/faculty/forgot-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to send OTP");

      setOtpSent(true);
      toast({ title: "OTP sent", description: body.message || "Check your registered Gmail." });
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
      const response = await fetch("/api/faculty/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Failed to reset password");

      toast({ title: "Password reset successful", description: body.message || "You can login now." });
      setLocation("/faculty/login");
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
    <div className="min-h-screen flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Faculty Forgot Password</h1>
          <p className="text-sm text-muted-foreground">Get OTP on your registered Gmail and set a new password.</p>
        </div>

        {!otpSent ? (
          <form onSubmit={requestOtp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gehu.ac.in"
                required
                disabled={isSubmitting}
              />
            </div>
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={resetPassword} className="space-y-4">
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
            <Button className="w-full" disabled={isSubmitting}>
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

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => setLocation("/faculty/login")}
          >
            Back to Faculty Login
          </button>
        </div>
      </Card>
    </div>
  );
}
