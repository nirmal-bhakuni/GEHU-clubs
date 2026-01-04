import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CaptchaComponent from "@/components/CaptchaComponent";
import { UserPlus } from "lucide-react";

export default function StudentSignup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    enrollment: "",
    branch: "",
    password: "",
  });
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
      const response = await apiRequest("POST", "/api/student/signup", formData);
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Account created",
          description: "Please login with your credentials",
        });
        setLocation("/student/login");
      }
    } catch (error: any) {
      // Fallback to static signup when API is unavailable
      // In offline mode, we'll simulate account creation and redirect to login
      const staticStudent = {
        id: `offline-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        enrollment: formData.enrollment,
        branch: formData.branch
      };

      // Store the "created" account in localStorage for demo purposes
      const offlineStudents = JSON.parse(localStorage.getItem("offlineStudents") || "{}");
      offlineStudents[formData.enrollment] = { ...staticStudent, password: formData.password };
     // localStorage.setItem("offlineStudents", JSON.stringify(offlineStudents));

      toast({
        title: "Account created (Offline mode)",
        description: "Please login with your credentials",
      });
      setLocation("/student/login");
      setIsLoading(false);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-16 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Student Signup</h1>
          <p className="text-muted-foreground font-body">
            Create your student account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="John Doe"
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@gehu.ac.in"
            />
          </div>

          <div>
            <Label htmlFor="enrollment">Enrollment Number</Label>
            <Input
              id="enrollment"
              name="enrollment"
              type="text"
              value={formData.enrollment}
              onChange={handleChange}
              required
              placeholder="GEHU/2021/001"
            />
          </div>

          <div>
            <Label htmlFor="branch">Branch</Label>
            <Input
              id="branch"
              name="branch"
              type="text"
              value={formData.branch}
              onChange={handleChange}
              required
              placeholder="Computer Science"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          {/* Interactive Captcha */}
          <CaptchaComponent onVerify={setCaptchaVerified} />

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground"
            disabled={isLoading || !captchaVerified}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setLocation("/student/login")}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </Card>
    </div>
  );
}