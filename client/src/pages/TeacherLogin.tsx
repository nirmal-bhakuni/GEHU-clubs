import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function TeacherLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast({
        title: "Missing details",
        description: "Please enter username and password.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiRequest("POST", "/api/teacher/auth/login", { username, password });
      const data = await response.json();

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["/api/teacher/auth/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/teacher/erp/overview"] });
        queryClient.invalidateQueries({ queryKey: ["/api/teacher/attendance"] });

        toast({
          title: "Teacher login successful",
          description: "Welcome to the ERP attendance console.",
        });

        setLocation("/teacher/erp");
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <Card className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Teacher Login</h1>
          <p className="text-sm text-muted-foreground">
            Manage student attendance, participation timing, and section-wise activity.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="teacher-username">Username</Label>
            <Input
              id="teacher-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="teacher"
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacher-password">Password</Label>
            <Input
              id="teacher-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="teacher123"
              disabled={isLoading}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In as Teacher"}
          </Button>
        </form>

        <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
          Default credentials: <span className="font-medium">teacher / teacher123</span>
        </div>
      </Card>
    </div>
  );
}
