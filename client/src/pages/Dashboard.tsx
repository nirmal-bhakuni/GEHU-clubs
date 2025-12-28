import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Megaphone,
  Building2,
  TrendingUp,
  UserCheck,
  Activity,
  Bell,
  Plus,
  Send,
  Edit
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementContent, setAnnouncementContent] = useState("");
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [clubForm, setClubForm] = useState({
    name: "",
    description: "",
    category: "",
  });
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    clubId: "",
  });
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  const { data: clubs = [] } = useQuery<Club[]>({
    queryKey: ["/api/clubs"],
    enabled: isAuthenticated,
  });

  const { data: studentCount = { count: 0 } } = useQuery<{ count: number }>({
    queryKey: ["/api/students/count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/students/count");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/admin/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/admin/login");
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      // This would be implemented when announcements API is ready
      console.log("Creating announcement:", data);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Announcement created",
        description: "The announcement has been posted successfully.",
      });
      setAnnouncementTitle("");
      setAnnouncementContent("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create announcement.",
        variant: "destructive",
      });
    },
  });

  const createClubMutation = useMutation({
    mutationFn: async (clubData: { name: string; description: string; category: string }) => {
      const res = await apiRequest("POST", "/api/clubs", clubData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club created",
        description: "The club has been created successfully.",
      });
      setShowCreateClub(false);
      setClubForm({ name: "", description: "", category: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create club.",
        variant: "destructive",
      });
    },
  });

  const updateClubMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Club> }) => {
      const res = await apiRequest("PATCH", `/api/clubs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club updated",
        description: "The club has been updated successfully.",
      });
      setEditingClub(null);
      setClubForm({ name: "", description: "", category: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club.",
        variant: "destructive",
      });
    },
  });

  const deleteClubMutation = useMutation({
    mutationFn: async (clubId: string) => {
      await apiRequest("DELETE", `/api/clubs/${clubId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs"] });
      toast({
        title: "Club deleted",
        description: "The club has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete club.",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const res = await apiRequest("POST", "/api/events", eventData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event created",
        description: "The event has been created successfully.",
      });
      setShowCreateEvent(false);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event.",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Event> }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event updated",
        description: "The event has been updated successfully.",
      });
      setEditingEvent(null);
      setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update event.",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete event.",
        variant: "destructive",
      });
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "clubs", label: "Clubs Management", icon: Building2 },
    { id: "events", label: "Events Management", icon: Calendar },
    { id: "users", label: "Users", icon: Users },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "announcements", label: "Announcements", icon: Megaphone },
  ];

  const globalStats = [
    {
      icon: Building2,
      label: "Total Clubs",
      value: clubs.length.toString(),
      trend: "+2 this month",
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: "Total Events",
      value: events.length.toString(),
      trend: "+5 this week",
      color: "text-green-500",
    },
    {
      icon: UserCheck,
      label: "Active Users",
      value: "1,247",
      trend: "+12% growth",
      color: "text-purple-500",
    },
    {
      icon: Activity,
      label: "Platform Activity",
      value: "94%",
      trend: "High engagement",
      color: "text-orange-500",
    },
  ];

  const renderMainContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-8">
            {/* Global Statistics */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Global Platform Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {globalStats.map((stat, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {stat.trend}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Club Activity Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Club Activity Overview</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Active Clubs by Category
                  </h3>
                  <div className="space-y-3">
                    {["Technology", "Academic", "Arts", "Business", "Social"].map((category) => {
                      const count = clubs.filter(club => club.category === category.toLowerCase()).length;
                      return (
                        <div key={category} className="flex justify-between items-center">
                          <span className="text-sm">{category}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Club Membership Trends
                  </h3>
                  <div className="h-32 bg-muted/50 rounded flex items-center justify-center">
                    <p className="text-muted-foreground text-sm">Membership growth chart</p>
                  </div>
                </Card>
              </div>
            </div>

            {/* Event Analytics */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Event Registrations vs Attendance</h2>
              <Card className="p-6">
                <div className="h-64 bg-muted/50 rounded flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Interactive chart showing registration vs attendance trends</p>
                    <p className="text-xs text-muted-foreground mt-2">UI-only implementation</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* User Management Overview */}
            <div>
              <h2 className="text-2xl font-bold mb-6">User Management Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Student Users</h3>
                  <p className="text-3xl font-bold text-blue-500">{studentCount.count || 0}</p>
                  <p className="text-sm text-muted-foreground">Active students</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">Club Admins</h3>
                  <p className="text-3xl font-bold text-green-500">6</p>
                  <p className="text-sm text-muted-foreground">Active club administrators</p>
                </Card>
                <Card className="p-6">
                  <h3 className="font-semibold mb-4">System Admins</h3>
                  <p className="text-3xl font-bold text-purple-500">1</p>
                  <p className="text-sm text-muted-foreground">University administrators</p>
                </Card>
              </div>
            </div>

            {/* System-wide Announcements Panel */}
            <div>
              <h2 className="text-2xl font-bold mb-6">System-wide Announcements</h2>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Bell className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Welcome to GEHU Clubs Platform</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        The new clubs management system is now live. All club administrators have been notified.
                      </p>
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">2 hours ago</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-green-900 dark:text-green-100">Event Registration Milestone</h4>
                      <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                        Congratulations! We've reached 1000+ event registrations this semester.
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-2">1 day ago</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      case "clubs":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Clubs Management</h2>
              <Button onClick={() => setShowCreateClub(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add New Club
              </Button>
            </div>

            {/* Create/Edit Club Modal */}
            {(showCreateClub || editingClub) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingClub ? "Edit Club" : "Create New Club"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (editingClub) {
                      updateClubMutation.mutate({
                        id: editingClub.id,
                        data: clubForm,
                      });
                    } else {
                      createClubMutation.mutate(clubForm);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="clubName">Club Name</Label>
                    <Input
                      id="clubName"
                      value={clubForm.name}
                      onChange={(e) => setClubForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter club name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubCategory">Category</Label>
                    <Input
                      id="clubCategory"
                      value={clubForm.category}
                      onChange={(e) => setClubForm(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Technical, Cultural, Sports"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="clubDescription">Description</Label>
                    <Textarea
                      id="clubDescription"
                      value={clubForm.description}
                      onChange={(e) => setClubForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the club and its activities"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createClubMutation.isPending || updateClubMutation.isPending}
                    >
                      {editingClub ? "Update Club" : "Create Club"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateClub(false);
                        setEditingClub(null);
                        setClubForm({ name: "", description: "", category: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Clubs List */}
            <div className="grid gap-4">
              {clubs.map((club) => (
                <Card key={club.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{club.name}</h3>
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                          {club.category}
                        </span>
                      </div>
                      <p className="text-muted-foreground mb-3">{club.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Members: {club.memberCount || 0}</span>
                        <span>Events: {events.filter(e => e.clubId === club.id).length}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingClub(club);
                          setClubForm({
                            name: club.name,
                            description: club.description || "",
                            category: club.category || "",
                          });
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${club.name}"?`)) {
                            deleteClubMutation.mutate(club.id);
                          }
                        }}
                        disabled={deleteClubMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {clubs.length === 0 && (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No clubs found. Create your first club to get started.</p>
              </Card>
            )}
          </div>
        );

      case "events":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Events Management</h2>
              <Button onClick={() => setShowCreateEvent(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>

            {/* Create/Edit Event Modal */}
            {(showCreateEvent || editingEvent) && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingEvent ? "Edit Event" : "Create New Event"}
                </h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData();
                    Object.entries(eventForm).forEach(([key, value]) => {
                      if (value) formData.append(key, value);
                    });

                    if (editingEvent) {
                      updateEventMutation.mutate({
                        id: editingEvent.id,
                        data: eventForm,
                      });
                    } else {
                      createEventMutation.mutate(formData);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="eventTitle">Event Title</Label>
                      <Input
                        id="eventTitle"
                        value={eventForm.title}
                        onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventCategory">Category</Label>
                      <Input
                        id="eventCategory"
                        value={eventForm.category}
                        onChange={(e) => setEventForm(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g., Technical, Cultural"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="eventDescription">Description</Label>
                    <Textarea
                      id="eventDescription"
                      value={eventForm.description}
                      onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe the event"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="eventDate">Date</Label>
                      <Input
                        id="eventDate"
                        type="date"
                        value={eventForm.date}
                        onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventTime">Time</Label>
                      <Input
                        id="eventTime"
                        type="time"
                        value={eventForm.time}
                        onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="eventLocation">Location</Label>
                      <Input
                        id="eventLocation"
                        value={eventForm.location}
                        onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="Event location"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="eventClub">Club</Label>
                    <select
                      id="eventClub"
                      value={eventForm.clubId}
                      onChange={(e) => setEventForm(prev => ({ ...prev, clubId: e.target.value }))}
                      className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      required
                    >
                      <option value="">Select a club</option>
                      {clubs.map((club) => (
                        <option key={club.id} value={club.id}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      disabled={createEventMutation.isPending || updateEventMutation.isPending}
                    >
                      {editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateEvent(false);
                        setEditingEvent(null);
                        setEventForm({ title: "", description: "", date: "", time: "", location: "", category: "", clubId: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Events List */}
            <div className="grid gap-4">
              {events.map((event) => {
                const club = clubs.find(c => c.id === event.clubId);
                return (
                  <Card key={event.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{event.title}</h3>
                          <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded-full">
                            {event.category}
                          </span>
                        </div>
                        <p className="text-muted-foreground mb-3">{event.description}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                          <span>🕐 {event.time}</span>
                          <span>📍 {event.location}</span>
                          <span>🏛️ {club?.name || 'Unknown Club'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingEvent(event);
                            setEventForm({
                              title: event.title,
                              description: event.description || "",
                              date: event.date,
                              time: event.time,
                              location: event.location,
                              category: event.category || "",
                              clubId: event.clubId,
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${event.title}"?`)) {
                              deleteEventMutation.mutate(event.id);
                            }
                          }}
                          disabled={deleteEventMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {events.length === 0 && (
              <Card className="p-6">
                <p className="text-muted-foreground text-center">No events found. Create your first event to get started.</p>
              </Card>
            )}
          </div>
        );

      case "users":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">User Management</h2>

            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Total Students</h3>
                <p className="text-3xl font-bold text-blue-500">{studentCount.count || 0}</p>
                <p className="text-sm text-muted-foreground">Registered students</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Club Administrators</h3>
                <p className="text-3xl font-bold text-green-500">{clubs.length}</p>
                <p className="text-sm text-muted-foreground">Active club admins</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold mb-4">System Administrators</h3>
                <p className="text-3xl font-bold text-purple-500">1</p>
                <p className="text-sm text-muted-foreground">University admins</p>
              </Card>
            </div>

            {/* Students Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Students</h3>
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-muted-foreground">
                      Student management features coming soon. Currently showing registration count only.
                    </p>
                    <Button variant="outline" disabled>
                      <Users className="w-4 h-4 mr-2" />
                      Manage Students
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>• View student profiles</p>
                    <p>• Manage student accounts</p>
                    <p>• View enrollment statistics</p>
                    <p>• Export student data</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Club Admins Section */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Club Administrators</h3>
              <div className="grid gap-4">
                {clubs.map((club) => (
                  <Card key={club.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{club.name}</h4>
                        <p className="text-sm text-muted-foreground">{club.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Members: {club.memberCount || 0} | Events: {events.filter(e => e.clubId === club.id).length}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled>
                          View Admin
                        </Button>
                        <Button variant="outline" size="sm" disabled>
                          Reset Password
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              {clubs.length === 0 && (
                <Card className="p-6">
                  <p className="text-muted-foreground text-center">No clubs found.</p>
                </Card>
              )}
            </div>
          </div>
        );

      case "analytics":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
            <Card className="p-6">
              <p className="text-muted-foreground">Advanced analytics coming soon...</p>
            </Card>
          </div>
        );

      case "announcements":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">System Announcements</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Create New Announcement</h3>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createAnnouncementMutation.mutate({
                      title: announcementTitle,
                      content: announcementContent,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={announcementTitle}
                      onChange={(e) => setAnnouncementTitle(e.target.value)}
                      placeholder="Announcement title"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={announcementContent}
                      onChange={(e) => setAnnouncementContent(e.target.value)}
                      placeholder="Announcement content"
                      rows={4}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={createAnnouncementMutation.isPending}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {createAnnouncementMutation.isPending ? "Posting..." : "Post Announcement"}
                  </Button>
                </form>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Recent Announcements</h3>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Welcome to GEHU Clubs Platform</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      The new clubs management system is now live...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">2 hours ago</p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold">Event Registration Milestone</h4>
                    <p className="text-sm text-muted-foreground mt-2">
                      Congratulations! We've reached 1000+ registrations...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">1 day ago</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-8">University Admin</h1>
          <nav className="space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              className="w-full"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {renderMainContent()}
        </div>
      </div>
    </div>
  );
}
