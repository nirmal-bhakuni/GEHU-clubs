/** @jsxImportSource react */
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  MessageCircle,
  Phone,
  AlertCircle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Users,
} from "lucide-react";

interface ClubLeader {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface ClubContactProps {
  clubName: string;
  leaders?: ClubLeader[];
  clubEmail?: string;
  clubPhone?: string;
}

const defaultLeaders: ClubLeader[] = [
  {
    id: "1",
    name: "Aman Verma",
    role: "Club President",
    email: "aman.verma@gehu.ac.in",
    phone: "+91-98765-43210",
  },
  {
    id: "2",
    name: "Divya Singh",
    role: "Vice President",
    email: "divya.singh@gehu.ac.in",
    phone: "+91-98765-43211",
  },
];

export default function ClubContact({
  clubName,
  leaders = defaultLeaders,
  clubEmail = "contact@club.gehu.ac.in",
  clubPhone = "+91-0120-XXXX-XXX",
}: ClubContactProps) {
  const [messageState, setMessageState] = useState<
    "form" | "sending" | "success" | "error"
  >("form");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !contactForm.name ||
      !contactForm.email ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      alert("Please fill in all fields");
      return;
    }

    setMessageState("sending");

    // Simulate sending message
    setTimeout(() => {
      setMessageState("success");
      setContactForm({
        name: "",
        email: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setMessageState("form");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Main Contact Cards */}
      <div className="grid grid-cols-1 gap-4">
        {/* Email Card - match other tabs */}
        <Card className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-muted/50">
              <Mail className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">Email {clubName}</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Official club email for inquiries and coordination
                </p>
                <div className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border w-full">
                  <a
                    href={`mailto:${clubEmail}`}
                    className="text-foreground text-sm hover:underline font-semibold flex-1 break-all"
                  >
                    {clubEmail}
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyEmail(clubEmail)} className="flex-shrink-0">
                    {copiedEmail === clubEmail ? (
                      <CheckCircle2 className="w-4 h-4 text-foreground" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" asChild className="flex-shrink-0">
                    <a href={`mailto:${clubEmail}`}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ✓ Response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Phone Card - match other tabs */}
        <Card className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-muted/50">
              <Phone className="w-6 h-6 text-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg mb-2">Call Us</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Reach us directly for urgent matters
                </p>
                <div className="flex items-center gap-3 bg-card p-4 rounded-lg border border-border w-full">
                  <a
                    href={`tel:${clubPhone}`}
                    className="text-foreground text-sm hover:underline font-semibold flex-1"
                  >
                    {clubPhone}
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => handleCopyEmail(clubPhone)} className="flex-shrink-0">
                    {copiedEmail === clubPhone ? (
                      <CheckCircle2 className="w-4 h-4 text-foreground" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" variant="ghost" asChild className="flex-shrink-0">
                    <a href={`tel:${clubPhone}`}>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  ✓ Hours: Mon-Fri, 10 AM - 5 PM IST
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Club Leaders */}
      <Card className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-foreground" />
          Meet Our Leadership Team
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {leaders.map((leader) => (
            <div
              key={leader.id}
              className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
            >
              <div className="flex flex-col items-center text-center gap-3">
                <Avatar className="w-12 h-12 flex-shrink-0">
                  <AvatarImage src={leader.avatar} className="object-cover rounded-full" />
                  <AvatarFallback className="flex items-center justify-center w-full h-full rounded-full bg-primary/10 text-primary font-bold text-base leading-none">
                    {leader.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{leader.name}</p>
                  <p className="text-xs text-muted-foreground mt-1 truncate">{leader.role}</p>
                </div>

                <div className="w-full mt-2 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <a
                      href={`mailto:${leader.email}`}
                      className="text-primary hover:underline truncate text-sm"
                    >
                      {leader.email}
                    </a>
                    <button
                      onClick={() => handleCopyEmail(leader.email)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                      aria-label={`Copy ${leader.email}`}
                    >
                      {copiedEmail === leader.email ? (
                        <CheckCircle2 className="w-4 h-4 text-foreground" />
                      ) : (
                        <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      )}
                    </button>
                  </div>

                  {leader.phone && (
                    <div className="flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <a
                        href={`tel:${leader.phone}`}
                        className="text-primary hover:underline truncate text-sm"
                      >
                        {leader.phone}
                      </a>
                      <button
                        onClick={() => handleCopyEmail(leader.phone!)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                        aria-label={`Copy ${leader.phone}`}
                      >
                        {copiedEmail === leader.phone ? (
                          <CheckCircle2 className="w-4 h-4 text-foreground" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground hover:text-primary" />
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact Form */}
      <Card className="p-6 border-2">
        <div className="flex items-center gap-2 mb-6">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold">Send us a Direct Message</h3>
        </div>

        {messageState === "success" && (
          <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-green-900">Message Sent!</p>
              <p className="text-sm text-green-800">
                Thank you for reaching out. Our team will get back to you soon.
              </p>
            </div>
          </div>
        )}

        {messageState === "error" && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Error!</p>
              <p className="text-sm text-red-800">
                Failed to send message. Please try again.
              </p>
            </div>
          </div>
        )}

        {messageState === "form" || messageState === "sending" ? (
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={contactForm.name}
                  onChange={handleInputChange}
                  disabled={messageState === "sending"}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Your Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={contactForm.email}
                  onChange={handleInputChange}
                  disabled={messageState === "sending"}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="subject"
                placeholder="How can we help?"
                value={contactForm.subject}
                onChange={handleInputChange}
                disabled={messageState === "sending"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="message"
                placeholder="Tell us more about your inquiry..."
                rows={5}
                value={contactForm.message}
                onChange={handleInputChange}
                disabled={messageState === "sending"}
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={messageState === "sending"}
            >
              {messageState === "sending" ? "Sending..." : "Send Message"}
            </Button>
          </form>
        ) : null}
      </Card>

      {/* Quick Tips */}
      <Card className="p-4 rounded-lg border-2 border-border hover:border-primary/50 hover:bg-muted/30 transition-all">
        <p className="text-sm text-foreground flex items-start gap-2">
          <span className="font-semibold">💡 Tip:</span>
          <span>
            Click the copy icon next to any email or phone to copy it to your clipboard!
          </span>
        </p>
      </Card>
    </div>
  );
}
