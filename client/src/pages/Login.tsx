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
      let loginSuccess = false;
      let loginData = null;

      try {
        const response = await apiRequest("POST", "/api/auth/login", { username, password });
        const data = await response.json();
        if (data.success && !data.admin.clubId) {
          loginSuccess = true;
          loginData = data;
        } else if (data.admin && data.admin.clubId) {
          throw new Error("Club admins must use the club admin login");
        }
      } catch (apiError: any) {
        // Fallback to static authentication
        if (username === "admin" && password === "admin123") {
          loginSuccess = true;
          loginData = { 
            success: true, 
            admin: { 
              id: "admin-1", 
              username: "admin", 
              clubId: null 
            } 
          };
        } else {
          throw apiError;
        }
      }

      if (loginSuccess && loginData.admin && !loginData.admin.clubId) {
        // Store admin session for offline functionality
        localStorage.setItem("currentAdmin", username);
        // Set the admin data directly in the query cache
        queryClient.setQueryData(["/api/auth/me"], loginData.admin);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setLocation("/dashboard");
      } else {
        throw new Error("Invalid credentials or wrong login type");
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
          <p className="font-mono mt-1">
            Username: admin | Password: admin123
          </p>
        </div>
      </Card>
    </div>
  );
}
