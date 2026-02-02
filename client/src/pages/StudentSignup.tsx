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
    phone: "",
    rollNumber: "",
    enrollment: "",
    yearOfAdmission: new Date().getFullYear(),
    department: "",
    password: "",
  });
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const departments = [
    // Engineering Departments
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Electrical",
    "Chemical",
    "Biotechnology",
    "Instrumentation",
    // Science Departments
    "Physics",
    "Chemistry",
    "Mathematics",
    "Biology",
    "Microbiology",
    // Management & Commerce
    "Business Administration",
    "Commerce",
    "Economics",
    "Management Studies",
    // Humanities & Social Sciences
    "English",
    "Hindi",
    "History",
    "Political Science",
    "Psychology",
    "Sociology",
    // Law
    "Law",
    // Fine Arts
    "Fine Arts",
    "Performing Arts",
    // Other
    "Other",
  ];

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
      
      // Parse error message to check for validation errors
      if (errorMessage.includes("400:")) {
        try {
          const jsonStr = errorMessage.replace(/^400:\s*/, '');
          const parsed = JSON.parse(jsonStr);
          
          if (parsed.error?.includes("enrollment")) {
            setValidationErrors({ enrollment: parsed.error });
            toast({
              title: "Enrollment Error",
              description: parsed.error,
              variant: "destructive",
            });
          } else if (parsed.error?.includes("roll number")) {
            setValidationErrors({ rollNumber: parsed.error });
            toast({
              title: "Roll Number Error",
              description: parsed.error,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Signup failed",
              description: parsed.error || "Please try again",
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
          yearOfAdmission: formData.yearOfAdmission
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
            />
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
            />
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
            <Label htmlFor="department">Department</Label>
            <select
              id="department"
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
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