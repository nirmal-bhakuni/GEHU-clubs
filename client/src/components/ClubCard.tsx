import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ClubCardProps {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  logoUrl?: string;
}

export default function ClubCard({
  id,
  name,
  description,
  memberCount,
  category,
  logoUrl,
}: ClubCardProps) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card className="p-8 hover-elevate transition-all duration-300 hover:-translate-y-1 h-full" data-testid={`card-club-${id}`}>
      <div className="flex flex-col items-center text-center">
        <Avatar className="w-20 h-20 mb-4" data-testid={`avatar-club-${id}`}>
          <AvatarImage src={logoUrl} alt={name} />
          <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <Badge variant="secondary" className="mb-3" data-testid={`badge-category-${id}`}>
          {category}
        </Badge>
        <h3 className="text-xl font-semibold mb-2" data-testid={`text-name-${id}`}>
          {name}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3 font-body" data-testid={`text-description-${id}`}>
          {description}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto" data-testid={`text-members-${id}`}>
          <Users className="w-4 h-4" />
          <span>{memberCount} members</span>
        </div>
      </div>
    </Card>
  );
}
