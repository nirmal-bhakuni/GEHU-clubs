import { useQuery } from "@tanstack/react-query";

interface Admin {
  id: string;
  username: string;
  clubId: string | null;
}

export function useAuth() {
  const { data: admin, isLoading, error } = useQuery<Admin>({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    error,
  };
}
