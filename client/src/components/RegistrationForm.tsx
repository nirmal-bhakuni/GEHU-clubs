import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StudentData {
  fullName?: string;
  email?: string;
  phone?: string;
  rollNumber?: string;
  enrollmentNumber?: string;
  department?: string;
  yearOfAdmission?: number;
}

interface RegistrationFormProps {
  eventTitle: string;
  eventDate: string;
  eventDurationMinutes?: number;
  clubName: string;
  studentData?: StudentData;
  isAuthenticated?: boolean;
  onLoginRequired?: () => void;
  onSubmit?: (data: StudentRegistration) => void;
}

export interface StudentRegistration {
  fullName: string;
  email: string;
  phone: string;
  rollNumber: string;
  course: string;
  department: string;
  year: string;
  section: string;
  eventDurationMinutes?: number;
  enrollmentNumber: string;
  interests: string[];
  experience?: string;
  eventId?: string;
}

export default function RegistrationForm({
  eventTitle,
  eventDate,
  eventDurationMinutes = 120,
  clubName,
  studentData,
  isAuthenticated = true,
  onLoginRequired,
  onSubmit,
}: RegistrationFormProps) {
  // Helper function to calculate year label from admission year
  const getYearLabel = (admissionYear: number): string => {
    const currentYear = new Date().getFullYear();
    const yearOfCourse = currentYear - admissionYear + 1;
    const yearLabels: Record<number, string> = {
      1: "First Year",
      2: "Second Year",
      3: "Third Year",
      4: "Fourth Year",
    };
    return yearLabels[yearOfCourse] || "First Year";
  };

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState<StudentRegistration>({
    fullName: studentData?.fullName || "",
    email: studentData?.email || "",
    phone: studentData?.phone || "",
    rollNumber: studentData?.rollNumber || "",
    course: studentData?.department || "",
    department: studentData?.department || "",
    year: studentData?.yearOfAdmission ? getYearLabel(studentData.yearOfAdmission) : "First Year",
    section: "",
    eventDurationMinutes,
    enrollmentNumber: studentData?.enrollmentNumber || "",
    interests: [],
    experience: "",
  });

  // Update form data when studentData changes
  useEffect(() => {
    if (studentData) {
      console.log("Auto-filling form with student data:", studentData);
      setFormData((prev) => {
        const academicYear = studentData.yearOfAdmission 
          ? getYearLabel(studentData.yearOfAdmission)
          : "First Year";
        const updated = {
          ...prev,
          fullName: studentData.fullName || prev.fullName || "",
          email: studentData.email || prev.email || "",
          phone: studentData.phone || prev.phone || "",
          rollNumber: studentData.rollNumber || prev.rollNumber || "",
          enrollmentNumber: studentData.enrollmentNumber || prev.enrollmentNumber || "",
          course: studentData.department || prev.course || "",
          department: studentData.department || prev.department || "",
          year: academicYear,
          eventDurationMinutes,
        };
        console.log("Updated form data:", updated);
        return updated;
      });
    }
  }, [studentData, eventDurationMinutes]);

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

  const years = ["First Year", "Second Year", "Third Year", "Fourth Year"];
  const yearToSectionSuffix: Record<string, string> = {
    "First Year": "1",
    "Second Year": "2",
    "Third Year": "3",
    "Fourth Year": "4",
  };

  const sectionOptions = ["A", "B", "C", "D", "E", "F"].map(
    (letter) => `${letter}${yearToSectionSuffix[formData.year] || "1"}`,
  );

  const interestOptions = [
    "Web Development",
    "Mobile Apps",
    "AI/ML",
    "Robotics",
    "Design",
    "Business",
    "Leadership",
    "Competitive Programming",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      if (name === "course") {
        return {
          ...prev,
          course: value,
          department: value,
        };
      }

      if (name === "year") {
        const nextSuffix = yearToSectionSuffix[value] || "1";
        const currentPrefix = (prev.section || "A1").charAt(0).toUpperCase();

        return {
          ...prev,
          year: value,
          section: /^[A-F]$/.test(currentPrefix) ? `${currentPrefix}${nextSuffix}` : `A${nextSuffix}`,
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const handleInterestToggle = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check authentication before submission
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to complete your registration.",
        variant: "destructive",
      });
      onLoginRequired?.();
      return;
    }
    
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.rollNumber ||
      !formData.enrollmentNumber ||
      !formData.course ||
      !formData.year ||
      !formData.section
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit?.(formData);
      setSubmitted(true);
      
      setTimeout(() => {
        setSubmitted(false);
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          rollNumber: "",
          course: "",
          department: "",
          year: "First Year",
          section: "A1",
          eventDurationMinutes,
          enrollmentNumber: "",
          interests: [],
          experience: "",
        });
      }, 3000);
    } catch (error) {
      // Error is handled by the parent component
      console.error("Registration failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="p-8 text-center border-2 border-primary/30 bg-primary/5">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-2">Registration Successful!</h3>
        <p className="text-muted-foreground mb-2">
          Welcome to <span className="font-semibold">{clubName}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          A confirmation email has been sent to <span className="font-semibold">{formData.email}</span>
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          We'll see you at {eventTitle} on {eventDate}!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-8 border-2">
      <h2 className="text-2xl font-bold mb-2">Register for this Event</h2>
      <p className="text-muted-foreground mb-6">
        Join <span className="font-semibold">{clubName}</span> for{" "}
        <span className="font-semibold">{eventTitle}</span>
      </p>

      <div className="mb-6 grid grid-cols-1 gap-3 rounded-md border bg-muted/30 p-4 text-sm md:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Date</p>
          <p className="font-medium">{eventDate}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Duration</p>
          <p className="font-medium">
            {eventDurationMinutes >= 60
              ? `${Math.floor(eventDurationMinutes / 60)}h ${eventDurationMinutes % 60 ? `${eventDurationMinutes % 60}m` : ""}`.trim()
              : `${eventDurationMinutes}m`}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Duration Snapshot</p>
          <p className="font-medium">{eventDurationMinutes} minutes</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleInputChange}
                disabled
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="tel"
                name="phone"
                placeholder="10-digit mobile number"
                value={formData.phone}
                onChange={handleInputChange}
                disabled
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="rollNumber"
                placeholder="Enter your roll number"
                value={formData.rollNumber}
                onChange={handleInputChange}
                disabled
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Enrollment Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="enrollmentNumber"
                placeholder="GEHU/2024/001"
                value={formData.enrollmentNumber}
                onChange={handleInputChange}
                disabled
                required
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course"
                value={formData.course}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">Select Course</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <select
                name="year"
                value={formData.year}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Section <span className="text-red-500">*</span>
              </label>
              <select
                name="section"
                value={formData.section}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
              >
                <option value="">Select Section</option>
                {sectionOptions.map((section) => (
                  <option key={section} value={section}>
                    {section}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Interests */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Areas of Interest</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {interestOptions.map((interest) => (
              <Badge
                key={interest}
                variant={
                  formData.interests.includes(interest) ? "default" : "outline"
                }
                className="cursor-pointer py-2 px-3 justify-center"
                onClick={() => handleInterestToggle(interest)}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Experience & Comments</h3>
          <div>
            <label className="block text-sm font-medium mb-2">
              Tell us about your experience (optional)
            </label>
            <Textarea
              name="experience"
              placeholder="Share any relevant experience or why you're interested in joining..."
              value={formData.experience}
              onChange={handleInputChange}
              rows={4}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          size="lg" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registering..." : "Complete Registration"}
        </Button>
      </form>
    </Card>
  );
}
