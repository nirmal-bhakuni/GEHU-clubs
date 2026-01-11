import { useQuery } from "@tanstack/react-query";

interface Admin {
  id: string;
  username: string;
  clubId: string | null;
}

// Static admin data for when API is not available
const staticAdmins: Record<string, Admin> = {
  "admin": {
    id: "admin-1",
    username: "admin",
    clubId: null // University admin
  },
  "aryavrat_admin": {
    id: "admin-2",
    username: "aryavrat_admin",
    clubId: "484c2b24-6193-42c1-879b-185457a9598f"
  },
  "rangmanch_admin": {
    id: "admin-3",
    username: "rangmanch_admin",
    clubId: "ff82f1ca-01be-4bff-b0f5-8a1e44dcf951"
  },
  "ieee_admin": {
    id: "admin-4",
    username: "ieee_admin",
    clubId: "f54a2526-787b-4de5-9582-0a42f4aaa61b"
  },
  "papertech_admin": {
    id: "admin-5",
    username: "papertech_admin",
    clubId: "181d3e7d-d6cd-4f40-b712-7182fcd77154"
  },
  "entrepreneurship_admin": {
    id: "admin-6",
    username: "entrepreneurship_admin",
    clubId: "cc71501e-1525-4e3b-959c-f3874db96396"
  },
  "codehunters_admin": {
    id: "admin-7",
    username: "codehunters_admin",
    clubId: "485300f0-e4cc-4116-aa49-d60dd19070d8"
  }
};

export function useAuth() {
  const { data: admin, isLoading, error } = useQuery<Admin | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          // Cache in localStorage for offline support
          if (data && data.id) {
            localStorage.setItem("adminCache", JSON.stringify(data));
          }
          return data;
        }
      } catch (error) {
        console.error("Auth error:", error);
      }
      
      // Try to restore from localStorage cache if available
      try {
        const cached = localStorage.getItem("adminCache");
        if (cached) {
          const adminData = JSON.parse(cached);
          console.log("Using cached admin data:", adminData);
          return adminData;
        }
      } catch (e) {
        // Cache is invalid
      }
      
      return null;
    },
    retry: false,
    staleTime: Infinity,
  });

  return {
    admin,
    isAuthenticated: !!admin,
    isLoading,
    error,
  };
}
