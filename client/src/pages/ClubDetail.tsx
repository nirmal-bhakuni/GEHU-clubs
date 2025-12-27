import React, { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Calendar, Star, BookOpen, Award } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Club, Event } from "@shared/schema";

export default function ClubDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinForm, setJoinForm] = useState({
    name: '',
    email: '',
    department: '',
    reason: ''
  });
  const { toast } = useToast();

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // UI-only: show success message
    toast({
      title: "Join Request Submitted",
      description: "Your request to join has been submitted and is pending approval.",
    });
    setIsJoinModalOpen(false);
    setJoinForm({ name: '', email: '', department: '', reason: '' });
  };

  const { data: club, isLoading: clubLoading } = useQuery<Club | null>({
    queryKey: ["/api/clubs", id],
    queryFn: async () => {
      const res = await fetch(`/api/clubs/${id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!id,
  });

  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", { clubId: id }],
    queryFn: async () => {
      const res = await fetch(`/api/events?clubId=${id}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!id,
  });

  if (clubLoading) return <div className="p-8">Loading club...</div>;
  if (!club) return <div className="p-8">Club not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      {/* Club Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarFallback className="text-2xl">{club.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{club.name}</h1>
              <Badge variant="secondary">{club.category}</Badge>
            </div>
            <p className="text-muted-foreground mb-4">{club.description}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {club.memberCount} members
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Dialog open={isJoinModalOpen} onOpenChange={setIsJoinModalOpen}>
              <DialogTrigger asChild>
                <Button>Join Club</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join {club.name}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={joinForm.name}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={joinForm.email}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, email: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={joinForm.department}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, department: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Why do you want to join?</Label>
                    <Textarea
                      id="reason"
                      value={joinForm.reason}
                      onChange={(e) => setJoinForm(prev => ({ ...prev, reason: e.target.value }))}
                      rows={3}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">Submit Join Request</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Link href="/clubs">
              <Button variant="ghost">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="leadership">Leadership</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">About {club.name}</h3>
            <p className="text-muted-foreground">{club.description}</p>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Latest Announcements</h3>
            <p className="text-muted-foreground">Stay updated with the latest news and updates from {club.name}.</p>
            <p className="text-sm text-muted-foreground mt-2">No announcements at the moment.</p>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Club Events</h3>
            {eventsLoading ? (
              <div>Loading events...</div>
            ) : events.length === 0 ? (
              <Card className="p-6">
                <p className="text-muted-foreground">No events for this club yet.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {events.map((ev) => (
                  <Card key={ev.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{ev.title}</h4>
                        <div className="text-sm text-muted-foreground">{ev.date} • {ev.time}</div>
                      </div>
                      <Link href={`/events/${ev.id}`}>
                        <Button variant="outline">View</Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="leadership" className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold mb-4">Leadership Team</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarFallback>P</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">President</h4>
                <p className="text-sm text-muted-foreground">John Doe</p>
              </Card>
              <Card className="p-4 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarFallback>VP</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">Vice President</h4>
                <p className="text-sm text-muted-foreground">Jane Smith</p>
              </Card>
              <Card className="p-4 text-center">
                <Avatar className="w-16 h-16 mx-auto mb-3">
                  <AvatarFallback>CM</AvatarFallback>
                </Avatar>
                <h4 className="font-semibold">Core Members</h4>
                <p className="text-sm text-muted-foreground">5 active members</p>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="about" className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">About & Testimonials</h3>
            <p className="text-muted-foreground mb-4">{club.description}</p>
            <h4 className="font-semibold mb-2">Testimonials</h4>
            <p className="text-muted-foreground">What members say about us.</p>
            <p className="text-sm text-muted-foreground mt-2">"This club has been an amazing experience!" - Anonymous Member</p>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
