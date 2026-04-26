import { useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function FacultyRegister() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    department: "",
    contactNumber: "",
    password: "",
  });
  const [idProof, setIdProof] = useState<File | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProof) {
      toast({ title: "Missing file", description: "Please upload ID proof", variant: "destructive" });
      return;
    }

    try {
      setIsLoading(true);
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));
      payload.append("idProof", idProof);

      const response = await fetch("/api/faculty/register", {
        method: "POST",
        body: payload,
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Registration failed");

      toast({
        title: "Registration submitted",
        description: "Your faculty account is pending admin approval.",
      });
      setLocation("/faculty/login");
    } catch (error: any) {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4">
      <Card className="w-full max-w-2xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Faculty Registration</h1>
          <p className="text-sm text-muted-foreground">Submit your details for admin approval.</p>
        </div>

        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={onSubmit}>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" required value={formData.fullName} onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" required value={formData.department} onChange={(e) => setFormData((p) => ({ ...p, department: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number</Label>
            <Input id="contactNumber" required value={formData.contactNumber} onChange={(e) => setFormData((p) => ({ ...p, contactNumber: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={formData.password} onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="idProof">ID Proof (PDF/Image)</Label>
            <Input id="idProof" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" required onChange={(e) => setIdProof(e.target.files?.[0] || null)} />
          </div>
          <div className="md:col-span-2">
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Submitting..." : "Register Faculty"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
