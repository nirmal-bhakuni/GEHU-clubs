import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface Student {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  branch: string;
}

// Static student data for when API is not available
const staticStudents: Record<string, Student> = {
  "EN123456789": {
    id: "demo-student-1",
    name: "Demo Student",
    email: "student@example.com",
    enrollment: "EN123456789",
    branch: "Computer Science"
  }
};

export function useStudentAuth() {
  const { data: student, isLoading, error } = useQuery<Student | null>({
    queryKey: ["/api/student/me"],
    retry: false,
    queryFn: async () => {
      // Try API first
      try {
        const res = await fetch("/api/student/me", { credentials: "include" });
        if (res.ok) {
          const studentData = await res.json();
          // Store in localStorage for offline functionality
          localStorage.setItem("currentStudent", studentData.enrollment);
          return studentData;
        } else if (res.status === 401) {
          // Not authenticated - clear localStorage
          localStorage.removeItem("currentStudent");
          return null;
        }
      } catch (error) {
        // Network error - don't trust localStorage for authentication
        console.warn("Network error checking authentication");
      }
      return null;
    },
  });

  return {
    student,
    isAuthenticated: !!student,
    isLoading,
    error,
  };
}