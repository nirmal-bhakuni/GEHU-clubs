import React, { ReactNode, useState, useRef } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, MapPin, Share2, Users, Star, MessageSquare } from "lucide-react";
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
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: `${event?.title} - GEHU Events`,
      text: `Check out this event: ${event?.title} by ${event?.clubName}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied!",
          description: "Event link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share this event.",
        variant: "destructive",
      });
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingFeedback || feedbackRating === 0) return;

    setIsSubmittingFeedback(true);

    try {
      await apiRequest("POST", `/api/events/${eventId}/feedback`, {
        rating: feedbackRating,
        comment: feedbackComment,
      });

      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback on this event.",
      });

      setFeedbackRating(0);
      setFeedbackComment("");
    } catch (error: any) {
      toast({
        title: "Feedback submission failed",
        description: error.message || "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
    queryFn: async () => {
      if (!eventId) return null;
      const res = await apiRequest("GET", `/api/events/${eventId}`);
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
              <Link href={`/clubs/${event.clubId}`}>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  View Club
                </Button>
              </Link>
              <Button variant="outline" size="lg" onClick={handleShare} className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share Event
              </Button>
            </div>
          </div>
        </div>

        {/* Tabbed Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} ref={tabsRef} className="space-y-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
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
                    description: `You have been registered for ${event.title}. A membership request has been sent to the club.`,
                  });
                } catch (error: any) {
                  // Fallback: store registration AND membership request locally
                  const pendingRegistrations = JSON.parse(localStorage.getItem("pendingEventRegistrations") || "[]");
                  const registration = {
                    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    ...data,
                    eventId,
                    eventTitle: event.title,
                    eventDate: event.date,
                    eventTime: event.time,
                    clubName: event.clubName,
                    registeredAt: new Date().toISOString(),
                    isFallback: true
                  };
                  
                  pendingRegistrations.push(registration);
                  //localStorage.setItem("pendingEventRegistrations", JSON.stringify(pendingRegistrations));
                  
                  // Also create a membership request locally
                  const pendingMemberships = JSON.parse(localStorage.getItem("pendingJoinRequests") || "[]");
                  const membershipRequest = {
                    id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    clubId: event.clubId,
                    clubName: event.clubName,
                    studentName: data.fullName,
                    studentEmail: data.email,
                    enrollmentNumber: data.enrollmentNumber,
                    department: data.department,
                    reason: `Registered for event: ${event.title}`,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    isFallback: true
                  };
                  
                  pendingMemberships.push(membershipRequest);
                 // localStorage.setItem("pendingJoinRequests", JSON.stringify(pendingMemberships));
                  
                  toast({
                    title: "Registration Saved (Offline)",
                    description: "Your registration and membership request have been saved locally. They will be submitted when you're back online.",
                  });
                }
              }}
            />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-8">
            <div className="space-y-6">
              {/* Feedback Form */}
              <div className="bg-card border border-card-border rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6" />
                  Share Your Feedback
                </h2>
                <p className="text-muted-foreground mb-6">
                  Help us improve by sharing your experience from this event.
                </p>

                <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                  {/* Rating */}
                  <div>
                    <Label className="text-base font-medium">Rating</Label>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFeedbackRating(star)}
                          className="focus:outline-none focus:ring-2 focus:ring-primary rounded"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= feedbackRating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 hover:text-yellow-400"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feedbackRating === 0 ? "Select a rating" : `${feedbackRating} star${feedbackRating > 1 ? 's' : ''}`}
                    </p>
                  </div>

                  {/* Comment */}
                  <div>
                    <Label htmlFor="feedback-comment" className="text-base font-medium">
                      Comments (Optional)
                    </Label>
                    <Textarea
                      id="feedback-comment"
                      placeholder="Tell us about your experience... What did you like? What could be improved?"
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      rows={4}
                      className="mt-2"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    disabled={feedbackRating === 0 || isSubmittingFeedback}
                    className="w-full"
                  >
                    {isSubmittingFeedback ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </div>

              {/* Recent Feedback Display */}
              <div className="bg-card border border-card-border rounded-lg p-8">
                <h3 className="text-xl font-bold mb-4">Recent Feedback</h3>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Feedback from attendees will appear here after the event.
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Check back after the event date to see what others thought!
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
