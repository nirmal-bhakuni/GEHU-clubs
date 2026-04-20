import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { UNIVERSITY_BRANCH_OPTIONS } from "@/lib/branchOptions";
import CaptchaComponent from "@/components/CaptchaComponent";
import { UserPlus } from "lucide-react";

export default function StudentSignup() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    rollNumber: "",
    enrollment: "",
    yearOfAdmission: new Date().getFullYear(),
    currentSemester: "",
    department: "",
    password: "",
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const admissionYears = Array.from({ length: 10 }, (_, i) => currentYear - i);

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
    setValidationErrors({});

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
      const errorMessage = error?.message || "";
      const parsedField = error?.field || undefined;
      
      // Parse error message to check for validation errors
      if (errorMessage.includes("400:") || errorMessage.includes("409:")) {
        try {
          const jsonStr = errorMessage.replace(/^(400|409):\s*/, '');
          const parsed = JSON.parse(jsonStr);

          const field = parsed.field || parsedField;
          const message = parsed.error || "Please try again";

          if (field && ["email", "phone", "rollNumber", "enrollment"].includes(field)) {
            setValidationErrors({ [field]: message });
            toast({
              title: `${field.charAt(0).toUpperCase() + field.slice(1)} Error`,
              description: message,
              variant: "destructive",
            });
          } else if (message.includes("enrollment")) {
            setValidationErrors({ enrollment: message });
            toast({
              title: "Enrollment Error",
              description: message,
              variant: "destructive",
            });
          } else if (message.includes("roll number")) {
            setValidationErrors({ rollNumber: message });
            toast({
              title: "Roll Number Error",
              description: message,
              variant: "destructive",
            });
          } else if (message.includes("phone")) {
            setValidationErrors({ phone: message });
            toast({
              title: "Phone Error",
              description: message,
              variant: "destructive",
            });
          } else if (message.includes("email")) {
            setValidationErrors({ email: message });
            toast({
              title: "Email Error",
              description: message,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup failed",
              description: message,
              variant: "destructive",
            });
          }
        } catch {
          toast({
            title: "Signup failed",
            description: "An error occurred. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Fallback to static signup when API is unavailable
        const staticStudent = {
          id: `offline-${Date.now()}`,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          rollNumber: formData.rollNumber,
          enrollment: formData.enrollment,
          department: formData.department,
          yearOfAdmission: formData.yearOfAdmission,
          currentSemester: formData.currentSemester
        };

        const offlineStudents = JSON.parse(localStorage.getItem("offlineStudents") || "{}");
        offlineStudents[formData.enrollment] = { ...staticStudent, password: formData.password };

        toast({
          title: "Account created (Offline mode)",
          description: "Please login with your credentials",
        });
        setLocation("/student/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
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
              className={validationErrors.email ? "border-red-500" : ""}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              required
              placeholder="10-digit mobile number"
              className={validationErrors.phone ? "border-red-500" : ""}
            />
            {validationErrors.phone && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="rollNumber">Roll Number</Label>
            <Input
              id="rollNumber"
              name="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={handleChange}
              required
              placeholder="Your university roll number"
              className={validationErrors.rollNumber ? "border-red-500" : ""}
            />
            {validationErrors.rollNumber && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.rollNumber}</p>
            )}
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
              className={validationErrors.enrollment ? "border-red-500" : ""}
            />
            {validationErrors.enrollment && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.enrollment}</p>
            )}
          </div>

          <div>
            <Label htmlFor="department">Department / Branch</Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">Select Branch</option>
              {UNIVERSITY_BRANCH_OPTIONS.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="yearOfAdmission">Year of Admission</Label>
            <select
              id="yearOfAdmission"
              name="yearOfAdmission"
              value={formData.yearOfAdmission}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">Select Admission Year</option>
              {admissionYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="currentSemester">Current Semester</Label>
            <select
              id="currentSemester"
              name="currentSemester"
              value={formData.currentSemester}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">Select Semester</option>
              {Array.from({ length: 8 }, (_, index) => `Semester ${index + 1}`).map((semester) => (
                <option key={semester} value={semester}>
                  {semester}
                </option>
              ))}
            </select>
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