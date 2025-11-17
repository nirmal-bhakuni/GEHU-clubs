import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { Link } from "wouter";
import heroImage from "@assets/stock_images/college_students_at__ee69440f.jpg";

export default function Hero() {
  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="College students at campus event"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 text-center py-20">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6">
          Discover Your Campus Community
        </h1>
        <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed font-body">
          Explore clubs, join events, and connect with students who share your passions. Your college experience starts here.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/clubs" data-testid="link-explore-clubs">
            <Button
              size="lg"
              variant="default"
              className="text-base"
              data-testid="button-explore-clubs"
            >
              <Users className="w-5 h-5 mr-2" />
              Explore Clubs
            </Button>
          </Link>

          <Link href="/events" data-testid="link-view-events">
            <Button
              size="lg"
              variant="outline"
              className="text-base text-white border-white/40 hover:bg-white/10"
              data-testid="button-view-events"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Events
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
