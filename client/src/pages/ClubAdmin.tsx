import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import EditEventForm from "@/components/EditEventForm";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Image, Users, Settings, Edit } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event, Club } from "@shared/schema";

export default function ClubAdmin() {
  const [, setLocation] = useLocation();
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [editingClub, setEditingClub] = useState(false);
  const { admin, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const { data: club, isLoading: clubLoading, error: clubError } = useQuery<Club | null>({
    queryKey: ["/api/clubs", admin?.clubId],
    queryFn: async () => {
      if (!admin?.clubId) return null;
      const res = await apiRequest("GET", `/api/clubs/${admin.clubId}`);
      return res.json();
    },
    enabled: !!admin?.clubId && isAuthenticated,
  });

  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    enabled: isAuthenticated,
  });

  // Filter events for this club
  const clubEvents = events.filter(event => event.clubId === admin?.clubId);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/club-admin/login");
    } else if (!authLoading && isAuthenticated && !admin?.clubId) {
      // If admin doesn't have a club, redirect to general dashboard or show message
      setLocation("/dashboard");
    }
  }, [authLoading, isAuthenticated, admin, setLocation]);

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

  const updateClubMutation = useMutation({
    mutationFn: async (updatedClub: Partial<Club>) => {
      if (!club?.id) throw new Error("No club ID");
      await apiRequest("PATCH", `/api/clubs/${club.id}`, updatedClub);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clubs", admin?.clubId] });
      setEditingClub(false);
      toast({
        title: "Club updated",
        description: "Club information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update club.",
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
      setLocation("/admin/login");
    },
  });

  if (authLoading || clubLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </div>
    );
  }

  if (clubError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">
            Error loading club information.
          </p>
          <p className="text-sm text-muted-foreground">
            Club ID: {admin?.clubId}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact administrator.
          </p>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-body mb-4">
            Club not found or access denied.
          </p>
          <p className="text-sm text-muted-foreground">
            Club ID: {admin?.clubId}
          </p>
          <p className="text-sm text-muted-foreground">
            Please contact administrator.
          </p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: Calendar,
      label: "Club Events",
      value: clubEvents.length.toString(),
      trend: "+12%",
    },
    {
      icon: Image,
      label: "Media Uploads",
      value: clubEvents.filter(event => event.imageUrl).length.toString(),
      trend: "+28%",
    },
    {
      icon: Users,
      label: "Members",
      value: club.memberCount?.toString() || "0",
      trend: "+18%",
    },
  ];

  return (
    <div className="min-h-screen py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {club.logoUrl && (
              <img
                src={club.logoUrl}
                alt={`${club.name} logo`}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {club.name} Admin Panel
              </h1>
              <p className="text-muted-foreground">
                Manage your club's events, content, and settings
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: <span className="font-medium">{admin?.username}</span>
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
          >
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stat.trend} from last month
                  </p>
                </div>
                <stat.icon className="h-8 w-8 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="uploads">Uploads</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Manage Events</h2>
              <Button onClick={() => setCreatingEvent(true)}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            <div className="grid gap-4">
              {clubEvents.map((event) => (
                <Card key={event.id} className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{event.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                      <p className="text-sm mt-2">{event.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingEventId(event.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(event.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="uploads" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Media Gallery</h2>
              <Button onClick={() => setCreatingEvent(true)}>
                <Image className="mr-2 h-4 w-4" />
                Upload New Image
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubEvents
                .filter(event => event.imageUrl)
                .map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-medium text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(event.date).toLocaleDateString()}
                    </p>
                  </Card>
                ))}
            </div>
            {clubEvents.filter(event => event.imageUrl).length === 0 && (
              <Card className="p-8 text-center">
                <Image className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No images uploaded yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Create an event with an image to see it here
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Club Members</h2>
              <Button>
                <Users className="mr-2 h-4 w-4" />
                Manage Members
              </Button>
            </div>
            <Card className="p-6">
              <p className="text-muted-foreground">
                Member management functionality coming soon...
              </p>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Club Settings</h2>
              <Button
                variant={editingClub ? "secondary" : "outline"}
                onClick={() => setEditingClub(!editingClub)}
              >
                <Settings className="mr-2 h-4 w-4" />
                {editingClub ? "Cancel" : "Edit Club"}
              </Button>
            </div>

            {editingClub ? (
              <Card className="p-6">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    updateClubMutation.mutate({
                      description: formData.get("description") as string,
                      category: formData.get("category") as string,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      defaultValue={club.description}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      name="category"
                      defaultValue={club.category}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={updateClubMutation.isPending}>
                    Update Club
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label>Club Logo</Label>
                    {club.logoUrl ? (
                      <img
                        src={club.logoUrl}
                        alt={`${club.name} logo`}
                        className="w-20 h-20 rounded-lg object-cover mt-2"
                      />
                    ) : (
                      <p className="text-muted-foreground">No logo uploaded</p>
                    )}
                  </div>
                  <div>
                    <Label>Club Name</Label>
                    <p className="text-foreground">{club.name}</p>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <p className="text-foreground">{club.description}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="text-foreground">{club.category}</p>
                  </div>
                  <div>
                    <Label>Members</Label>
                    <p className="text-foreground">{club.memberCount || 0}</p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {editingEventId && (
          <EditEventForm
            event={clubEvents.find((e) => e.id === editingEventId)}
            onClose={() => setEditingEventId(null)}
          />
        )}

        {creatingEvent && (
          <EditEventForm
            clubId={admin?.clubId || ""}
            onClose={() => setCreatingEvent(false)}
          />
        )}
      </div>
    </div>
  );
}