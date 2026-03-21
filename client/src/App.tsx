import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, Component, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeSampleUsers } from "@/lib/userManager";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import FloatingChat from "@/components/FloatingChat";
import Home from "@/pages/Home";
import Clubs from "@/pages/Clubs";
import ClubDetail from "@/pages/ClubDetail";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Dashboard from "@/pages/Dashboard";
import ClubAdmin from "@/pages/ClubAdmin";
import ClubAdminLogin from "@/pages/ClubAdminLogin";
import Login from "@/pages/Login";
import StudentLogin from "@/pages/StudentLogin";
import StudentSignup from "@/pages/StudentSignup";
import StudentDashboard from "@/pages/StudentDashboard";
import StudentProfile from "@/pages/StudentProfile";
import NotFound from "@/pages/not-found";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useAuth } from "@/hooks/useAuth";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/student" component={StudentProfile} />
      <Route path="/student-login" component={StudentLogin} />
      <Route path="/student/login" component={StudentLogin} />
      <Route path="/student-signup" component={StudentSignup} />
      <Route path="/student/signup" component={StudentSignup} />
      <Route path="/student-dashboard" component={StudentDashboard} />
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/admin/login" component={Login} />
      <Route path="/club-admin/login" component={ClubAdminLogin} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/club-admin" component={ClubAdmin} />
      <Route path="/clubs" component={Clubs} />
      <Route path="/clubs/:id" component={ClubDetail} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error?: Error }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error("App render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg text-center space-y-3">
            <h1 className="text-xl font-semibold">Something went wrong</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "Unexpected error while rendering the page."}
            </p>
            <button
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground"
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}

function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { isAuthenticated: isStudentAuthenticated, isLoading: studentAuthLoading } = useStudentAuth();
  const { admin, isAuthenticated: isAdminAuthenticated, isLoading: adminAuthLoading } = useAuth();

  useEffect(() => {
    // Initialize sample users on first app load
    initializeSampleUsers();
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setSidebarOpen(false);
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Keep student users pinned to student dashboard for this tab session until logout.
  useEffect(() => {
    if (studentAuthLoading) return;

    if (!isStudentAuthenticated) {
      sessionStorage.removeItem("studentDashboardLock");
      return;
    }

    if (sessionStorage.getItem("studentDashboardLock") !== "1") return;

    // Keep session sticky on app entry/auth routes, but do not block normal browsing.
    const stickyRedirectPaths = new Set([
      "/student-login",
      "/student/login",
      "/student-signup",
      "/student/signup",
    ]);

    if (stickyRedirectPaths.has(location)) {
      setLocation("/student/dashboard");
    }
  }, [studentAuthLoading, isStudentAuthenticated, location, setLocation]);

  // Resolve the shared /dashboard route to the correct dashboard by active login role.
  useEffect(() => {
    if (location !== "/dashboard") return;
    if (studentAuthLoading || adminAuthLoading) return;

    if (isStudentAuthenticated) {
      setLocation("/student/dashboard");
      return;
    }

    if (isAdminAuthenticated && admin?.clubId) {
      setLocation("/club-admin");
      return;
    }

    if (!isAdminAuthenticated) {
      setLocation("/admin/login");
    }
  }, [
    location,
    studentAuthLoading,
    adminAuthLoading,
    isStudentAuthenticated,
    isAdminAuthenticated,
    admin,
    setLocation,
  ]);

  return (
    <TooltipProvider>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
          <div className="flex flex-1">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1">
              <ErrorBoundary>
                <Router />
              </ErrorBoundary>
            </main>
          </div>
          <Footer />
          <FloatingChat />
        </div>
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
