import { Users, Calendar, Award } from "lucide-react";

export default function StatsSection() {
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

  return (
    <section className="py-16 md:py-20 bg-card">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center p-8 rounded-xl hover-elevate transition-all duration-300"
              data-testid={`stat-${index}`}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-4xl font-bold mb-2" data-testid={`stat-value-${index}`}>
                {stat.value}
              </h3>
              <p className="text-muted-foreground font-body" data-testid={`stat-label-${index}`}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
