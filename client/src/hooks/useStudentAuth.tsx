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
      // Try API first, fallback to static data based on stored session
      try {
        const res = await fetch("/api/student/me", { credentials: "include" });
        if (res.ok) return res.json();
      } catch (error) {
        // Check if we have a stored student session (simulate login state)
        const storedStudent = localStorage.getItem("currentStudent");
        if (storedStudent && staticStudents[storedStudent]) {
          return staticStudents[storedStudent];
        }
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