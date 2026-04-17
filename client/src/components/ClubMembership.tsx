import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, CheckCircle2, Clock } from "lucide-react";

interface ClubMembershipProps {
  clubName: string;
  description?: string;
  memberCount?: number;
  joinFee?: number;
  joinStatusLabel?: string;
  joinStatusTone?: "default" | "secondary" | "destructive" | "outline";
  statusNote?: string;
  requirements?: string[];
  benefits?: string[];
}

export default function ClubMembership({
  clubName,
  description,
  memberCount = 120,
  joinFee = 0,
  joinStatusLabel = "Open for Registration",
  joinStatusTone = "default",
  statusNote,
  requirements = [
    "Must be a current student",
    "Valid student ID required",
    "Minimum attendance of 70% in events",
  ],
  benefits = [
    "Exclusive access to member-only events",
    "Networking opportunities with industry experts",
    "Certificate of participation",
    "Priority access to workshops and seminars",
    "Recognition in club newsletter",
  ],
}: ClubMembershipProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <Card className="p-6 border-l-4 border-l-primary">
          <h3 className="text-lg font-bold mb-3">About {clubName}</h3>
          <p className="text-foreground leading-relaxed">{description}</p>
        </Card>
      )}

      {/* Overview */}
      <Card className="p-6 border-2 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="flex items-center gap-4">
            <Users className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold">{memberCount}+</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <DollarSign className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Membership Fee</p>
              <p className="text-2xl font-bold">
                {joinFee === 0 ? "Free" : `₹${joinFee}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Clock className="w-8 h-8 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm text-muted-foreground">Join Status</p>
              <Badge variant={joinStatusTone} className="mt-1">{joinStatusLabel}</Badge>
              {statusNote ? (
                <p className="mt-1 text-xs text-muted-foreground">{statusNote}</p>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      {/* Requirements */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">How to Join</h3>
        <div className="space-y-3">
          {requirements.map((requirement, index) => (
            <div key={index} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-foreground">{requirement}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Benefits */}
      <Card className="p-6">
        <h3 className="text-xl font-bold mb-4">Member Benefits</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{benefit}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
