import { Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newsletterEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Welcome to GEHU Clubs! 🎉",
        description: "Thank you for subscribing! Check your email for confirmation.",
      });

      setNewsletterEmail("");
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "Please try again later or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-card border-t border-card-border">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">About</h3>
            <p className="text-sm text-muted-foreground font-body leading-relaxed">
              GEHU Clubs connects students with organizations and events that matter. Build your college experience.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/clubs"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate rounded px-1 py-0.5 -ml-1"
                  data-testid="link-footer-clubs"
                >
                  Browse Clubs
                </Link>
              </li>

              <li>
                <Link
                  href="/events"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate rounded px-1 py-0.5 -ml-1"
                  data-testid="link-footer-events"
                >
                  Upcoming Events
                </Link>
              </li>

              <li>
                <Link
                  href="/dashboard"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors hover-elevate rounded px-1 py-0.5 -ml-1"
                  data-testid="link-footer-dashboard"
                >
                  Admin Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Student Activities Office</li>
              <li>Gehuclubs@gmail.com</li>
              <li>(555) 123-4567</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-4">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-3 font-body">
              Get updates on new events and clubs.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <Input
                type="email"
                placeholder="Your email"
                className="text-sm"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                data-testid="input-newsletter-email"
              />
              <Button
                type="submit"
                variant="default"
                size="sm"
                className="w-full"
                disabled={isSubmitting}
                data-testid="button-newsletter-subscribe"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Subscribing...
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    Subscribe
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 GEHU Clubs. All rights reserved.
          </p>
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" data-testid="button-social-facebook">
              <Facebook className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-social-twitter">
              <Twitter className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-social-instagram">
              <Instagram className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="ghost" data-testid="button-social-linkedin">
              <Linkedin className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </footer>
  );
}
