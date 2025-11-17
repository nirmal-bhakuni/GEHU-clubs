import React from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import type { Club, Event } from "@shared/schema";

export default function ClubDetail() {
  const params = useParams<{ id: string }>();
  const id = params.id;

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
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <p className="text-sm text-muted-foreground">Category: {club.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/clubs"><Button variant="ghost">Back</Button></Link>
        </div>
      </div>

      <Card className="p-6 mb-6">
        <p className="text-muted-foreground">{club.description}</p>
        <div className="mt-4 text-sm text-muted-foreground">Members: {club.memberCount}</div>
      </Card>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Events by this club</h2>
        {eventsLoading ? (
          <div>Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-muted-foreground">No events for this club yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map((ev) => (
              <Card key={ev.id} className="p-4" data-testid={`club-event-${ev.id}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{ev.title}</h3>
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
      </section>
    </div>
  );
}
