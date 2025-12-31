import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface RegistrationFormProps {
  eventTitle: string;
  eventDate: string;
  clubName: string;
  onSubmit?: (data: StudentRegistration) => void;
}

export interface StudentRegistration {
  fullName: string;
  email: string;
  phone: string;
  rollNumber: string;
  department: string;
  year: string;
  enrollmentNumber: string;
  interests: string[];
  experience?: string;
  eventId?: string;
}

export default function RegistrationForm({
  eventTitle,
  eventDate,
  clubName,
  onSubmit,
}: RegistrationFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<StudentRegistration>({
    fullName: "",
    email: "",
    phone: "",
    rollNumber: "",
    department: "",
    year: "First Year",
    enrollmentNumber: "",
    interests: [],
    experience: "",
  });

  const departments = [
    "Computer Science",
    "Electronics",
    "Mechanical",
    "Civil",
    "Electrical",
    "Chemical",
    "Other",
  ];

  const years = ["First Year", "Second Year", "Third Year", "Fourth Year"];

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.phone ||
      !formData.rollNumber ||
      !formData.enrollmentNumber ||
      !formData.department
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
          department: "",
          year: "First Year",
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
                Department <span className="text-red-500">*</span>
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-input rounded-md bg-background"
                required
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
