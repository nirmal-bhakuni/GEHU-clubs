import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useStudentAuth } from "@/hooks/useStudentAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  Trophy,
  LogOut,
  User,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";

export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { student, isAuthenticated, isLoading: authLoading } = useStudentAuth();
  const { toast } = useToast();

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/student/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/student/logout", {});
      await queryClient.invalidateQueries({ queryKey: ["/api/student/me"] });
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect
  }

  const upcomingEvents = events
    .filter(event => new Date(event.date) > new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <LayoutDashboard className="h-8 w-8 text-primary mr-3" />
              <h1 className="text-xl font-semibold">Student Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {student?.name}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-4">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "dashboard"
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4 inline mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "profile"
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <User className="h-4 w-4 inline mr-2" />
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("clubs")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "clubs"
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Users className="h-4 w-4 inline mr-2" />
                  Clubs
                </button>
                <button
                  onClick={() => setActiveTab("events")}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                    activeTab === "events"
                      ? "bg-primary text-primary-foreground"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Calendar className="h-4 w-4 inline mr-2" />
                  Events
                </button>
              </nav>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="p-6">
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{clubs.length}</p>
                        <p className="text-sm text-gray-600">Available Clubs</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-green-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">{events.length}</p>
                        <p className="text-sm text-gray-600">Total Events</p>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6">
                    <div className="flex items-center">
                      <Trophy className="h-8 w-8 text-yellow-500 mr-3" />
                      <div>
                        <p className="text-2xl font-bold">0</p>
                        <p className="text-sm text-gray-600">Achievements</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Upcoming Events */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">{event.title}</h4>
                            <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                            <p className="text-sm text-gray-600">{event.location}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600">No upcoming events</p>
                  )}
                </Card>
              </div>
            )}

            {activeTab === "profile" && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Student Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{student?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{student?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Enrollment</label>
                    <p className="mt-1 text-sm text-gray-900">{student?.enrollment}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Branch</label>
                    <p className="mt-1 text-sm text-gray-900">{student?.branch}</p>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "clubs" && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Available Clubs</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubs.map((club) => (
                    <div key={club.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium">{club.name}</h4>
                      <p className="text-sm text-gray-600">{club.description}</p>
                      <p className="text-sm text-gray-600">Members: {club.memberCount}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "events" && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">All Events</h3>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm text-gray-600">{event.date} at {event.time}</p>
                        <p className="text-sm text-gray-600">{event.location}</p>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}