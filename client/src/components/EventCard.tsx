import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin } from "lucide-react";
import { Link } from "wouter";

interface EventCardProps {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  clubName: string;
  category: string;
  imageUrl: string;
}

export default function EventCard({
  title,
  description,
  date,
  time,
  location,
  clubName,
  category,
  imageUrl,
  id,
}: EventCardProps) {
  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-300 hover:-translate-y-1" data-testid={`card-event-${id}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
        <Badge
          className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground"
          data-testid={`badge-category-${id}`}
        >
          {category}
        </Badge>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs" data-testid={`badge-club-${id}`}>
            {clubName}
          </Badge>
        </div>
        <h3 className="text-xl font-semibold mb-2 line-clamp-2" data-testid={`text-title-${id}`}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 font-body" data-testid={`text-description-${id}`}>
          {description}
        </p>
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span data-testid={`text-date-${id}`}>{date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span data-testid={`text-time-${id}`}>{time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span data-testid={`text-location-${id}`}>{location}</span>
          </div>
        </div>
        <Link href={`/events/${id}`}>
          <Button className="w-full" variant="default" data-testid={`button-register-${id}`}>
            Register Now
          </Button>
        </Link>
      </div>
    </Card>
  );
}
