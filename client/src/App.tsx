import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { initializeSampleUsers } from "@/lib/userManager";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Sidebar from "@/components/Sidebar";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/student" component={StudentProfile} />
      <Route path="/student/login" component={StudentLogin} />
      <Route path="/student/signup" component={StudentSignup} />
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

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  return (
    <QueryClientProvider client={queryClient}>
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
                <Router />
              </main>
            </div>
            <Footer />
          </div>
          <Toaster />
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
