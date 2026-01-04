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
    <Card className={`
      overflow-hidden transition-all duration-500 group
      hover:-translate-y-2 hover:shadow-2xl hover:border-primary/40
      border-2 border-border hover:border-primary/40
      before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/0 before:via-primary/5 before:to-primary/0 
      before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
    `} data-testid={`card-event-${id}`}>
      <div className="relative aspect-[16/10] overflow-hidden">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
        
        <Badge
          className={`
            absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-primary-foreground
            group-hover:scale-110 transition-transform duration-300
          `}
          data-testid={`badge-category-${id}`}
        >
          {category}
        </Badge>
      </div>
      <div className="p-6 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className={`
            text-xs transition-all duration-300
            group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105
          `} data-testid={`badge-club-${id}`}>
            {clubName}
          </Badge>
        </div>
        <h3 className={`
          text-xl font-semibold mb-2 line-clamp-2 transition-all duration-300
          group-hover:text-primary group-hover:scale-105 origin-left
        `} data-testid={`text-title-${id}`}>
          {title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 font-body group-hover:text-foreground/80 transition-colors duration-300" data-testid={`text-description-${id}`}>
          {description}
        </p>
        <div className="space-y-2 mb-4">
          <div className={`
            flex items-center gap-2 text-sm text-muted-foreground 
            group-hover:text-primary transition-colors duration-300
          `}>
            <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span data-testid={`text-date-${id}`}>{date}</span>
          </div>
          <div className={`
            flex items-center gap-2 text-sm text-muted-foreground 
            group-hover:text-primary transition-colors duration-300
          `}>
            <Clock className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span data-testid={`text-time-${id}`}>{time}</span>
          </div>
          <div className={`
            flex items-center gap-2 text-sm text-muted-foreground 
            group-hover:text-primary transition-colors duration-300
          `}>
            <MapPin className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span data-testid={`text-location-${id}`}>{location}</span>
          </div>
        </div>
        <Link href={`/events/${id}`}>
          <Button className={`
            w-full transition-all duration-300
            hover:scale-105 hover:shadow-lg active:scale-95
          `} variant="default" data-testid={`button-register-${id}`}>
            Register Now
          </Button>
        </Link>
      </div>
    </Card>
  );
}
