import { useQuery } from "@tanstack/react-query";

interface Teacher {
  id: string;
  username: string;
  fullName?: string;
  email?: string;
  department?: string;
  designation?: string;
  lastLogin?: string;
}

export function useTeacherAuth() {
  const { data: teacher, isLoading, error } = useQuery<Teacher | null>({
    queryKey: ["/api/teacher/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/teacher/auth/me", { credentials: "include" });
        if (res.ok) {
          return await res.json();
        }

        if (res.status === 401 || res.status === 403) {
          return null;
        }
      } catch (error) {
        console.error("Teacher auth error:", error);
      }

      return null;
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return {
    teacher,
    isAuthenticated: !!teacher,
    isLoading,
    error,
  };
}
