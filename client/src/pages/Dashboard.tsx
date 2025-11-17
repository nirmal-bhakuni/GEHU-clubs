import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import UploadForm from "@/components/UploadForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Image, TrendingUp, Users } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
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

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      setLocation("/login");
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const stats = [
    {
      icon: Calendar,
      label: "Total Events",
      value: events.length.toString(),
      trend: "+12%",
    },
    {
      icon: Image,
      label: "Media Uploads",
      value: "156",
      trend: "+28%",
    },
    {
      icon: Users,
      label: "Registrations",
      value: "892",
      trend: "+18%",
    },
    {
      icon: TrendingUp,
      label: "Engagement",
      value: "94%",
      trend: "+5%",
    },
  ];

  return (
    <div className="min-h-screen py-16 md:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground font-body">
              Welcome back, {admin?.username}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            data-testid="button-logout"
          >
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6" data-testid={`stat-card-${index}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-green-500 font-medium">
                  {stat.trend}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-2xl font-bold" data-testid={`stat-value-${index}`}>
                {stat.value}
              </p>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="create" className="space-y-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="create" data-testid="tab-create-event">
              Create Event
            </TabsTrigger>
            <TabsTrigger value="manage" data-testid="tab-manage-events">
              Manage Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <UploadForm />
          </TabsContent>

          <TabsContent value="manage">
            <Card className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Your Events</h2>
              {events.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-muted-foreground font-body">
                    No events created yet. Create your first event!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <div
                      key={event.id}
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded-lg hover-elevate"
                      data-testid={`event-item-${event.id}`}
                    >
                      <div className="flex-1 mb-4 md:mb-0">
                        <h3 className="font-semibold text-lg mb-1" data-testid={`event-title-${event.id}`}>
                          {event.title}
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                          <span data-testid={`event-date-${event.id}`}>{event.date}</span>
                          <span data-testid={`event-club-${event.id}`}>{event.clubName}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setEditingEventId(event.id)}
                          data-testid={`button-edit-${event.id}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => deleteMutation.mutate(event.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${event.id}`}
                        >
                          {deleteMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
