import { Users, Calendar, Award } from "lucide-react";
import { useState } from "react";

export default function StatsSection() {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const stats = [
    {
      icon: Users,
      value: "50+",
      label: "Active Clubs",
    },
    {
      icon: Calendar,
      value: "200+",
      label: "Events This Year",
    },
    {
      icon: Award,
      value: "3000+",
      label: "Active Members",
    },
  ];

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-background to-secondary/10 relative overflow-hidden">
      {/* Background accent elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="group relative flex flex-col items-center text-center p-8 rounded-2xl transition-all duration-300 cursor-pointer"
              onMouseEnter={() => setHoveredStat(index)}
              onMouseLeave={() => setHoveredStat(null)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              data-testid={`stat-${index}`}
            >
              {/* Gradient background that activates on hover */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              {/* Border glow effect */}
              <div className="absolute inset-0 rounded-2xl border border-primary/20 group-hover:border-primary/50 transition-all duration-300 opacity-0 group-hover:opacity-100"></div>

              {/* Light effect following cursor */}
              {hoveredStat === index && (
                <div
                  className="absolute w-32 h-32 rounded-full opacity-40 pointer-events-none"
                  style={{
                    background: "radial-gradient(circle, rgba(59,130,246,0.3), transparent)",
                    left: `${mousePos.x - 64}px`,
                    top: `${mousePos.y - 64}px`,
                    transition: "all 0.1s ease-out",
                  }}
                />
              )}

              {/* Icon container */}
              <div className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-lg group-hover:shadow-primary/30">
                <stat.icon className="w-10 h-10 text-primary group-hover:text-primary transition-all duration-300" />
                
                {/* Icon glow */}
                <div className="absolute inset-0 rounded-full bg-primary/10 opacity-0 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300"></div>
              </div>

              {/* Value with counter animation effect */}
              <h3 
                className="relative z-10 text-5xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors duration-300 group-hover:scale-110" 
                data-testid={`stat-value-${index}`}
                style={{
                  animation: hoveredStat === index ? `number-bounce 0.6s ease-out` : 'none'
                }}
              >
                {stat.value}
              </h3>

              {/* Label */}
              <p className="relative z-10 text-muted-foreground font-body text-sm md:text-base group-hover:text-foreground transition-colors duration-300" data-testid={`stat-label-${index}`}>
                {stat.label}
              </p>

              {/* Bottom accent line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-primary to-primary/50 group-hover:w-full transition-all duration-500 rounded-full"></div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes number-bounce {
          0% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.1) translateY(-4px); }
          100% { transform: scale(1) translateY(0); }
        }
      `}</style>
    </section>
  );
}
