import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  Award,
  BookOpen,
  Zap,
  Users,
  LogOut,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Star,
  AlertCircle,
} from "lucide-react";
import { useLocation } from "wouter";
import { getCurrentUserProfile, logoutUser } from "@/lib/userManager";
import type { UserProfile, Achievement, Certificate, JoinedClub, Award as StudentAward } from "@/lib/userManager";

export default function StudentProfile() {
  const [, navigate] = useLocation();
  const [studentData, setStudentData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the logged-in student's profile from userManager
    const profile = getCurrentUserProfile();
    
    if (!profile) {
      setError("No student logged in. Please login first.");
      setLoading(false);
      return;
    }

    // Profile loaded successfully
    setStudentData(profile);
    setLoading(false);
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("studentId");
    navigate("/");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8">
          <p className="text-lg font-semibold">Loading profile...</p>
        </Card>
      </div>
    );
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center">
        <Card className="p-8 max-w-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-destructive mt-1 flex-shrink-0" />
            <div>
              <p className="text-lg font-semibold text-destructive mb-2">Error</p>
              <p className="text-muted-foreground mb-4">
                {error || "Failed to load profile"}
              </p>
              <Button onClick={() => navigate("/")} variant="outline">
                Go to Home
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24">
                <AvatarFallback className="text-xl bg-primary/20">
                  {studentData.name.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{studentData.name}</h1>
                  <Badge variant="outline">{studentData.studentId}</Badge>
                </div>
                <p className="text-muted-foreground mb-4">{studentData.bio}</p>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <a href={`mailto:${studentData.email}`} className="text-primary hover:underline">
                      {studentData.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{studentData.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    <span>{studentData.major}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>Joined {studentData.joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            <Button variant="destructive" className="gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-12">
        {/* Welcome Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Welcome, {studentData.name}!</h2>
          <p className="text-muted-foreground">Here's an overview of your club activities and achievements.</p>
        </section>

        {/* Points & Rank Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Points & Rank</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Ranking</p>
                  <p className="text-4xl font-bold">#{studentData.ranking}</p>
                </div>
                <Trophy className="w-12 h-12 text-primary/30" />
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Total Points</p>
                  <p className="text-4xl font-bold">{studentData.totalPoints}</p>
                </div>
                <Zap className="w-12 h-12 text-yellow-500/30" />
              </div>
            </Card>
          </div>
        </section>

        {/* My Clubs Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">My Clubs</h2>
          {studentData.clubs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studentData.clubs.map((club: JoinedClub) => (
                <Card
                  key={club.id}
                  className="p-4 hover:shadow-lg transition-shadow hover:border-primary/50"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={club.logoUrl} />
                      <AvatarFallback>{club.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{club.name}</h3>
                      <Badge variant="outline" className="text-xs mt-1">
                        {club.role}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Joined {club.joinedDate}
                  </p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground">No clubs joined yet. Explore clubs to get started!</p>
            </Card>
          )}
        </section>

        {/* My Events Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">My Events</h2>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Events you've registered for will appear here.</p>
            <p className="text-sm text-muted-foreground mt-2">Feature coming soon - track your event participation and history.</p>
          </Card>
        </section>

        {/* Skills Earned Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Skills Earned</h2>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Skills developed through club activities.</p>
            <p className="text-sm text-muted-foreground mt-2">Coming soon: Leadership, Communication, Teamwork, etc.</p>
          </Card>
        </section>

        {/* Badges Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Badges</h2>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Earn badges for achievements and milestones.</p>
            <p className="text-sm text-muted-foreground mt-2">Badges will be awarded based on your club participation.</p>
          </Card>
        </section>

        {/* Notifications Section */}
        <section>
          <h2 className="text-2xl font-bold mb-6">Notifications</h2>
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">Stay updated with club announcements and reminders.</p>
            <p className="text-sm text-muted-foreground mt-2">Notifications for upcoming events and important updates.</p>
          </Card>
        </section>

        {/* Existing Achievements Section */}
        {studentData.achievements.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Star className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Achievements</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studentData.achievements.map((achievement) => (
                <Card key={achievement.id} className="p-4 hover:shadow-lg transition-shadow">
                  <div className="text-2xl mb-2">{achievement.icon}</div>
                  <h3 className="font-semibold mb-1">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {achievement.description}
                  </p>
                  <p className="text-xs text-muted-foreground">{achievement.date}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Certificates Section */}
        {studentData.certificates.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Certificates</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studentData.certificates.map((cert: Certificate) => (
                <Card
                  key={cert.id}
                  className="p-4 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{cert.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{cert.issuer}</p>
                  <p className="text-xs text-muted-foreground">{cert.date}</p>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Awards Section */}
        {studentData.awards.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Awards</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {studentData.awards.map((award: StudentAward) => (
                <Card
                  key={award.id}
                  className="p-4 border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-semibold mb-2">{award.title}</h3>
                  <Badge className="mb-3 bg-primary/20 text-primary hover:bg-primary/20">
                    {award.category}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{award.date}</p>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
