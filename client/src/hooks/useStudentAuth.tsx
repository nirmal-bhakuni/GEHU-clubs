import { useQuery } from "@tanstack/react-query";

interface Student {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  branch: string;
}

export function useStudentAuth() {
  const { data: student, isLoading, error } = useQuery<Student>({
    queryKey: ["/api/student/me"],
    retry: false,
  });

  return {
    student,
    isAuthenticated: !!student,
    isLoading,
    error,
  };
}