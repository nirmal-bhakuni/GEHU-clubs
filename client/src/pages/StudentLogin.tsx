import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function StudentLogin() {
  const [, setLocation] = useLocation();
  const [enrollment, setEnrollment] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/student/login", { enrollment, password });
      const data = await response.json();

      if (data.success) {
        // Set the student data in the query cache
        queryClient.setQueryData(["/api/student/me"], data.student);
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        setLocation("/student/dashboard");
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
              required
              placeholder="GEHU/2024/001"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
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
      </Card>
    </div>
  );
}