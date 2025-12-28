import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface Student {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  branch: string;
}

export function useStudentAuth() {
  const { data: student, isLoading, error } = useQuery<Student | null>({
    queryKey: ["/api/student/me"],
    retry: false,
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return {
    student,
    isAuthenticated: !!student,
    isLoading,
    error,
  };
}