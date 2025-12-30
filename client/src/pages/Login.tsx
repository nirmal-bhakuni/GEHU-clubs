import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CaptchaComponent from "@/components/CaptchaComponent";

export default function Login() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaVerified) {
      toast({
        title: "Captcha required",
        description: "Please verify you're human first",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Try API first, fallback to static authentication
      const staticAdmins = {
        "admin": { id: "admin-1", username: "admin", clubId: null },
        "university_admin": { id: "admin-1", username: "admin", clubId: null }
      };

      let loginSuccess = false;
      let loginData = null;

      try {
        const response = await apiRequest("POST", "/api/auth/login", { username, password });
        const data = await response.json();
        if (data.success) {
          loginSuccess = true;
          loginData = data;
        }
      } catch (apiError) {
        // Fallback to static authentication
        if ((username === "admin" || username === "university_admin") && password === "admin123") {
          loginSuccess = true;
          loginData = { 
            success: true, 
            admin: staticAdmins[username as keyof typeof staticAdmins] || staticAdmins["admin"]
          };
        }
      }

      if (loginSuccess) {
        // Store admin session for offline functionality
        localStorage.setItem("currentAdmin", username);
        // Set the admin data directly in the query cache
        queryClient.setQueryData(["/api/auth/me"], loginData.admin);
        toast({
          title: "Login successful",
          description: "Welcome to the admin dashboard.",
        });
        // Small delay to ensure state is updated before redirect
        setTimeout(() => setLocation("/dashboard"), 100);
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">University Admin Login</h1>
          <p className="text-muted-foreground font-body">
            Sign in to access the admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              data-testid="input-username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
            />
          </div>

          {/* Interactive Captcha */}
          <CaptchaComponent onVerify={setCaptchaVerified} />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !captchaVerified}
            data-testid="button-login"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Default credentials for testing:</p>
          <div className="font-mono mt-1 space-y-1">
            <p>Username: admin | Password: admin123</p>
            <p>Username: university_admin | Password: admin123</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
