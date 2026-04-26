import { Switch, Route, useLocation } from "wouter";
import { useEffect, useState, Component, Suspense, lazy, type ReactNode } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeSampleUsers } from "@/lib/userManager";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { useAuth } from "@/hooks/useAuth";

const FloatingChat = lazy(() => import("@/components/FloatingChat"));
const Home = lazy(() => import("@/pages/Home"));
const Clubs = lazy(() => import("@/pages/Clubs"));
const ClubDetail = lazy(() => import("@/pages/ClubDetail"));
const Events = lazy(() => import("@/pages/Events"));
const EventDetail = lazy(() => import("@/pages/EventDetail"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const ClubAdmin = lazy(() => import("@/pages/ClubAdmin"));
const ClubAdminLogin = lazy(() => import("@/pages/ClubAdminLogin"));
const ClubAdminForgotPassword = lazy(() => import("@/pages/ClubAdminForgotPassword"));
const Login = lazy(() => import("@/pages/Login"));
const StudentLogin = lazy(() => import("@/pages/StudentLogin"));
const StudentForgotPassword = lazy(() => import("@/pages/StudentForgotPassword"));
const StudentSignup = lazy(() => import("@/pages/StudentSignup"));
const StudentDashboard = lazy(() => import("@/pages/StudentDashboard"));
const StudentProfile = lazy(() => import("@/pages/StudentProfile"));
const FacultyRegister = lazy(() => import("@/pages/FacultyRegister"));
const FacultyLogin = lazy(() => import("@/pages/FacultyLogin"));
const FacultyDashboard = lazy(() => import("@/pages/FacultyDashboard"));
const AdminFacultyDashboard = lazy(() => import("@/pages/AdminFacultyDashboard"));
const DriveSubmission = lazy(() => import("@/pages/DriveSubmission"));
const NotFound = lazy(() => import("@/pages/not-found"));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  );
}

const Router = () => (
  <Switch>
    <Route path="/" component={Home} />
    <Route path="/student" component={StudentProfile} />
    <Route path="/student-login" component={StudentLogin} />
    <Route path="/student/login" component={StudentLogin} />
    <Route path="/student/forgot-password" component={StudentForgotPassword} />
    <Route path="/student-signup" component={StudentSignup} />
    <Route path="/student/signup" component={StudentSignup} />
    <Route path="/student-dashboard" component={StudentDashboard} />
    <Route path="/student/dashboard" component={StudentDashboard} />
    <Route path="/faculty/register" component={FacultyRegister} />
    <Route path="/faculty/login" component={FacultyLogin} />
    <Route path="/faculty/dashboard" component={FacultyDashboard} />
    <Route path="/admin/faculty" component={AdminFacultyDashboard} />
    <Route path="/drive/:driveId/submit" component={DriveSubmission} />
    <Route path="/admin/login" component={Login} />
    <Route path="/club-admin/login" component={ClubAdminLogin} />
    <Route path="/club-admin/forgot-password" component={ClubAdminForgotPassword} />
    <Route path="/dashboard" component={Dashboard} />
    <Route path="/club-admin" component={ClubAdmin} />
    <Route path="/clubs" component={Clubs} />
    <Route path="/clubs/:id" component={ClubDetail} />
    <Route path="/events" component={Events} />
    <Route path="/events/:id" component={EventDetail} />
    <Route component={NotFound} />
  </Switch>
);

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
        <div className="app-ambient-bg flex min-h-screen flex-col">
          <Navbar
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
          <div className="flex flex-1">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <main className="flex-1">
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <Router />
                </Suspense>
              </ErrorBoundary>
            </main>
          </div>
          <Footer />
          <ScrollToTopButton />
          <Suspense fallback={null}>
            <FloatingChat />
          </Suspense>
        </div>
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  );
}

export default App;
