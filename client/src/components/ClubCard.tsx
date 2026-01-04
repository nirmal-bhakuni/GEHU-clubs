import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "wouter";
import { Users, Heart, Share2, Star, TrendingUp, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClubCardProps {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  category: string;
  logoUrl?: string;
  coverImageUrl?: string;
}

export default function ClubCard({
  id,
  name,
  description,
  memberCount,
  category,
  logoUrl,
  coverImageUrl,
}: ClubCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();

  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    toast({
      title: isFavorited ? "Removed from favorites" : "Added to favorites",
      description: `${name} has been ${isFavorited ? "removed from" : "added to"} your favorites.`,
    });
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: `${name} - GEHU Clubs`,
      text: `Check out ${name} club at GEHU!`,
      url: window.location.origin + `/clubs/${id}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast({
          title: "Link copied!",
          description: "Club link has been copied to your clipboard.",
        });
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share this club.",
        variant: "destructive",
      });
    }
  };

  const getActivityLevel = () => {
    const count = memberCount || 0;
    if (count >= 100) return { level: "High", color: "text-green-600", icon: TrendingUp };
    if (count >= 50) return { level: "Medium", color: "text-yellow-600", icon: Star };
    return { level: "Growing", color: "text-blue-600", icon: Calendar };
  };

  const activity = getActivityLevel();
  const ActivityIcon = activity.icon;

  return (
    <TooltipProvider>
      <Link href={`/clubs/${id}`} className="block group" aria-label={`Open ${name} details`}>
        <Card
          className={`
            p-6 transition-all duration-500 h-full relative overflow-hidden
            hover:-translate-y-2 hover:shadow-2xl hover:border-primary/40
            border-2 border-border hover:border-primary/40
            before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/0 before:via-primary/5 before:to-primary/0 
            before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500
            ${isHovered ? 'shadow-2xl shadow-primary/20' : 'shadow-lg'}
          `}
          data-testid={`card-club-${id}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Cover Image Banner */}
          {coverImageUrl && (
            <div className="absolute top-0 left-0 right-0 h-16 overflow-hidden rounded-t-lg">
              <img
                src={coverImageUrl}
                alt={`${name} cover`}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
            </div>
          )}

          {/* Background gradient on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

          {/* Favorite and Share buttons */}
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white"
                  onClick={handleFavorite}
                >
                  <Heart className={`h-4 w-4 ${isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isFavorited ? "Remove from favorites" : "Add to favorites"}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 backdrop-blur-sm hover:bg-white"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4 text-gray-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share club</TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col items-center text-center relative z-10">
            {/* Club Logo */}
            <div className="relative mb-4 group/logo">
              <Avatar className={`
                w-20 h-20 ring-2 ring-primary/20 transition-all duration-500
                group-hover:ring-primary/40 group-hover:scale-110 group/logo:hover:scale-110
                group-hover:drop-shadow-lg
              `} data-testid={`avatar-club-${id}`}>
                <AvatarImage src={logoUrl} alt={name} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xl font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Activity indicator with pulse */}
              <div className={`
                absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white 
                flex items-center justify-center shadow-sm 
                group-hover:shadow-lg group-hover:scale-125 transition-all duration-300
                border-2 border-primary/30
              `}>
                <ActivityIcon className={`w-3 h-3 ${activity.color}`} />
              </div>
            </div>

            {/* Category Badge */}
            <Badge
              variant="secondary"
              className={`
                mb-3 transition-all duration-300 cursor-pointer
                group-hover:bg-primary group-hover:text-primary-foreground
                group-hover:scale-110 group-hover:shadow-lg
                hover:scale-125 active:scale-95
              `}
              data-testid={`badge-category-${id}`}
            >
              {category}
            </Badge>

            {/* Club Name */}
            <h3 className={`
              text-xl font-semibold mb-2 transition-all duration-300
              group-hover:text-primary group-hover:scale-110
            `} data-testid={`text-name-${id}`}>
              {name}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm mb-4 line-clamp-3 font-body leading-relaxed" data-testid={`text-description-${id}`}>
              {description}
            </p>

            {/* Member Count with Tooltip */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`
                  flex items-center justify-center gap-2 text-sm text-muted-foreground mt-auto 
                  group-hover:text-primary transition-all duration-300 
                  cursor-help group-hover:scale-105 w-full
                  bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg py-2.5 px-3
                  group-hover:bg-gradient-to-r group-hover:from-primary/15 group-hover:to-primary/20
                  border border-primary/10 group-hover:border-primary/30
                `} data-testid={`text-members-${id}`}>
                  <Users className="w-4 h-4 group-hover:scale-125 transition-transform duration-300 flex-shrink-0" />
                  <span className="font-semibold text-foreground">{(memberCount || 0).toLocaleString()} members</span>
                  <ActivityIcon className={`w-3.5 h-3.5 ${activity.color} group-hover:scale-125 transition-transform duration-300 flex-shrink-0`} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <p className="font-medium">{activity.level} Activity</p>
                  <p className="text-xs">Based on member count</p>
                </div>
              </TooltipContent>
            </Tooltip>

            {/* Quick Stats on Hover */}
            {isHovered && (
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border animate-in slide-in-from-bottom-2 duration-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center">
                    <Eye className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                    <span className="font-medium text-primary">View Details</span>
                  </div>
                  <div className="text-center">
                    <Star className="w-3 h-3 mx-auto mb-1 text-muted-foreground" />
                    <span className="font-medium text-primary">Join Club</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </TooltipProvider>
  );
}
