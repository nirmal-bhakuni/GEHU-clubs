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
  clubId?: string;
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
  clubId,
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
    enrollmentNumber: "",
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
      !contactForm.enrollmentNumber ||
      !contactForm.subject ||
      !contactForm.message
    ) {
      alert("Please fill in all fields");
      return;
    }

    if (!clubId) {
      alert("Club ID is required");
      return;
    }

    setMessageState("sending");

    try {
      const response = await fetch(`/api/clubs/${clubId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderName: contactForm.name,
          senderEmail: contactForm.email,
          enrollmentNumber: contactForm.enrollmentNumber,
          subject: contactForm.subject,
          message: contactForm.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setMessageState("success");
      setContactForm({
        name: "",
        email: "",
        enrollmentNumber: "",
        subject: "",
        message: "",
      });

      setTimeout(() => {
        setMessageState("form");
      }, 3000);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessageState("error");
      setTimeout(() => {
        setMessageState("form");
      }, 3000);
    }
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
                Enrollment Number <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="enrollmentNumber"
                placeholder="GEHU/2021/001"
                value={contactForm.enrollmentNumber}
                onChange={handleInputChange}
                disabled={messageState === "sending"}
              />
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
