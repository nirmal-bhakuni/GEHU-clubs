import { Button } from "@/components/ui/button";
import { Calendar, Users } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

import heroImage from "@assets/stock_images/Gemini_Generated_Image_k07s30k07s30k07s_1.png";

export default function Hero() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <section className="relative w-full min-h-[640px] lg:min-h-[760px] flex items-center justify-center overflow-hidden group">
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="College students at campus event"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/8 via-black/4 to-black/10 group-hover:from-black/6 group-hover:via-black/3 transition-all duration-700" />
        
        {/* Interactive light effect that follows cursor */}
        <div 
          className="absolute w-96 h-96 rounded-full opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.3), transparent)',
            left: `${mousePosition.x - 192}px`,
            top: `${mousePosition.y - 192}px`,
            transition: 'all 0.1s ease-out'
          }}
        />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-8 text-center py-20 md:py-24">
        <div
          className={`inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/20 px-4 py-1.5 text-xs tracking-[0.16em] uppercase text-white/90 mb-6 transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
          style={{ animation: isVisible ? 'fade-in-up 0.65s ease-out 0.05s both' : 'none' }}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.85)]" />
          Campus Clubs Platform
        </div>

        <div className="mx-auto max-w-4xl rounded-3xl border border-white/15 bg-black/10 px-5 md:px-9 py-8 md:py-10 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
        <h1 
          className={`text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            animation: isVisible ? 'fade-in-up 0.8s ease-out 0.2s both' : 'none'
          }}
        >
          Discover Your Campus Community
        </h1>
        
        <p 
          className={`text-lg md:text-xl text-white/90 mb-9 max-w-2xl mx-auto leading-relaxed font-body transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            animation: isVisible ? 'fade-in-up 0.8s ease-out 0.4s both' : 'none'
          }}
        >
          Explore clubs, join events, and connect with students who share your passions. Your college experience starts here.
        </p>
        
        <div 
          className={`flex flex-col sm:flex-row gap-4 justify-center items-center transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{
            animation: isVisible ? 'fade-in-up 0.8s ease-out 0.6s both' : 'none'
          }}
        >
          <Link href="/clubs" data-testid="link-explore-clubs">
            <Button
              size="lg"
              variant="default"
              className="text-base group/btn relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/60 hover:scale-105"
              data-testid="button-explore-clubs"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Users className="w-5 h-5 group-hover/btn:scale-125 group-hover/btn:-rotate-12 transition-all duration-300" />
                Explore Clubs
              </span>
              {/* Background gradient effect */}
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)', animation: 'slide-in 0.4s ease-out' }}></div>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-lg border border-white/0 group-hover/btn:border-white/30 transition-all duration-300"></div>
            </Button>
          </Link>

          <Link href="/events" data-testid="link-view-events">
            <Button
              size="lg"
              variant="outline"
              className="text-base text-white border-white/40 hover:bg-white/10 hover:border-white/80 hover:shadow-2xl hover:scale-105 transition-all duration-300 group/btn relative overflow-hidden"
              data-testid="button-view-events"
            >
              <span className="relative z-10 flex items-center gap-2">
                <Calendar className="w-5 h-5 group-hover/btn:scale-125 group-hover/btn:rotate-12 transition-all duration-300" />
                View Events
              </span>
              {/* Expanding background */}
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-40 transition-opacity duration-500" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent)', animation: 'expand-pulse 0.6s ease-out' }}></div>
              {/* Border glow */}
              <div className="absolute inset-0 rounded-lg border border-white/20 group-hover/btn:border-white/60 transition-all duration-300"></div>
            </Button>
          </Link>
        </div>
        <div
          className={`mt-8 grid grid-cols-3 gap-3 max-w-xl mx-auto transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
          style={{ animation: isVisible ? 'fade-in-up 0.8s ease-out 0.78s both' : 'none' }}
        >
          <div className="rounded-xl border border-white/20 bg-black/18 py-3">
            <p className="text-white font-semibold text-base md:text-lg">30+</p>
            <p className="text-white/80 text-[11px] md:text-xs">Active Clubs</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-black/18 py-3">
            <p className="text-white font-semibold text-base md:text-lg">100+</p>
            <p className="text-white/80 text-[11px] md:text-xs">Events / Year</p>
          </div>
          <div className="rounded-xl border border-white/20 bg-black/18 py-3">
            <p className="text-white font-semibold text-base md:text-lg">2K+</p>
            <p className="text-white/80 text-[11px] md:text-xs">Student Members</p>
          </div>
        </div>
        </div>

        <div className="mt-8 text-white/70 text-xs tracking-[0.14em] uppercase">Scroll to explore</div>
        <div className="mx-auto mt-2 h-8 w-5 rounded-full border border-white/35 p-1">
          <div className="mx-auto h-2 w-1 rounded-full bg-white/80 animate-bounce" />
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(2rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-in {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes expand-pulse {
          0% { transform: scale(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
