import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import CaptchaComponent from "@/components/CaptchaComponent";

export default function StudentLogin() {
  const [location, setLocation] = useLocation();
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get redirect URL from query params
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const redirectUrl = searchParams?.get("redirect") ? decodeURIComponent(searchParams.get("redirect")!) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollment || !password) {
      toast({
        title: "Please fill all fields",
        description: "Enrollment number and password are required",
        variant: "destructive",
      });
      return;
    }

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
      const response = await apiRequest("POST", "/api/student/login", { enrollment, password });
      const data = await response.json();

      if (data.success) {
        // Invalidate the query cache to fetch fresh student data
        queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
        // Also set initial data from login response
        queryClient.setQueryData(["/api/student/me"], {
          id: data.student.id,
          name: data.student.name,
          enrollment: data.student.enrollment,
          email: data.student.email || "",
          branch: data.student.branch || "",
        });
        // Store student session for offline functionality
       // localStorage.setItem("currentStudent", enrollment);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Redirect to original page or dashboard
        setTimeout(() => {
          if (redirectUrl) {
            setLocation(redirectUrl);
          } else {
            setLocation("/student/dashboard");
          }
        }, 500);
      }
    } catch (error: any) {
      // Fallback to static authentication when API is unavailable
      const staticStudents = {
        "EN123456789": {
          id: "demo-student-1",
          name: "Demo Student",
          email: "student@example.com",
          enrollment: "EN123456789",
          branch: "Computer Science"
        }
      };

      // Check offline-created students first
      const offlineStudents = JSON.parse(localStorage.getItem("offlineStudents") || "{}");
      const offlineStudent = offlineStudents[enrollment];

      if (offlineStudent && offlineStudent.password === password) {
        const studentData = {
          id: offlineStudent.id,
          name: offlineStudent.name,
          email: offlineStudent.email,
          enrollment: offlineStudent.enrollment,
          branch: offlineStudent.branch
        };
        // Set the student data in the query cache
        queryClient.setQueryData(["/api/student/me"], studentData);
        // Store student session for offline functionality
       // localStorage.setItem("currentStudent", enrollment);
        toast({
          title: "Login successful",
          description: "Welcome back! (Offline mode)",
        });
        // Reset form fields
        setEnrollment("");
        setPassword("");
        setCaptchaVerified(false);
        // Redirect to original page or dashboard
        setTimeout(() => {
          if (redirectUrl) {
            setLocation(redirectUrl);
          } else {
            setLocation("/student/dashboard");
          }
        }, 500);
        setIsLoading(false);
        return;
      }

      // Check static demo student
      if (password === "password123" && staticStudents[enrollment as keyof typeof staticStudents]) {
        const studentData = staticStudents[enrollment as keyof typeof staticStudents];
        // Set the student data in the query cache
        queryClient.setQueryData(["/api/student/me"], studentData);
        // Store student session for offline functionality
       // localStorage.setItem("currentStudent", enrollment);
        toast({
          title: "Login successful",
          description: "Welcome back! (Offline mode)",
        });
        // Reset form fields
        setEnrollment("");
        setPassword("");
        setCaptchaVerified(false);
        // Redirect to original page or dashboard
        setTimeout(() => {
          if (redirectUrl) {
            setLocation(redirectUrl);
          } else {
            setLocation("/student/dashboard");
          }
        }, 500);
        setIsLoading(false);
        return;
      }

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
          <h1 className="text-3xl font-bold mb-2">Student Login</h1>
          <p className="text-muted-foreground font-body">
            Sign in to access your student dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="enrollment">Enrollment Number</Label>
            <Input
              id="enrollment"
              type="text"
              value={enrollment}
              onChange={(e) => setEnrollment(e.target.value)}
              disabled={isLoading}
              required
              placeholder="GEHU/2024/001"
              className="border-2"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* Interactive Captcha */}
          <CaptchaComponent onVerify={setCaptchaVerified} />

          <Button type="submit" className="w-full" disabled={isLoading || !captchaVerified}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setLocation("/student/signup")}
              className="text-primary hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>

        <div className="mt-6">
          <div className="text-center mb-4">
            <p className="text-sm text-muted-foreground">
              Demo Student Credentials:
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex justify-between items-center p-2 bg-background rounded border">
                <div>
                  <span className="font-medium">Demo Student</span>
                  <div className="text-xs text-muted-foreground">Computer Science</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-xs">EN123456789</div>
                  <div className="font-mono text-xs text-muted-foreground">password123</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}