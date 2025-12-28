import React, { ReactNode, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RegistrationForm from "@/components/RegistrationForm";
import ClubMembership from "@/components/ClubMembership";
import StudentReviews from "@/components/StudentReviews";
import ClubContact from "@/components/ClubContact";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Event } from "@shared/schema";

export default function EventDetail() {
  const params = useParams<{ id: string }>();
  const eventId = params?.id;
  const [activeTab, setActiveTab] = useState("overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    queryFn: async () => {
      const res = await fetch(`/api/events/${eventId}`);
      if (!res.ok) throw new Error("Event not found");
      return res.json();
    },
    enabled: !!eventId,
  });

  if (!eventId) {
    return (
      <div className="min-h-screen py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-muted-foreground">Event not found.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4">
          <p className="text-muted-foreground">Event not found.</p>
          <Link href="/events">
            <Button variant="outline">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 md:py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-8">
        {/* Back Button */}
        <Link href="/events">
          <Button variant="outline">
            Back to Events
          </Button>
        </Link>

        {/* Event Header */}
        <div className="bg-card border border-card-border rounded-lg overflow-hidden mb-8 mt-6">
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={event.imageUrl || "/api/placeholder/event.jpg"}
              alt={event.title}
              className="w-full h-full object-cover"
            />
            <Badge variant="default" className="absolute top-4 left-4">
              {event.category}
            </Badge>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="secondary">{event.clubName}</Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">{event.title}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="text-lg font-semibold">{event.date}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="text-lg font-semibold">{event.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="text-lg font-semibold">{event.location}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-8">
              <Button 
                size="lg" 
                className="flex-1 md:flex-none"
                onClick={() => {
                  setActiveTab("register");
                  tabsRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Register for this Event
              </Button>
              <Button variant="outline" size="lg">Share Event</Button>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} ref={tabsRef} className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="club-info">Club Info</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="bg-card border border-card-border rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">About This Event</h2>
              <p className="text-lg text-foreground leading-relaxed font-body">
                {event.description}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="register" className="space-y-8">
            <RegistrationForm
              eventTitle={event.title}
              eventDate={event.date}
              clubName={event.clubName}
              onSubmit={async (data) => {
                try {
                  await apiRequest("POST", `/api/events/${eventId}/register`, {
                    ...data,
                    eventId,
                    studentName: data.fullName,
                    studentEmail: data.email,
                  });
                  toast({
                    title: "Registration successful!",
                    description: `You have been registered for ${event.title}`,
                  });
                } catch (error: any) {
                  toast({
                    title: "Registration failed",
                    description: error.message || "Failed to register for the event",
                    variant: "destructive",
                  });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="club-info" className="space-y-8">
            <ClubMembership
              clubName={event.clubName}
              description={`Join ${event.clubName} to be part of a vibrant community of innovators and learners. This event is just the beginning of an amazing journey with us!`}
              memberCount={125}
              joinFee={0}
            />
            <ClubContact clubName={event.clubName} />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-8">
            <div className="bg-card border border-card-border rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-4">Student Feedback</h2>
              <p className="text-muted-foreground mb-6">Share your thoughts and experiences from this event.</p>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Feedback system coming soon. Check back after the event!</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
